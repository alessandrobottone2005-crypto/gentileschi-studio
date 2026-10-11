-- Gentileschi Studio: tutti gli account autenticati condividono i progetti e i media.
-- Eseguire in Supabase SQL Editor prima di abilitare la modalità cloud.

CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('single', 'carousel')),
    slides JSONB NOT NULL DEFAULT '[]'::jsonb,
    caption TEXT DEFAULT '',
    revision INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;
-- Existing installations used ON DELETE CASCADE; shared projects must survive account removal.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;

DROP POLICY IF EXISTS "Gli utenti possono leggere i propri progetti" ON public.projects;
DROP POLICY IF EXISTS "Gli utenti possono inserire i propri progetti" ON public.projects;
DROP POLICY IF EXISTS "Gli utenti possono aggiornare i propri progetti" ON public.projects;
DROP POLICY IF EXISTS "Gli utenti possono eliminare i propri progetti" ON public.projects;
DROP POLICY IF EXISTS "Shared projects select" ON public.projects;
DROP POLICY IF EXISTS "Shared projects insert" ON public.projects;
DROP POLICY IF EXISTS "Shared projects update" ON public.projects;
DROP POLICY IF EXISTS "Shared projects delete" ON public.projects;

CREATE POLICY "Shared projects select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Shared projects insert" ON public.projects FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Shared projects update" ON public.projects FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "Shared projects delete" ON public.projects FOR DELETE TO authenticated USING (true);

-- Public URLs bypass read policies. Existing installations must also switch the bucket to private.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gentileschi-media', 'gentileschi-media', false, 10485760,
        ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Media pubblici in lettura" ON storage.objects;
DROP POLICY IF EXISTS "Utenti autenticati possono caricare media" ON storage.objects;
DROP POLICY IF EXISTS "Shared media select" ON storage.objects;
DROP POLICY IF EXISTS "Shared media insert" ON storage.objects;
DROP POLICY IF EXISTS "Shared media update" ON storage.objects;
DROP POLICY IF EXISTS "Shared media delete" ON storage.objects;

CREATE POLICY "Shared media select" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'gentileschi-media');
CREATE POLICY "Shared media insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'gentileschi-media' AND lower(storage.extension(name)) IN ('png', 'jpg', 'webp'));
CREATE POLICY "Shared media update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'gentileschi-media')
    WITH CHECK (bucket_id = 'gentileschi-media');
CREATE POLICY "Shared media delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'gentileschi-media');

-- Server-only, atomic quota for the public-signup AI feature.
CREATE TABLE IF NOT EXISTS public.ai_usage (
    day DATE NOT NULL,
    quota_key TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, quota_key)
);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(
    p_user_id UUID,
    p_user_limit INTEGER,
    p_global_limit INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    today DATE := (now() AT TIME ZONE 'UTC')::date;
    user_key TEXT := 'user:' || p_user_id::text;
    user_used INTEGER;
    global_used INTEGER;
BEGIN
    IF p_user_id IS NULL OR p_user_limit < 1 OR p_global_limit < 1 THEN
        RETURN false;
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext('gentileschi-ai-' || today::text));
    SELECT used INTO user_used FROM public.ai_usage WHERE day = today AND quota_key = user_key;
    SELECT used INTO global_used FROM public.ai_usage WHERE day = today AND quota_key = 'global';
    IF coalesce(user_used, 0) >= p_user_limit OR coalesce(global_used, 0) >= p_global_limit THEN
        RETURN false;
    END IF;
    INSERT INTO public.ai_usage (day, quota_key, used) VALUES (today, user_key, 1)
        ON CONFLICT (day, quota_key) DO UPDATE SET used = public.ai_usage.used + 1;
    INSERT INTO public.ai_usage (day, quota_key, used) VALUES (today, 'global', 1)
        ON CONFLICT (day, quota_key) DO UPDATE SET used = public.ai_usage.used + 1;
    RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_quota(UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(UUID, INTEGER, INTEGER) TO service_role;
