import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Save,
  User,
  Briefcase,
  MapPin,
  DollarSign,
  FileText,
  Loader2,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  CalendarDays,
  Link2,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils.js"
import { supabase } from "@/lib/supabase"
import FileUpload from "@/components/FileUpload.jsx"

const talentSchema = z.object({
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(120),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  location: z.string().min(2, "Veuillez indiquer la localisation").max(160),
  hourlyRate: z.coerce
    .number({ invalid_type_error: "Tarif invalide" })
    .int("Le tarif doit être un entier")
    .positive("Le tarif doit être positif")
    .min(1000, "Tarif minimum : 1 000 XOF")
    .max(1000000, "Tarif maximum : 1 000 000 XOF"),
  bio: z.string().min(30, "La description doit contenir au moins 30 caractères").max(1500),
  skills: z.array(z.string()).min(1, "Ajoutez au moins une compétence").max(15),
  available: z.boolean(),
})

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

const getCategoryLabel = (category) => category?.name || category?.slug || "Catégorie"

function createLocalId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export default function TalentForm({
  initialValues,
  onSubmit,
  submitLabel = "Enregistrer le profil",
  disabled = false,
}) {
  const [categories, setCategories] = useState([])
  const [categoryLoading, setCategoryLoading] = useState(true)
  const [portfolioFiles, setPortfolioFiles] = useState([])
  const [portfolioLinks, setPortfolioLinks] = useState([
    { id: createLocalId(), title: "", url: "" },
  ])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(talentSchema),
    defaultValues: {
      displayName: initialValues?.displayName || "",
      title: initialValues?.title || "",
      category: initialValues?.category || "",
      location: initialValues?.location || "",
      hourlyRate: initialValues?.hourlyRate ?? "",
      bio: initialValues?.bio || "",
      skills: initialValues?.skills || [],
      available: initialValues?.available ?? true,
    },
  })

  const selectedSkills = watch("skills") || []
  const available = watch("available")
  const currentBio = watch("bio") || ""

  useEffect(() => {
    reset({
      displayName: initialValues?.displayName || "",
      title: initialValues?.title || "",
      category: initialValues?.category || "",
      location: initialValues?.location || "",
      hourlyRate: initialValues?.hourlyRate ?? "",
      bio: initialValues?.bio || "",
      skills: initialValues?.skills || [],
      available: initialValues?.available ?? true,
    })

    setPortfolioFiles([])
    setPortfolioLinks(
      initialValues?.portfolioLinks?.length
        ? initialValues.portfolioLinks.map((item) => ({
            id: createLocalId(),
            title: item.title || "",
            url: item.url || "",
          }))
        : [{ id: createLocalId(), title: "", url: "" }]
    )
  }, [initialValues, reset])

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
        console.error("Erreur catégories TalentForm :", error)
        toast.error("Impossible de charger les catégories")
        setCategories([])
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

  const toggleSkill = (skill) => {
    const current = new Set(selectedSkills)
    if (current.has(skill)) current.delete(skill)
    else current.add(skill)
    setValue("skills", Array.from(current), { shouldValidate: true })
  }

  const addLink = () => {
    setPortfolioLinks((current) => [
      ...current,
      { id: createLocalId(), title: "", url: "" },
    ])
  }

  const updateLink = (id, field, value) => {
    setPortfolioLinks((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const removeLink = (id) => {
    setPortfolioLinks((current) => {
      if (current.length === 1) return [{ id: createLocalId(), title: "", url: "" }]
      return current.filter((item) => item.id !== id)
    })
  }

  const handleFormSubmit = (data) => {
    const normalizedLinks = portfolioLinks
      .map(({ title, url }) => ({ title: title.trim(), url: url.trim() }))
      .filter((item) => item.url)

    for (const link of normalizedLinks) {
      try {
        new URL(link.url)
      } catch {
        toast.error(`Lien portfolio invalide : ${link.url}`)
        return
      }
    }

    onSubmit?.({
      ...data,
      portfolioFiles,
      portfolioLinks: normalizedLinks,
    })
  }

  const FieldWrap = ({ label, icon: Icon, error, hint, children, required }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-4 w-4 text-gold" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )

  const inputClass = (hasError) =>
    cn(
      "w-full px-4 py-2.5 rounded-xl border bg-background transition-all",
      "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50",
      "placeholder:text-muted-foreground/60 text-sm",
      hasError
        ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
        : "border-border hover:border-border/80"
    )

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldWrap label="Nom d'affichage" icon={User} error={errors.displayName?.message} required>
          <input type="text" placeholder="Ex: Marie Koné" className={inputClass(!!errors.displayName)} {...register("displayName")} disabled={disabled || isSubmitting} />
        </FieldWrap>

        <FieldWrap label="Titre professionnel" icon={Briefcase} error={errors.title?.message} required>
          <input type="text" placeholder="Ex: Designer UI/UX" className={inputClass(!!errors.title)} {...register("title")} disabled={disabled || isSubmitting} />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldWrap label="Catégorie" error={errors.category?.message} required>
          <select className={cn(inputClass(!!errors.category), "appearance-none pr-10")} {...register("category")} disabled={disabled || isSubmitting || categoryLoading}>
            <option value="">{categoryLoading ? "Chargement…" : "Sélectionnez une catégorie…"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{getCategoryLabel(category)}</option>
            ))}
          </select>
        </FieldWrap>

        <FieldWrap label="Localisation" icon={MapPin} error={errors.location?.message} required>
          <input type="text" placeholder="Ex: Ouagadougou, Burkina Faso" className={inputClass(!!errors.location)} {...register("location")} disabled={disabled || isSubmitting} />
        </FieldWrap>
      </div>

      <FieldWrap label="Tarif journalier (XOF)" icon={DollarSign} error={errors.hourlyRate?.message} required>
        <div className="relative">
          <input type="number" min={1000} step={500} placeholder="5000" className={cn(inputClass(!!errors.hourlyRate), "pr-16")} {...register("hourlyRate")} disabled={disabled || isSubmitting} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">XOF</span>
        </div>
      </FieldWrap>

      <FieldWrap label="Vos compétences" error={errors.skills?.message} hint="Sélectionnez les compétences clés du talent (max 15)" required>
        <div className="flex flex-wrap gap-2 mb-3 p-4 rounded-xl border border-border bg-card/50 min-h-[52px]">
          {selectedSkills.length === 0 ? (
            <span className="text-sm text-muted-foreground/60">Aucune compétence sélectionnée</span>
          ) : selectedSkills.map((skill) => (
            <motion.button key={skill} type="button" layout onClick={() => toggleSkill(skill)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gold-gradient text-white text-xs font-medium shadow-sm hover:opacity-90" disabled={disabled || isSubmitting}>
              {skill}<ChevronRight className="h-3 w-3 rotate-45" />
            </motion.button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SKILLS.map((skill) => {
            const selected = selectedSkills.includes(skill)
            return (
              <button key={skill} type="button" onClick={() => toggleSkill(skill)} disabled={disabled || isSubmitting} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border", selected ? "bg-accent border-gold/40 text-gold" : "bg-card border-border text-foreground/70 hover:border-gold/30 hover:text-foreground")}>
                {skill}
              </button>
            )
          })}
        </div>
      </FieldWrap>

      <FieldWrap label="Description / Bio" icon={FileText} error={errors.bio?.message} hint={`${currentBio.length}/1500 caractères`} required>
        <textarea rows={6} placeholder="Présentez l'expérience, les services et les points forts du talent…" className={cn(inputClass(!!errors.bio), "resize-none")} {...register("bio")} disabled={disabled || isSubmitting} />
      </FieldWrap>

      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-gold" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Disponibilité</p>
            <p className="text-sm text-muted-foreground mt-1">Indiquez si le talent accepte actuellement de nouvelles missions.</p>
          </div>
          <button type="button" onClick={() => setValue("available", !available, { shouldValidate: true })} disabled={disabled || isSubmitting} className={cn("relative h-7 w-12 rounded-full transition-colors", available ? "bg-emerald-500" : "bg-muted-foreground/30")} aria-pressed={available}>
            <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform", available ? "left-6" : "left-1")} />
          </button>
        </div>
        <input type="checkbox" className="hidden" {...register("available")} />
        <p className={cn("text-xs font-semibold mt-3", available ? "text-emerald-600" : "text-muted-foreground")}>{available ? "Disponible pour de nouvelles missions" : "Indisponible pour le moment"}</p>
      </div>

      <FieldWrap label="Photos / vidéos du portfolio" icon={Video} hint="JPG, PNG, WEBP, MP4, WEBM, PDF • 15 MB max par fichier">
        <FileUpload
          onChange={(files) => setPortfolioFiles(files ? (Array.isArray(files) ? files : [files]) : [])}
          multiple
          maxSize={15 * 1024 * 1024}
          accept="image/*,video/*,application/pdf"
          label="Ajoutez des réalisations, photos ou vidéos"
          hint="Photos, vidéos ou PDF • 15 MB max par fichier"
          id="talent-portfolio-upload"
        />
      </FieldWrap>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold flex items-center gap-2"><Link2 className="h-4 w-4 text-gold" /> Liens externes</p>
            <p className="text-xs text-muted-foreground mt-1">Behance, Dribbble, LinkedIn, YouTube, site personnel…</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLink} disabled={disabled || isSubmitting} className="gap-1.5">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-3">
          {portfolioLinks.map((link) => (
            <div key={link.id} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-2 items-start">
              <input type="text" value={link.title} onChange={(e) => updateLink(link.id, "title", e.target.value)} placeholder="Titre du lien" className={inputClass(false)} disabled={disabled || isSubmitting} />
              <input type="url" value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)} placeholder="https://…" className={inputClass(false)} disabled={disabled || isSubmitting} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(link.id)} disabled={disabled || isSubmitting} className="hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex items-start gap-2.5 text-xs text-muted-foreground max-w-xl">
          <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <span>Le talent est créé en attente. Vous pourrez ensuite le publier et le rendre visible aux clients.</span>
        </div>
        <Button type="submit" disabled={disabled || isSubmitting} className="gap-2 min-w-44">
          {disabled || isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
