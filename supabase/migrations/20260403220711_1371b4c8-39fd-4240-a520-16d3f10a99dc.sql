CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'saas',
  website TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT providers_name_user_unique UNIQUE (user_id, name)
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own providers"
ON public.providers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  external_id TEXT,
  contact_email TEXT,
  responsible TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own accounts"
ON public.accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.infrastructure_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  region TEXT,
  ip_address TEXT,
  renewal_date DATE,
  monthly_cost NUMERIC NOT NULL DEFAULT 0,
  usage_summary TEXT,
  responsible TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.infrastructure_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own infrastructure assets"
ON public.infrastructure_assets
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  infrastructure_asset_id UUID REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  reference TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_type TEXT NOT NULL DEFAULT 'recurring',
  status TEXT NOT NULL DEFAULT 'open',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT billing_events_target_check CHECK (
    subscription_id IS NOT NULL OR infrastructure_asset_id IS NOT NULL OR provider_id IS NOT NULL OR account_id IS NOT NULL
  )
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own billing events"
ON public.billing_events
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  infrastructure_asset_id UUID REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_unit TEXT,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  usage_period_start DATE,
  usage_period_end DATE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usage_records_target_check CHECK (
    subscription_id IS NOT NULL OR infrastructure_asset_id IS NOT NULL
  )
);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own usage records"
ON public.usage_records
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  tool TEXT,
  category TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'a_avaliar',
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  expected_benefit TEXT,
  priority TEXT NOT NULL DEFAULT 'media',
  notes TEXT,
  responsible TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own opportunities"
ON public.opportunities
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT,
  kind TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_slug_user_unique UNIQUE (user_id, slug, kind)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories"
ON public.categories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tags_slug_user_unique UNIQUE (user_id, slug)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tags"
ON public.tags
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  infrastructure_asset_id UUID REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entity_tags_target_check CHECK (
    (CASE WHEN subscription_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN infrastructure_asset_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN opportunity_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own entity tags"
ON public.entity_tags
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alerts_subscription_id_fkey'
  ) THEN
    ALTER TABLE public.alerts
      ADD CONSTRAINT alerts_subscription_id_fkey
      FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_id ON public.accounts(provider_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_user_id ON public.infrastructure_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_provider_id ON public.infrastructure_assets(provider_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_account_id ON public.infrastructure_assets(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON public.billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_subscription_id ON public.billing_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_infra_id ON public.billing_events(infrastructure_asset_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON public.usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_id ON public.usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_infra_id ON public.usage_records(infrastructure_asset_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id_kind ON public.categories(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_user_id ON public.entity_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag_id ON public.entity_tags(tag_id);

DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_infrastructure_assets_updated_at ON public.infrastructure_assets;
CREATE TRIGGER update_infrastructure_assets_updated_at
BEFORE UPDATE ON public.infrastructure_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_events_updated_at ON public.billing_events;
CREATE TRIGGER update_billing_events_updated_at
BEFORE UPDATE ON public.billing_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON public.opportunities;
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_monthly_cost_trend(p_user_id uuid)
RETURNS TABLE(month text, total numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', current_date) - interval '5 months',
      date_trunc('month', current_date),
      interval '1 month'
    )::date AS month_start
  ),
  sub_totals AS (
    SELECT m.month_start,
      COALESCE(SUM(
        CASE s.cycle
          WHEN 'anual' THEN s.value / 12
          WHEN 'trimestral' THEN s.value / 3
          ELSE s.value
        END
      ), 0) AS total
    FROM months m
    LEFT JOIN public.subscriptions s
      ON s.user_id = p_user_id
      AND s.status IN ('ativo', 'pendente')
    GROUP BY m.month_start
  ),
  infra_totals AS (
    SELECT m.month_start,
      COALESCE(SUM(i.monthly_cost), 0) AS total
    FROM months m
    LEFT JOIN public.infrastructure_assets i
      ON i.user_id = p_user_id
      AND i.status <> 'decommissioned'
    GROUP BY m.month_start
  )
  SELECT to_char(m.month_start, 'Mon') AS month,
         ROUND((s.total + i.total)::numeric, 2) AS total
  FROM months m
  JOIN sub_totals s USING (month_start)
  JOIN infra_totals i USING (month_start)
  ORDER BY m.month_start;
$$;

CREATE OR REPLACE FUNCTION public.get_category_cost_breakdown(p_user_id uuid)
RETURNS TABLE(name text, value numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH subscription_costs AS (
    SELECT COALESCE(NULLIF(category, ''), 'Sem categoria') AS name,
      SUM(
        CASE cycle
          WHEN 'anual' THEN value / 12
          WHEN 'trimestral' THEN value / 3
          ELSE value
        END
      )::numeric AS value
    FROM public.subscriptions
    WHERE user_id = p_user_id AND status IN ('ativo', 'pendente')
    GROUP BY 1
  ),
  infrastructure_costs AS (
    SELECT 'Infraestrutura'::text AS name,
      COALESCE(SUM(monthly_cost), 0)::numeric AS value
    FROM public.infrastructure_assets
    WHERE user_id = p_user_id AND status <> 'decommissioned'
  )
  SELECT name, ROUND(SUM(value), 2) AS value
  FROM (
    SELECT * FROM subscription_costs
    UNION ALL
    SELECT * FROM infrastructure_costs
  ) grouped
  GROUP BY name
  HAVING SUM(value) > 0
  ORDER BY SUM(value) DESC;
$$;