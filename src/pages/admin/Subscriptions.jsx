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

const STATUS_LABELS = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échec",
  cancelled: "Annulé",
  refunded: "Remboursé",
}

function formatDate(value) {
  if (!value) return "—"

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("fr-FR")
}

function formatMoney(value, currency) {
  if (value === null || value === undefined) {
    return "—"
  }

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${
      currency || "XOF"
    }`
  }
}

function statusClass(status) {
  switch (status) {
    case "paid":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"

    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700"

    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-700"

    case "refunded":
      return "border-violet-500/30 bg-violet-500/10 text-violet-700"

    case "cancelled":
      return "border-slate-500/30 bg-slate-500/10 text-slate-700"

    default:
      return "border-border text-muted-foreground"
  }
}

export default function AdminPayments() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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
        .from("payments")
        .select(
          `
            id,
            user_id,
            subscription_id,
            plan_id,
            provider,
            provider_payment_id,
            reference,
            amount,
            currency,
            billing_cycle,
            status,
            checkout_url,
            paid_at,
            metadata,
            created_at,
            updated_at
          `,
          { count: "exact" }
        )
        .order("created_at", {
          ascending: false,
        })
        .range(from, to)

      if (statusFilter !== "all") {
        query = query.eq(
          "status",
          statusFilter
        )
      }

      const value = search.trim()

      if (value) {
        const safe = value
          .replace(/[%(),]/g, " ")
          .trim()

        if (safe) {
          query = query.or(
            [
              `reference.ilike.%${safe}%`,
              `provider.ilike.%${safe}%`,
              `status.ilike.%${safe}%`,
            ].join(",")
          )
        }
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
        "Erreur chargement paiements admin :",
        err
      )

      setItems([])
      setTotalCount(0)

      setError(
        err?.message ||
          "Impossible de charger les paiements."
      )
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

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
    setPage(1)
  }, [statusFilter])

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Paiements
          </h1>

          <p className="text-sm text-muted-foreground">
            Transactions réelles enregistrées dans
            Supabase.
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

      <Card className="border-border/60 overflow-hidden">
        <CardHeader>
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <CardTitle className="font-black">
                Transactions
              </CardTitle>

              <CardDescription>
                {totalCount.toLocaleString("fr-FR")} paiement
                {totalCount > 1 ? "s" : ""} au total.
                <span className="block mt-1">
                  Le statut de paiement reste contrôlé côté
                  serveur/webhook.
                </span>
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Référence, prestataire..."
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">
                  Tous les statuts
                </option>

                <option value="pending">
                  En attente
                </option>

                <option value="paid">
                  Payés
                </option>

                <option value="failed">
                  Échecs
                </option>

                <option value="cancelled">
                  Annulés
                </option>

                <option value="refunded">
                  Remboursés
                </option>
              </select>
            </div>
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
                      Référence
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Prestataire
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Montant
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-xs uppercase tracking-wider">
                      Date
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
                          {item.reference ||
                            String(item.id).slice(
                              0,
                              8
                            )}
                        </p>

                        <p className="text-xs text-muted-foreground break-all">
                          {item.provider_payment_id ||
                            "ID prestataire non renseigné"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge variant="outline">
                          {item.provider || "—"}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatMoney(
                          item.amount,
                          item.currency
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={statusClass(
                            item.status
                          )}
                        >
                          {STATUS_LABELS[
                            item.status
                          ] ||
                            item.status ||
                            "—"}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!items.length && (
                <div className="py-14 text-center text-sm text-muted-foreground">
                  {search.trim() ||
                  statusFilter !== "all"
                    ? "Aucun paiement correspondant aux filtres."
                    : "Aucun paiement enregistré."}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

          <span className="min-w-[90px] text-center text-sm font-bold">
            Page {page} / {totalPages}
          </span>

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