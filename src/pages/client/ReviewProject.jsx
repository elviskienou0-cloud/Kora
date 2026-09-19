import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Star, Loader2, ArrowLeft, Send, MessageSquareWarning } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"

export default function ReviewProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const clientId = user?.authId || user?.id

  const [project, setProject] = useState(null)
  const [talents, setTalents] = useState([])
  const [reviewedTalentIds, setReviewedTalentIds] = useState([])
  const [selectedTalentId, setSelectedTalentId] = useState("")
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    if (!id || !clientId) return

    let mounted = true

    async function load() {
      setLoading(true)
      setLoadError("")

      try {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id, client_id, title, status")
          .eq("id", id)
          .eq("client_id", clientId)
          .maybeSingle()

        if (projectError) throw projectError
        if (!projectData) throw new Error("Projet introuvable ou inaccessible.")

        const { data: requestRows, error: requestError } = await supabase
          .from("requests")
          .select("id, talent_id, status")
          .eq("project_id", id)
          .eq("client_id", clientId)
          .eq("status", "accepted")

        if (requestError) throw requestError

        const talentIds = [...new Set((requestRows || []).map((row) => row.talent_id).filter(Boolean))]
        let talentRows = []

        if (talentIds.length) {
          const { data, error } = await supabase
            .from("talent_profiles")
            .select("id, first_name, last_name, title")
            .in("id", talentIds)
          if (error) throw error
          talentRows = data || []
        }

        let reviewedIds = []
        if (talentIds.length) {
          const { data, error } = await supabase
            .from("reviews")
            .select("talent_id")
            .eq("project_id", id)
            .eq("client_id", clientId)
            .eq("source", "project_review")
            .in("talent_id", talentIds)
          if (error) throw error
          reviewedIds = [...new Set((data || []).map((row) => row.talent_id).filter(Boolean))]
        }

        if (!mounted) return

        setProject(projectData)
        setTalents(talentRows)
        setReviewedTalentIds(reviewedIds)

        const firstEligible = talentRows.find((talent) => !reviewedIds.includes(talent.id))
        setSelectedTalentId(firstEligible?.id || "")
      } catch (error) {
        console.error("Erreur préparation avis :", error)
        if (mounted) setLoadError(error?.message || "Impossible de préparer l'évaluation.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [id, clientId])

  const eligibleTalents = useMemo(
    () => talents.filter((talent) => !reviewedTalentIds.includes(talent.id)),
    [talents, reviewedTalentIds]
  )

  const selectedTalent = useMemo(
    () => eligibleTalents.find((talent) => talent.id === selectedTalentId) || null,
    [eligibleTalents, selectedTalentId]
  )

  const submit = async (event) => {
    event.preventDefault()

    if (!selectedTalentId) {
      toast.error("Aucun talent éligible à évaluer.")
      return
    }
    if (!rating) {
      toast.error("Choisissez une note de 1 à 5.")
      return
    }
    if (!comment.trim()) {
      toast.error("Ajoutez un commentaire.")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.rpc("create_project_review", {
        p_project_id: id,
        p_talent_id: selectedTalentId,
        p_rating: rating,
        p_comment: comment.trim(),
      })

      if (error) throw error

      toast.success("Évaluation enregistrée ✅")
      navigate(`/client/projects/${id}`)
    } catch (error) {
      console.error("Erreur création avis :", error)
      toast.error(error?.message || "Impossible d'enregistrer l'avis.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  if (loadError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardContent className="p-8 text-center space-y-4">
            <MessageSquareWarning className="mx-auto h-10 w-10 text-gold" />
            <h1 className="text-xl font-black">Évaluation indisponible</h1>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button onClick={() => navigate(`/client/projects/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour au projet</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) return null

  if (project.status !== "completed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-xl w-full border-gold/20">
          <CardContent className="p-8 text-center space-y-4">
            <Badge variant="outline" className="mx-auto">Statut : {project.status || "—"}</Badge>
            <h1 className="text-xl font-black">Le projet n'est pas encore terminé</h1>
            <p className="text-sm text-muted-foreground">
              La note et l'avis deviennent disponibles lorsque le manager marque ce projet comme terminé.
            </p>
            <Button onClick={() => navigate(`/client/projects/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour au projet</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (eligibleTalents.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-xl w-full border-border/60">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-xl font-black">Aucun avis à publier</h1>
            <p className="text-sm text-muted-foreground">
              Tous les talents rattachés à ce projet ont déjà été évalués, ou aucun talent n'est actuellement éligible.
            </p>
            <Button onClick={() => navigate(`/client/projects/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour au projet</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-accent/30 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Réputation KORA</p>
            <h1 className="text-2xl font-black tracking-tight">Évaluer le projet</h1>
          </div>
        </div>

        <Card className="border-gold/20">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription className="mt-1">Projet terminé — votre avis sera rattaché au projet et au talent choisi.</CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">Terminé</Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-black">Votre évaluation</CardTitle>
            <CardDescription>Une note de 1 à 5 et un commentaire sont requis.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="talent">Talent évalué</Label>
                <select id="talent" value={selectedTalentId} onChange={(event) => setSelectedTalentId(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" disabled={saving}>
                  {eligibleTalents.map((talent) => (
                    <option key={talent.id} value={talent.id}>
                      {[talent.first_name, talent.last_name].filter(Boolean).join(" ") || talent.title || "Talent"}
                    </option>
                  ))}
                </select>
                {selectedTalent && <p className="text-xs text-muted-foreground">{selectedTalent.title || "Talent KORA"}</p>}
              </div>

              <div className="space-y-2">
                <Label>Note</Label>
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1
                    const active = (hoverRating || rating) >= value
                    return (
                      <button key={value} type="button" aria-label={`${value} étoile${value > 1 ? "s" : ""}`} onMouseEnter={() => setHoverRating(value)} onClick={() => setRating(value)} className="rounded-md p-1.5 transition-transform hover:scale-110">
                        <Star className={active ? "h-8 w-8 fill-amber-400 text-amber-400" : "h-8 w-8 text-muted-foreground/40"} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-comment">Commentaire</Label>
                <Textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Partagez votre expérience avec ce talent…" maxLength={3000} className="min-h-36" disabled={saving} />
                <p className="text-right text-[11px] text-muted-foreground">{comment.length}/3000</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>Annuler</Button>
                <Button type="submit" className="gap-2 gold-gradient text-white" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {saving ? "Enregistrement…" : "Publier mon avis"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
