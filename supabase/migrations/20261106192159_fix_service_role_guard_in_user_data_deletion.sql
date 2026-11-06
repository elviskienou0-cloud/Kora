
create or replace function public.delete_user_data_v3(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog', 'pg_temp'
as $function$
declare
  v_count bigint;
  v_deleted bigint := 0;
begin
  -- SECURITY DEFINER changes current_user to the function owner.
  -- auth.role() reads the verified JWT role of the calling request.
  if auth.role() <> 'service_role' then
    raise exception 'Opération réservée au service role'
      using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'Utilisateur manquant';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_user_id
  ) then
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

  delete from public.reviews
  where client_id = p_user_id or reviewer_id = p_user_id;
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

  -- Preserve business history while detaching references to the deleted user.
  update public.payments set validated_by = null where validated_by = p_user_id;
  update public.verification_requests set reviewed_by = null where reviewed_by = p_user_id;
  update public.reports set resolved_by = null where resolved_by = p_user_id;
  update public.activity_logs set user_id = null where user_id = p_user_id;
  update public.admin_access_profiles set created_by = null where created_by = p_user_id;
  update public.admin_access_profiles set updated_by = null where updated_by = p_user_id;
  update public.admin_invitations set invited_user_id = null where invited_user_id = p_user_id;
  update public.announcements set created_by = null where created_by = p_user_id;
  update public.app_settings set updated_by = null where updated_by = p_user_id;

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
$function$;
