-- KORA: thème global clair/sombre/système
-- Date: 2026-09-29

insert into public.app_settings (key, value, description, is_public)
values (
  'default_theme',
  '"system"',
  'Thème par défaut de KORA: light, dark ou system',
  true
)
on conflict (key) do nothing;

create or replace function public.get_kora_default_theme()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_theme text;
begin
  select value #>> '{}' into v_theme
  from public.app_settings
  where key = 'default_theme';

  if v_theme in ('light', 'dark', 'system') then
    return v_theme;
  end if;

  return 'system';
end;
$$;

revoke all on function public.get_kora_default_theme() from public;
grant execute on function public.get_kora_default_theme() to anon, authenticated;
