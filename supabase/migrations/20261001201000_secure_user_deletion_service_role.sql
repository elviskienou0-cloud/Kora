-- KORA — autoriser le nettoyage complet des comptes uniquement au service role.
-- L'Edge Function admin-users effectue déjà toute l'autorisation métier avant
-- d'appeler cette RPC avec la clé service role.

begin;

revoke all on function public.admin_delete_user_data(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_user_data(uuid) to service_role;

commit;
