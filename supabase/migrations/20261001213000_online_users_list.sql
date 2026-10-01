-- KORA — liste des utilisateurs actuellement en ligne
create or replace function public.get_online_users()
returns table (
  id uuid,
  name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès refusé.';
  end if;

  return query
  select p.id, p.name
  from public.profiles p
  where coalesce(p.is_suspended, false) = false
    and p.last_seen >= now() - interval '2 minutes'
  order by p.last_seen desc;
end;
$$;

revoke all on function public.get_online_users()
from public, anon, authenticated;

grant execute on function public.get_online_users()
to authenticated;
