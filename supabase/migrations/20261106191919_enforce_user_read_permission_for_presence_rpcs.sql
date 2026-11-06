
create or replace function public.get_online_user_count()
returns bigint
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_count bigint;
begin
  perform public.admin_require_permission('users.read');

  select count(*)
    into v_count
  from public.profiles p
  where coalesce(p.is_suspended, false) = false
    and p.last_seen is not null
    and p.last_seen >= now() - interval '2 minutes';

  return v_count;
end;
$function$;

create or replace function public.get_online_users()
returns table(id uuid, name text, role text, last_seen timestamptz)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public.admin_require_permission('users.read');

  return query
  select p.id, p.name, p.role, p.last_seen
  from public.profiles p
  where coalesce(p.is_suspended, false) = false
    and p.last_seen is not null
    and p.last_seen >= now() - interval '2 minutes'
  order by p.last_seen desc;
end;
$function$;
