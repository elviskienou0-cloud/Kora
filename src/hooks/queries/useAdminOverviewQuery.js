import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

/**
 * Métriques du tableau de bord admin : une seule RPC (admin_dashboard_overview),
 * calculée côté serveur et protégée par is_admin().
 */
export function useAdminOverviewQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["admin-overview"],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_overview")
      if (error) throw error
      return data
    },
  })
}

/** Dernière annonce publiée et active (fenêtre starts_at / ends_at respectée). */
export function useActiveAnnouncementQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["admin-active-announcement"],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, starts_at, ends_at, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(10)
      if (error) throw error
      const now = Date.now()
      return (
        (data || []).find((a) => {
          const starts = a.starts_at ? new Date(a.starts_at).getTime() : null
          const ends = a.ends_at ? new Date(a.ends_at).getTime() : null
          return (starts === null || starts <= now) && (ends === null || ends >= now)
        }) || null
      )
    },
  })
}
