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
  music: ["music", "musique", "musicien", "chanteur", "chanteuse", "danseur", "danseuse", "spectacle", "artiste-musicien"],
  fashion: ["fashion", "mode", "mannequin", "mannequinat", "styliste", "modele"],
  influence: ["influence", "influenceur", "influenceuse", "createur-de-contenu", "createur", "content-creator", "streamer"],
  sport: ["sport", "sportif", "sportive", "athlete", "coach-sportif"],
  events: ["evenementiel", "evenement", "hote", "hotesse", "dj", "organisateur", "decorateur"],
  culture: ["culture", "traditions", "griot", "conteur", "conteuse", "folklore", "percussion"],
  cinema: ["cinema", "audiovisuel", "acteur", "actrice", "realisateur", "realisatrice", "cadreur", "technicien", "plateau"],
  voice: ["voix", "doublage", "voix-off", "speaker", "speakerine"],
  comedy: ["humour", "humoriste", "animation", "animateur", "animatrice", "mc", "maitre-de-ceremonie"],
  beauty: ["beaute", "image", "maquilleur", "maquilleuse", "coiffeur", "coiffeuse", "styliste-plateau"],
  gastronomy: ["gastronomie", "traiteur", "chef", "cuisine", "chef-prive"],
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

const EMPTY_STATS = [
  { value: "—", label: "Talents inscrits" },
  { value: "—", label: "Projets" },
  { value: "—", label: "Pays représentés" },
  { value: "—", label: "Satisfaction moyenne" },
]

export function useKoraStats({ enabled = true } = {}) {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [categoryCounts, setCategoryCounts] = useState(buildEmptyCategoryCounts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const { data, error } = await supabase.rpc("get_kora_live_stats")

        if (cancelled) return

        if (error) {
          console.error("Erreur statistiques live KORA :", error.message)
          setStats(EMPTY_STATS)
          setCategoryCounts(buildEmptyCategoryCounts())
          return
        }

        const payload = data || {}
        const nextCategoryCounts = buildEmptyCategoryCounts()

        for (const row of Array.isArray(payload.categories) ? payload.categories : []) {
          const appCategoryId = resolveAppCategoryId(row)
          if (appCategoryId) nextCategoryCounts[appCategoryId] = Number(row.count || 0)
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
    return () => { cancelled = true }
  }, [enabled])

  return { stats, categoryCounts, loading }
}

export default useKoraStats
