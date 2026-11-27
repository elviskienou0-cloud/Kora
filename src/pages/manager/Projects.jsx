import { useCallback, useEffect, useState } from "react"
import { BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"

function formatMoney(min, max, currency = "XOF", language = "fr") {
  const formatter = new Intl.NumberFormat(language === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 0 })
  if (min == null && max == null) return null
  if (min != null && max != null && Number(min) !== Number(max)) {
    return `${formatter.format(Number(min))} – ${formatter.format(Number(max))} ${currency === "XOF" ? "FCFA" : currency}`
  }
  return `${formatter.format(Number(min ?? max))} ${currency === "XOF" ? "FCFA" : currency}`
}

export default function ManagerProjects() {
  const { user } = useAuth()
  const { language } = useI18n()
  const managerId = user?.authId || user?.id
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")

  const copy = language === "en" ? {
    eyebrow: "KORA BUSINESS",
    title: "Project management",
    subtitle: "Track projects assigned to your portfolio and update their progress.",
    empty: "No projects are assigned to your account yet.",
    loadError: "Unable to load your projects.",
    refresh: "Refresh",
    due: "Due date",
    budget: "Budget",
    created: "Created",
    active: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Pending",
    complete: "Mark as completed",
    cancel: "Cancel project",
    updated: "Project status updated.",
    statusError: "Unable to update this project.",
    noBudget: "Budget not specified",
  } : {
    eyebrow: "KORA BUSINESS",
    title: "Gestion des projets",
    subtitle: "Suivez les projets attribués à votre portefeuille et mettez à jour leur avancement.",
    empty: "Aucun projet n'est encore attribué à votre compte.",
    loadError: "Impossible de charger vos projets.",
    refresh: "Actualiser",
    due: "Échéance",
    budget: "Budget",
    created: "Créé le",
    active: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
    pending: "En attente",
    complete: "Marquer comme terminé",
    cancel: "Annuler le projet",
    updated: "Statut du projet mis à jour.",
    statusError: "Impossible de mettre à jour ce projet.",
    noBudget: "Budget non précisé",
  }

  const load = useCallback(async () => {
    if (!managerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    const { data, error: queryError } = await supabase
      .from("projects")
      .select("id,title,description,status,budget_min,budget_max,currency,due_date,created_at")
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false })
    if (queryError) {
      console.error("KORA manager projects:", queryError)
      setError(queryError.message || copy.loadError)
      setProjects([])
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }, [managerId, copy.loadError])

  useEffect(() => { void load() }, [load])

  const updateStatus = async (projectId, status) => {
    setBusyId(projectId)
    try {
      const { error: updateError } = await supabase.rpc("manager_update_project_status_v2", {
        p_project_id: projectId,
        p_status: status,
      })
      if (updateError) throw updateError
      toast.success(copy.updated)
      await load()
    } catch (updateError) {
      console.error("KORA project status:", updateError)
      toast.error(updateError?.message || copy.statusError)
    } finally {
      setBusyId("")
    }
  }

  const statusLabel = (status) => {
    const key = String(status || "").toLowerCase()
    if (key === "completed") return copy.completed
    if (key === "cancelled") return copy.cancelled
    if (key === "active" || key === "in_progress") return copy.active
    return copy.pending
  }

  if (loading) {
    return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{copy.eyebrow}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{copy.refresh}</Button>
      </div>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>{copy.refresh}</Button>
          </CardContent>
        </Card>
      )}

      {!error && projects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="rounded-2xl bg-gold/10 p-4 text-gold"><BriefcaseBusiness className="h-7 w-7" /></span>
            <p className="font-semibold">{copy.empty}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => {
          const status = String(project.status || "").toLowerCase()
          const terminal = status === "completed" || status === "cancelled"
          const budget = formatMoney(project.budget_min, project.budget_max, project.currency, language)
          return (
            <Card key={project.id} className="border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <CardTitle className="text-lg font-bold">{project.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{statusLabel(status)}</Badge>
                </div>
                {project.description && <CardDescription className="whitespace-pre-line">{project.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{copy.due}: {project.due_date ? new Date(project.due_date).toLocaleDateString(language === "en" ? "en-GB" : "fr-FR") : "—"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{copy.created}: {project.created_at ? new Date(project.created_at).toLocaleDateString(language === "en" ? "en-GB" : "fr-FR") : "—"}</span>
                  </div>
                  <div className="font-semibold sm:col-span-2">{copy.budget}: {budget || copy.noBudget}</div>
                </div>
                {!terminal && (
                  <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
                    <Button size="sm" onClick={() => void updateStatus(project.id, "completed")} disabled={busyId === project.id || !["active", "in_progress"].includes(status)}>
                      {busyId === project.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {copy.complete}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(project.id, "cancelled")} disabled={busyId === project.id || !["active", "in_progress"].includes(status)}>
                      {busyId === project.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      {copy.cancel}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
