-- KORA — consentements légaux et marketing
begin;

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','privacy','marketing')),
  consent_given boolean not null default true,
  policy_version text not null,
  source text not null default 'registration',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_consents_user_id_idx on public.user_consents(user_id);
create index if not exists user_consents_type_idx on public.user_consents(user_id, consent_type);
alter table public.user_consents enable row level security;

drop policy if exists "Users can view their own consents" on public.user_consents;
create policy "Users can view their own consents" on public.user_consents for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can update their marketing consent" on public.user_consents;
create policy "Users can update their marketing consent" on public.user_consents for update to authenticated using (auth.uid() = user_id and consent_type = 'marketing') with check (auth.uid() = user_id and consent_type = 'marketing');

create or replace function public.set_my_marketing_consent(p_enabled boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Connexion requise' using errcode = '42501'; end if;
  insert into public.user_consents(user_id, consent_type, consent_given, policy_version, source, granted_at, revoked_at)
  values (v_user_id, 'marketing', coalesce(p_enabled,false), '2026-10-05', 'preferences', now(), case when coalesce(p_enabled,false) then null else now() end);
  return jsonb_build_object('ok',true,'marketing',coalesce(p_enabled,false));
end;
$$;

revoke all on function public.set_my_marketing_consent(boolean) from public, anon;
grant execute on function public.set_my_marketing_consent(boolean) to authenticated;

create or replace function public.record_registration_consents()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  terms_ok boolean := coalesce((metadata->>'accepted_terms')::boolean,false);
  privacy_ok boolean := coalesce((metadata->>'accepted_privacy')::boolean,false);
  marketing_ok boolean := coalesce((metadata->>'marketing_consent')::boolean,false);
begin
  if terms_ok then
    insert into public.user_consents(user_id,consent_type,consent_given,policy_version,source) values(new.id,'terms',true,'2026-10-05','registration');
  end if;
  if privacy_ok then
    insert into public.user_consents(user_id,consent_type,consent_given,policy_version,source) values(new.id,'privacy',true,'2026-10-05','registration');
  end if;
  insert into public.user_consents(user_id,consent_type,consent_given,policy_version,source,revoked_at)
  values(new.id,'marketing',marketing_ok,'2026-10-05','registration',case when marketing_ok then null else now() end);
  return new;
end;
$$;

drop trigger if exists on_auth_user_record_registration_consents on auth.users;
create trigger on_auth_user_record_registration_consents after insert on auth.users for each row execute function public.record_registration_consents();

commit;
