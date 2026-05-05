CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  category TEXT,
  content TEXT,
  url TEXT,
  file_path TEXT,
  file_name TEXT,
  file_mime TEXT,
  file_size BIGINT,
  tags TEXT[] DEFAULT '{}'::text[],
  company_id UUID,
  project_id UUID,
  change_note TEXT,
  author_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own document versions"
  ON public.document_versions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own document versions"
  ON public.document_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own document versions"
  ON public.document_versions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_document_versions_document ON public.document_versions(document_id, version_number DESC);
CREATE INDEX idx_document_versions_user ON public.document_versions(user_id);