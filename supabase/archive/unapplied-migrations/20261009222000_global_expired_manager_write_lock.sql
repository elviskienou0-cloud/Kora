-- KORA: central enforcement of read-only mode for expired managers.
-- Keep SELECT/read access and billing/payment initiation available.
-- All writes on RLS-enabled application tables require an active manager plan,
-- except billing tables where existing policies/RPCs govern renewal securely.
do $$
declare
  r record;
  v_policy text;
  v_has_policy boolean;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r','p')
      and c.relrowsecurity = true
      and c.relname not in ('payments','subscriptions','plans')
  loop
    -- INSERT: restrictive policies can only use WITH CHECK.
    select exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = r.table_name
        and p.cmd in ('INSERT','ALL')
    ) into v_has_policy;
    if v_has_policy then
      v_policy := 'kora_active_plan_insert_guard';
      execute format('drop policy if exists %I on public.%I', v_policy, r.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for insert to authenticated with check (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan())',
        v_policy, r.table_name, 'manager'
      );
    end if;

    select exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = r.table_name
        and p.cmd in ('UPDATE','ALL')
    ) into v_has_policy;
    if v_has_policy then
      v_policy := 'kora_active_plan_update_guard';
      execute format('drop policy if exists %I on public.%I', v_policy, r.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for update to authenticated using (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan()) with check (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan())',
        v_policy, r.table_name, 'manager', 'manager'
      );
    end if;

    select exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = r.table_name
        and p.cmd in ('DELETE','ALL')
    ) into v_has_policy;
    if v_has_policy then
      v_policy := 'kora_active_plan_delete_guard';
      execute format('drop policy if exists %I on public.%I', v_policy, r.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for delete to authenticated using (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan())',
        v_policy, r.table_name, 'manager'
      );
    end if;
  end loop;
end $$;

-- Storage writes are also blocked for expired managers (upload, replace, delete).
do $$
declare
  v_cmd text;
  v_policy text;
  v_has_policy boolean;
begin
  if to_regclass('storage.objects') is null then return; end if;
  foreach v_cmd in array array['INSERT','UPDATE','DELETE']
  loop
    select exists (
      select 1 from pg_policies p
      where p.schemaname = 'storage' and p.tablename = 'objects'
        and p.cmd in (v_cmd,'ALL')
    ) into v_has_policy;
    if v_has_policy then
      v_policy := 'kora_active_plan_' || lower(v_cmd) || '_guard';
      execute format('drop policy if exists %I on storage.objects', v_policy);
      if v_cmd = 'INSERT' then
        execute format(
          'create policy %I on storage.objects as restrictive for insert to authenticated with check (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan())',
          v_policy, 'manager'
        );
      elsif v_cmd = 'UPDATE' then
        execute format(
          'create policy %I on storage.objects as restrictive for update to authenticated using (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan()) with check (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan())',
          v_policy, 'manager', 'manager'
        );
      else
        execute format(
          'create policy %I on storage.objects as restrictive for delete to authenticated using (public.is_admin() or public.get_my_role() <> %L or public.manager_has_active_plan())',
          v_policy, 'manager'
        );
      end if;
    end if;
  end loop;
end $$;
