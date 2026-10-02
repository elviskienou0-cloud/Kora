begin;

alter table public.conversations
  add column if not exists talent_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_talent_id_fkey'
      and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_talent_id_fkey
      foreign key (talent_id)
      references public.talent_profiles(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists conversations_talent_id_idx
  on public.conversations(talent_id);

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
  v_conversation_id uuid;
  v_talent_name text;
  v_manager_id uuid;
begin
  if v_me is null then
    raise exception 'Connexion requise.';
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

  select
    nullif(trim(concat_ws(' ', tp.first_name, tp.last_name)), ''),
    tp.managed_by
  into
    v_talent_name,
    v_manager_id
  from public.talent_profiles tp
  where tp.id = p_talent_id;

  if not found then
    raise exception 'Talent introuvable.';
  end if;

  if v_manager_id <> p_other_user_id then
    raise exception 'Le talent sélectionné n''est pas géré par ce destinataire.';
  end if;

  -- Priorité absolue : une conversation déjà liée à CE talent.
  select c.id
  into v_conversation_id
  from public.conversations c
  join public.conversation_participants cp_me
    on cp_me.conversation_id = c.id
   and cp_me.user_id = v_me
  join public.conversation_participants cp_other
    on cp_other.conversation_id = c.id
   and cp_other.user_id = p_other_user_id
  where c.talent_id = p_talent_id
    and (
      select count(*)
      from public.conversation_participants cp
      where cp.conversation_id = c.id
    ) = 2
  order by c.created_at asc
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  -- Compatibilité avec les anciennes conversations sans talent_id.
  -- 1) Si le titre correspond déjà au nom du talent, on la rattache.
  -- 2) Si le client et le manager n'ont qu'une seule ancienne conversation
  --    sans talent_id, on peut l'identifier sans ambiguïté et la réutiliser.
  if v_talent_name is not null then
    select c.id
    into v_conversation_id
    from public.conversations c
    join public.conversation_participants cp_me
      on cp_me.conversation_id = c.id
     and cp_me.user_id = v_me
    join public.conversation_participants cp_other
      on cp_other.conversation_id = c.id
     and cp_other.user_id = p_other_user_id
    where c.talent_id is null
      and lower(trim(coalesce(c.title, ''))) = lower(trim(v_talent_name))
      and (
        select count(*)
        from public.conversation_participants cp
        where cp.conversation_id = c.id
      ) = 2
    order by c.created_at asc
    limit 1;

    if v_conversation_id is not null then
      update public.conversations
      set talent_id = p_talent_id,
          title = left(v_talent_name, 200),
          updated_at = now()
      where id = v_conversation_id;

      return v_conversation_id;
    end if;
  end if;

  -- Ancienne conversation dont le titre était générique (ex. "Discussion").
  -- On ne la réutilise que s'il n'existe qu'une seule conversation
  -- non liée à un talent entre ces deux utilisateurs.
  select min(c.id)
  into v_conversation_id
  from public.conversations c
  join public.conversation_participants cp_me
    on cp_me.conversation_id = c.id
   and cp_me.user_id = v_me
  join public.conversation_participants cp_other
    on cp_other.conversation_id = c.id
   and cp_other.user_id = p_other_user_id
  where c.talent_id is null
    and (
      select count(*)
      from public.conversation_participants cp
      where cp.conversation_id = c.id
    ) = 2
  having count(*) = 1;

  if v_conversation_id is not null then
    update public.conversations
    set
      talent_id = p_talent_id,
      title = left(coalesce(v_talent_name, 'Conversation'), 200),
      updated_at = now()
    where id = v_conversation_id;

    return v_conversation_id;
  end if;

  insert into public.conversations (talent_id, title)
  values (p_talent_id, left(coalesce(v_talent_name, 'Conversation'), 200))
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values
    (v_conversation_id, v_me),
    (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid, uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid, uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
