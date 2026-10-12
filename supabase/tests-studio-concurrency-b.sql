BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','5efa1b65-6895-426e-9fc1-77f0a8e15a53',true);
DO $$ BEGIN
  BEGIN
    PERFORM public.set_studio_role(auth.uid(),'editor');
    RAISE EXCEPTION 'Last admin demotion unexpectedly succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE '%almeno un amministratore%' THEN RAISE; END IF;
  END;
  IF clock_timestamp() - transaction_timestamp() < interval '2 seconds' THEN
    RAISE EXCEPTION 'Concurrent role call did not wait for the lock';
  END IF;
END $$;
ROLLBACK;
SELECT 'Second demotion serialized and rejected; admin preserved' AS verification;
