import { useEffect, useState } from "react"
import { Quote, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"

function initials(value = "Avis") {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AV"
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let mounted = true

    async function loadReviews() {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, author_name, role, country, avatar_url, rating, comment, created_at")
        .eq("is_visible", true)
        .eq("source", "project_review")
        .not("client_id", "is", null)
        .not("talent_id", "is", null)
        .not("project_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(6)

      if (error) {
        console.error("Erreur chargement avis :", error)
        if (mounted) setReviews([])
        return
      }

      if (mounted) setReviews(data || [])
    }

    loadReviews()

    const channel = supabase
      .channel("kora-public-reviews")
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
  }, [])

  if (!reviews.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviews.map((review) => (
        <Card key={review.id} className="h-full relative overflow-hidden">
          <div className="absolute top-5 right-5 opacity-10">
            <Quote className="h-16 w-16 text-gold-dark" />
          </div>
          <CardContent className="p-7 relative z-10">
            <div className="flex gap-0.5 mb-5">
              {Array.from({ length: review.rating }).map((_, index) => (
                <Star key={index} className="h-5 w-5 text-amber-500 fill-amber-500" />
              ))}
            </div>

            <p className="text-foreground leading-relaxed mb-6 text-base font-medium">
              “{review.comment}”
            </p>

            <Separator className="mb-5" />

            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-gold/30">
                {review.avatar_url ? <img src={review.avatar_url} alt="" /> : null}
                <AvatarFallback>{initials(review.author_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold">{review.author_name || "Client KORA"}</p>
                <p className="text-sm text-muted-foreground">
                  {[review.role, review.country].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
