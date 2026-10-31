CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE,
  student_name text NOT NULL,
  student_id text NOT NULL,
  course text NOT NULL,
  duration text NOT NULL,
  grade text NOT NULL,
  centre text NOT NULL,
  awarded_on text NOT NULL,
  status text NOT NULL DEFAULT 'valid',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.certificates TO anon;
GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificates are publicly readable"
  ON public.certificates FOR SELECT USING (true);

CREATE POLICY "Anyone can create certificates"
  ON public.certificates FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update certificate status"
  ON public.certificates FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX certificates_created_at_idx ON public.certificates (created_at DESC);