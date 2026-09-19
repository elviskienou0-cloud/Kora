-- ============================================================
-- KORA — PHASE 13 : ADMINISTRATION
-- Migration sûre : ne supprime aucune donnée existante.
--
-- Fonctions prévues :
--   * suspension / réactivation utilisateurs
--   * signalements
--   * logs d'administration
--   * modération des talents
--   * lecture admin des données de supervision
-- ============================================================

begin;

-- ============================================================
-- 1) ÉTAT DE SUSPENSION DES UTILISATEURS
-- ============================================================

alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

alter table public.profiles
  add column if not exists suspended_at timestamptz;

alter table public.profiles
  add column if not exists suspended_reason text;

create index if not exists profiles_suspended_idx
  on public.profiles(is_suspended);

-- ============================================================
-- 2) LOGS D'AUDIT ADMIN
-- ============================================================

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  target_user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs(created_at desc);

create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs(actor_id, created_at desc);

create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs(entity_type, entity_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_select_admin
  on public.admin_audit_logs;

create policy admin_audit_logs_select_admin
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

-- Aucun INSERT direct depuis le frontend.
-- Les fonctions SECURITY DEFINER ci-dessous écrivent les logs.

-- ============================================================
-- 3) SIGNALMENTS
-- ============================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),

  reporter_id uuid references public.profiles(id) on delete set null,

  target_type text not null
    check (target_type in (
      'user',
      'talent',
      'project',
      'request',
      'message',
      'review'
    )),

  target_id uuid,

  reason text not null,
  description text,

  status text not null default 'open'
    check (status in (
      'open',
      'reviewing',
      'resolved',
      'rejected'
    )),

  admin_note text,

  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_created_idx
  on public.reports(status, created_at desc);

create index if not exists reports_target_idx
  on public.reports(target_type, target_id);

create index if not exists reports_reporter_idx
  on public.reports(reporter_id, created_at desc);

alter table public.reports enable row level security;

drop policy if exists reports_select_admin
  on public.reports;

create policy reports_select_admin
on public.reports
for select
to authenticated
using (
  public.is_admin()
  or reporter_id = auth.uid()
);

-- Signalement par utilisateur connecté.
drop policy if exists reports_insert_own
  on public.reports;

create policy reports_insert_own
on public.reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
);

-- Les utilisateurs ne peuvent pas modifier les signalements.
-- L'administration utilisera les fonctions SECURITY DEFINER.

-- ============================================================
-- 4) FONCTION DE LOG INTERNE
-- ============================================================

create or replace function public.write_admin_audit_log(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

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
    p_action,
    p_entity_type,
    p_entity_id,
    p_target_user_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_admin_audit_log(
  text,
  text,
  uuid,
  uuid,
  jsonb
) from public;

grant execute on function public.write_admin_audit_log(
  text,
  text,
  uuid,
  uuid,
  jsonb
) to authenticated;

-- ============================================================
-- 5) SUSPENDRE UN UTILISATEUR
-- ============================================================

create or replace function public.admin_suspend_user(
  p_user_id uuid,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Un administrateur ne peut pas se suspendre lui-même';
  end if;

  update public.profiles
  set
    is_suspended = true,
    suspended_at = now(),
    suspended_reason = nullif(trim(coalesce(p_reason, '')), ''),
    updated_at = now()
  where id = p_user_id
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Utilisateur introuvable';
  end if;

  perform public.write_admin_audit_log(
    'user.suspend',
    'profile',
    v_profile.id,
    v_profile.id,
    jsonb_build_object(
      'reason', v_profile.suspended_reason
    )
  );

  return v_profile;
end;
$$;

revoke all on function public.admin_suspend_user(uuid, text) from public;
grant execute on function public.admin_suspend_user(uuid, text) to authenticated;

-- ============================================================
-- 6) RÉACTIVER UN UTILISATEUR
-- ============================================================

create or replace function public.admin_reactivate_user(
  p_user_id uuid
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  update public.profiles
  set
    is_suspended = false,
    suspended_at = null,
    suspended_reason = null,
    updated_at = now()
  where id = p_user_id
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Utilisateur introuvable';
  end if;

  perform public.write_admin_audit_log(
    'user.reactivate',
    'profile',
    v_profile.id,
    v_profile.id,
    '{}'::jsonb
  );

  return v_profile;
end;
$$;

revoke all on function public.admin_reactivate_user(uuid) from public;
grant execute on function public.admin_reactivate_user(uuid) to authenticated;

-- ============================================================
-- 7) MODÉRATION TALENT
-- ============================================================

create or replace function public.admin_set_talent_moderation(
  p_talent_id uuid,
  p_status text,
  p_visible boolean default null,
  p_verified boolean default null,
  p_reason text default null
)
returns public.talent_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_talent public.talent_profiles%rowtype;
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if p_talent_id is null then
    raise exception 'Talent manquant';
  end if;

  if v_status not in (
    'pending',
    'published',
    'rejected',
    'suspended'
  ) then
    raise exception 'Statut de modération invalide';
  end if;

  update public.talent_profiles
  set
    status = v_status,
    is_visible = coalesce(p_visible, is_visible),
    verified = coalesce(p_verified, verified),
    updated_at = now()
  where id = p_talent_id
  returning * into v_talent;

  if v_talent.id is null then
    raise exception 'Talent introuvable';
  end if;

  perform public.write_admin_audit_log(
    'talent.moderate',
    'talent_profile',
    v_talent.id,
    v_talent.managed_by,
    jsonb_build_object(
      'status', v_status,
      'is_visible', v_talent.is_visible,
      'verified', v_talent.verified,
      'reason', nullif(trim(coalesce(p_reason, '')), '')
    )
  );

  return v_talent;
end;
$$;

revoke all on function public.admin_set_talent_moderation(
  uuid,
  text,
  boolean,
  boolean,
  text
) from public;

grant execute on function public.admin_set_talent_moderation(
  uuid,
  text,
  boolean,
  boolean,
  text
) to authenticated;

-- ============================================================
-- 8) TRAITEMENT DES SIGNALEMENTS
-- ============================================================

create or replace function public.admin_update_report(
  p_report_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report public.reports%rowtype;
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if v_status not in (
    'open',
    'reviewing',
    'resolved',
    'rejected'
  ) then
    raise exception 'Statut de signalement invalide';
  end if;

  update public.reports
  set
    status = v_status,
    admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
    resolved_by = case
      when v_status in ('resolved', 'rejected')
      then auth.uid()
      else null
    end,
    resolved_at = case
      when v_status in ('resolved', 'rejected')
      then now()
      else null
    end,
    updated_at = now()
  where id = p_report_id
  returning * into v_report;

  if v_report.id is null then
    raise exception 'Signalement introuvable';
  end if;

  perform public.write_admin_audit_log(
    'report.update',
    'report',
    v_report.id,
    null,
    jsonb_build_object(
      'status', v_report.status
    )
  );

  return v_report;
end;
$$;

revoke all on function public.admin_update_report(
  uuid,
  text,
  text
) from public;

grant execute on function public.admin_update_report(
  uuid,
  text,
  text
) to authenticated;

-- ============================================================
-- 9) ACCÈS ADMIN EN LECTURE AUX TABLES DE SUPERVISION
-- ============================================================

alter table public.reports enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Les tables métier restent protégées par leurs propres RLS.
-- Les vues/admin écrans doivent utiliser les policies existantes
-- ou des fonctions SECURITY DEFINER dédiées lorsque nécessaire.

-- ============================================================
-- 10) INDEX ADMIN UTILES
-- ============================================================

create index if not exists talent_profiles_status_visible_idx
  on public.talent_profiles(status, is_visible, updated_at desc);

create index if not exists requests_status_created_idx
  on public.requests(status, created_at desc);

create index if not exists projects_status_created_idx
  on public.projects(status, created_at desc);

create index if not exists subscriptions_status_updated_idx
  on public.subscriptions(status, updated_at desc);

create index if not exists payments_status_created_idx
  on public.payments(status, created_at desc);

commit;
