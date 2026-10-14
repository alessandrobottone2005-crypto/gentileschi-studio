-- Durable 24-hour cache and atomic shared request limit; server access only.
CREATE TABLE public.pixabay_search_cache (
  key text PRIMARY KEY,
  response jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);
ALTER TABLE public.pixabay_search_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pixabay_search_cache FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pixabay_search_cache TO service_role;
CREATE TABLE public.pixabay_request_windows (
  minute timestamptz PRIMARY KEY,
  requests integer NOT NULL CHECK (requests > 0)
);
ALTER TABLE public.pixabay_request_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pixabay_request_windows FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.pixabay_request_windows TO service_role;
CREATE FUNCTION public.consume_pixabay_request() RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE accepted integer;
BEGIN
  DELETE FROM public.pixabay_request_windows WHERE minute < now() - interval '2 minutes';
  DELETE FROM public.pixabay_search_cache WHERE expires_at < now();
  INSERT INTO public.pixabay_request_windows(minute, requests)
  VALUES(date_trunc('minute', now()), 1)
  ON CONFLICT (minute) DO UPDATE SET requests = public.pixabay_request_windows.requests + 1
  WHERE public.pixabay_request_windows.requests < 45
  RETURNING requests INTO accepted;
  RETURN accepted IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_pixabay_request() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_pixabay_request() TO service_role;

-- Preserve provenance when an imported photograph is reused from the shared library.
DROP FUNCTION public.studio_media();
CREATE FUNCTION public.studio_media()
RETURNS TABLE (id uuid, name text, owner_id text, size bigint, mime_type text,
  original_name text, created_at timestamptz, source jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT o.id, o.name, o.owner_id,
    coalesce((o.metadata->>'size')::bigint, 0), o.metadata->>'mimetype',
    o.user_metadata->>'originalName', o.created_at, o.user_metadata->'source'
  FROM storage.objects o
  WHERE o.bucket_id = 'gentileschi-media' AND auth.uid() IS NOT NULL
  ORDER BY o.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.studio_media() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.studio_media() TO authenticated;
