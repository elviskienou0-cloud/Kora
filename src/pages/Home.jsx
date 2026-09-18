import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Sparkles,
  Users,
  Briefcase,
  Star,
  TrendingUp,
  Search,
  ChevronRight,
  MessageCircle,
  Heart,
  Clock,
  Award,
  MapPin,
  ArrowRight,
  Hand as HandWaving,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { APP_PARAMS } from "@/lib/app-params"
import { getCategoryIcon } from "@/lib/categoryIcons"
import { cn, formatCurrency, truncate } from "@/lib/utils"

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

function initialsOf(firstName, lastName) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "T"
}

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "hier"
  return `il y a ${days}j`
}

function activityIcon(action = "") {
  const a = action.toLowerCase()
  if (a.includes("message")) return { Icon: MessageCircle, bg: "bg-blue-500/15", color: "text-blue-600" }
  if (a.includes("payment") || a.includes("paiement")) return { Icon: TrendingUp, bg: "bg-emerald-500/15", color: "text-emerald-600" }
  if (a.includes("talent")) return { Icon: Users, bg: "bg-violet-500/15", color: "text-violet-600" }
  if (a.includes("review") || a.includes("avis")) return { Icon: Star, bg: "bg-amber-500/15", color: "text-amber-600" }
  return { Icon: CheckCircle2Icon, bg: "bg-emerald-500/15", color: "text-emerald-600" }
}

export default function Home() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [recommended, setRecommended] = useState([])
  const [loadingRecommended, setLoadingRecommended] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login", { replace: true })
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    async function loadRecommended() {
      setLoadingRecommended(true)
      const { data, error } = await supabase
        .from("talent_profiles")
        .select(`
          id, first_name, last_name, title, bio, daily_rate,
          rating, reviews_count, completed_projects, verified,
          categories ( slug, name ),
          countries ( name ),
          talent_profile_skills ( skills ( name ) )
        `)
        .eq("status", "published")
        .eq("is_visible", true)
        .order("rating", { ascending: false })
        .limit(4)

      if (error) {
        console.error("Erreur chargement talents recommandés :", error.message)
        setRecommended([])
      } else {
        setRecommended(
          (data || []).map((t) => ({
            id: t.id,
            name: `${t.first_name} ${t.last_name}`.trim(),
            role: t.title || "",
            country: t.countries?.name || "",
            avatar: initialsOf(t.first_name, t.last_name),
            price: t.daily_rate,
            rating: Number(t.rating || 0),
            reviews: t.reviews_count || 0,
            completed: t.completed_projects || 0,
            verified: !!t.verified,
            skills: (t.talent_profile_skills || []).map((row) => row.skills?.name).filter(Boolean),
            bio: t.bio || "",
            category: t.categories?.slug || "",
          }))
        )
      }
      setLoadingRecommended(false)
    }

    if (isAuthenticated) loadRecommended()
  }, [isAuthenticated])

  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    async function loadUnreadMessages() {
      if (!user?.authId) return

      const { data: participantRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.authId)

      const conversationIds = (participantRows || []).map((r) => r.conversation_id)
      if (conversationIds.length === 0) {
        setUnreadMessages(0)
        return
      }

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.authId)
        .is("read_at", null)

      setUnreadMessages(count ?? 0)
    }

    if (isAuthenticated) loadUnreadMessages()
  }, [isAuthenticated, user?.authId])

  const [stats, setStats] = useState([
    { label: "Talents disponibles", value: "—", icon: Users, color: "from-blue-400/20 text-blue-600" },
    { label: "Projets", value: "—", icon: Briefcase, color: "from-emerald-400/20 text-emerald-600" },
    { label: "Satisfaction moyenne", value: "—", icon: Star, color: "from-amber-400/20 text-amber-600" },
  ])

  useEffect(() => {
    async function loadStats() {
      const [{ count: talentsCount }, { count: projectsCount }, { data: ratedTalents }] = await Promise.all([
        supabase.from("talent_profiles").select("id", { count: "exact", head: true }).eq("status", "published").eq("is_visible", true),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("talent_profiles").select("rating").gt("reviews_count", 0),
      ])

      const avgRating = ratedTalents?.length
        ? (ratedTalents.reduce((sum, t) => sum + Number(t.rating || 0), 0) / ratedTalents.length).toFixed(1)
        : "—"

      setStats([
        { label: "Talents disponibles", value: String(talentsCount ?? 0), icon: Users, color: "from-blue-400/20 text-blue-600" },
        { label: "Projets", value: String(projectsCount ?? 0), icon: Briefcase, color: "from-emerald-400/20 text-emerald-600" },
        { label: "Satisfaction moyenne", value: avgRating === "—" ? "—" : `${avgRating}/5`, icon: Star, color: "from-amber-400/20 text-amber-600" },
      ])
    }

    if (isAuthenticated) loadStats()
  }, [isAuthenticated])

  const [activity, setActivity] = useState([])

  useEffect(() => {
    async function loadActivity() {
      if (!user?.authId) return

      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type, metadata, created_at")
        .eq("user_id", user.authId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Erreur chargement activité :", error.message)
        setActivity([])
        return
      }

      setActivity(data || [])
    }

    if (isAuthenticated) loadActivity()
  }, [isAuthenticated, user?.authId])

  if (isLoading || !user) return null

  const roleLabel = { admin: "Administrateur", manager: "Manager", client: "Client" }[user.role] || "Utilisateur"

  const firstName = user.name?.split(" ")[0] || user.name

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-gold/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25">
              <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black gold-text-gradient">{APP_PARAMS.name}</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un talent, un service..." className="pl-10 w-[380px] h-10" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/messages")} className="relative">
              <MessageCircle className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold text-[9px] font-black text-primary-foreground flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{user.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "??"}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-none">{truncate(user.name, 16)}</p>
                <p className="text-[10px] font-semibold text-gold-dark leading-none">{roleLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <motion.section initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeInUp} custom={0} className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gold-gradient opacity-95" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_60%)]" />
            <div className="relative p-8 sm:p-10 text-primary-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 mb-3">
                    <HandWaving className="h-6 w-6 animate-pulse" />
                    <span className="font-black text-sm uppercase tracking-wider">Bon retour sur {APP_PARAMS.name} !</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black mb-2">
                    Bienvenue, <span className="underline decoration-white/40 decoration-4 underline-offset-4">{firstName}</span> 👋
                  </h1>
                  <p className="text-base font-medium opacity-90 max-w-xl">
                    {user.role === "client"
                      ? "Trouvez les meilleurs talents africains pour faire grandir votre projet. Laissez-vous guider !"
                      : user.role === "manager"
                      ? "Tableau de bord manager : gérez vos talents, suivez vos projets et optimisez vos collaborations."
                      : "Tableau de bord administrateur : consultez les statistiques globales de la plateforme."}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Button size="lg" className="bg-background text-foreground hover:bg-background/90 gap-2 font-black" onClick={() => navigate("/categories")}>
                    Explorer <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                {[
            
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 p-4">
                      <div className="flex items-center gap-2 mb-1.5 opacity-90">
                        <Icon className="h-4 w-4" />
                        <p className="text-xs font-bold uppercase tracking-wide">{s.label}</p>
                      </div>
                      <p className="text-2xl font-black">{s.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Votre tableau de bord</h2>
              <p className="text-muted-foreground font-medium">Statistiques clés en temps réel</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.label} variants={fadeInUp} custom={i}>
                  <Card className="h-full group hover:shadow-xl hover:shadow-gold/5 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br", s.color)}>
                          <Icon className="h-6 w-6" strokeWidth={2} />
                        </div>
                      </div>
                      <p className="text-3xl font-black mb-1">{s.value}</p>
                      <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <Badge variant="gold" className="mb-2 px-3 py-1 text-xs font-bold">Sélection KORA</Badge>
              <h2 className="text-2xl font-black tracking-tight">Talents recommandés pour vous</h2>
              <p className="text-muted-foreground font-medium">Sélectionnés selon votre activité et vos préférences</p>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => navigate("/categories")}>
              Voir tout <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {loadingRecommended ? (
              <p className="col-span-full text-sm text-muted-foreground">Chargement des talents recommandés...</p>
            ) : recommended.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">Aucun talent publié pour le moment.</p>
            ) : (
              recommended.map((t, i) => {
              const CatIcon = getCategoryIcon(t.category)
              return (
                <motion.div key={t.id} variants={fadeInUp} custom={i} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="h-full cursor-pointer group" onClick={() => navigate(`/talent/${t.id}`)}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-gold/30">
                          <AvatarFallback className="text-base">{t.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-bold truncate">{t.name}</p>
                            {t.verified && <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{t.country}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold">{t.rating}</span>
                            <span className="text-[10px] text-muted-foreground">({t.reviews} avis)</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1.5 line-clamp-1">{t.role}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{t.bio}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {t.skills.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                        {t.skills.length > 3 && <Badge variant="outline" className="text-[10px]">+{t.skills.length - 3}</Badge>}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground">À partir de</p>
                          <p className="text-lg font-black gold-text-gradient">{formatCurrency(t.price)}<span className="text-[10px] font-medium text-muted-foreground ml-1">/jour</span></p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" /> {t.completed} projets
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
              })
            )}
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div variants={fadeInUp} custom={0} className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Catégories populaires</CardTitle>
                      <CardDescription>Explorez les domaines les plus actifs</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/categories")}>Tout voir <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {APP_PARAMS.categories.slice(0, 8).map((c, i) => {
                      const Icon = getCategoryIcon(c.icon)
                      return (
                        <Link
                          key={c.id}
                          to="/categories"
                          className="rounded-2xl border border-border/60 hover:border-gold/30 hover:bg-gold/5 p-4 text-center transition-all duration-200 group"
                        >
                          <div className="w-11 h-11 mx-auto rounded-xl gold-gradient flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                            <Icon className="h-5.5 w-5.5 text-primary-foreground" strokeWidth={2} />
                          </div>
                          <p className="font-bold text-xs line-clamp-2 min-h-[2rem]">{c.name}</p>
                          <p className="text-[10px] font-bold gold-text-gradient mt-0.5">{c.count.toLocaleString("fr-FR")} talents</p>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeInUp} custom={1}>
              <Card className="h-full overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
                <CardHeader className="pb-3">
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>Les dernières actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
                  ) : (
                    activity.map((a) => {
                      const { Icon, bg, color } = activityIcon(a.action)
                      return (
                        <div key={a.id} className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bg)}>
                            <Icon className={cn("h-4 w-4", color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {a.action}{a.entity_type ? ` · ${a.entity_type}` : ""}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}

function CheckCircle2Icon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
  )
}