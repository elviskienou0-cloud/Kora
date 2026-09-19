import { useEffect, useState } from "react"
import { APP_PARAMS } from "@/lib/app-params"
import { supabase } from "@/lib/supabase"

const buildEmptyCategoryCounts = () =>
  Object.fromEntries(APP_PARAMS.categories.map((category) => [category.id, 0]))

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "et")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const categoryAliases = {
  tech: ["tech", "technology", "technologie", "digital", "technologie-digital", "development", "developpement"],
  creative: ["creative", "creatif", "design", "creatif-design", "creation"],
  business: ["business", "strategie", "business-strategie", "strategy", "consulting", "conseil"],
  marketing: ["marketing", "communication", "marketing-communication"],
  finance: ["finance", "comptabilite", "finance-comptabilite", "accounting"],
  legal: ["legal", "juridique", "droit", "juridique-conseil"],
  education: ["education", "formation", "formation-education", "training"],
  health: ["health", "sante", "bien-etre", "sante-bien-etre"],
}

function resolveAppCategoryId(row) {
  const values = [row?.id, row?.slug, row?.name].map(normalize).filter(Boolean)

  for (const category of APP_PARAMS.categories) {
    const keys = new Set([
      normalize(category.id),
      normalize(category.name),
      ...(categoryAliases[category.id] || []),
    ].map(normalize))

    if (values.some((value) => keys.has(value))) return category.id
  }

  return null
}

export function useKoraStats({ enabled = true } = {}) {
  const [stats, setStats] = useState([
    { value: "0", label: "Talents inscrits" },
    { value: "0", label: "Projets" },
    { value: "0", label: "Pays représentés" },
    { value: "0/5", label: "Satisfaction moyenne" },
  ])
  const [categoryCounts, setCategoryCounts] = useState(buildEmptyCategoryCounts)
  const [loading, setLoading] = useState(false)

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
          setStats([
            { value: "0", label: "Talents inscrits" },
            { value: "0", label: "Projets" },
            { value: "0", label: "Pays représentés" },
            { value: "0/5", label: "Satisfaction moyenne" },
          ])
          setCategoryCounts(buildEmptyCategoryCounts())
          return
        }

        const payload = data || {}
        const nextCategoryCounts = buildEmptyCategoryCounts()

        for (const row of Array.isArray(payload.categories) ? payload.categories : []) {
          const appCategoryId = resolveAppCategoryId(row)
          if (appCategoryId) {
            nextCategoryCounts[appCategoryId] = Number(row.count || 0)
          }
        }

        setCategoryCounts(nextCategoryCounts)
        setStats([
          { value: String(Number(payload.talent_count || 0)), label: "Talents inscrits" },
          { value: String(Number(payload.project_count || 0)), label: "Projets" },
          { value: String(Number(payload.country_count || 0)), label: "Pays représentés" },
          { value: `${Number(payload.average_rating || 0).toFixed(1)}/5`, label: "Satisfaction moyenne" },
        ])
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur inattendue statistiques KORA :", error)
          setStats([
            { value: "0", label: "Talents inscrits" },
            { value: "0", label: "Projets" },
            { value: "0", label: "Pays représentés" },
            { value: "0/5", label: "Satisfaction moyenne" },
          ])
          setCategoryCounts(buildEmptyCategoryCounts())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    channel = supabase
      .channel("kora-global-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "talent_profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Supabase Realtime n'est pas disponible pour les statistiques KORA.")
        }
      })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [enabled])

  return { stats, categoryCounts, loading }
}

export default useKoraStats
