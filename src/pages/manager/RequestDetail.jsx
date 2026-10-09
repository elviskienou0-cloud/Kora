import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MessageCircle,
  BriefcaseBusiness,
  XCircle,
  Check,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"
import { updateManagerProjectStatus, updateRequestStatus } from "@/lib/requestInvitations"
import { buildMessagesUrl, createDirectConversation } from "@/lib/messaging"

const STATUS = {
  pending: { label: "En attente", className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  open: { label: "En attente", className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  accepted: { label: "Acceptée", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" },
  rejected: { label: "Refusée", className: "border-red-500/30 bg-red-500/10 text-red-700" },
}

function formatMoney(value, currency = "XOF") {
  if (value == null) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency}`
  }
}

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR")
}

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR")
}

export default function ManagerRequestDetail() {
  const { t } = useI18n()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const managerId = user?.authId || user?.id

  const [request, setRequest] = useState(null)
  const [project, setProject] = useState(null)
  const [talent, setTalent] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [reply, setReply] = useState("")
  const [planAccess, setPlanAccess] = useState(null)
  const statusActionLock = useRef(false)

  const load = useCallback(async () => {
    if (!id || !managerId) return
    setLoading(true)

    try {
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select(`
          id, client_id, manager_id, talent_id, project_id,
          title, project_type, description, project_date_start, project_date_end,
          budget, currency, location, additional_info,
          status, created_at, updated_at
        `)
        .eq("id", id)
        .eq("manager_id", managerId)
        .maybeSingle()

      if (requestError) throw requestError
      if (!requestData) {
        toast.error("Demande introuvable ou inaccessible.")
        navigate("/manager/requests", { replace: true })
        return
      }

      const [projectResult, talentResult, clientResult, planResult] = await Promise.all([
        requestData.project_id
          ? supabase
              .from("projects")
              .select("id, client_id, manager_id, title, description, budget_min, budget_max, currency, status, due_date, created_at, updated_at")
              .eq("id", requestData.project_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        requestData.talent_id
          ? supabase
              .from("talent_profiles")
              .select("id, first_name, last_name, title, bio, city, daily_rate, currency, rating, reviews_count, verified, available")
              .eq("id", requestData.talent_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("profiles")
          .select("id, name, avatar, role")
          .eq("id", requestData.client_id)
          .maybeSingle(),
        supabase.rpc("get_my_manager_plan_access"),
      ])

      if (projectResult.error) throw projectResult.error
      if (talentResult.error) throw talentResult.error
      if (clientResult.error) throw clientResult.error
      if (planResult.error) throw planResult.error

      setRequest(requestData)
      setProject(projectResult.data || null)
      setTalent(talentResult.data || null)
      setClient(clientResult.data || null)
      setPlanAccess(planResult.data || null)
    } catch (error) {
      console.error("Erreur chargement demande manager :", error)
      toast.error(error?.message || "Impossible de charger la demande.")
      navigate("/manager/requests", { replace: true })
    } finally {
      setLoading(false)
    }
  }, [id, managerId, navigate])

  useEffect(() => {
    load()
  }, [load])

  const handleMessageClient = async () => {
    if (!request?.client_id) return
    try {
      const conversationId = await createDirectConversation(request.client_id, request.talent_id)
      navigate(buildMessagesUrl(conversationId))
    } catch (error) {
      toast.error(error?.message || "Impossible d'ouvrir la conversation")
    }
  }

  const handleStatus = async (status) => {
    if (!request || statusActionLock.current || processing) return

    const currentStatus = String(request.status || "").toLowerCase()
    if (!["pending", "open"].includes(currentStatus)) {
      toast.info(currentStatus === "accepted" ? t("requests.accepted") : t("manager.alreadyProcessed"))
      return
    }

    const label = status === "accepted" ? "accepter" : "refuser"
    if (!window.confirm(`Voulez-vous ${label} cette demande ?`)) return

    // Verrou synchrone : empêche un double-clic rapide de lancer deux RPC.
    statusActionLock.current = true
    setProcessing(true)

    try {
      await updateRequestStatus(request.id, status)
      toast.success(status === "accepted" ? t("manager.requestAccepted") : t("manager.requestRejected"))
      await load()
    } catch (error) {
      console.error("Erreur update_request_status :", error)
      toast.error(error?.message || "Impossible de traiter la demande.")
    } finally {
      statusActionLock.current = false
      setProcessing(false)
    }
  }

  const handleProjectStatus = async (nextStatus) => {
    if (!project?.id) return
    if (!canManageProjects) {
      toast.info("La gestion des projets est disponible à partir du plan Pro.")
      return
    }
    const labels = { active: "réactiver", completed: "terminer", cancelled: "annuler" }
    if (!window.confirm(`Voulez-vous ${labels[nextStatus] || "modifier"} ce projet ?`)) return

    setProcessing(true)
    try {
      await updateManagerProjectStatus(project.id, nextStatus)
      toast.success(nextStatus === "completed" ? t("manager.projectCompleted") : t("manager.projectStatusUpdated"))
      await load()
    } catch (error) {
      toast.error(error?.message || "Impossible de modifier le statut du projet.")
    } finally {
      setProcessing(false)
    }
  }

  const sendReply = async () => {
    const message = reply.trim()
    if (!message || !request?.client_id) return

    setProcessing(true)
    try {
      const conversationId = await createDirectConversation(request.client_id, request.talent_id)
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: managerId,
        body: message,
      })
      if (error) throw error
      setReply("")
      toast.success("Réponse envoyée.")
      navigate(buildMessagesUrl(conversationId))
    } catch (error) {
      toast.error(error?.message || "Impossible d'envoyer la réponse.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  if (!request) return null

  const status = STATUS[String(request.status || "").toLowerCase()] || {
    label: request.status || "—",
    className: "bg-muted text-muted-foreground",
  }
  const talentName = [talent?.first_name, talent?.last_name].filter(Boolean).join(" ") || "Talent non associé"
  const isPending = ["pending", "open"].includes(String(request.status).toLowerCase())
  const isAccepted = String(request.status).toLowerCase() === "accepted"
  const projectStatus = String(project?.status || "").toLowerCase()
  const canManageProjects = Boolean(planAccess?.can_manage_projects)

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-accent/20 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{t("requestForm.badge")}</p>
              <h1 className="text-2xl font-black tracking-tight">{request.title || t("requests.request")}</h1>
            </div>
          </div>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">{t("requests.talent")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{talentName}</p>
              {talent?.title && <p className="mt-1 text-sm text-muted-foreground">{talent.title}</p>}
              {talent?.city && <p className="mt-1 text-sm text-muted-foreground">{talent.city}</p>}
              {!talent?.id && <p className="mt-2 text-sm text-muted-foreground">Cette demande historique ne contient pas de talent associé. Les informations de la demande restent accessibles.</p>}
              {talent?.id && <Button variant="outline" size="sm" className="mt-4" asChild><Link to={`/talent/${talent.id}`}>{t("talents.viewProfile")}</Link></Button>}
            </CardContent>
          </Card>

          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">{t("requests.client")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{client?.name || t("common.clientKora")}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleMessageClient}><MessageCircle className="mr-2 h-4 w-4" /> {t("manager.clientContact")}</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-gold" /> {t("manager.projectContext")}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("projects.titleLabel")}</p><p className="mt-1 font-bold">{request.title || project?.title || "—"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("requestForm.projectType")}</p><p className="mt-1 font-bold">{request.project_type || t("common.notProvided")}</p></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("requestForm.budget")}</p><p className="mt-1 font-bold">{request.budget != null ? formatMoney(request.budget, request.currency || "XOF") : t("common.notProvided")}</p></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("requestForm.location")}</p><p className="mt-1 font-bold">{request.location || t("common.notProvided")}</p></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("requestForm.dateStart")}</p><p className="mt-1 flex items-center gap-2 font-bold"><CalendarDays className="h-4 w-4 text-gold-dark" />{formatDate(request.project_date_start)}{request.project_date_end ? ` → ${formatDate(request.project_date_end)}` : ""}</p></div>
              <div><p className="text-xs font-semibold uppercase text-muted-foreground">{t("requests.received")}</p><p className="mt-1 font-bold">{formatDateTime(request.created_at)}</p></div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t("requestForm.description")}</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{request.description || t("common.noDescription")}</p>
            </div>

            {request.additional_info && (
              <div className="rounded-xl bg-accent/30 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t("requestForm.additionalInfo")}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{request.additional_info}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {project && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-gold" /> {t("manager.projectManagement")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p className="font-bold">{project.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">Statut : {project.status || "—"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isAccepted && canManageProjects && projectStatus === "pending" && (
                    <Button onClick={() => handleProjectStatus("active")} disabled={processing}><Check className="mr-2 h-4 w-4" /> Activer</Button>
                  )}
                  {isAccepted && canManageProjects && projectStatus === "active" && (
                    <Button onClick={() => handleProjectStatus("completed")} disabled={processing} className="bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" /> {t("manager.markCompleted")}</Button>
                  )}
                  {isAccepted && canManageProjects && !["completed", "cancelled"].includes(projectStatus) && (
                    <Button variant="outline" onClick={() => handleProjectStatus("cancelled")} disabled={processing} className="text-red-600"><XCircle className="mr-2 h-4 w-4" /> Annuler</Button>
                  )}
                  {isAccepted && !canManageProjects && (
                    <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-muted-foreground">
                      La gestion du statut des projets est réservée aux plans <strong className="text-foreground">{t("subscriptions.plan")}</strong> et <strong className="text-foreground">{t("subscriptions.plan")}</strong>.
                      <Link to="/manager/subscription" className="ml-1 font-bold text-gold-dark hover:underline">{t("subscriptions.upgrade")}</Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isAccepted && (
          <Card className="border-gold/20">
            <CardHeader><CardTitle>{t("talents.contact")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t("manager.replyPlaceholder")} rows={4} disabled={processing} />
              <div className="flex justify-end">
                <Button onClick={sendReply} disabled={processing || !reply.trim()} className="gap-2"><MessageCircle className="h-4 w-4" /> {t("manager.sendReply")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div><p className="text-muted-foreground">{t("requests.request")}</p><p className="font-medium">{request.id}</p></div>
              <div><p className="text-muted-foreground">{t("requests.project")}</p><p className="font-medium">{project?.id || t("manager.createdWithRequest")}</p></div>
              <div><p className="text-muted-foreground">{t("requests.talent")}</p><p className="font-medium">{talentName}</p></div>
            </div>
            <Separator className="my-5" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => navigate("/manager/requests")}>{t("common.back")}</Button>
              {isPending && (
                <>
                  <Button variant="outline" onClick={() => handleStatus("rejected")} disabled={processing} className="text-red-600"><XCircle className="mr-2 h-4 w-4" /> {t("manager.reject")}</Button>
                  <Button onClick={() => handleStatus("accepted")} disabled={processing} className="bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" /> {t("manager.accept")}</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
