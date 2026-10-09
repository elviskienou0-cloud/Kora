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
import { useI18n } from "@/i18n/kora-i18n.jsx"

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
  const { t } = useI18n()
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
        toast.error(t("clientUi.projects.loadError"))
        navigate("/client/projects", { replace: true })
        return
      }

      if (!data) {
        toast.error(t("clientUi.projects.projectNotFound"))
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
  }, [editing, id, authUserId, navigate, t])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!authUserId) {
      toast.error(t("errors.unauthorized"))
      navigate("/login")
      return
    }

    const title = form.title.trim()
    const description = form.description.trim()
    const min = form.budget_min === "" ? null : Number(form.budget_min)
    const max = form.budget_max === "" ? null : Number(form.budget_max)

    if (!title) {
      toast.error(t("clientUi.projects.titleRequired"))
      return
    }

    if (!description) {
      toast.error(t("clientUi.projects.descriptionRequired"))
      return
    }

    if (min !== null && (!Number.isFinite(min) || min < 0)) {
      toast.error(t("clientUi.projects.minBudgetInvalid"))
      return
    }

    if (max !== null && (!Number.isFinite(max) || max < 0)) {
      toast.error(t("clientUi.projects.maxBudgetInvalid"))
      return
    }

    if (min !== null && max !== null && min > max) {
      toast.error(t("clientUi.projects.budgetRangeInvalid"))
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

        toast.success(t("clientUi.projects.updated"))
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

        toast.success(t("clientUi.projects.created"))
        navigate(`/client/projects/${data.id}`)
      }
    } catch (error) {
      console.error("Erreur enregistrement projet :", error)
      console.error("KORA: project save failed", error)
      toast.error(t("clientUi.projects.saveError"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-gold" aria-label={t("clientUi.projects.loading")} />
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{t("projects.title")}</p>
            <h1 className="text-2xl font-black tracking-tight">
              {editing ? t("clientUi.projects.edit") : t("clientUi.projects.newProject")}
            </h1>
          </div>
        </div>

        <Card className="border-gold/20 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{t("clientUi.projects.projectInfo")}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("clientUi.projects.formDescription")}
                </p>
              </div>
              {editing && (
                <Badge variant="outline" className="capitalize border-gold/30 text-gold-dark">
                  {t(({ draft: "projects.draft", open: "projects.open", pending: "projects.pending", active: "projects.active", completed: "projects.completed", cancelled: "projects.cancelled" })[form.status] || "projects.status")}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="project-title">{t("clientUi.projects.titleLabel")}</Label>
                  <Input
                    id="project-title"
                    value={form.title}
                    onChange={(event) => setField("title", event.target.value)}
                    placeholder={t("clientUi.projects.titlePlaceholder")}
                    maxLength={160}
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="project-description">{t("clientUi.projects.descriptionLabel")}</Label>
                  <Textarea
                    id="project-description"
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    placeholder={t("clientUi.projects.descriptionPlaceholder")}
                    className="min-h-36"
                    maxLength={5000}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget-min">{t("clientUi.projects.minBudget")}</Label>
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
                  <Label htmlFor="budget-max">{t("clientUi.projects.maxBudget")}</Label>
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
                  <Label htmlFor="currency">{t("clientUi.projects.currency")}</Label>
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
                    {t("clientUi.projects.dueDate")}
                  </Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={form.due_date}
                    onChange={(event) => setField("due_date", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("clientUi.projects.status")}</Label>
                  <div className="h-10 flex items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-semibold capitalize text-muted-foreground">
                    {form.status || "open"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("clientUi.projects.managedStatus")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  {t("clientUi.projects.cancel")}
                </Button>
                <Button type="submit" disabled={saving} className="gold-gradient text-primary-foreground">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saving ? t("common.saving") : editing ? t("clientUi.projects.saveChanges") : t("clientUi.projects.create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
