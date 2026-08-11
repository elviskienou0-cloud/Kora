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
} from "lucide-react"
import { cn } from "@/lib/utils.js"
import FileUpload from "@/components/FileUpload.jsx"

const CATEGORIES = [
  "Design & Création",
  "Développement Web",
  "Marketing Digital",
  "Rédaction & Contenu",
  "Vidéo & Animation",
  "Musique & Audio",
  "Business & Consulting",
  "Formation & Coaching",
]

const SKILLS_PRESET = [
  "Figma",
  "Photoshop",
  "React",
  "Node.js",
  "SEO",
  "WordPress",
  "Canva",
  "Premiere Pro",
  "Illustrator",
  "Python",
  "UI/UX",
  "Copywriting",
]

const talentSchema = z.object({
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(60),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(100),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  location: z.string().min(2, "Veuillez indiquer votre localisation"),
  hourlyRate: z.coerce
    .number({ invalid_type_error: "Tarif invalide" })
    .int("Le tarif doit être un entier")
    .positive("Le tarif doit être positif")
    .min(1000, "Tarif minimum : 1 000 XOF")
    .max(1000000, "Tarif maximum : 1 000 000 XOF"),
  bio: z
    .string()
    .min(30, "La description doit contenir au moins 30 caractères")
    .max(1000, "Description trop longue"),
  skills: z.array(z.string()).min(1, "Ajoutez au moins une compétence").max(15),
  portfolio: z.string().optional(),
})

export default function TalentForm({ initialValues, onSubmit, submitLabel = "Enregistrer le profil", className }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(talentSchema),
    defaultValues: {
      displayName: initialValues?.displayName || "",
      title: initialValues?.title || "",
      category: initialValues?.category || "",
      location: initialValues?.location || "",
      hourlyRate: initialValues?.hourlyRate || "",
      bio: initialValues?.bio || "",
      skills: initialValues?.skills || [],
      portfolio: initialValues?.portfolio || "",
    },
  })

  const selectedSkills = watch("skills") || []

  const toggleSkill = (skill) => {
    const current = new Set(selectedSkills)
    if (current.has(skill)) {
      current.delete(skill)
    } else {
      current.add(skill)
    }
    setValue("skills", Array.from(current), { shouldValidate: true })
  }

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit?.(data)
      toast.success("Profil talent enregistré avec succès !")
    } catch (err) {
      toast.error(err?.message || "Une erreur est survenue")
    }
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
          className="text-xs text-destructive flex items-center gap-1"
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldWrap label="Nom d'affichage" icon={User} error={errors.displayName?.message} required>
          <input
            type="text"
            placeholder="Ex: Marie Koné"
            className={inputClass(!!errors.displayName)}
            {...register("displayName")}
          />
        </FieldWrap>

        <FieldWrap label="Titre professionnel" icon={Briefcase} error={errors.title?.message} required>
          <input
            type="text"
            placeholder="Ex: Designer UI/UX Freelance"
            className={inputClass(!!errors.title)}
            {...register("title")}
          />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldWrap label="Catégorie" error={errors.category?.message} required>
          <select
            className={cn(inputClass(!!errors.category), "appearance-none pr-10")}
            {...register("category")}
          >
            <option value="">Sélectionnez une catégorie...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldWrap>

        <FieldWrap label="Localisation" icon={MapPin} error={errors.location?.message} required>
          <input
            type="text"
            placeholder="Ex: Abidjan, Côte d'Ivoire"
            className={inputClass(!!errors.location)}
            {...register("location")}
          />
        </FieldWrap>
      </div>

      <FieldWrap label="Tarif horaire (XOF)" icon={DollarSign} error={errors.hourlyRate?.message} hint="Tarif minimum conseillé : 5 000 XOF" required>
        <div className="relative">
          <input
            type="number"
            min={1000}
            step={500}
            placeholder="5000"
            className={cn(inputClass(!!errors.hourlyRate), "pr-16")}
            {...register("hourlyRate")}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            XOF
          </span>
        </div>
      </FieldWrap>

      <FieldWrap label="Vos compétences" error={errors.skills?.message} hint="Sélectionnez ou ajoutez vos compétences (max 15)" required>
        <div className="flex flex-wrap gap-2 mb-3 p-4 rounded-xl border border-border bg-card/50 min-h-[52px]">
          {selectedSkills.length === 0 ? (
            <span className="text-sm text-muted-foreground/60">Aucune compétence sélectionnée</span>
          ) : (
            selectedSkills.map((s) => (
              <motion.button
                key={s}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => toggleSkill(s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gold-gradient text-white text-xs font-medium shadow-sm hover:opacity-90 transition-opacity"
              >
                {s}
                <ChevronRight className="h-3 w-3 rotate-45" />
              </motion.button>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {SKILLS_PRESET.map((s) => {
            const selected = selectedSkills.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSkill(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  selected
                    ? "bg-accent border-gold/40 text-gold"
                    : "bg-card border-border text-foreground/70 hover:border-gold/30 hover:text-foreground"
                )}
              >
                {s}
              </button>
            )
          })}
        </div>
      </FieldWrap>

      <FieldWrap label="Description / Bio" icon={FileText} error={errors.bio?.message} hint={`${watch("bio")?.length || 0}/1000 caractères - Décrivez votre expérience`} required>
        <textarea
          rows={5}
          placeholder="Parlez de vous, de votre expérience, de vos services et de ce qui vous rend unique..."
          className={cn(inputClass(!!errors.bio), "resize-none")}
          {...register("bio")}
        />
      </FieldWrap>

      <FieldWrap label="Photos de portfolio (optionnel)" hint="JPG, PNG, PDF • 5MB max par fichier">
        <FileUpload
          onChange={() => {}}
          multiple
          accept="image/*,application/pdf"
          label="Ajoutez des exemples de vos réalisations"
        />
      </FieldWrap>

      <FieldWrap label="Lien portfolio externe (optionnel)" hint="Site web, Behance, Dribbble, LinkedIn...">
        <input
          type="url"
          placeholder="https://"
          className={inputClass(false)}
          {...register("portfolio")}
        />
      </FieldWrap>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex items-start gap-2.5 text-xs text-muted-foreground max-w-md">
          <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
          <p>
            Un profil complet et détaillé reçoit 3x plus de demandes de la part des clients.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gold-gradient text-white font-semibold",
            "shadow-md shadow-gold/25 hover:shadow-gold/40 hover:opacity-95 transition-all",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
