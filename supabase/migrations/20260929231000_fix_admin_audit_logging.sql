-- KORA — fix journalisation interne des RPC admin
-- Les associés autorisés doivent pouvoir déclencher les logs internes,
-- sans pouvoir appeler directement la fonction de journalisation pour
-- fabriquer des entrées arbitraires.

begin;

create or replace function public.write_admin_audit_log_internal(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode='42501';
  end if;

  insert into public.admin_audit_logs(
    actor_id, action, entity_type, entity_id, target_user_id, metadata
  )
  values(
    auth.uid(), p_action, p_entity_type, p_entity_id,
    p_target_user_id, coalesce(p_metadata,'{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_admin_audit_log_internal(text,text,uuid,uuid,jsonb)
  from public, anon;
grant execute on function public.write_admin_audit_log_internal(text,text,uuid,uuid,jsonb)
  to authenticated;


-- La fonction publique reste inutilisable directement par les associés.
create or replace function public.write_admin_audit_log(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Journalisation directe réservée au Super Admin'
      using errcode='42501';
  end if;

  return public.write_admin_audit_log_internal(
    p_action,p_entity_type,p_entity_id,p_target_user_id,p_metadata
  );
end;
$$;

revoke all on function public.write_admin_audit_log(text,text,uuid,uuid,jsonb)
  from public, anon;
grant execute on function public.write_admin_audit_log(text,text,uuid,uuid,jsonb)
  to authenticated;


-- Les RPC admin utilisent désormais le canal interne.
create or replace function public.admin_update_user(
  p_user_id uuid,
  p_patch jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_requested_role text;
begin
  perform public.admin_require_permission('users.manage');

  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;
  if not exists(select 1 from public.profiles where id=p_user_id) then
    raise exception 'Utilisateur introuvable';
  end if;

  v_requested_role:=nullif(trim(coalesce(p_patch->>'role','')),'');
  if v_requested_role is not null and v_requested_role not in ('client','manager','admin') then
    raise exception 'Rôle invalide';
  end if;
  if p_user_id=auth.uid() and v_requested_role is not null then
    raise exception 'Un administrateur ne peut pas modifier son propre rôle';
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
  p_user_id uuid,p_reason text default null
)
returns public.profiles
language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_profile public.profiles%rowtype;
begin
  perform public.admin_require_permission('users.manage');
  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;
  if p_user_id=auth.uid() then raise exception 'Un administrateur ne peut pas se suspendre lui-même'; end if;

  update public.profiles
  set is_suspended=true,suspended_at=now(),
      suspended_reason=nullif(trim(coalesce(p_reason,'')),''),
      updated_at=now()
  where id=p_user_id returning * into v_profile;

  if v_profile.id is null then raise exception 'Utilisateur introuvable'; end if;

  perform public.write_admin_audit_log_internal(
    'user.suspend','profile',v_profile.id,v_profile.id,
    jsonb_build_object('reason',v_profile.suspended_reason)
  );
  return v_profile;
end;
$$;


create or replace function public.admin_reactivate_user(p_user_id uuid)
returns public.profiles
language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_profile public.profiles%rowtype;
begin
  perform public.admin_require_permission('users.manage');
  if p_user_id is null then raise exception 'Utilisateur manquant'; end if;

  update public.profiles
  set is_suspended=false,suspended_at=null,suspended_reason=null,updated_at=now()
  where id=p_user_id returning * into v_profile;

  if v_profile.id is null then raise exception 'Utilisateur introuvable'; end if;

  perform public.write_admin_audit_log_internal(
    'user.reactivate','profile',v_profile.id,v_profile.id,'{}'::jsonb
  );
  return v_profile;
end;
$$;


create or replace function public.admin_set_talent_moderation(
  p_talent_id uuid,p_status text,p_visible boolean default null,
  p_verified boolean default null,p_reason text default null
)
returns public.talent_profiles
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_talent public.talent_profiles%rowtype;
  v_status text:=lower(trim(coalesce(p_status,'')));
begin
  perform public.admin_require_permission('talents.manage');
  if p_talent_id is null then raise exception 'Talent manquant'; end if;
  if v_status not in ('pending','published','rejected','suspended') then
    raise exception 'Statut de modération invalide';
  end if;

  update public.talent_profiles
  set status=v_status,is_visible=coalesce(p_visible,is_visible),
      verified=coalesce(p_verified,verified),updated_at=now()
  where id=p_talent_id returning * into v_talent;

  if v_talent.id is null then raise exception 'Talent introuvable'; end if;

  perform public.write_admin_audit_log_internal(
    'talent.moderate','talent_profile',v_talent.id,v_talent.managed_by,
    jsonb_build_object(
      'status',v_status,'is_visible',v_talent.is_visible,
      'verified',v_talent.verified,
      'reason',nullif(trim(coalesce(p_reason,'')),'')
    )
  );
  return v_talent;
end;
$$;


create or replace function public.admin_update_report(
  p_report_id uuid,p_status text,p_admin_note text default null
)
returns public.reports
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_report public.reports%rowtype;
  v_status text:=lower(trim(coalesce(p_status,'')));
begin
  perform public.admin_require_permission('moderation.manage');
  if v_status not in ('open','reviewing','resolved','rejected') then
    raise exception 'Statut de signalement invalide';
  end if;

  update public.reports
  set status=v_status,
      admin_note=nullif(trim(coalesce(p_admin_note,'')),''),
      resolved_by=case when v_status in ('resolved','rejected') then auth.uid() else null end,
      resolved_at=case when v_status in ('resolved','rejected') then now() else null end,
      updated_at=now()
  where id=p_report_id returning * into v_report;

  if v_report.id is null then raise exception 'Signalement introuvable'; end if;

  perform public.write_admin_audit_log_internal(
    'report.update','report',v_report.id,null,
    jsonb_build_object('status',v_report.status)
  );
  return v_report;
end;
$$;


create or replace function public.admin_validate_payment(
  p_payment_id uuid,p_status text,p_note text default null
)
returns public.payments
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_old_status text;
  v_start timestamptz:=now();
  v_end timestamptz;
begin
  perform public.admin_require_permission('payments.validate');
  if p_payment_id is null then raise exception 'Paiement manquant'; end if;
  if p_status not in ('paid','failed','cancelled','refunded') then
    raise exception 'Statut de paiement invalide';
  end if;

  select * into v_payment from public.payments where id=p_payment_id for update;
  if v_payment.id is null then raise exception 'Paiement introuvable'; end if;
  v_old_status:=v_payment.status;

  update public.payments
  set status=p_status,
      paid_at=case when p_status='paid' then coalesce(paid_at,now()) else paid_at end,
      metadata=coalesce(metadata,'{}'::jsonb)
        || case when p_note is null then '{}'::jsonb else jsonb_build_object('admin_note',p_note) end,
      updated_at=now()
  where id=p_payment_id returning * into v_payment;

  if p_status='paid' and v_payment.subscription_id is not null then
    if lower(coalesce(v_payment.billing_cycle,'monthly'))='yearly' then
      v_end:=v_start+interval '12 months';
    else
      v_end:=v_start+interval '1 month';
    end if;
    update public.subscriptions
    set status='active',current_period_start=v_start,
        current_period_end=v_end,updated_at=now()
    where id=v_payment.subscription_id;
  end if;

  if v_old_status is distinct from p_status then
    insert into public.notifications(user_id,type,title,message,data,is_read,created_at)
    values(
      v_payment.user_id,'payment','Mise à jour du paiement',
      concat('Votre paiement ',coalesce(v_payment.reference,v_payment.id::text),' est maintenant : ',p_status,'.'),
      jsonb_build_object('payment_id',v_payment.id,'status',p_status),false,now()
    );
  end if;

  perform public.write_admin_audit_log_internal(
    'payment.status_update','payment',v_payment.id,v_payment.user_id,
    jsonb_build_object('from',v_old_status,'to',p_status,'note',p_note)
  );
  return v_payment;
end;
$$;


commit;
