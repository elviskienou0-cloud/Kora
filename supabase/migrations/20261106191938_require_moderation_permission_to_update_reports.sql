
create or replace function public.admin_update_report(
  p_report_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.reports
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_report public.reports%rowtype;
  v_status text := lower(trim(coalesce(p_status, '')));
begin
  perform public.admin_require_permission('moderation.manage');

  if p_report_id is null then
    raise exception 'Signalement manquant';
  end if;

  if v_status not in ('open', 'reviewing', 'resolved', 'rejected') then
    raise exception 'Statut de signalement invalide';
  end if;

  update public.reports
  set
    status = v_status,
    admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
    resolved_by = case
      when v_status in ('resolved', 'rejected') then auth.uid()
      else null
    end,
    resolved_at = case
      when v_status in ('resolved', 'rejected') then now()
      else null
    end,
    updated_at = now()
  where id = p_report_id
  returning * into v_report;

  if v_report.id is null then
    raise exception 'Signalement introuvable';
  end if;

  perform public.write_admin_audit_log(
    'report.update',
    'report',
    v_report.id,
    null,
    jsonb_build_object('status', v_report.status)
  );

  return v_report;
end;
$function$;
