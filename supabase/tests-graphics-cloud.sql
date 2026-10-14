-- Run as postgres on this installation. All test changes are rolled back.
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM auth.users WHERE id IN (
    '5efa1b65-6895-426e-9fc1-77f0a8e15a53',
    'a3b94989-14fb-40d8-8c8c-d0f337adc3ca'
  )) <> 2 THEN RAISE EXCEPTION 'The two existing test accounts are required'; END IF;
END;
$$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '5efa1b65-6895-426e-9fc1-77f0a8e15a53', true);
INSERT INTO public.graphic_themes (id,name,creator_id,format,slides)
VALUES ('cloud-check-theme-20261013','Verifica temporanea',auth.uid(),'portrait','[{"content":{"title":"Originale"}}]');
INSERT INTO public.projects (id,user_id,title,type,slides)
SELECT 'cloud-check-project-20261013',auth.uid(),'Verifica temporanea','single',slides
FROM public.graphic_themes WHERE id='cloud-check-theme-20261013';
SELECT set_config('request.jwt.claim.sub', 'a3b94989-14fb-40d8-8c8c-d0f337adc3ca', true);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.graphic_themes WHERE id='cloud-check-theme-20261013') THEN
    RAISE EXCEPTION 'The second account cannot read the shared theme';
  END IF;
  BEGIN
    INSERT INTO public.graphic_themes(id,name,creator_id,format,slides)
    VALUES ('cloud-check-forged-20261013','Invalid creator','5efa1b65-6895-426e-9fc1-77f0a8e15a53','portrait','[{}]');
    RAISE EXCEPTION 'Forged attribution was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.graphic_themes SET creator_id=auth.uid(),revision=2 WHERE id='cloud-check-theme-20261013';
    RAISE EXCEPTION 'Creator identity could be changed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.graphic_themes SET name='Invalid revision' WHERE id='cloud-check-theme-20261013';
    RAISE EXCEPTION 'Revision progression was not enforced';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM 1 FROM public.pixabay_search_cache;
    RAISE EXCEPTION 'Private provider cache was exposed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.consume_pixabay_request();
    RAISE EXCEPTION 'Provider quota was exposed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF NOT EXISTS (SELECT 1 FROM public.studio_media()) THEN
    RAISE EXCEPTION 'Shared media is unavailable to the second account';
  END IF;
END;
$$;
UPDATE public.graphic_themes SET name='Updated by second account',slides='[{"content":{"title":"Modificato"}}]',revision=2
WHERE id='cloud-check-theme-20261013' AND revision=1;
SELECT set_config('request.jwt.claim.sub', '5efa1b65-6895-426e-9fc1-77f0a8e15a53', true);
DO $$
DECLARE changed integer;
BEGIN
  UPDATE public.graphic_themes SET name='Stale update',revision=2
  WHERE id='cloud-check-theme-20261013' AND revision=1;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Stale revision overwrote a newer theme'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub', 'a3b94989-14fb-40d8-8c8c-d0f337adc3ca', true);
DELETE FROM public.graphic_themes WHERE id='cloud-check-theme-20261013' AND revision=2;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.graphic_themes WHERE id='cloud-check-theme-20261013') THEN
    RAISE EXCEPTION 'The second account cannot delete a shared theme';
  END IF;
  IF (SELECT slides->0->'content'->>'title' FROM public.projects WHERE id='cloud-check-project-20261013') IS DISTINCT FROM 'Originale' THEN
    RAISE EXCEPTION 'A theme update or deletion changed an existing project';
  END IF;
END;
$$;
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM 1 FROM public.graphic_themes;
    RAISE EXCEPTION 'Anonymous theme access was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM 1 FROM public.pixabay_search_cache;
    RAISE EXCEPTION 'Anonymous cache access was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;
ROLLBACK;
SELECT 'Permessi con due account, revisioni e indipendenza dei progetti verificati; prove annullate' AS esito;
