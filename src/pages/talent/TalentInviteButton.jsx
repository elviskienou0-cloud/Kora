import { useEffect, useState } from "react"
import { BriefcaseBusiness, Loader2, Send, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { createRequestFromTalent } from "@/lib/requestInvitations"

function formatMoney(value, currency) {
  if (value == null) return ""
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
    }).format(Number(value))
  } catch {
    return `${Number(value).toLocaleString("fr-FR")} ${currency || "XOF"}`
  }
}

function projectBudget(project) {
  if (project.budget_min == null && project.budget_max == null) return "Budget non défini"
  if (project.budget_min != null && project.budget_max != null) {
    return `${formatMoney(project.budget_min, project.currency)} — ${formatMoney(project.budget_max, project.currency)}`
  }
  if (project.budget_min != null) return `À partir de ${formatMoney(project.budget_min, project.currency)}`
  return `Jusqu'à ${formatMoney(project.budget_max, project.currency)}`
}

export default function TalentInviteButton({ talentId, talentName = "ce talent" }) {
  const { user } = useAuth()
  const authUserId = user?.authId || user?.id

  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [note, setNote] = useState("")
  const [budget, setBudget] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    if (!open || !authUserId) return

    let cancelled = false

    async function loadProjects() {
      setLoadingProjects(true)
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, description, budget_min, budget_max, currency, status, due_date")
          .eq("client_id", authUserId)
          .not("status", "in", "(completed,cancelled)")
          .order("created_at", { ascending: false })

        if (error) throw error
        if (cancelled) return

        setProjects(data || [])
        setSelectedProjectId((current) => current || data?.[0]?.id || "")
      } catch (error) {
        console.error("Erreur chargement projets pour invitation :", error)
        toast.error(error?.message || "Impossible de charger vos projets.")
        setProjects([])
      } finally {
        if (!cancelled) setLoadingProjects(false)
      }
    }

    loadProjects()
    return () => {
      cancelled = true
    }
  }, [open, authUserId])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null

  const submit = async (event) => {
    event.preventDefault()
    if (!selectedProjectId) {
      toast.error("Sélectionnez un projet.")
      return
    }

    setLoading(true)
    try {
      await createRequestFromTalent({
        talentId,
        projectId: selectedProjectId,
        title: `Invitation — ${selectedProject?.title || "Projet"}`,
        description: note.trim() || selectedProject?.description || null,
        budget: budget || null,
        currency: selectedProject?.currency || "XOF",
      })

      toast.success(`${talentName} a été invité sur le projet « ${selectedProject?.title} ».`)
      setOpen(false)
      setNote("")
      setBudget("")
    } catch (error) {
      console.error("Erreur invitation talent :", error)
      toast.error(error?.message || "Impossible d'envoyer l'invitation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-2 gold-gradient text-primary-foreground">
        <Send className="h-4 w-4" />
        Inviter à un projet
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl">
            <Card className="max-h-[90vh] overflow-y-auto border-gold/20 shadow-2xl">
              <CardHeader className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Invitation</p>
                    <CardTitle className="mt-1">Inviter {talentName}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={submit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Projet *</Label>
                    {loadingProjects ? (
                      <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Chargement de vos projets…
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gold/30 p-5 text-center">
                        <BriefcaseBusiness className="mx-auto mb-3 h-8 w-8 text-gold" />
                        <p className="text-sm font-medium">Aucun projet disponible</p>
                        <p className="mt-1 text-xs text-muted-foreground">Créez d'abord un projet depuis « Mes projets ».</p>
                      </div>
                    ) : (
                      <select
                        value={selectedProjectId}
                        onChange={(event) => setSelectedProjectId(event.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title} — {projectBudget(project)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedProject && (
                    <div className="rounded-xl bg-accent/30 p-4 text-sm">
                      <p className="font-semibold">{selectedProject.title}</p>
                      <p className="mt-1 text-muted-foreground line-clamp-3">{selectedProject.description || "Aucune description."}</p>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Budget proposé</Label>
                      <Input type="number" min="0" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Ex. 250000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Devise</Label>
                      <Input value={selectedProject?.currency || "XOF"} readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Message au manager</Label>
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Présentez brièvement le besoin ou les attentes du projet…"
                      rows={5}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={loading || loadingProjects || projects.length === 0 || !selectedProjectId} className="gold-gradient text-primary-foreground">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Envoyer l'invitation
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
