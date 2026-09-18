import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function AdminManagers() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("id, name, role, avatar, is_suspended, created_at, updated_at")
        .eq("role", "manager")
        .order("created_at", { ascending: false })

      if (queryError) throw queryError
      setItems(data || [])
    } catch (err) {
      setError(err?.message || "Impossible de charger les managers.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rows = items.filter((item) =>
    `${item.name || ""} ${item.id}`.toLowerCase().includes(search.trim().toLowerCase())
  )

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Managers</h1>
          <p className="text-sm text-muted-foreground">Comptes manager enregistrés dans profiles.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing} className="gap-2">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Managers</CardTitle>
            <CardDescription>Données Supabase, sans statistiques inventées.</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="py-16 flex justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Chargement…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-y bg-muted/30 text-left">
                  <th className="px-5 py-3 text-xs uppercase tracking-wider">Manager</th>
                  <th className="px-5 py-3 text-xs uppercase tracking-wider">Statut</th>
                  <th className="px-5 py-3 text-xs uppercase tracking-wider">Inscription</th>
                </tr></thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-5 py-4"><p className="font-bold">{item.name || "Manager"}</p><p className="text-xs text-muted-foreground">{item.id}</p></td>
                      <td className="px-5 py-4"><Badge variant="outline">{item.is_suspended ? "Suspendu" : "Actif"}</Badge></td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && <div className="py-14 text-center text-sm text-muted-foreground">Aucun manager.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
