-- Plan feature lists describe the new benefits unlocked at each tier.
-- Higher tiers inherit all capabilities from lower tiers; enforcement must be
-- implemented in application and database authorization, not by hiding UI only.
UPDATE public.plans
SET features = '["Profil talent", "Portfolio et médias", "Gestion du cachet", "Profil manager", "Messagerie"]'::jsonb,
    updated_at = now()
WHERE upper(id) = 'FREE';

UPDATE public.plans
SET features = '["Gestion des talents", "Gestion des demandes", "Notifications", "Tableau de bord simplifié"]'::jsonb,
    updated_at = now()
WHERE upper(id) = 'PRO';

UPDATE public.plans
SET features = '["Gestion des projets", "Organisation du portefeuille de talents", "Tableau de bord analytique avancé", "Statistiques détaillées", "Analyse des performances des talents", "Gestion collaborative", "Invitation de collaborateurs", "Gestion des membres de l'équipe", "Permissions personnalisées", "Modification et révocation des accès", "Génération de rapports d'activité", "Export des données en PDF", "Export des données en Excel"]'::jsonb,
    updated_at = now()
WHERE upper(id) = 'BUSINESS';
