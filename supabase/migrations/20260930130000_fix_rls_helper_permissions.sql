-- KORA — correction des permissions d'exécution des helpers RLS
-- Les policies PostgREST de talent_profiles/profils appellent is_admin().
-- Sans EXECUTE pour le rôle API, PostgREST renvoie 401 / 42501.
-- Idempotent.

begin;

-- is_admin() est un helper de décision RLS : il ne donne aucun accès
-- à lui seul et doit pouvoir être appelé par les rôles API.
grant execute on function public.is_admin() to anon, authenticated;

-- Ces helpers sont appelés par des policies réservées aux utilisateurs
-- authentifiés/admins. On garantit leur exécution côté API.
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.admin_has_permission(text) to authenticated;

commit;
