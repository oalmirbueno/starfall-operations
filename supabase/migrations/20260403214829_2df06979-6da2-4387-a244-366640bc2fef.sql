
-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account TEXT,
  plan TEXT,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  cycle TEXT NOT NULL DEFAULT 'mensal' CHECK (cycle IN ('mensal', 'anual', 'trimestral')),
  next_renewal DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'cancelado', 'expirado')),
  responsible TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vencimento', 'custo_alto', 'sem_responsavel', 'auto_renew_off', 'expiracao')),
  urgency TEXT NOT NULL CHECK (urgency IN ('critico', 'alto', 'medio', 'baixo')),
  days_until INTEGER,
  description TEXT NOT NULL,
  alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  notify_channels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alerts" ON public.alerts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification queue (prepared for email/telegram)
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram', 'webhook')),
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notification_queue
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications" ON public.notification_queue
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Function to compute alerts from subscriptions
CREATE OR REPLACE FUNCTION public.compute_alerts(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sub RECORD;
  days_left INTEGER;
  avg_cost NUMERIC;
BEGIN
  -- Clear unresolved auto-generated alerts for this user
  DELETE FROM public.alerts WHERE user_id = p_user_id AND resolved = false;

  -- Get average cost for this user's subscriptions
  SELECT COALESCE(AVG(value), 0) INTO avg_cost
  FROM public.subscriptions WHERE user_id = p_user_id AND status = 'ativo';

  FOR sub IN SELECT * FROM public.subscriptions WHERE user_id = p_user_id AND status IN ('ativo', 'pendente')
  LOOP
    -- Renewal alerts
    IF sub.next_renewal IS NOT NULL THEN
      days_left := sub.next_renewal - CURRENT_DATE;
      
      IF days_left <= 3 AND days_left >= 0 THEN
        INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
        VALUES (p_user_id, sub.id, sub.provider, 'vencimento', 'critico', days_left,
          'Renovação em ' || days_left || ' dias', sub.next_renewal);
      ELSIF days_left <= 7 THEN
        INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
        VALUES (p_user_id, sub.id, sub.provider, 'vencimento', 'alto', days_left,
          'Renovação em ' || days_left || ' dias', sub.next_renewal);
      ELSIF days_left <= 15 THEN
        INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
        VALUES (p_user_id, sub.id, sub.provider, 'vencimento', 'medio', days_left,
          'Renovação em ' || days_left || ' dias', sub.next_renewal);
      ELSIF days_left <= 30 THEN
        INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
        VALUES (p_user_id, sub.id, sub.provider, 'vencimento', 'baixo', days_left,
          'Renovação em ' || days_left || ' dias', sub.next_renewal);
      END IF;
    END IF;

    -- Auto-renew off
    IF sub.auto_renew = false THEN
      INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
      VALUES (p_user_id, sub.id, sub.provider, 'auto_renew_off', 
        CASE WHEN days_left <= 7 THEN 'alto' ELSE 'medio' END,
        days_left, 'Auto-renovação desligada — risco de perda de serviço', CURRENT_DATE);
    END IF;

    -- No responsible
    IF sub.responsible IS NULL OR TRIM(sub.responsible) = '' THEN
      INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
      VALUES (p_user_id, sub.id, sub.provider, 'sem_responsavel', 'critico',
        NULL, 'Sem responsável atribuído para a conta', CURRENT_DATE);
    END IF;

    -- Cost above average (>150%)
    IF avg_cost > 0 AND sub.value > avg_cost * 1.5 THEN
      INSERT INTO public.alerts (user_id, subscription_id, service, type, urgency, days_until, description, alert_date)
      VALUES (p_user_id, sub.id, sub.provider, 'custo_alto', 'alto',
        NULL, 'Custo ' || ROUND(((sub.value / avg_cost) - 1) * 100) || '% acima da média', CURRENT_DATE);
    END IF;
  END LOOP;
END;
$$;
