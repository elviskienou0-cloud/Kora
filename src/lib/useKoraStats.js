import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const buildEmptyCategoryCounts = () => ({})

const DEFAULT_STATS = [
  { value: "0", label: "Talents inscrits" },
  { value: "0", label: "Projets" },
  { value: "0", label: "Pays représentés" },
  { value: "—", label: "Satisfaction moyenne" },
]

const EMPTY_STATS = [
  { value: "—", label: "Talents inscrits" },
  { value: "—", label: "Projets" },
  { value: "—", label: "Pays représentés" },
  { value: "—", label: "Satisfaction moyenne" },
]

export function useKoraStats({ enabled = true, realtime = true, initialLoading = false, emptyOnError = false } = {}) {
  const [stats, setStats] = useState(() => (emptyOnError ? EMPTY_STATS : DEFAULT_STATS))
  const [categoryCounts, setCategoryCounts] = useState(buildEmptyCategoryCounts)
  const [loading, setLoading] = useState(Boolean(enabled && initialLoading))

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    let channel

    const load = async () => {
      setLoading(true)

      try {
        const { data, error } = await supabase.rpc("get_kora_live_stats")

        if (cancelled) return

        if (error) {
          console.error("Erreur statistiques live KORA :", error.message)
          setStats(emptyOnError ? EMPTY_STATS : DEFAULT_STATS)
          setCategoryCounts(buildEmptyCategoryCounts())
          return
        }

        const payload = data || {}
        const nextCategoryCounts = buildEmptyCategoryCounts()

        for (const row of Array.isArray(payload.categories) ? payload.categories : []) {
          const categoryKey = String(row?.slug || row?.id || "").trim()
          if (categoryKey) nextCategoryCounts[categoryKey] = Number(row.count || 0)
        }

        setCategoryCounts(nextCategoryCounts)
        setStats([
          { value: String(Number(payload.talent_count || 0)), label: "Talents inscrits" },
          { value: String(Number(payload.project_count || 0)), label: "Projets" },
          { value: String(Number(payload.country_count || 0)), label: "Pays représentés" },
          { value: Number(payload.average_rating || 0) > 0 ? Number(payload.average_rating).toFixed(1) + "/5" : "—", label: "Satisfaction moyenne" },
        ])
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur inattendue statistiques KORA :", error)
          setStats(EMPTY_STATS)
          setCategoryCounts(buildEmptyCategoryCounts())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    if (realtime) {
      channel = supabase
        .channel("kora-global-stats")
        .on("postgres_changes", { event: "*", schema: "public", table: "talent_profiles" }, load)
        .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, load)
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load)
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("Supabase Realtime n’est pas disponible pour les statistiques KORA.")
          }
        })
    }

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [enabled, realtime, emptyOnError])

  return { stats, categoryCounts, loading }
}

export default useKoraStats
