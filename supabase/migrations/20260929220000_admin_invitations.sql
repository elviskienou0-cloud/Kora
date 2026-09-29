-- KORA: admin invitations and secure admin onboarding

create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_user_id uuid references public.profiles(id) on delete set null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  message text,
  access_level text not null default 'associate'
    check (access_level in ('associate','super_admin')),
  permissions jsonb not null default '{}'::jsonb,
  max_users integer check (max_users is null or max_users >= 0),
  max_payment_validations integer
    check (max_payment_validations is null or max_payment_validations >= 0),
  access_expires_at timestamptz,
  scope jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','accepted','revoked','expired')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists idx_admin_invitations_email
  on public.admin_invitations(lower(email));

create index if not exists idx_admin_invitations_status
  on public.admin_invitations(status);

alter table public.admin_invitations enable row level security;

drop policy if exists "admin_invitations_super_select"
on public.admin_invitations;

create policy "admin_invitations_super_select"
on public.admin_invitations
for select
to authenticated
using (public.is_super_admin());

drop policy if exists "admin_invitations_super_all"
on public.admin_invitations;

create policy "admin_invitations_super_all"
on public.admin_invitations
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create or replace function public.register_admin_invitation(
  p_invitation_id uuid,
  p_invited_user_id uuid,
  p_email text,
  p_message text,
  p_access_level text default 'associate',
  p_permissions jsonb default '{}'::jsonb,
  p_max_users integer default null,
  p_max_payment_validations integer default null,
  p_access_expires_at timestamptz default null,
  p_scope jsonb default '{}'::jsonb
)
returns public.admin_invitations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inv public.admin_invitations;
begin
  if not public.is_super_admin() then
    raise exception 'Accès Super Admin requis';
  end if;

  if p_access_level not in ('associate','super_admin') then
    raise exception 'Niveau administrateur invalide';
  end if;

  update public.profiles
  set role = 'admin',
      updated_at = now()
  where id = p_invited_user_id;

  if not found then
    raise exception 'Profil invité introuvable';
  end if;

  insert into public.admin_access_profiles (
    user_id,
    access_level,
    permissions,
    max_users,
    max_payment_validations,
    access_expires_at,
    scope,
    is_active,
    created_by,
    updated_by
  )
  values (
    p_invited_user_id,
    p_access_level,
    coalesce(p_permissions, '{}'::jsonb),
    p_max_users,
    p_max_payment_validations,
    p_access_expires_at,
    coalesce(p_scope, '{}'::jsonb),
    true,
    auth.uid(),
    auth.uid()
  )
  on conflict (user_id) do update set
    access_level = excluded.access_level,
    permissions = excluded.permissions,
    max_users = excluded.max_users,
    max_payment_validations = excluded.max_payment_validations,
    access_expires_at = excluded.access_expires_at,
    scope = excluded.scope,
    is_active = true,
    updated_by = auth.uid(),
    updated_at = now();

  insert into public.admin_invitations (
    id,
    email,
    invited_user_id,
    invited_by,
    message,
    access_level,
    permissions,
    max_users,
    max_payment_validations,
    access_expires_at,
    scope,
    status
  )
  values (
    p_invitation_id,
    lower(trim(p_email)),
    p_invited_user_id,
    auth.uid(),
    p_message,
    p_access_level,
    coalesce(p_permissions, '{}'::jsonb),
    p_max_users,
    p_max_payment_validations,
    p_access_expires_at,
    coalesce(p_scope, '{}'::jsonb),
    'pending'
  )
  returning * into v_inv;

  insert into public.admin_audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    target_user_id,
    metadata
  )
  values (
    auth.uid(),
    'admin.invite',
    'admin_invitation',
    p_invitation_id,
    p_invited_user_id,
    jsonb_build_object(
      'email', lower(trim(p_email)),
      'access_level', p_access_level
    )
  );

  return v_inv;
end;
$$;

revoke all on function public.register_admin_invitation(
  uuid, uuid, text, text, text, jsonb, integer, integer, timestamptz, jsonb
) from public;

grant execute on function public.register_admin_invitation(
  uuid, uuid, text, text, text, jsonb, integer, integer, timestamptz, jsonb
) to authenticated;
