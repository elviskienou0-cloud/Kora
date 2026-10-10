-- KORA: validate participants and publication before creating new conversations.
-- Preserve existing conversations so subscription expiry does not erase access.
begin;

create or replace function public.create_direct_conversation(
  p_other_user_id uuid,
  p_talent_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_me uuid := auth.uid();
  v_role text;
  v_other_role text;
  v_conversation_id uuid;
  v_talent_name text;
  v_manager_id uuid;
  v_talent_status text;
  v_talent_visible boolean;
  v_manager_subscription public.subscriptions%rowtype;
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

  select role into v_role from public.profiles where id = v_me;
  select role into v_other_role from public.profiles where id = p_other_user_id;

  if v_role is null or v_other_role is null
     or v_role not in ('client', 'manager')
     or v_other_role not in ('client', 'manager') then
    raise exception 'Seuls un client et un manager peuvent ouvrir une conversation directe.';
  end if;
  if v_role = v_other_role then
    raise exception 'Une conversation directe doit réunir un client et un manager.';
  end if;

  select
    nullif(trim(concat_ws(' ', tp.first_name, tp.last_name)), ''),
    tp.managed_by,
    tp.status,
    tp.is_visible
  into v_talent_name, v_manager_id, v_talent_status, v_talent_visible
  from public.talent_profiles tp
  where tp.id = p_talent_id;

  if not found then
    raise exception 'Talent introuvable.';
  end if;
  if v_manager_id is null then
    raise exception 'Ce talent n''a pas de manager valide.';
  end if;

  if v_role = 'client' then
    if v_other_role <> 'manager' or p_other_user_id <> v_manager_id then
      raise exception 'Le destinataire doit être le manager de ce talent.';
    end if;
  else
    if v_other_role <> 'client' or v_me <> v_manager_id then
      raise exception 'Vous ne pouvez contacter un client qu''au sujet de vos propres talents.';
    end if;
    if not public.manager_has_active_plan() then
      raise exception 'Votre abonnement a expiré. Renouvelez-le pour effectuer cette action.';
    end if;
  end if;

  -- Reuse an existing conversation before applying creation-only checks.
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

  if v_talent_status <> 'published' or v_talent_visible is distinct from true then
    raise exception 'Ce talent n''est pas disponible pour de nouvelles conversations.';
  end if;

  -- For client-initiated conversations, also enforce the manager's plan.
  -- Existing conversations remain accessible after expiry, but new ones do not.
  select * into v_manager_subscription
  from public.subscriptions
  where user_id = v_manager_id
  order by created_at desc
  limit 1;

  if v_manager_subscription.id is null
     or v_manager_subscription.status not in ('trialing', 'active')
     or (v_manager_subscription.current_period_end is not null
         and v_manager_subscription.current_period_end <= now()) then
    raise exception 'Le manager doit disposer d''un abonnement actif pour recevoir de nouvelles conversations.';
  end if;

  insert into public.conversations (talent_id, title)
  values (p_talent_id, left(coalesce(v_talent_name, 'Conversation'), 200))
  returning id into v_conversation_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (v_conversation_id, v_me), (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$function$;

commit;
