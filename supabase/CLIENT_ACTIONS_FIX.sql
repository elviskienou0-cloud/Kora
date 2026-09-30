-- KORA — actions client : contact direct
begin;

create or replace function public.create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_me is null then raise exception 'Connexion requise.'; end if;
  if p_other_user_id is null then raise exception 'Destinataire manquant.'; end if;
  if v_me = p_other_user_id then raise exception 'Vous ne pouvez pas démarrer une conversation avec vous-même.'; end if;

  select cp1.conversation_id into v_conversation_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2 on cp2.conversation_id = cp1.conversation_id
  where cp1.user_id = v_me and cp2.user_id = p_other_user_id
  group by cp1.conversation_id
  having count(*) = 2
  limit 1;

  if v_conversation_id is not null then return v_conversation_id; end if;

  insert into public.conversations default values returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (v_conversation_id, v_me), (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

commit;

select routine_name
from information_schema.routines
where routine_schema='public'
and routine_name in ('create_direct_conversation','create_request_from_talent_v2','create_talent_review','create_project_review')
order by routine_name;