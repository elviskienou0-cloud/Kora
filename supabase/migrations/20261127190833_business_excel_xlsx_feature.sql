-- KORA: le rapport BUSINESS est exporté en véritable classeur XLSX.
begin;

update public.plans p
set features = (
  select jsonb_agg(
    case
      when feature = 'Export CSV compatible Excel'
        then 'Export des données en Excel (.xlsx)'
      else feature
    end
    order by ordinality
  )
  from jsonb_array_elements_text(p.features) with ordinality as f(feature, ordinality)
),
updated_at = now()
where p.id = 'BUSINESS'
  and p.features @> '["Export CSV compatible Excel"]'::jsonb;

commit;
