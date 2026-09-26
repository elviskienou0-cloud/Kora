import { useCallback, useEffect, useMemo, useState } from "react"
import { Star, Loader2, Send, MessageSquareText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"

function initials(name = "Client KORA") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "K"
  )
}

export default function TalentReviews({ talentId }) {
  const { user } = useAuth()
  const clientId = user?.authId || user?.id || null

  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)

  const loadReviews = useCallback(async () => {
    if (!talentId) return
    setLoadingReviews(true)
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, rating, comment, created_at")
        .eq("talent_id", talentId)
        .in("source", ["project_review", "talent_review"])
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(30)

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error("Erreur chargement avis talent :", error)
    } finally {
      setLoadingReviews(false)
    }
  }, [talentId])


  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const average = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
  }, [reviews])

  const submit = async (event) => {
    event.preventDefault()

    if (!clientId) {
      toast.info("Connectez-vous en tant que Client pour laisser un avis.")
      return
    }

    if (!rating) {
      toast.error("Choisissez une note de 1 à 5.")
      return
    }
    if (!comment.trim()) {
      toast.error("Ajoutez un commentaire.")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.rpc("create_talent_review", {
        p_talent_id: talentId,
        p_rating: rating,
        p_comment: comment.trim(),
      })

      if (error) throw error

      toast.success("Merci, votre avis a été publié ✅")
      setComment("")
      setRating(0)
      setShowForm(false)
      loadReviews()
    } catch (error) {
      console.error("Erreur création avis :", error)
      toast.error(error?.message || "Impossible d'enregistrer votre avis.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="font-black flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-gold" /> Avis
        </CardTitle>
        <CardDescription>
          {reviews.length
            ? `${average.toFixed(1)}/5 sur ${reviews.length} avis`
            : "Aucun avis publié pour le moment."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2 gold-gradient text-white">
            <Star className="h-4 w-4" /> Laisser un avis
          </Button>
        )}

        {showForm && (
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gold/20 bg-gold/5 p-4">
            <div className="space-y-2">
              <Label>Votre note</Label>
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const active = (hoverRating || rating) >= value
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHoverRating(value)}
                      onClick={() => setRating(value)}
                      className="rounded-md p-1 transition-transform hover:scale-110"
                    >
                      <Star className={active ? "h-7 w-7 fill-amber-400 text-amber-400" : "h-7 w-7 text-muted-foreground/40"} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="talent-review-comment">Commentaire</Label>
              <Textarea
                id="talent-review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Partagez votre expérience avec ce talent…"
                maxLength={3000}
                className="min-h-28"
                disabled={saving}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2 gold-gradient text-white" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? "Envoi…" : "Publier"}
              </Button>
            </div>
          </form>
        )}

        {loadingReviews ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ce talent n'a pas encore reçu d'avis client.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="gold-gradient text-xs font-black text-white">
                    {initials(review.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate">{review.author_name || "Client KORA"}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={
                            index < Number(review.rating || 0)
                              ? "h-3.5 w-3.5 fill-gold text-gold"
                              : "h-3.5 w-3.5 text-muted-foreground/30"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString("fr-FR") : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}