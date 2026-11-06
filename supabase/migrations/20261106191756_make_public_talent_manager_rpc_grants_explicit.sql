
revoke execute on function public.get_talent_manager_profile(uuid) from public;
grant execute on function public.get_talent_manager_profile(uuid) to anon, authenticated, service_role;
