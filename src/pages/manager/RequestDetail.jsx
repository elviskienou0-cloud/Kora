import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, MessageCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { updateRequestStatus } from "@/lib/requestInvitations"
import { buildMessagesUrl, createDirectConversation } from "@/lib/messaging"

const STATUS = {
  pending: { label: "En attente", className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  open: { label: "En attente", className: "border-amber-500/30 bg-amber-500/10 text-amber-700" },
  accepted: { label: "Acceptée", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" },
  rejected: { label: "Refusée", className: "border-red-500/30 bg-red-500/10 text-red-700" },
}

function formatMoney(value, currency) {
  if (value == null) return "—"
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "XOF", maximumFractionDigits: 0 }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency || "XOF"}`
  }
}

export default function ManagerRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const managerId = user?.authId || user?.id

  const [request, setRequest] = useState(null)
  const [project, setProject] = useState(null)
  const [talent, setTalent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async () => {
    if (!id || !managerId) return
    setLoading(true)
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, client_id, manager_id, talent_id, project_id, title, description, budget, currency, status, created_at, updated_at")
      .eq("id", id)
      .eq("manager_id", managerId)
      .maybeSingle()

    if (requestError) {
      console.error(requestError)
      toast.error(requestError.message || "Impossible de charger la demande.")
      navigate("/manager/requests", { replace: true })
      return
    }

    if (!requestData) {
      toast.error("Demande introuvable ou inaccessible.")
      navigate("/manager/requests", { replace: true })
      return
    }

    const [{ data: projectData }, { data: talentData }] = await Promise.all([
      supabase.from("projects").select("id, client_id, manager_id, title, description, budget_min, budget_max, currency, status, due_date, created_at, updated_at").eq("id", requestData.project_id).maybeSingle(),
      supabase.from("talent_profiles").select("id, first_name, last_name, title, bio, city, daily_rate, currency, rating, reviews_count, verified, available").eq("id", requestData.talent_id).maybeSingle(),
    ])

    setRequest(requestData)
    setProject(projectData || null)
    setTalent(talentData || null)
    setLoading(false)
  }, [id, managerId, navigate])

  useEffect(() => {
    load()
  }, [load])

  const handleMessageClient = async () => {
    if (!request?.client_id) return

    try {
      const conversationId = await createDirectConversation(request.client_id)
      navigate(buildMessagesUrl(conversationId))
    } catch (error) {
      console.error("Erreur ouverture conversation client :", error)
      toast.error(error?.message || "Impossible d'ouvrir la conversation")
    }
  }

  const handleStatus = async (status) => {
    if (!request) return
    const action = status === "accepted" ? "accepter" : "refuser"
    if (!window.confirm(`Voulez-vous ${action} cette demande ?`)) return

    setProcessing(true)
    try {
      await updateRequestStatus(request.id, status)
      toast.success(status === "accepted" ? "Demande acceptée." : "Demande refusée.")
      await load()
    } catch (error) {
      console.error(error)
      toast.error(error?.message || "Impossible de traiter la demande.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  if (!request) return null

  const status = STATUS[String(request.status || "").toLowerCase()] || { label: request.status || "—", className: "bg-muted text-muted-foreground" }
  const talentName = [talent?.first_name, talent?.last_name].filter(Boolean).join(" ") || "Talent"
  const isPending = ["pending", "open"].includes(String(request.status).toLowerCase())

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-accent/20 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Demande</p>
              <h1 className="text-2xl font-black tracking-tight">{request.title || "Invitation"}</h1>
            </div>
          </div>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">Talent concerné</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{talentName}</p>
              {talent?.title && <p className="mt-1 text-sm text-muted-foreground">{talent.title}</p>}
              {talent?.city && <p className="mt-1 text-sm text-muted-foreground">{talent.city}</p>}
              <Button variant="outline" size="sm" className="mt-4" asChild><Link to={`/talent/${talent?.id}`}>Voir la fiche talent</Link></Button>
            </CardContent>
          </Card>

          <Card className="border-gold/15">
            <CardHeader><CardTitle className="text-base">Projet</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{project?.title || "Projet"}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{project?.description || "Aucune description."}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span>Budget demande : <strong>{request.budget != null ? formatMoney(request.budget, request.currency || project?.currency) : "—"}</strong></span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4 text-gold-dark" /> {project?.due_date ? new Date(`${project.due_date}T00:00:00`).toLocaleDateString("fr-FR") : "Sans date limite"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gold/20">
          <CardHeader><CardTitle>Description de l'invitation</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{request.description || "Aucun message complémentaire."}</p></CardContent>
        </Card>

        <Card className="border-gold/15">
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div><p className="text-muted-foreground">Reçue le</p><p className="font-medium">{new Date(request.created_at).toLocaleString("fr-FR")}</p></div>
              <div><p className="text-muted-foreground">Projet</p><p className="font-medium">{project?.title || "—"}</p></div>
              <div><p className="text-muted-foreground">Talent</p><p className="font-medium">{talentName}</p></div>
            </div>
            <Separator className="my-5" />
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={handleMessageClient}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Contacter le client
              </Button>
              <Button variant="outline" onClick={() => navigate("/manager/requests")}>Retour aux demandes</Button>
              {isPending && (
                <>
                  <Button variant="outline" onClick={() => handleStatus("rejected")} disabled={processing} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Refuser
                  </Button>
                  <Button onClick={() => handleStatus("accepted")} disabled={processing} className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Accepter
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
