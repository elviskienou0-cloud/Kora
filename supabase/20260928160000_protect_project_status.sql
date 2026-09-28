-- KORA: protection serveur du statut des projets
-- Le client peut modifier les informations de son projet, mais pas son statut.
-- Les managers et admins conservent le contrôle du workflow.

create or replace function public.protect_client_project_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status is distinct from new.status
     and not public.is_admin()
     and not public.is_manager() then
    raise exception 'Le statut du projet est géré par le workflow KORA';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_client_project_status on public.projects;

create trigger trg_protect_client_project_status
before update on public.projects
for each row
execute function public.protect_client_project_status();
