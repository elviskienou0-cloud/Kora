-- KORA: brouillon SQL pour les droits FREE / PRO / BUSINESS.
-- Ce fichier est volontairement hors de supabase/migrations:
-- créer une vraie migration avec `supabase migration new business_plan_entitlements`,
-- puis y déplacer ce contenu après revue locale.
-- Ne pas exécuter directement sur la base de production sans revue et tests.

begin;

-- Les cartes affichent les avantages cumulés de chaque formule.
update public.plans
set features = '["Profil talent", "Portfolio et médias", "Gestion du cachet", "Profil manager", "Messagerie"]'::jsonb,
    updated_at = now()
where id = 'FREE';

update public.plans
set features = '["Profil talent", "Portfolio et médias", "Gestion du cachet", "Profil manager", "Messagerie", "Gestion des talents", "Gestion des demandes", "Notifications", "Tableau de bord simplifié"]'::jsonb,
    updated_at = now()
where id = 'PRO';

update public.plans
set features = '["Profil talent", "Portfolio et médias", "Gestion du cachet", "Profil manager", "Messagerie", "Gestion des talents", "Gestion des demandes", "Notifications", "Tableau de bord simplifié", "Gestion des projets", "Organisation du portefeuille de talents", "Tableau de bord analytique avancé", "Statistiques détaillées", "Analyse des performances des talents", "Gestion collaborative", "Invitation de collaborateurs", "Gestion des membres de l'équipe", "Permissions personnalisées", "Modification et révocation des accès", "Génération de rapports d'activité", "Export des données en PDF", "Export des données en Excel"]'::jsonb,
    updated_at = now()
where id = 'BUSINESS';

-- 1) Source serveur de vérité des droits d'abonnement.
create or replace function public.get_my_manager_plan_access()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_plan_id text;
  v_active boolean := false;
begin
  if v_user is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_user and coalesce(p.is_suspended, false)) then
    raise exception 'Compte suspendu' using errcode = '42501';
  end if;
  if public.get_my_role() is distinct from 'manager' then
    raise exception 'Compte manager actif requis' using errcode = '42501';
  end if;

  v_sub := public.ensure_my_manager_subscription();
  v_plan_id := upper(coalesce(v_sub.plan_id, v_sub.plan, 'FREE'));
  v_active := v_sub.status in ('trialing', 'active')
    and (
      coalesce(
        case when v_sub.status = 'trialing' then v_sub.trial_end end,
        v_sub.current_period_end,
        v_sub.ends_at
      ) is null
      or coalesce(
        case when v_sub.status = 'trialing' then v_sub.trial_end end,
        v_sub.current_period_end,
        v_sub.ends_at
      ) > now()
    );

  select * into v_plan
  from public.plans
  where id = v_plan_id and is_active = true
  limit 1;

  if v_plan.id is null then
    v_plan_id := 'FREE';
    select * into v_plan
    from public.plans
    where id = 'FREE' and is_active = true
    limit 1;
  end if;

  return jsonb_build_object(
    'plan_id', v_plan_id,
    'plan_name', coalesce(v_plan.name, 'Gratuit'),
    'status', coalesce(v_sub.status, 'expired'),
    'active', v_active,
    'talent_limit', v_plan.talent_limit,
    'features', coalesce(v_plan.features, '[]'::jsonb),
    'can_manage_talents', v_active,
    'can_use_messaging', v_active,
    'can_manage_requests', v_active and v_plan_id in ('PRO', 'BUSINESS'),
    'can_view_notifications', v_active and v_plan_id in ('PRO', 'BUSINESS'),
    'can_view_simple_dashboard', v_active and v_plan_id in ('PRO', 'BUSINESS'),
    'can_manage_projects', v_active and v_plan_id = 'BUSINESS',
    'can_view_advanced_analytics', v_active and v_plan_id = 'BUSINESS',
    'can_manage_team', v_active and v_plan_id = 'BUSINESS',
    'can_export_reports', v_active and v_plan_id = 'BUSINESS',
    'business_badge', v_active and v_plan_id = 'BUSINESS'
  );
end;
$$;

revoke all on function public.get_my_manager_plan_access() from public, anon;
grant execute on function public.get_my_manager_plan_access() to authenticated;

-- Ne pas lire plans.features comme un objet de booléens: il s'agit d'une liste JSON.
-- Les droits sont déterminés par le plan actif et cette matrice explicite.
create or replace function public.manager_has_feature(p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_suspended boolean := false;
  v_plan_id text;
  v_status text;
  v_expiry timestamptz;
begin
  if auth.uid() is null or nullif(trim(coalesce(p_feature, '')), '') is null then
    return false;
  end if;

  select role, coalesce(is_suspended, false)
  into v_role, v_suspended
  from public.profiles
  where id = auth.uid();

  if v_role is distinct from 'manager' or v_suspended then
    return false;
  end if;

  select
    upper(coalesce(s.plan_id, s.plan, 'FREE')),
    s.status,
    case when s.status = 'trialing'
      then coalesce(s.trial_end, s.current_period_end, s.ends_at)
      else coalesce(s.current_period_end, s.ends_at)
    end
  into v_plan_id, v_status, v_expiry
  from public.subscriptions s
  where s.user_id = auth.uid()
  order by s.created_at desc
  limit 1;

  if v_plan_id is null
     or v_status not in ('trialing', 'active')
     or (v_expiry is not null and v_expiry <= now()) then
    return false;
  end if;

  return case lower(trim(p_feature))
    when 'talents' then true
    when 'messaging' then true
    when 'requests' then v_plan_id in ('PRO', 'BUSINESS')
    when 'notifications' then v_plan_id in ('PRO', 'BUSINESS')
    when 'simple_dashboard' then v_plan_id in ('PRO', 'BUSINESS')
    when 'projects' then v_plan_id = 'BUSINESS'
    when 'analytics' then v_plan_id = 'BUSINESS'
    when 'team' then v_plan_id = 'BUSINESS'
    when 'reports' then v_plan_id = 'BUSINESS'
    else false
  end;
end;
$$;

revoke all on function public.manager_has_feature(text) from public, anon;
grant execute on function public.manager_has_feature(text) to authenticated;

-- 2) RLS: les demandes manager sont PRO/BUSINESS uniquement.
drop policy if exists requests_select on public.requests;
create policy requests_select
on public.requests
for select
to authenticated
using (
  client_id = (select auth.uid())
  or (
    manager_id = (select auth.uid())
    and (select public.manager_has_feature('requests'))
  )
  or public.is_super_admin()
  or public.admin_has_permission('requests.read')
);

-- Un manager PRO peut lire les projets liés à ses demandes.
-- La gestion directe des projets (lecture hors demande et modification) est BUSINESS.
drop policy if exists projects_select on public.projects;
create policy projects_select
on public.projects
for select
to authenticated
using (
  client_id = (select auth.uid())
  or (
    manager_id = (select auth.uid())
    and (select public.manager_has_feature('projects'))
  )
  or (
    (select public.manager_has_feature('requests'))
    and exists (
      select 1
      from public.requests r
      where r.project_id = projects.id
        and r.manager_id = (select auth.uid())
    )
  )
  or public.is_super_admin()
  or public.admin_has_permission('projects.read')
);

drop policy if exists projects_update on public.projects;
create policy projects_update
on public.projects
for update
to authenticated
using (
  public.is_admin()
  or client_id = (select auth.uid())
  or (
    manager_id = (select auth.uid())
    and (select public.manager_has_feature('projects'))
  )
)
with check (
  public.is_admin()
  or client_id = (select auth.uid())
  or (
    manager_id = (select auth.uid())
    and (select public.manager_has_feature('projects'))
  )
);

-- Les notifications de paiement et d'invitation restent accessibles à FREE.
-- Les notifications fonctionnelles sont réservées à PRO/BUSINESS.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select
on public.notifications
for select
to authenticated
using (
  (
    user_id = (select auth.uid())
    and (
      public.get_my_role() <> 'manager'
      or (select public.manager_has_feature('notifications'))
      or type in ('payment', 'team_invitation', 'subscription')
    )
  )
  or public.is_admin()
);

-- Le statut des demandes est une action PRO/BUSINESS, même en appel RPC direct.
create or replace function public.update_request_status(
  p_request_id uuid,
  p_status text
)
returns public.requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_manager_id uuid := auth.uid();
  v_request public.requests%rowtype;
  v_project_title text;
begin
  if v_manager_id is null then
    raise exception 'Utilisateur non authentifié' using errcode = '42501';
  end if;
  if public.get_my_role() is distinct from 'manager' then
    raise exception 'Compte manager requis' using errcode = '42501';
  end if;
  if not public.manager_has_feature('requests') then
    raise exception 'La gestion des demandes est réservée aux plans PRO et BUSINESS.' using errcode = '42501';
  end if;
  if p_status not in ('accepted', 'rejected') then
    raise exception 'Statut invalide. Utilisez accepted ou rejected';
  end if;

  select * into v_request
  from public.requests
  where id = p_request_id and manager_id = v_manager_id
  for update;

  if v_request.id is null then
    raise exception 'Demande introuvable ou inaccessible';
  end if;
  if lower(coalesce(v_request.status, 'pending')) not in ('pending', 'open') then
    raise exception 'Cette demande a déjà été traitée';
  end if;

  update public.requests
  set status = p_status, updated_at = now()
  where id = p_request_id
  returning * into v_request;

  select title into v_project_title
  from public.projects
  where id = v_request.project_id;

  if p_status = 'accepted' then
    perform set_config('kora.workflow_context', 'accept_request', true);
    update public.projects
    set manager_id = v_manager_id,
        status = case when status in ('open', 'pending') then 'active' else status end,
        updated_at = now()
    where id = v_request.project_id;

    if not exists (
      select 1 from public.projects
      where id = v_request.project_id and manager_id = v_manager_id
    ) then
      raise exception 'La demande a été acceptée mais le projet n''a pas pu être assigné au manager';
    end if;
    perform set_config('kora.workflow_context', '', true);
  end if;

  insert into public.notifications (
    user_id, type, title, message, link, is_read, created_at, data
  )
  values (
    v_request.client_id,
    case when p_status = 'accepted' then 'request_accepted' else 'request_rejected' end,
    case when p_status = 'accepted' then 'Demande acceptée' else 'Demande refusée' end,
    case
      when p_status = 'accepted' then
        'Votre demande' || case when v_project_title is not null then ' « ' || v_project_title || ' »' else '' end || ' a été acceptée.'
      else
        'Votre demande' || case when v_project_title is not null then ' « ' || v_project_title || ' »' else '' end || ' a été refusée.'
    end,
    '/client/requests/' || v_request.id,
    false,
    now(),
    jsonb_build_object('request_id', v_request.id, 'project_id', v_request.project_id, 'status', p_status, 'manager_id', v_manager_id)
  );

  return v_request;
end;
$$;

revoke all on function public.update_request_status(uuid, text) from public, anon;
grant execute on function public.update_request_status(uuid, text) to authenticated;

-- Les deux RPC projet préservent le workflow historique (demande acceptée,
-- transitions terminales et notification client), mais les managers doivent
-- avoir BUSINESS. Les administrateurs conservent leur voie d'administration.
create or replace function public.manager_update_project_status(
  p_project_id uuid,
  p_status text
)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_manager_id uuid := auth.uid();
  v_project public.projects%rowtype;
  v_request public.requests%rowtype;
begin
  if v_manager_id is null then
    raise exception 'Utilisateur non authentifié' using errcode = '42501';
  end if;

  if public.get_my_role() <> 'manager' and not public.is_admin() then
    raise exception 'Accès manager requis' using errcode = '42501';
  end if;

  if public.get_my_role() = 'manager' and not public.manager_has_feature('projects') then
    raise exception 'La gestion des projets est réservée au plan BUSINESS.' using errcode = '42501';
  end if;

  if p_project_id is null then
    raise exception 'Projet manquant';
  end if;

  if p_status not in ('active', 'completed', 'cancelled') then
    raise exception 'Statut de projet invalide';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id and manager_id = v_manager_id
  for update;

  if v_project.id is null then
    raise exception 'Projet introuvable ou non assigné à ce manager';
  end if;

  select * into v_request
  from public.requests
  where project_id = p_project_id
    and manager_id = v_manager_id
    and status = 'accepted'
  order by created_at desc
  limit 1;

  if v_request.id is null then
    raise exception 'Le projet doit provenir d''une demande acceptée';
  end if;

  if v_project.status = 'completed' and p_status <> 'completed' then
    raise exception 'Un projet terminé ne peut pas être réactivé ou annulé';
  end if;

  if v_project.status = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'Un projet annulé ne peut pas être réactivé';
  end if;

  update public.projects
  set status = p_status, updated_at = now()
  where id = p_project_id
  returning * into v_project;

  if p_status = 'completed' then
    insert into public.notifications (
      user_id, type, title, message, data, is_read, created_at
    )
    values (
      v_project.client_id,
      'request',
      'Projet terminé',
      concat('Le projet « ', v_project.title, ' » a été marqué comme terminé.'),
      jsonb_build_object('project_id', v_project.id),
      false,
      now()
    );
  end if;

  return v_project;
end;
$$;

revoke all on function public.manager_update_project_status(uuid, text) from public, anon;
grant execute on function public.manager_update_project_status(uuid, text) to authenticated;

create or replace function public.manager_update_project_status_v2(
  p_project_id uuid,
  p_status text
)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  return public.manager_update_project_status(p_project_id, p_status);
end;
$$;

revoke all on function public.manager_update_project_status_v2(uuid, text) from public, anon;
grant execute on function public.manager_update_project_status_v2(uuid, text) to authenticated;

-- 3) Collaboration BUSINESS, avec invitations à des comptes Manager KORA existants.
create table if not exists public.manager_team_members (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  permissions jsonb not null default '{"analytics.read": true, "reports.export": false}'::jsonb,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manager_team_members_unique unique (manager_id, member_id),
  constraint manager_team_members_not_self check (manager_id <> member_id)
);

create table if not exists public.manager_team_invitations (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  invited_email text not null,
  permissions jsonb not null default '{"analytics.read": true, "reports.export": false}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint manager_team_invitations_not_self check (manager_id <> invited_user_id)
);

create unique index if not exists manager_team_one_pending_invite
on public.manager_team_invitations(manager_id, invited_user_id)
where status = 'pending';

create index if not exists manager_team_members_member_idx
on public.manager_team_members(member_id, status);

alter table public.manager_team_members enable row level security;
alter table public.manager_team_invitations enable row level security;
revoke all on public.manager_team_members from anon, authenticated;
revoke all on public.manager_team_invitations from anon, authenticated;

create or replace function public.get_my_manager_team_context()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_can_manage boolean;
begin
  if v_user is null or public.get_my_role() not in ('manager', 'client') then
    raise exception 'Compte KORA requis' using errcode = '42501';
  end if;

  v_can_manage := public.get_my_role() = 'manager' and public.manager_has_feature('team');

  return jsonb_build_object(
    'can_manage_team', v_can_manage,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'member_id', m.member_id,
        'name', p.name,
        'permissions', m.permissions,
        'status', m.status,
        'created_at', m.created_at
      ) order by m.created_at desc)
      from public.manager_team_members m
      join public.profiles p on p.id = m.member_id
      where m.manager_id = v_user
    ), '[]'::jsonb),
    'outgoing_invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'email', i.invited_email,
        'permissions', i.permissions,
        'created_at', i.created_at
      ) order by i.created_at desc)
      from public.manager_team_invitations i
      where i.manager_id = v_user and i.status = 'pending'
    ), '[]'::jsonb),
    'incoming_invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'manager_id', i.manager_id,
        'manager_name', p.name,
        'permissions', i.permissions,
        'created_at', i.created_at
      ) order by i.created_at desc)
      from public.manager_team_invitations i
      join public.profiles p on p.id = i.manager_id
      where i.invited_user_id = v_user and i.status = 'pending'
    ), '[]'::jsonb),
    'workspaces', coalesce((
      select jsonb_agg(jsonb_build_object(
        'manager_id', m.manager_id,
        'manager_name', p.name,
        'permissions', m.permissions
      ) order by m.created_at desc)
      from public.manager_team_members m
      join public.profiles p on p.id = m.manager_id
      where m.member_id = v_user and m.status = 'active'
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.manager_invite_team_member(
  p_email text,
  p_permissions jsonb default '{"analytics.read": true, "reports.export": false}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_invited_user uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_permissions jsonb;
  v_invitation uuid;
begin
  if v_user is null or public.get_my_role() is distinct from 'manager'
     or not public.manager_has_feature('team') then
    raise exception 'La gestion d’équipe est réservée à BUSINESS.' using errcode = '42501';
  end if;
  if v_email = '' or length(v_email) > 254 or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Adresse e-mail invalide.';
  end if;

  select u.id into v_invited_user
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = v_email
    and p.role in ('manager', 'client')
    and coalesce(p.is_suspended, false) = false
  limit 1;

  if v_invited_user is null then
    raise exception 'Le collaborateur doit déjà posséder un compte KORA actif (Client ou Manager).';
  end if;
  if v_invited_user = v_user then
    raise exception 'Vous ne pouvez pas vous inviter vous-même.';
  end if;

  v_permissions := jsonb_build_object(
    'analytics.read', coalesce((p_permissions ->> 'analytics.read') = 'true', true),
    'reports.export', coalesce((p_permissions ->> 'reports.export') = 'true', false)
  );
  if (v_permissions ->> 'reports.export') = 'true'
     and (v_permissions ->> 'analytics.read') <> 'true' then
    raise exception 'L’export nécessite aussi le droit de consulter les analyses.';
  end if;

  if exists (
    select 1 from public.manager_team_members
    where manager_id = v_user and member_id = v_invited_user and status = 'active'
  ) then
    raise exception 'Ce compte fait déjà partie de votre équipe.';
  end if;

  select id into v_invitation
  from public.manager_team_invitations
  where manager_id = v_user and invited_user_id = v_invited_user and status = 'pending'
  limit 1;

  if v_invitation is not null then
    update public.manager_team_invitations
    set invited_email = v_email, permissions = v_permissions, created_at = now()
    where id = v_invitation;
    return v_invitation;
  end if;

  insert into public.manager_team_invitations (
    manager_id, invited_user_id, invited_email, permissions, status
  )
  values (v_user, v_invited_user, v_email, v_permissions, 'pending')
  returning id into v_invitation;

  insert into public.notifications(user_id, type, title, message, link, data)
  values (
    v_invited_user,
    'team_invitation',
    'Invitation à rejoindre une équipe KORA',
    'Un manager vous invite à collaborer sur ses analyses et rapports.',
    '/manager/team',
    jsonb_build_object('invitation_id', v_invitation, 'manager_id', v_user)
  );

  return v_invitation;
end;
$$;

create or replace function public.manager_accept_team_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.manager_team_invitations%rowtype;
begin
  if v_user is null or public.get_my_role() not in ('manager', 'client') then
    raise exception 'Un compte KORA est nécessaire.' using errcode = '42501';
  end if;

  select * into v_invite
  from public.manager_team_invitations
  where id = p_invitation_id
    and invited_user_id = v_user
    and status = 'pending'
  for update;

  if v_invite.id is null then
    raise exception 'Invitation introuvable ou déjà traitée.';
  end if;

  if not exists (
    select 1 from public.subscriptions s
    join public.profiles owner_profile on owner_profile.id = s.user_id
    where s.user_id = v_invite.manager_id
      and not coalesce(owner_profile.is_suspended, false)
      and upper(coalesce(s.plan_id, s.plan, '')) = 'BUSINESS'
      and s.status in ('active', 'trialing')
      and (coalesce(s.current_period_end, s.ends_at) is null
           or coalesce(s.current_period_end, s.ends_at) > now())
  ) then
    raise exception 'L’abonnement BUSINESS du manager n’est plus actif.';
  end if;

  insert into public.manager_team_members(manager_id, member_id, permissions, status)
  values (v_invite.manager_id, v_user, v_invite.permissions, 'active')
  on conflict (manager_id, member_id)
  do update set permissions = excluded.permissions, status = 'active', updated_at = now();

  update public.manager_team_invitations
  set status = 'accepted', responded_at = now()
  where id = v_invite.id;

  return true;
end;
$$;

create or replace function public.manager_decline_team_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.manager_team_invitations
  set status = 'declined', responded_at = now()
  where id = p_invitation_id
    and invited_user_id = auth.uid()
    and status = 'pending';
  return found;
end;
$$;

create or replace function public.manager_update_team_member_permissions(
  p_member_id uuid,
  p_permissions jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_permissions jsonb;
begin
  if v_user is null or not public.manager_has_feature('team') then
    raise exception 'La gestion d’équipe est réservée à BUSINESS.' using errcode = '42501';
  end if;

  v_permissions := jsonb_build_object(
    'analytics.read', coalesce((p_permissions ->> 'analytics.read') = 'true', false),
    'reports.export', coalesce((p_permissions ->> 'reports.export') = 'true', false)
  );
  if (v_permissions ->> 'reports.export') = 'true'
     and (v_permissions ->> 'analytics.read') <> 'true' then
    raise exception 'L’export nécessite aussi le droit de consulter les analyses.';
  end if;

  update public.manager_team_members
  set permissions = v_permissions, updated_at = now()
  where id = p_member_id and manager_id = v_user;
  return found;
end;
$$;

create or replace function public.manager_remove_team_member(p_member_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'manager' then
    raise exception 'Compte manager requis.' using errcode = '42501';
  end if;
  -- Le propriétaire garde toujours le droit de révoquer un accès déjà accordé,
  -- même après une rétrogradation ou l'expiration de son abonnement.
  delete from public.manager_team_members
  where id = p_member_id and manager_id = auth.uid();
  return found;
end;
$$;

create or replace function public.manager_revoke_team_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'manager' then
    raise exception 'Compte manager requis.' using errcode = '42501';
  end if;
  update public.manager_team_invitations
  set status = 'revoked', responded_at = now()
  where id = p_invitation_id
    and manager_id = auth.uid()
    and status = 'pending';
  return found;
end;
$$;

create or replace function public.get_manager_analytics(p_manager_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_allowed boolean := false;
  v_owner_business boolean := false;
  v_can_export boolean := false;
begin
  if v_user is null or p_manager_id is null
     or exists (select 1 from public.profiles p where p.id = v_user and coalesce(p.is_suspended, false)) then
    raise exception 'Connexion requise ou compte suspendu.' using errcode = '42501';
  end if;

  v_owner_business := p_manager_id = v_user and public.manager_has_feature('analytics');
  v_allowed := v_owner_business or exists (
    select 1
    from public.manager_team_members m
    where m.manager_id = p_manager_id
      and m.member_id = v_user
      and m.status = 'active'
      and coalesce((m.permissions ->> 'analytics.read')::boolean, false)
      and exists (
        select 1 from public.subscriptions s
        join public.profiles owner_profile on owner_profile.id = s.user_id
        where s.user_id = p_manager_id
          and not coalesce(owner_profile.is_suspended, false)
          and upper(coalesce(s.plan_id, s.plan, '')) = 'BUSINESS'
          and s.status in ('active', 'trialing')
          and (coalesce(s.current_period_end, s.ends_at) is null
               or coalesce(s.current_period_end, s.ends_at) > now())
      )
  );

  if not v_allowed then
    raise exception 'Accès aux analyses BUSINESS non autorisé.' using errcode = '42501';
  end if;

  v_can_export := (p_manager_id = v_user and public.manager_has_feature('reports'))
    or exists (
      select 1 from public.manager_team_members m
      where m.manager_id = p_manager_id
        and m.member_id = v_user
        and m.status = 'active'
        and coalesce((m.permissions ->> 'reports.export')::boolean, false)
    );

  return jsonb_build_object(
    'can_export_reports', v_can_export,
    'total_talents', (select count(*) from public.talent_profiles where managed_by = p_manager_id),
    'total_requests', (select count(*) from public.requests where manager_id = p_manager_id),
    'pending_requests', (select count(*) from public.requests where manager_id = p_manager_id and lower(status) in ('pending', 'open', 'en_attente')),
    'accepted_requests', (select count(*) from public.requests where manager_id = p_manager_id and lower(status) in ('accepted', 'acceptee')),
    'rejected_requests', (select count(*) from public.requests where manager_id = p_manager_id and lower(status) in ('rejected', 'refused', 'refusee')),
    'total_projects', (select count(*) from public.projects where manager_id = p_manager_id),
    'active_projects', (select count(*) from public.projects where manager_id = p_manager_id and lower(status) in ('active', 'in_progress')),
    'completed_projects', (select count(*) from public.projects where manager_id = p_manager_id and lower(status) = 'completed'),
    'talent_performance', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'name', trim(concat_ws(' ', t.first_name, t.last_name)),
        'category', c.name,
        'rating', t.rating,
        'reviews_count', t.reviews_count,
        'completed_projects', t.completed_projects
      ) order by t.completed_projects desc, t.reviews_count desc, t.rating desc)
      from public.talent_profiles t
      left join public.categories c on c.id = t.category_id
      where t.managed_by = p_manager_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.get_manager_report_data(p_manager_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_allowed boolean := false;
begin
  if v_user is null or p_manager_id is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;

  v_allowed := (p_manager_id = v_user and public.manager_has_feature('reports'))
    or exists (
      select 1
      from public.manager_team_members m
      where m.manager_id = p_manager_id
        and m.member_id = v_user
        and m.status = 'active'
        and coalesce((m.permissions ->> 'reports.export')::boolean, false)
        and exists (
          select 1 from public.subscriptions s
          where s.user_id = p_manager_id
            and upper(coalesce(s.plan_id, s.plan, '')) = 'BUSINESS'
            and s.status in ('active', 'trialing')
            and (coalesce(s.current_period_end, s.ends_at) is null
                 or coalesce(s.current_period_end, s.ends_at) > now())
        )
    );

  if not v_allowed then
    raise exception 'Export des rapports BUSINESS non autorisé.' using errcode = '42501';
  end if;

  return public.get_manager_analytics(p_manager_id);
end;
$$;

revoke all on function public.get_my_manager_team_context() from public, anon;
revoke all on function public.manager_invite_team_member(text, jsonb) from public, anon;
revoke all on function public.manager_accept_team_invitation(uuid) from public, anon;
revoke all on function public.manager_decline_team_invitation(uuid) from public, anon;
revoke all on function public.manager_update_team_member_permissions(uuid, jsonb) from public, anon;
revoke all on function public.manager_remove_team_member(uuid) from public, anon;
revoke all on function public.manager_revoke_team_invitation(uuid) from public, anon;
revoke all on function public.get_manager_analytics(uuid) from public, anon;
revoke all on function public.get_manager_report_data(uuid) from public, anon;

grant execute on function public.get_my_manager_team_context() to authenticated;
grant execute on function public.manager_invite_team_member(text, jsonb) to authenticated;
grant execute on function public.manager_accept_team_invitation(uuid) to authenticated;
grant execute on function public.manager_decline_team_invitation(uuid) to authenticated;
grant execute on function public.manager_update_team_member_permissions(uuid, jsonb) to authenticated;
grant execute on function public.manager_remove_team_member(uuid) to authenticated;
grant execute on function public.manager_revoke_team_invitation(uuid) to authenticated;
grant execute on function public.get_manager_analytics(uuid) to authenticated;
grant execute on function public.get_manager_report_data(uuid) to authenticated;

commit;
