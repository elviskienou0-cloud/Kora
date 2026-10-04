-- KORA: allow authenticated admin sessions to call the existing user-cleanup RPC.
-- The RPC itself remains responsible for enforcing administrator authorization.
grant execute on function public.admin_delete_user_data(uuid) to authenticated;
