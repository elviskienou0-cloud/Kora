import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

const PAGE_SIZE = 20

const STATUS_LABELS = {
  pending: "En attente",
  trialing: "Essai gratuit",
  active: "Actif",
  expired: "Expiré",
  cancelled: "Annulé",
}

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR")
}

function statusClass(status) {
  switch (status) {
    case "active":
    case "trialing":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700"
    case "expired":
    case "cancelled":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700"
    default:
      return "border-border text-muted-foreground"
  }
}

export default function AdminSubscriptions() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let query = supabase
        .from("subscriptions")
        .select(
          "id, user_id, plan_id, plan, status, trial_start, trial_end, current_period_start, current_period_end, starts_at, ends_at, provider, created_at, updated_at",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      if (statusFilter !== "all") query = query.eq("status", statusFilter)

      const value = search.trim()
      if (value) {
        const safe = value.replace(/[%,()]/g, " ").trim()
        if (safe) {
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(safe)) {
            query = query.eq("user_id", safe)
          } else {
            query = query.ilike("plan_id", `%${safe}%`)
          }
        }
      }

      const { data, error: queryError, count } = await query
      if (queryError) throw queryError

      setItems(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      setItems([])
      setTotalCount(0)
      setError(err?.message || "Impossible de charger les abonnements.")
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Abonnements</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des abonnements et des périodes d'essai enregistrés dans Supabase.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Comptes abonnés</CardTitle>
          <CardDescription>
            {totalCount.toLocaleString("fr-FR")} abonnement{totalCount > 1 ? "s" : ""} au total.
            La validation des paiements reste dans la section Paiements.
          </CardDescription>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Rechercher un abonnement par identifiant de compte ou plan"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Identifiant du compte ou plan…"
                className="pl-10"
              />
            </div>
            <select
              aria-label="Filtrer les abonnements par statut"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="trialing">Essai gratuit</option>
              <option value="active">Actifs</option>
              <option value="expired">Expirés</option>
              <option value="cancelled">Annulés</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">
              {error}
            </div>
          </CardContent>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement des abonnements…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">Compte</th>
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">Plan</th>
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">Statut</th>
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">Début</th>
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">Fin de période</th>
                    <th className="px-5 py-3 text-xs uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-5 py-4 font-mono text-xs" title={item.user_id}>
                        {item.user_id ? item.user_id.slice(0, 8) : "—"}
                      </td>
                      <td className="px-5 py-4 font-semibold">{item.plan_id || item.plan || "—"}</td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className={statusClass(item.status)}>
                          {STATUS_LABELS[item.status] || item.status || "—"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(item.trial_start || item.current_period_start || item.starts_at || item.created_at)}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(item.trial_end || item.current_period_end || item.ends_at)}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{item.provider || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!items.length && (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  {search.trim() || statusFilter !== "all"
                    ? "Aucun abonnement correspondant aux filtres."
                    : "Aucun abonnement enregistré."}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {totalCount > 0
            ? `Affichage de ${(page - 1) * PAGE_SIZE + 1} à ${Math.min(page * PAGE_SIZE, totalCount)} sur ${totalCount}`
            : "Aucun résultat"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="min-w-[90px] text-center text-sm font-bold">Page {page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading || totalCount === 0}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
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
