
revoke execute on function public.write_admin_audit_log(text,text,uuid,uuid,jsonb) from authenticated;
grant execute on function public.write_admin_audit_log(text,text,uuid,uuid,jsonb) to service_role;
