-- KORA: hardening des index et de la politique de création de projets.
begin;

create index if not exists manager_team_invitations_invited_user_idx
  on public.manager_team_invitations (invited_user_id, status, created_at desc);

drop policy if exists projects_insert on public.projects;
create policy projects_insert
on public.projects
for insert
to authenticated
with check (
  client_id = (select auth.uid())
  and (select public.get_my_role()) = 'client'
);

commit;
