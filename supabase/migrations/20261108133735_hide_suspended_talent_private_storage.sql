DROP POLICY IF EXISTS "Read published talent profile media" ON storage.objects;
CREATE POLICY "Read published talent profile media"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'talent-profile-media'
  AND split_part(name, '/', 1) = (
    SELECT tp.managed_by::text
    FROM public.talent_profiles tp
    WHERE tp.id::text = split_part(objects.name, '/', 2)
      AND public.is_talent_public(tp.id)
  )
);

DROP POLICY IF EXISTS talent_portfolio_public_select ON storage.objects;
CREATE POLICY talent_portfolio_public_select
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'talent-portfolio'
  AND EXISTS (
    SELECT 1
    FROM public.talent_profiles tp
    WHERE tp.id = (storage.foldername(objects.name))[1]::uuid
      AND (
        public.is_talent_public(tp.id)
        OR tp.managed_by = auth.uid()
        OR public.is_admin()
      )
  )
);
