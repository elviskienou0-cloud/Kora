import {
  useEffect,
  useState,
} from "react"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"

import { useRequestsQuery } from "@/hooks/queries/useRequestsQuery"

const PAGE_SIZE = 10

const STATUS = {
  pending: {
    label: "En attente",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },
  open: {
    label: "En attente",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },
  accepted: {
    label: "Acceptée",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },
  rejected: {
    label: "Refusée",
    className:
      "border-red-500/30 bg-red-500/10 text-red-700",
  },
}

export default function ManagerRequests() {
  const { t } = useI18n()
  const { user } = useAuth()
  const managerId = user?.authId || user?.id

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")
  const [enrichedRequests, setEnrichedRequests] = useState([])

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useRequestsQuery({
    userId: managerId,
    role: "manager",
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter === "all" ? null : statusFilter,
    enabled: Boolean(managerId),
  })

  const requests = data?.data || []
  const totalCount = Number(data?.count) || 0
  const totalPages = data?.totalPages || 1

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    let active = true

    async function enrichRequests() {
      if (!requests.length) {
        setEnrichedRequests([])
        return
      }

      const projectIds = [
        ...new Set(
          requests.map((r) => r.project_id).filter(Boolean)
        ),
      ]

      const talentIds = [
        ...new Set(
          requests.map((r) => r.talent_id).filter(Boolean)
        ),
      ]

      const clientIds = [
        ...new Set(
          requests.map((r) => r.client_id).filter(Boolean)
        ),
      ]

      const [
        projectsResult,
        talentsResult,
        clientsResult,
      ] = await Promise.all([
        projectIds.length
          ? supabase
              .from("projects")
              .select("id,title,due_date,status")
              .in("id", projectIds)
          : Promise.resolve({ data: [], error: null }),

        talentIds.length
          ? supabase
              .from("talent_profiles")
              .select("id,first_name,last_name,title")
              .in("id", talentIds)
          : Promise.resolve({ data: [], error: null }),

        clientIds.length
          ? supabase
              .from("profiles")
              .select("id,name,role,avatar")
              .in("id", clientIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      if (!active) return

      const projectMap = Object.fromEntries(
        (projectsResult.data || []).map((item) => [
          item.id,
          item,
        ])
      )

      const talentMap = Object.fromEntries(
        (talentsResult.data || []).map((item) => [
          item.id,
          item,
        ])
      )

      const clientMap = Object.fromEntries(
        (clientsResult.data || []).map((item) => [
          item.id,
          item,
        ])
      )

      setEnrichedRequests(
        requests.map((request) => ({
          ...request,
          project:
            projectMap[request.project_id] || null,
          talent:
            talentMap[request.talent_id] || null,
          client:
            clientMap[request.client_id] || null,
        }))
      )
    }

    enrichRequests()

    return () => {
      active = false
    }
  }, [requests])

  useEffect(() => {
    if (!managerId) return

    const channel = supabase
      .channel(`manager-requests-${managerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `manager_id=eq.${managerId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["requests"],
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [managerId])

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["requests"],
    })
  }

  const changeStatusFilter = (value) => {
    setStatusFilter(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              Espace Manager
            </p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Demandes reçues
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} demande{totalCount > 1 ? "s" : ""}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={refresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Actualiser
          </Button>
        </div>

        <Card className="border-gold/20">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="text-sm font-semibold">
              Filtrer :
            </span>

            {[
              ["all", "Toutes"],
              ["pending", "En attente"],
              ["accepted", "Acceptées"],
              ["rejected", "Refusées"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeStatusFilter(value)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  statusFilter === value
                    ? "border-gold bg-gold/10 text-gold-dark"
                    : "border-border hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 text-sm text-red-600">
              {error.message ||
                "Impossible de charger les demandes."}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : enrichedRequests.length === 0 ? (
          <Card className="border-dashed border-gold/30">
            <CardContent className="flex min-h-[35vh] flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-10 w-10 text-muted-foreground" />
              <h2 className="font-bold">{t("requests.noRequests")}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Les nouvelles invitations envoyées par les clients apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enrichedRequests.map((request) => {
                const status =
                  STATUS[
                    String(request.status || "").toLowerCase()
                  ] || {
                    label: request.status || "—",
                    className: "bg-muted text-muted-foreground",
                  }

                const talentName =
                  [
                    request.talent?.first_name,
                    request.talent?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Talent"

                const clientName =
                  request.client?.name || "Client"

                return (
                  <Card
                    key={request.id}
                    className="border-gold/15 transition-all hover:border-gold/35 hover:shadow-lg hover:shadow-gold/10"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="line-clamp-2 font-bold">
                            {request.title || "Invitation"}
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {request.created_at
                              ? new Date(
                                  request.created_at
                                ).toLocaleDateString("fr-FR")
                              : "—"}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={status.className}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      <div className="mt-5 space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            Client :
                          </span>{" "}
                          <strong>{clientName}</strong>
                        </p>

                        <p>
                          <span className="text-muted-foreground">
                            Talent :
                          </span>{" "}
                          <strong>{talentName}</strong>
                        </p>

                        <p>
                          <span className="text-muted-foreground">
                            Projet :
                          </span>{" "}
                          <strong>
                            {request.project?.title || "—"}
                          </strong>
                        </p>

                        {request.budget != null && (
                          <p>
                            <span className="text-muted-foreground">
                              Budget :
                            </span>{" "}
                            <strong>
                              {Number(
                                request.budget
                              ).toLocaleString("fr-FR")}{" "}
                              {request.currency || "XOF"}
                            </strong>
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link
                            to={`/manager/requests/${request.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir la demande
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Page{" "}
                  <strong className="text-foreground">
                    {page}
                  </strong>{" "}
                  sur{" "}
                  <strong className="text-foreground">
                    {totalPages}
                  </strong>
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Précédent
                  </Button>

                  <Button
                    variant="outline"
                    disabled={
                      page >= totalPages || isFetching
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                      )
                    }
                  >
                    Suivant
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
