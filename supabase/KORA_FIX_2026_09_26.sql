-- KORA — correction Supabase 2026-09-26
-- Source of truth for the live-stat/media reconciliation.
-- Idempotent: safe to execute again.

begin;

alter table public.talent_profiles
  add column if not exists avatar_url text,
  add column if not exists cover_url text;

create or replace function public.get_kora_live_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_project_count bigint := 0;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Connexion requise';
  end if;

  select p.role into v_role
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
  elsif v_role = 'admin' then
    select count(*) into v_project_count
    from public.projects;
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
$$;

-- SECURITY DEFINER functions in public must never be callable anonymously.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
  loop
    execute format('revoke execute on function %s from anon', r.fn);
  end loop;
end $$;

revoke execute on function public.get_kora_live_stats() from anon;
grant execute on function public.get_kora_live_stats() to authenticated;

commit;
