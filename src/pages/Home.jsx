import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Users,
  Briefcase,
  Star,
  TrendingUp,
  ChevronRight,
  MessageCircle,
  Heart,
  Award,
  MapPin,
  ArrowRight,
  Hand as HandWaving,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { APP_PARAMS } from "@/lib/app-params"
import { cn, formatCurrency, truncate } from "@/lib/utils"
import koraLogo from "@/assets/kora-logo.svg"
import { toast } from "sonner"
import { useKoraStats } from "@/lib/useKoraStats"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }

function initialsOf(firstName, lastName) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "T"
}

function timeAgo(dateString, language) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return language === "en" ? "just now" : "à l'instant"
  if (minutes < 60) return language === "en" ? `${minutes} min ago` : `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return language === "en" ? `${hours}h ago` : `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return language === "en" ? "yesterday" : "hier"
  return language === "en" ? `${days}d ago` : `il y a ${days}j`
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
  const { t, language } = useI18n()
  const [recommended, setRecommended] = useState([])
  const [loadingRecommended, setLoadingRecommended] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const [favoritePending, setFavoritePending] = useState(() => new Set())

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/login", { replace: true })
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    let mounted = true

    async function loadRecommended() {
      setLoadingRecommended(true)
      try {
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

        if (error) throw error
        if (!mounted) return
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

        if (user?.role === "client" && user.authId) {
          const { data: favoriteRows, error: favoriteError } = await supabase
            .from("favorites")
            .select("talent_id")
            .eq("client_id", user.authId)
          if (!mounted) return
          if (favoriteError) {
            console.error("Erreur chargement favoris :", favoriteError.message)
            setFavoriteIds(new Set())
          } else {
            setFavoriteIds(new Set((favoriteRows || []).map((row) => row.talent_id)))
          }
        } else {
          setFavoriteIds(new Set())
        }
      } catch (error) {
        if (!mounted) return
        console.error("Erreur chargement accueil :", error)
        setRecommended([])
        setFavoriteIds(new Set())
      } finally {
        if (mounted) setLoadingRecommended(false)
      }
    }

    if (isAuthenticated) loadRecommended()
    return () => { mounted = false }
  }, [isAuthenticated, user?.authId, user?.role])

  const [unreadMessages, setUnreadMessages] = useState(0)
  const toggleFavorite = async (talentId, event) => {
    event?.stopPropagation()
    if (user?.role !== "client" || !user.authId || favoritePending.has(talentId)) return

    const wasFavorite = favoriteIds.has(talentId)
    setFavoritePending((current) => new Set(current).add(talentId))
    try {
      const result = wasFavorite
        ? await supabase.from("favorites").delete().eq("client_id", user.authId).eq("talent_id", talentId)
        : await supabase.from("favorites").insert({ client_id: user.authId, talent_id: talentId })

      if (result.error) throw result.error
      setFavoriteIds((current) => {
        const next = new Set(current)
        if (wasFavorite) next.delete(talentId)
        else next.add(talentId)
        return next
      })
      toast.success(
        wasFavorite
          ? (language === "en" ? "Removed from favorites." : "Retiré des favoris.")
          : (language === "en" ? "Added to favorites." : "Ajouté aux favoris.")
      )
    } catch (error) {
      toast.error(error?.message || (language === "en" ? "Unable to update favorites." : "Impossible de mettre à jour les favoris."))
    } finally {
      setFavoritePending((current) => {
        const next = new Set(current)
        next.delete(talentId)
        return next
      })
    }
  }


  useEffect(() => {
    let mounted = true

    async function loadUnreadMessages() {
      if (!user?.authId) {
        setUnreadMessages(0)
        return
      }

      try {
        const { data: participantRows, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.authId)
        if (participantsError) throw participantsError

        const conversationIds = (participantRows || []).map((row) => row.conversation_id)
        if (conversationIds.length === 0) {
          if (mounted) setUnreadMessages(0)
          return
        }

        const { count, error: messagesError } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .neq("sender_id", user.authId)
          .is("read_at", null)
        if (messagesError) throw messagesError
        if (mounted) setUnreadMessages(count ?? 0)
      } catch (error) {
        if (!mounted) return
        console.error("Erreur chargement messages non lus :", error)
        setUnreadMessages(0)
      }
    }

    if (isAuthenticated) loadUnreadMessages()
    else setUnreadMessages(0)
    return () => { mounted = false }
  }, [isAuthenticated, user?.authId])

  const { stats: globalStats } = useKoraStats({ enabled: isAuthenticated, emptyOnError: true })
  const statLabelKeys = ["landing.statsTalents", "landing.statsProjects", "landing.statsCountries", "landing.statsSatisfaction"]
  const translatedGlobalStats = globalStats.map((stat, index) => ({
    ...stat,
    label: t(statLabelKeys[index] || "landing.statsTalents"),
  }))

  const stats = translatedGlobalStats.slice(0, 3).map((stat, index) => ({
    ...stat,
    label: index === 0 ? t("landing.statsTalents") : stat.label,
    color: [
      "from-blue-400/20 text-blue-600",
      "from-emerald-400/20 text-emerald-600",
      "from-amber-400/20 text-amber-600",
    ][index],
    icon: [Users, Briefcase, Star][index],
  }))

  const [activity, setActivity] = useState([])

  useEffect(() => {
    let mounted = true

    async function loadActivity() {
      if (!user?.authId) {
        setActivity([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("id, action, entity_type, metadata, created_at")
          .eq("user_id", user.authId)
          .order("created_at", { ascending: false })
          .limit(5)
        if (error) throw error
        if (mounted) setActivity(data || [])
      } catch (error) {
        if (!mounted) return
        console.error("Erreur chargement activité :", error)
        setActivity([])
      }
    }

    if (isAuthenticated) loadActivity()
    else setActivity([])
    return () => { mounted = false }
  }, [isAuthenticated, user?.authId])

  if (isLoading || !user) return null

  const roleLabel = { admin: t("account.admin"), manager: t("account.manager"), client: t("account.client") }[user.role] || t("account.account")

  const firstName = user.name?.split(" ")[0] || user.name

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-gold/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25">
              <img src={koraLogo} alt="KORA" className="h-5 w-5 object-contain" />
            </div>
            <span className="text-xl font-black gold-text-gradient">{APP_PARAMS.name}</span>
          </Link>

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
          <motion.div variants={fadeInUp} custom={0} className={cn("relative rounded-3xl overflow-hidden border", user.role === "client" ? "border-amber-200/80 bg-gradient-to-br from-[#fffaf0] via-white to-[#f7efd9] shadow-sm" : "border-transparent")}>
            <div className={cn("absolute inset-0 gold-gradient opacity-95", user.role === "client" && "hidden")} />
            <div className={cn("absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_60%)]", user.role === "client" && "hidden")} />
            <div className={cn("relative p-5 sm:p-10", user.role === "client" ? "text-[#29251d]" : "text-primary-foreground")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 mb-3">
                    <HandWaving className={cn("h-5 w-5 sm:h-6 sm:w-6", user.role === "client" ? "text-[#a77b1d]" : "animate-pulse")} />
                    <span className={cn("text-[10px] sm:text-sm font-black uppercase tracking-wider", user.role === "client" ? "text-[#96701e]" : "text-current")}>{t("home.welcomeBack", undefined, { name: APP_PARAMS.name })}</span>
                  </div>
                  <h1 className="mb-2 text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                    {t("home.welcomeUser", undefined, { name: firstName })} 👋
                  </h1>
                  <p className={cn("max-w-xl text-sm font-medium leading-relaxed sm:text-base", user.role === "client" ? "text-[#625b4c]" : "opacity-90")}>
                    {user.role === "client"
                      ? t("home.clientIntro")
                      : user.role === "manager"
                      ? t("home.managerIntro")
                      : t("home.adminIntro")}
                  </p>
                </div>
                <div className="flex w-full shrink-0 sm:w-auto">
                  <Button size="lg" className={cn("w-full gap-2 font-black sm:w-auto", user.role === "client" ? "bg-[#e8b72d] text-[#29251d] hover:bg-[#d9a91f]" : "bg-background text-foreground hover:bg-background/90")} onClick={() => navigate("/categories")}>
                    {language === "en" ? "Explore" : "Explorer"} <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:grid-cols-4 sm:gap-3">
                {translatedGlobalStats.slice(0, 4).map((s, index) => {
                  const Icon = [Users, Briefcase, Star, TrendingUp][index] || Star
                  return (
                    <div key={s.label} className={cn("min-w-0 rounded-2xl border p-3 sm:p-4", user.role === "client" ? "border-amber-200/80 bg-white/85 shadow-[0_2px_10px_rgba(92,68,20,0.04)]" : "border-white/25 bg-white/15 backdrop-blur-sm")}>
                      <div className={cn("mb-1.5 flex items-center gap-2", user.role === "client" ? "text-[#8b6a24]" : "opacity-90")}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <p className="min-w-0 text-[9px] font-bold uppercase leading-snug tracking-wide sm:text-xs">{s.label}</p>
                      </div>
                      <p className={cn("text-xl font-black tabular-nums sm:text-2xl", user.role === "client" ? "text-[#29251d]" : "text-current")}>{s.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section initial="hidden" animate="visible" variants={stagger}>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t("dashboard.title")}</h2>
              <p className="text-muted-foreground font-medium">{t("home.realtimeStats")}</p>
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

        <motion.section initial="hidden" animate="visible" variants={stagger} className="space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <Badge variant="gold" className="mb-2 px-3 py-1 text-xs font-bold">{t("home.koraSelection")}</Badge>
              <h2 className="text-2xl font-black tracking-tight">{t("home.recommendedTalents")}</h2>
              <p className="text-muted-foreground font-medium">{t("home.recommendedDescription")}</p>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => navigate("/categories")}>
              {language === "en" ? "View all" : "Voir tout"} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {loadingRecommended ? (
              <p className="col-span-full text-sm text-muted-foreground">{t("home.loadingRecommended")}</p>
            ) : recommended.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">{t("home.noPublishedTalents")}</p>
            ) : (
              recommended.map((talent, i) => {
              return (
                <motion.div key={talent.id} variants={fadeInUp} custom={i} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="h-full cursor-pointer group" role="link" tabIndex={0} aria-label={language === "en" ? `Open ${talent.name} profile` : `Ouvrir le profil de ${talent.name}`} onClick={() => navigate(`/talent/${talent.id}`)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); navigate(`/talent/${talent.id}`) } }}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-gold/30">
                          <AvatarFallback className="text-base">{talent.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-bold truncate">{talent.name}</p>
                            {talent.verified && <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{talent.country}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold">{talent.rating}</span>
                            <span className="text-[10px] text-muted-foreground">({talent.reviews} {t("reviews.reviews")})</span>
                          </div>
                        </div>
                        {user.role === "client" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 shrink-0 rounded-xl", favoriteIds.has(talent.id) && "text-rose-600")}
                            disabled={favoritePending.has(talent.id)}
                            aria-label={favoriteIds.has(talent.id) ? t("browse.favoriteRemove") : t("browse.favoriteAdd")}
                            title={favoriteIds.has(talent.id) ? t("browse.favoriteRemove") : t("browse.favoriteAdd")}
                            onClick={(event) => toggleFavorite(talent.id, event)}
                          >
                            <Heart className={cn("h-4 w-4", favoriteIds.has(talent.id) && "fill-current")} />
                          </Button>
                        ) : null}
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1.5 line-clamp-1">{talent.role}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{talent.bio}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {talent.skills.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                        {talent.skills.length > 3 && <Badge variant="outline" className="text-[10px]">+{talent.skills.length - 3}</Badge>}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground">{t("home.from")}</p>
                          <p className="text-lg font-black gold-text-gradient">{formatCurrency(talent.price)}<span className="text-[10px] font-medium text-muted-foreground ml-1">{language === "en" ? "/day" : "/jour"}</span></p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" /> {talent.completed} {t("home.projectsCompleted")}
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

        <motion.section initial="hidden" animate="visible" variants={stagger}>
          <div className="grid grid-cols-1">
            <motion.div variants={fadeInUp} custom={0}>
              <Card className="h-full overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
                <CardHeader className="pb-3">
                  <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                  <CardDescription>{t("home.latestActions")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</p>
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
                            <p className="text-[11px] text-muted-foreground">{timeAgo(a.created_at, language)}</p>
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