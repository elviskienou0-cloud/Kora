import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import { cn } from "@/lib/utils.js"
import { supabase } from "@/lib/supabase"

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("reviews").select("id, author_name, role, rating, comment, created_at").eq("is_visible", true).eq("source", "public_review").order("created_at", { ascending: false }).limit(6)
      if (!mounted) return
      if (error) console.error("Erreur chargement avis KORA :", error)
      setReviews(data || [])
      setLoading(false)
    }
    load()
    const channel = supabase.channel("kora-public-reviews").on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, load).subscribe()
    return () => { mounted = false; supabase.removeChannel(channel) }
  }, [])
  const average = reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length : 0
  return (
    <section className="w-full max-w-6xl mx-auto" aria-label="Avis clients">
      <div className="text-center mb-10 sm:mb-14">
        <p className="text-sm font-medium gold-text-gradient mb-2">AVIS RÉELS</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Avis clients</h2>
        {loading ? <p className="text-sm text-muted-foreground">Chargement des avis…</p> : reviews.length ? (
          <div className="flex items-center justify-center gap-3">
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={cn("h-5 w-5", i <= Math.round(average) ? "text-gold fill-gold" : "text-muted-foreground/30")} />)}</div>
            <span className="text-sm font-medium">{average.toFixed(1)}/5</span><span className="text-sm text-muted-foreground">({reviews.length} avis)</span>
          </div>
        ) : <p className="text-sm text-muted-foreground">Aucun avis publié pour le moment.</p>}
      </div>
      {reviews.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {reviews.map(review => <motion.article key={review.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl p-6 border border-border">
          <Quote className="h-7 w-7 text-gold/20 mb-3" />
          <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(i => <Star key={i} className={cn("h-4 w-4", i <= Number(review.rating || 0) ? "text-gold fill-gold" : "text-muted-foreground/20")} />)}</div>
          <p className="text-sm leading-relaxed mb-5">{review.comment}</p>
          <div className="pt-4 border-t border-border/60"><p className="text-sm font-semibold">{review.author_name || "Client KORA"}</p><p className="text-xs text-muted-foreground">{review.role || "Client KORA"}{review.created_at ? ` • ${new Date(review.created_at).toLocaleDateString("fr-FR")}` : ""}</p></div>
        </motion.article>)}
      </div>}
    </section>
  )
}