-- Remove incorrectly permissive expired-manager guard policies.
-- PostgreSQL combines permissive RLS policies with OR. These policies therefore
-- granted non-manager authenticated users broad write access instead of
-- restricting expired managers. Existing ownership/role policies and the
-- reject_expired_manager_writes triggers remain in place.
DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND policyname LIKE 'expired_manager_lock_%'
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  END LOOP;
END
$$;
