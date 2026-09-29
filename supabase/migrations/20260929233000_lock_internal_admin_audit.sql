-- KORA — rendre la journalisation interne réellement interne
begin;

revoke all on function public.write_admin_audit_log_internal(
  text,text,uuid,uuid,jsonb
) from public, anon, authenticated;

-- Le propriétaire SECURITY DEFINER conserve l'exécution interne.
commit;
