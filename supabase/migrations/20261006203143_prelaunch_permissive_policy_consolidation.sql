-- Final permissive-policy consolidation for prelaunch RLS.

drop policy if exists categories_admin_write on public.categories;
drop policy if exists categories_public_select on public.categories;
create policy categories_public_select_anon on public.categories for select to anon using (is_active = true);
create policy categories_authenticated_select on public.categories for select to authenticated using (is_active = true or is_admin());
create policy categories_admin_insert on public.categories for insert to authenticated with check (is_admin());
create policy categories_admin_update on public.categories for update to authenticated using (is_admin()) with check (is_admin());
create policy categories_admin_delete on public.categories for delete to authenticated using (is_admin());

drop policy if exists countries_admin_write on public.countries;
drop policy if exists countries_public_select on public.countries;
create policy countries_public_select_anon on public.countries for select to anon using (is_active = true);
create policy countries_authenticated_select on public.countries for select to authenticated using (is_active = true or is_admin());
create policy countries_admin_insert on public.countries for insert to authenticated with check (is_admin());
create policy countries_admin_update on public.countries for update to authenticated using (is_admin()) with check (is_admin());
create policy countries_admin_delete on public.countries for delete to authenticated using (is_admin());

drop policy if exists kora_transactions_client_read on public.kora_transactions;
drop policy if exists kora_transactions_manager_read on public.kora_transactions;
create policy kora_transactions_select on public.kora_transactions for select to authenticated using (
  client_id = (select auth.uid())
  or manager_id = (select auth.uid())
  or is_admin()
);

drop policy if exists invitations_select on public.manager_talent_invitations;
drop policy if exists invitations_write on public.manager_talent_invitations;
create policy invitations_select on public.manager_talent_invitations for select to authenticated using (
  manager_id = (select auth.uid()) or is_admin()
);
create policy invitations_insert on public.manager_talent_invitations for insert to authenticated with check (
  manager_id = (select auth.uid()) or is_admin()
);
create policy invitations_update on public.manager_talent_invitations for update to authenticated using (
  manager_id = (select auth.uid()) or is_admin()
) with check (
  manager_id = (select auth.uid()) or is_admin()
);
create policy invitations_delete on public.manager_talent_invitations for delete to authenticated using (
  manager_id = (select auth.uid()) or is_admin()
);