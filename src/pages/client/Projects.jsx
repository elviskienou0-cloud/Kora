import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"
import { useProjectsQuery } from "@/hooks/queries/useProjectsQuery"

const PAGE_SIZE = 10

const STATUS_CONFIG = {
  draft: {
    label: "Brouillon",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  },
  open: {
    label: "Ouvert",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  pending: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  active: {
    label: "Actif",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  completed: {
    label: "Terminé",
    className: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-red-500/10 text-red-600 border-red-500/30",
  },
}

function formatMoney(value, currency) {
  if (value === null || value === undefined) return "—"

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency || "XOF"}`
  }
}

function budgetLabel(project) {
  const min = project.budget_min
  const max = project.budget_max

  if (min == null && max == null) {
    return "Budget non défini"
  }

  if (min != null && max != null) {
    return `${formatMoney(min, project.currency)} — ${formatMoney(
      max,
      project.currency
    )}`
  }

  return min != null
    ? `À partir de ${formatMoney(min, project.currency)}`
    : `Jusqu'à ${formatMoney(max, project.currency)}`
}

export default function ClientProjects() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const authUserId = user?.authId || user?.id

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useProjectsQuery({
    userId: authUserId,
    role: "client",
    page,
    pageSize: PAGE_SIZE,
    search: search.trim(),
    enabled: Boolean(authUserId),
  })

  const projects = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = data?.totalPages || 1

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (!authUserId) return

    const channel = supabase
      .channel(`client-projects-${authUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `client_id=eq.${authUserId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["projects"],
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authUserId])

  const handleRefresh = async () => {
    setRefreshing(true)

    try {
      await queryClient.invalidateQueries({
        queryKey: ["projects"],
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleCancel = async (project) => {
    if (
      project.status === "cancelled" ||
      project.status === "completed"
    ) {
      return
    }

    const ok = window.confirm(
      `Annuler le projet « ${project.title} » ?`
    )

    if (!ok) return

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        status: "cancelled",
      })
      .eq("id", project.id)
      .eq("client_id", authUserId)

    if (updateError) {
      console.error("Erreur annulation projet :", updateError)

      toast.error(
        updateError.message || "Impossible d'annuler le projet."
      )

      return
    }

    toast.success("Projet annulé.")

    await queryClient.invalidateQueries({
      queryKey: ["projects"],
    })
  }

  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/30 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              Espace Client
            </p>

            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Mes projets
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount} projet{totalCount > 1 ? "s" : ""} enregistré
              {totalCount > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  refreshing || isFetching ? "animate-spin" : ""
                }`}
              />

              Actualiser
            </Button>

            <Button
              onClick={() => navigate("/client/projects/new")}
              className="gold-gradient text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un projet
            </Button>
          </div>
        </div>

        {/* SEARCH */}
        <Card className="border-gold/20">
          <CardContent className="p-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un projet..."
                className="pl-9 pr-9"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Effacer la recherche"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ERROR */}
        {isError && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 text-sm text-red-600">
              {error?.message || "Impossible de charger vos projets."}
            </CardContent>
          </Card>
        )}

        {/* LOADING */}
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2
              className="h-7 w-7 animate-spin text-gold"
              aria-label="Chargement"
            />
          </div>
        ) : projects.length === 0 ? (
          /* EMPTY */
          <Card className="border-dashed border-gold/30">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold-dark">
                <BriefcaseBusiness className="h-8 w-8" />
              </div>

              <h2 className="text-lg font-black">
                {search
                  ? "Aucun projet trouvé"
                  : "Aucun projet"}
              </h2>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {search
                  ? "Aucun projet ne correspond à votre recherche."
                  : "Créez votre premier projet pour le retrouver ici et commencer à travailler avec les talents KORA."}
              </p>

              {!search && (
                <Button
                  className="mt-5 gold-gradient text-primary-foreground"
                  onClick={() =>
                    navigate("/client/projects/new")
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un projet
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* PROJECTS */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const status =
                  STATUS_CONFIG[project.status] || {
                    label: project.status || "—",
                    className:
                      "bg-muted text-muted-foreground",
                  }

                return (
                  <Card
                    key={project.id}
                    className="border-gold/15 transition-all hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-bold">
                            {project.title}
                          </h2>

                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {project.description}
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
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Budget
                          </span>

                          <span className="text-right font-medium">
                            {budgetLabel(project)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Date limite
                          </span>

                          <span>
                            {project.due_date
                              ? new Date(
                                  `${project.due_date}T00:00:00`
                                ).toLocaleDateString("fr-FR")
                              : "Non définie"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link
                            to={`/client/projects/${project.id}`}
                          >
                            Détail
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>

                        {!["completed", "cancelled"].includes(
                          project.status
                        ) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCancel(project)
                            }
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-5 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrevious || isFetching}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1)
                      )
                    }
                  >
                    Précédent
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext || isFetching}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1)
                      )
                    }
                  >
                    Suivant
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