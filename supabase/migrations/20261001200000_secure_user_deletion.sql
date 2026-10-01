-- KORA — suppression complète d'un utilisateur
-- Nettoie les données métier qui référencent public.profiles avant la
-- suppression du compte Auth. Les logs d'audit sont conservés.
begin;

create or replace function public.admin_delete_user_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller_role text;
  v_table record;
  v_deleted bigint := 0;
  v_count bigint;
  v_sql text;
  v_schema text;
  v_table_name text;
  v_column_name text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Cette action n''est pas autorisée sur votre propre compte';
  end if;

  -- Défense en profondeur : seul le Super Admin peut supprimer un compte admin.
  select lower(trim(role)) into v_caller_role
  from public.profiles
  where id = auth.uid();

  if exists (
    select 1 from public.profiles
    where id = p_user_id and lower(trim(role)) = 'superadmin'
  ) then
    raise exception 'Un Super Admin/CEO ne peut pas être supprimé';
  end if;

  if exists (
    select 1 from public.profiles
    where id = p_user_id and lower(trim(role)) = 'admin'
  ) and not public.is_super_admin() then
    raise exception 'Seul le Super Admin peut supprimer un administrateur';
  end if;

  -- Supprime toutes les lignes des tables publiques qui ont une FK simple
  -- vers profiles.id. Cela couvre automatiquement les nouvelles tables
  -- utilisateur ajoutées plus tard, sans maintenir une liste fragile.
  --
  -- Les logs d'audit sont volontairement exclus : leurs FK actor/target
  -- sont ON DELETE SET NULL afin de conserver l'historique.
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
    v_schema := v_table.schema_name;
    v_table_name := v_table.table_name;
    v_column_name := v_table.column_name;

    v_sql := format(
      'delete from %I.%I where %I = $1',
      v_schema,
      v_table_name,
      v_column_name
    );

    execute v_sql using p_user_id;
    get diagnostics v_count = row_count;
    v_deleted := v_deleted + coalesce(v_count, 0);
  end loop;

  -- Les références restantes depuis admin_audit_logs passent à NULL grâce
  -- aux contraintes ON DELETE SET NULL. On conserve donc l'historique sans
  -- conserver une FK active vers un compte supprimé.
  delete from public.profiles
  where id = p_user_id;

  if not found then
    raise exception 'Utilisateur introuvable';
  end if;

  return jsonb_build_object(
    'ok', true,
    'deleted_user_id', p_user_id,
    'deleted_rows', v_deleted
  );
end;
$$;

revoke all on function public.admin_delete_user_data(uuid) from public, anon;
grant execute on function public.admin_delete_user_data(uuid) to authenticated;

commit;
