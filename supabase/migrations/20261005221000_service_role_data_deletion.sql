-- KORA — service-role deletion primitive used after user identity verification
begin;

create or replace function public.delete_user_data_v3(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_table record;
  v_count bigint;
  v_deleted bigint := 0;
  v_sql text;
begin
  if current_user <> 'service_role' then
    raise exception 'Opération réservée au service role' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Profil utilisateur introuvable';
  end if;

  if exists (
    select 1 from public.profiles
    where id = p_user_id
      and lower(trim(role)) in ('admin', 'superadmin')
  ) then
    raise exception 'Un compte administrateur ne peut pas être supprimé par ce processus';
  end if;

  delete from public.user_consents where user_id = p_user_id;
  get diagnostics v_count = row_count;
  v_deleted := v_deleted + coalesce(v_count, 0);

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

    execute v_sql using p_user_id;
    get diagnostics v_count = row_count;
    v_deleted := v_deleted + coalesce(v_count, 0);
  end loop;

  delete from public.profiles where id = p_user_id;

  if not found then
    raise exception 'Profil utilisateur introuvable';
  end if;

  return jsonb_build_object(
    'ok', true,
    'deleted_user_id', p_user_id,
    'deleted_rows', v_deleted
  );
end;
$$;

revoke all on function public.delete_user_data_v3(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_data_v3(uuid) to service_role;

commit;
