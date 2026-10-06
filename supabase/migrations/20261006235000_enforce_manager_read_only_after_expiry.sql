-- KORA: enforce manager read-only mode after subscription expiry.
-- Managers keep SELECT access after expiry, but all manager-owned writes
-- remain blocked at the database and Storage layers.

create or replace function public.manager_has_active_plan()
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_sub public.subscriptions%rowtype;
begin
  if v_user is null then return false; end if;

  select role into v_role
  from public.profiles
  where id = v_user;

  if v_role <> 'manager' then return false; end if;

  v_sub := public.ensure_my_manager_subscription();

  return v_sub.status in ('trialing', 'active')
    and (v_sub.current_period_end is null or v_sub.current_period_end > now());
end;
$function$;

revoke all on function public.manager_has_active_plan() from public, anon;
grant execute on function public.manager_has_active_plan() to authenticated;

create or replace function public.guard_manager_talent_profile_update()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  if auth.uid() is not null
     and old.managed_by = auth.uid()
     and public.get_my_role() = 'manager' then
    if new.id is distinct from old.id
       or new.managed_by is distinct from old.managed_by
       or new.verified is distinct from old.verified
       or new.status is distinct from old.status
       or new.is_visible is distinct from old.is_visible
       or new.rating is distinct from old.rating
       or new.reviews_count is distinct from old.reviews_count
       or new.completed_projects is distinct from old.completed_projects
       or new.created_at is distinct from old.created_at then
      raise exception 'Les champs de validation, visibilité et statistiques du talent sont réservés à KORA.';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.guard_manager_talent_profile_update() from public, anon, authenticated;

drop trigger if exists guard_manager_talent_profile_update on public.talent_profiles;
create trigger guard_manager_talent_profile_update
before update on public.talent_profiles
for each row
execute function public.guard_manager_talent_profile_update();

drop policy if exists talent_manager_delete on public.talent_profiles;
create policy talent_manager_delete on public.talent_profiles for delete to authenticated
using (is_admin() or (managed_by = (select auth.uid()) and public.manager_has_active_plan()));

drop policy if exists talent_manager_update on public.talent_profiles;
create policy talent_manager_update on public.talent_profiles for update to authenticated
using (is_admin() or (managed_by = (select auth.uid()) and public.manager_has_active_plan()))
with check (is_admin() or (managed_by = (select auth.uid()) and public.manager_has_active_plan()));

drop policy if exists portfolio_manager_insert on public.portfolio_items;
create policy portfolio_manager_insert on public.portfolio_items for insert to authenticated
with check (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()));

drop policy if exists portfolio_manager_update on public.portfolio_items;
create policy portfolio_manager_update on public.portfolio_items for update to authenticated
using (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()))
with check (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()));

drop policy if exists portfolio_manager_delete on public.portfolio_items;
create policy portfolio_manager_delete on public.portfolio_items for delete to authenticated
using (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()));

drop policy if exists project_talents_insert on public.project_talents;
create policy project_talents_insert on public.project_talents for insert to authenticated
with check (
  is_admin() or (
    exists (select 1 from public.projects p where p.id = project_talents.project_id and p.manager_id = (select auth.uid()))
    and public.manager_has_active_plan()
  )
);

drop policy if exists project_talents_update on public.project_talents;
create policy project_talents_update on public.project_talents for update to authenticated
using (
  is_admin() or (
    exists (select 1 from public.projects p where p.id = project_talents.project_id and p.manager_id = (select auth.uid()))
    and public.manager_has_active_plan()
  )
)
with check (
  is_admin() or (
    exists (select 1 from public.projects p where p.id = project_talents.project_id and p.manager_id = (select auth.uid()))
    and public.manager_has_active_plan()
  )
);

drop policy if exists project_talents_delete on public.project_talents;
create policy project_talents_delete on public.project_talents for delete to authenticated
using (
  is_admin() or (
    exists (select 1 from public.projects p where p.id = project_talents.project_id and p.manager_id = (select auth.uid()))
    and public.manager_has_active_plan()
  )
);

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
using (
  is_admin() or client_id = (select auth.uid()) or
  (manager_id = (select auth.uid()) and public.manager_has_active_plan())
)
with check (
  is_admin() or client_id = (select auth.uid()) or
  (manager_id = (select auth.uid()) and public.manager_has_active_plan())
);

drop policy if exists skills_manager_insert on public.skills;
create policy skills_manager_insert on public.skills for insert to authenticated
with check (is_admin() or (is_manager() and public.manager_has_active_plan()));

drop policy if exists skills_manager_update on public.skills;
create policy skills_manager_update on public.skills for update to authenticated
using (is_admin() or (is_manager() and public.manager_has_active_plan()))
with check (is_admin() or (is_manager() and public.manager_has_active_plan()));

drop policy if exists skills_manager_delete on public.skills;
create policy skills_manager_delete on public.skills for delete to authenticated
using (is_admin() or (is_manager() and public.manager_has_active_plan()));

drop policy if exists talent_skills_manager_insert on public.talent_profile_skills;
create policy talent_skills_manager_insert on public.talent_profile_skills for insert to authenticated
with check (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()));

drop policy if exists talent_skills_manager_update on public.talent_profile_skills;
create policy talent_skills_manager_update on public.talent_profile_skills for update to authenticated
using (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()))
with check (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()));

drop policy if exists talent_skills_manager_delete on public.talent_profile_skills;
create policy talent_skills_manager_delete on public.talent_profile_skills for delete to authenticated
using (is_admin() or (is_talent_manager(talent_id) and public.manager_has_active_plan()));

drop policy if exists invitations_insert on public.manager_talent_invitations;
create policy invitations_insert on public.manager_talent_invitations for insert to authenticated
with check (is_admin() or (manager_id = (select auth.uid()) and public.manager_has_active_plan()));

drop policy if exists invitations_update on public.manager_talent_invitations;
create policy invitations_update on public.manager_talent_invitations for update to authenticated
using (is_admin() or (manager_id = (select auth.uid()) and public.manager_has_active_plan()))
with check (is_admin() or (manager_id = (select auth.uid()) and public.manager_has_active_plan()));

drop policy if exists invitations_delete on public.manager_talent_invitations;
create policy invitations_delete on public.manager_talent_invitations for delete to authenticated
using (is_admin() or (manager_id = (select auth.uid()) and public.manager_has_active_plan()));

drop policy if exists verification_insert on public.verification_requests;
create policy verification_insert on public.verification_requests for insert to authenticated
with check (manager_id = (select auth.uid()) and is_manager() and public.manager_has_active_plan());

drop policy if exists "Managers upload talent profile media" on storage.objects;
create policy "Managers upload talent profile media" on storage.objects for insert to authenticated
with check (
  bucket_id = 'talent-profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(storage.objects.name, '/', 2)
      and tp.managed_by = (select auth.uid())
  )
  and public.manager_has_active_plan()
);

drop policy if exists "Managers update talent profile media" on storage.objects;
create policy "Managers update talent profile media" on storage.objects for update to authenticated
using (
  bucket_id = 'talent-profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(storage.objects.name, '/', 2)
      and tp.managed_by = (select auth.uid())
  )
  and public.manager_has_active_plan()
)
with check (
  bucket_id = 'talent-profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(storage.objects.name, '/', 2)
      and tp.managed_by = (select auth.uid())
  )
  and public.manager_has_active_plan()
);

drop policy if exists "Managers delete talent profile media" on storage.objects;
create policy "Managers delete talent profile media" on storage.objects for delete to authenticated
using (
  bucket_id = 'talent-profile-media'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(storage.objects.name, '/', 2)
      and tp.managed_by = (select auth.uid())
  )
  and public.manager_has_active_plan()
);

drop policy if exists talent_portfolio_manager_insert on storage.objects;
create policy talent_portfolio_manager_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and (tp.managed_by = (select auth.uid()) or is_admin())
  )
  and (is_admin() or public.manager_has_active_plan())
);

drop policy if exists talent_portfolio_manager_update on storage.objects;
create policy talent_portfolio_manager_update on storage.objects for update to authenticated
using (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and (tp.managed_by = (select auth.uid()) or is_admin())
  )
  and (is_admin() or public.manager_has_active_plan())
)
with check (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and (tp.managed_by = (select auth.uid()) or is_admin())
  )
  and (is_admin() or public.manager_has_active_plan())
);

drop policy if exists talent_portfolio_manager_delete on storage.objects;
create policy talent_portfolio_manager_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id = ((storage.foldername(storage.objects.name))[1])::uuid
      and (tp.managed_by = (select auth.uid()) or is_admin())
  )
  and (is_admin() or public.manager_has_active_plan())
);
