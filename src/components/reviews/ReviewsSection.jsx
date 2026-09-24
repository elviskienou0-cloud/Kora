import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Quote, Send } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils.js"
import { supabase } from "@/lib/supabase"

const DEFAULT_REVIEWS = [
  {
    id: "1",
    author: "Awa K.",
    role: "Client, Abidjan",
    avatar: "AK",
    rating: 5,
    comment: "Service exceptionnel ! J&apos;ai trouvé un talent incroyable pour mon projet en moins de 24h. Je recommande vivement KORA.",
    date: "Il y a 2 semaines",
  },
  {
    id: "2",
    author: "Mohamed T.",
    role: "Manager, Dakar",
    avatar: "MT",
    rating: 5,
    comment: "La plateforme est intuitive et les talents sont vraiment qualifiés. Mon agence a gagné en efficacité depuis que nous utilisons KORA.",
    date: "Il y a 1 mois",
  },
  {
    id: "3",
    author: "Fatou D.",
    role: "Freelance Design",
    avatar: "FD",
    rating: 4,
    comment: "En tant que talent, je suis très satisfaite. Des missions intéressantes, des paiements rapides et un support client au top !",
    date: "Il y a 3 semaines",
  },
]

export default function ReviewSection({ reviews = DEFAULT_REVIEWS, showForm = true, title = "Avis clients" }) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const [formRating, setFormRating] = useState(0)
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [allReviews, setAllReviews] = useState(reviews)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadReviews() {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, role, rating, comment, created_at")
        .eq("is_visible", true)
        .eq("source", "public_review")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Erreur chargement avis KORA :", error)
        return
      }

      if (!mounted) return

      const persistedReviews = (data || []).map((review) => ({
        id: review.id,
        author: review.author_name || "Client KORA",
        role: review.role || "Client KORA",
        avatar: (review.author_name || "Client KORA")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase(),
        rating: review.rating,
        comment: review.comment,
        date: review.created_at
          ? new Date(review.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "",
      }))

      setAllReviews([...persistedReviews, ...reviews])
    }

    loadReviews()

    const channel = supabase
      .channel("kora-public-review-section")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => loadReviews()
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [reviews])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedComment = comment.trim()

    if (!trimmedName || formRating === 0 || !trimmedComment) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    if (trimmedName.length > 100) {
      toast.error("Le nom ne doit pas dépasser 100 caractères")
      return
    }

    if (trimmedComment.length > 3000) {
      toast.error("Votre commentaire ne doit pas dépasser 3000 caractères")
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc("create_public_review", {
        p_author_name: trimmedName,
        p_rating: formRating,
        p_comment: trimmedComment,
      })

      if (error) throw error

      const createdReview = Array.isArray(data) ? data[0] : data
      const newReview = {
        id: createdReview?.id || `public-${Date.now()}`,
        author: createdReview?.author_name || trimmedName,
        role: createdReview?.role || "Client KORA",
        avatar: trimmedName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase(),
        rating: createdReview?.rating || formRating,
        comment: createdReview?.comment || trimmedComment,
        date: "À l'instant",
      }

      setAllReviews((current) => [newReview, ...current])
      setName("")
      setComment("")
      setFormRating(0)
      setHoveredRating(0)
      toast.success("Merci pour votre avis ! Il a bien été enregistré.")
    } catch (error) {
      console.error("Erreur création avis KORA :", error)
      toast.error(error?.message || "Impossible d'enregistrer votre avis.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const average = allReviews.length
    ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    : 0

  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm font-medium gold-text-gradient mb-2"
        >
          TÉMOIGNAGES
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
        >
          {title}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  "h-5 w-5 transition-colors",
                  i <= Math.round(average)
                    ? "text-gold fill-gold"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{average.toFixed(1)}/5</span>
          <span className="text-sm text-muted-foreground">
            ({allReviews.length} avis)
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14">
        {allReviews.slice(0, 6).map((review, i) => (
          <motion.article
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 150 }}
            className="group relative bg-card rounded-2xl p-6 border border-border hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300"
          >
            <Quote className="absolute top-4 right-4 h-8 w-8 text-gold/20 group-hover:text-gold/30 transition-colors" />

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i <= review.rating
                      ? "text-gold fill-gold"
                      : "text-muted-foreground/20"
                  )}
                />
              ))}
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed mb-5 pr-6">
              {review.comment}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-border/60">
              <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {review.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{review.author}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="truncate">{review.role}</span>
                  <span>•</span>
                  <span>{review.date}</span>
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-card rounded-2xl p-6 sm:p-8 border border-border"
          >
            <h3 className="text-xl font-bold mb-5">Laissez un avis</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Votre note</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormRating(i)}
                      onMouseEnter={() => setHoveredRating(i)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 -m-1 rounded-lg transition-transform hover:scale-110 active:scale-95"
                      aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-all duration-150",
                          i <= (hoveredRating || formRating)
                            ? "text-gold fill-gold scale-100"
                            : "text-muted-foreground/25 hover:text-gold/50"
                        )}
                      />
                    </button>
                  ))}
                  <AnimatePresence mode="wait">
                    {formRating > 0 && (
                      <motion.span
                        key={formRating}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="ml-3 text-sm font-medium text-gold"
                      >
                        {formRating}/5
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label htmlFor="review-name" className="text-sm font-medium mb-2 block">
                  Votre nom
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Marie K."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <div>
                <label htmlFor="review-comment" className="text-sm font-medium mb-2 block">
                  Votre commentaire
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre expérience avec KORA..."
                  maxLength={3000}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all resize-none placeholder:text-muted-foreground/60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gold-gradient text-white font-semibold shadow-md shadow-gold/25 hover:shadow-gold/40 hover:opacity-95 transition-all"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Envoyer mon avis"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
