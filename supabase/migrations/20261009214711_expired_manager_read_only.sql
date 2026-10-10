-- Keep expired managers read-only: no new direct conversations or message writes.

create or replace function public.create_direct_conversation(
  p_other_user_id uuid,
  p_talent_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid := auth.uid();
  v_role text;
  v_conversation_id uuid;
  v_talent_name text;
  v_manager_id uuid;
begin
  if v_me is null then
    raise exception 'Connexion requise.';
  end if;

  select role into v_role from public.profiles where id = v_me;
  if v_role = 'manager' and not public.manager_has_active_plan() then
    raise exception 'Votre abonnement a expiré. Renouvelez-le pour effectuer cette action.';
  end if;

  if p_other_user_id is null then
    raise exception 'Destinataire manquant.';
  end if;
  if p_talent_id is null then
    raise exception 'Talent manquant.';
  end if;
  if v_me = p_other_user_id then
    raise exception 'Vous ne pouvez pas démarrer une conversation avec vous-même.';
  end if;

  select nullif(trim(concat_ws(' ', tp.first_name, tp.last_name)), ''), tp.managed_by
    into v_talent_name, v_manager_id
  from public.talent_profiles tp
  where tp.id = p_talent_id;

  if not found then
    raise exception 'Talent introuvable.';
  end if;
  if v_manager_id is null then
    raise exception 'Ce talent n''a pas de manager valide.';
  end if;
  if v_me <> v_manager_id and p_other_user_id <> v_manager_id then
    raise exception 'La conversation doit inclure le manager du talent.';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  join public.conversation_participants cp_me
    on cp_me.conversation_id = c.id and cp_me.user_id = v_me
  join public.conversation_participants cp_other
    on cp_other.conversation_id = c.id and cp_other.user_id = p_other_user_id
  where c.talent_id = p_talent_id
    and (select count(*) from public.conversation_participants cp where cp.conversation_id = c.id) = 2
  order by c.created_at asc
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  if v_talent_name is not null then
    select c.id into v_conversation_id
    from public.conversations c
    join public.conversation_participants cp_me
      on cp_me.conversation_id = c.id and cp_me.user_id = v_me
    join public.conversation_participants cp_other
      on cp_other.conversation_id = c.id and cp_other.user_id = p_other_user_id
    where c.talent_id is null
      and lower(trim(coalesce(c.title, ''))) = lower(trim(v_talent_name))
      and (select count(*) from public.conversation_participants cp where cp.conversation_id = c.id) = 2
    order by c.created_at asc
    limit 1;

    if v_conversation_id is not null then
      update public.conversations
         set talent_id = p_talent_id, title = left(v_talent_name, 200), updated_at = now()
       where id = v_conversation_id;
      return v_conversation_id;
    end if;
  end if;

  insert into public.conversations (talent_id, title)
  values (p_talent_id, left(coalesce(v_talent_name, 'Conversation'), 200))
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (v_conversation_id, v_me), (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

drop policy if exists messages_insert on public.messages;
create policy messages_insert
on public.messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and (public.is_conversation_member(conversation_id) or public.is_admin())
  and (public.get_my_role() <> 'manager' or public.manager_has_active_plan())
);

drop policy if exists messages_update on public.messages;
create policy messages_update
on public.messages
for update
to authenticated
using (
  (public.is_conversation_member(conversation_id) or public.is_admin())
  and (public.get_my_role() <> 'manager' or public.manager_has_active_plan())
)
with check (
  (public.is_conversation_member(conversation_id) or public.is_admin())
  and (public.get_my_role() <> 'manager' or public.manager_has_active_plan())
);
