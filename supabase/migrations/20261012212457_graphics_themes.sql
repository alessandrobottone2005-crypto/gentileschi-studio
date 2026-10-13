BEGIN;
CREATE TABLE IF NOT EXISTS public.graphic_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  format TEXT NOT NULL CHECK (format IN ('portrait', 'square', 'story')),
  slides JSONB NOT NULL CHECK (jsonb_typeof(slides) = 'array' AND jsonb_array_length(slides) > 0),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS graphic_themes_updated_at ON public.graphic_themes(updated_at DESC);
ALTER TABLE public.graphic_themes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.graphic_themes FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.graphic_themes TO authenticated;
GRANT ALL ON public.graphic_themes TO service_role;
DROP POLICY IF EXISTS "Shared themes read" ON public.graphic_themes;
DROP POLICY IF EXISTS "Shared themes create" ON public.graphic_themes;
DROP POLICY IF EXISTS "Shared themes update" ON public.graphic_themes;
DROP POLICY IF EXISTS "Shared themes delete" ON public.graphic_themes;
CREATE POLICY "Shared themes read" ON public.graphic_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Shared themes create" ON public.graphic_themes FOR INSERT TO authenticated WITH CHECK (creator_id = (SELECT auth.uid()));
CREATE POLICY "Shared themes update" ON public.graphic_themes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Shared themes delete" ON public.graphic_themes FOR DELETE TO authenticated USING (true);
CREATE OR REPLACE FUNCTION public.protect_theme_identity()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
    NEW.id IS DISTINCT FROM OLD.id OR NEW.creator_id IS DISTINCT FROM OLD.creator_id OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN RAISE EXCEPTION 'Il creatore e l’identità del tema non possono essere modificati' USING ERRCODE = '42501'; END IF;
  IF NEW.creator_id IS NOT DISTINCT FROM OLD.creator_id AND NEW.revision != OLD.revision + 1 THEN
    RAISE EXCEPTION 'Revisione del tema non valida' USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_theme_identity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS graphic_theme_identity ON public.graphic_themes;
CREATE TRIGGER graphic_theme_identity BEFORE UPDATE ON public.graphic_themes FOR EACH ROW EXECUTE FUNCTION public.protect_theme_identity();
NOTIFY pgrst, 'reload schema';
COMMIT;
