-- KORA — enforcement serveur des consentements à l'inscription publique
begin;

create or replace function public.validate_public_registration_consents()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  is_public_registration boolean := coalesce((metadata->>'kora_public_registration')::boolean, false);
  terms_ok boolean := coalesce((metadata->>'accepted_terms')::boolean, false);
  privacy_ok boolean := coalesce((metadata->>'accepted_privacy')::boolean, false);
begin
  if is_public_registration and (not terms_ok or not privacy_ok) then
    raise exception 'L''acceptation des CGU et de la Politique de confidentialité est obligatoire pour créer un compte KORA.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_public_registration_consents() from public, anon, authenticated;

drop trigger if exists validate_public_registration_consents on auth.users;

create trigger validate_public_registration_consents
before insert on auth.users
for each row
execute function public.validate_public_registration_consents();

commit;
