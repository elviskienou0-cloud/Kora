-- Manager plan helper RPCs must fail closed for suspended or non-manager users.
CREATE OR REPLACE FUNCTION public.ensure_my_manager_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions%rowtype;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Connexion requise.'; END IF;
  IF public.get_my_role() IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'Cette fonctionnalité est réservée aux managers actifs.';
  END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = v_user_id ORDER BY created_at DESC LIMIT 1;

  IF v_subscription.id IS NOT NULL
     AND v_subscription.current_period_end <= now()
     AND v_subscription.status IN ('trialing', 'active') THEN
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = now()
    WHERE id = v_subscription.id
    RETURNING * INTO v_subscription;
  END IF;

  IF v_subscription.id IS NULL THEN
    INSERT INTO public.subscriptions (
      user_id, plan_id, status, starts_at, ends_at,
      trial_start, trial_end, current_period_start, current_period_end,
      provider, created_at, updated_at
    )
    VALUES (
      v_user_id, 'FREE', 'trialing', now(), now() + interval '30 days',
      now(), now() + interval '30 days', now(), now() + interval '30 days',
      'kora', now(), now()
    )
    RETURNING * INTO v_subscription;
  END IF;
  RETURN v_subscription;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_manager_plan_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_plan_id text;
  v_active boolean := false;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Connexion requise' USING errcode = '42501'; END IF;
  IF public.get_my_role() IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'Compte manager actif requis' USING errcode = '42501';
  END IF;

  v_sub := public.ensure_my_manager_subscription();
  v_plan_id := upper(coalesce(v_sub.plan_id, v_sub.plan, 'FREE'));
  v_active := v_sub.status IN ('trialing', 'active')
    AND (v_sub.current_period_end IS NULL OR v_sub.current_period_end > now());

  SELECT * INTO v_plan FROM public.plans
  WHERE id = v_plan_id AND is_active = true LIMIT 1;

  IF v_plan.id IS NULL THEN
    v_plan_id := 'FREE';
    SELECT * INTO v_plan FROM public.plans
    WHERE id = 'FREE' AND is_active = true LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'plan_id', v_plan_id,
    'plan_name', coalesce(v_plan.name, 'Gratuit'),
    'status', coalesce(v_sub.status, 'expired'),
    'active', v_active,
    'talent_limit', v_plan.talent_limit,
    'features', coalesce(v_plan.features, '[]'::jsonb),
    'can_manage_projects', v_active,
    'business_badge', false
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.manager_can_add_talent()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR public.get_my_role() IS DISTINCT FROM 'manager' THEN
    RETURN false;
  END IF;
  v_sub := public.ensure_subscription_for_user(auth.uid());
  IF v_sub.status NOT IN ('trialing', 'active') THEN RETURN false; END IF;
  IF v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end <= now() THEN RETURN false; END IF;
  SELECT * INTO v_plan FROM public.plans WHERE id = v_sub.plan_id AND is_active = true;
  IF v_plan.id IS NULL THEN RETURN false; END IF;
  IF v_plan.talent_limit IS NULL THEN RETURN true; END IF;
  SELECT count(*) INTO v_count FROM public.talent_profiles WHERE managed_by = auth.uid();
  RETURN v_count < v_plan.talent_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.manager_has_feature(p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_enabled boolean := false;
BEGIN
  IF auth.uid() IS NULL
     OR public.get_my_role() IS DISTINCT FROM 'manager'
     OR nullif(trim(coalesce(p_feature, '')), '') IS NULL THEN
    RETURN false;
  END IF;
  v_sub := public.ensure_subscription_for_user(auth.uid());
  IF v_sub.status NOT IN ('trialing', 'active') THEN RETURN false; END IF;
  IF v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end <= now() THEN RETURN false; END IF;
  SELECT * INTO v_plan FROM public.plans WHERE id = v_sub.plan_id AND is_active = true;
  IF v_plan.id IS NULL THEN RETURN false; END IF;
  v_enabled := coalesce((v_plan.features ->> p_feature)::boolean, false);
  RETURN v_enabled;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_free_plan()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_subscription public.subscriptions%rowtype;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Connexion requise.'; END IF;
  v_role := public.get_my_role();
  IF v_role IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'Cette fonctionnalité est réservée aux managers actifs.';
  END IF;

  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE user_id = v_user_id ORDER BY created_at DESC LIMIT 1;

  IF v_subscription.plan_id = 'FREE'
     AND v_subscription.current_period_end > now()
     AND v_subscription.status IN ('trialing', 'active') THEN
    RETURN v_subscription;
  END IF;
  IF v_subscription.plan_id IN ('PRO', 'BUSINESS')
     AND v_subscription.status IN ('active', 'trialing')
     AND v_subscription.current_period_end > now() THEN
    RAISE EXCEPTION 'Vous avez déjà un abonnement payant actif.';
  END IF;
  IF v_subscription.plan_id = 'FREE' AND v_subscription.current_period_end <= now() THEN
    RAISE EXCEPTION 'Votre période gratuite est terminée. Choisissez Pro ou Business.';
  END IF;
  RAISE EXCEPTION 'Le forfait Gratuit ne peut pas être réactivé.';
END;
$function$;
