-- KORA: sécurisation du Storage du portfolio des talents
insert into storage.buckets (id, name, public)
values ('talent-portfolio', 'talent-portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read talent portfolio" on storage.objects;
create policy "Public read talent portfolio" on storage.objects
for select to public using (bucket_id = 'talent-portfolio');

drop policy if exists "Managers upload own talent portfolio" on storage.objects;
create policy "Managers upload own talent portfolio" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'talent-portfolio'
  and split_part(name, '/', 1) <> ''
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(name, '/', 1)
      and tp.managed_by = auth.uid()
  )
);

drop policy if exists "Managers update own talent portfolio" on storage.objects;
create policy "Managers update own talent portfolio" on storage.objects
for update to authenticated
using (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(name, '/', 1)
      and tp.managed_by = auth.uid()
  )
)
with check (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(name, '/', 1)
      and tp.managed_by = auth.uid()
  )
);

drop policy if exists "Managers delete own talent portfolio" on storage.objects;
create policy "Managers delete own talent portfolio" on storage.objects
for delete to authenticated
using (
  bucket_id = 'talent-portfolio'
  and exists (
    select 1 from public.talent_profiles tp
    where tp.id::text = split_part(name, '/', 1)
      and tp.managed_by = auth.uid()
  )
);