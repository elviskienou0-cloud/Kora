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

create policy "Read published or owned talent profile media"
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
      and (
        (tp.status = 'published' and tp.is_visible = true)
        or tp.managed_by = (select auth.uid())
        or public.is_admin()
      )
  )
);

commit;
