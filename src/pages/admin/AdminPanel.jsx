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
  ContactRound,
  Users,
  UserCheck,
  UserCog,
  WalletCards,
  BriefcaseBusiness,
  Clock,
  Megaphone,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { APP_PARAMS } from "@/lib/app-params"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { queryClient } from "@/lib/queryClient"
import { useAdminStatsQuery } from "@/hooks/queries/useAdminStatsQuery"

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
import AdminAnnouncements from "@/pages/admin/Announcements.jsx"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

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
  announcements: "Annonces",
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
  const { user } = useAuth()
  const authUserId = user?.authId || user?.id

  const [refreshing, setRefreshing] = useState(false)

  const {
    data: stats = {},
    isLoading: loading,
    error: statsQueryError,
    refetch: refetchStats,
  } = useAdminStatsQuery({
    userId: authUserId,
    role: "admin",
    enabled: Boolean(authUserId),
  })

  const error = statsQueryError?.message || ""

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

  useEffect(() => {
    if (!authUserId) return

    const tables = [
      "profiles",
      "talent_profiles",
      "projects",
      "requests",
      "messages",
      "conversations",
      "reports",
      "subscriptions",
      "payments",
    ]

    const channel = supabase.channel("kora-admin-panel-live")

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authUserId])

  const refresh = async () => {
    setRefreshing(true)
    try {
      await refetchStats()
    } finally {
      setRefreshing(false)
    }
  }

  const renderDashboard = () => {
    const userDistribution = [
      { name: "Clients", value: Number(stats.clients || 0) },
      { name: "Managers", value: Number(stats.managers || 0) },
      { name: "Admins", value: Number(stats.admins || 0) },
    ]

    const projectStatus = [
      { name: "Ouverts", value: Number(stats.openProjects || 0) },
      { name: "Actifs", value: Number(stats.activeProjects || 0) },
      { name: "Terminés", value: Number(stats.completedProjects || 0) },
    ]

    const requestStatus = [
      { name: "En attente", value: Number(stats.pendingRequests || 0) },
      { name: "Acceptées", value: Number(stats.acceptedRequests || 0) },
      { name: "Refusées", value: Number(stats.rejectedRequests || 0) },
    ]

    const paymentStatus = [
      { name: "En attente", value: Number(stats.pendingPayments || 0) },
      { name: "Payés", value: Number(stats.paidPayments || 0) },
      { name: "Échoués", value: Number(stats.failedPayments || 0) },
    ]

    const hasValues = (data) => data.some((item) => item.value > 0)

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border/60">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5">
                <p className="font-black">Répartition des utilisateurs</p>
                <p className="text-sm text-muted-foreground mt-1">Clients, managers et administrateurs actuellement enregistrés.</p>
              </div>
              <div className="h-[280px]">
                {hasValues(userDistribution) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={userDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92} innerRadius={55} paddingAngle={3}>
                        {userDistribution.map((entry, index) => <Cell key={entry.name} fill={["hsl(var(--gold))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"][index]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée utilisateur à afficher.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5">
                <p className="font-black">État des projets</p>
                <p className="text-sm text-muted-foreground mt-1">Répartition des projets selon leur statut.</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectStatus} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Projets" fill="hsl(var(--gold))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5">
                <p className="font-black">État des demandes</p>
                <p className="text-sm text-muted-foreground mt-1">Demandes reçues et leur état actuel.</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestStatus} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Demandes" fill="hsl(var(--gold))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5">
                <p className="font-black">État des paiements</p>
                <p className="text-sm text-muted-foreground mt-1">Répartition des transactions selon leur statut.</p>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentStatus} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Paiements" fill="hsl(var(--gold))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-black">Centre de contrôle KORA</p>
                <p className="text-sm text-muted-foreground mt-1">Toutes les données des graphiques proviennent des compteurs Supabase disponibles.</p>
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
  }

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
      case "announcements":
        return <AdminAnnouncements />
      case "settings":
        return (
          <Card className="border-border/60">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="font-black">Paramètres administration</p>
                <p className="mt-1 text-sm text-muted-foreground">Les réglages de sécurité et de configuration administrateur sont gérés depuis Supabase et l’environnement de déploiement.</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Session administrateur active. Aucun réglage manager n’est affiché dans cet espace.
              </div>
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

        <div className="flex items-center gap-2">
          <Button
            variant={view === "announcements" ? "default" : "outline"}
            className="gap-2"
            onClick={() => goTo("announcements")}
          >
            <Megaphone className="h-4 w-4" />
            Annonces
          </Button>

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
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {!authUserId && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Session administrateur en cours de chargement…
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
            ["talents", "Talents", ContactRound],
            ["projects", "Projets", FolderKanban],
            ["requests", "Demandes", BriefcaseBusiness],
            ["messages", "Messages", MessageSquare],
            ["moderation", "Modération", ShieldCheck],
            ["subscriptions", "Abonnements", CreditCard],
            ["payments", "Paiements", WalletCards],
            ["logs", "Logs", Clock],
            ["announcements", "Annonces", Megaphone],
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
