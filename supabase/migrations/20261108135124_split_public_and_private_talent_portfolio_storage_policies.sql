DROP POLICY IF EXISTS talent_portfolio_public_select ON storage.objects;

-- Public visitors can read only portfolios belonging to currently public talents.
-- Keep owner and administrator reads in authenticated-only policies so anon
-- never evaluates is_admin(), which is intentionally not executable by anon.
CREATE POLICY talent_portfolio_public_select
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'talent-portfolio'
  AND EXISTS (
    SELECT 1
    FROM public.talent_profiles tp
    WHERE tp.id = (storage.foldername(objects.name))[1]::uuid
      AND public.is_talent_public(tp.id)
  )
);

CREATE POLICY talent_portfolio_owner_select
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'talent-portfolio'
  AND EXISTS (
    SELECT 1
    FROM public.talent_profiles tp
    WHERE tp.id = (storage.foldername(objects.name))[1]::uuid
      AND tp.managed_by = auth.uid()
  )
);

CREATE POLICY talent_portfolio_admin_select
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'talent-portfolio' AND public.is_admin());
