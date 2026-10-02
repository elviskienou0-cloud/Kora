-- KORA: paramètres d'administration persistés dans Supabase
-- Date: 2026-09-29

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create or replace function public.set_app_settings_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_app_settings_updated_at();

insert into public.app_settings (key, value, description, is_public)
values
  ('site_name', '"KORA"', 'Nom public de la plateforme', true),
  ('site_tagline', '"La plateforme des talents africains"', 'Slogan public', true),
  ('support_email', '"kora.support2@gmail.com"', 'Adresse support', true),
  ('contact_email', '"kora.contact1@gmail.com"', 'Adresse de contact', true),
  ('currency', '"XOF"', 'Devise principale', true),
  ('commission_rate', '5', 'Commission KORA en pourcentage sur les transactions Business', true),
  ('maintenance_mode', 'false', 'Active le mode maintenance', true),
  ('registrations_enabled', 'true', 'Autorise les nouvelles inscriptions', true),
  ('talent_auto_publish', 'false', 'Publie automatiquement les nouveaux talents', true)
on conflict (key) do nothing;

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select
on public.app_settings
for select
to anon, authenticated
using (is_public = true or public.is_admin());

drop policy if exists app_settings_admin_insert on public.app_settings;
create policy app_settings_admin_insert
on public.app_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists app_settings_admin_update on public.app_settings;
create policy app_settings_admin_update
on public.app_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_kora_settings()
returns table (
  key text,
  value jsonb,
  description text,
  is_public boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select s.key, s.value, s.description, s.is_public, s.updated_at
  from public.app_settings s
  where public.is_admin() or s.is_public
  order by s.key;
end;
$$;

revoke all on function public.get_kora_settings() from public;
grant execute on function public.get_kora_settings() to anon, authenticated;

create or replace function public.update_kora_setting(
  p_key text,
  p_value jsonb
)
returns public.app_settings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_setting public.app_settings;
  v_numeric numeric;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis';
  end if;

  if p_key is null or length(trim(p_key)) = 0 or p_value is null then
    raise exception 'Paramètre invalide';
  end if;

  if trim(p_key) = 'commission_rate' then
    begin
      v_numeric := (p_value #>> '{}')::numeric;
    exception when others then
      raise exception 'La commission doit être un nombre';
    end;

    if v_numeric < 0 or v_numeric > 100 then
      raise exception 'La commission doit être comprise entre 0 et 100';
    end if;
  end if;

  update public.app_settings
  set value = p_value, updated_by = auth.uid()
  where key = trim(p_key)
  returning * into v_setting;

  if not found then
    insert into public.app_settings(key, value, description, is_public, updated_by)
    values (trim(p_key), p_value, 'Paramètre créé depuis KORA', true, auth.uid())
    returning * into v_setting;
  end if;

  insert into public.admin_audit_logs (
    actor_id, action, entity_type, metadata
  )
  values (
    auth.uid(),
    'update_setting',
    'app_setting',
    jsonb_build_object('key', v_setting.key, 'value', v_setting.value)
  );

  return v_setting;
end;
$$;

revoke all on function public.update_kora_setting(text, jsonb) from public;
grant execute on function public.update_kora_setting(text, jsonb) to authenticated;

create or replace function public.get_kora_setting_numeric(
  p_key text,
  p_default numeric
)
returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_value jsonb;
begin
  select value into v_value
  from public.app_settings
  where key = p_key;

  if v_value is null then
    return p_default;
  end if;

  begin
    return greatest(0, least(100, (v_value #>> '{}')::numeric));
  exception when others then
    return p_default;
  end;
end;
$$;

revoke all on function public.get_kora_setting_numeric(text, numeric) from public;
grant execute on function public.get_kora_setting_numeric(text, numeric) to anon, authenticated;

create or replace function public.apply_kora_transaction_commission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rate numeric;
  v_commission numeric;
begin
  v_rate := public.get_kora_setting_numeric('commission_rate', 5);
  v_commission := round((coalesce(new.amount, 0)::numeric * v_rate) / 100, 2);
  new.commission_rate := v_rate;
  new.commission_amount := v_commission;
  new.manager_amount := greatest(0, coalesce(new.amount, 0)::numeric - v_commission);
  return new;
end;
$$;

drop trigger if exists trg_kora_transaction_commission on public.kora_transactions;
create trigger trg_kora_transaction_commission
before insert or update of amount on public.kora_transactions
for each row
execute function public.apply_kora_transaction_commission();

revoke all on function public.apply_kora_transaction_commission() from public;
