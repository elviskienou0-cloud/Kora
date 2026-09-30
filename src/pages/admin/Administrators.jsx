import { useEffect, useMemo, useState } from "react"
import {
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserCog,
  UserPlus,
  X,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

const PERMISSIONS = [
  ["users.read", "Voir les utilisateurs"],
  ["users.manage", "Gérer les utilisateurs"],
  ["managers.read", "Voir les managers"],
  ["clients.read", "Voir les clients"],
  ["talents.read", "Voir les talents"],
  ["talents.manage", "Modérer les talents"],
  ["requests.read", "Voir les demandes"],
  ["projects.read", "Voir les projets"],
  ["messages.read", "Accéder aux messages"],
  ["moderation.read", "Voir la modération"],
  ["moderation.manage", "Traiter les signalements"],
  ["payments.read", "Voir les paiements"],
  ["payments.validate", "Valider / rejeter les paiements"],
  ["subscriptions.read", "Voir les abonnements"],
  ["subscriptions.manage", "Gérer les abonnements"],
  ["announcements.write", "Publier des annonces"],
  ["notifications.write", "Envoyer des notifications"],
  ["logs.read", "Voir les logs autorisés"],
  ["settings.read", "Voir les paramètres autorisés"],
]

const DEFAULT_MESSAGE = `Bonjour,

Vous êtes invité(e) à rejoindre l'équipe d'administration de KORA.

Votre accès sera configuré par le CEO selon les responsabilités qui vous seront confiées.

Bienvenue dans l'équipe KORA.`

function formatDate(value) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

async function readFunctionError(error, data) {
  if (data?.error) return data.error
  try {
    const body = await error?.context?.json?.()
    if (body?.error) return body.error
  } catch {
    /* corps illisible */
  }
  return error?.message || "Impossible d'envoyer l'invitation."
}

export default function AdminAdministrators() {
  const [admins, setAdmins] = useState([])
  const [invitations, setInvitations] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteMessage, setInviteMessage] = useState(null)
  const [message, setMessage] = useState("")

  const [inviteForm, setInviteForm] = useState({
    email: "",
    message: DEFAULT_MESSAGE,
    permissions: {
      "users.read": true,
      "managers.read": true,
      "talents.read": true,
      "requests.read": true,
      "projects.read": true,
    },
    max_users: "",
    max_payment_validations: "",
    access_expires_at: "",
  })

  const selected = useMemo(
    () => admins.find((item) => item.user_id === selectedId) || null,
    [admins, selectedId]
  )

  async function load() {
    setLoading(true)
    setMessage("")

    const [adminsResult, invitationsResult] = await Promise.all([
      supabase.rpc("list_admin_access_profiles"),
      supabase
        .from("admin_invitations")
        .select(
          "id,email,message,access_level,permissions,max_users,max_payment_validations,access_expires_at,status,created_at,accepted_at"
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    if (adminsResult.error) {
      setMessage(adminsResult.error.message)
      setLoading(false)
      return
    }

    setAdmins(adminsResult.data || [])

    if (!invitationsResult.error) {
      setInvitations(invitationsResult.data || [])
    }

    if (!selectedId && adminsResult.data?.[0]?.user_id) {
      setSelectedId(adminsResult.data[0].user_id)
    }

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

  const toggleInvitePermission = (key) => {
    setInviteForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [key]: !current.permissions[key],
      },
    }))
  }

  const save = async () => {
    if (!selected || !draft || selected.access_level === "super_admin") return

    setSaving(true)
    setMessage("")

    const { error } = await supabase.rpc("set_admin_access_profile", {
      p_user_id: selected.user_id,
      p_access_level: draft.access_level,
      p_permissions: draft.permissions,
      p_max_users:
        draft.max_users === "" ? null : Number(draft.max_users),
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

  const inviteAdmin = async () => {
    if (!inviteForm.email.trim()) {
      setInviteMessage({ type: "error", text: "Veuillez saisir une adresse email." })
      return
    }

    setInviting(true)
    setInviteMessage(null)
    setMessage("")

    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: {
        action: "invite",
        email: inviteForm.email.trim(),
        message: inviteForm.message.trim(),
        access_level: "associate",
        permissions: inviteForm.permissions,
        max_users:
          inviteForm.max_users === ""
            ? null
            : Number(inviteForm.max_users),
        max_payment_validations:
          inviteForm.max_payment_validations === ""
            ? null
            : Number(inviteForm.max_payment_validations),
        access_expires_at: inviteForm.access_expires_at
          ? new Date(inviteForm.access_expires_at).toISOString()
          : null,
        redirect_to: window.location.origin,
      },
    })

    if (error || data?.error) {
      setInviteMessage({ type: "error", text: await readFunctionError(error, data) })
      setInviting(false)
      return
    }

    setMessage("Invitation envoyée par email. Le compte est préparé comme Admin associé.")
    setInviteForm({
      email: "",
      message: DEFAULT_MESSAGE,
      permissions: {
        "users.read": true,
        "managers.read": true,
        "talents.read": true,
        "requests.read": true,
        "projects.read": true,
      },
      max_users: "",
      max_payment_validations: "",
      access_expires_at: "",
    })
    setInviteMessage(null)
    setShowInvite(false)
    await load()
    setInviting(false)
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold font-semibold">
              Contrôle CEO
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Admins & associés
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Invitez les personnes qui doivent travailler sur KORA et définissez précisément leurs accès.
            </p>
          </div>

          <Button
            onClick={() => setShowInvite(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un administrateur
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          {message}
        </div>
      )}

      {showInvite && (
        <Card className="border-gold/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Inviter un administrateur
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInvite(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="font-semibold">Email professionnel</span>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  placeholder="administrateur@entreprise.com"
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                />
              </label>

              <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                <div className="font-semibold">Niveau attribué</div>
                <div className="mt-1 text-muted-foreground">
                  Administrateur associé
                </div>
              </div>
            </div>

            <label className="block text-sm">
              <span className="font-semibold">Message envoyé avec l'invitation</span>
              <textarea
                value={inviteForm.message}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, message: e.target.value })
                }
                rows={5}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3"
              />
            </label>

            <div>
              <h3 className="font-semibold">Permissions initiales</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PERMISSIONS.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(inviteForm.permissions[key])}
                      onChange={() => toggleInvitePermission(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className="font-semibold">Utilisateurs maximum</span>
                <input
                  type="number"
                  min="0"
                  value={inviteForm.max_users}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      max_users: e.target.value,
                    })
                  }
                  placeholder="Illimité"
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                />
              </label>

              <label className="text-sm">
                <span className="font-semibold">
                  Validations de paiement maximum
                </span>
                <input
                  type="number"
                  min="0"
                  value={inviteForm.max_payment_validations}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      max_payment_validations: e.target.value,
                    })
                  }
                  placeholder="Illimité"
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                />
              </label>

              <label className="text-sm">
                <span className="font-semibold">Expiration de l'accès</span>
                <input
                  type="datetime-local"
                  value={inviteForm.access_expires_at}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      access_expires_at: e.target.value,
                    })
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                />
              </label>
            </div>

            {inviteMessage && (
              <div
                role="alert"
                className={`rounded-xl border p-3 text-sm ${
                  inviteMessage.type === "error"
                    ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                    : "border-emerald-500/40 bg-emerald-500/10"
                }`}
              >
                {inviteMessage.text}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={inviteAdmin} disabled={inviting} className="gap-2">
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {inviting ? "Envoi…" : "Envoyer l'invitation"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowInvite(false)}
                disabled={inviting}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
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
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">
                    {admin.name || "Administrateur"}
                  </div>

                  <Badge
                    variant={
                      admin.access_level === "super_admin"
                        ? "default"
                        : "outline"
                    }
                  >
                    {admin.access_level === "super_admin"
                      ? "Super Admin"
                      : "Associé"}
                  </Badge>
                </div>

                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {admin.email || "Email non disponible"}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {admin.is_active ? "Accès actif" : "Accès désactivé"}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected && draft && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <div>
                  <div>{selected.name || "Administrateur"}</div>
                  <div className="mt-1 text-sm font-normal text-muted-foreground">
                    {selected.email || "Email non disponible"}
                  </div>
                </div>

                <Badge
                  variant={
                    draft.access_level === "super_admin"
                      ? "default"
                      : "outline"
                  }
                >
                  {draft.access_level === "super_admin"
                    ? "Super Admin"
                    : "Admin associé"}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {selected.access_level === "super_admin" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Super Admin
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    Ce compte possède tous les droits CEO. Il n'est pas
                    reconfigurable depuis cette section.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold">Permissions</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {PERMISSIONS.map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"
                        >
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
                      <span className="font-semibold">
                        Utilisateurs maximum
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={draft.max_users}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            max_users: e.target.value,
                          })
                        }
                        placeholder="Illimité"
                        className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                      />
                    </label>

                    <label className="text-sm">
                      <span className="font-semibold">
                        Validations de paiement maximum
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={draft.max_payment_validations}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            max_payment_validations: e.target.value,
                          })
                        }
                        placeholder="Illimité"
                        className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="font-semibold">
                      Expiration de l'accès
                    </span>
                    <input
                      type="datetime-local"
                      value={draft.access_expires_at}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          access_expires_at: e.target.value,
                        })
                      }
                      className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3"
                    />
                  </label>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          is_active: e.target.checked,
                        })
                      }
                    />
                    Accès administrateur actif
                  </label>

                  <Button onClick={save} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Enregistrer la configuration
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitations récentes
          </CardTitle>
        </CardHeader>

        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune invitation administrateur.
            </p>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-semibold">{invitation.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Envoyée le {formatDate(invitation.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {invitation.status === "pending"
                        ? "Invitation en attente"
                        : invitation.status === "accepted"
                          ? "Acceptée"
                          : invitation.status === "revoked"
                            ? "Révoquée"
                            : "Expirée"}
                    </Badge>

                    <Badge variant="outline">
                      {Object.values(invitation.permissions || {}).filter(Boolean).length} permissions
                    </Badge>
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