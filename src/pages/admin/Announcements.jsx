import { useCallback, useEffect, useState } from "react"
import { Edit3, Loader2, Megaphone, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

const emptyForm = {
  title: "",
  content: "",
  starts_at: "",
  ends_at: "",
  is_published: true,
}

function toLocalInput(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toIso(value) {
  if (!value) return null
  // value is "YYYY-MM-DD" from a <input type="date">; anchor at local midnight.
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function formatDate(value) {
  if (!value) return "Aucune"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR")
}

function statusLabel(item) {
  const now = Date.now()
  const start = item.starts_at ? new Date(item.starts_at).getTime() : null
  const end = item.ends_at ? new Date(item.ends_at).getTime() : null

  if (!item.is_published) return "Brouillon"
  if (start && start > now) return "Programmée"
  if (end && end < now) return "Expirée"
  return "Active"
}

export default function AdminAnnouncements() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")

    const { data, error: queryError } = await supabase
      .from("announcements")
      .select("id,title,content,is_published,starts_at,ends_at,created_at,updated_at")
      .order("created_at", { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setItems([])
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim() && !form.content.trim()) {
      toast.error("Ajoute un titre ou un message.")
      return
    }

    setSaving(true)

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      is_published: form.is_published,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
    }

    let result
    if (editingId) {
      result = await supabase
        .from("announcements")
        .update(payload)
        .eq("id", editingId)
    } else {
      const { data: userData } = await supabase.auth.getUser()
      result = await supabase
        .from("announcements")
        .insert({
          ...payload,
          created_by: userData?.user?.id || null,
        })
    }

    if (result.error) {
      toast.error("Impossible d'enregistrer l'annonce.", {
        description: result.error.message,
      })
    } else {
      toast.success(editingId ? "Annonce modifiée." : "Annonce publiée.")
      resetForm()
      await load()
    }

    setSaving(false)
  }

  const edit = (item) => {
    setEditingId(item.id)
    setForm({
      title: item.title || "",
      content: item.content || "",
      starts_at: toLocalInput(item.starts_at),
      ends_at: toLocalInput(item.ends_at),
      is_published: !!item.is_published,
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const togglePublished = async (item) => {
    const { error: updateError } = await supabase
      .from("announcements")
      .update({ is_published: !item.is_published })
      .eq("id", item.id)

    if (updateError) {
      toast.error("Impossible de modifier l'annonce.", {
        description: updateError.message,
      })
    } else {
      toast.success(item.is_published ? "Annonce masquée." : "Annonce activée.")
      await load()
    }
  }

  const remove = async (item) => {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return

    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", item.id)

    if (deleteError) {
      toast.error("Impossible de supprimer l'annonce.", {
        description: deleteError.message,
      })
    } else {
      toast.success("Annonce supprimée.")
      if (editingId === item.id) resetForm()
      await load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Annonces KORA</h1>
        <p className="text-sm text-muted-foreground">
          Les messages publiés s'affichent dans le bandeau défilant de l'application.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-gold-dark" />
            {editingId ? "Modifier l'annonce" : "Nouvelle annonce"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                value={form.title}
                onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
                placeholder="Titre — ex. Offre Premium"
                maxLength={120}
              />
              <Input
                value={form.content}
                onChange={(e) => setForm((v) => ({ ...v, content: e.target.value }))}
                placeholder="Message à faire défiler..."
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-sm font-semibold">
                Début
                <input
                  type="date"
                  value={form.starts_at}
                  onChange={(e) => setForm((v) => ({ ...v, starts_at: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="text-sm font-semibold">
                Fin
                <input
                  type="date"
                  value={form.ends_at}
                  onChange={(e) => setForm((v) => ({ ...v, ends_at: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((v) => ({ ...v, is_published: e.target.checked }))}
                />
                Afficher maintenant
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Enregistrer les modifications" : "Publier l'annonce"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Annonces existantes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{items.length} annonce(s)</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="p-5 text-sm text-red-700">{error}</div>
          ) : loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Aucune annonce pour le moment.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black">{item.title || "Annonce KORA"}</p>
                      <Badge variant="outline">{statusLabel(item)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Du {formatDate(item.starts_at)} · au {formatDate(item.ends_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => togglePublished(item)}>
                      {item.is_published ? "Masquer" : "Afficher"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => edit(item)} className="gap-1">
                      <Edit3 className="h-4 w-4" /> Modifier
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove(item)} className="gap-1 text-red-700">
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}