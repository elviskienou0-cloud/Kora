-- KORA: private talent profile media with publication-aware signed reads.
-- Existing database values may contain legacy public URLs. The frontend
-- resolves both those URLs and storage:// references to short-lived signed URLs.
begin;

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif']
where id = 'talent-profile-media';

drop policy if exists "Public read talent profile media" on storage.objects;
drop policy if exists "Read published or owned talent profile media" on storage.objects;
drop policy if exists "Read published talent profile media" on storage.objects;
drop policy if exists "Read owned or admin talent profile media" on storage.objects;

-- Anonymous users can only sign/read media belonging to published, visible talent profiles.
create policy "Read published talent profile media"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'talent-profile-media'
  and exists (
    select 1
    from public.talent_profiles tp
    where tp.id::text = split_part(storage.objects.name, '/', 2)
      and tp.managed_by::text = split_part(storage.objects.name, '/', 1)
      and tp.status = 'published'
      and tp.is_visible = true
  )
);

-- Authenticated managers may read their own talent media; admins may read it for moderation.
create policy "Read owned or admin talent profile media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'talent-profile-media'
  and exists (
    select 1
    from public.talent_profiles tp
    where tp.id::text = split_part(storage.objects.name, '/', 2)
      and tp.managed_by::text = split_part(storage.objects.name, '/', 1)
      and (
        tp.managed_by = (select auth.uid())
        or public.is_admin()
      )
  )
);

commit;
