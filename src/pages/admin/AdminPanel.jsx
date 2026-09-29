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
import AdminDashboardView from "@/components/admin/AdminDashboardView.jsx"

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
import AdminSettings from "@/pages/admin/Settings.jsx"
import AdminAssociateDashboard from "@/pages/admin/AdminAssociateDashboard.jsx"

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

export default function AdminPanel() {
  const location = useLocation()
  const navigate = useNavigate()

  const [view, setView] = useState("dashboard")
  const { user } = useAuth()
  const authUserId = user?.authId || user?.id

  const [refreshing, setRefreshing] = useState(false)
  const [adminAccessLevel, setAdminAccessLevel] = useState("super_admin")

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

    let mounted = true
    supabase.rpc("get_my_admin_access").then(({ data, error }) => {
      if (!mounted) return
      // Before the hierarchy migration exists, preserve the current CEO/admin behavior.
      if (!error && data?.access_level) setAdminAccessLevel(data.access_level)
    })

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
          queryClient.invalidateQueries({ queryKey: ["admin-overview"] })
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
        }
      )
    }

    channel.subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [authUserId])

  const refresh = async () => {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey?.[0] || "").startsWith("admin"),
      })
    } finally {
      setRefreshing(false)
    }
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
        return <AdminSettings />
      case "dashboard":
      default:
        return <AdminDashboardView onNavigate={goTo} />
    }
  }

  if (adminAccessLevel === "associate") {
    return <AdminAssociateDashboard />
  }

  if (view === "dashboard") {
    return <AdminDashboardView onNavigate={goTo} />
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

      {!authUserId && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Session administrateur en cours de chargement…
          </CardContent>
        </Card>
      )}

      {renderCurrentView()}

    </div>
  )
}
