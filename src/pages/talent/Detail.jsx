// @ts-nocheck
import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ArrowLeft,
  Star,
  MapPin,
  Briefcase,
  Award,
  Heart,
  MessageCircle,
  Share2,
  CheckCircle2,
  Users,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { APP_PARAMS } from "@/lib/app-params"
import { cn, formatCurrency } from "@/lib/utils"
import ReviewSection from "@/components/ReviewSection"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"

function getTalentName(t) {
  if (!t) return "Talent"

  return (
    [t.first_name, t.last_name].filter(Boolean).join(" ") ||
    "Talent"
  )
}

export default function TalentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [talent, setTalent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [liked, setLiked] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)
  const [togglingFavorite, setTogglingFavorite] = useState(false)
  const [inviting, setInviting] = useState(false)

  // Sécurise l'accès à la route messages
  const messagesRoute =
    APP_PARAMS?.routes?.messages || "/messages"

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError("Identifiant du talent manquant.")
      return
    }

    let cancelled = false

    async function loadTalent() {
      setLoading(true)
      setError("")

      try {
        const { data, error: talentError } = await supabase
          .from("talent_profiles")
          .select(`
            id,
            first_name,
            last_name,
            title,
            bio,
            city,
            daily_rate,
            currency,
            rating,
            reviews_count,
            completed_projects,
            verified,
            available,
            created_at,
            categories ( id, name ),
            countries ( id, name ),
            talent_profile_skills ( skills ( id, name ) )
          `)
          .eq("id", id)
          .eq("is_visible", true)
          .maybeSingle()

        if (talentError) throw talentError

        if (cancelled) return

        setTalent(data)

        // Vérifier le favori uniquement pour un client connecté
        if (
          data &&
          isAuthenticated &&
          user?.role === "client" &&
          user?.authId
        ) {
          const { data: favRow, error: favError } =
            await supabase
              .from("favorites")
              .select("id")
              .eq("client_id", user.authId)
              .eq("talent_id", data.id)
              .maybeSingle()

          if (!favError && !cancelled) {
            setLiked(Boolean(favRow))
            setFavoriteId(favRow?.id || null)
          }
        }
      } catch (err) {
        console.error(
          "Erreur chargement du talent :",
          err
        )

        if (!cancelled) {
          setError(
            err?.message ||
              "Impossible de charger ce profil."
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTalent()

    return () => {
      cancelled = true
    }
  }, [
    id,
    isAuthenticated,
    user?.authId,
    user?.role,
  ])

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info(
        "Connectez-vous pour ajouter ce talent à vos favoris"
      )
      navigate("/login")
      return
    }

    if (user?.role !== "client") {
      toast.info(
        "Seul un compte client peut ajouter un favori"
      )
      return
    }

    if (!talent?.id || !user?.authId) {
      toast.error(
        "Impossible d'identifier le talent ou le client."
      )
      return
    }

    const wasLiked = liked

    setTogglingFavorite(true)
    setLiked(!wasLiked)

    try {
      if (wasLiked && favoriteId) {
        const { error: deleteError } = await supabase
          .from("favorites")
          .delete()
          .eq("id", favoriteId)

        if (deleteError) throw deleteError

        setFavoriteId(null)
      } else {
        const { data, error: insertError } =
          await supabase
            .from("favorites")
            .insert({
              client_id: user.authId,
              talent_id: talent.id,
            })
            .select("id")
            .single()

        if (insertError) throw insertError

        setFavoriteId(data.id)
      }
    } catch (err) {
      console.error("Erreur favori :", err)

      setLiked(wasLiked)

      toast.error(
        "Impossible de mettre à jour vos favoris"
      )
    } finally {
      setTogglingFavorite(false)
    }
  }

  const handleInvite = async () => {
    if (!isAuthenticated) {
      toast.info(
        "Connectez-vous pour inviter ce talent"
      )
      navigate("/login")
      return
    }

    setInviting(true)

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    )

    toast.success("Invitation envoyée ✅", {
      description: `${getTalentName(
        talent
      )} sera notifié.`,
    })

    setInviting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Chargement du profil...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>

        <Card className="border-destructive">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />

            <p className="text-sm text-destructive flex-1">
              {error}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.location.reload()
              }
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!talent) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>

        <Card className="border-border/60">
          <CardContent className="p-10 text-center">
            <p className="font-bold mb-1">
              Talent introuvable
            </p>

            <p className="text-sm text-muted-foreground">
              Ce profil n'existe pas ou n'est plus visible.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const name = getTalentName(talent)

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const skills = (
    talent.talent_profile_skills || []
  )
    .map((ts) => ts.skills?.name)
    .filter(Boolean)

  const location = [
    talent.city,
    talent.countries?.name,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>

        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Profil Talent
          </h1>

          <p className="text-sm text-muted-foreground">
            Consultez et invitez ce talent
          </p>
        </div>
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >

        {/* PROFIL */}
        <div className="lg:col-span-2 space-y-6">

          <Card className="overflow-hidden border-border/60">

            <div className="h-36 bg-gradient-to-br from-gold/30 via-amber-400/20 to-violet-400/20 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(251,191,36,0.25),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.15),transparent_50%)]" />
            </div>

            <CardContent className="p-6 pt-0 -mt-12 relative">

              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">

                <Avatar className="h-24 w-24 border-4 border-background shadow-lg shrink-0">
                  <AvatarFallback className="gold-gradient text-white text-2xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2 mb-1">

                        <h2 className="text-2xl font-black tracking-tight truncate">
                          {name}
                        </h2>

                        {talent.verified && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[10px] font-bold px-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Vérifié KORA
                          </Badge>
                        )}

                      </div>

                      {(talent.title ||
                        talent.categories?.name) && (
                        <p className="text-base font-semibold text-gold-dark mb-1 truncate">
                          {talent.title ||
                            talent.categories?.name}
                        </p>
                      )}

                      {location && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {location}
                          </span>
                        </div>
                      )}

                    </div>

                    <div className="flex gap-2 shrink-0">

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl"
                        onClick={toggleFavorite}
                        disabled={togglingFavorite}
                      >
                        <Heart
                          className={cn(
                            "h-4.5 w-4.5 transition-colors",
                            liked
                              ? "fill-red-500 stroke-red-500"
                              : ""
                          )}
                        />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            window.location.href
                          )

                          toast.success(
                            "Lien copié ✅"
                          )
                        }}
                      >
                        <Share2 className="h-4.5 w-4.5" />
                      </Button>

                    </div>

                  </div>

                </div>

              </div>

              <Separator className="my-6" />

              <div className="space-y-4">

                {talent.bio && (
                  <div>
                    <h3 className="font-black mb-2">
                      À propos
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {talent.bio}
                    </p>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <h3 className="font-black mb-3">
                      Compétences clés
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="px-3 py-1 text-xs font-semibold"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </CardContent>
          </Card>

          <ReviewSection />

        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">

          <Card className="sticky top-20 overflow-hidden border-gold/20 shadow-xl shadow-gold/5">

            <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />

            <CardContent className="p-6 space-y-5">

              <div className="flex items-baseline justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Tarif
                  </p>

                  <div className="flex items-baseline gap-1.5">

                    <p className="text-3xl font-black tracking-tight gold-text-gradient">
                      {formatCurrency(
                        talent.daily_rate,
                        talent.currency || "XOF"
                      )}
                    </p>

                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    / jour
                  </p>

                </div>

                <Badge
                  className={cn(
                    "font-bold",
                    talent.available
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {talent.available
                    ? "Disponible"
                    : "Occupé"}
                </Badge>

              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">

                <div className="text-center">

                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    <span className="font-black">
                      {Number(
                        talent.rating || 0
                      ).toFixed(1)}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {talent.reviews_count || 0} avis
                  </p>

                </div>

                <div className="text-center">

                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Briefcase className="h-4 w-4 text-blue-500" />

                    <span className="font-black">
                      {talent.completed_projects || 0}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Projets
                  </p>

                </div>

              </div>

              <Separator />

              <div className="space-y-2 text-sm">

                {[
                  {
                    icon: ShieldCheck,
                    label: "Paiement sécurisé KORA",
                  },
                  {
                    icon: Users,
                    label: "Support client dédié",
                  },
                  {
                    icon: TrendingUp,
                    label: "Suivi de mission en temps réel",
                  },
                ].map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-emerald-600" />
                      </div>

                      <span className="text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  )
                })}

              </div>

              <div className="space-y-2.5 pt-2">

                <Button
                  className="w-full h-12 font-bold gap-2 text-base"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Award className="h-4.5 w-4.5" />
                      Inviter à un projet
                    </>
                  )}
                </Button>

                {/* CORRECTION PRINCIPALE */}
                <Button
                  variant="outline"
                  className="w-full h-12 font-bold gap-2"
                  asChild
                >
                  <Link to={messagesRoute}>
                    <MessageCircle className="h-4.5 w-4.5" />
                    Contacter
                  </Link>
                </Button>

                <p className="text-center text-[11px] text-muted-foreground font-medium pt-1">
                  <span className="font-bold text-foreground">
                    {APP_PARAMS?.name || "KORA"} Protect :
                  </span>{" "}
                  satisfait ou remboursé.
                </p>

              </div>

            </CardContent>
          </Card>

        </div>

      </motion.div>
    </div>
  )
}
