-- KORA auth/session and RLS hardening
-- Applied to production project before committing this migration.
-- Purpose: remove broad non-admin policies and split anonymous/public access
-- so invalid sessions and RLS cannot expose private rows.

drop policy if exists admin_permissions_audit_logs_select on public.admin_audit_logs;
drop policy if exists admin_permissions_audit_logs_write on public.admin_audit_logs;
drop policy if exists admin_permissions_messages_select on public.messages;
drop policy if exists admin_permissions_messages_write on public.messages;
drop policy if exists admin_permissions_payments_select on public.payments;
drop policy if exists admin_permissions_payments_write on public.payments;
drop policy if exists admin_permissions_profiles_select on public.profiles;
drop policy if exists admin_permissions_profiles_write on public.profiles;
drop policy if exists admin_permissions_projects_select on public.projects;
drop policy if exists admin_permissions_projects_write on public.projects;
drop policy if exists admin_permissions_reports_select on public.reports;
drop policy if exists admin_permissions_reports_write on public.reports;
drop policy if exists admin_permissions_requests_select on public.requests;
drop policy if exists admin_permissions_requests_write on public.requests;
drop policy if exists admin_permissions_subscriptions_select on public.subscriptions;
drop policy if exists admin_permissions_subscriptions_write on public.subscriptions;
drop policy if exists admin_permissions_talents_select on public.talent_profiles;
drop policy if exists admin_permissions_talents_write on public.talent_profiles;

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
for select to authenticated
using (
  is_conversation_member(conversation_id)
  or is_super_admin()
  or admin_has_permission('messages.read')
);

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or is_super_admin()
  or admin_has_permission('users.read')
  or (role = 'manager' and admin_has_permission('managers.read'))
  or (role = 'client' and admin_has_permission('clients.read'))
  or (role in ('admin','superadmin') and admin_has_permission('users.read'))
);

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
for select to authenticated
using (
  client_id = auth.uid()
  or manager_id = auth.uid()
  or is_super_admin()
  or admin_has_permission('projects.read')
);

drop policy if exists requests_select_admin on public.requests;
create policy requests_select_admin on public.requests
for select to authenticated
using (
  is_super_admin()
  or admin_has_permission('requests.read')
);

drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin on public.reports
for select to authenticated
using (
  reporter_id = auth.uid()
  or is_super_admin()
  or admin_has_permission('moderation.read')
);

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
for select to authenticated
using (
  user_id = auth.uid()
  or is_super_admin()
  or admin_has_permission('payments.read')
  or admin_has_permission('payments.validate')
);

drop policy if exists payments_admin_update on public.payments;
create policy payments_admin_update on public.payments
for update to authenticated
using (
  is_super_admin()
  or admin_has_permission('payments.validate')
)
with check (
  is_super_admin()
  or admin_has_permission('payments.validate')
);

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
for select to authenticated
using (
  user_id = auth.uid()
  or is_super_admin()
  or admin_has_permission('subscriptions.read')
  or admin_has_permission('subscriptions.manage')
);

drop policy if exists talent_public_select on public.talent_profiles;
create policy talent_public_select_anon
on public.talent_profiles
for select to anon
using (
  status = 'published'
  and is_visible = true
);

create policy talent_authenticated_select
on public.talent_profiles
for select to authenticated
using (
  (status = 'published' and is_visible = true)
  or managed_by = auth.uid()
  or is_super_admin()
  or admin_has_permission('talents.read')
);

drop policy if exists admin_audit_logs_select_admin on public.admin_audit_logs;
create policy admin_audit_logs_select_admin on public.admin_audit_logs
for select to authenticated
using (
  is_super_admin()
  or admin_has_permission('logs.read')
);

drop policy if exists announcements_public_select on public.announcements;
create policy announcements_public_select_anon
on public.announcements
for select to anon
using (is_published = true);
create policy announcements_public_select_authenticated
on public.announcements
for select to authenticated
using (is_published = true or is_admin());

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select_anon
on public.app_settings
for select to anon
using (is_public = true);
create policy app_settings_select_authenticated
on public.app_settings
for select to authenticated
using (is_public = true or is_admin());

drop policy if exists talent_skills_public_select on public.talent_profile_skills;
create policy talent_skills_public_select_anon
on public.talent_profile_skills
for select to anon
using (
  exists (
    select 1 from public.talent_profiles tp
    where tp.id = talent_profile_skills.talent_id
      and tp.status = 'published'
      and tp.is_visible = true
  )
);
create policy talent_skills_public_select_authenticated
on public.talent_profile_skills
for select to authenticated
using (
  exists (
    select 1 from public.talent_profiles tp
    where tp.id = talent_profile_skills.talent_id
      and (
        (tp.status = 'published' and tp.is_visible = true)
        or tp.managed_by = auth.uid()
        or is_admin()
      )
  )
);

drop policy if exists portfolio_public_select on public.portfolio_items;
create policy portfolio_public_select_anon
on public.portfolio_items
for select to anon
using (
  exists (
    select 1 from public.talent_profiles tp
    where tp.id = portfolio_items.talent_id
      and tp.status = 'published'
      and tp.is_visible = true
  )
);
create policy portfolio_public_select_authenticated
on public.portfolio_items
for select to authenticated
using (
  exists (
    select 1 from public.talent_profiles tp
    where tp.id = portfolio_items.talent_id
      and (
        (tp.status = 'published' and tp.is_visible = true)
        or tp.managed_by = auth.uid()
        or is_admin()
      )
  )
);

revoke execute on function public.admin_has_permission(text) from anon;
revoke execute on function public.get_my_admin_access() from anon;
revoke execute on function public.list_admin_access_profiles() from anon;
revoke execute on function public.update_kora_setting(text, jsonb) from anon;
revoke execute on function public.create_manager_talent(text, text, text, uuid, text, numeric, text) from anon;
revoke execute on function public.create_manager_talent(uuid, text, text, text, text, uuid, uuid, text, boolean) from anon;
revoke execute on function public.enforce_manager_talent_limit() from anon;
revoke execute on function public.set_app_settings_updated_at() from anon, authenticated;
revoke execute on function public.protect_message_immutable() from anon, authenticated;
revoke execute on function public.protect_talent_profile_fields() from anon, authenticated;
revoke execute on function public.is_admin() from anon;
