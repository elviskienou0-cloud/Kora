
create or replace function public.ensure_subscription_for_user(p_user_id uuid)
returns public.subscriptions
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_subscription public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_created_at timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  -- Un utilisateur peut gérer uniquement son propre abonnement.
  -- Toute intervention sur un autre compte exige la permission dédiée.
  if p_user_id is distinct from auth.uid() then
    perform public.admin_require_permission('subscriptions.manage');
  end if;

  select *
    into v_subscription
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if v_subscription.id is not null then
    if v_subscription.status = 'trialing'
       and v_subscription.trial_end is not null
       and v_subscription.trial_end <= now() then
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
    user_id, plan_id, status, trial_start, trial_end,
    current_period_start, current_period_end, created_at, updated_at
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
$function$;
