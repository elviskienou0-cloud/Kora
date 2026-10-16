-- Defense in depth: RLS policies do not constrain SECURITY DEFINER RPCs.
-- A trigger on application tables also rejects writes initiated through those RPCs
-- when the authenticated actor is an expired manager.
CREATE OR REPLACE FUNCTION public.reject_expired_manager_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actor_id uuid;
  actor_role text;
BEGIN
  actor_id := auth.uid();

  -- Service-side jobs/webhooks have no end-user JWT and are not treated as a manager.
  IF actor_id IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  actor_role := public.get_my_role();

  IF actor_role = 'manager'
     AND NOT public.is_admin()
     AND NOT public.manager_has_active_plan() THEN
    RAISE EXCEPTION 'SUBSCRIPTION_EXPIRED: manager account is read-only until renewal'
      USING ERRCODE = '42501';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_expired_manager_writes() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND c.relname NOT IN ('payments','subscriptions','plans','user_consents')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS reject_expired_manager_writes ON %I.%I', t.schema_name, t.table_name);
    EXECUTE format(
      'CREATE TRIGGER reject_expired_manager_writes BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.reject_expired_manager_writes()',
      t.schema_name, t.table_name
    );
  END LOOP;
END $$;