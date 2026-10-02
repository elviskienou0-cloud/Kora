begin;

-- Rattache les anciennes conversations dont le titre contient déjà le nom
-- exact d'un talent. Cela permet d'afficher le nom de l'artiste même pour
-- les conversations créées avant l'ajout de conversations.talent_id.
update public.conversations c
set
  talent_id = tp.id,
  title = left(
    nullif(trim(concat_ws(' ', tp.first_name, tp.last_name)), ''),
    200
  ),
  updated_at = now()
from public.talent_profiles tp
where c.talent_id is null
  and nullif(trim(c.title), '') is not null
  and lower(trim(c.title)) =
      lower(trim(concat_ws(' ', tp.first_name, tp.last_name)))
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = c.id
      and cp.user_id = tp.managed_by
  );

notify pgrst, 'reload schema';

commit;
