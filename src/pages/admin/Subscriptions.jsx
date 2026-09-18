import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR")
}

export default function AdminSubscriptions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error: queryError } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan_id, status, trial_start, trial_end, current_period_start, current_period_end, provider, provider_subscription_id, created_at, updated_at")
        .order("updated_at", { ascending: false })

      if (queryError) throw queryError
      setItems(data || [])
    } catch (err) {
      setError(err?.message || "Impossible de charger les abonnements.")
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
        <div><h1 className="text-2xl font-black">Abonnements</h1><p className="text-sm text-muted-foreground">Souscriptions réelles depuis Supabase.</p></div>
        <Button variant="outline" className="gap-2" onClick={refresh} disabled={refreshing}>{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualiser</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Abonnements</CardTitle><CardDescription>Aucun statut ne doit être inventé côté interface.</CardDescription></CardHeader>
        <CardContent className="p-0">
          {error && <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">{error}</div>}
          {loading ? <div className="py-16 flex justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Chargement…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-y bg-muted/30 text-left">
                  <th className="px-5 py-3">Plan</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Fin trial</th><th className="px-5 py-3">Fin période</th><th className="px-5 py-3">Mise à jour</th>
                </tr></thead>
                <tbody>{items.map((item) => <tr key={item.id} className="border-b">
                  <td className="px-5 py-4"><p className="font-bold">{item.plan_id || "—"}</p><p className="text-xs text-muted-foreground">{String(item.user_id || "").slice(0, 8)}…</p></td>
                  <td className="px-5 py-4"><Badge variant="outline">{item.status || "—"}</Badge></td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(item.trial_end)}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(item.current_period_end)}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(item.updated_at)}</td>
                </tr>)}</tbody>
              </table>
              {!items.length && <div className="py-14 text-center text-sm text-muted-foreground">Aucun abonnement.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
