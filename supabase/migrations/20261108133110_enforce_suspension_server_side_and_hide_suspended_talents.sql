-- Server-enforced suspension. Suspended users retain read access to their own
-- records and can revoke marketing consent / mark notifications as read, but
-- cannot perform writes or create new activity against suspended managers.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
    AND coalesce(is_suspended, false) = false
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.manager_has_active_plan()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
BEGIN
  IF v_user IS NULL OR public.get_my_role() <> 'manager' THEN
    RETURN false;
  END IF;
  v_sub := public.ensure_my_manager_subscription();
  RETURN v_sub.status IN ('trialing', 'active')
    AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now());
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_talent_public(p_talent_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.talent_profiles tp
    JOIN public.profiles manager_profile ON manager_profile.id = tp.managed_by
    WHERE tp.id = p_talent_id
      AND tp.status = 'published'
      AND tp.is_visible = true
      AND coalesce(manager_profile.is_suspended, false) = false
  );
$function$;
REVOKE ALL ON FUNCTION public.is_talent_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_talent_public(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_talent_manager_profile(p_talent_id uuid)
RETURNS TABLE(id uuid, name text, avatar text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.avatar, p.role
  FROM public.talent_profiles tp
  JOIN public.profiles p ON p.id = tp.managed_by
  WHERE tp.id = p_talent_id
    AND (
      public.is_talent_public(tp.id)
      OR tp.managed_by = auth.uid()
      OR public.is_admin()
    )
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.reject_suspended_user_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_suspended boolean := false;
  v_target_manager uuid;
  v_target_talent uuid;
  v_conversation_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  SELECT coalesce(p.is_suspended, false) INTO v_actor_suspended
  FROM public.profiles p WHERE p.id = v_actor;

  IF v_actor_suspended THEN
    RAISE EXCEPTION 'ACCOUNT_SUSPENDED: this account is read-only'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME IN ('projects', 'requests', 'kora_transactions') THEN
      v_target_manager := nullif(to_jsonb(NEW)->>'manager_id', '')::uuid;
    ELSIF TG_TABLE_NAME = 'conversations' THEN
      v_target_talent := nullif(to_jsonb(NEW)->>'talent_id', '')::uuid;
      IF v_target_talent IS NOT NULL THEN
        SELECT tp.managed_by INTO v_target_manager
        FROM public.talent_profiles tp WHERE tp.id = v_target_talent;
      END IF;
    ELSIF TG_TABLE_NAME = 'messages' THEN
      v_conversation_id := nullif(to_jsonb(NEW)->>'conversation_id', '')::uuid;
      IF v_conversation_id IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.conversation_participants cp
        JOIN public.profiles other_profile ON other_profile.id = cp.user_id
        WHERE cp.conversation_id = v_conversation_id
          AND cp.user_id <> v_actor
          AND coalesce(other_profile.is_suspended, false) = true
      ) THEN
        RAISE EXCEPTION 'RECIPIENT_SUSPENDED: messages cannot be sent to a suspended account'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF v_target_manager IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = v_target_manager AND coalesce(p.is_suspended, false) = true
    ) THEN
      RAISE EXCEPTION 'TARGET_MANAGER_SUSPENDED: this manager cannot receive new activity'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'requests' AND TG_OP = 'UPDATE'
     AND nullif(to_jsonb(NEW)->>'manager_id', '')::uuid = v_actor THEN
    IF public.get_my_role() <> 'manager' OR NOT public.manager_has_active_plan() THEN
      RAISE EXCEPTION 'MANAGER_ACCESS_REQUIRED: an active manager account is required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'reviews' AND TG_OP = 'INSERT'
     AND nullif(to_jsonb(NEW)->>'client_id', '')::uuid = v_actor
     AND public.get_my_role() <> 'client' THEN
    RAISE EXCEPTION 'CLIENT_ACCOUNT_REQUIRED: only clients can publish reviews'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.reject_suspended_user_writes() FROM PUBLIC, anon, authenticated, service_role;

DO $$
DECLARE table_row record;
BEGIN
  FOR table_row IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity = true
      AND c.relname NOT IN ('notifications','user_consents','subscription_notification_events')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_reject_suspended_user_writes ON public.%I', table_row.relname);
    EXECUTE format(
      'CREATE TRIGGER trg_reject_suspended_user_writes
       BEFORE INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.reject_suspended_user_writes()',
      table_row.relname
    );
  END LOOP;
END
$$;

DROP POLICY IF EXISTS talent_public_select_anon ON public.talent_profiles;
CREATE POLICY talent_public_select_anon ON public.talent_profiles FOR SELECT TO anon
USING (public.is_talent_public(id));

DROP POLICY IF EXISTS talent_authenticated_select ON public.talent_profiles;
CREATE POLICY talent_authenticated_select ON public.talent_profiles FOR SELECT TO authenticated
USING (
  public.is_talent_public(id)
  OR managed_by = auth.uid()
  OR is_super_admin()
  OR admin_has_permission('talents.read')
);

DROP POLICY IF EXISTS portfolio_public_select_anon ON public.portfolio_items;
CREATE POLICY portfolio_public_select_anon ON public.portfolio_items FOR SELECT TO anon
USING (public.is_talent_public(talent_id));

DROP POLICY IF EXISTS portfolio_public_select_authenticated ON public.portfolio_items;
CREATE POLICY portfolio_public_select_authenticated ON public.portfolio_items FOR SELECT TO authenticated
USING (
  public.is_talent_public(talent_id)
  OR EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = portfolio_items.talent_id AND tp.managed_by = auth.uid())
  OR is_admin()
);

DROP POLICY IF EXISTS talent_skills_public_select_anon ON public.talent_profile_skills;
CREATE POLICY talent_skills_public_select_anon ON public.talent_profile_skills FOR SELECT TO anon
USING (public.is_talent_public(talent_id));

DROP POLICY IF EXISTS talent_skills_public_select_authenticated ON public.talent_profile_skills;
CREATE POLICY talent_skills_public_select_authenticated ON public.talent_profile_skills FOR SELECT TO authenticated
USING (
  public.is_talent_public(talent_id)
  OR EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = talent_profile_skills.talent_id AND tp.managed_by = auth.uid())
  OR is_admin()
);

DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
CREATE POLICY reviews_public_read ON public.reviews FOR SELECT TO anon
USING (
  is_visible = true AND source = 'project_review'
  AND client_id IS NOT NULL AND talent_id IS NOT NULL AND project_id IS NOT NULL
  AND public.is_talent_public(talent_id)
);

DROP POLICY IF EXISTS reviews_authenticated_select ON public.reviews;
CREATE POLICY reviews_authenticated_select ON public.reviews FOR SELECT TO authenticated
USING (
  (
    is_visible = true AND source = 'project_review'
    AND client_id IS NOT NULL AND talent_id IS NOT NULL AND project_id IS NOT NULL
    AND public.is_talent_public(talent_id)
  )
  OR client_id = auth.uid()
  OR is_admin()
);

DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects FOR INSERT TO authenticated
WITH CHECK (client_id = auth.uid() AND public.get_my_role() = 'client');
