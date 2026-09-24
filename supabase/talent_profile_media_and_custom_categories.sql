-- KORA: photos de profil/couverture des talents + métiers personnalisés
-- À exécuter dans Supabase SQL Editor.

alter table public.talent_profiles
  add column if not exists avatar_url text,
  add column if not exists cover_url text;

-- Bucket public dédié aux images de profil des talents.
insert into storage.buckets (id, name, public)
values ('talent-profile-media', 'talent-profile-media', true)
on conflict (id) do update set public = true;

-- Les managers peuvent déposer des images dans leur propre dossier.
drop policy if exists "Managers upload talent profile media" on storage.objects;
create policy "Managers upload talent profile media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'talent-profile-media'
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (
    select 1
    from public.talent_profiles tp
    where tp.id::text = split_part(name, '/', 2)
      and tp.managed_by = auth.uid()
  )
);

-- Les images du profil sont publiques, comme le profil publié du talent.
drop policy if exists "Public read talent profile media" on storage.objects;
create policy "Public read talent profile media"
on storage.objects
for select
to public
using (bucket_id = 'talent-profile-media');

-- Autoriser les managers à créer un métier personnalisé.
drop policy if exists "Managers create custom categories" on public.categories;
create policy "Managers create custom categories"
on public.categories
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'manager'
  )
);
