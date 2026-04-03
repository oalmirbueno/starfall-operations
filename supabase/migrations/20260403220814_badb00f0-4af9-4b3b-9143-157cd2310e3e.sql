ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.credentials
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS infrastructure_asset_id UUID REFERENCES public.infrastructure_assets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_id ON public.subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON public.subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_credentials_provider_id ON public.credentials(provider_id);
CREATE INDEX IF NOT EXISTS idx_credentials_account_id ON public.credentials(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_infrastructure_asset_id ON public.alerts(infrastructure_asset_id);