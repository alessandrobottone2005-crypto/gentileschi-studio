BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('gentileschi-studio-roles',0));
SELECT pg_sleep(15);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','5efa1b65-6895-426e-9fc1-77f0a8e15a53',true);
DO $$ BEGIN
  BEGIN
    PERFORM public.set_studio_role(auth.uid(),'editor');
    RAISE EXCEPTION 'Last admin demotion unexpectedly succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE '%almeno un amministratore%' THEN RAISE; END IF;
  END;
END $$;
ROLLBACK;
SELECT 'First concurrent demotion rejected' AS verification;
