import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, Edit3, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"

const STATUS_CONFIG = {
  draft: { label: "Brouillon", className: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
  open: { label: "Ouvert", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  pending: { label: "En attente", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  active: { label: "Actif", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  completed: { label: "Terminé", className: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  cancelled: { label: "Annulé", className: "bg-red-500/10 text-red-600 border-red-500/30" },
}

function formatMoney(value, currency) {
  if (value === null || value === undefined) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "XOF", maximumFractionDigits: 0 }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency || "XOF"}`
  }
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const authUserId = user?.authId || user?.id

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProject = useCallback(async () => {
    if (!id || !authUserId) return

    setLoading(true)
    const { data, error } = await supabase
      .from("projects")
      .select("id, client_id, manager_id, title, description, budget_min, budget_max, currency, status, due_date, created_at, updated_at")
      .eq("id", id)
      .eq("client_id", authUserId)
      .maybeSingle()

    if (error) {
      console.error("Erreur détail projet :", error)
      toast.error("Impossible de charger le projet.")
      navigate("/client/projects", { replace: true })
      return
    }

    if (!data) {
      toast.error("Projet introuvable ou inaccessible.")
      navigate("/client/projects", { replace: true })
      return
    }

    setProject(data)
    setLoading(false)
  }, [id, authUserId, navigate])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const cancelProject = async () => {
    if (!project || ["completed", "cancelled"].includes(project.status)) return
    if (!window.confirm(`Annuler le projet « ${project.title} » ?`)) return

    const { error } = await supabase
      .from("projects")
      .update({ status: "cancelled" })
      .eq("id", project.id)
      .eq("client_id", authUserId)

    if (error) {
      toast.error(error.message || "Impossible d'annuler le projet.")
      return
    }

    toast.success("Projet annulé.")
    loadProject()
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-label="Chargement" />
      </div>
    )
  }

  if (!project) return null

  const status = STATUS_CONFIG[project.status] || { label: project.status || "—", className: "bg-muted text-muted-foreground" }
  const budget = project.budget_min != null && project.budget_max != null
    ? `${formatMoney(project.budget_min, project.currency)} — ${formatMoney(project.budget_max, project.currency)}`
    : project.budget_min != null
    ? `À partir de ${formatMoney(project.budget_min, project.currency)}`
    : project.budget_max != null
    ? `Jusqu'à ${formatMoney(project.budget_max, project.currency)}`
    : "Budget non défini"

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-accent/30 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Projet</p>
              <h1 className="text-2xl font-black tracking-tight">{project.title}</h1>
            </div>
          </div>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">Budget</CardTitle></CardHeader>
            <CardContent className="text-sm font-medium">{budget}</CardContent>
          </Card>
          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">Date limite</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-gold-dark" />
              {project.due_date ? new Date(`${project.due_date}T00:00:00`).toLocaleDateString("fr-FR") : "Non définie"}
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/15">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Créé le</p>
                <p className="font-medium">{new Date(project.created_at).toLocaleString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dernière mise à jour</p>
                <p className="font-medium">{project.updated_at ? new Date(project.updated_at).toLocaleString("fr-FR") : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Manager</p>
                <p className="font-medium">{project.manager_id || "Non assigné"}</p>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" asChild>
                <Link to={`/client/projects/${project.id}/edit`}><Edit3 className="mr-2 h-4 w-4" /> Modifier</Link>
              </Button>
              {!['completed', 'cancelled'].includes(project.status) && (
                <Button variant="ghost" onClick={cancelProject} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="mr-2 h-4 w-4" /> Annuler le projet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
