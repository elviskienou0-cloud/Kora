-- KORA: présence utilisateur et compteur CEO/Admin
alter table public.profiles
  add column if not exists last_seen timestamptz;

create index if not exists profiles_last_seen_idx
  on public.profiles (last_seen desc);

create or replace function public.touch_presence()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non authentifié.';
  end if;

  update public.profiles
  set last_seen = now()
  where id = auth.uid();
end;
$$;

create or replace function public.get_online_user_count()
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count bigint;
begin
  if not public.is_admin() then
    raise exception 'Accès refusé.';
  end if;

  select count(*)
  into v_count
  from public.profiles
  where coalesce(is_suspended, false) = false
    and last_seen >= now() - interval '2 minutes';

  return v_count;
end;
$$;

revoke all on function public.touch_presence()
from public, anon;

grant execute on function public.touch_presence()
to authenticated;

revoke all on function public.get_online_user_count()
from public, anon, authenticated;

grant execute on function public.get_online_user_count()
to authenticated;
