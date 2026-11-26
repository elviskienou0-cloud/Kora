insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

drop policy if exists payment_proofs_owner_insert on storage.objects;
drop policy if exists payment_proofs_select on storage.objects;
drop policy if exists payment_proofs_owner_delete on storage.objects;

create policy payment_proofs_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.get_my_role() = 'manager'
  and not exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and coalesce(pr.is_suspended, false))
  and exists (
    select 1 from public.payments p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = (select auth.uid())
      and p.status = 'pending'
  )
);

create policy payment_proofs_select on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_super_admin()
    or public.admin_has_permission('payments.read')
    or public.admin_has_permission('payments.validate')
  )
);

create policy payment_proofs_owner_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.payments p
    where p.id::text = (storage.foldername(name))[2]
      and p.user_id = (select auth.uid())
      and p.status = 'pending'
  )
);

create or replace function public.attach_payment_proof(p_payment_id uuid, p_path text)
returns public.payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_admin record;
begin
  if v_user is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;
  if public.get_my_role() <> 'manager' then
    raise exception 'Réservé aux managers' using errcode = '42501';
  end if;
  if p_payment_id is null or p_path is null then
    raise exception 'Paiement ou fichier manquant';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null or v_payment.user_id <> v_user then
    raise exception 'Paiement introuvable' using errcode = '42501';
  end if;
  if v_payment.status <> 'pending' then
    raise exception 'Ce paiement n''accepte plus de preuve';
  end if;
  if p_path !~ ('^' || v_user::text || '/' || p_payment_id::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception 'Chemin de preuve invalide';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'payment-proofs' and o.name = p_path) then
    raise exception 'Fichier de preuve introuvable';
  end if;

  update public.payments
  set proof_url = p_path,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('proof_uploaded_at', now()),
      updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  for v_admin in select id from public.profiles where role = 'admin' loop
    insert into public.notifications (user_id, type, title, message, data, is_read, created_at)
    values (v_admin.id, 'payment', 'Preuve de paiement reçue',
            concat('Une preuve a été ajoutée au paiement ', coalesce(v_payment.reference, v_payment.id::text), '.'),
            jsonb_build_object('payment_id', v_payment.id), false, now());
  end loop;

  return v_payment;
end;
$$;

revoke all on function public.attach_payment_proof(uuid, text) from public, anon;
grant execute on function public.attach_payment_proof(uuid, text) to authenticated;