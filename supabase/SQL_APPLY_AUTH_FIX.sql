-- KORA — correctif d'application Supabase pour le parcours inscription -> dashboard
-- À exécuter dans le SQL Editor du projet Supabase KORA.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_name text;
begin
  v_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', 'client')));

  if v_role not in ('client', 'manager') then
    v_role := 'client';
  end if;

  v_name := trim(coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(
      trim(
        coalesce(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
        coalesce(new.raw_user_meta_data ->> 'last_name', '')
      ),
      ''
    ),
    split_part(coalesce(new.email, ''), '@', 1),
    'Utilisateur KORA'
  ));

  insert into public.profiles (id, name, role)
  values (new.id, v_name, v_role)
  on conflict (id) do update
    set name = excluded.name,
        role = case
          when public.profiles.role in ('admin', 'superadmin')
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Le frontend authentifié doit pouvoir lire son propre profil.
grant select on public.profiles to authenticated;

commit;

-- Vérification du trigger
select
  tgname,
  tgenabled
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname = 'on_auth_user_created';

-- Vérification des droits
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'profiles'
  and grantee = 'authenticated'
order by grantee, privilege_type;
