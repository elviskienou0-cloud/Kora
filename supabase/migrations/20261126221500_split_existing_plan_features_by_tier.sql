-- Marketing feature lists are tier-specific and non-overlapping.
-- These lists describe each tier's new benefits; subscription capabilities remain cumulative.
UPDATE public.plans
SET features = '["Profil talent", "Portfolio et médias", "Gestion du cachet", "Profil manager"]'::jsonb,
    updated_at = now()
WHERE upper(id) = 'FREE';

UPDATE public.plans
SET features = '["Gestion des talents", "Gestion des demandes", "Messagerie", "Notifications"]'::jsonb,
    updated_at = now()
WHERE upper(id) = 'PRO';

UPDATE public.plans
SET features = '["Gestion des projets", "Organisation du portefeuille de talents"]'::jsonb,
    updated_at = now()
WHERE upper(id) = 'BUSINESS';
