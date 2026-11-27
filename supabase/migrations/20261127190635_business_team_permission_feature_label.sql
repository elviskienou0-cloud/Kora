-- KORA: précision du périmètre des permissions collaborateur BUSINESS.
begin;

update public.plans p
set features = (
  select jsonb_agg(
    case
      when feature = 'Permissions d''accès personnalisées'
        then 'Permissions d''accès aux analyses et rapports'
      else feature
    end
    order by ordinality
  )
  from jsonb_array_elements_text(p.features) with ordinality as f(feature, ordinality)
),
updated_at = now()
where p.id = 'BUSINESS'
  and p.features @> '["Permissions d''accès personnalisées"]'::jsonb;

commit;
