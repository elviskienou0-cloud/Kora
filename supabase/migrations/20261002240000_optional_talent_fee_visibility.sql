begin;

alter table public.talent_profiles
  add column if not exists show_daily_rate boolean not null default false;

comment on column public.talent_profiles.daily_rate is
  'Cachet/tarif du talent en unité de currency. Facultatif.';
comment on column public.talent_profiles.show_daily_rate is
  'Indique si le cachet doit être affiché sur le profil public.';

notify pgrst, 'reload schema';

commit;
