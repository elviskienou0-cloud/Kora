-- KORA — droits des personnes : export complet + suppression applicative
-- 2026-10-05
-- Ne supprime jamais le compte Auth : l'Edge Function le fait après nettoyage
-- des données publiques et du Storage.

begin;

create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_table record;
  v_rows jsonb;
  v_result jsonb;
  v_key text;
begin
  if v_user is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  select coalesce(to_jsonb(p), '{}'::jsonb)
  into v_result
  from public.profiles p
  where p.id = v_user;

  v_result := jsonb_build_object(
    'profile', coalesce(v_result, '{}'::jsonb),
    'consents', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at desc)
      from public.user_consents c
      where c.user_id = v_user
    ), '[]'::jsonb),
    'exported_at', now()
  );

  -- Toutes les tables métier qui référencent directement profiles.id.
  -- Les logs d'administration restent exclus pour éviter d'exposer des
  -- informations concernant d'autres utilisateurs.
  for v_table in
    select distinct
      n.nspname as schema_name,
      c.relname as table_name,
      a.attname as column_name
    from pg_constraint fk
    join pg_class c on c.oid = fk.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = fk.conkey[1]
    where fk.contype = 'f'
      and fk.confrelid = 'public.profiles'::regclass
      and array_length(fk.conkey, 1) = 1
      and array_length(fk.confkey, 1) = 1
      and n.nspname = 'public'
      and c.relname not in ('profiles', 'admin_audit_logs')
    order by c.relname, a.attname
  loop
    v_key := v_table.table_name || '__' || v_table.column_name;

    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb)
       from %I.%I t
       where %I = $1',
      v_table.schema_name,
      v_table.table_name,
      v_table.column_name
    )
    into v_rows
    using v_user;

    v_result := v_result || jsonb_build_object(
      v_key,
      coalesce(v_rows, '[]'::jsonb)
    );
  end loop;

  -- Les portfolios sont liés aux talents et non directement au profil.
  if to_regclass('public.talent_profiles') is not null
     and to_regclass('public.portfolio_items') is not null then
    execute
      'select coalesce(jsonb_agg(to_jsonb(pi)), ''[]''::jsonb)
       from public.portfolio_items pi
       join public.talent_profiles tp on tp.id = pi.talent_id
       where tp.managed_by = $1'
    into v_rows
    using v_user;

    v_result := v_result || jsonb_build_object(
      'portfolio_items', coalesce(v_rows, '[]'::jsonb)
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

create or replace function public.delete_my_account_v2()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_table record;
  v_count bigint;
  v_deleted bigint := 0;
  v_sql text;
begin
  if v_user is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = v_user
      and lower(trim(role)) in ('admin', 'superadmin')
  ) then
    raise exception 'La suppression d''un compte administrateur doit être effectuée par le processus administrateur sécurisé.';
  end if;

  -- Les consentements référencent auth.users et non profiles.
  delete from public.user_consents where user_id = v_user;
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + coalesce(v_count, 0);

  -- Nettoyage générique des tables métier référencées par profiles.
  for v_table in
    select distinct
      n.nspname as schema_name,
      c.relname as table_name,
      a.attname as column_name
    from pg_constraint fk
    join pg_class c on c.oid = fk.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum = fk.conkey[1]
    where fk.contype = 'f'
      and fk.confrelid = 'public.profiles'::regclass
      and array_length(fk.conkey, 1) = 1
      and array_length(fk.confkey, 1) = 1
      and n.nspname = 'public'
      and c.relname not in ('profiles', 'admin_audit_logs')
    order by c.relname, a.attname
  loop
    v_sql := format(
      'delete from %I.%I where %I = $1',
      v_table.schema_name,
      v_table.table_name,
      v_table.column_name
    );

    execute v_sql using v_user;
    get diagnostics v_count = row_count;
    v_deleted := v_deleted + coalesce(v_count, 0);
  end loop;

  delete from public.profiles where id = v_user;

  if not found then
    raise exception 'Profil utilisateur introuvable';
  end if;

  return jsonb_build_object(
    'ok', true,
    'deleted_user_id', v_user,
    'deleted_rows', v_deleted
  );
end;
$$;

revoke all on function public.delete_my_account_v2() from public, anon;
grant execute on function public.delete_my_account_v2() to authenticated;

commit;
