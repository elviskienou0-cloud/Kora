
create or replace function public.manager_can_add_talent()
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_count integer;
begin
  if auth.uid() is null or public.get_my_role() <> 'manager' then
    return false;
  end if;

  v_sub := public.ensure_subscription_for_user(auth.uid());

  if v_sub.status not in ('trialing', 'active') then
    return false;
  end if;

  if v_sub.current_period_end is not null
     and v_sub.current_period_end <= now() then
    return false;
  end if;

  select *
    into v_plan
  from public.plans
  where id = v_sub.plan_id
    and is_active = true;

  if v_plan.id is null then
    return false;
  end if;

  if v_plan.talent_limit is null then
    return true;
  end if;

  select count(*)
    into v_count
  from public.talent_profiles
  where managed_by = auth.uid();

  return v_count < v_plan.talent_limit;
end;
$function$;

create or replace function public.manager_has_feature(p_feature text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_enabled boolean := false;
begin
  if auth.uid() is null
     or public.get_my_role() <> 'manager'
     or nullif(trim(coalesce(p_feature, '')), '') is null then
    return false;
  end if;

  v_sub := public.ensure_subscription_for_user(auth.uid());

  if v_sub.status not in ('trialing', 'active') then
    return false;
  end if;

  if v_sub.current_period_end is not null
     and v_sub.current_period_end <= now() then
    return false;
  end if;

  select *
    into v_plan
  from public.plans
  where id = v_sub.plan_id
    and is_active = true;

  if v_plan.id is null then
    return false;
  end if;

  v_enabled := coalesce((v_plan.features ->> p_feature)::boolean, false);
  return v_enabled;
exception
  when others then
    return false;
end;
$function$;

create or replace function public.mark_messages_read(p_conversation_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user is null then
    raise exception 'Connexion requise';
  end if;

  if p_conversation_id is null then
    raise exception 'Conversation manquante';
  end if;

  if not (
    public.is_conversation_member(p_conversation_id)
    or public.is_super_admin()
    or public.admin_has_permission('moderation.manage')
  ) then
    raise exception 'Accès refusé à cette conversation';
  end if;

  update public.messages
  set read_at = coalesce(read_at, now())
  where conversation_id = p_conversation_id
    and sender_id <> v_user
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;
