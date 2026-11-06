
create or replace function public.get_kora_settings()
returns table(
  key text,
  value jsonb,
  description text,
  is_public boolean,
  updated_by uuid,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path to 'public', 'pg_temp'
as $function$
begin
  -- Anonymous callers only receive rows explicitly marked public.
  -- Avoid invoking authenticated-only permission helpers for anon.
  if auth.role() = 'anon' or auth.uid() is null then
    return query
    select s.key, s.value, s.description, s.is_public, s.updated_by, s.updated_at
    from public.app_settings s
    where s.is_public = true
    order by s.key;
    return;
  end if;

  return query
  select s.key, s.value, s.description, s.is_public, s.updated_by, s.updated_at
  from public.app_settings s
  where s.is_public = true
     or public.is_super_admin()
     or public.admin_has_permission('settings.read')
  order by s.key;
end;
$function$;
