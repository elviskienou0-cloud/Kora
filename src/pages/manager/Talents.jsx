// @ts-nocheck

import { useEffect, useMemo, useState } from "react"
import TalentForm from "@/components/TalentForm"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Star,
  ShieldCheck,
  UserPlus,
  Award,
  UserCheck,
  Clock,
  X,
  Loader2,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const STATUS = {
  approved: {
    label: "Publié",
    cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    icon: UserCheck,
  },
  pending: {
    label: "En attente",
    cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: Clock,
  },
  rejected: {
    label: "Refusé",
    cls: "bg-red-500/10 text-red-600 border-red-500/30",
    icon: X,
  },
  suspended: {
    label: "Suspendu",
    cls: "bg-red-500/10 text-red-600 border-red-500/30",
    icon: X,
  },
}

const CATEGORY_MAP = {
  design: "design",
  development: "development",
  marketing: "marketing",
  content: "content",
  video: "video",
  music: "music",
  business: "business",
  training: "training",
}

function formatDate(date) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatRate(value) {
  if (!value && value !== 0) return "—"
  return `${Number(value).toLocaleString("fr-FR")} XOF`
}

export default function ManagerTalents() {
  const { user } = useAuth()

  const [q, setQ] = useState("")
  const [filter, setFilter] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [creating, setCreating] = useState(false)

  const loadTalents = async () => {
    if (!user?.id) {
      setTalents([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select(`
          id,
          first_name,
          last_name,
          title,
          status,
          daily_rate,
          rating,
          reviews_count,
          completed_projects,
          created_at,
          verified,
          managed_by,
          categories (
            id,
            slug,
            name
          ),
          countries (
            id,
            code,
            name
          )
        `)
        .eq("managed_by", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Erreur chargement talents :", error)
        toast.error("Impossible de charger vos talents")
        setTalents([])
        return
      }

      console.log("👤 Manager connecté :", user.id)
      console.log("📦 Talents récupérés :", data)

      const formatted = (data || []).map((talent) => ({
        id: talent.id,
        name: `${talent.first_name || ""} ${talent.last_name || ""}`.trim(),
        cat: talent.categories?.name || "Non classé",
        tasks: Number(talent.completed_projects || 0),
        rating: Number(talent.rating || 0),
        reviews: Number(talent.reviews_count || 0),
        status: talent.status === "published" ? "approved" : talent.status,
        rate: talent.daily_rate,
        since: formatDate(talent.created_at),
        country: talent.countries?.name || "",
        verified: !!talent.verified,
        title: talent.title || "",
      }))

      setTalents(formatted)
    } catch (error) {
      console.error("❌ Erreur inattendue chargement talents :", error)
      toast.error(error?.message || "Erreur lors du chargement des talents")
      setTalents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTalents()
  }, [user?.id])

  const handleCreateTalent = async (data) => {
  try {
    console.log("DONNÉES REÇUES :", data)

    const CATEGORY_MAP = {
      design: "Design & Création",
      development: "Développement Web",
      marketing: "Marketing Digital",
      content: "Rédaction & Contenu",
      video: "Vidéo & Animation",
      music: "Musique & Audio",
      business: "Business & Consulting",
      training: "Formation & Coaching",
    }

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

    const categoryValue = String(data.category || "").trim()
    const categoryName = CATEGORY_MAP[categoryValue] || categoryValue

    const { data: categories, error: categoryError } = await supabase
      .from("categories")
      .select("id, slug, name")

    if (categoryError) {
      throw categoryError
    }

    const category = (categories || []).find((item) => {
      return (
        normalize(item.slug) === normalize(categoryValue) ||
        normalize(item.slug) === normalize(categoryName) ||
        normalize(item.name) === normalize(categoryValue) ||
        normalize(item.name) === normalize(categoryName)
      )
    })

    if (!category) {
      throw new Error(`Catégorie introuvable : ${categoryValue}`)
    }

    // ⬇️ SUITE DE TON CODE DE CRÉATION
    // category.id est maintenant disponible ici

  } catch (error) {
    console.error("❌ ERREUR CRÉATION TALENT :", error)
  }
}    
if (creating) return
    setCreating(true)

    try {
      if (!user?.id) throw new Error("Utilisateur non connecté.")

      const rawLocation = String(data.location || "").trim()
      if (!rawLocation) throw new Error("Indiquez une ville.")

      const locationParts = rawLocation
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)

      const city = locationParts[0] || ""
      const countryName = locationParts.slice(1).join(", ").trim() || "Burkina Faso"

      if (!city) throw new Error("Indiquez une ville.")

      const categoryValue = String(data.category || "").trim()
      const categoryName = CATEGORY_MAP[categoryValue]

      if (!categoryValue || !categoryName) {
        throw new Error(
          `Catégorie invalide : ${categoryValue || "non définie"}`
        )
      }

      // On accepte aussi bien le slug que le nom réel présent dans Supabase.
      const { data: categories, error: categoryError } = await supabase
        .from("categories")
        .select("id, slug, name")

      if (categoryError) {
        console.error("❌ Erreur chargement catégories :", categoryError)
        throw categoryError
      }

      const normalized = (value) =>
        String(value || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")

      const category = (categories || []).find(
        (item) =>
          normalized(item.slug) === normalized(categoryValue) ||
          normalized(item.name) === normalized(categoryName) ||
          normalized(item.slug) === normalized(categoryName)
      )

      if (!category) {
        console.error("❌ Catégories disponibles :", categories)
        throw new Error(
          `Catégorie "${categoryName}" introuvable dans Supabase.`
        )
      }

      const { data: country, error: countryError } = await supabase
        .from("countries")
        .select("id, code, name")
        .ilike("name", countryName)
        .maybeSingle()

      if (countryError) throw countryError
      if (!country) {
        throw new Error(`Pays introuvable : ${countryName}. Vérifiez l'orthographe.`)
      }

      const displayName = String(data.displayName || "").trim()
      if (!displayName) throw new Error("Indiquez le nom du talent.")

      const nameParts = displayName.split(/\s+/).filter(Boolean)
      const firstName = nameParts.shift() || displayName
      const lastName = nameParts.join(" ")

      const dailyRate = Number(data.hourlyRate)
      if (!Number.isFinite(dailyRate) || dailyRate < 0) {
        throw new Error("Le tarif indiqué est invalide.")
      }

      const { data: talent, error: talentError } = await supabase
        .from("talent_profiles")
        .insert({
          managed_by: user.id,
          first_name: firstName,
          last_name: lastName,
          title: data.title || "",
          bio: data.bio || "",
          category_id: category.id,
          country_id: country.id,
          city,
          daily_rate: dailyRate,
          currency: "XOF",
          available: true,
          verified: false,
          status: "pending",
          is_visible: false,
          rating: 0,
          reviews_count: 0,
          completed_projects: 0,
        })
        .select("id")
        .single()

      if (talentError) throw talentError
      if (!talent?.id) throw new Error("Identifiant du talent introuvable.")

      if (Array.isArray(data.skills) && data.skills.length > 0) {
        for (const skillNameRaw of data.skills) {
          const skillName = String(skillNameRaw || "").trim()
          if (!skillName) continue

          // Cherche d'abord une compétence existante.
          const { data: existingSkill, error: skillSearchError } = await supabase
            .from("skills")
            .select("id, name")
            .ilike("name", skillName)
            .maybeSingle()

          if (skillSearchError) {
            console.error("❌ Erreur recherche compétence :", skillSearchError)
            throw skillSearchError
          }

          let skill = existingSkill

          // Si elle n'existe pas, on tente de la créer.
          if (!skill) {
            const { data: createdSkill, error: createSkillError } = await supabase
              .from("skills")
              .insert({ name: skillName })
              .select("id, name")
              .single()

            if (createSkillError) {
              console.error("❌ Erreur création compétence :", createSkillError)

              await supabase
                .from("talent_profiles")
                .delete()
                .eq("id", talent.id)

              throw new Error(
                `Impossible d'ajouter la compétence "${skillName}" : ${createSkillError.message}`
              )
            }

            skill = createdSkill
          }

          if (!skill?.id) {
            await supabase
              .from("talent_profiles")
              .delete()
              .eq("id", talent.id)

            throw new Error(`Compétence invalide : ${skillName}`)
          }

          const { error: relationError } = await supabase
            .from("talent_profile_skills")
            .insert({
              talent_id: talent.id,
              skill_id: skill.id,
            })

          if (relationError) {
            await supabase
              .from("talent_profiles")
              .delete()
              .eq("id", talent.id)
            throw relationError
          }
        }
      }

      toast.success("Talent créé avec succès", {
        description: "Le profil est maintenant en attente de publication.",
      })

      setShowForm(false)
      await loadTalents()
    } catch (error) {
      console.error("❌ ERREUR CRÉATION TALENT :", error)
      toast.error(error?.message || "Impossible de créer le talent.")
    } finally {
      setCreating(false)
    }
  }

  const approve = async (talent) => {
    if (!talent?.id || !user?.id) return
    setActionLoading(talent.id)

    try {
      const { error } = await supabase
        .from("talent_profiles")
        .update({ status: "published", is_visible: true })
        .eq("id", talent.id)
        .eq("managed_by", user.id)

      if (error) throw error
      toast.success(`${talent.name} est maintenant publié ✅`)
      await loadTalents()
    } catch (error) {
      console.error("❌ Erreur publication :", error)
      toast.error(error?.message || "Impossible de publier ce talent")
    } finally {
      setActionLoading(null)
    }
  }

  const reject = async (talent) => {
    if (!talent?.id || !user?.id) return
    setActionLoading(talent.id)

    try {
      const { error } = await supabase
        .from("talent_profiles")
        .update({ status: "rejected", is_visible: false })
        .eq("id", talent.id)
        .eq("managed_by", user.id)

      if (error) throw error
      toast.success(`${talent.name} a été refusé`)
      await loadTalents()
    } catch (error) {
      console.error("❌ Erreur refus :", error)
      toast.error(error?.message || "Impossible de refuser ce talent")
    } finally {
      setActionLoading(null)
    }
  }

  const removeTalent = async (talent) => {
    if (!talent?.id || !user?.id) return

    const confirmed = window.confirm(
      `Supprimer définitivement le profil de ${talent.name} ?`
    )

    if (!confirmed) return

    setActionLoading(talent.id)

    try {
      const { error } = await supabase
        .from("talent_profiles")
        .delete()
        .eq("id", talent.id)
        .eq("managed_by", user.id)

      if (error) throw error

      toast.success(`${talent.name} a été supprimé`)
      await loadTalents()
    } catch (error) {
      console.error("❌ Erreur suppression :", error)
      toast.error(error?.message || "Impossible de supprimer ce talent")
    } finally {
      setActionLoading(null)
    }
  }

  const rows = useMemo(() => {
    const query = q.toLowerCase().trim()

    return talents.filter((talent) => {
      const matchesStatus = filter === "all" || talent.status === filter
      const matchesSearch =
        !query ||
        talent.name.toLowerCase().includes(query) ||
        talent.cat.toLowerCase().includes(query) ||
        talent.title.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [talents, q, filter])

  const pendingCount = talents.filter(
    (talent) => talent.status === "pending"
  ).length

  const approvedCount = talents.filter(
    (talent) => talent.status === "approved"
  ).length

  const ratedTalents = talents.filter((talent) => talent.rating > 0)

  const averageRating =
    ratedTalents.length > 0
      ? (
          ratedTalents.reduce(
            (total, talent) => total + talent.rating,
            0
          ) / ratedTalents.length
        ).toFixed(1)
      : "—"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Gestion des talents
          </h1>
          <p className="text-sm text-muted-foreground">
            {talents.length} talent{talents.length > 1 ? "s" : ""} dans votre équipe
            {" · "}
            {pendingCount} en attente
          </p>
        </div>

        <Button
          className="gap-2"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Fermer" : "Ajouter un talent"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-gold/20 overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="font-black">Ajouter un talent</CardTitle>
                <CardDescription>
                  Créez le profil professionnel d'un talent que vous gérez.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <TalentForm
              submitLabel={creating ? "Création..." : "Créer le talent"}
              onSubmit={handleCreateTalent}
              disabled={creating}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: talents.length, cls: "text-gold-dark", icon: Award },
          { label: "Publiés", value: approvedCount, cls: "text-emerald-600", icon: ShieldCheck },
          { label: "En attente", value: pendingCount, cls: "text-amber-600", icon: Clock },
          { label: "Note moy.", value: averageRating, cls: "text-violet-600", icon: Star },
        ].map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-current/10 to-current/5 shrink-0",
                    stat.cls
                  )}
                >
                  <Icon className={cn("h-5 w-5", stat.cls)} />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
          <div>
            <CardTitle className="font-black">Mes talents</CardTitle>
            <CardDescription className="text-sm">
              Gérez les profils professionnels que vous administrez.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full sm:w-auto">
              {[
                { k: "all", l: "Tous" },
                { k: "pending", l: `En attente (${pendingCount})` },
                { k: "approved", l: "Publiés" },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => setFilter(item.k)}
                  className={cn(
                    "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                    filter === item.k
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.l}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left">
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Talent</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Catégorie</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Rejoint</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Perf.</th>
                  <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-muted-foreground w-10"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des talents...
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="max-w-md mx-auto">
                        <p className="text-sm font-semibold">Aucun talent trouvé.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Créez votre premier profil avec « Ajouter un talent ».
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((talent) => {
                    const status = STATUS[talent.status] || STATUS.pending
                    const StatusIcon = status.icon
                    const initials = talent.name
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()

                    const busy = actionLoading === talent.id

                    return (
                      <motion.tr
                        key={talent.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-border/40 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="gold-gradient text-white text-xs font-black">
                                {initials || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold truncate">
                                {talent.name || "Talent sans nom"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate md:hidden">
                                {talent.cat}
                              </p>
                              {talent.title && (
                                <p className="text-xs text-muted-foreground truncate hidden md:block">
                                  {talent.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 hidden md:table-cell">
                          <span className="text-xs font-medium">{talent.cat}</span>
                        </td>

                        <td className="px-6 py-3.5 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{talent.since}</span>
                        </td>

                        <td className="px-6 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn("gap-1 font-bold text-xs", status.cls)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>

                        <td className="px-6 py-3.5 hidden sm:table-cell">
                          <div className="flex items-center gap-3 text-xs">
                            {talent.rating > 0 ? (
                              <span className="flex items-center gap-1 font-bold">
                                <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                                {talent.rating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}

                            <span className="text-muted-foreground">
                              {talent.tasks} projet{talent.tasks > 1 ? "s" : ""}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            {talent.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  className="h-8 gap-1 text-xs px-2.5"
                                  onClick={() => approve(talent)}
                                >
                                  {busy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  )}
                                  Publier
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={busy}
                                  className="rounded-lg h-8 w-8 hover:text-red-600 hover:bg-red-500/10"
                                  onClick={() => reject(talent)}
                                  title="Refuser"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={busy}
                              className="rounded-lg h-8 w-8 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => removeTalent(talent)}
                              title="Supprimer"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gold/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25 shrink-0">
            <UserPlus
              className="h-7 w-7 text-primary-foreground"
              strokeWidth={2.2}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg mb-1">Ajouter un talent</h3>
            <p className="text-sm text-muted-foreground">
              Créez directement un profil professionnel et gérez sa publication.
            </p>
          </div>

          <Button className="gap-2 shrink-0" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
