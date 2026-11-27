import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { LockKeyhole, FileSpreadsheet, FileText, Loader2, RefreshCw, Users, ClipboardList, BriefcaseBusiness, Star } from "lucide-react"
import { jsPDF } from "jspdf"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"

function saveCsv(data) {
  const rows = [
    ["Indicateur", "Valeur"],
    ["Talents gérés", data.total_talents ?? 0],
    ["Demandes reçues", data.total_requests ?? 0],
    ["Demandes en attente", data.pending_requests ?? 0],
    ["Demandes acceptées", data.accepted_requests ?? 0],
    ["Demandes refusées", data.rejected_requests ?? 0],
    ["Projets", data.total_projects ?? 0],
    ["Projets actifs", data.active_projects ?? 0],
    ["Projets terminés", data.completed_projects ?? 0],
    [],
    ["Talent", "Catégorie", "Note", "Avis", "Projets terminés"],
    ...(data.talent_performance || []).map((talent) => [
      talent.name || "",
      talent.category || "",
      talent.rating ?? 0,
      talent.reviews_count ?? 0,
      talent.completed_projects ?? 0,
    ]),
  ]
  const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`
  const csv = "\uFEFF" + rows.map((row) => row.map(escapeCell).join(";")).join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "rapport-activite-kora.csv"
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function savePdf(data, language) {
  const doc = new jsPDF()
  const title = language === "en" ? "KORA activity report" : "Rapport d'activité KORA"
  const lines = [
    title,
    `${language === "en" ? "Generated on" : "Généré le"}: ${new Date().toLocaleDateString(language === "en" ? "en-GB" : "fr-FR")}`,
    "",
    `${language === "en" ? "Talents" : "Talents"}: ${data.total_talents ?? 0}`,
    `${language === "en" ? "Requests" : "Demandes"}: ${data.total_requests ?? 0}`,
    `${language === "en" ? "Pending requests" : "Demandes en attente"}: ${data.pending_requests ?? 0}`,
    `${language === "en" ? "Accepted requests" : "Demandes acceptées"}: ${data.accepted_requests ?? 0}`,
    `${language === "en" ? "Rejected requests" : "Demandes refusées"}: ${data.rejected_requests ?? 0}`,
    `${language === "en" ? "Projects" : "Projets"}: ${data.total_projects ?? 0}`,
    `${language === "en" ? "Active projects" : "Projets actifs"}: ${data.active_projects ?? 0}`,
    `${language === "en" ? "Completed projects" : "Projets terminés"}: ${data.completed_projects ?? 0}`,
    "",
    language === "en" ? "Talent performance" : "Performances des talents",
    ...(data.talent_performance || []).map((talent) =>
      `• ${talent.name || "Talent"} | ${talent.category || "—"} | ${language === "en" ? "Rating" : "Note"}: ${talent.rating ?? 0} | ${language === "en" ? "Reviews" : "Avis"}: ${talent.reviews_count ?? 0} | ${language === "en" ? "Completed projects" : "Projets terminés"}: ${talent.completed_projects ?? 0}`
    ),
  ]
  let y = 18
  lines.forEach((line, index) => {
    const wrapped = doc.splitTextToSize(line, 180)
    if (y + wrapped.length * 7 > 280) {
      doc.addPage()
      y = 18
    }
    doc.setFont("helvetica", index === 0 || index === 11 ? "bold" : "normal")
    doc.setFontSize(index === 0 ? 16 : 10)
    doc.text(wrapped, 15, y)
    y += wrapped.length * 7 + (line === "" ? 2 : 0)
  })
  doc.save("rapport-activite-kora.pdf")
}

export default function ManagerBusinessAnalytics() {
  const { user } = useAuth()
  const { language } = useI18n()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentUserId = user?.authId || user?.id
  const workspaceId = searchParams.get("workspace") || currentUserId
  const isOwnWorkspace = workspaceId === currentUserId
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState("")
  const [error, setError] = useState("")

  const copy = useMemo(() => language === "en" ? {
    title: "Advanced analytics",
    subtitle: "Track your portfolio, requests and project activity.",
    talents: "Managed talents",
    requests: "Total requests",
    pending: "Pending requests",
    accepted: "Accepted requests",
    rejected: "Rejected requests",
    projects: "Projects",
    activeProjects: "Active projects",
    completed: "Completed projects",
    performance: "Talent performance",
    name: "Talent",
    category: "Category",
    rating: "Rating",
    reviews: "Reviews",
    completedCount: "Completed projects",
    empty: "No performance data available yet.",
    denied: "This workspace is unavailable or you do not have analytics permission.",
    upgrade: "Business plan required to access advanced analytics.",
    plans: "View plans",
    refresh: "Refresh",
    pdf: "Export PDF",
    csv: "Export for Excel (CSV)",
    generated: "Report generated.",
  } : {
    title: "Analyses avancées",
    subtitle: "Suivez votre portefeuille, vos demandes et vos projets.",
    talents: "Talents gérés",
    requests: "Demandes reçues",
    pending: "Demandes en attente",
    accepted: "Demandes acceptées",
    rejected: "Demandes refusées",
    projects: "Projets",
    activeProjects: "Projets actifs",
    completed: "Projets terminés",
    performance: "Performances des talents",
    name: "Talent",
    category: "Catégorie",
    rating: "Note",
    reviews: "Avis",
    completedCount: "Projets terminés",
    empty: "Aucune donnée de performance disponible pour le moment.",
    denied: "Cet espace est indisponible ou vous ne disposez pas du droit de consulter ses analyses.",
    upgrade: "Le plan BUSINESS est nécessaire pour accéder aux analyses avancées.",
    plans: "Voir les abonnements",
    refresh: "Actualiser",
    pdf: "Exporter en PDF",
    csv: "Exporter pour Excel (CSV)",
    generated: "Rapport généré.",
  }, [language])

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError("")
    const { data: result, error: requestError } = await supabase.rpc("get_manager_analytics", {
      p_manager_id: workspaceId,
    })
    if (requestError) {
      const missingRpc = requestError.code === "PGRST202" || /function .*get_manager_analytics.*not found/i.test(requestError.message || "")
      setError(missingRpc
        ? (language === "en" ? "The Business database migration has not been applied yet." : "La migration de la base BUSINESS n'a pas encore été appliquée.")
        : requestError.message || copy.denied)
      setData(null)
    } else {
      setData(result || null)
    }
    setLoading(false)
  }, [workspaceId, copy.denied])

  useEffect(() => { void load() }, [load])

  const exportReport = async (format) => {
    setExporting(format)
    try {
      const { data: report, error: reportError } = await supabase.rpc("get_manager_report_data", {
        p_manager_id: workspaceId,
      })
      if (reportError) throw reportError
      if (!report) throw new Error(copy.denied)
      if (format === "pdf") savePdf(report, language)
      else saveCsv(report)
      toast.success(copy.generated)
    } catch (exportError) {
      toast.error(exportError?.message || copy.denied)
    } finally {
      setExporting("")
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  if (error || !data) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6 text-center">
          <LockKeyholeIcon />
          <p className="text-sm text-muted-foreground">{error || copy.denied}</p>
          {isOwnWorkspace && (
            <Button onClick={() => navigate("/manager/subscription")}>{copy.plans}</Button>
          )}
          <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{copy.refresh}</Button>
        </CardContent>
      </Card>
    )
  }

  const stats = [
    { label: copy.talents, value: data.total_talents, icon: Users },
    { label: copy.requests, value: data.total_requests, icon: ClipboardList },
    { label: copy.pending, value: data.pending_requests, icon: ClipboardList },
    { label: copy.accepted, value: data.accepted_requests, icon: ClipboardList },
    { label: copy.rejected, value: data.rejected_requests, icon: ClipboardList },
    { label: copy.projects, value: data.total_projects, icon: BriefcaseBusiness },
    { label: copy.activeProjects, value: data.active_projects, icon: BriefcaseBusiness },
    { label: copy.completed, value: data.completed_projects, icon: BriefcaseBusiness },
  ]
  const performance = data.talent_performance || []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">KORA BUSINESS</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          {!isOwnWorkspace && <p className="mt-1 text-xs text-muted-foreground">{language === "en" ? "Shared workspace" : "Espace partagé"}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{copy.refresh}</Button>
          {data.can_export_reports && (
            <>
              <Button variant="outline" onClick={() => void exportReport("pdf")} disabled={Boolean(exporting)}><FileText className="mr-2 h-4 w-4" />{exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.pdf}</Button>
              <Button onClick={() => void exportReport("csv")} disabled={Boolean(exporting)}><FileSpreadsheet className="mr-2 h-4 w-4" />{exporting === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.csv}</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums">{Number(item.value || 0)}</p>
                </div>
                <span className="rounded-xl bg-gold/10 p-3 text-gold"><Icon className="h-5 w-5" /></span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader><CardTitle>{copy.performance}</CardTitle></CardHeader>
          <CardContent>
            {performance.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performance.slice(0, 8)} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={58} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="completed_projects" name={copy.completedCount} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>{copy.performance}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.slice(0, 6).map((talent) => (
                <div key={talent.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{talent.name || copy.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{talent.category || "—"}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <p className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-gold" />{Number(talent.rating || 0).toFixed(1)}</p>
                    <p>{talent.reviews_count || 0} {copy.reviews}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LockKeyholeIcon() {
  return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/10"><LockKeyhole className="h-6 w-6 text-gold" /></div>
}
