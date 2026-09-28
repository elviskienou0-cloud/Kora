// @ts-nocheck

import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
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
  Pencil,
  Eye,
  Save,
  User,
  Briefcase,
  MapPin,
  FileText,
  CalendarDays,
  Link2,
  Video,
  Image as ImageIcon,
  ChevronRight,
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
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import {
  addTalentPortfolioLinks,
  deleteTalentPortfolioItems,
  uploadTalentPortfolioFiles,
} from "@/lib/talentPortfolio"
import { uploadTalentProfileMedia } from "@/lib/talentMedia"

const STATUS = {
  published: {
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

const DEFAULT_SKILLS = [
  "Artiste Musicien",
  "Sport",
  "Créateur de contenu",
  "Humour & Divertissement",
  "Influenceur(e)s",
  "Design",
  "Développement",
  "Marketing",
]

function localId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function formatDate(date) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function parseLocation(location) {
  const parts = String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    city: parts[0] || "",
    countryName: parts.slice(1).join(", ").trim() || "Burkina Faso",
  }
}

async function resolveCountry(countryName) {
  const { data, error } = await supabase
    .from("countries")
    .select("id, code, name")
    .order("name")

  if (error) throw error

  const wanted = normalize(countryName)
  const country = (data || []).find((item) => normalize(item.name) === wanted)

  if (!country) {
    throw new Error(`Pays introuvable : ${countryName}`)
  }

  return country
}

async function resolveSkill(skillName) {
  const clean = String(skillName || "").trim()
  if (!clean) return null

  const { data, error } = await supabase
    .from("skills")
    .select("id, name")
    .ilike("name", clean)
    .maybeSingle()

  if (error) throw error
  if (data) return data

  const { data: created, error: createError } = await supabase
    .from("skills")
    .insert({ name: clean })
    .select("id, name")
    .single()

  if (!createError) return created

  const { data: retry, error: retryError } = await supabase
    .from("skills")
    .select("id, name")
    .ilike("name", clean)
    .maybeSingle()

  if (retryError) throw createError
  return retry
}

function TalentEditor({
  mode,
  initialValues,
  onCancel,
  onSave,
  saving,
}) {
  const [categories, setCategories] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [form, setForm] = useState({
    displayName: initialValues?.displayName || "",
    title: initialValues?.title || "",
    category: initialValues?.category || "",
    location: initialValues?.location || "",
    bio: initialValues?.bio || "",
    skills: initialValues?.skills || [],
    available: initialValues?.available !== false,
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [portfolioFiles, setPortfolioFiles] = useState([])
  const [portfolioLinks, setPortfolioLinks] = useState(
    initialValues?.portfolioLinks?.length
      ? initialValues.portfolioLinks.map((item) => ({
          id: localId(),
          title: item.title || "",
          url: item.url || "",
        }))
      : [{ id: localId(), title: "", url: "" }]
  )
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let active = true

    async function loadCategories() {
      setCategoryLoading(true)
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name")
        .order("name")

      if (!active) return

      if (error) {
        console.error("Erreur catégories :", error)
        // En édition, on garde au minimum la catégorie déjà associée au talent.
        // Cela permet de modifier les autres champs même si la lecture globale
        // des catégories est refusée par les règles RLS.
        if (mode === "edit" && initialValues?.category) {
          setCategories([
            {
              id: initialValues.category,
              name: initialValues.categoryName || "Catégorie actuelle",
              slug: initialValues.categoryName || "categorie-actuelle",
            },
          ])
        } else {
          setCategories([])
        }
      } else {
        setCategories(data || [])
      }

      setCategoryLoading(false)
    }

    loadCategories()

    return () => {
      active = false
    }
  }, [])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  const toggleSkill = (skill) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : [...current.skills, skill],
    }))
    setErrors((current) => ({ ...current, skills: "" }))
  }

  const addLink = () => {
    setPortfolioLinks((current) => [
      ...current,
      { id: localId(), title: "", url: "" },
    ])
  }

  const updateLink = (id, key, value) => {
    setPortfolioLinks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      )
    )
  }

  const removeLink = (id) => {
    setPortfolioLinks((current) => {
      if (current.length === 1) {
        return [{ id: localId(), title: "", url: "" }]
      }
      return current.filter((item) => item.id !== id)
    })
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    setPortfolioFiles(files)
  }

  const handleProfileImageChange = (kind, event) => {
    const file = event.target.files?.[0] || null

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image.")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.")
      event.target.value = ""
      return
    }

    if (kind === "avatar") {
      setAvatarFile(file)
    } else {
      setCoverFile(file)
    }
  }

  const validate = () => {
    const next = {}

    if (!form.displayName.trim() || form.displayName.trim().length < 2) {
      next.displayName = "Le nom doit contenir au moins 2 caractères."
    }

    if (!form.title.trim() || form.title.trim().length < 5) {
      next.title = "Le titre doit contenir au moins 5 caractères."
    }

    if (!form.category) {
      next.category = "Veuillez sélectionner une catégorie."
    }

    if (!form.location.trim()) {
      next.location = "Veuillez indiquer la localisation."
    }

    if (!form.bio.trim() || form.bio.trim().length < 30) {
      next.bio = "La description doit contenir au moins 30 caractères."
    }

    if (!form.skills.length) {
      next.skills = "Ajoutez au moins une compétence."
    }

    const normalizedLinks = portfolioLinks
      .map(({ title, url }) => ({
        title: String(title || "").trim(),
        url: String(url || "").trim(),
      }))
      .filter((item) => item.url)

    for (const item of normalizedLinks) {
      try {
        new URL(item.url)
      } catch {
        next.portfolioLinks = `Lien invalide : ${item.url}`
        break
      }
    }

    setErrors(next)
    return {
      valid: Object.keys(next).length === 0,
      normalizedLinks,
    }
  }

  const submit = async (event) => {
    event.preventDefault()

    const result = validate()
    if (!result.valid) return

    await onSave({
      ...form,
      displayName: form.displayName.trim(),
      title: form.title.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
      avatarFile,
      coverFile,
      portfolioFiles,
      portfolioLinks: result.normalizedLinks,
    })
  }

  return (
    <Card className="border-gold/20 overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-black">
              {mode === "edit" ? "Modifier le talent" : "Créer un talent"}
            </CardTitle>
            <CardDescription className="mt-1">
              {mode === "edit"
                ? "Modifiez les informations du talent."
                : "Créez un profil complet pour votre talent."}
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nom d'affichage"
              icon={User}
              required
              error={errors.displayName}
            >
              <Input
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                placeholder="Ex. Marie Koné"
                disabled={saving}
              />
            </Field>

            <Field
              label="Titre professionnel"
              icon={Briefcase}
              required
              error={errors.title}
            >
              <Input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Ex. Designer UI/UX"
                disabled={saving}
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Catégorie" required error={errors.category}>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                disabled={saving || categoryLoading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              >
                <option value="">
                  {categoryLoading ? "Chargement…" : "Sélectionnez une catégorie"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name || category.slug}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Localisation"
              icon={MapPin}
              required
              error={errors.location}
            >
              <Input
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Ex. Ouagadougou, Burkina Faso"
                disabled={saving}
              />
            </Field>
          </div>

          <Field label="Compétences" required error={errors.skills}>
            <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card/50 p-4">
              {DEFAULT_SKILLS.map((skill) => {
                const selected = form.skills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    disabled={saving}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      selected
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-border bg-background text-muted-foreground hover:border-gold/30 hover:text-foreground"
                    )}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field
            label="Description / Bio"
            icon={FileText}
            required
            error={errors.bio}
          >
            <textarea
              rows={6}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Présentez l'expérience, les services et les points forts du talent…"
              disabled={saving}
              className="min-h-[150px] w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {form.bio.length}/1500 caractères
            </p>
          </Field>

          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-gold" />
              <div className="flex-1">
                <p className="font-bold">Disponibilité</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Le talent accepte-t-il de nouvelles missions ?
                </p>
              </div>

              <button
                type="button"
                onClick={() => updateField("available", !form.available)}
                disabled={saving}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  form.available ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
                aria-pressed={form.available}
              >
                <span
                  className={cn(
                    "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    form.available ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold">
              {form.available
                ? "Disponible pour de nouvelles missions"
                : "Indisponible pour le moment"}
            </p>
          </div>

          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 sm:p-5">
            <div className="mb-4">
              <p className="font-black flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-gold" />
                Images du profil
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ces images sont différentes du portfolio : elles servent directement à l'identité visuelle du profil public du talent.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Photo de profil</p>
                    <p className="text-xs text-muted-foreground">1 image · JPG, PNG, WebP ou GIF · 5 Mo max.</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold">
                    Avatar
                  </span>
                </div>

                {initialValues?.avatarUrl ? (
                  <img
                    src={initialValues.avatarUrl}
                    alt="Photo actuelle du talent"
                    className="h-24 w-24 rounded-2xl object-cover border border-border shadow-sm"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl border border-dashed border-border bg-background flex items-center justify-center text-xs text-muted-foreground">
                    Aucune photo
                  </div>
                )}

                <input
                  id="talent-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => handleProfileImageChange("avatar", event)}
                  disabled={saving}
                  className="block w-full rounded-xl border border-border bg-background p-3 text-sm"
                />
                {avatarFile ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    Nouvelle photo : {avatarFile.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Photo de couverture</p>
                    <p className="text-xs text-muted-foreground">1 image · format paysage recommandé · 5 Mo max.</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-bold">
                    Couverture
                  </span>
                </div>

                {initialValues?.coverUrl ? (
                  <img
                    src={initialValues.coverUrl}
                    alt="Couverture actuelle du talent"
                    className="h-24 w-full rounded-2xl object-cover border border-border shadow-sm"
                  />
                ) : (
                  <div className="h-24 w-full rounded-2xl border border-dashed border-border bg-background flex items-center justify-center text-xs text-muted-foreground">
                    Aucune couverture
                  </div>
                )}

                <input
                  id="talent-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => handleProfileImageChange("cover", event)}
                  disabled={saving}
                  className="block w-full rounded-xl border border-border bg-background p-3 text-sm"
                />
                {coverFile ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    Nouvelle couverture : {coverFile.name}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <Field label="Photos / vidéos du portfolio" icon={Video}>
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              onChange={handleFileChange}
              disabled={saving}
              className="block w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
            {portfolioFiles.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {portfolioFiles.length} fichier(s) sélectionné(s)
              </p>
            )}
          </Field>

          <Field
            label="Liens externes"
            icon={Link2}
            error={errors.portfolioLinks}
          >
            <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
              {portfolioLinks.map((link) => (
                <div
                  key={link.id}
                  className="grid gap-2 md:grid-cols-[1fr_1.5fr_auto]"
                >
                  <Input
                    value={link.title}
                    onChange={(e) =>
                      updateLink(link.id, "title", e.target.value)
                    }
                    placeholder="Titre"
                    disabled={saving}
                  />
                  <Input
                    type="url"
                    value={link.url}
                    onChange={(e) =>
                      updateLink(link.id, "url", e.target.value)
                    }
                    placeholder="https://…"
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(link.id)}
                    disabled={saving}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                disabled={saving}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un lien
              </Button>
            </div>
          </Field>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Annuler
            </Button>

            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {mode === "edit" ? "Enregistrer les modifications" : "Créer le talent"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({ label, icon: Icon, required, error, children }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {Icon ? <Icon className="h-4 w-4 text-gold" /> : null}
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export default function ManagerTalents() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const managerId = user?.authId || user?.id

  const [q, setQ] = useState("")
  const [filter, setFilter] = useState("all")
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingTalent, setEditingTalent] = useState(null)

  const loadTalents = async () => {
    if (!managerId) {
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
          bio,
          status,
          is_visible,
          currency,
          rating,
          reviews_count,
          completed_projects,
          created_at,
          verified,
          available,
          managed_by,
          avatar_url,
          cover_url,
          categories ( id, slug, name ),
          countries ( id, code, name )
        `)
        .eq("managed_by", managerId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setTalents(
        (data || []).map((talent) => ({
          ...talent,
          name: `${talent.first_name || ""} ${talent.last_name || ""}`.trim(),
          cat: talent.categories?.name || "Non classé",
          ratingValue: Number(talent.rating || 0),
          tasks: Number(talent.completed_projects || 0),
        }))
      )
    } catch (error) {
      console.error("Erreur chargement talents :", error)
      toast.error(error?.message || "Impossible de charger vos talents")
      setTalents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTalents()
  }, [managerId])

  useEffect(() => {
    if (!managerId) return undefined

    const channel = supabase
      .channel(`manager-talents-${managerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "talent_profiles" },
        () => loadTalents()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [managerId])

  const buildFormData = (talent) => ({
    displayName: `${talent.first_name || ""} ${talent.last_name || ""}`.trim(),
    title: talent.title || "",
    category: talent.category_id || talent.categories?.id || "",
    categoryName: talent.categories?.name || talent.categories?.slug || "Catégorie actuelle",
    location: [talent.city, talent.countries?.name]
      .filter(Boolean)
      .join(", "),
    bio: talent.bio || "",
    skills: talent.skills || [],
    available: talent.available !== false,
    avatarUrl: talent.avatar_url || "",
    coverUrl: talent.cover_url || "",
    portfolioLinks: talent.portfolioLinks || [],
  })

  const openCreate = () => {
    setEditingTalent({
      mode: "create",
      initialValues: {
        displayName: "",
        title: "",
        category: "",
        location: "",
        bio: "",
        skills: [],
        available: true,
        avatarUrl: "",
        coverUrl: "",
        portfolioLinks: [],
      },
    })
  }

  const openEdit = async (row) => {
    if (!row?.id || !managerId) return

    setActionLoading(row.id)

    try {
      const [talentResult, skillsResult, portfolioResult] = await Promise.all([
        supabase
          .from("talent_profiles")
          .select(`
            id,
            first_name,
            last_name,
            title,
            bio,
            category_id,
            country_id,
            city,
            available,
            avatar_url,
            cover_url,
            managed_by,
            categories ( id, slug, name ),
            countries ( id, code, name )
          `)
          .eq("id", row.id)
          .eq("managed_by", managerId)
          .single(),
        supabase
          .from("talent_profile_skills")
          .select("skill_id, skills ( id, name )")
          .eq("talent_id", row.id),
        supabase
          .from("portfolio_items")
          .select("id, title, type, url, storage_path, mime_type, created_at")
          .eq("talent_id", row.id)
          .order("created_at", { ascending: true }),
      ])

      if (talentResult.error) throw talentResult.error
      if (skillsResult.error) throw skillsResult.error
      if (portfolioResult.error) throw portfolioResult.error

      const portfolioLinks = (portfolioResult.data || [])
        .filter((item) => item.type === "link" && item.url)
        .map((item) => ({
          title: item.title || "Lien portfolio",
          url: item.url,
        }))

      setEditingTalent({
        mode: "edit",
        id: row.id,
        initialValues: buildFormData({
          ...talentResult.data,
          skills: (skillsResult.data || [])
            .map((item) => item.skills?.name)
            .filter(Boolean),
          portfolioLinks,
        }),
      })
    } catch (error) {
      console.error("Erreur chargement édition talent :", error)
      toast.error(error?.message || "Impossible de charger le talent")
    } finally {
      setActionLoading(null)
    }
  }

  const saveTalent = async (formData) => {
    if (!managerId || saving) return

    setSaving(true)

    try {
      const { city, countryName } = parseLocation(formData.location)
      if (!city) throw new Error("Indiquez une ville.")

      const country = await resolveCountry(countryName)

      let category = null

      // En édition, on peut conserver la catégorie actuelle sans dépendre
      // d'une lecture globale de categories (qui peut être bloquée par RLS).
      const currentCategoryId = editingTalent?.initialValues?.category
      if (
        editingTalent?.mode === "edit" &&
        currentCategoryId &&
        String(formData.category) === String(currentCategoryId)
      ) {
        category = { id: currentCategoryId }
      } else {
        const { data: categoryRows, error: categoryError } = await supabase
          .from("categories")
          .select("id, slug, name")

        if (categoryError) throw categoryError

        category = (categoryRows || []).find(
          (item) => String(item.id) === String(formData.category)
        )

        if (!category) throw new Error("Catégorie introuvable.")
      }

      const nameParts = String(formData.displayName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)

      const firstName = nameParts.shift() || "Talent"
      const lastName = nameParts.join(" ")
      let talentId = editingTalent?.id

      if (editingTalent?.mode === "edit") {
        const { error } = await supabase
          .from("talent_profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            title: formData.title,
            bio: formData.bio,
            category_id: category.id,
            country_id: country.id,
            city,
            available: !!formData.available,
          })
          .eq("id", editingTalent.id)
          .eq("managed_by", managerId)

        if (error) throw error
      } else {
        const { data, error } = await supabase.rpc("create_manager_talent", {
          p_managed_by: managerId,
          p_first_name: firstName,
          p_last_name: lastName,
          p_title: formData.title,
          p_bio: formData.bio,
          p_category_id: category.id,
          p_country_id: country.id,
          p_city: city,
          p_available: !!formData.available,
        })

        if (error) throw error
        talentId = data
      }

      const previousSkills = editingTalent?.initialValues?.skills || []
      const nextSkills = formData.skills || []
      const skillsChanged =
        editingTalent?.mode !== "edit" ||
        JSON.stringify([...previousSkills].sort()) !==
          JSON.stringify([...nextSkills].sort())

      if (skillsChanged) {
        const { error: oldSkillsError } = await supabase
          .from("talent_profile_skills")
          .delete()
          .eq("talent_id", talentId)

        if (oldSkillsError) throw oldSkillsError

        for (const skillName of nextSkills) {
          const skill = await resolveSkill(skillName)
          if (!skill?.id) continue

          const { error: relationError } = await supabase
            .from("talent_profile_skills")
            .insert({ talent_id: talentId, skill_id: skill.id })

          if (relationError) throw relationError
        }
      }

      if (editingTalent?.mode === "edit") {
        const { error: linkDeleteError } = await supabase
          .from("portfolio_items")
          .delete()
          .eq("talent_id", talentId)
          .eq("type", "link")

        if (linkDeleteError) throw linkDeleteError
      }

      if (formData.avatarFile || formData.coverFile) {
        await uploadTalentProfileMedia(talentId, managerId, {
          avatar: formData.avatarFile,
          cover: formData.coverFile,
        })
      }

      if ((formData.portfolioFiles || []).length > 0) {
        await uploadTalentPortfolioFiles(
          talentId,
          formData.portfolioFiles
        )
      }

      if ((formData.portfolioLinks || []).length > 0) {
        await addTalentPortfolioLinks(
          talentId,
          formData.portfolioLinks
        )
      }

      toast.success(
        editingTalent?.mode === "edit"
          ? "Talent modifié avec succès ✅"
          : "Talent créé avec succès ✅"
      )

      setEditingTalent(null)
      await loadTalents()
    } catch (error) {
      console.error("Erreur enregistrement talent :", error)
      toast.error(error?.message || "Impossible d'enregistrer le talent")
    } finally {
      setSaving(false)
    }
  }

  const publish = async (talent) => {
    if (!talent?.id || !managerId) return
    setActionLoading(talent.id)

    try {
      const { error } = await supabase
        .from("talent_profiles")
        .update({ status: "published", is_visible: true })
        .eq("id", talent.id)
        .eq("managed_by", managerId)

      if (error) throw error
      toast.success(`${talent.name} est maintenant publié ✅`)
      await loadTalents()
    } catch (error) {
      console.error("Erreur publication :", error)
      toast.error(error?.message || "Impossible de publier ce talent")
    } finally {
      setActionLoading(null)
    }
  }

  const reject = async (talent) => {
    if (!talent?.id || !managerId) return
    setActionLoading(talent.id)

    try {
      const { error } = await supabase
        .from("talent_profiles")
        .update({ status: "rejected", is_visible: false })
        .eq("id", talent.id)
        .eq("managed_by", managerId)

      if (error) throw error
      toast.success(`${talent.name} a été refusé`)
      await loadTalents()
    } catch (error) {
      console.error("Erreur refus :", error)
      toast.error(error?.message || "Impossible de refuser ce talent")
    } finally {
      setActionLoading(null)
    }
  }

  const removeTalent = async (talent) => {
    if (!talent?.id || !managerId) return

    const confirmed = window.confirm(
      `Supprimer définitivement le profil de ${talent.name || "ce talent"} ?`
    )

    if (!confirmed) return

    setActionLoading(talent.id)

    try {
      await deleteTalentPortfolioItems(talent.id)

      const { error: skillDeleteError } = await supabase
        .from("talent_profile_skills")
        .delete()
        .eq("talent_id", talent.id)

      if (skillDeleteError) throw skillDeleteError

      const { error } = await supabase
        .from("talent_profiles")
        .delete()
        .eq("id", talent.id)
        .eq("managed_by", managerId)

      if (error) throw error

      toast.success(`${talent.name} a été supprimé`)
      await loadTalents()
    } catch (error) {
      console.error("Erreur suppression :", error)
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

  const pendingCount = talents.filter((talent) => talent.status === "pending").length
  const publishedCount = talents.filter((talent) => talent.status === "published").length
  const ratedTalents = talents.filter((talent) => talent.ratingValue > 0)
  const averageRating = ratedTalents.length
    ? (
        ratedTalents.reduce((total, talent) => total + talent.ratingValue, 0) /
        ratedTalents.length
      ).toFixed(1)
    : "—"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Gestion des talents
          </h1>
          <p className="text-sm text-muted-foreground">
            {talents.length} talent{talents.length > 1 ? "s" : ""} dans votre équipe
          </p>
        </div>

        <Button className="gap-2" onClick={openCreate} disabled={!!editingTalent}>
          <Plus className="h-4 w-4" />
          Créer un talent
        </Button>
      </div>

      {editingTalent ? (
        <TalentEditor
          key={`${editingTalent.mode}-${editingTalent.id || "new"}`}
          mode={editingTalent.mode}
          initialValues={editingTalent.initialValues}
          onCancel={() => setEditingTalent(null)}
          onSave={saveTalent}
          saving={saving}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: talents.length, cls: "text-gold-dark", icon: Award },
          { label: "Publiés", value: publishedCount, cls: "text-emerald-600", icon: ShieldCheck },
          { label: "En attente", value: pendingCount, cls: "text-amber-600", icon: Clock },
          { label: "Note moy.", value: averageRating, cls: "text-violet-600", icon: Star },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                  <Icon className={cn("h-5 w-5", stat.cls)} />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="overflow-hidden border-border/60">
        <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-black">Mes talents</CardTitle>
            <CardDescription>
              Créez, modifiez, publiez ou supprimez les profils que vous gérez.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
              {[
                { k: "all", l: "Tous" },
                { k: "pending", l: `En attente (${pendingCount})` },
                { k: "published", l: "Publiés" },
              ].map((item) => (
                <button
                  key={item.k}
                  type="button"
                  onClick={() => setFilter(item.k)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    filter === item.k
                      ? "bg-background text-foreground shadow"
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
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Talent
                  </th>
                  <th className="hidden px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:table-cell">
                    Catégorie
                  </th>
                  <th className="hidden px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                    Rejoint
                  </th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Statut
                  </th>
                  <th className="hidden px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Perf.
                  </th>
                  <th className="w-10 px-6 py-3" />
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
                      <p className="text-sm font-semibold">Aucun talent trouvé.</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Créez votre premier profil avec « Créer un talent ».
                      </p>
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
                        className="border-b border-border/40 transition-colors hover:bg-accent/30"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-gold text-xs font-black text-white">
                                {initials || "T"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-bold">
                                {talent.name || "Talent sans nom"}
                              </p>
                              <p className="hidden truncate text-xs text-muted-foreground md:block">
                                {talent.title}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="hidden px-6 py-3.5 md:table-cell">
                          <span className="text-xs font-medium">{talent.cat}</span>
                        </td>

                        <td className="hidden px-6 py-3.5 lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(talent.created_at)}
                          </span>
                        </td>

                        <td className="px-6 py-3.5">
                          <Badge
                            variant="outline"
                            className={cn("gap-1 text-xs font-bold", status.cls)}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>

                        <td className="hidden px-6 py-3.5 sm:table-cell">
                          <div className="flex items-center gap-3 text-xs">
                            {talent.ratingValue > 0 ? (
                              <span className="flex items-center gap-1 font-bold">
                                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                                {talent.ratingValue.toFixed(1)}
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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={busy}
                              className="h-8 w-8 rounded-lg"
                              onClick={() => navigate(`/talent/${talent.id}`)}
                              title="Voir la fiche"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={busy}
                              className="h-8 w-8 rounded-lg"
                              onClick={() => openEdit(talent)}
                              title="Modifier"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </Button>

                            {talent.status !== "published" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                className="h-8 gap-1 px-2.5 text-xs"
                                onClick={() => publish(talent)}
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                )}
                                Publier
                              </Button>
                            ) : null}

                            {talent.status === "pending" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={busy}
                                className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-600"
                                onClick={() => reject(talent)}
                                title="Refuser"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : null}

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={busy}
                              className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-600"
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

      <Card className="relative overflow-hidden border-gold/20">
        <div className="absolute inset-x-0 top-0 h-1 bg-gold" />
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold">
            <UserPlus className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-lg font-black">Workflow Manager</h3>
            <p className="text-sm text-muted-foreground">
              Créez un profil, ajoutez les compétences et le portfolio, puis publiez-le.
            </p>
          </div>
          <Button className="shrink-0 gap-2" onClick={openCreate} disabled={!!editingTalent}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
