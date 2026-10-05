-- KORA — verrouillage final de la RPC de suppression administrateur
begin;
revoke all on function public.admin_delete_user_data(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_user_data(uuid) to service_role;
commit;
