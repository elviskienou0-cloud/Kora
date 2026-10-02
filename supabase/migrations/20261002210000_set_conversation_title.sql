begin;

create or replace function public.set_conversation_title(
  p_conversation_id uuid,
  p_title text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_title text;
begin
  clean_title := nullif(trim(coalesce(p_title, '')), '');

  if clean_title is null then
    raise exception 'Le nom de la conversation est requis.';
  end if;

  if not exists (
    select 1
    from public.conversation_participants
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  ) then
    raise exception 'Accès refusé à cette conversation.';
  end if;

  update public.conversations
  set title = left(clean_title, 200),
      updated_at = now()
  where id = p_conversation_id;
end;
$$;

revoke all on function public.set_conversation_title(uuid, text) from public;
grant execute on function public.set_conversation_title(uuid, text) to authenticated;

commit;
