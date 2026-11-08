create or replace function public.touch_presence()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Utilisateur non authentifié.'
      using errcode = '42501';
  end if;

  -- Heartbeats can be called from a public browser client. Persist at most
  -- one timestamp update every 30 seconds per account to limit write abuse.
  update public.profiles
  set last_seen = pg_catalog.now()
  where id = v_user_id
    and (
      last_seen is null
      or last_seen < pg_catalog.now() - interval '30 seconds'
    );
end;
$function$;

revoke all on function public.touch_presence() from public, anon;
grant execute on function public.touch_presence() to authenticated, service_role;
