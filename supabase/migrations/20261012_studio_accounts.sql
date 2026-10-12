BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  google_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE OR REPLACE FUNCTION public.is_studio_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_studio_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_studio_admin() TO authenticated;

DROP POLICY IF EXISTS "Self and admin profile read" ON public.profiles;
CREATE POLICY "Self and admin profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_studio_admin());
DROP POLICY IF EXISTS "Self profile name update" ON public.profiles;
CREATE POLICY "Self profile name update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_auth_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  profile_name TEXT := left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(NEW.raw_user_meta_data->>'name'), ''), nullif(split_part(NEW.email, '@', 1), ''), 'Utente'), 80);
BEGIN
  INSERT INTO public.profiles (id, display_name, google_name, email, avatar_url, created_at)
  VALUES (NEW.id, profile_name, profile_name, coalesce(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url', NEW.created_at)
  ON CONFLICT (id) DO UPDATE SET google_name = EXCLUDED.google_name,
    email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_auth_profile() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS studio_profile_sync ON auth.users;
CREATE TRIGGER studio_profile_sync AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_profile();

INSERT INTO public.profiles (id, display_name, google_name, email, avatar_url, created_at)
SELECT id,
  left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'), ''), nullif(trim(raw_user_meta_data->>'name'), ''), nullif(split_part(email, '@', 1), ''), 'Utente'), 80),
  left(coalesce(nullif(trim(raw_user_meta_data->>'full_name'), ''), nullif(trim(raw_user_meta_data->>'name'), ''), nullif(split_part(email, '@', 1), ''), 'Utente'), 80),
  coalesce(email, ''), raw_user_meta_data->>'avatar_url', created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET google_name = EXCLUDED.google_name, email = EXCLUDED.email, avatar_url = EXCLUDED.avatar_url;

-- Bootstrap only the verified Google account, and only when no admin exists yet.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    UPDATE public.profiles SET role = 'admin'
    WHERE id = '5efa1b65-6895-426e-9fc1-77f0a8e15a53'
      AND email = 'alessandro.bottone.design@gmail.com'
      AND EXISTS (SELECT 1 FROM auth.identities WHERE user_id = public.profiles.id AND provider = 'google');
    IF NOT FOUND THEN RAISE EXCEPTION 'Account Google amministratore non verificato'; END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_studio_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE previous_role TEXT;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gentileschi-studio-roles', 0));
  IF auth.uid() IS NULL OR NOT public.is_studio_admin() THEN
    RAISE EXCEPTION 'Solo un amministratore può cambiare i ruoli' USING ERRCODE = '42501';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('admin', 'editor') THEN RAISE EXCEPTION 'Ruolo non valido'; END IF;
  SELECT role INTO previous_role FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Utente non trovato'; END IF;
  IF previous_role = 'admin' AND p_role = 'editor'
    AND (SELECT count(*) FROM public.profiles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Lo studio deve mantenere almeno un amministratore';
  END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_studio_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_studio_role(UUID, TEXT) TO authenticated;

-- Names for shared project attribution, without exposing the email directory.
CREATE OR REPLACE FUNCTION public.studio_authors()
RETURNS TABLE (id UUID, display_name TEXT, avatar_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.id, p.display_name, p.avatar_url FROM public.profiles p WHERE auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.studio_authors() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.studio_authors() TO authenticated;

-- Storage schema is read-only here; upload/download use the Storage API.
CREATE OR REPLACE FUNCTION public.studio_media()
RETURNS TABLE (id UUID, name TEXT, owner_id TEXT, size BIGINT, mime_type TEXT,
  original_name TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.id, o.name, o.owner_id,
    coalesce((o.metadata->>'size')::bigint, 0), o.metadata->>'mimetype',
    o.user_metadata->>'originalName', o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'gentileschi-media' AND auth.uid() IS NOT NULL
  ORDER BY o.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.studio_media() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.studio_media() TO authenticated;

-- Shared editing never changes the original creator or project identity.
CREATE OR REPLACE FUNCTION public.protect_project_attribution()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
     NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'Il creatore e l’identità del progetto non possono essere modificati' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_project_attribution() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_project_attribution ON public.projects;
CREATE TRIGGER protect_project_attribution BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.protect_project_attribution();

NOTIFY pgrst, 'reload schema';
COMMIT;
