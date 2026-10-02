-- KORA: remplacer les anciennes adresses de contact/support par les adresses Gmail officielles
-- Date: 2026-10-02

begin;

update public.app_settings
set value = '"kora.contact1@gmail.com"'::jsonb,
    updated_at = now()
where key = 'contact_email';

update public.app_settings
set value = '"kora.support2@gmail.com"'::jsonb,
    updated_at = now()
where key = 'support_email';

commit;
