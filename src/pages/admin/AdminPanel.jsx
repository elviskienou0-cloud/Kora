// @ts-nocheck
import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  FolderKanban,
  Loader2,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  UserCheck,
  UserCog,
  WalletCards,
  BriefcaseBusiness,
  Clock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { APP_PARAMS } from "@/lib/app-params"
import { supabase } from "@/lib/supabase"

import AdminUsers from "@/pages/admin/Users.jsx"
import AdminTalents from "@/pages/admin/Talents.jsx"
import AdminManagers from "@/pages/admin/Managers.jsx"
import AdminClients from "@/pages/admin/Clients.jsx"
import AdminProjects from "@/pages/admin/Projects.jsx"
import AdminRequests from "@/pages/admin/Requests.jsx"
import AdminMessages from "@/pages/admin/Messages.jsx"
import AdminReports from "@/pages/admin/Reports.jsx"
import AdminSubscriptions from "@/pages/admin/Subscriptions.jsx"
import AdminPayments from "@/pages/admin/Payments.jsx"
import AdminLogs from "@/pages/admin/Logs.jsx"

const VIEW_LABELS = {
  dashboard: "Tableau de bord",
  users: "Utilisateurs",
  managers: "Managers",
  clients: "Clients",
  talents: "Talents",
  projects: "Projets",
  requests: "Demandes",
  messages: "Messages",
  moderation: "Modération",
  payments: "Paiements",
  subscriptions: "Abonnements",
  logs: "Logs",
  settings: "Paramètres administration",
}

function formatNumber(value) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("fr-FR").format(Number(value || 0))
}

function StatCard({ label, value, icon: Icon, helper, onClick }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="h-full border-border/60 hover:border-gold/40 hover:shadow-sm transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gold/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-gold-dark" />
            </div>
            <Badge variant="outline" className="text-[10px]">
              Supabase
            </Badge>
          </div>
          <p className="text-2xl font-black mt-4">{formatNumber(value)}</p>
          <p className="font-bold mt-1">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{helper}</p>
        </CardContent>
      </Card>
    </button>
  )
}

export default function AdminPanel() {
  const location = useLocation()
  const navigate = useNavigate()

  const [view, setView] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const [stats, setStats] = useState({
    users: null,
    clients: null,
    managers: null,
    admins: null,
    talents: null,
    projects: null,
    requests: null,
    messages: null,
    conversations: null,
    subscriptions: null,
    payments: null,
    reports: null,
    reviews: null,
  })

  const getViewFromUrl = useCallback(() => {
    const params = new URLSearchParams(location.search)
    const requested = params.get("view")
    return VIEW_LABELS[requested] ? requested : "dashboard"
  }, [location.search])

  useEffect(() => {
    setView(getViewFromUrl())
  }, [getViewFromUrl])

  const goTo = useCallback(
    (nextView) => {
      const query = nextView === "dashboard" ? "" : `?view=${nextView}`
      navigate(`/admin${query}`)
    },
    [navigate]
  )

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const [
        users,
        clients,
        managers,
        admins,
        talents,
        projects,
        requests,
        messages,
        conversations,
        subscriptions,
        payments,
        reports,
        reviews,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "manager"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("talent_profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ])

      const essential = [
        users,
        clients,
        managers,
        admins,
        talents,
        projects,
        requests,
        messages,
        conversations,
        subscriptions,
        payments,
        reviews,
      ]

      const firstError = essential.find((item) => item.error)?.error
      if (firstError) throw firstError

      setStats({
        users: users.count ?? 0,
        clients: clients.count ?? 0,
        managers: managers.count ?? 0,
        admins: admins.count ?? 0,
        talents: talents.count ?? 0,
        projects: projects.count ?? 0,
        requests: requests.count ?? 0,
        messages: messages.count ?? 0,
        conversations: conversations.count ?? 0,
        subscriptions: subscriptions.count ?? 0,
        payments: payments.count ?? 0,
        reports: reports.error ? null : (reports.count ?? 0),
        reviews: reviews.count ?? 0,
      })
    } catch (err) {
      console.error("Erreur statistiques admin :", err)
      setError(
        err?.message ||
          "Impossible de charger les statistiques administrateur."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const channel = supabase
      .channel("kora-admin-panel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "talent_profiles" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, loadStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, loadStats)

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadStats])

  const refresh = async () => {
    setRefreshing(true)
    try {
      await loadStats()
    } finally {
      setRefreshing(false)
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Utilisateurs"
          value={stats.users}
          icon={Users}
          helper="Tous les comptes"
          onClick={() => goTo("users")}
        />
        <StatCard
          label="Clients"
          value={stats.clients}
          icon={UserCheck}
          helper="Comptes client"
          onClick={() => goTo("clients")}
        />
        <StatCard
          label="Managers"
          value={stats.managers}
          icon={UserCog}
          helper="Comptes manager"
          onClick={() => goTo("managers")}
        />
        <StatCard
          label="Talents"
          value={stats.talents}
          icon={Sparkles}
          helper="Profils talents"
          onClick={() => goTo("talents")}
        />
        <StatCard
          label="Projets"
          value={stats.projects}
          icon={FolderKanban}
          helper="Projets enregistrés"
          onClick={() => goTo("projects")}
        />
        <StatCard
          label="Demandes"
          value={stats.requests}
          icon={BriefcaseBusiness}
          helper="Invitations"
          onClick={() => goTo("requests")}
        />
        <StatCard
          label="Messages"
          value={stats.messages}
          icon={MessageSquare}
          helper="Messages enregistrés"
          onClick={() => goTo("messages")}
        />
        <StatCard
          label="Abonnements"
          value={stats.subscriptions}
          icon={CreditCard}
          helper="Souscriptions"
          onClick={() => goTo("subscriptions")}
        />
        <StatCard
          label="Paiements"
          value={stats.payments}
          icon={WalletCards}
          helper="Transactions"
          onClick={() => goTo("payments")}
        />
        <StatCard
          label="Signalements"
          value={stats.reports}
          icon={AlertTriangle}
          helper={
            stats.reports === null
              ? "Table reports indisponible"
              : "Signalements"
          }
          onClick={() => goTo("moderation")}
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-black">Centre de contrôle KORA</p>
              <p className="text-sm text-muted-foreground mt-1">
                Toutes les données affichées proviennent des tables Supabase disponibles.
              </p>
            </div>

            <Badge variant="outline" className="w-fit gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administration
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCurrentView = () => {
    switch (view) {
      case "users":
        return <AdminUsers />
      case "managers":
        return <AdminManagers />
      case "clients":
        return <AdminClients />
      case "talents":
        return <AdminTalents />
      case "projects":
        return <AdminProjects />
      case "requests":
        return <AdminRequests />
      case "messages":
        return <AdminMessages />
      case "moderation":
        return <AdminReports />
      case "subscriptions":
        return <AdminSubscriptions />
      case "payments":
        return <AdminPayments />
      case "logs":
        return <AdminLogs />
      case "settings":
        return (
          <Card className="border-border/60">
            <CardContent className="py-16 text-center">
              <Settings className="h-10 w-10 mx-auto text-gold-dark mb-4" />
              <h2 className="text-xl font-black">
                Paramètres administration
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Aucun paramètre global fictif n'est affiché.
              </p>
            </CardContent>
          </Card>
        )
      case "dashboard":
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {VIEW_LABELS[view] || VIEW_LABELS.dashboard}
          </h1>
          <p className="text-sm text-muted-foreground">
            {APP_PARAMS?.name || "KORA"} — administration réelle connectée à Supabase
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualiser
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {loading && view === "dashboard" ? (
        <Card className="border-border/60">
          <CardContent className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement des données administrateur…
          </CardContent>
        </Card>
      ) : (
        renderCurrentView()
      )}

      {view === "dashboard" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ["users", "Utilisateurs", Users],
            ["managers", "Managers", UserCog],
            ["clients", "Clients", UserCheck],
            ["talents", "Talents", Sparkles],
            ["projects", "Projets", FolderKanban],
            ["requests", "Demandes", BriefcaseBusiness],
            ["messages", "Messages", MessageSquare],
            ["moderation", "Modération", ShieldCheck],
            ["subscriptions", "Abonnements", CreditCard],
            ["payments", "Paiements", WalletCards],
            ["logs", "Logs", Clock],
            ["settings", "Paramètres", Settings],
          ].map(([key, label, Icon]) => (
            <Button
              key={key}
              variant="outline"
              className="justify-start gap-2"
              onClick={() => goTo(key)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Les statistiques affichées sont des comptages Supabase. Aucun chiffre fictif n'est généré par cette page.
      </p>
    </div>
  )
}
