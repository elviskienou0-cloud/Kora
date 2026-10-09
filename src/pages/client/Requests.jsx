import { useEffect, useState } from "react"
import { Eye, Loader2, RefreshCw } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"
import { useRequestsQuery } from "@/hooks/queries/useRequestsQuery"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const PAGE_SIZE = 10

const STATUS = {
  pending: {
    labelKey: "requests.pending",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },

  open: {
    label: "En attente",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700",
  },

  accepted: {
    labelKey: "requests.accepted",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  },

  rejected: {
    labelKey: "requests.rejected",
    className:
      "border-red-500/30 bg-red-500/10 text-red-700",
  },
}

export default function ClientRequests() {
  const { user } = useAuth()
  const { t, language } = useI18n()
  const clientId = user?.authId || user?.id

  const [page, setPage] = useState(1)

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useRequestsQuery({
    userId: clientId,
    role: "client",
    page,
    pageSize: PAGE_SIZE,
    enabled: Boolean(clientId),
  })

  const requests = data?.data || []
  const totalPages = data?.totalPages || 1
  const totalCount = data?.count || 0

  const [enrichedRequests, setEnrichedRequests] = useState([])

  useEffect(() => {
    let active = true

    async function enrich() {
      if (!requests.length) {
        setEnrichedRequests([])
        return
      }

      const projectIds = [
        ...new Set(
          requests
            .map((row) => row.project_id)
            .filter(Boolean)
        ),
      ]

      const talentIds = [
        ...new Set(
          requests
            .map((row) => row.talent_id)
            .filter(Boolean)
        ),
      ]

      const [
        projectsResult,
        talentsResult,
      ] = await Promise.all([
        projectIds.length
          ? supabase
              .from("projects")
              .select("id,title,due_date")
              .in("id", projectIds)
          : Promise.resolve({ data: [] }),

        talentIds.length
          ? supabase
              .from("talent_profiles")
              .select(
                "id,first_name,last_name,title"
              )
              .in("id", talentIds)
          : Promise.resolve({ data: [] }),
      ])

      if (!active) return

      const projectMap = Object.fromEntries(
        (projectsResult.data || []).map((project) => [
          project.id,
          project,
        ])
      )

      const talentMap = Object.fromEntries(
        (talentsResult.data || []).map((talent) => [
          talent.id,
          talent,
        ])
      )

      setEnrichedRequests(
        requests.map((request) => ({
          ...request,
          project:
            projectMap[request.project_id] || null,
          talent:
            talentMap[request.talent_id] || null,
        }))
      )
    }

    enrich()

    return () => {
      active = false
    }
  }, [requests])

  useEffect(() => {
    if (!clientId) return

    const channel = supabase
      .channel(`client-requests-${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `client_id=eq.${clientId}`,
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
  }, [clientId])

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["requests"],
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {t("notifications.clientArea")}
            </p>

            <h1 className="text-2xl font-black md:text-3xl">
              {t("requests.title")}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount === 1 ? t("requests.countOne", undefined, { count: totalCount }) : t("requests.countMany", undefined, { count: totalCount })}
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

            {t("common.refresh")}
          </Button>
        </div>

        {isError && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 text-sm text-red-600">
              {t("errors.loading")}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-gold" />
          </div>
        ) : enrichedRequests.length === 0 ? (
          <Card className="border-dashed border-gold/30">
            <CardContent className="py-20 text-center text-sm text-muted-foreground">
              {t("requests.noRequests")}
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
                    labelKey: null,
                    className:
                      "bg-muted text-muted-foreground",
                  }

                const talentName = [
                  request.talent?.first_name,
                  request.talent?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") || t("talents.talent")

                return (
                  <Card
                    key={request.id}
                    className="border-gold/15"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="line-clamp-2 font-bold">
                            {request.title ||
                              t("requests.invitation")}
                          </h2>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {request.created_at
                              ? new Date(
                                  request.created_at
                                ).toLocaleDateString(
                                  language === "en" ? "en-GB" : "fr-FR"
                                )
                              : "—"}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={status.className}
                        >
                          {status.labelKey ? t(status.labelKey) : t("common.unknown")}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">
                            {t("requests.project")}:
                          </span>{" "}
                          <strong>
                            {request.project?.title ||
                              "—"}
                          </strong>
                        </p>

                        <p>
                          <span className="text-muted-foreground">
                            {t("requests.talent")}:
                          </span>{" "}
                          <strong>{talentName}</strong>
                        </p>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link
                            to={`/talent/${request.talent_id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("talents.viewProfile")}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-5">
                <span className="text-sm text-muted-foreground">
                  {t("requests.pageOf", undefined, { page, total: totalPages })}
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || isFetching}
                    onClick={() =>
                      setPage((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                  >
                    {t("common.previous")}
                  </Button>

                  <Button
                    variant="outline"
                    disabled={
                      page >= totalPages ||
                      isFetching
                    }
                    onClick={() =>
                      setPage((value) =>
                        Math.min(
                          totalPages,
                          value + 1
                        )
                      )
                    }
                  >
                    {t("common.next")}
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