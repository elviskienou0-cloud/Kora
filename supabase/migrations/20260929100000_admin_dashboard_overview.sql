-- KORA — métriques du tableau de bord admin (une seule requête, calculée côté serveur).
-- Réservée aux admins : le contrôle is_admin() est fait dans la fonction.
create or replace function public.admin_dashboard_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_now        timestamptz := now();
  v_month      timestamptz := date_trunc('month', now());
  v_prev_month timestamptz := date_trunc('month', now()) - interval '1 month';
  v_result     jsonb;
begin
  if not public.is_admin() then
    raise exception 'Accès administrateur requis' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', v_now,
    'totals', jsonb_build_object(
      'users',    (select count(*) from public.profiles),
      'clients',  (select count(*) from public.profiles where role = 'client'),
      'managers', (select count(*) from public.profiles where role = 'manager'),
      'admins',   (select count(*) from public.profiles where role in ('admin','super_admin')),
      'talents',  (select count(*) from public.talent_profiles),
      'active_projects', (select count(*) from public.projects where status in ('active','in_progress')),
      'payments_month', coalesce((select sum(amount) from public.payments
          where status in ('paid','approved') and coalesce(paid_at, created_at) >= v_month), 0),
      'payments_currency', 'FCFA'
    ),
    'previous', jsonb_build_object(
      'users',    (select count(*) from public.profiles where created_at < v_month),
      'clients',  (select count(*) from public.profiles where role = 'client'  and created_at < v_month),
      'managers', (select count(*) from public.profiles where role = 'manager' and created_at < v_month),
      'talents',  (select count(*) from public.talent_profiles where created_at < v_month),
      'projects_new_month', (select count(*) from public.projects where created_at >= v_month),
      'projects_new_prev',  (select count(*) from public.projects where created_at >= v_prev_month and created_at < v_month),
      'payments_prev_month', coalesce((select sum(amount) from public.payments
          where status in ('paid','approved')
            and coalesce(paid_at, created_at) >= v_prev_month
            and coalesce(paid_at, created_at) <  v_month), 0)
    ),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d, 'DD/MM'),
        'clients',  (select count(*) from public.profiles p where p.role = 'client'  and p.created_at < d + interval '1 day'),
        'managers', (select count(*) from public.profiles p where p.role = 'manager' and p.created_at < d + interval '1 day')
      ) order by d), '[]'::jsonb)
      from generate_series(date_trunc('day', v_now) - interval '6 day', date_trunc('day', v_now), interval '1 day') d
    ),
    'recent_users', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select id, name, role, avatar, created_at, coalesce(is_suspended,false) as is_suspended
        from public.profiles order by created_at desc limit 5) x
    ),
    'recent_requests', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select r.id, r.status, r.created_at,
               coalesce(c.name, '—') as client_name,
               coalesce(nullif(trim(coalesce(t.first_name,'') || ' ' || coalesce(t.last_name,'')), ''), '—') as talent_name
        from public.requests r
        left join public.profiles c on c.id = r.client_id
        left join public.talent_profiles t on t.id = r.talent_id
        order by r.created_at desc limit 5) x
    ),
    'recent_payments', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select p.id, p.amount, p.currency, p.status, p.created_at,
               coalesce(u.name, '—') as payer_name
        from public.payments p
        left join public.profiles u on u.id = p.user_id
        order by p.created_at desc limit 5) x
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_dashboard_overview() from public, anon;
grant execute on function public.admin_dashboard_overview() to authenticated;
