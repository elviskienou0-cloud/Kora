-- KORA — colonnes de profil modifiables par l'utilisateur.
-- Avant : seules `name` et `avatar` étaient modifiables (les paramètres du profil échouaient
-- avec "permission denied"). `role`, `is_suspended`, `suspended_*` restent verrouillés.
grant update (phone, city, company, bio, preferences, cover_url) on public.profiles to authenticated;
