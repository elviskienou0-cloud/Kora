-- KORA: consent validation must not depend on a client-controlled
-- kora_public_registration flag. The only exception is a server-created,
-- pending administrator invitation matching the invited email.
begin;

create or replace function public.validate_public_registration_consents()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  terms_ok boolean := coalesce((metadata->>'accepted_terms')::boolean, false);
  privacy_ok boolean := coalesce((metadata->>'accepted_privacy')::boolean, false);
  is_admin_invitation boolean := coalesce((metadata->>'kora_admin_invitation')::boolean, false);
  has_trusted_pending_invitation boolean := false;
begin
  if is_admin_invitation then
    select exists (
      select 1
      from public.admin_invitations ai
      where lower(ai.email) = lower(coalesce(new.email, ''))
        and ai.status = 'pending'
    ) into has_trusted_pending_invitation;

    if not has_trusted_pending_invitation then
      raise exception 'Invitation administrateur invalide.'
        using errcode = '23514';
    end if;
  elsif not terms_ok or not privacy_ok then
    raise exception 'L''acceptation des CGU et de la Politique de confidentialité est obligatoire pour créer un compte KORA.'
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

commit;
