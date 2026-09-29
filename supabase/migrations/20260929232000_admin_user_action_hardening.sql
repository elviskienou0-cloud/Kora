-- KORA — durcissement des actions utilisateurs administrateur
begin;

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_patch jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_requested_role text;
  v_current_role text;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;

  select role into v_current_role
  from public.profiles
  where id=p_user_id;

  if v_current_role is null then raise exception 'Utilisateur introuvable'; end if;

  v_requested_role:=nullif(trim(coalesce(p_patch->>'role','')),'');

  -- La gestion des rôles administrateur reste exclusivement CEO/Super Admin.
  if v_requested_role is not null then
    if not public.is_super_admin() then
      raise exception 'Seul le Super Admin peut modifier les rôles';
    end if;

    if v_requested_role not in ('client','manager','admin') then
      raise exception 'Rôle invalide';
    end if;

    if p_user_id=auth.uid() then
      raise exception 'Un administrateur ne peut pas modifier son propre rôle';
    end if;
  end if;

  -- Un associé ne peut pas modifier un autre administrateur.
  if v_current_role='admin' and not public.is_super_admin() then
    raise exception 'La gestion des comptes administrateurs est réservée au Super Admin';
  end if;

  update public.profiles
  set name=case when p_patch ? 'name' then nullif(trim(coalesce(p_patch->>'name','')),'') else name end,
      avatar=case when p_patch ? 'avatar' then nullif(trim(coalesce(p_patch->>'avatar','')),'') else avatar end,
      role=case when p_patch ? 'role' then p_patch->>'role' else role end,
      phone=case when p_patch ? 'phone' then nullif(trim(coalesce(p_patch->>'phone','')),'') else phone end,
      city=case when p_patch ? 'city' then nullif(trim(coalesce(p_patch->>'city','')),'') else city end,
      company=case when p_patch ? 'company' then nullif(trim(coalesce(p_patch->>'company','')),'') else company end,
      bio=case when p_patch ? 'bio' then nullif(trim(coalesce(p_patch->>'bio','')),'') else bio end,
      preferences=case when p_patch ? 'preferences' then coalesce(p_patch->'preferences','{}'::jsonb) else preferences end,
      updated_at=now()
  where id=p_user_id
  returning * into v_profile;

  perform public.write_admin_audit_log_internal(
    'user.update','profile',v_profile.id,v_profile.id,
    jsonb_build_object('fields',(select jsonb_agg(key) from jsonb_object_keys(p_patch) as key))
  );

  return v_profile;
end;
$$;


create or replace function public.admin_suspend_user(
  p_user_id uuid,
  p_reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_target_role text;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;
  if p_user_id=auth.uid() then raise exception 'Un administrateur ne peut pas se suspendre lui-même'; end if;

  select role into v_target_role from public.profiles where id=p_user_id;
  if v_target_role is null then raise exception 'Utilisateur introuvable'; end if;

  if v_target_role='admin' and not public.is_super_admin() then
    raise exception 'La suspension d''un administrateur est réservée au Super Admin';
  end if;

  update public.profiles
  set is_suspended=true,suspended_at=now(),
      suspended_reason=nullif(trim(coalesce(p_reason,'')),''),
      updated_at=now()
  where id=p_user_id
  returning * into v_profile;

  perform public.write_admin_audit_log_internal(
    'user.suspend','profile',v_profile.id,v_profile.id,
    jsonb_build_object('reason',v_profile.suspended_reason)
  );
  return v_profile;
end;
$$;


create or replace function public.admin_reactivate_user(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_target_role text;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;

  select role into v_target_role from public.profiles where id=p_user_id;
  if v_target_role is null then raise exception 'Utilisateur introuvable'; end if;

  if v_target_role='admin' and not public.is_super_admin() then
    raise exception 'La réactivation d''un administrateur est réservée au Super Admin';
  end if;

  update public.profiles
  set is_suspended=false,suspended_at=null,suspended_reason=null,updated_at=now()
  where id=p_user_id
  returning * into v_profile;

  perform public.write_admin_audit_log_internal(
    'user.reactivate','profile',v_profile.id,v_profile.id,'{}'::jsonb
  );
  return v_profile;
end;
$$;

commit;
