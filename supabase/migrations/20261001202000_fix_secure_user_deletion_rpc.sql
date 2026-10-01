-- KORA — correction de la RPC de suppression complète.
-- La RPC est appelée uniquement par l'Edge Function avec service_role.

begin;

create or replace function public.admin_delete_user_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_table record;
  v_deleted bigint := 0;
  v_count bigint;
  v_sql text;
begin
  if current_user <> 'service_role' then
    raise exception 'Cette opération doit être exécutée par le service role' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Utilisateur introuvable';
  end if;

  -- Sécurité : même en cas d'appel direct du service role, le CEO ne peut
  -- pas supprimer un Super Admin. La vérification de l'Edge Function reste
  -- également active avant cet appel.
  if exists (
    select 1
    from public.profiles
    where id = p_user_id
      and lower(trim(role)) = 'superadmin'
  ) then
    raise exception 'Un Super Admin/CEO ne peut pas être supprimé';
  end if;

  -- Supprime toutes les lignes des tables publiques ayant une FK simple
  -- vers profiles.id. Les logs d'audit sont conservés : leurs FK sont
  -- ON DELETE SET NULL.
  for v_table in
    select
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
      and c.relname <> 'profiles'
      and c.relname <> 'admin_audit_logs'
    order by
      case when c.relname = 'admin_invitations' then 0 else 1 end,
      c.relname
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

  delete from public.profiles
  where id = p_user_id;

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

revoke all on function public.admin_delete_user_data(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_user_data(uuid) to service_role;

commit;
