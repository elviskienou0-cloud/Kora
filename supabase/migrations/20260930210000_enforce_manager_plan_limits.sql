-- KORA — règles d'abonnement et limites des talents
-- FREE 1 talent / 30 jours
-- PRO 2 500 XOF / mois / 3 talents
-- BUSINESS 5 000 XOF / mois / talents illimités
-- La limite est imposée côté PostgreSQL et ne peut pas être contournée par le frontend.

begin;

-- 1) Grille officielle KORA
update public.plans
set name = 'Gratuit',
    price = 0,
    currency = 'XOF',
    duration_months = 1,
    talent_limit = 1,
    trial_days = 30,
    is_active = true,
    updated_at = now()
where id = 'FREE';

update public.plans
set name = 'Pro',
    price = 2500,
    currency = 'XOF',
    duration_months = 1,
    talent_limit = 3,
    trial_days = 0,
    is_active = true,
    updated_at = now()
where id = 'PRO';

update public.plans
set name = 'Business',
    price = 5000,
    currency = 'XOF',
    duration_months = 1,
    talent_limit = null,
    trial_days = 0,
    is_active = true,
    updated_at = now()
where id = 'BUSINESS';

-- 2) Tous les nouveaux managers reçoivent automatiquement 30 jours de FREE.
--    Le trigger existant crée déjà profiles : on complète son comportement ici.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_name text;
  v_now timestamptz := now();
  v_free public.plans%rowtype;
begin
  v_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', 'client')));

  if v_role not in ('client', 'manager') then
    v_role := 'client';
  end if;

  v_name := trim(coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(
      trim(
        coalesce(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
        coalesce(new.raw_user_meta_data ->> 'last_name', '')
      ),
      ''
    ),
    split_part(coalesce(new.email, ''), '@', 1),
    'Utilisateur KORA'
  ));

  insert into public.profiles (id, name, role)
  values (new.id, v_name, v_role)
  on conflict (id) do update
    set name = excluded.name,
        role = case
          when public.profiles.role in ('admin', 'superadmin')
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now();

  if v_role = 'manager' then
    select *
    into v_free
    from public.plans
    where id = 'FREE'
      and is_active = true
    limit 1;

    if v_free.id is null then
      raise exception 'Le plan Gratuit KORA est introuvable.';
    end if;

    insert into public.subscriptions (
      user_id,
      plan,
      plan_id,
      status,
      starts_at,
      ends_at,
      trial_start,
      trial_end,
      current_period_start,
      current_period_end,
      provider,
      updated_at
    )
    values (
      new.id,
      'free',
      'FREE',
      'trialing',
      v_now,
      v_now + interval '30 days',
      v_now,
      v_now + interval '30 days',
      v_now,
      v_now + interval '30 days',
      'kora',
      v_now
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 3) Source unique de vérité pour l'abonnement manager.
--    Elle expire automatiquement FREE et les abonnements payants arrivés à terme.
create or replace function public.ensure_my_manager_subscription()
returns public.subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_sub public.subscriptions%rowtype;
  v_free public.plans%rowtype;
  v_now timestamptz := now();
begin
  if v_user is null then
    raise exception 'Connexion requise';
  end if;

  select role into v_role
  from public.profiles
  where id = v_user;

  if v_role <> 'manager' then
    raise exception 'Compte manager requis';
  end if;

  select *
  into v_sub
  from public.subscriptions
  where user_id = v_user
  order by created_at desc
  limit 1
  for update;

  if v_sub.id is not null then
    if v_sub.status in ('trialing', 'active')
       and v_sub.current_period_end is not null
       and v_sub.current_period_end <= v_now then
      update public.subscriptions
      set status = 'expired',
          updated_at = v_now
      where id = v_sub.id
      returning * into v_sub;
    end if;

    return v_sub;
  end if;

  select *
  into v_free
  from public.plans
  where id = 'FREE'
    and is_active = true
  limit 1;

  if v_free.id is null then
    raise exception 'Plan Gratuit introuvable';
  end if;

  insert into public.subscriptions (
    user_id,
    plan,
    plan_id,
    status,
    starts_at,
    ends_at,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end,
    provider,
    updated_at
  )
  values (
    v_user,
    'free',
    'FREE',
    'trialing',
    v_now,
    v_now + interval '30 days',
    v_now,
    v_now + interval '30 days',
    v_now,
    v_now + interval '30 days',
    'kora',
    v_now
  )
  returning * into v_sub;

  return v_sub;
end;
$$;

revoke all on function public.ensure_my_manager_subscription() from public, anon;
grant execute on function public.ensure_my_manager_subscription() to authenticated;

-- 4) Empêche le manager de réinitialiser son mois gratuit.
--    FREE est attribué une seule fois à la création du compte.
create or replace function public.activate_free_plan()
returns public.subscriptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_now timestamptz := now();
begin
  if v_user is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  if public.get_my_role() <> 'manager' then
    raise exception 'Réservé aux managers';
  end if;

  select *
  into v_sub
  from public.subscriptions
  where user_id = v_user
  order by created_at desc
  limit 1
  for update;

  if v_sub.id is null then
    raise exception 'Le plan Gratuit est attribué automatiquement à l''inscription.';
  end if;

  if upper(coalesce(v_sub.plan_id, '')) in ('PRO', 'BUSINESS')
     and v_sub.status in ('active', 'trialing')
     and (v_sub.current_period_end is null or v_sub.current_period_end > v_now) then
    raise exception 'Vous avez déjà un abonnement payant actif.';
  end if;

  if upper(coalesce(v_sub.plan_id, '')) = 'FREE'
     and v_sub.current_period_end is not null
     and v_sub.current_period_end > v_now
     and v_sub.status in ('active', 'trialing') then
    return v_sub;
  end if;

  raise exception 'Votre période gratuite est terminée. Choisissez Pro ou Business.';
end;
$$;

revoke all on function public.activate_free_plan() from public, anon;
grant execute on function public.activate_free_plan() to authenticated;

-- 5) Contrôle serveur de création de talent.
--    Le verrou transactionnel empêche deux créations simultanées de dépasser
--    la limite du plan.
create or replace function public.create_manager_talent(
  p_managed_by uuid,
  p_first_name text,
  p_last_name text,
  p_title text,
  p_bio text,
  p_category_id uuid,
  p_country_id uuid,
  p_city text,
  p_available boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_count bigint;
  v_id uuid;
begin
  if v_user is null or p_managed_by is null or p_managed_by <> v_user then
    raise exception 'Action non autorisée';
  end if;

  if public.get_my_role() <> 'manager' then
    raise exception 'Compte manager requis';
  end if;

  -- Une seule création à la fois pour un manager.
  perform pg_advisory_xact_lock(
    hashtextextended('kora_talent_limit:' || v_user::text, 0)
  );

  v_sub := public.ensure_my_manager_subscription();

  if v_sub.status not in ('trialing', 'active') then
    raise exception 'Votre abonnement est expiré. Choisissez Pro ou Business.';
  end if;

  if v_sub.current_period_end is not null
     and v_sub.current_period_end <= now() then
    raise exception 'Votre abonnement est expiré. Choisissez Pro ou Business.';
  end if;

  select *
  into v_plan
  from public.plans
  where id = v_sub.plan_id
    and is_active = true
  limit 1;

  if v_plan.id is null then
    raise exception 'Plan d''abonnement introuvable.';
  end if;

  select count(*)
  into v_count
  from public.talent_profiles
  where managed_by = v_user;

  if v_plan.talent_limit is not null and v_count >= v_plan.talent_limit then
    raise exception
      'Limite atteinte : le plan % autorise % talent(s). Passez à une offre supérieure pour continuer.',
      v_plan.name,
      v_plan.talent_limit;
  end if;

  insert into public.talent_profiles (
    managed_by,
    first_name,
    last_name,
    title,
    bio,
    category_id,
    country_id,
    city,
    currency,
    available,
    verified,
    status,
    is_visible,
    rating,
    reviews_count,
    completed_projects
  )
  values (
    v_user,
    trim(p_first_name),
    nullif(trim(p_last_name), ''),
    trim(p_title),
    trim(p_bio),
    p_category_id,
    p_country_id,
    trim(p_city),
    'XOF',
    coalesce(p_available, true),
    false,
    'pending',
    false,
    0,
    0,
    0
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_manager_talent(uuid,text,text,text,text,uuid,uuid,text,boolean)
from public, anon;

grant execute on function public.create_manager_talent(uuid,text,text,text,text,uuid,uuid,text,boolean)
to authenticated;

-- 6) Défense supplémentaire contre un INSERT direct dans talent_profiles.
--    Même si une policy RLS existante autorise l'INSERT, le trigger bloque
--    toute création qui ne respecte pas l'abonnement et la limite.
create or replace function public.enforce_manager_talent_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_count bigint;
begin
  if current_user <> 'authenticated' or auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.managed_by <> auth.uid() then
    raise exception 'Vous ne pouvez créer un talent que pour votre propre compte.';
  end if;

  if public.get_my_role() <> 'manager' then
    raise exception 'Seul un manager peut créer un talent.';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('kora_talent_limit:' || auth.uid()::text, 0)
  );

  select *
  into v_sub
  from public.subscriptions
  where user_id = auth.uid()
  order by created_at desc
  limit 1
  for update;

  if v_sub.id is null then
    raise exception 'Abonnement manager introuvable.';
  end if;

  if v_sub.status not in ('trialing', 'active')
     or (v_sub.current_period_end is not null and v_sub.current_period_end <= now()) then
    raise exception 'Votre abonnement est expiré. Choisissez Pro ou Business.';
  end if;

  select *
  into v_plan
  from public.plans
  where id = v_sub.plan_id
    and is_active = true
  limit 1;

  if v_plan.id is null then
    raise exception 'Plan d''abonnement introuvable.';
  end if;

  select count(*)
  into v_count
  from public.talent_profiles
  where managed_by = auth.uid();

  if v_plan.talent_limit is not null and v_count >= v_plan.talent_limit then
    raise exception
      'Limite atteinte : le plan % autorise % talent(s). Passez à une offre supérieure pour continuer.',
      v_plan.name,
      v_plan.talent_limit;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_manager_talent_limit on public.talent_profiles;

create trigger trg_enforce_manager_talent_limit
before insert on public.talent_profiles
for each row
execute function public.enforce_manager_talent_limit();

-- 7) Index utile pour les contrôles de quota.
create index if not exists idx_talent_profiles_managed_by
on public.talent_profiles(managed_by);

commit;

-- Vérification :
select id, name, price, talent_limit, trial_days, is_active
from public.plans
where id in ('FREE','PRO','BUSINESS')
order by case id when 'FREE' then 1 when 'PRO' then 2 when 'BUSINESS' then 3 end;
