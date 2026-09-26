-- KORA — profile avatar + cover image storage
-- À exécuter dans Supabase SQL Editor.

begin;

alter table public.profiles
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-media',
  'profile-media',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "KORA profile media public read" on storage.objects;
create policy "KORA profile media public read"
on storage.objects
for select
to public
using (bucket_id = 'profile-media');

drop policy if exists "KORA profile media authenticated upload" on storage.objects;
create policy "KORA profile media authenticated upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "KORA profile media owner update" on storage.objects;
create policy "KORA profile media owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "KORA profile media owner delete" on storage.objects;
create policy "KORA profile media owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('avatar', 'cover_url')
order by ordinal_position;
