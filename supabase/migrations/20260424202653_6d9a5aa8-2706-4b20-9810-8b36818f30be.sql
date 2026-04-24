CREATE TABLE public.useful_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  link_type TEXT NOT NULL DEFAULT 'site',
  category TEXT,
  favorite BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.useful_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own useful links"
  ON public.useful_links
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_useful_links_updated_at
  BEFORE UPDATE ON public.useful_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_useful_links_user ON public.useful_links(user_id);
CREATE INDEX idx_useful_links_type ON public.useful_links(user_id, link_type);