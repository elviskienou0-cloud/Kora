-- KORA: disable legacy online-presence RPCs.
-- Keep profiles.last_seen and historical migrations/data intact.
-- The application no longer needs browser presence tracking or online-user lists.

revoke all on function public.touch_presence()
from public, anon, authenticated, service_role;

revoke all on function public.get_online_users()
from public, anon, authenticated, service_role;

revoke all on function public.get_online_user_count()
from public, anon, authenticated, service_role;
