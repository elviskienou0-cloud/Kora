-- KORA prelaunch RLS cleanup + initPlan optimization
-- Applied to the linked Supabase project.
-- Keeps access semantics while removing redundant permissive policies,
-- duplicate notification indexes, and direct auth.uid() row-by-row evaluation.

drop index if exists public.idx_notifications_user_created;
drop index if exists public.idx_notifications_user_read_created;

drop policy if exists announcements_admin_all on public.announcements;
drop policy if exists announcements_admin_write on public.announcements;
drop policy if exists announcements_public_read on public.announcements;
drop policy if exists announcements_public_select_anon on public.announcements;
drop policy if exists announcements_public_select_authenticated on public.announcements;

create policy announcements_public_select_anon
on public.announcements for select to anon
using (
  is_published = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy announcements_authenticated_select
on public.announcements for select to authenticated
using (
  (
    is_published = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  )
  or is_admin()
);

create policy announcements_admin_insert
on public.announcements for insert to authenticated
with check (is_admin());

create policy announcements_admin_update
on public.announcements for update to authenticated
using (is_admin())
with check (is_admin());

create policy announcements_admin_delete
on public.announcements for delete to authenticated
using (is_admin());

drop policy if exists admin_access_profiles_select_own_or_super on public.admin_access_profiles;
drop policy if exists admin_access_profiles_super_all on public.admin_access_profiles;

create policy admin_access_profiles_select
on public.admin_access_profiles for select to authenticated
using ((user_id = (select auth.uid())) or is_super_admin());

create policy admin_access_profiles_super_insert
on public.admin_access_profiles for insert to authenticated
with check (is_super_admin());

create policy admin_access_profiles_super_update
on public.admin_access_profiles for update to authenticated
using (is_super_admin())
with check (is_super_admin());

create policy admin_access_profiles_super_delete
on public.admin_access_profiles for delete to authenticated
using (is_super_admin());

drop policy if exists portfolio_manager_write on public.portfolio_items;

create policy portfolio_manager_insert
on public.portfolio_items for insert to authenticated
with check (is_talent_manager(talent_id) or is_admin());

create policy portfolio_manager_update
on public.portfolio_items for update to authenticated
using (is_talent_manager(talent_id) or is_admin())
with check (is_talent_manager(talent_id) or is_admin());

create policy portfolio_manager_delete
on public.portfolio_items for delete to authenticated
using (is_talent_manager(talent_id) or is_admin());

drop policy if exists project_talents_write on public.project_talents;

create policy project_talents_insert
on public.project_talents for insert to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_talents.project_id
      and ((p.manager_id = (select auth.uid())) or is_admin())
  )
);

create policy project_talents_update
on public.project_talents for update to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_talents.project_id
      and ((p.manager_id = (select auth.uid())) or is_admin())
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_talents.project_id
      and ((p.manager_id = (select auth.uid())) or is_admin())
  )
);

create policy project_talents_delete
on public.project_talents for delete to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_talents.project_id
      and ((p.manager_id = (select auth.uid())) or is_admin())
  )
);

drop policy if exists projects_manager_request_access on public.projects;
drop policy if exists projects_select on public.projects;

create policy projects_select
on public.projects for select to authenticated
using (
  (client_id = (select auth.uid()))
  or (manager_id = (select auth.uid()))
  or is_super_admin()
  or admin_has_permission('projects.read')
  or exists (
    select 1
    from public.requests r
    where r.project_id = projects.id
      and r.manager_id = (select auth.uid())
  )
);

drop policy if exists requests_select_admin on public.requests;
drop policy if exists requests_select_client on public.requests;
drop policy if exists requests_select_manager on public.requests;

create policy requests_select
on public.requests for select to authenticated
using (
  (client_id = (select auth.uid()))
  or (manager_id = (select auth.uid()))
  or is_super_admin()
  or admin_has_permission('requests.read')
);

drop policy if exists reviews_admin_write on public.reviews;
drop policy if exists reviews_client_own_read on public.reviews;
drop policy if exists reviews_public_read on public.reviews;

create policy reviews_public_read
on public.reviews for select to anon
using (
  is_visible = true
  and source = 'project_review'
  and client_id is not null
  and talent_id is not null
  and project_id is not null
);

create policy reviews_authenticated_select
on public.reviews for select to authenticated
using (
  (
    is_visible = true
    and source = 'project_review'
    and client_id is not null
    and talent_id is not null
    and project_id is not null
  )
  or client_id = (select auth.uid())
  or is_admin()
);

create policy reviews_admin_insert
on public.reviews for insert to authenticated
with check (is_admin());

create policy reviews_admin_update
on public.reviews for update to authenticated
using (is_admin())
with check (is_admin());

create policy reviews_admin_delete
on public.reviews for delete to authenticated
using (is_admin());

drop policy if exists skills_manager_write on public.skills;

create policy skills_manager_insert
on public.skills for insert to authenticated
with check (is_manager() or is_admin());

create policy skills_manager_update
on public.skills for update to authenticated
using (is_manager() or is_admin())
with check (is_manager() or is_admin());

create policy skills_manager_delete
on public.skills for delete to authenticated
using (is_manager() or is_admin());

drop policy if exists talent_skills_manager_write on public.talent_profile_skills;

create policy talent_skills_manager_insert
on public.talent_profile_skills for insert to authenticated
with check (is_talent_manager(talent_id) or is_admin());

create policy talent_skills_manager_update
on public.talent_profile_skills for update to authenticated
using (is_talent_manager(talent_id) or is_admin())
with check (is_talent_manager(talent_id) or is_admin());

create policy talent_skills_manager_delete
on public.talent_profile_skills for delete to authenticated
using (is_talent_manager(talent_id) or is_admin());

do $$
declare
  p record;
  new_qual text;
  new_check text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%auth.uid()%'
        or coalesce(with_check, '') like '%auth.uid()%'
      )
      and coalesce(qual, '') not like '%SELECT auth.uid()%'
      and coalesce(with_check, '') not like '%SELECT auth.uid()%'
  loop
    new_qual := case
      when p.qual is null then null
      else replace(p.qual, 'auth.uid()', '(select auth.uid())')
    end;

    new_check := case
      when p.with_check is null then null
      else replace(p.with_check, 'auth.uid()', '(select auth.uid())')
    end;

    if new_qual is not null and new_check is not null then
      execute format(
        'alter policy %I on %I.%I using (%s) with check (%s)',
        p.policyname, p.schemaname, p.tablename, new_qual, new_check
      );
    elsif new_qual is not null then
      execute format(
        'alter policy %I on %I.%I using (%s)',
        p.policyname, p.schemaname, p.tablename, new_qual
      );
    elsif new_check is not null then
      execute format(
        'alter policy %I on %I.%I with check (%s)',
        p.policyname, p.schemaname, p.tablename, new_check
      );
    end if;
  end loop;
end
$$;
