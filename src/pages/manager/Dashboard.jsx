import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
Users,
ClipboardList,
Search,
Bell,
ArrowRight,
UserPlus,
RefreshCw,
} from "lucide-react"

import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"

import { Button } from "@/components/ui/button"
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import WeeklyChart from "@/components/WeeklyChart"

function getTalentName(talent) {
if (!talent) return "Talent sans nom"

if (talent.name) return talent.name

const fullName = `${talent.first_name || ""} ${
    talent.last_name || ""
  }`.trim()

return fullName || "Talent sans nom"
}

function getInitials(talent) {
const name = getTalentName(talent)

const parts = name
.split(" ")
.map((part) => part.trim())
.filter(Boolean)

if (parts.length === 0) return "T"

if (parts.length === 1) {
return parts[0].slice(0, 2).toUpperCase()
}

return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function getNotificationText(notification) {
if (!notification) return "Nouvelle notification"

return (
notification.message ||
notification.title ||
"Nouvelle notification"
)
}

function isActiveRequest(status) {
const value = String(status || "").toLowerCase()

return [
"pending",
"en_attente",
"accepted",
"acceptee",
"in_progress",
"en_cours",
].includes(value)
}

export default function ManagerDashboard() {
const navigate = useNavigate()
const { user, isLoading: authLoading } = useAuth()
const { t } = useI18n()

const [talents, setTalents] = useState([])
const [requests, setRequests] = useState([])
const [notifications, setNotifications] = useState([])
const [revenue, setRevenue] = useState(0)

const [search, setSearch] = useState("")
const [loading, setLoading] = useState(true)
const [error, setError] = useState("")

useEffect(() => {
if (authLoading) return

if (!user?.authId) {
  setLoading(false)
  return
}

if (user.role !== "manager") {
  setLoading(false)
  navigate("/home", { replace: true })
  return
}

let cancelled = false

async function loadDashboard() {
  setLoading(true)
  setError("")

  try {
    const [
      talentsResult,
      requestsResult,
      notificationsResult,
      transactionsResult,
    ] = await Promise.all([
      supabase
        .from("talent_profiles")
        .select("*")
        .eq("managed_by", user.authId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("requests")
        .select("*")
        .eq("manager_id", user.authId)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.authId)
        .order("created_at", {
          ascending: false,
        })
        .limit(5),

      supabase
        .from("kora_transactions")
        .select("manager_amount, amount, status")
        .eq("manager_id", user.authId),
    ])

    if (talentsResult.error) {
      throw talentsResult.error
    }

    if (requestsResult.error) {
      throw requestsResult.error
    }

    if (notificationsResult.error) {
      throw notificationsResult.error
    }

    if (transactionsResult.error) {
      throw transactionsResult.error
    }

    if (cancelled) return

    setTalents(talentsResult.data || [])
    setRequests(requestsResult.data || [])
    setNotifications(notificationsResult.data || [])

    const paidStatuses = new Set(["paid", "completed", "confirmed", "success", "succeeded"])
    const totalRevenue = (transactionsResult.data || [])
      .filter((transaction) => paidStatuses.has(String(transaction.status || "").toLowerCase()))
      .reduce((sum, transaction) => sum + Number(transaction.manager_amount ?? transaction.amount ?? 0), 0)

    setRevenue(totalRevenue)
  } catch (err) {
    console.error(
      "Erreur chargement dashboard manager :",
      err
    )

    if (!cancelled) {
      setError(
        err?.message ||
          "Impossible de charger les données du tableau de bord."
      )
    }
  } finally {
    if (!cancelled) {
      setLoading(false)
    }
  }
}

loadDashboard()

return () => {
  cancelled = true
}

}, [authLoading, user, navigate])

const filteredTalents = useMemo(() => {
const query = search.trim().toLowerCase()

if (!query) return talents

return talents.filter((talent) => {
  const name = getTalentName(talent).toLowerCase()

  const category = String(
    talent.category_name ||
      talent.category ||
      ""
  ).toLowerCase()

  return (
    name.includes(query) ||
    category.includes(query)
  )
})

}, [talents, search])

const activeRequests = useMemo(() => {
return requests.filter((request) =>
isActiveRequest(request.status)
).length
}, [requests])

const weeklyRequests = useMemo(() => {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(now.getDate() - (6 - index))
    return date
  })

  return days.map((date) => {
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)

    const value = requests.filter((request) => {
      if (!request.created_at) return false
      const createdAt = new Date(request.created_at)
      return createdAt >= date && createdAt < nextDay
    }).length

    return {
      name: date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
      value,
    }
  })
}, [requests])

if (authLoading || loading) {
return ( <div className="flex min-h-[60vh] items-center justify-center"> <div className="flex items-center gap-3 text-muted-foreground"> <RefreshCw className="h-5 w-5 animate-spin" /> <span>{t("manager.loading")}</span> </div> </div>
)
}

if (!user || user.role !== "manager") {
return null
}

return ( <div className="min-h-full space-y-8 bg-background p-4 md:p-6"> <div> <h1 className="text-3xl font-bold tracking-tight">
{t("manager.dashboard")}</h1>

    <p className="mt-2 text-muted-foreground">
      {t("manager.manageTalents")}
    </p>
  </div>

  {error && (
    <Card className="border-destructive">
      <CardContent className="p-6">
        <p className="text-sm text-destructive">
          {error}
        </p>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </CardContent>
    </Card>
  )}

  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("manager.myTalents")}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {talents.length}
          </p>
        </div>

        <div className="rounded-xl bg-accent p-3">
          <Users className="h-6 w-6 text-foreground" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("manager.activeRequests")}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {activeRequests}
          </p>
        </div>

        <div className="rounded-xl bg-accent p-3">
          <ClipboardList className="h-6 w-6 text-foreground" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("manager.revenue")}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "XOF",
              maximumFractionDigits: 0,
            }).format(revenue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {t("manager.settledTransactions")}
          </p>
        </div>

        <div className="rounded-xl bg-accent p-3">
          <ClipboardList className="h-6 w-6 text-foreground" />
        </div>
      </CardContent>
    </Card>
  </div>

  <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2">
      <WeeklyChart
        data={weeklyRequests}
        title={t("manager.requestActivity")}
        subtitle={t("manager.requestsLast7Days")}
      />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{t("manager.quickManagement")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("manager.quickManagementDescription")}
        </p>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={() => navigate("/manager/talents")}
        >
          {t("manager.editMyTalents")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  </div>

  <div className="grid gap-6 lg:grid-cols-3">
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("manager.myTalents")}</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {t("manager.talentsManaged")}
            </p>
          </div>

          <Button
            onClick={() => navigate("/manager/talents")}
          >
            {t("manager.manageMyTalents")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={t("manager.searchTalent")}
            className="pl-9"
          />
        </div>

        {filteredTalents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
            <UserPlus className="mb-4 h-10 w-10 text-muted-foreground" />

            <h3 className="font-semibold">
              {search
                ? t("manager.noTalentFound")
                : t("manager.noTalent")}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {search
                ? `${t("manager.noTalentMatch")}`
                : t("manager.addTalentHint")}
            </p>

            {!search && (
              <Button
                className="mt-5"
                onClick={() =>
                  navigate("/manager/talents")
                }
              >
                Ajouter un talent
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredTalents.slice(0, 6).map((talent) => (
              <Card
                key={talent.id}
                className="overflow-hidden border-border/80 shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {talent.avatar_url ||
                    talent.photo_url ? (
                      <img
                        src={
                          talent.avatar_url ||
                          talent.photo_url
                        }
                        alt={getTalentName(talent)}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted font-semibold">
                        {getInitials(talent)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">
                        {getTalentName(talent)}
                      </h3>

                      <p className="truncate text-sm text-muted-foreground">
                        {talent.category_name ||
                          talent.category ||
                          "Talent"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() =>
                      navigate("/manager/talents")
                    }
                  >
                    {t("manager.manageTalentLabel")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("navigation.notifications")}</CardTitle>

          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

            <p className="text-sm text-muted-foreground">
              {t("manager.noNotifications")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl border border-border/80 bg-card p-3"
              >
                <p className="text-sm">
                  {getNotificationText(
                    notification
                  )}
                </p>

                {notification.created_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(
                      notification.created_at
                    ).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>

  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{t("manager.recentRequests")}</CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("manager.recentRequestsDescription")}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            navigate("/manager/requests")
          }
        >
          {t("manager.viewRequests")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </CardHeader>

    <CardContent>
      {requests.length === 0 ? (
        <div className="py-8 text-center">
          <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

          <p className="text-sm text-muted-foreground">
            {t("manager.noRequests")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.slice(0, 5).map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  Demande #{String(request.id).slice(0, 8)}
                </p>

                <p className="text-sm text-muted-foreground">
                  {request.status || t("manager.undefinedStatus")}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate("/manager/requests")
                }
              >
                {t("manager.open")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</div>

)
}
