import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import {
  TrendingUp,
  Clock,
  Heart,
  Send,
  Star,
  ChevronRight,
  Search,
  LayoutDashboard,
  Users,
  Briefcase,
  AlertCircle,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
}

const STATUS_CONFIG = {
  pending: {
    labelKey: "requests.pending",
    className: "border-gold text-gold-dark bg-gold/10",
  },
  en_attente: {
    label: "En attente",
    className: "border-gold text-gold-dark bg-gold/10",
  },
  accepted: {
    labelKey: "requests.accepted",
    className: "bg-emerald-500 text-white",
  },
  acceptee: {
    label: "Acceptée",
    className: "bg-emerald-500 text-white",
  },
  rejected: {
    labelKey: "requests.rejected",
    className: "bg-red-500 text-white",
  },
  refusee: {
    label: "Refusée",
    className: "bg-red-500 text-white",
  },
  completed: {
    labelKey: "projects.completed",
    className: "bg-slate-600 text-white",
  },
  terminee: {
    label: "Terminée",
    className: "bg-slate-600 text-white",
  },
}

function formatCurrency(value, language = "fr") {
  const amount = Number(value || 0)

  return new Intl.NumberFormat(language === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value, language = "fr") {
  if (!value) return language === "en" ? "Unknown date" : "Date inconnue"

  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function getInitials(name) {
  if (!name) return "??"

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function getTalentName(talent) {
  if (!talent) return "Talent"

  return (
    talent.name ||
    talent.full_name ||
    [talent.first_name, talent.last_name].filter(Boolean).join(" ") ||
    "Talent"
  )
}

function getTalentCategory(talent) {
  if (!talent) return "Talent"

  if (typeof talent.category === "string") {
    return talent.category
  }

  if (talent.category?.name) {
    return talent.category.name
  }

  return talent.title || talent.profession || "Talent"
}

function getTalentCountry(talent) {
  if (!talent) return ""

  if (typeof talent.country === "string") {
    return talent.country
  }

  if (talent.country?.name) {
    return talent.country.name
  }

  return ""
}

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { t, language } = useI18n()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    requests: 0,
    accepted: 0,
    favorites: 0,
    searches: 0,
    spent: 0,
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [recommendedTalents, setRecommendedTalents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setError("")

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError

        if (!user) {
          navigate("/login", { replace: true })
          return
        }

        const [
          profileResult,
          requestsResult,
          acceptedResult,
          favoritesResult,
          searchesResult,
          recentResult,
          talentsResult,
          transactionsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, name, role")
            .eq("id", user.id)
            .single(),

          supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("client_id", user.id),

          supabase
            .from("requests")
            .select("id", { count: "exact", head: true })
            .eq("client_id", user.id)
            .in("status", ["accepted", "acceptee", "completed", "terminee"]),

          supabase
            .from("favorites")
            .select("id", { count: "exact", head: true })
            .eq("client_id", user.id),

          supabase
            .from("activity_logs")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("action", "search_talents"),

          supabase
            .from("requests")
            .select("*")
            .eq("client_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),

          supabase
            .from("talent_profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(3),

          supabase
            .from("kora_transactions")
            .select("amount, status")
            .eq("client_id", user.id),
        ])

        if (profileResult.error) throw profileResult.error
        if (requestsResult.error) throw requestsResult.error
        if (acceptedResult.error) throw acceptedResult.error
        if (favoritesResult.error) throw favoritesResult.error
        if (searchesResult.error) throw searchesResult.error
        if (recentResult.error) throw recentResult.error
        if (talentsResult.error) throw talentsResult.error
        if (transactionsResult.error) throw transactionsResult.error

        if (!mounted) return

        setProfile(profileResult.data)

        const paidStatuses = new Set(["paid", "completed", "confirmed", "success", "succeeded"])
        const totalSpent = (transactionsResult.data || [])
          .filter((transaction) => paidStatuses.has(String(transaction.status || "").toLowerCase()))
          .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)

        setStats({
          requests: requestsResult.count || 0,
          accepted: acceptedResult.count || 0,
          favorites: favoritesResult.count || 0,
          searches: searchesResult.count || 0,
          spent: totalSpent,
        })

        setRecentRequests(recentResult.data || [])
        setRecommendedTalents(talentsResult.data || [])
      } catch (err) {
        console.error("Erreur dashboard client:", err)

        if (!mounted) return

        setError(
          err?.message ||
            t("errors.loading")
        )
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [navigate, t])

  const firstName = useMemo(() => {
    if (!profile) return "vous"

    if (profile.name) {
      return profile.name.split(" ")[0]
    }

    return "vous"
  }, [profile])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-10 w-10 text-gold animate-spin"
            aria-label={t("common.loading")}
          />
          <p className="text-sm text-muted-foreground">
            {t("common.loading")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-6"
      >
        {error && (
          <motion.div variants={itemVariants}>
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground shadow-sm">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Bonjour,{" "}
                <span className="text-gold-dark">{firstName}</span>
              </h1>

              <p className="text-sm text-muted-foreground">
                {t("dashboard.greeting")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gold/50 text-gold-dark hover:bg-gold/10"
              onClick={() => navigate("/categories")}
            >
              <Search className="mr-2 h-4 w-4" />
              {t("dashboard.searchAction")}
            </Button>

            <Button
              className="w-full sm:w-auto bg-foreground text-background shadow-sm hover:bg-foreground/90"
              onClick={() => navigate("/categories")}
            >
              <Send className="mr-2 h-4 w-4" />
              {t("dashboard.newRequest")}
            </Button>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title={t("dashboard.clientRequestsSent")}
            value={stats.requests}
            icon={Send}
            iconClass="bg-gold/15 text-gold-dark"
          />

          <StatCard
            title={t("dashboard.clientRequestsAccepted")}
            value={stats.accepted}
            icon={Briefcase}
            iconClass="bg-emerald-500/15 text-emerald-600"
          />

          <StatCard
            title={t("dashboard.clientFavorites")}
            value={stats.favorites}
            icon={Heart}
            iconClass="bg-rose-500/15 text-rose-500"
          />

          <StatCard
            title={t("dashboard.clientBudgetSpent")}
            value={formatCurrency(stats.spent, language)}
            icon={TrendingUp}
            iconClass="bg-amber-500/15 text-amber-600"
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="grid gap-6 lg:grid-cols-3"
        >
          <Card className="lg:col-span-2 border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="h-5 w-5 text-gold-dark" />
                  {t("dashboard.recentRequests")}
                </CardTitle>

                <CardDescription>
                  {t("dashboard.recentRequestsDescription")}
                </CardDescription>
              </div>

              <Button
                variant="ghost"
                className="text-gold-dark hover:bg-gold/10"
                onClick={() => navigate("/client/requests")}
              >
                {t("dashboard.viewAll")}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="pt-0">
              {recentRequests.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title={t("dashboard.noClientRequests")}
                  description={t("dashboard.noRequestDescription")}
                  actionLabel={t("dashboard.exploreTalents")}
                  onAction={() => navigate("/categories")}
                />
              ) : (
                <div className="divide-y divide-border">
                  {recentRequests.map((request) => {
                    const status =
                      STATUS_CONFIG[request.status] || {
                        labelKey: null,
                        className: "bg-muted text-muted-foreground",
                      }

                    const talent = request.talent_profiles || request.talent
                    const talentName = getTalentName(talent)

                    return (
                      <button
                        key={request.id}
                        type="button"
                        onClick={() =>
                          navigate("/client/requests")
                        }
                        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 py-4 text-left hover:bg-accent/30 transition-colors rounded-lg px-2"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="bg-gold/10 text-gold-dark">
                              {getInitials(talentName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {talentName}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {request.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6">
                          {request.budget != null && (
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(request.budget)}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {formatDate(request.created_at, language)}
                              </p>
                            </div>
                          )}

                          <Badge
                            className={cn(
                              "shrink-0",
                              status.className
                            )}
                          >
                            {status.labelKey ? t(status.labelKey) : t("common.unknown")}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gold/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-gold-dark" />
                {t("dashboard.recentTalents")}
              </CardTitle>

              <CardDescription>
                {t("dashboard.currentTalentsDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              {recommendedTalents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={t("dashboard.noAvailableTalents")}
                  description={t("dashboard.noPublicProfiles")}
                />
              ) : (
                <>
                  {recommendedTalents.map((talent) => {
                    const name = getTalentName(talent)
                    const category = getTalentCategory(talent)
                    const country = getTalentCountry(talent)

                    return (
                      <button
                        key={talent.id}
                        type="button"
                        onClick={() =>
                          navigate(`/talent/${talent.id}`)
                        }
                        className="group w-full flex items-center gap-3 rounded-xl p-2 text-left hover:bg-accent/50 transition-all"
                      >
                        <Avatar className="h-11 w-11 ring-1 ring-border">
                          <AvatarFallback className="bg-gold/20 text-gold-dark font-semibold">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">
                            {name}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {category}
                            {country ? ` · ${country}` : ""}
                          </p>

                          {talent.rating != null && (
                            <div className="mt-0.5 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-gold text-gold" />
                              <span className="text-xs font-medium">
                                {talent.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold-dark" />
                      </button>
                    )
                  })}

                  <Separator />

                  <Button
                    variant="ghost"
                    className="w-full text-gold-dark hover:bg-gold/10"
                    onClick={() => navigate("/categories")}
                  >
                    {t("dashboard.seeAllTalents")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-gold/20 shadow-sm">
            <CardHeader>
              <CardTitle>{t("dashboard.yourActivity")}</CardTitle>
              <CardDescription>
                {t("dashboard.activityDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <ActivityItem
                  icon={Search}
                  label={t("dashboard.searches")}
                  value={stats.searches}
                  description={t("dashboard.searchHistoryDescription")}
                />

                <ActivityItem
                  icon={Heart}
                  label={t("favorites.title")}
                  value={stats.favorites}
                  description={t("dashboard.savedTalents")}
                />

                <ActivityItem
                  icon={Send}
                  label={t("requests.title")}
                  value={stats.requests}
                  description={t("dashboard.requestsSentDescription")}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, iconClass }) {
  return (
    <Card className="border-gold/20 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>

            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              {value}
            </h3>
          </div>

          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              iconClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-border/60 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}