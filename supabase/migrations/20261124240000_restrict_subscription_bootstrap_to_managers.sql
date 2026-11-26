-- KORA-020: seuls les managers peuvent initialiser leur abonnement personnel.
-- Les administrateurs peuvent initialiser l'abonnement d'un autre utilisateur
-- uniquement via la permission subscriptions.manage.
CREATE OR REPLACE FUNCTION public.ensure_subscription_for_user(p_user_id uuid)
 RETURNS subscriptions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_subscription public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_created_at timestamptz := now();
  v_expiration timestamptz;
begin
  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if p_user_id is distinct from auth.uid() then
    perform public.admin_require_permission('subscriptions.manage');
  elsif public.get_my_role() is distinct from 'manager' then
    raise exception 'Réservé aux managers'
      using errcode = '42501';
  end if;

  select *
    into v_subscription
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if v_subscription.id is not null then
    v_expiration := case
      when v_subscription.status = 'trialing'
        then coalesce(
          v_subscription.trial_end,
          v_subscription.current_period_end,
          v_subscription.ends_at
        )
      else coalesce(
        v_subscription.current_period_end,
        v_subscription.ends_at
      )
    end;

    if v_subscription.status in ('trialing', 'active')
       and v_expiration is not null
       and v_expiration <= now() then
      update public.subscriptions
      set status = 'expired',
          updated_at = now()
      where id = v_subscription.id
      returning * into v_subscription;
    end if;

    return v_subscription;
  end if;

  select *
    into v_plan
  from public.plans
  where id = 'FREE'
    and is_active = true;

  if v_plan.id is null then
    raise exception 'Le plan FREE est introuvable ou inactif';
  end if;

  insert into public.subscriptions (
    user_id,
    plan_id,
    status,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    v_plan.id,
    case when v_plan.trial_days > 0 then 'trialing' else 'active' end,
    case when v_plan.trial_days > 0 then v_created_at else null end,
    case when v_plan.trial_days > 0
      then v_created_at + make_interval(days => v_plan.trial_days)
      else null end,
    v_created_at,
    case when v_plan.trial_days > 0
      then v_created_at + make_interval(days => v_plan.trial_days)
      else v_created_at + make_interval(months => v_plan.duration_months) end,
    v_created_at,
    v_created_at
  )
  returning * into v_subscription;

  return v_subscription;
end;
$function$

CREATE OR REPLACE FUNCTION public.ensure_my_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentification requise'
      USING ERRCODE = '42501';
  END IF;

  IF public.get_my_role() IS DISTINCT FROM 'manager' THEN
    RAISE EXCEPTION 'Réservé aux managers'
      USING ERRCODE = '42501';
  END IF;

  RETURN public.ensure_subscription_for_user(v_user);
END;
$function$;
