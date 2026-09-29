import { useEffect, useMemo, useState } from "react"
import { Loader2, ShieldCheck, Save, UserCog } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

const PERMISSIONS = [
  ["users.read", "Voir les utilisateurs"],
  ["managers.read", "Voir les managers"],
  ["clients.read", "Voir les clients"],
  ["talents.read", "Voir les talents"],
  ["requests.read", "Voir les demandes"],
  ["projects.read", "Voir les projets"],
  ["messages.read", "Accéder aux messages"],
  ["moderation.read", "Modération"],
  ["payments.read", "Voir les paiements"],
  ["payments.validate", "Valider / rejeter les paiements"],
  ["subscriptions.read", "Voir les abonnements"],
  ["subscriptions.manage", "Gérer les abonnements"],
  ["announcements.write", "Publier des annonces"],
  ["notifications.write", "Envoyer des notifications"],
  ["logs.read", "Voir les logs autorisés"],
  ["settings.read", "Voir les paramètres autorisés"],
]

export default function AdminAdministrators() {
  const [admins, setAdmins] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const selected = useMemo(
    () => admins.find((item) => item.user_id === selectedId) || null,
    [admins, selectedId]
  )

  async function load() {
    setLoading(true)
    setMessage("")
    const { data, error } = await supabase.rpc("list_admin_access_profiles")
    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }
    setAdmins(data || [])
    if (!selectedId && data?.[0]?.user_id) setSelectedId(data[0].user_id)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!selected) {
      setDraft(null)
      return
    }
    setDraft({
      access_level: selected.access_level,
      permissions: selected.permissions || {},
      max_users: selected.max_users ?? "",
      max_payment_validations: selected.max_payment_validations ?? "",
      access_expires_at: selected.access_expires_at
        ? selected.access_expires_at.slice(0, 16)
        : "",
      is_active: selected.is_active !== false,
    })
  }, [selected])

  const togglePermission = (key) => {
    setDraft((current) => ({
      ...current,
      permissions: {
        ...(current?.permissions || {}),
        [key]: !current?.permissions?.[key],
      },
    }))
  }

  const save = async () => {
    if (!selected || !draft) return
    setSaving(true)
    setMessage("")

    const { error } = await supabase.rpc("set_admin_access_profile", {
      p_user_id: selected.user_id,
      p_access_level: draft.access_level,
      p_permissions: draft.permissions,
      p_max_users: draft.max_users === "" ? null : Number(draft.max_users),
      p_max_payment_validations:
        draft.max_payment_validations === ""
          ? null
          : Number(draft.max_payment_validations),
      p_access_expires_at: draft.access_expires_at
        ? new Date(draft.access_expires_at).toISOString()
        : null,
      p_scope: selected.scope || {},
      p_is_active: draft.is_active,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Configuration enregistrée.")
      await load()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement des administrateurs…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-gold font-semibold">Contrôle CEO</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Admins & associés</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Le tableau de bord CEO reste inchangé. Cette section permet uniquement de définir le niveau et les permissions des autres comptes administrateurs.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">{message}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Administrateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {admins.map((admin) => (
              <button
                key={admin.user_id}
                type="button"
                onClick={() => setSelectedId(admin.user_id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedId === admin.user_id
                    ? "border-gold/60 bg-accent"
                    : "border-border hover:bg-accent/50"
                }`}
              >
                <div className="font-semibold truncate">{admin.name || "Administrateur"}</div>
                <div className="text-xs text-muted-foreground truncate">{admin.email || "Email non disponible"}</div>
                <Badge variant="outline" className="mt-2 text-[10px]">
                  {admin.access_level === "super_admin" ? "Super Admin" : "Associé"}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected && draft && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{selected.name || "Administrateur"}</span>
                <Badge variant={draft.access_level === "super_admin" ? "default" : "outline"}>
                  {draft.access_level === "super_admin" ? "Super Admin" : "Admin associé"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Le compte CEO actuel n'est pas reconfigurable depuis cette section.
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Niveau</label>
                <select
                  value={draft.access_level}
                  onChange={(e) => setDraft({ ...draft, access_level: e.target.value })}
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="associate">Admin associé</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {draft.access_level === "associate" && (
                <>
                  <div>
                    <h3 className="font-semibold">Permissions</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {PERMISSIONS.map(([key, label]) => (
                        <label key={key} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(draft.permissions?.[key])}
                            onChange={() => togglePermission(key)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm">
                      <span className="font-semibold">Utilisateurs maximum</span>
                      <input
                        type="number"
                        min="0"
                        value={draft.max_users}
                        onChange={(e) => setDraft({ ...draft, max_users: e.target.value })}
                        placeholder="Illimité"
                        className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="font-semibold">Validations de paiement maximum</span>
                      <input
                        type="number"
                        min="0"
                        value={draft.max_payment_validations}
                        onChange={(e) => setDraft({ ...draft, max_payment_validations: e.target.value })}
                        placeholder="Illimité"
                        className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                      />
                    </label>
                  </div>

                  <label className="text-sm">
                    <span className="font-semibold">Expiration de l'accès</span>
                    <input
                      type="datetime-local"
                      value={draft.access_expires_at}
                      onChange={(e) => setDraft({ ...draft, access_expires_at: e.target.value })}
                      className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                    />
                  </label>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                    />
                    Accès administrateur actif
                  </label>
                </>
              )}

              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer la configuration
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
