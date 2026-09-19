import { useCallback, useEffect, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 20

function formatDate(value) {
  if (!value) return "—"

  const d = new Date(value)

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
}

export default function AdminManagers() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / PAGE_SIZE)
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from("profiles")
        .select(
          "id, name, role, avatar, is_suspended, suspended_at, suspended_reason, created_at, updated_at",
          { count: "exact" }
        )
        .eq("role", "manager")
        .order("created_at", {
          ascending: false,
        })
        .range(from, to)

      const value = search.trim()

      if (value) {
        query = query.ilike(
          "name",
          `%${value}%`
        )
      }

      const {
        data,
        error: queryError,
        count,
      } = await query

      if (queryError) {
        throw queryError
      }

      setItems(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error(
        "Erreur chargement managers admin :",
        err
      )

      setItems([])
      setTotalCount(0)

      setError(
        err?.message ||
          "Impossible de charger les managers."
      )
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [search])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const refresh = async () => {
    setRefreshing(true)

    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Managers
          </h1>

          <p className="text-sm text-muted-foreground">
            Gestion paginée des comptes manager enregistrés
            dans Supabase.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
          className="gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Actualiser
        </Button>
      </div>

      {/* CARD */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="font-black">
              Managers
            </CardTitle>

            <CardDescription>
              {totalCount.toLocaleString("fr-FR")} manager
              {totalCount > 1 ? "s" : ""} au total.
            </CardDescription>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un manager..."
              className="pl-10"
            />
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">
              {error}
            </div>
          </CardContent>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Manager
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Inscription
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Mise à jour
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold">
                          {item.name || "Manager"}
                        </p>

                        <p className="text-xs text-muted-foreground break-all">
                          {item.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {item.is_suspended ? (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className="border-red-500/30 bg-red-500/10 text-red-700"
                            >
                              Suspendu
                            </Badge>

                            {item.suspended_reason ? (
                              <p className="text-xs text-muted-foreground max-w-xs">
                                {item.suspended_reason}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                          >
                            Actif
                          </Badge>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(item.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!items.length && (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  {search.trim()
                    ? "Aucun manager correspondant à la recherche."
                    : "Aucun manager enregistré."}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {totalCount > 0
            ? `Affichage de ${
                (page - 1) * PAGE_SIZE + 1
              } à ${Math.min(
                page * PAGE_SIZE,
                totalCount
              )} sur ${totalCount}`
            : "Aucun résultat"}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="min-w-[90px] text-center text-sm font-bold">
            Page {page} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={
              page >= totalPages ||
              loading ||
              totalCount === 0
            }
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1)
              )
            }
            className="gap-1"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}