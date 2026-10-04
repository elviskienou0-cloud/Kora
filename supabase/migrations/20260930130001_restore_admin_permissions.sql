-- KORA — restaure les contrôles de permission écrasés et ferme la journalisation interne.
-- 1) admin_validate_payment : permission payments.validate + audit interne (écrasés par 20260930120000),
--    en gardant l'application du plan payé à l'abonnement.
-- 2) admin_set_talent_moderation : permission talents.manage (version du dépôt, absente en base).
-- 3) write_admin_audit_log_internal : plus exécutable par les utilisateurs (anti-falsification des logs).
-- 4) set_admin_access_profile : plus exécutable par anon.
-- Idempotent.

create or replace function public.admin_validate_payment(
  p_payment_id uuid, p_status text, p_note text default null
)
returns public.payments
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_old_status text;
  v_start timestamptz := now();
  v_end timestamptz;
begin
  perform public.admin_require_permission('payments.validate');
  if p_payment_id is null then raise exception 'Paiement manquant'; end if;
  if p_status not in ('paid','failed','cancelled','refunded') then
    raise exception 'Statut de paiement invalide';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then raise exception 'Paiement introuvable'; end if;
  v_old_status := v_payment.status;

  update public.payments
  set status = p_status,
      paid_at = case when p_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
      validated_by = auth.uid(),
      validated_at = now(),
      metadata = coalesce(metadata, '{}'::jsonb)
        || case when p_note is null then '{}'::jsonb else jsonb_build_object('admin_note', p_note) end,
      updated_at = now()
  where id = p_payment_id returning * into v_payment;

  if p_status = 'paid' and v_payment.subscription_id is not null then
    v_end := v_start + case when lower(coalesce(v_payment.billing_cycle, 'monthly')) = 'yearly'
                            then interval '12 months' else interval '1 month' end;
    update public.subscriptions
    set status = 'active',
        plan_id = coalesce(v_payment.plan_id, plan_id),
        plan = lower(coalesce(v_payment.plan_id, plan_id)),
        trial_start = null, trial_end = null,
        current_period_start = v_start,
        current_period_end = v_end,
        updated_at = now()
    where id = v_payment.subscription_id;
  end if;

  if v_old_status is distinct from p_status then
    insert into public.notifications (user_id, type, title, message, data, is_read, created_at)
    values (
      v_payment.user_id, 'payment', 'Mise à jour du paiement',
      concat('Votre paiement ', coalesce(v_payment.reference, v_payment.id::text), ' est maintenant : ', p_status, '.'),
      jsonb_build_object('payment_id', v_payment.id, 'status', p_status), false, now()
    );
  end if;

  perform public.write_admin_audit_log_internal(
    'payment.status_update', 'payment', v_payment.id, v_payment.user_id,
    jsonb_build_object('from', v_old_status, 'to', p_status, 'note', p_note)
  );
  return v_payment;
end;
$$;
revoke all on function public.admin_validate_payment(uuid, text, text) from public, anon;
grant execute on function public.admin_validate_payment(uuid, text, text) to authenticated;

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
revoke all on function public.admin_set_talent_moderation(uuid, text, boolean, boolean, text) from public, anon;
grant execute on function public.admin_set_talent_moderation(uuid, text, boolean, boolean, text) to authenticated;

revoke all on function public.write_admin_audit_log_internal(text, text, uuid, uuid, jsonb) from public, anon, authenticated;

revoke all on function public.set_admin_access_profile(uuid, text, jsonb, integer, integer, timestamptz, jsonb, boolean) from public, anon;
grant execute on function public.set_admin_access_profile(uuid, text, jsonb, integer, integer, timestamptz, jsonb, boolean) to authenticated;
