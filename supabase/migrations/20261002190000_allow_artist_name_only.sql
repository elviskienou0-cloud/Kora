-- KORA — profil talent : nom d'artiste unique
-- Permet aux artistes d'utiliser un nom de scène sans imposer prénom + nom.
begin;

alter table public.talent_profiles
  alter column last_name drop not null;

alter table public.talent_profiles
  alter column title drop not null;

commit;
