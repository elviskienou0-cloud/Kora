import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR")
}

export default function AdminPayments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error: queryError } = await supabase
        .from("payments")
        .select("id, user_id, subscription_id, plan_id, provider, provider_payment_id, reference, amount, currency, billing_cycle, status, checkout_url, paid_at, metadata, created_at, updated_at")
        .order("created_at", { ascending: false })

      if (queryError) throw queryError
      setItems(data || [])
    } catch (err) {
      setError(err?.message || "Impossible de charger les paiements.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div><h1 className="text-2xl font-black">Paiements</h1><p className="text-sm text-muted-foreground">Transactions et statuts réellement enregistrés.</p></div>
        <Button variant="outline" className="gap-2" onClick={refresh} disabled={refreshing}>{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualiser</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Transactions</CardTitle><CardDescription>Le frontend ne modifie pas le statut des paiements.</CardDescription></CardHeader>
        <CardContent className="p-0">
          {error && <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">{error}</div>}
          {loading ? <div className="py-16 flex justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Chargement…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-y bg-muted/30 text-left">
                  <th className="px-5 py-3">Référence</th><th className="px-5 py-3">Prestataire</th><th className="px-5 py-3">Montant</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Date</th>
                </tr></thead>
                <tbody>{items.map((item) => <tr key={item.id} className="border-b">
                  <td className="px-5 py-4 font-semibold">{item.reference || String(item.id).slice(0, 8)}</td>
                  <td className="px-5 py-4">{item.provider || "—"}</td>
                  <td className="px-5 py-4">{item.amount == null ? "—" : `${new Intl.NumberFormat("fr-FR").format(Number(item.amount))} ${item.currency || ""}`}</td>
                  <td className="px-5 py-4"><Badge variant="outline">{item.status || "—"}</Badge></td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(item.created_at)}</td>
                </tr>)}</tbody>
              </table>
              {!items.length && <div className="py-14 text-center text-sm text-muted-foreground">Aucun paiement.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
