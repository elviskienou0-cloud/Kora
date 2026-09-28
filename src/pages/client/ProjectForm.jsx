import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"

const CURRENCIES = ["XOF", "XAF", "GHS", "NGN", "KES", "USD", "EUR"]
const EMPTY_FORM = {
  title: "",
  description: "",
  budget_min: "",
  budget_max: "",
  currency: "XOF",
  due_date: "",
  status: "open",
}

function normalizeForm(data) {
  return {
    title: data?.title || "",
    description: data?.description || "",
    budget_min: data?.budget_min ?? "",
    budget_max: data?.budget_max ?? "",
    currency: data?.currency || "XOF",
    due_date: data?.due_date || "",
    status: data?.status || "open",
  }
}

export default function ProjectForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const authUserId = user?.authId || user?.id

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing || !authUserId) return

    let cancelled = false

    const loadProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, client_id, manager_id, title, description, budget_min, budget_max, currency, status, due_date, created_at, updated_at")
        .eq("id", id)
        .eq("client_id", authUserId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error("Erreur chargement projet :", error)
        toast.error("Impossible de charger ce projet.")
        navigate("/client/projects", { replace: true })
        return
      }

      if (!data) {
        toast.error("Projet introuvable ou inaccessible.")
        navigate("/client/projects", { replace: true })
        return
      }

      setForm(normalizeForm(data))
      setLoading(false)
    }

    loadProject()

    return () => {
      cancelled = true
    }
  }, [editing, id, authUserId, navigate])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!authUserId) {
      toast.error("Connexion requise.")
      navigate("/login")
      return
    }

    const title = form.title.trim()
    const description = form.description.trim()
    const min = form.budget_min === "" ? null : Number(form.budget_min)
    const max = form.budget_max === "" ? null : Number(form.budget_max)

    if (!title) {
      toast.error("Le titre du projet est obligatoire.")
      return
    }

    if (!description) {
      toast.error("La description du projet est obligatoire.")
      return
    }

    if (min !== null && (!Number.isFinite(min) || min < 0)) {
      toast.error("Le budget minimum est invalide.")
      return
    }

    if (max !== null && (!Number.isFinite(max) || max < 0)) {
      toast.error("Le budget maximum est invalide.")
      return
    }

    if (min !== null && max !== null && min > max) {
      toast.error("Le budget minimum ne peut pas dépasser le maximum.")
      return
    }

    setSaving(true)

    try {
      const payload = {
        title,
        description,
        budget_min: min,
        budget_max: max,
        currency: form.currency,
        due_date: form.due_date || null,
      }

      if (editing) {
        // Le statut d'un projet existant est piloté par le workflow KORA/RPC.

        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", id)
          .eq("client_id", authUserId)

        if (error) throw error

        toast.success("Projet modifié ✅")
        navigate(`/client/projects/${id}`)
      } else {
        const createPayload = {
          ...payload,
          client_id: authUserId,
          manager_id: null,
          status: "open",
        }

        const { data, error } = await supabase
          .from("projects")
          .insert(createPayload)
          .select("id")
          .single()

        if (error) throw error

        toast.success("Projet enregistré ✅")
        navigate(`/client/projects/${data.id}`)
      }
    } catch (error) {
      console.error("Erreur enregistrement projet :", error)
      toast.error(error?.message || "Impossible d'enregistrer le projet.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-label="Chargement" />
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-accent/30 via-background to-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Projets</p>
            <h1 className="text-2xl font-black tracking-tight">
              {editing ? "Modifier le projet" : "Nouveau projet"}
            </h1>
          </div>
        </div>

        <Card className="border-gold/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Informations du projet</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Définissez précisément le besoin, le budget et la date limite.
                </p>
              </div>
              {editing && (
                <Badge variant="outline" className="capitalize border-gold/30 text-gold-dark">
                  {form.status}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="project-title">Titre</Label>
                  <Input
                    id="project-title"
                    value={form.title}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder="Ex. Refonte du site web KORA"
                    maxLength={160}
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    placeholder="Décrivez le contexte, les objectifs, les livrables et les attentes."
                    className="min-h-36"
                    maxLength={5000}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-min">Budget minimum</Label>
                  <Input
                    id="budget-min"
                    type="number"
                    min="0"
                    step="1"
                    value={form.budget_min}
                    onChange={(event) => setField("budget_min", event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-max">Budget maximum</Label>
                  <Input
                    id="budget-max"
                    type="number"
                    min="0"
                    step="1"
                    value={form.budget_max}
                    onChange={(event) => setField("budget_max", event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <select
                    id="currency"
                    value={form.currency}
                    onChange={(event) => setField("currency", event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gold-dark" />
                    Date limite
                  </Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={form.due_date}
                    onChange={(event) => setField("due_date", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>État</Label>
                  <div className="h-10 flex items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-semibold capitalize text-muted-foreground">
                    {form.status || "open"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    L'état est géré automatiquement par le processus KORA.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving} className="gold-gradient text-primary-foreground">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editing ? "Enregistrer les modifications" : "Créer le projet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
