-- ============================================================
-- KORA — PHASE 14 : VALIDATION
-- ============================================================

-- 1. Index importants
select
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and (
    indexname ilike '%talent%'
    or indexname ilike '%project%'
    or indexname ilike '%request%'
    or indexname ilike '%message%'
    or indexname ilike '%notification%'
    or indexname ilike '%subscription%'
    or indexname ilike '%payment%'
  )
order by
  tablename,
  indexname;


-- 2. Taille estimée des tables
select
  relname as table_name,
  n_live_tup as estimated_rows
from pg_stat_user_tables
where schemaname = 'public'
  and relname in (
    'profiles',
    'talent_profiles',
    'projects',
    'requests',
    'conversations',
    'conversation_participants',
    'messages',
    'notifications',
    'reviews',
    'subscriptions',
    'payments'
  )
order by estimated_rows desc;


-- 3. Pagination Talents
explain
select
  id,
  first_name,
  last_name,
  title,
  status,
  is_visible,
  updated_at
from public.talent_profiles
order by updated_at desc
offset 0
limit 20;


-- 4. Pagination Projets
explain
select
  id,
  client_id,
  manager_id,
  title,
  status,
  created_at
from public.projects
order by created_at desc
offset 0
limit 20;


-- 5. Pagination Messages
explain
select
  id,
  conversation_id,
  sender_id,
  body,
  read_at,
  created_at
from public.messages
where conversation_id =
  '00000000-0000-0000-0000-000000000000'
order by created_at desc
offset 0
limit 50;


-- 6. Pagination Notifications
explain
select
  id,
  type,
  title,
  message,
  is_read,
  created_at
from public.notifications
where user_id =
  '00000000-0000-0000-0000-000000000000'
order by created_at desc
offset 0
limit 20;


-- 7. Indexes messagerie
select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'conversation_participants',
    'messages',
    'notifications'
  )
order by
  tablename,
  indexname;