-- Expired managers keep read-only access to KORA. Renewal, payment validation,
-- subscription visibility, and marketing-consent withdrawal remain available.
DO $$
DECLARE
  t record;
  c text;
  policy_name text;
  has_write_policy boolean;
  predicate text := '(public.is_admin() OR public.get_my_role() IS DISTINCT FROM ''manager'' OR public.manager_has_active_plan())';
BEGIN
  FOR t IN
    SELECT n.nspname AS schema_name, cls.relname AS table_name
    FROM pg_class cls
    JOIN pg_namespace n ON n.oid = cls.relnamespace
    WHERE n.nspname = 'public'
      AND cls.relkind IN ('r','p')
      AND cls.relrowsecurity
      AND cls.relname NOT IN ('payments','subscriptions','plans','user_consents')
  LOOP
    FOREACH c IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      SELECT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = t.schema_name
          AND p.tablename = t.table_name
          AND p.cmd IN (c, 'ALL')
          AND (p.roles = '{public}' OR p.roles @> ARRAY['authenticated']::name[])
      ) INTO has_write_policy;
      IF has_write_policy THEN
        policy_name := 'expired_manager_lock_' || c;
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_name, t.schema_name, t.table_name);
        IF c = 'INSERT' THEN
          EXECUTE format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK %s',
                         policy_name, t.schema_name, t.table_name, predicate);
        ELSIF c = 'UPDATE' THEN
          EXECUTE format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING %s WITH CHECK %s',
                         policy_name, t.schema_name, t.table_name, predicate, predicate);
        ELSE
          EXECUTE format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR DELETE TO authenticated USING %s',
                         policy_name, t.schema_name, t.table_name, predicate);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Also block manager writes to every Storage bucket while expired, including
-- profile images and portfolio media. Existing ownership/admin policies still apply.
DO $$
DECLARE
  c text;
  has_write_policy boolean;
  policy_name text;
  predicate text := '(public.is_admin() OR public.get_my_role() IS DISTINCT FROM ''manager'' OR public.manager_has_active_plan())';
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RETURN;
  END IF;
  FOREACH c IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'storage'
        AND p.tablename = 'objects'
        AND p.cmd IN (c, 'ALL')
        AND (p.roles = '{public}' OR p.roles @> ARRAY['authenticated']::name[])
    ) INTO has_write_policy;
    IF has_write_policy THEN
      policy_name := 'expired_manager_lock_' || c;
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
      IF c = 'INSERT' THEN
        EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK %s',
                       policy_name, predicate);
      ELSIF c = 'UPDATE' THEN
        EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING %s WITH CHECK %s',
                       policy_name, predicate, predicate);
      ELSE
        EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING %s',
                       policy_name, predicate);
      END IF;
    END IF;
  END LOOP;
END $$;