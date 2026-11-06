
create or replace function public.create_request_from_talent_v2(
  p_talent_id uuid,
  p_project_id uuid default null,
  p_title text default null,
  p_project_type text default null,
  p_description text default null,
  p_project_date_start date default null,
  p_project_date_end date default null,
  p_budget numeric default null,
  p_currency text default 'XOF',
  p_location text default null,
  p_additional_info text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_client_id uuid := auth.uid();
  v_manager_id uuid;
  v_talent public.talent_profiles%rowtype;
  v_project public.projects%rowtype;
  v_manager_subscription public.subscriptions%rowtype;
  v_project_id uuid := p_project_id;
  v_request_id uuid;
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_currency text := coalesce(nullif(trim(coalesce(p_currency, '')), ''), 'XOF');
begin
  if v_client_id is null then
    raise exception 'Utilisateur non authentifié';
  end if;

  if public.get_my_role() <> 'client' and not public.is_admin() then
    raise exception 'Seul un client peut envoyer une demande';
  end if;

  if p_talent_id is null then
    raise exception 'Talent manquant';
  end if;

  if v_title is null then
    raise exception 'Le titre du projet est obligatoire';
  end if;

  if nullif(trim(coalesce(p_description, '')), '') is null then
    raise exception 'La description du projet est obligatoire';
  end if;

  if p_budget is not null and p_budget < 0 then
    raise exception 'Le budget est invalide';
  end if;

  if p_project_date_start is not null
     and p_project_date_end is not null
     and p_project_date_end < p_project_date_start then
    raise exception 'La fin de période ne peut pas être avant le début';
  end if;

  select *
    into v_talent
  from public.talent_profiles
  where id = p_talent_id
    and status = 'published'
    and coalesce(is_visible, true) = true;

  if v_talent.id is null then
    raise exception 'Talent introuvable ou non disponible';
  end if;

  v_manager_id := v_talent.managed_by;

  if v_manager_id is null then
    raise exception 'Ce talent n''a aucun manager assigné';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_manager_id
      and role = 'manager'
  ) then
    raise exception 'Le manager du talent est invalide';
  end if;

  -- Do not create new client requests for managers whose access has expired.
  select *
    into v_manager_subscription
  from public.subscriptions
  where user_id = v_manager_id
  order by created_at desc
  limit 1;

  if v_manager_subscription.id is null
     or v_manager_subscription.status not in ('trialing', 'active')
     or (
       v_manager_subscription.current_period_end is not null
       and v_manager_subscription.current_period_end <= now()
     ) then
    raise exception 'Ce manager ne peut pas recevoir de nouvelles demandes actuellement';
  end if;

  if v_project_id is not null then
    select *
      into v_project
    from public.projects
    where id = v_project_id
      and client_id = v_client_id
    for update;

    if v_project.id is null then
      raise exception 'Projet introuvable ou inaccessible';
    end if;

    if v_project.status in ('completed', 'cancelled') then
      raise exception 'Ce projet ne peut plus recevoir de demande';
    end if;
  else
    insert into public.projects (
      client_id, manager_id, title, description, budget_min, budget_max,
      currency, status, due_date
    )
    values (
      v_client_id,
      v_manager_id,
      v_title,
      nullif(trim(coalesce(p_description, '')), ''),
      p_budget,
      p_budget,
      v_currency,
      'pending',
      coalesce(p_project_date_end, p_project_date_start)
    )
    returning * into v_project;

    v_project_id := v_project.id;
  end if;

  if exists (
    select 1
    from public.requests r
    where r.client_id = v_client_id
      and r.talent_id = p_talent_id
      and r.manager_id = v_manager_id
      and lower(coalesce(r.status, 'pending')) in ('pending', 'open')
      and (
        r.project_id = v_project_id
        or (
          r.title = v_title
          and coalesce(r.project_date_start, p_project_date_start) is not distinct from p_project_date_start
          and coalesce(r.project_date_end, p_project_date_end) is not distinct from p_project_date_end
        )
      )
  ) then
    raise exception 'Une demande similaire est déjà en attente pour ce talent';
  end if;

  insert into public.requests (
    client_id, manager_id, talent_id, project_id, title, project_type,
    description, project_date_start, project_date_end, budget, currency,
    location, additional_info, status
  )
  values (
    v_client_id,
    v_manager_id,
    p_talent_id,
    v_project_id,
    v_title,
    nullif(trim(coalesce(p_project_type, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    p_project_date_start,
    p_project_date_end,
    p_budget,
    v_currency,
    nullif(trim(coalesce(p_location, '')), ''),
    nullif(trim(coalesce(p_additional_info, '')), ''),
    'pending'
  )
  returning id into v_request_id;

  insert into public.notifications (
    user_id, type, title, message, data, is_read, created_at
  )
  values (
    v_manager_id,
    'request',
    'Nouvelle demande de collaboration',
    concat(
      'Le client vous a envoyé une demande pour « ',
      v_title,
      ' » concernant le talent ',
      trim(concat(coalesce(v_talent.first_name, ''), ' ', coalesce(v_talent.last_name, ''))),
      '.'
    ),
    jsonb_build_object(
      'request_id', v_request_id,
      'project_id', v_project_id,
      'talent_id', p_talent_id,
      'client_id', v_client_id
    ),
    false,
    now()
  );

  return v_request_id;
end;
$function$;
