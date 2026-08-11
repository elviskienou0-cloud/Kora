// @ts-nocheck
import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Sparkles, ArrowLeft, Star, MapPin, Briefcase, Award, Clock,
  Heart, MessageCircle, Share2, CheckCircle2, ChevronRight,
  Users, TrendingUp, ShieldCheck, DollarSign, Languages
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { APP_PARAMS } from "@/lib/app-params"
import { cn } from "@/lib/utils"
import ReviewSection from "@/components/ReviewSection"

const MOCK_TALENTS = {
  "1": {
    id: "1",
    name: "Amadou Diallo",
    role: "Développeur Full-Stack Senior",
    location: "Dakar, Sénégal",
    rate: 45000,
    currency: "XOF",
    rating: 4.9,
    reviews: 127,
    jobs: 54,
    earned: "12.5M+",
    hourly: true,
    avatar: null,
    tags: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    bio: "Développeur passionné avec 8+ ans d'expérience dans la création de produits digitaux scalables. Spécialisé dans les architectures modernes et l'expérience utilisateur.",
    experience: [
      { year: "2021 - Aujourd'hui", title: "Tech Lead", company: "Startup Tech Africa" },
      { year: "2018 - 2021", title: "Senior Dev", company: "Freelance sur KORA" },
      { year: "2016 - 2018", title: "Développeur", company: "Agence Digitale Dakar" },
    ],
    portfolio: [
      { title: "Marketplace Agricole", desc: "Plateforme de mise en relation agriculteurs/acheteurs" },
      { title: "App de Livraison", desc: "Application mobile de livraison urbaine" },
    ],
    languages: [
      { name: "Français", level: "Langue maternelle" },
      { name: "Anglais", level: "Professionnel" },
      { name: "Wolof", level: "Langue maternelle" },
    ],
    verified: true,
    responseTime: "< 1h",
  },
}

export default function TalentDetail() {
  const { id = "1" } = useParams()
  const navigate = useNavigate()
  const talent = MOCK_TALENTS[id] || MOCK_TALENTS["1"]
  const [liked, setLiked] = useState(false)
  const [inviting, setInviting] = useState(false)

  const handleInvite = async () => {
    setInviting(true)
    await new Promise((r) => setTimeout(r, 700))
    toast.success("Invitation envoyée ✅", { description: `${talent.name} sera notifié.` })
    setInviting(false)
  }

  const initials = talent.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Profil Talent</h1>
          <p className="text-sm text-muted-foreground">Consultez et invitez ce talent</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-border/60">
            <div className="h-36 bg-gradient-to-br from-gold/30 via-amber-400/20 to-violet-400/20 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(251,191,36,0.25),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.15),transparent_50%)]" />
            </div>
            <CardContent className="p-6 pt-0 -mt-12 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg shrink-0">
                  <AvatarFallback className="gold-gradient text-white text-2xl font-black">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-2xl font-black tracking-tight truncate">{talent.name}</h2>
                        {talent.verified && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[10px] font-bold px-2">
                            <CheckCircle2 className="h-3 w-3" /> Vérifié KORA
                          </Badge>
                        )}
                      </div>
                      <p className="text-base font-semibold text-gold-dark mb-1 truncate">{talent.role}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {talent.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Réponse en {talent.responseTime}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setLiked(!liked)}>
                        <Heart className={cn("h-4.5 w-4.5 transition-colors", liked ? "fill-red-500 stroke-red-500" : "")} />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-xl" onClick={() => toast.success("Lien copié ✅")}>
                        <Share2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div>
                  <h3 className="font-black mb-2">À propos</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{talent.bio}</p>
                </div>

                <div>
                  <h3 className="font-black mb-3">Compétences clés</h3>
                  <div className="flex flex-wrap gap-2">
                    {talent.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="px-3 py-1 text-xs font-semibold">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-black flex items-center gap-2"><Briefcase className="h-5 w-5 text-gold" /> Expérience</h3>
              <div className="space-y-4">
                {talent.experience.map((e, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center pt-1.5">
                      <div className="w-3 h-3 rounded-full gold-gradient shadow-md shadow-gold/30" />
                      {i < talent.experience.length - 1 && <div className="w-0.5 flex-1 bg-border/60 my-1" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-[11px] font-bold text-gold-dark uppercase tracking-wider mb-0.5">{e.year}</p>
                      <p className="font-bold">{e.title}</p>
                      <p className="text-sm text-muted-foreground">{e.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black flex items-center gap-2"><Languages className="h-5 w-5 text-gold" /> Langues</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {talent.languages.map((l) => (
                  <div key={l.name} className="rounded-xl border border-border/60 bg-card p-4">
                    <p className="font-bold">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.level}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ReviewSection />
        </div>

        <div className="space-y-6">
          <Card className="sticky top-20 overflow-hidden border-gold/20 shadow-xl shadow-gold/5">
            <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
            <CardContent className="p-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Tarif</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-3xl font-black tracking-tight gold-text-gradient">{talent.rate.toLocaleString("fr-FR")}</p>
                    <span className="text-sm font-bold text-muted-foreground">{talent.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{talent.hourly ? "/ heure" : "/ projet"}</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">Disponible</Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-gold fill-gold" />
                    <span className="font-black">{talent.rating}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{talent.reviews} avis</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    <span className="font-black">{talent.jobs}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Projets</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="font-black">{talent.earned}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Gagné</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {[
                  { icon: ShieldCheck, label: "Paiement sécurisé KORA", ok: true },
                  { icon: Users, label: "Satisfaction client 98%", ok: true },
                  { icon: TrendingUp, label: "Top 5% des talents", ok: true },
                ].map((r) => {
                  const Icon = r.icon
                  return (
                    <div key={r.label} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-muted-foreground">{r.label}</span>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2.5 pt-2">
                <Button className="w-full h-12 font-bold gap-2 text-base" onClick={handleInvite} disabled={inviting}>
                  {inviting ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />Envoi...</>
                  ) : (
                    <><Award className="h-4.5 w-4.5" /> Inviter à un projet</>
                  )}
                </Button>
                <Button variant="outline" className="w-full h-12 font-bold gap-2" asChild>
                  <Link to={APP_PARAMS.routes.messages}>
                    <MessageCircle className="h-4.5 w-4.5" /> Contacter
                  </Link>
                </Button>
                <p className="text-center text-[11px] text-muted-foreground font-medium pt-1">
                  <span className="font-bold text-foreground">{APP_PARAMS.name} Protect :</span> satisfait ou remboursé.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black">Projets récents</h3>
              <div className="space-y-3">
                {talent.portfolio.map((p) => (
                  <div key={p.title} className="group rounded-xl border border-border/60 bg-card p-4 hover:border-gold/40 hover:bg-gold/5 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="font-bold group-hover:gold-text-gradient transition-colors">{p.title}</p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
