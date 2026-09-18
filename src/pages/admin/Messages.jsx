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

export default function AdminMessages() {
  const [stats, setStats] = useState({ messages: null, conversations: null })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [messagesCount, conversationsCount, recentResult] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id, conversation_id, sender_id, body, read_at, created_at").order("created_at", { ascending: false }).limit(20),
      ])

      const countError = messagesCount.error || conversationsCount.error
      if (countError) throw countError
      if (recentResult.error) throw recentResult.error

      setStats({
        messages: messagesCount.count ?? 0,
        conversations: conversationsCount.count ?? 0,
      })
      setRecent(recentResult.data || [])
    } catch (err) {
      setError(err?.message || "Impossible de charger les messages administratifs.")
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
        <div><h1 className="text-2xl font-black">Messages</h1><p className="text-sm text-muted-foreground">Supervision des conversations et messages accessibles à l'administrateur.</p></div>
        <Button variant="outline" className="gap-2" onClick={refresh} disabled={refreshing}>{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Actualiser</Button>
      </div>

      {error && <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-5 text-sm text-red-700">{error}</CardContent></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-6"><p className="text-3xl font-black">{loading ? "—" : stats.messages ?? "—"}</p><p className="font-bold mt-1">Messages</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-3xl font-black">{loading ? "—" : stats.conversations ?? "—"}</p><p className="font-bold mt-1">Conversations</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Messages récents</CardTitle><CardDescription>Extrait des messages accessibles avec les politiques RLS actuelles.</CardDescription></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="py-16 flex justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Chargement…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-y bg-muted/30 text-left"><th className="px-5 py-3">Message</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Date</th></tr></thead>
                <tbody>{recent.map((item) => <tr key={item.id} className="border-b">
                  <td className="px-5 py-4"><p className="font-semibold max-w-xl truncate">{item.body || "—"}</p><p className="text-xs text-muted-foreground">Conversation : {String(item.conversation_id || "").slice(0, 8)}…</p></td>
                  <td className="px-5 py-4"><Badge variant="outline">{item.read_at ? "Lu" : "Non lu"}</Badge></td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(item.created_at)}</td>
                </tr>)}</tbody>
              </table>
              {!recent.length && <div className="py-14 text-center text-sm text-muted-foreground">Aucun message accessible.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
