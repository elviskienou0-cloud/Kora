
create or replace function public.get_kora_settings()
returns table(
  key text,
  value jsonb,
  description text,
  is_public boolean,
  updated_by uuid,
  updated_at timestamptz
)
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select
    s.key,
    s.value,
    s.description,
    s.is_public,
    s.updated_by,
    s.updated_at
  from public.app_settings s
  where s.is_public = true
     or public.is_super_admin()
  order by s.key;
$function$;
