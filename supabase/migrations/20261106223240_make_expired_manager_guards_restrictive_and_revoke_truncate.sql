-- KORA: make manager-expiration guards restrictive and remove client TRUNCATE.
-- PostgreSQL combines permissive policies with OR; global guards must be restrictive.
DO $migration$
DECLARE
  v_policy record;
  v_roles text;
  v_sql text;
BEGIN
  FOR v_policy IN
    SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND policyname LIKE 'expired_manager_lock_%'
  LOOP
    SELECT string_agg(format('%I', role_name), ', ')
      INTO v_roles
    FROM unnest(v_policy.roles) AS role_name;

    EXECUTE format('DROP POLICY %I ON %I.%I',
      v_policy.policyname,v_policy.schemaname,v_policy.tablename);

    v_sql := format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO %s',
      v_policy.policyname,v_policy.schemaname,v_policy.tablename,
      v_policy.cmd,v_roles);

    IF v_policy.qual IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)',v_policy.qual);
    END IF;
    IF v_policy.with_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)',v_policy.with_check);
    END IF;

    EXECUTE v_sql;
  END LOOP;
END;
$migration$;

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
