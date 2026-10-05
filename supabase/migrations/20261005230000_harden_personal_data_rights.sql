-- KORA — durcissement final des droits personnels et suppression de compte
-- 2026-10-05
-- Corrige l'ancien export/suppression génériques : seules les données dont
-- l'utilisateur est propriétaire/acteur direct sont exportées ou supprimées.
-- Les références administratives (validated_by, reviewed_by, created_by, etc.)
-- ne sont pas supprimées avec le compte.

begin;

create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_profile jsonb;
  v_auth jsonb;
  v_identities jsonb;
  v_rows jsonb;
  v_talent_ids uuid[];
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;

  select coalesce(to_jsonb(p), '{}'::jsonb)
    into v_profile
  from public.profiles p
  where p.id = v_user;

  if v_profile is null or v_profile = '{}'::jsonb then
    raise exception 'Profil utilisateur introuvable' using errcode = 'P0002';
  end if;

  -- Auth : uniquement les attributs personnels utiles à l'utilisateur.
  -- Ne jamais exporter mots de passe, tokens de confirmation/récupération,
  -- app_metadata d'autorisation ou autres secrets internes.
  select jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'phone', u.phone,
    'email_confirmed_at', u.email_confirmed_at,
    'phone_confirmed_at', u.phone_confirmed_at,
    'confirmed_at', u.confirmed_at,
    'invited_at', u.invited_at,
    'last_sign_in_at', u.last_sign_in_at,
    'created_at', u.created_at,
    'updated_at', u.updated_at,
    'user_metadata', coalesce(u.raw_user_meta_data, '{}'::jsonb),
    'is_anonymous', u.is_anonymous
  )
    into v_auth
  from auth.users u
  where u.id = v_user;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', i.id,
        'provider', i.provider,
        'provider_id', i.provider_id,
        'email', i.email,
        'created_at', i.created_at,
        'updated_at', i.updated_at,
        'last_sign_in_at', i.last_sign_in_at
      )
      order by i.created_at desc
    ),
    '[]'::jsonb
  )
    into v_identities
  from auth.identities i
  where i.user_id = v_user;

  v_result := jsonb_build_object(
    'profile', v_profile,
    'auth_account', coalesce(v_auth, '{}'::jsonb),
    'auth_identities', coalesce(v_identities, '[]'::jsonb),
    'consents', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at desc)
      from public.user_consents c
      where c.user_id = v_user
    ), '[]'::jsonb),
    'exported_at', now()
  );

  -- Données dont l'utilisateur est propriétaire ou auteur direct.
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.activity_logs t
  where t.user_id = v_user;
  v_result := v_result || jsonb_build_object('activity_logs', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.conversation_participants t
  where t.user_id = v_user;
  v_result := v_result || jsonb_build_object('conversation_participants', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.favorites t
  where t.client_id = v_user;
  v_result := v_result || jsonb_build_object('favorites', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.manager_talent_invitations t
  where t.manager_id = v_user;
  v_result := v_result || jsonb_build_object('manager_talent_invitations', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.messages t
  where t.sender_id = v_user;
  v_result := v_result || jsonb_build_object('messages', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.notifications t
  where t.user_id = v_user;
  v_result := v_result || jsonb_build_object('notifications', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.payments t
  where t.user_id = v_user;
  v_result := v_result || jsonb_build_object('payments', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.projects t
  where t.client_id = v_user or t.manager_id = v_user;
  v_result := v_result || jsonb_build_object('projects', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.reports t
  where t.reporter_id = v_user;
  v_result := v_result || jsonb_build_object('reports', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.requests t
  where t.client_id = v_user or t.manager_id = v_user;
  v_result := v_result || jsonb_build_object('requests', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.reviews t
  where t.client_id = v_user or t.reviewer_id = v_user;
  v_result := v_result || jsonb_build_object('reviews', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.subscriptions t
  where t.user_id = v_user;
  v_result := v_result || jsonb_build_object('subscriptions', v_rows);

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
    into v_rows
  from public.verification_requests t
  where t.manager_id = v_user;
  v_result := v_result || jsonb_build_object('verification_requests', v_rows);

  select coalesce(array_agg(tp.id), '{}'::uuid[])
    into v_talent_ids
  from public.talent_profiles tp
  where tp.managed_by = v_user;

  select coalesce(jsonb_agg(to_jsonb(tp)), '[]'::jsonb)
    into v_rows
  from public.talent_profiles tp
  where tp.managed_by = v_user;
  v_result := v_result || jsonb_build_object('talent_profiles', v_rows);

  if cardinality(v_talent_ids) > 0 then
    select coalesce(jsonb_agg(to_jsonb(pi)), '[]'::jsonb)
      into v_rows
    from public.portfolio_items pi
    where pi.talent_id = any(v_talent_ids);
  else
    v_rows := '[]'::jsonb;
  end if;
  v_result := v_result || jsonb_build_object('portfolio_items', v_rows);

  if to_regclass('public.admin_access_profiles') is not null then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      into v_rows
    from public.admin_access_profiles t
    where t.user_id = v_user;
    v_result := v_result || jsonb_build_object('admin_access_profile', v_rows);
  end if;

  if to_regclass('public.admin_invitations') is not null then
    select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      into v_rows
    from public.admin_invitations t
    where t.invited_user_id = v_user;
    v_result := v_result || jsonb_build_object('admin_invitations_received', v_rows);
  end if;

  -- Manifest des fichiers possédés par le compte. Les contenus binaires
  -- restent dans Storage ; cet export fournit leurs métadonnées/path.
  if to_regclass('storage.objects') is not null then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'bucket', o.bucket_id,
          'path', o.name,
          'created_at', o.created_at,
          'updated_at', o.updated_at,
          'mime_type', o.metadata->>'mimetype',
          'size', o.metadata->>'size'
        )
        order by o.created_at desc
      ),
      '[]'::jsonb
    )
      into v_rows
    from storage.objects o
    where o.owner_id = v_user::text
      and o.bucket_id in ('profile-media', 'talent-profile-media', 'talent-portfolio');
    v_result := v_result || jsonb_build_object('storage_objects', v_rows);
  else
    v_result := v_result || jsonb_build_object('storage_objects', '[]'::jsonb);
  end if;

  return v_result;
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

create or replace function public.delete_user_data_v3(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog, pg_temp
as $$
declare
  v_count bigint;
  v_deleted bigint := 0;
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

  -- Données directement possédées/auteurisées par l'utilisateur.
  delete from public.user_consents where user_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.activity_logs where user_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.conversation_participants where user_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.favorites where client_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.manager_talent_invitations where manager_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.messages where sender_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.notifications where user_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.payments where user_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.projects where client_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.requests where client_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.reviews where client_id = p_user_id or reviewer_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.subscriptions where user_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.verification_requests where manager_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.talent_profiles where managed_by = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  delete from public.reports where reporter_id = p_user_id;
  get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;

  if to_regclass('public.admin_access_profiles') is not null then
    delete from public.admin_access_profiles where user_id = p_user_id;
    get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  end if;

  if to_regclass('public.admin_invitations') is not null then
    delete from public.admin_invitations where invited_user_id = p_user_id;
    get diagnostics v_count = row_count; v_deleted := v_deleted + v_count;
  end if;

  -- Références d'administration : on conserve les enregistrements métier
  -- et on détache seulement l'utilisateur supprimé.
  update public.payments set validated_by = null where validated_by = p_user_id;
  update public.verification_requests set reviewed_by = null where reviewed_by = p_user_id;
  update public.reports set resolved_by = null where resolved_by = p_user_id;
  update public.activity_logs set user_id = null where user_id = p_user_id;
  update public.admin_access_profiles set created_by = null where created_by = p_user_id;
  update public.admin_access_profiles set updated_by = null where updated_by = p_user_id;
  update public.admin_invitations set invited_user_id = null where invited_user_id = p_user_id;
  update public.announcements set created_by = null where created_by = p_user_id;
  update public.app_settings set updated_by = null where updated_by = p_user_id;

  -- invited_by est une relation administrative RESTRICT. Un compte public
  -- normal ne devrait pas l'utiliser ; si c'est le cas, l'invitation qu'il a
  -- créée doit disparaître avec son compte pour permettre la suppression.
  delete from public.admin_invitations where invited_by = p_user_id;

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

-- Les anciennes fonctions de suppression ne doivent plus être exposées.
revoke all on function public.delete_my_account() from public, anon, authenticated;
revoke all on function public.delete_my_account_v2() from public, anon, authenticated;

-- Fonction de diagnostic interne : pas une API publique.
alter function public.debug_admin_rpc_role() set search_path = pg_catalog;
revoke all on function public.debug_admin_rpc_role() from public, anon, authenticated;

commit;
