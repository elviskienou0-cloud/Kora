import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, Edit3, Loader2, MessageCircle, Star, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const STATUS_CONFIG = {
  draft: { labelKey: "projects.draft", className: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
  open: { labelKey: "projects.open", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  pending: { labelKey: "projects.pending", className: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  active: { labelKey: "projects.active", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  completed: { labelKey: "projects.completed", className: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  cancelled: { labelKey: "projects.cancelled", className: "bg-red-500/10 text-red-600 border-red-500/30" },
}

function formatMoney(value, currency, locale = "fr-FR") {
  if (value === null || value === undefined) return "—"
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "XOF", maximumFractionDigits: 0 }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString(locale)} ${currency || "XOF"}`
  }
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language } = useI18n()
  const locale = language === "en" ? "en-GB" : "fr-FR"
  const authUserId = user?.authId || user?.id

  const [project, setProject] = useState(null)
  const [eligibleTalents, setEligibleTalents] = useState([])
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProject = useCallback(async () => {
    if (!id || !authUserId) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, client_id, manager_id, title, description, budget_min, budget_max, currency, status, due_date, created_at, updated_at")
        .eq("id", id)
        .eq("client_id", authUserId)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error("PROJECT_NOT_FOUND")

      setProject(data)

      if (data.status === "completed") {
        const { data: requests, error: requestsError } = await supabase
          .from("requests")
          .select("talent_id")
          .eq("project_id", id)
          .eq("client_id", authUserId)
          .eq("status", "accepted")

        if (requestsError) throw requestsError

        const talentIds = [...new Set((requests || []).map((row) => row.talent_id).filter(Boolean))]

        if (talentIds.length) {
          const { data: talents, error: talentsError } = await supabase
            .from("talent_profiles")
            .select("id, first_name, last_name, title")
            .in("id", talentIds)

          if (talentsError) throw talentsError
          setEligibleTalents(talents || [])

          const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("talent_id")
            .eq("project_id", id)
            .eq("client_id", authUserId)

          if (!reviewsError) {
            const reviewedIds = new Set((reviews || []).map((row) => row.talent_id))
            setAlreadyReviewed(talentIds.every((talentId) => reviewedIds.has(talentId)))
          } else {
            setAlreadyReviewed(false)
          }
        } else {
          setEligibleTalents([])
          setAlreadyReviewed(true)
        }
      } else {
        setEligibleTalents([])
        setAlreadyReviewed(false)
      }
    } catch (error) {
      console.error("Erreur détail projet :", error)
      console.error("KORA: project detail load failed", error)
      toast.error(error?.message === "PROJECT_NOT_FOUND" ? t("clientUi.projects.projectNotFound") : t("clientUi.projects.loadError"))
      navigate("/client/projects", { replace: true })
      return
    } finally {
      setLoading(false)
    }
  }, [id, authUserId, navigate, t])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const cancelProject = async () => {
    if (!project || ["completed", "cancelled"].includes(project.status)) return
    if (!window.confirm(t("clientUi.projects.cancelConfirm", "Cancel project “{title}”? ", { title: project.title }))) return

    const { error } = await supabase
      .from("projects")
      .update({ status: "cancelled" })
      .eq("id", project.id)
      .eq("client_id", authUserId)

    if (error) {
      console.error("KORA: project cancellation failed", error)
      toast.error(t("clientUi.projects.cancelError"))
      return
    }

    toast.success(t("clientUi.projects.cancelled"))
    loadProject()
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  if (!project) return null

  const status = STATUS_CONFIG[project.status] || { label: project.status || "—", labelKey: null, className: "bg-muted text-muted-foreground" }
  const budget = project.budget_min != null && project.budget_max != null
    ? `${formatMoney(project.budget_min, project.currency, locale)} — ${formatMoney(project.budget_max, project.currency, locale)}`
    : project.budget_min != null
    ? `${t("clientUi.projects.from")} ${formatMoney(project.budget_min, project.currency, locale)}`
    : project.budget_max != null
    ? `${t("clientUi.projects.upTo")} ${formatMoney(project.budget_max, project.currency, locale)}`
     : t("clientUi.projects.undefinedBudget")

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-accent/30 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{t("clientUi.projects.title")}</p>
              <h1 className="text-2xl font-black tracking-tight">{project.title}</h1>
            </div>
          </div>
          <Badge variant="outline" className={status.className}>{status.labelKey ? t(status.labelKey) : status.label}</Badge>
        </div>

        <Card className="border-gold/20">
          <CardHeader><CardTitle>{t("projects.descriptionLabel")}</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{project.description}</p></CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">{t("clientUi.projects.budget")}</CardTitle></CardHeader>
            <CardContent className="text-sm font-medium">{budget}</CardContent>
          </Card>
          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">{t("clientUi.projects.dueDate")}</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-gold-dark" />
              {project.due_date ? new Date(`${project.due_date}T00:00:00`).toLocaleDateString(locale) : t("clientUi.projects.dueDateMissing")}
            </CardContent>
          </Card>
        </div>

        {project.status === "completed" && (
          <Card className="border-gold/20 bg-gold/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-gold" /> {t("clientUi.projects.rateProject")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {eligibleTalents.length
                  ? t("clientUi.projects.completedReviewPrompt")
                  : t("clientUi.projects.noEligibleTalents")
                }
              </p>
              {eligibleTalents.length > 0 && !alreadyReviewed ? (
                <Button className="gap-2" asChild>
                  <Link to={`/client/projects/${project.id}/review`}><Star className="h-4 w-4" /> {t("clientUi.projects.leaveReview")}</Link>
                </Button>
              ) : eligibleTalents.length > 0 ? (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">{t("clientUi.projects.reviewsAlreadySaved")}</Badge>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="border-gold/15">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div><p className="text-muted-foreground">{t("clientUi.projects.createdAt")}</p><p className="font-medium">{new Date(project.created_at).toLocaleString(locale)}</p></div>
              <div><p className="text-muted-foreground">{t("clientUi.projects.updatedAt")}</p><p className="font-medium">{project.updated_at ? new Date(project.updated_at).toLocaleString(locale) : "—"}</p></div>
              <div><p className="text-muted-foreground">{t("clientUi.projects.manager")}</p><p className="font-medium">{project.manager_id ? t("clientUi.projects.assigned") : t("clientUi.projects.notAssigned")}</p></div>
            </div>
            <Separator className="my-5" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" asChild><Link to={`/client/projects/${project.id}/edit`}><Edit3 className="mr-2 h-4 w-4" /> {t("clientUi.projects.edit")}</Link></Button>
              <Button variant="outline" onClick={() => navigate("/messages")}><MessageCircle className="mr-2 h-4 w-4" /> {t("clientUi.projects.messages")}</Button>
              {!['completed', 'cancelled'].includes(project.status) && (
                <Button variant="ghost" onClick={cancelProject} className="text-red-600 hover:bg-red-50 hover:text-red-700"><XCircle className="mr-2 h-4 w-4" /> {t("clientUi.projects.cancelProject")}</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
