-- KORA: administration hierarchy
-- Keeps the existing admin/CEO dashboard intact and adds a distinct
-- associate-admin access profile that can be configured by a Super Admin.

create table if not exists public.admin_access_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_level text not null default 'associate'
    check (access_level in ('super_admin','associate')),
  permissions jsonb not null default '{}'::jsonb,
  max_users integer,
  max_payment_validations integer,
  access_expires_at timestamptz,
  scope jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_access_profiles_level
  on public.admin_access_profiles(access_level);

create index if not exists idx_admin_access_profiles_active
  on public.admin_access_profiles(is_active);

alter table public.admin_access_profiles enable row level security;

drop policy if exists "admin_access_profiles_select_own_or_super" on public.admin_access_profiles;
create policy "admin_access_profiles_select_own_or_super"
on public.admin_access_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin()
);

drop policy if exists "admin_access_profiles_super_all" on public.admin_access_profiles;
create policy "admin_access_profiles_super_all"
on public.admin_access_profiles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create or replace function public.is_super_admin()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_level text;
begin
  if not public.is_admin() then
    return false;
  end if;

  select access_level
    into v_level
  from public.admin_access_profiles
  where user_id = auth.uid()
    and is_active = true
    and (access_expires_at is null or access_expires_at > now());

  -- Existing admins without an access profile retain the current CEO/Super Admin
  -- behavior. This makes the migration non-breaking for the existing CEO account.
  return coalesce(v_level, 'super_admin') = 'super_admin';
end;
$$;

create or replace function public.get_my_admin_access()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.admin_access_profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  select *
    into v_profile
  from public.admin_access_profiles
  where user_id = auth.uid()
    and is_active = true
    and (access_expires_at is null or access_expires_at > now());

  if not found then
    return jsonb_build_object(
      'access_level', 'super_admin',
      'permissions', jsonb_build_object('*', true),
      'max_users', null,
      'max_payment_validations', null,
      'access_expires_at', null,
      'scope', jsonb_build_object('*', true),
      'is_active', true
    );
  end if;

  return jsonb_build_object(
    'access_level', v_profile.access_level,
    'permissions', v_profile.permissions,
    'max_users', v_profile.max_users,
    'max_payment_validations', v_profile.max_payment_validations,
    'access_expires_at', v_profile.access_expires_at,
    'scope', v_profile.scope,
    'is_active', v_profile.is_active
  );
end;
$$;

create or replace function public.admin_has_permission(p_permission text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_access jsonb;
begin
  if not public.is_admin() then
    return false;
  end if;

  if public.is_super_admin() then
    return true;
  end if;

  v_access := public.get_my_admin_access();

  return coalesce((v_access->'permissions'->p_permission)::boolean, false)
      or coalesce((v_access->'permissions'->'*')::boolean, false);
end;
$$;

create or replace function public.set_admin_access_profile(
  p_user_id uuid,
  p_access_level text,
  p_permissions jsonb default '{}'::jsonb,
  p_max_users integer default null,
  p_max_payment_validations integer default null,
  p_access_expires_at timestamptz default null,
  p_scope jsonb default '{}'::jsonb,
  p_is_active boolean default true
)
returns public.admin_access_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target_role text;
  v_result public.admin_access_profiles;
begin
  if not public.is_super_admin() then
    raise exception 'Seul le Super Admin peut gérer les administrateurs';
  end if;

  if p_user_id is null or p_user_id = auth.uid() then
    raise exception 'Le compte Super Admin actuel ne peut pas être reconfiguré ici';
  end if;

  if p_access_level not in ('super_admin','associate') then
    raise exception 'Niveau administrateur invalide';
  end if;

  select role into v_target_role
  from public.profiles
  where id = p_user_id;

  if v_target_role is distinct from 'admin' then
    raise exception 'La cible doit être un compte administrateur';
  end if;

  insert into public.admin_access_profiles (
    user_id, access_level, permissions, max_users,
    max_payment_validations, access_expires_at, scope,
    is_active, created_by, updated_by
  )
  values (
    p_user_id, p_access_level, coalesce(p_permissions, '{}'::jsonb),
    p_max_users, p_max_payment_validations, p_access_expires_at,
    coalesce(p_scope, '{}'::jsonb), coalesce(p_is_active, true),
    auth.uid(), auth.uid()
  )
  on conflict (user_id) do update
  set access_level = excluded.access_level,
      permissions = excluded.permissions,
      max_users = excluded.max_users,
      max_payment_validations = excluded.max_payment_validations,
      access_expires_at = excluded.access_expires_at,
      scope = excluded.scope,
      is_active = excluded.is_active,
      updated_by = auth.uid(),
      updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.list_admin_access_profiles()
returns table (
  user_id uuid,
  name text,
  email text,
  access_level text,
  permissions jsonb,
  max_users integer,
  max_payment_validations integer,
  access_expires_at timestamptz,
  scope jsonb,
  is_active boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Accès Super Admin requis';
  end if;

  return query
  select
    p.id,
    p.name,
    nullif((select au.email from auth.users au where au.id = p.id), ''),
    coalesce(aap.access_level, 'super_admin'),
    coalesce(aap.permissions, jsonb_build_object('*', true)),
    aap.max_users,
    aap.max_payment_validations,
    aap.access_expires_at,
    coalesce(aap.scope, jsonb_build_object('*', true)),
    coalesce(aap.is_active, true)
  from public.profiles p
  left join public.admin_access_profiles aap on aap.user_id = p.id
  where p.role = 'admin'
  order by case when coalesce(aap.access_level, 'super_admin') = 'super_admin' then 0 else 1 end, p.name;
end;
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

revoke all on function public.get_my_admin_access() from public;
grant execute on function public.get_my_admin_access() to authenticated;

revoke all on function public.admin_has_permission(text) from public;
grant execute on function public.admin_has_permission(text) to authenticated;

revoke all on function public.set_admin_access_profile(uuid,text,jsonb,integer,integer,timestamptz,jsonb,boolean) from public;
grant execute on function public.set_admin_access_profile(uuid,text,jsonb,integer,integer,timestamptz,jsonb,boolean) to authenticated;

revoke all on function public.list_admin_access_profiles() from public;
grant execute on function public.list_admin_access_profiles() to authenticated;
