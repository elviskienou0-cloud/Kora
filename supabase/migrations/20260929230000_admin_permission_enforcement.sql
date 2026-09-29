-- KORA — ADMIN PERMISSION ENFORCEMENT
-- Enforce les permissions des administrateurs/associés côté PostgreSQL.
-- Le Super Admin conserve tous les accès.
-- Les utilisateurs non-admin conservent leurs politiques métier existantes.

begin;

-- ============================================================
-- 1) HELPERS D'AUTORISATION
-- ============================================================

create or replace function public.admin_require_permission(p_permission text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;

  if not public.admin_has_permission(trim(p_permission)) then
    raise exception 'Permission administrateur requise : %', trim(p_permission)
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.admin_require_permission(text) from public, anon;
grant execute on function public.admin_require_permission(text) to authenticated;


create or replace function public.admin_require_any_permission(p_permissions text[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_permission text;
  v_allowed boolean := false;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;

  if public.is_super_admin() then
    return;
  end if;

  foreach v_permission in array coalesce(p_permissions, '{}'::text[]) loop
    if public.admin_has_permission(trim(v_permission)) then
      v_allowed := true;
      exit;
    end if;
  end loop;

  if not v_allowed then
    raise exception 'Aucune permission administrateur suffisante'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.admin_require_any_permission(text[]) from public, anon;
grant execute on function public.admin_require_any_permission(text[]) to authenticated;


-- ============================================================
-- 2) RLS RESTRICTIVE : LECTURE ADMIN PAR DOMAINE
--
-- Les politiques existantes restent en place.
-- Ces politiques RESTRICTIVE ajoutent une condition AND pour
-- empêcher un associé de contourner son dashboard via l'API.
-- ============================================================

-- PROFILS / UTILISATEURS
alter table public.profiles enable row level security;

drop policy if exists admin_permissions_profiles_select
  on public.profiles;

create policy admin_permissions_profiles_select
on public.profiles
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or auth.uid() = id
  or public.is_super_admin()
  or (
    role = 'admin'
    and public.admin_has_permission('users.read')
  )
  or (
    role = 'manager'
    and (
      public.admin_has_permission('users.read')
      or public.admin_has_permission('managers.read')
    )
  )
  or (
    role = 'client'
    and (
      public.admin_has_permission('users.read')
      or public.admin_has_permission('clients.read')
    )
  )
);

-- Un associé ne modifie jamais directement les profils via PostgREST.
-- Les modifications admin passent par des RPC contrôlés.
drop policy if exists admin_permissions_profiles_write
  on public.profiles;

create policy admin_permissions_profiles_write
on public.profiles
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- TALENTS
alter table public.talent_profiles enable row level security;

drop policy if exists admin_permissions_talents_select
  on public.talent_profiles;

create policy admin_permissions_talents_select
on public.talent_profiles
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('talents.read')
);

drop policy if exists admin_permissions_talents_write
  on public.talent_profiles;

create policy admin_permissions_talents_write
on public.talent_profiles
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- DEMANDES
alter table public.requests enable row level security;

drop policy if exists admin_permissions_requests_select
  on public.requests;

create policy admin_permissions_requests_select
on public.requests
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('requests.read')
);

drop policy if exists admin_permissions_requests_write
  on public.requests;

create policy admin_permissions_requests_write
on public.requests
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- PROJETS
alter table public.projects enable row level security;

drop policy if exists admin_permissions_projects_select
  on public.projects;

create policy admin_permissions_projects_select
on public.projects
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('projects.read')
);

drop policy if exists admin_permissions_projects_write
  on public.projects;

create policy admin_permissions_projects_write
on public.projects
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- MESSAGES
alter table public.messages enable row level security;

drop policy if exists admin_permissions_messages_select
  on public.messages;

create policy admin_permissions_messages_select
on public.messages
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('messages.read')
);

drop policy if exists admin_permissions_messages_write
  on public.messages;

create policy admin_permissions_messages_write
on public.messages
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- PAIEMENTS
alter table public.payments enable row level security;

drop policy if exists admin_permissions_payments_select
  on public.payments;

create policy admin_permissions_payments_select
on public.payments
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('payments.read')
  or public.admin_has_permission('payments.validate')
);

drop policy if exists admin_permissions_payments_write
  on public.payments;

create policy admin_permissions_payments_write
on public.payments
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- ABONNEMENTS
alter table public.subscriptions enable row level security;

drop policy if exists admin_permissions_subscriptions_select
  on public.subscriptions;

create policy admin_permissions_subscriptions_select
on public.subscriptions
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('subscriptions.read')
  or public.admin_has_permission('subscriptions.manage')
);

drop policy if exists admin_permissions_subscriptions_write
  on public.subscriptions;

create policy admin_permissions_subscriptions_write
on public.subscriptions
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- SIGNALMENTS / MODERATION
alter table public.reports enable row level security;

drop policy if exists admin_permissions_reports_select
  on public.reports;

create policy admin_permissions_reports_select
on public.reports
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or reporter_id = auth.uid()
  or public.is_super_admin()
  or public.admin_has_permission('moderation.read')
);

drop policy if exists admin_permissions_reports_write
  on public.reports;

create policy admin_permissions_reports_write
on public.reports
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- LOGS D'AUDIT
alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_permissions_audit_logs_select
  on public.admin_audit_logs;

create policy admin_permissions_audit_logs_select
on public.admin_audit_logs
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('logs.read')
);

drop policy if exists admin_permissions_audit_logs_write
  on public.admin_audit_logs;

create policy admin_permissions_audit_logs_write
on public.admin_audit_logs
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- PARAMÈTRES
alter table public.app_settings enable row level security;

drop policy if exists admin_permissions_settings_select
  on public.app_settings;

create policy admin_permissions_settings_select
on public.app_settings
as restrictive
for select
to authenticated
using (
  not public.is_admin()
  or public.is_super_admin()
  or public.admin_has_permission('settings.read')
);

drop policy if exists admin_permissions_settings_write
  on public.app_settings;

create policy admin_permissions_settings_write
on public.app_settings
as restrictive
for all
to authenticated
using (
  not public.is_admin() or public.is_super_admin()
)
with check (
  not public.is_admin() or public.is_super_admin()
);


-- ============================================================
-- 3) RPC DASHBOARD ADMIN
-- ============================================================

create or replace function public.admin_dashboard_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_month timestamptz := date_trunc('month', now());
  v_prev_month timestamptz := date_trunc('month', now()) - interval '1 month';
  v_result jsonb;
  v_users boolean;
  v_managers boolean;
  v_clients boolean;
  v_talents boolean;
  v_requests boolean;
  v_projects boolean;
  v_payments boolean;
begin
  perform public.admin_require_any_permission(
    array[
      'users.read',
      'managers.read',
      'clients.read',
      'talents.read',
      'requests.read',
      'projects.read',
      'payments.read',
      'subscriptions.read',
      'messages.read',
      'moderation.read'
    ]
  );

  v_users := public.is_super_admin() or public.admin_has_permission('users.read');
  v_managers := public.is_super_admin() or public.admin_has_permission('managers.read') or v_users;
  v_clients := public.is_super_admin() or public.admin_has_permission('clients.read') or v_users;
  v_talents := public.is_super_admin() or public.admin_has_permission('talents.read');
  v_requests := public.is_super_admin() or public.admin_has_permission('requests.read');
  v_projects := public.is_super_admin() or public.admin_has_permission('projects.read');
  v_payments := public.is_super_admin()
    or public.admin_has_permission('payments.read')
    or public.admin_has_permission('payments.validate');

  select jsonb_build_object(
    'generated_at', v_now,
    'totals', jsonb_build_object(
      'users', case when v_users then (select count(*) from public.profiles) else 0 end,
      'clients', case when v_clients then (select count(*) from public.profiles where role='client') else 0 end,
      'managers', case when v_managers then (select count(*) from public.profiles where role='manager') else 0 end,
      'admins', case when v_users then (select count(*) from public.profiles where role='admin') else 0 end,
      'talents', case when v_talents then (select count(*) from public.talent_profiles) else 0 end,
      'active_projects', case when v_projects then (select count(*) from public.projects where status in ('active','in_progress')) else 0 end,
      'payments_month', case when v_payments then coalesce((select sum(amount) from public.payments where status in ('paid','approved') and coalesce(paid_at,created_at)>=v_month),0) else 0 end,
      'payments_currency', 'FCFA'
    ),
    'previous', jsonb_build_object(
      'users', case when v_users then (select count(*) from public.profiles where created_at<v_month) else 0 end,
      'clients', case when v_clients then (select count(*) from public.profiles where role='client' and created_at<v_month) else 0 end,
      'managers', case when v_managers then (select count(*) from public.profiles where role='manager' and created_at<v_month) else 0 end,
      'talents', case when v_talents then (select count(*) from public.talent_profiles where created_at<v_month) else 0 end,
      'projects_new_month', case when v_projects then (select count(*) from public.projects where created_at>=v_month) else 0 end,
      'projects_new_prev', case when v_projects then (select count(*) from public.projects where created_at>=v_prev_month and created_at<v_month) else 0 end,
      'payments_prev_month', case when v_payments then coalesce((select sum(amount) from public.payments where status in ('paid','approved') and coalesce(paid_at,created_at)>=v_prev_month and coalesce(paid_at,created_at)<v_month),0) else 0 end
    ),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day',to_char(d,'DD/MM'),
        'clients',case when v_clients then (select count(*) from public.profiles p where p.role='client' and p.created_at<d+interval '1 day') else 0 end,
        'managers',case when v_managers then (select count(*) from public.profiles p where p.role='manager' and p.created_at<d+interval '1 day') else 0 end
      ) order by d),'[]'::jsonb)
      from generate_series(date_trunc('day',v_now)-interval '6 day',date_trunc('day',v_now),interval '1 day') d
    ),
    'recent_users', case when v_users then (
      select coalesce(jsonb_agg(x),'[]'::jsonb) from (
        select id,name,role,avatar,created_at,coalesce(is_suspended,false) as is_suspended
        from public.profiles order by created_at desc limit 5
      ) x
    ) else '[]'::jsonb end,
    'recent_requests', case when v_requests then (
      select coalesce(jsonb_agg(x),'[]'::jsonb) from (
        select r.id,r.status,r.created_at,
               coalesce(c.name,'—') as client_name,
               coalesce(nullif(trim(coalesce(t.first_name,'')||' '||coalesce(t.last_name,'')),'') ,'—') as talent_name
        from public.requests r
        left join public.profiles c on c.id=r.client_id
        left join public.talent_profiles t on t.id=r.talent_id
        order by r.created_at desc limit 5
      ) x
    ) else '[]'::jsonb end,
    'recent_payments', case when v_payments then (
      select coalesce(jsonb_agg(x),'[]'::jsonb) from (
        select p.id,p.amount,p.currency,p.status,p.created_at,
               coalesce(u.name,'—') as payer_name
        from public.payments p
        left join public.profiles u on u.id=p.user_id
        order by p.created_at desc limit 5
      ) x
    ) else '[]'::jsonb end
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_dashboard_overview() from public, anon;
grant execute on function public.admin_dashboard_overview() to authenticated;


-- ============================================================
-- 4) RPC ADMIN : UTILISATEURS
-- ============================================================

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_patch jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_requested_role text;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if not exists (select 1 from public.profiles where id=p_user_id) then
    raise exception 'Utilisateur introuvable';
  end if;

  v_requested_role := nullif(trim(coalesce(p_patch->>'role','')),'');

  if v_requested_role is not null and v_requested_role not in ('client','manager','admin') then
    raise exception 'Rôle invalide';
  end if;

  if p_user_id=auth.uid() and v_requested_role is not null then
    raise exception 'Un administrateur ne peut pas modifier son propre rôle';
  end if;

  update public.profiles
  set
    name=case when p_patch ? 'name' then nullif(trim(coalesce(p_patch->>'name','')),'') else name end,
    avatar=case when p_patch ? 'avatar' then nullif(trim(coalesce(p_patch->>'avatar','')),'') else avatar end,
    role=case when p_patch ? 'role' then p_patch->>'role' else role end,
    phone=case when p_patch ? 'phone' then nullif(trim(coalesce(p_patch->>'phone','')),'') else phone end,
    city=case when p_patch ? 'city' then nullif(trim(coalesce(p_patch->>'city','')),'') else city end,
    company=case when p_patch ? 'company' then nullif(trim(coalesce(p_patch->>'company','')),'') else company end,
    bio=case when p_patch ? 'bio' then nullif(trim(coalesce(p_patch->>'bio','')),'') else bio end,
    preferences=case when p_patch ? 'preferences' then coalesce(p_patch->'preferences','{}'::jsonb) else preferences end,
    updated_at=now()
  where id=p_user_id
  returning * into v_profile;

  perform public.write_admin_audit_log(
    'user.update','profile',v_profile.id,v_profile.id,
    jsonb_build_object('fields',(select jsonb_agg(key) from jsonb_object_keys(p_patch) as key))
  );

  return v_profile;
end;
$$;

revoke all on function public.admin_update_user(uuid,jsonb) from public, anon;
grant execute on function public.admin_update_user(uuid,jsonb) to authenticated;


create or replace function public.admin_suspend_user(
  p_user_id uuid,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_profile public.profiles%rowtype;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;
  if p_user_id=auth.uid() then raise exception 'Un administrateur ne peut pas se suspendre lui-même'; end if;

  update public.profiles
  set is_suspended=true,suspended_at=now(),
      suspended_reason=nullif(trim(coalesce(p_reason,'')),''),
      updated_at=now()
  where id=p_user_id
  returning * into v_profile;

  if v_profile.id is null then raise exception 'Utilisateur introuvable'; end if;

  perform public.write_admin_audit_log(
    'user.suspend','profile',v_profile.id,v_profile.id,
    jsonb_build_object('reason',v_profile.suspended_reason)
  );
  return v_profile;
end;
$$;

revoke all on function public.admin_suspend_user(uuid,text) from public, anon;
grant execute on function public.admin_suspend_user(uuid,text) to authenticated;


create or replace function public.admin_reactivate_user(
  p_user_id uuid
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_profile public.profiles%rowtype;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;

  update public.profiles
  set is_suspended=false,suspended_at=null,suspended_reason=null,updated_at=now()
  where id=p_user_id
  returning * into v_profile;

  if v_profile.id is null then raise exception 'Utilisateur introuvable'; end if;

  perform public.write_admin_audit_log(
    'user.reactivate','profile',v_profile.id,v_profile.id,'{}'::jsonb
  );
  return v_profile;
end;
$$;

revoke all on function public.admin_reactivate_user(uuid) from public, anon;
grant execute on function public.admin_reactivate_user(uuid) to authenticated;


-- ============================================================
-- 5) RPC MODÉRATION
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
  v_status text := lower(trim(coalesce(p_status,'')));
begin
  perform public.admin_require_permission('talents.manage');

  if p_talent_id is null then raise exception 'Talent manquant'; end if;
  if v_status not in ('pending','published','rejected','suspended') then
    raise exception 'Statut de modération invalide';
  end if;

  update public.talent_profiles
  set status=v_status,
      is_visible=coalesce(p_visible,is_visible),
      verified=coalesce(p_verified,verified),
      updated_at=now()
  where id=p_talent_id
  returning * into v_talent;

  if v_talent.id is null then raise exception 'Talent introuvable'; end if;

  perform public.write_admin_audit_log(
    'talent.moderate','talent_profile',v_talent.id,v_talent.managed_by,
    jsonb_build_object(
      'status',v_status,
      'is_visible',v_talent.is_visible,
      'verified',v_talent.verified,
      'reason',nullif(trim(coalesce(p_reason,'')),'')
    )
  );

  return v_talent;
end;
$$;

revoke all on function public.admin_set_talent_moderation(uuid,text,boolean,boolean,text) from public, anon;
grant execute on function public.admin_set_talent_moderation(uuid,text,boolean,boolean,text) to authenticated;


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
  v_status text := lower(trim(coalesce(p_status,'')));
begin
  perform public.admin_require_permission('moderation.manage');

  if v_status not in ('open','reviewing','resolved','rejected') then
    raise exception 'Statut de signalement invalide';
  end if;

  update public.reports
  set status=v_status,
      admin_note=nullif(trim(coalesce(p_admin_note,'')),''),
      resolved_by=case when v_status in ('resolved','rejected') then auth.uid() else null end,
      resolved_at=case when v_status in ('resolved','rejected') then now() else null end,
      updated_at=now()
  where id=p_report_id
  returning * into v_report;

  if v_report.id is null then raise exception 'Signalement introuvable'; end if;

  perform public.write_admin_audit_log(
    'report.update','report',v_report.id,null,
    jsonb_build_object('status',v_report.status)
  );

  return v_report;
end;
$$;

revoke all on function public.admin_update_report(uuid,text,text) from public, anon;
grant execute on function public.admin_update_report(uuid,text,text) to authenticated;


-- ============================================================
-- 6) RPC PAIEMENTS
-- ============================================================

create or replace function public.admin_validate_payment(
  p_payment_id uuid,
  p_status text,
  p_note text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_old_status text;
  v_start timestamptz := now();
  v_end timestamptz;
begin
  perform public.admin_require_permission('payments.validate');

  if p_payment_id is null then raise exception 'Paiement manquant'; end if;
  if p_status not in ('paid','failed','cancelled','refunded') then
    raise exception 'Statut de paiement invalide';
  end if;

  select * into v_payment
  from public.payments
  where id=p_payment_id
  for update;

  if v_payment.id is null then raise exception 'Paiement introuvable'; end if;

  v_old_status := v_payment.status;

  update public.payments
  set status=p_status,
      paid_at=case when p_status='paid' then coalesce(paid_at,now()) else paid_at end,
      metadata=coalesce(metadata,'{}'::jsonb)
        || case when p_note is null then '{}'::jsonb else jsonb_build_object('admin_note',p_note) end,
      updated_at=now()
  where id=p_payment_id
  returning * into v_payment;

  if p_status='paid' and v_payment.subscription_id is not null then
    if lower(coalesce(v_payment.billing_cycle,'monthly'))='yearly' then
      v_end:=v_start+interval '12 months';
    else
      v_end:=v_start+interval '1 month';
    end if;

    update public.subscriptions
    set status='active',
        current_period_start=v_start,
        current_period_end=v_end,
        updated_at=now()
    where id=v_payment.subscription_id;
  end if;

  if v_old_status is distinct from p_status then
    insert into public.notifications(user_id,type,title,message,data,is_read,created_at)
    values(
      v_payment.user_id,'payment','Mise à jour du paiement',
      concat('Votre paiement ',coalesce(v_payment.reference,v_payment.id::text),' est maintenant : ',p_status,'.'),
      jsonb_build_object('payment_id',v_payment.id,'status',p_status),false,now()
    );
  end if;

  perform public.write_admin_audit_log(
    'payment.status_update','payment',v_payment.id,v_payment.user_id,
    jsonb_build_object('from',v_old_status,'to',p_status,'note',p_note)
  );

  return v_payment;
end;
$$;

revoke all on function public.admin_validate_payment(uuid,text,text) from public, anon;
grant execute on function public.admin_validate_payment(uuid,text,text) to authenticated;


-- ============================================================
-- 7) RPC PARAMÈTRES
-- ============================================================

create or replace function public.update_kora_setting(
  p_key text,
  p_value jsonb
)
returns public.app_settings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_setting public.app_settings;
  v_numeric numeric;
begin
  -- settings.manage n'est pas exposée aux associés par défaut.
  -- Le CEO/Super Admin conserve la gestion complète.
  if not public.is_super_admin() then
    raise exception 'Seul le Super Admin peut modifier les paramètres'
      using errcode='42501';
  end if;

  if p_key is null or length(trim(p_key))=0 or p_value is null then
    raise exception 'Paramètre invalide';
  end if;

  if trim(p_key)='commission_rate' then
    begin
      v_numeric:=(p_value #>> '{}')::numeric;
    exception when others then
      raise exception 'La commission doit être un nombre';
    end;

    if v_numeric<0 or v_numeric>100 then
      raise exception 'La commission doit être comprise entre 0 et 100';
    end if;
  end if;

  update public.app_settings
  set value=p_value,updated_by=auth.uid()
  where key=trim(p_key)
  returning * into v_setting;

  if not found then
    insert into public.app_settings(key,value,description,is_public,updated_by)
    values(trim(p_key),p_value,'Paramètre créé depuis KORA',true,auth.uid())
    returning * into v_setting;
  end if;

  insert into public.admin_audit_logs(actor_id,action,entity_type,metadata)
  values(auth.uid(),'update_setting','app_setting',
    jsonb_build_object('key',v_setting.key,'value',v_setting.value));

  return v_setting;
end;
$$;

revoke all on function public.update_kora_setting(text,jsonb) from public, anon;
grant execute on function public.update_kora_setting(text,jsonb) to authenticated;


-- ============================================================
-- 8) RPC JOURNALISATION
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
declare v_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode='42501';
  end if;

  -- Un associé ne peut pas fabriquer directement des logs arbitraires.
  -- Les RPC métier autorisés écrivent eux-mêmes leurs logs.
  if not public.is_super_admin() then
    raise exception 'Journalisation interne uniquement pour les associés'
      using errcode='42501';
  end if;

  insert into public.admin_audit_logs(
    actor_id,action,entity_type,entity_id,target_user_id,metadata
  )
  values(
    auth.uid(),p_action,p_entity_type,p_entity_id,p_target_user_id,
    coalesce(p_metadata,'{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_admin_audit_log(text,text,uuid,uuid,jsonb) from public, anon;
grant execute on function public.write_admin_audit_log(text,text,uuid,uuid,jsonb) to authenticated;


-- ============================================================
-- 9) LECTURE DES PARAMÈTRES
-- ============================================================

create or replace function public.get_kora_settings()
returns table (
  key text,
  value jsonb,
  description text,
  is_public boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin() and not public.is_super_admin() then
    perform public.admin_require_permission('settings.read');
  end if;

  return query
  select s.key,s.value,s.description,s.is_public,s.updated_at
  from public.app_settings s
  where not public.is_admin()
     or public.is_super_admin()
     or public.admin_has_permission('settings.read')
  order by s.key;
end;
$$;

revoke all on function public.get_kora_settings() from public;
grant execute on function public.get_kora_settings() to anon, authenticated;


-- ============================================================
-- 10) GESTION DES PROFILS D'ADMINISTRATEURS
-- ============================================================

-- Déjà Super Admin uniquement, mais on ajoute une permission explicite
-- pour documenter le contrôle métier.
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
    raise exception 'Seul le Super Admin peut gérer les administrateurs'
      using errcode='42501';
  end if;

  if p_user_id is null or p_user_id=auth.uid() then
    raise exception 'Le compte Super Admin actuel ne peut pas être reconfiguré ici';
  end if;

  if p_access_level not in ('super_admin','associate') then
    raise exception 'Niveau administrateur invalide';
  end if;

  select role into v_target_role from public.profiles where id=p_user_id;
  if v_target_role is distinct from 'admin' then
    raise exception 'La cible doit être un compte administrateur';
  end if;

  insert into public.admin_access_profiles(
    user_id,access_level,permissions,max_users,max_payment_validations,
    access_expires_at,scope,is_active,created_by,updated_by
  )
  values(
    p_user_id,p_access_level,coalesce(p_permissions,'{}'::jsonb),
    p_max_users,p_max_payment_validations,p_access_expires_at,
    coalesce(p_scope,'{}'::jsonb),coalesce(p_is_active,true),auth.uid(),auth.uid()
  )
  on conflict(user_id) do update
  set access_level=excluded.access_level,
      permissions=excluded.permissions,
      max_users=excluded.max_users,
      max_payment_validations=excluded.max_payment_validations,
      access_expires_at=excluded.access_expires_at,
      scope=excluded.scope,
      is_active=excluded.is_active,
      updated_by=auth.uid(),
      updated_at=now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.set_admin_access_profile(uuid,text,jsonb,integer,integer,timestamptz,jsonb,boolean) from public, anon;
grant execute on function public.set_admin_access_profile(uuid,text,jsonb,integer,integer,timestamptz,jsonb,boolean) to authenticated;


-- ============================================================
-- 11) INVITATIONS : DÉJÀ SUPER ADMIN UNIQUEMENT
-- ============================================================

-- On renforce aussi la protection des invitations par une policy
-- restrictive en complément des policies existantes.
alter table public.admin_invitations enable row level security;

drop policy if exists admin_permissions_invitations
  on public.admin_invitations;

create policy admin_permissions_invitations
on public.admin_invitations
as restrictive
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());


commit;
