-- KORA MONETISATION V2
-- Essai 30j / 1 talent | Pro 3 000 XOF / 3 talents | Business 0 XOF / multi-talents / 5%.
-- Paiement/payouts are deliberately provider-neutral.

begin;

create table if not exists public.plans (
  id text primary key,
  name text not null,
  price numeric not null default 0,
  currency text not null default 'XOF',
  duration_months integer not null default 1,
  talent_limit integer,
  features jsonb not null default '{}'::jsonb,
  trial_days integer not null default 0,
  annual_discount_pct numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.plans add column if not exists name text;
alter table public.plans add column if not exists price numeric not null default 0;
alter table public.plans add column if not exists currency text not null default 'XOF';
alter table public.plans add column if not exists duration_months integer not null default 1;
alter table public.plans add column if not exists talent_limit integer;
alter table public.plans add column if not exists features jsonb not null default '{}'::jsonb;
alter table public.plans add column if not exists trial_days integer not null default 0;
alter table public.plans add column if not exists annual_discount_pct numeric not null default 0;
alter table public.plans add column if not exists is_active boolean not null default true;
alter table public.plans add column if not exists created_at timestamptz not null default now();
alter table public.plans add column if not exists updated_at timestamptz not null default now();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text not null,
  status text not null default 'trialing',
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions add column if not exists user_id uuid;
alter table public.subscriptions add column if not exists plan_id text;
alter table public.subscriptions add column if not exists status text not null default 'trialing';
alter table public.subscriptions add column if not exists trial_start timestamptz;
alter table public.subscriptions add column if not exists trial_end timestamptz;
alter table public.subscriptions add column if not exists current_period_start timestamptz;
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists created_at timestamptz not null default now();
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subscription_id uuid,
  plan_id text,
  provider text not null default 'unconfigured',
  provider_payment_id text,
  reference text not null unique,
  amount numeric not null default 0,
  currency text not null default 'XOF',
  billing_cycle text not null default 'monthly',
  status text not null default 'pending',
  checkout_url text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments add column if not exists user_id uuid;
alter table public.payments add column if not exists subscription_id uuid;
alter table public.payments add column if not exists plan_id text;
alter table public.payments add column if not exists provider text not null default 'unconfigured';
alter table public.payments add column if not exists provider_payment_id text;
alter table public.payments add column if not exists reference text;
alter table public.payments add column if not exists amount numeric not null default 0;
alter table public.payments add column if not exists currency text not null default 'XOF';
alter table public.payments add column if not exists billing_cycle text not null default 'monthly';
alter table public.payments add column if not exists status text not null default 'pending';
alter table public.payments add column if not exists checkout_url text;
alter table public.payments add column if not exists paid_at timestamptz;
alter table public.payments add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.payments add column if not exists created_at timestamptz not null default now();
alter table public.payments add column if not exists updated_at timestamptz not null default now();

-- Normalise les anciennes offres si elles existent.
update public.plans set name='Essai',price=0,currency='XOF',duration_months=1,talent_limit=1,
features='{"professional_tools":true,"kora_transactions":false,"commission_pct":0}'::jsonb,
trial_days=30,annual_discount_pct=0,is_active=true,updated_at=now()
where lower(coalesce(name,'')) in ('discovery','free','essai');

update public.plans set name='Pro',price=3000,currency='XOF',duration_months=1,talent_limit=3,
features='{"professional_tools":true,"kora_transactions":false,"commission_pct":0}'::jsonb,
trial_days=0,annual_discount_pct=0,is_active=true,updated_at=now()
where lower(coalesce(name,'')) in ('talent pro','premium','pro');

update public.plans set name='Business',price=0,currency='XOF',duration_months=1,talent_limit=null,
features='{"professional_tools":true,"kora_transactions":true,"commission_pct":5}'::jsonb,
trial_days=0,annual_discount_pct=0,is_active=true,updated_at=now()
where lower(coalesce(name,''))='business';

insert into public.plans(name,price,currency,duration_months,talent_limit,features,trial_days,annual_discount_pct,is_active)
select 'Essai',0,'XOF',1,1,'{"professional_tools":true,"kora_transactions":false,"commission_pct":0}',30,0,true
where not exists(select 1 from public.plans where lower(coalesce(name,''))='essai');
insert into public.plans(name,price,currency,duration_months,talent_limit,features,trial_days,annual_discount_pct,is_active)
select 'Pro',3000,'XOF',1,3,'{"professional_tools":true,"kora_transactions":false,"commission_pct":0}',0,0,true
where not exists(select 1 from public.plans where lower(coalesce(name,''))='pro');
insert into public.plans(name,price,currency,duration_months,talent_limit,features,trial_days,annual_discount_pct,is_active)
select 'Business',0,'XOF',1,null,'{"professional_tools":true,"kora_transactions":true,"commission_pct":5}',0,0,true
where not exists(select 1 from public.plans where lower(coalesce(name,''))='business');

create table if not exists public.kora_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  manager_id uuid not null,
  talent_id uuid,
  project_id uuid,
  amount numeric not null check(amount>0),
  currency text not null default 'XOF',
  commission_rate numeric not null default 5 check(commission_rate between 0 and 100),
  commission_amount numeric not null default 0,
  manager_amount numeric not null default 0,
  status text not null default 'pending' check(status in ('pending','paid','failed','refunded','cancelled')),
  provider text not null default 'unconfigured',
  provider_payment_id text,
  reference text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.kora_payouts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.kora_transactions(id) on delete cascade,
  manager_id uuid not null,
  amount numeric not null check(amount>0),
  currency text not null default 'XOF',
  provider text not null default 'unconfigured',
  provider_payout_id text,
  status text not null default 'pending' check(status in ('pending','processing','paid','failed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists kora_transactions_client_idx on public.kora_transactions(client_id,created_at desc);
create index if not exists kora_transactions_manager_idx on public.kora_transactions(manager_id,created_at desc);
create index if not exists kora_transactions_status_idx on public.kora_transactions(status,created_at desc);
create index if not exists kora_payouts_manager_idx on public.kora_payouts(manager_id,created_at desc);

create or replace function public.ensure_my_manager_subscription()
returns public.subscriptions
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid(); v_role text; v_sub public.subscriptions%rowtype; v_plan public.plans%rowtype;
begin
  if v_user is null then raise exception 'Connexion requise'; end if;
  select role into v_role from public.profiles where id=v_user;
  if v_role<>'manager' then raise exception 'Compte manager requis'; end if;
  select * into v_sub from public.subscriptions where user_id=v_user order by created_at desc limit 1 for update;
  if v_sub.id is not null then
    if v_sub.status='trialing' and v_sub.trial_end is not null and v_sub.trial_end<=now() then
      update public.subscriptions set status='expired',updated_at=now() where id=v_sub.id returning * into v_sub;
    end if;
    return v_sub;
  end if;
  select * into v_plan from public.plans where lower(name)='essai' and is_active=true order by created_at desc limit 1;
  if v_plan.id is null then raise exception 'Plan Essai introuvable'; end if;
  insert into public.subscriptions(user_id,plan_id,status,trial_start,trial_end,current_period_start,current_period_end)
  values(v_user,v_plan.id,'trialing',now(),now()+make_interval(days=>v_plan.trial_days),now(),now()+make_interval(days=>v_plan.trial_days))
  returning * into v_sub;
  return v_sub;
end;
$$;
revoke all on function public.ensure_my_manager_subscription() from public,anon;
grant execute on function public.ensure_my_manager_subscription() to authenticated;

create or replace function public.activate_business_plan()
returns public.subscriptions
language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_user uuid:=auth.uid(); v_sub public.subscriptions%rowtype; v_plan public.plans%rowtype;
begin
  if v_user is null then raise exception 'Connexion requise'; end if;
  if (select role from public.profiles where id=v_user)<>'manager' then raise exception 'Compte manager requis'; end if;
  perform public.ensure_my_manager_subscription();
  select * into v_sub from public.subscriptions where user_id=v_user order by created_at desc limit 1 for update;
  select * into v_plan from public.plans where lower(name)='business' and is_active=true order by created_at desc limit 1;
  update public.subscriptions set plan_id=v_plan.id,status='active',trial_start=null,trial_end=null,current_period_start=null,current_period_end=null,updated_at=now()
  where id=v_sub.id returning * into v_sub;
  return v_sub;
end;
$$;
revoke all on function public.activate_business_plan() from public,anon;
grant execute on function public.activate_business_plan() to authenticated;

create or replace function public.create_manager_talent(
  p_managed_by uuid,p_first_name text,p_last_name text,p_title text,p_bio text,
  p_category_id uuid,p_country_id uuid,p_city text,p_available boolean default true
)
returns uuid
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid(); v_sub public.subscriptions%rowtype; v_plan public.plans%rowtype; v_count bigint; v_id uuid;
begin
  if v_user is null or p_managed_by is null or p_managed_by<>v_user then raise exception 'Action non autorisée'; end if;
  v_sub:=public.ensure_my_manager_subscription();
  if v_sub.status='expired' then raise exception 'Votre période d''essai est terminée. Choisissez Pro ou Business.'; end if;
  select * into v_plan from public.plans where id=v_sub.plan_id and is_active=true;
  select count(*) into v_count from public.talent_profiles where managed_by=v_user;
  if v_plan.talent_limit is not null and v_count>=v_plan.talent_limit then
    raise exception 'Limite de talents atteinte pour le plan % (% talent(s)).',v_plan.name,v_plan.talent_limit;
  end if;
  insert into public.talent_profiles(managed_by,first_name,last_name,title,bio,category_id,country_id,city,currency,available,verified,status,is_visible,rating,reviews_count,completed_projects)
  values(v_user,trim(p_first_name),nullif(trim(p_last_name),''),trim(p_title),trim(p_bio),p_category_id,p_country_id,trim(p_city),'XOF',coalesce(p_available,true),false,'pending',false,0,0,0)
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.create_manager_talent(uuid,text,text,text,text,uuid,uuid,text,boolean) from public,anon;
grant execute on function public.create_manager_talent(uuid,text,text,text,text,uuid,uuid,text,boolean) to authenticated;

create or replace function public.create_subscription_payment(
  p_plan_id public.plans.id%type,p_billing_cycle text default 'monthly',p_provider text default 'unconfigured'
)
returns public.payments
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_user uuid:=auth.uid(); v_plan public.plans%rowtype; v_sub public.subscriptions%rowtype; v_payment public.payments%rowtype; v_ref text;
begin
  if v_user is null then raise exception 'Connexion requise'; end if;
  select * into v_plan from public.plans where id=p_plan_id and is_active=true;
  if v_plan.id is null then raise exception 'Plan introuvable'; end if;
  if lower(v_plan.name)<>'pro' then raise exception 'Ce plan ne nécessite pas de paiement via cette fonction'; end if;
  if v_plan.price<=0 then raise exception 'Montant invalide'; end if;
  perform public.ensure_my_manager_subscription();
  select * into v_sub from public.subscriptions where user_id=v_user order by created_at desc limit 1 for update;
  v_ref:='KORA-SUB-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,18));
  insert into public.payments(user_id,subscription_id,plan_id,provider,reference,amount,currency,billing_cycle,status,metadata)
  values(v_user,v_sub.id,p_plan_id,coalesce(nullif(p_provider,''),'unconfigured'),v_ref,v_plan.price,v_plan.currency,coalesce(nullif(p_billing_cycle,''),'monthly'),'pending','{"source":"kora_subscription"}')
  returning * into v_payment;
  return v_payment;
end;
$$;
revoke all on function public.create_subscription_payment(public.plans.id%type,text,text) from public,anon;
grant execute on function public.create_subscription_payment(public.plans.id%type,text,text) to authenticated;

create or replace function public.create_kora_transaction(
  p_manager_id uuid,p_talent_id uuid,p_project_id uuid,p_amount numeric,p_currency text default 'XOF'
)
returns public.kora_transactions
language plpgsql security definer set search_path=public,pg_temp
as $$
declare
  v_client uuid:=auth.uid(); v_sub public.subscriptions%rowtype; v_plan public.plans%rowtype;
  v_t public.kora_transactions%rowtype; v_comm numeric; v_manager numeric; v_ref text;
begin
  if v_client is null then raise exception 'Connexion requise'; end if;
  if p_manager_id is null or p_amount is null or p_amount<=0 then raise exception 'Transaction invalide'; end if;
  select * into v_sub from public.subscriptions where user_id=p_manager_id order by created_at desc limit 1;
  if v_sub.id is null then raise exception 'Manager non configuré'; end if;
  select * into v_plan from public.plans where id=v_sub.plan_id and is_active=true;
  if lower(coalesce(v_plan.name,''))<>'business' then raise exception 'Le manager doit utiliser le plan Business pour recevoir des transactions KORA'; end if;
  if p_talent_id is not null and not exists(select 1 from public.talent_profiles where id=p_talent_id and managed_by=p_manager_id) then raise exception 'Talent non rattaché au manager'; end if;
  v_comm:=round(p_amount*0.05,0); v_manager:=p_amount-v_comm; v_ref:='KORA-TXN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,18));
  insert into public.kora_transactions(client_id,manager_id,talent_id,project_id,amount,currency,commission_rate,commission_amount,manager_amount,status,reference)
  values(v_client,p_manager_id,p_talent_id,p_project_id,p_amount,coalesce(nullif(p_currency,''),'XOF'),5,v_comm,v_manager,'pending',v_ref)
  returning * into v_t;
  return v_t;
end;
$$;
revoke all on function public.create_kora_transaction(uuid,uuid,uuid,numeric,text) from public,anon;
grant execute on function public.create_kora_transaction(uuid,uuid,uuid,numeric,text) to authenticated;

alter table public.kora_transactions enable row level security;
alter table public.kora_payouts enable row level security;
drop policy if exists kora_transactions_client_read on public.kora_transactions;
drop policy if exists kora_transactions_manager_read on public.kora_transactions;
drop policy if exists kora_payouts_manager_read on public.kora_payouts;
create policy kora_transactions_client_read on public.kora_transactions for select to authenticated using(client_id=auth.uid() or public.is_admin());
create policy kora_transactions_manager_read on public.kora_transactions for select to authenticated using(manager_id=auth.uid() or public.is_admin());
create policy kora_payouts_manager_read on public.kora_payouts for select to authenticated using(manager_id=auth.uid() or public.is_admin());

commit;
