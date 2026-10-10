-- KORA security hardening from the 2026-10-09 audit.
-- Intentionally shipped as a migration proposal; do not apply until migration
-- history drift between the repository and production has been reconciled.

begin;

-- Scoped administrators must not inherit moderation powers from their role name.
drop policy if exists messages_update on public.messages;
create policy messages_update
on public.messages
for update
to authenticated
using (
  public.is_conversation_member(conversation_id)
  or public.is_super_admin()
  or false
)
with check (
  public.is_conversation_member(conversation_id)
  or public.is_super_admin()
  or false
);

create or replace function public.protect_message_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user <> 'authenticated' or auth.uid() is null
     or public.is_super_admin()
     or false then
    return new;
  end if;

  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.conversation_id is distinct from old.conversation_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Un message ne peut pas être modifié'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Only a superadmin or an explicitly authorized moderator may alter protected
-- moderation fields; ordinary managers retain the existing profile workflow.
drop policy if exists talent_manager_update on public.talent_profiles;
create policy talent_manager_update
on public.talent_profiles
for update
to authenticated
using (
  public.is_super_admin()
  or public.admin_has_permission('talents.manage')
  or (managed_by = (select auth.uid()) and public.manager_has_active_plan())
)
with check (
  public.is_super_admin()
  or public.admin_has_permission('talents.manage')
  or (managed_by = (select auth.uid()) and public.manager_has_active_plan())
);

create or replace function public.protect_talent_profile_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_sub public.subscriptions%rowtype;
begin
  if current_user <> 'authenticated' or auth.uid() is null
     or public.is_super_admin()
     or public.admin_has_permission('talents.manage') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
    new.rating := 0;
    new.reviews_count := 0;
    new.completed_projects := 0;
    new.status := 'pending';
    new.is_visible := false;
    return new;
  end if;

  if new.managed_by is distinct from old.managed_by then
    raise exception 'Le manager d''un talent ne peut pas être modifié'
      using errcode = '42501';
  end if;

  if new.verified is distinct from old.verified
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.completed_projects is distinct from old.completed_projects then
    raise exception 'Champ réservé à la modération KORA'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if old.status = 'suspended' or new.status = 'suspended' then
      raise exception 'Ce statut est géré par la modération KORA'
        using errcode = '42501';
    end if;

    if new.status = 'published' then
      select * into v_sub
      from public.subscriptions
      where user_id = old.managed_by
      order by created_at desc
      limit 1;

      if v_sub.id is null
         or v_sub.status not in ('trialing','active')
         or (v_sub.current_period_end is not null and v_sub.current_period_end <= now()) then
        raise exception 'Un abonnement actif est requis pour publier un talent'
          using errcode = '42501';
      end if;
    end if;
  end if;

  if new.status <> 'published' then
    new.is_visible := false;
  end if;
  return new;
end;
$$;

-- Payment validators may validate a payment, but may not rewrite its ownership,
-- amount, provider, or transaction identifiers through a direct table UPDATE.
create or replace function public.protect_payment_validation_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user <> 'authenticated' or auth.uid() is null
     or public.is_super_admin() then
    return new;
  end if;

  if public.is_admin() then
    if not public.admin_has_permission('payments.validate') then
      raise exception 'Permission de validation des paiements requise'
        using errcode = '42501';
    end if;

    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.subscription_id is distinct from old.subscription_id
       or new.amount is distinct from old.amount
       or new.currency is distinct from old.currency
       or new.method is distinct from old.method
       or new.transaction_reference is distinct from old.transaction_reference
       or new.proof_url is distinct from old.proof_url
       or new.created_at is distinct from old.created_at
       or new.provider is distinct from old.provider
       or new.provider_payment_id is distinct from old.provider_payment_id
       or new.plan_id is distinct from old.plan_id
       or new.reference is distinct from old.reference
       or new.billing_cycle is distinct from old.billing_cycle
       or new.checkout_url is distinct from old.checkout_url
       or new.paid_at is distinct from old.paid_at
       or new.metadata is distinct from old.metadata then
      raise exception 'Les données financières du paiement sont immuables pendant la validation'
        using errcode = '42501';
    end if;

    new.validated_by := auth.uid();
    if new.status is distinct from old.status then
      new.validated_at := now();
    end if;
    new.updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists protect_payment_validation_fields on public.payments;
create trigger protect_payment_validation_fields
before update on public.payments
for each row execute function public.protect_payment_validation_fields();

-- Keep uploaded portfolio files private and impose server-side upload limits.
-- The existing application already resolves portfolio files using signed URLs.
update storage.buckets
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif','image/avif',
      'video/mp4','video/webm','video/quicktime','application/pdf'
    ]
where id = 'talent-portfolio';


-- App settings are global platform controls. Scoped admins can read settings
-- through their existing read permission, but only the superadmin can mutate
-- them until a dedicated write permission is added to the admin permission UI.
drop policy if exists app_settings_admin_update on public.app_settings;
create policy app_settings_admin_update
on public.app_settings for update to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists app_settings_admin_insert on public.app_settings;
create policy app_settings_admin_insert
on public.app_settings for insert to authenticated
with check (public.is_super_admin());

create or replace function public.update_kora_setting(p_key text, p_value jsonb)
returns public.app_settings
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_setting public.app_settings;
  v_commission numeric;
begin
  if not public.is_super_admin() then
    raise exception 'Accès Super Admin requis'
      using errcode = '42501';
  end if;

  if p_key = 'commission_rate' then
    v_commission := (p_value #>> '{}')::numeric;
    if v_commission < 0 or v_commission > 100 then
      raise exception 'La commission doit être comprise entre 0 et 100';
    end if;
  end if;

  update public.app_settings
  set value = p_value, updated_by = auth.uid(), updated_at = now()
  where key = p_key
  returning * into v_setting;

  if not found then
    insert into public.app_settings (key, value, description, is_public, updated_by)
    values (p_key, p_value, 'Paramètre KORA', true, auth.uid())
    returning * into v_setting;
  end if;

  insert into public.admin_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'update_setting', 'app_setting', null,
    jsonb_build_object('key', p_key, 'value', p_value)
  );

  return v_setting;
end;
$function$;

commit;
