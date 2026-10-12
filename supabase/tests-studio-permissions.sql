-- Run in SQL Editor as postgres. Every mutation is rolled back.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a3b94989-14fb-40d8-8c8c-d0f337adc3ca', true);
DO $$
DECLARE row_count INTEGER;
BEGIN
  SELECT count(*) INTO row_count FROM public.profiles;
  IF row_count <> 1 THEN RAISE EXCEPTION 'Editor can read other profiles'; END IF;
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
    RAISE EXCEPTION 'Editor can directly change role';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.set_studio_role(auth.uid(), 'admin');
    RAISE EXCEPTION 'Editor can promote themselves';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF (SELECT count(*) FROM public.studio_media()) < 1 THEN RAISE EXCEPTION 'Existing photograph unavailable'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub', '5efa1b65-6895-426e-9fc1-77f0a8e15a53', true);
DO $$
BEGIN
  IF NOT public.is_studio_admin() THEN RAISE EXCEPTION 'Google account is not administrator'; END IF;
  BEGIN
    PERFORM public.set_studio_role(auth.uid(), 'editor');
    RAISE EXCEPTION 'Last administrator was removed';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE '%almeno un amministratore%' THEN RAISE; END IF;
  END;
  PERFORM public.set_studio_role('a3b94989-14fb-40d8-8c8c-d0f337adc3ca', 'admin');
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'a3b94989-14fb-40d8-8c8c-d0f337adc3ca' AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin cannot change roles';
  END IF;
  PERFORM public.set_studio_role('a3b94989-14fb-40d8-8c8c-d0f337adc3ca', 'editor');
END;
$$;
ROLLBACK;
SELECT 'Account permissions verified; all test changes rolled back' AS verification;
