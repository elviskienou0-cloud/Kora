import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Users,
  UserCheck,
  UserCog,
  WalletCards,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

const nf = new Intl.NumberFormat("fr-FR")
const formatNumber = (value) => nf.format(Number(value || 0))
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—"

const MODULES = [
  { permission: "users.read", label: "Utilisateurs", view: "users", icon: Users },
  { permission: "managers.read", label: "Managers", view: "managers", icon: UserCog },
  { permission: "clients.read", label: "Clients", view: "clients", icon: UserCheck },
  { permission: "talents.read", label: "Talents", view: "talents", icon: ShieldCheck },
  { permission: "requests.read", label: "Demandes", view: "requests", icon: ClipboardList },
  { permission: "projects.read", label: "Projets", view: "projects", icon: BriefcaseBusiness },
  { permission: "messages.read", label: "Messages", view: "messages", icon: MessageCircle },
  { permission: "payments.read", label: "Paiements", view: "payments", icon: WalletCards },
  { permission: "subscriptions.read", label: "Abonnements", view: "subscriptions", icon: CreditCard },
  { permission: "announcements.write", label: "Annonces", view: "announcements", icon: Bell },
  { permission: "moderation.read", label: "Modération", view: "moderation", icon: ShieldCheck },
  { permission: "logs.read", label: "Journaux d'activité", view: "logs", icon: Activity },
  { permission: "settings.read", label: "Paramètres autorisés", view: "settings", icon: FileText },
]

const METRICS = [
  { key: "users", label: "Utilisateurs", icon: Users, permission: ["users.read"] },
  { key: "managers", label: "Managers", icon: UserCog, permission: ["managers.read", "users.read"] },
  { key: "clients", label: "Clients", icon: UserCheck, permission: ["clients.read", "users.read"] },
  { key: "talents", label: "Talents", icon: ShieldCheck, permission: ["talents.read"] },
  { key: "requests", label: "Demandes", icon: ClipboardList, permission: ["requests.read"] },
  { key: "projects", label: "Projets", icon: BriefcaseBusiness, permission: ["projects.read"] },
]

function hasPermission(permissions, keys) {
  return Boolean(permissions?.["*"] || keys.some((key) => permissions?.[key]))
}

async function countRows(table, column, value, extraFilter) {
  let query = supabase.from(table).select("id", { count: "exact", head: true })
  if (column && value !== undefined) query = query.eq(column, value)
  if (extraFilter) query = extraFilter(query)
  const { count, error } = await query
  return { value: error ? null : count ?? 0, error }
}

export default function AdminAssociateDashboard() {
  const navigate = useNavigate()
  const [access, setAccess] = useState(null)
  const [stats, setStats] = useState({})
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [metricWarning, setMetricWarning] = useState(false)

  const loadDashboard = useCallback(async () => {
    setRefreshing(true)
    setError("")

    try {
      const { data: accessData, error: accessError } = await supabase.rpc("get_my_admin_access")
      if (accessError) throw accessError
      if (!accessData || accessData.is_active === false) {
        throw new Error("Votre accès administrateur est inactif ou expiré. Contactez le Super Admin.")
      }

      const permissions = accessData.permissions || {}
      const can = (key) => Boolean(permissions["*"] || permissions[key])
      const tasks = {}

      if (can("users.read")) tasks.users = countRows("profiles")
      if (can("managers.read") || can("users.read")) {
        tasks.managers = countRows("profiles", "role", "manager")
      }
      if (can("clients.read") || can("users.read")) {
        tasks.clients = countRows("profiles", "role", "client")
      }
      if (can("talents.read")) tasks.talents = countRows("talent_profiles")
      if (can("requests.read")) tasks.requests = countRows("requests")
      if (can("projects.read")) tasks.projects = countRows("projects")
      if (can("messages.read")) {
        const { data: authData } = await supabase.auth.getUser()
        const currentUserId = authData?.user?.id
        tasks.unreadMessages = countRows("messages", undefined, undefined, (query) => {
          let unreadQuery = query.is("read_at", null)
          if (currentUserId) unreadQuery = unreadQuery.neq("sender_id", currentUserId)
          return unreadQuery
        })
      }
      if (can("payments.read")) tasks.payments = countRows("payments")
      if (can("subscriptions.read")) tasks.subscriptions = countRows("subscriptions")
      if (can("moderation.read")) tasks.reports = countRows("reports", "status", "pending")

      const keys = Object.keys(tasks)
      const results = await Promise.all(keys.map((key) => tasks[key]))
      const nextStats = {}
      let hasMetricError = false
      results.forEach((result, index) => {
        nextStats[keys[index]] = result.value
        if (result.error) hasMetricError = true
      })

      let recentActivity = []
      if (can("logs.read")) {
        const { data, error: logsError } = await supabase
          .from("admin_audit_logs")
          .select("id, action, entity_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5)
        if (logsError) hasMetricError = true
        else recentActivity = data || []
      }

      setAccess(accessData)
      setStats(nextStats)
      setActivity(recentActivity)
      setMetricWarning(hasMetricError)
    } catch (loadError) {
      setError(loadError?.message || "Impossible de charger votre espace administrateur.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const permissions = access?.permissions || {}
  const allowedModules = useMemo(
    () => MODULES.filter((module) => hasPermission(permissions, [module.permission])),
    [permissions]
  )
  const availableMetrics = useMemo(
    () => METRICS.filter((metric) => hasPermission(permissions, metric.permission)),
    [permissions]
  )

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement de votre espace administrateur…
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
          <Button className="w-fit gap-2" variant="outline" onClick={loadDashboard} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  const level = access?.access_level === "super_admin" ? "Super Admin" : "Admin associé"
  const limitCards = [
    { label: "Limite utilisateurs", value: access?.max_users ?? "Non définie" },
    { label: "Validations de paiement", value: access?.max_payment_validations ?? "Non définie" },
    {
      label: "Expiration de l'accès",
      value: access?.access_expires_at ? formatDate(access.access_expires_at) : "Aucune",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-dark">Administration KORA</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Tableau de bord</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Espace {level} — les données et modules sont limités aux permissions accordées.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Accès contrôlé
          </Badge>
          <Button variant="outline" className="gap-2" onClick={loadDashboard} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {metricWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Certaines métriques n'ont pas pu être chargées. Les valeurs indisponibles restent masquées plutôt que d'afficher des chiffres inventés.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {METRICS.map(({ key, label, icon: Icon, permission }) => {
          const allowed = hasPermission(permissions, permission)
          const value = stats[key]
          return (
            <Card key={key} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">
                      {!allowed ? "—" : value === null || value === undefined ? "…" : formatNumber(value)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {!allowed ? "Permission non attribuée" : value === null || value === undefined ? "Donnée indisponible" : "Données Supabase"}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Actions rapides autorisées
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Seuls les modules correspondant à vos permissions sont accessibles depuis ce tableau de bord.
            </p>
          </CardHeader>
          <CardContent>
            {allowedModules.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {allowedModules.map(({ permission, label, view, icon: Icon }) => (
                  <button
                    key={permission}
                    type="button"
                    onClick={() => navigate(`/admin?view=${view}`)}
                    className="group flex min-h-14 items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-gold/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-gold/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{label}</span>
                      <span className="block text-xs text-muted-foreground">Accès autorisé</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Aucune fonctionnalité ne vous a été attribuée. Contactez le Super Admin.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5" />
              Limites et accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {limitCards.map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="max-w-[55%] text-right text-sm font-semibold">{typeof item.value === "number" ? formatNumber(item.value) : item.value}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Ces paramètres sont définis par le CEO et ne peuvent pas être modifiés depuis votre compte.
            </p>
          </CardContent>
        </Card>
      </section>

      {hasPermission(permissions, ["logs.read"]) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Activité administrative récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length ? (
              <div className="divide-y divide-border">
                {activity.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.entity_type || "Action administrative"}</p>
                    </div>
                    <time className="text-xs text-muted-foreground">{formatDate(item.created_at)}</time>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">Aucune activité récente accessible ou aucun journal disponible.</p>
            )}
          </CardContent>
        </Card>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Bell className="h-4 w-4 shrink-0" />
        Les permissions sont appliquées côté Supabase et ne peuvent pas être modifiées depuis cet espace.
      </p>
    </div>
  )
}
