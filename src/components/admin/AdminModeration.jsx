import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { adminModerateTalent } from "@/lib/admin"

export default function AdminModeration() {
  const [talents, setTalents] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [talentsResult, reportsResult] = await Promise.all([
        supabase.from("talent_profiles").select("id, first_name, last_name, title, status, is_visible, verified").order("updated_at", { ascending: false }).limit(20),
        supabase.from("reports").select("id, target_type, target_id, reason, status, created_at").order("created_at", { ascending: false }).limit(20),
      ])
      if (talentsResult.error) throw talentsResult.error
      if (reportsResult.error) throw reportsResult.error
      setTalents(talentsResult.data || [])
      setReports(reportsResult.data || [])
    } catch (err) {
      toast.error("Impossible de charger la modération", { description: err?.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleVerification = async (talent) => {
    try {
      await adminModerateTalent({
        talentId: talent.id,
        status: talent.status || "pending",
        visible: talent.is_visible,
        verified: !talent.verified,
      })
      await load()
      toast.success("Talent mis à jour.")
    } catch (err) {
      toast.error("Échec de la modération", { description: err?.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black">Modération</h1><p className="text-sm text-muted-foreground">Talents et signalements.</p></div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</Button>
      </div>

      {loading ? <Card><CardContent className="py-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card> : <>
        <Card><CardHeader><CardTitle>Talents</CardTitle><CardDescription>Modération de visibilité et de vérification.</CardDescription></CardHeader><CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y bg-muted/30 text-left"><th className="px-5 py-3">Talent</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Vérification</th><th className="px-5 py-3">Action</th></tr></thead><tbody>
            {talents.map((talent) => <tr key={talent.id} className="border-b">
              <td className="px-5 py-4"><p className="font-bold">{[talent.first_name, talent.last_name].filter(Boolean).join(" ") || "Talent"}</p><p className="text-xs text-muted-foreground">{talent.title || "—"}</p></td>
              <td className="px-5 py-4"><Badge variant="outline">{talent.status || "—"}</Badge></td>
              <td className="px-5 py-4"><Badge variant="outline">{talent.verified ? "Vérifié" : "Non vérifié"}</Badge></td>
              <td className="px-5 py-4"><Button size="sm" variant="outline" onClick={() => toggleVerification(talent)}>{talent.verified ? "Retirer" : "Vérifier"}</Button></td>
            </tr>)}
          </tbody></table>{!talents.length && <div className="py-10 text-center text-sm text-muted-foreground">Aucun talent.</div>}</div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Signalements</CardTitle><CardDescription>Données de reports.</CardDescription></CardHeader><CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y bg-muted/30 text-left"><th className="px-5 py-3">Motif</th><th className="px-5 py-3">Cible</th><th className="px-5 py-3">Statut</th></tr></thead><tbody>
            {reports.map((report) => <tr key={report.id} className="border-b"><td className="px-5 py-4 font-semibold">{report.reason || "—"}</td><td className="px-5 py-4">{report.target_type || "—"}</td><td className="px-5 py-4"><Badge variant="outline">{report.status || "—"}</Badge></td></tr>)}
          </tbody></table>{!reports.length && <div className="py-10 text-center text-sm text-muted-foreground">Aucun signalement.</div>}</div>
        </CardContent></Card>
      </>}
    </div>
  )
}
