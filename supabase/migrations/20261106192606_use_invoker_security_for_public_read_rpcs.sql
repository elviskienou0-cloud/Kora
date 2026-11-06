
-- Align authenticated reads of private settings with the settings.read permission.
drop policy if exists app_settings_select_authenticated on public.app_settings;
create policy app_settings_select_authenticated
on public.app_settings
for select
to authenticated
using (
  is_public = true
  or public.is_super_admin()
  or public.admin_has_permission('settings.read')
);

-- Public theme setting: RLS already exposes only rows marked is_public.
create or replace function public.get_kora_default_theme()
returns text
language plpgsql
security invoker
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_theme text;
begin
  select value #>> '{}'
    into v_theme
  from public.app_settings
  where key = 'default_theme';

  if v_theme in ('light', 'dark', 'system') then
    return v_theme;
  end if;

  return 'system';
end;
$function$;

-- Statistics are now calculated under the caller's RLS visibility.
create or replace function public.get_kora_live_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_project_count bigint := 0;
  v_user_id uuid := auth.uid();
  v_role text;
  v_result jsonb;
begin
  if v_user_id is not null then
    select p.role
      into v_role
    from public.profiles p
    where p.id = v_user_id;

    if v_role = 'client' then
      select count(*) into v_project_count
      from public.projects p
      where p.client_id = v_user_id;
    elsif v_role = 'manager' then
      select count(*) into v_project_count
      from public.projects p
      where p.manager_id = v_user_id;
    elsif v_role in ('admin', 'superadmin') then
      -- RLS limits this aggregate to Super Admins or admins with projects.read.
      select count(*) into v_project_count
      from public.projects;
    end if;
  end if;

  with published_talents as (
    select
      tp.id,
      tp.category_id,
      tp.country_id,
      case
        when coalesce(tp.reviews_count, 0) > 0 then tp.rating
        else null
      end as rating
    from public.talent_profiles tp
    where tp.status = 'published'
      and coalesce(tp.is_visible, true) = true
  ),
  category_rows as (
    select
      c.id,
      c.slug,
      c.name,
      count(pt.id)::bigint as count
    from public.categories c
    left join published_talents pt on pt.category_id = c.id
    group by c.id, c.slug, c.name
  ),
  category_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'slug', slug,
          'name', name,
          'count', count
        )
        order by name
      ),
      '[]'::jsonb
    ) as value
    from category_rows
  ),
  aggregate_values as (
    select
      count(*)::bigint as talent_count,
      count(distinct country_id)::bigint as country_count,
      coalesce(round(avg(rating), 1), 0)::numeric as average_rating
    from published_talents
  )
  select jsonb_build_object(
    'talent_count', a.talent_count,
    'project_count', v_project_count,
    'country_count', a.country_count,
    'average_rating', a.average_rating,
    'categories', cj.value
  )
  into v_result
  from aggregate_values a
  cross join category_json cj;

  return v_result;
end;
$function$;

-- RLS, not SECURITY DEFINER, decides which settings a caller may receive.
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
security invoker
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
     or public.admin_has_permission('settings.read')
  order by s.key;
$function$;
