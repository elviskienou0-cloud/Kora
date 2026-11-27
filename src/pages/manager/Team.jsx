import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, MailPlus, ShieldCheck, Users, X, BarChart3 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { supabase } from "@/lib/supabase"

const EMPTY_CONTEXT = {
  can_manage_team: false,
  members: [],
  outgoing_invitations: [],
  incoming_invitations: [],
  workspaces: [],
}

export default function ManagerTeam() {
  const { user } = useAuth()
  const { language } = useI18n()
  const [context, setContext] = useState(EMPTY_CONTEXT)
  const [email, setEmail] = useState("")
  const [permissions, setPermissions] = useState({
    "analytics.read": true,
    "reports.export": false,
  })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [busyId, setBusyId] = useState("")

  const copy = language === "en" ? {
    title: "Team management",
    subtitle: "Invite KORA managers and choose which Business reports they can access.",
    incoming: "Invitations for you",
    members: "Your team",
    pending: "Pending invitations",
    workspaces: "Shared workspaces",
    invite: "Invite a collaborator",
    email: "KORA manager email",
    inviteButton: "Send invitation",
    analytics: "View advanced analytics",
    export: "Export reports",
    accept: "Accept",
    decline: "Decline",
    remove: "Remove access",
    open: "Open analytics",
    upgrade: "Business plan is required to invite and manage collaborators.",
    noIncoming: "No pending invitations.",
    noMembers: "No team members yet.",
    noPending: "No pending invitations.",
    noWorkspaces: "No shared workspaces.",
    inviteHint: "The invited person must already have an active KORA Manager account. The invitation appears in their KORA workspace; no external email is sent.",
    loadError: "Unable to load team information. The team database setup may not have been applied yet.",
  } : {
    title: "Gestion de l'équipe",
    subtitle: "Invitez des managers KORA et choisissez les rapports BUSINESS auxquels ils peuvent accéder.",
    incoming: "Invitations reçues",
    members: "Votre équipe",
    pending: "Invitations en attente",
    workspaces: "Espaces partagés",
    invite: "Inviter un collaborateur",
    email: "E-mail du compte Manager KORA",
    inviteButton: "Envoyer l'invitation",
    analytics: "Consulter les analyses avancées",
    export: "Exporter les rapports",
    accept: "Accepter",
    decline: "Refuser",
    remove: "Révoquer l'accès",
    open: "Ouvrir les analyses",
    upgrade: "Le plan BUSINESS est nécessaire pour inviter et gérer des collaborateurs.",
    noIncoming: "Aucune invitation en attente.",
    noMembers: "Aucun membre dans votre équipe.",
    noPending: "Aucune invitation en attente.",
    noWorkspaces: "Aucun espace partagé.",
    inviteHint: "Le collaborateur doit déjà posséder un compte Manager KORA actif. L'invitation apparaîtra dans son espace KORA. Aucun e-mail externe n'est envoyé.",
    loadError: "Impossible de charger les informations de l'équipe. La configuration de la base de données n'a peut-être pas encore été appliquée.",
  }

  const load = useCallback(async () => {
    if (!user?.authId) return
    setLoading(true)
    const { data, error } = await supabase.rpc("get_my_manager_team_context")
    if (error) {
      console.error("KORA team context:", error)
      toast.error(copy.loadError)
      setContext(EMPTY_CONTEXT)
    } else {
      setContext({ ...EMPTY_CONTEXT, ...(data || {}) })
    }
    setLoading(false)
  }, [user?.authId, copy.loadError])

  useEffect(() => { void load() }, [load])

  const invite = async (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      const { error } = await supabase.rpc("manager_invite_team_member", {
        p_email: email.trim(),
        p_permissions: permissions,
      })
      if (error) throw error
      toast.success(language === "en" ? "Invitation sent in KORA." : "Invitation envoyée dans KORA.")
      setEmail("")
      await load()
    } catch (error) {
      toast.error(error?.message || copy.loadError)
    } finally {
      setSending(false)
    }
  }

  const respond = async (invitationId, accept) => {
    setBusyId(invitationId)
    try {
      const { error } = await supabase.rpc(
        accept ? "manager_accept_team_invitation" : "manager_decline_team_invitation",
        { p_invitation_id: invitationId }
      )
      if (error) throw error
      toast.success(accept
        ? (language === "en" ? "Invitation accepted." : "Invitation acceptée.")
        : (language === "en" ? "Invitation declined." : "Invitation refusée."))
      await load()
    } catch (error) {
      toast.error(error?.message || copy.loadError)
    } finally {
      setBusyId("")
    }
  }

  const updatePermissions = async (member, next) => {
    setBusyId(member.id)
    try {
      const { error } = await supabase.rpc("manager_update_team_member_permissions", {
        p_member_id: member.id,
        p_permissions: next,
      })
      if (error) throw error
      toast.success(language === "en" ? "Permissions updated." : "Permissions mises à jour.")
      await load()
    } catch (error) {
      toast.error(error?.message || copy.loadError)
    } finally {
      setBusyId("")
    }
  }

  const removeMember = async (memberId) => {
    setBusyId(memberId)
    try {
      const { error } = await supabase.rpc("manager_remove_team_member", { p_member_id: memberId })
      if (error) throw error
      toast.success(language === "en" ? "Access revoked." : "Accès révoqué.")
      await load()
    } catch (error) {
      toast.error(error?.message || copy.loadError)
    } finally {
      setBusyId("")
    }
  }

  if (loading) {
    return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">KORA BUSINESS</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      {context.incoming_invitations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{copy.incoming}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {context.incoming_invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{invitation.manager_name || "Manager KORA"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(invitation.created_at).toLocaleDateString(language === "en" ? "en-GB" : "fr-FR")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void respond(invitation.id, true)} disabled={busyId === invitation.id}>{busyId === invitation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.accept}</Button>
                  <Button size="sm" variant="outline" onClick={() => void respond(invitation.id, false)} disabled={busyId === invitation.id}>{copy.decline}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {context.can_manage_team ? (
        <>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MailPlus className="h-5 w-5 text-gold" />{copy.invite}</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={invite}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="team-member-email">{copy.email}</label>
                  <Input id="team-member-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nom@exemple.com" required />
                </div>
                <div className="space-y-3 rounded-xl border p-4">
                  <p className="text-sm font-semibold">{language === "en" ? "Permissions to grant" : "Permissions à accorder"}</p>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox checked={permissions["analytics.read"]} onCheckedChange={(checked) => setPermissions((current) => ({ ...current, "analytics.read": Boolean(checked), "reports.export": checked ? current["reports.export"] : false }))} />
                    <span><span className="font-medium">{copy.analytics}</span><span className="block text-xs text-muted-foreground">{language === "en" ? "Read portfolio and performance indicators." : "Consulter les indicateurs du portefeuille et les performances."}</span></span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox checked={permissions["reports.export"]} disabled={!permissions["analytics.read"]} onCheckedChange={(checked) => setPermissions((current) => ({ ...current, "reports.export": Boolean(checked) }))} />
                    <span><span className="font-medium">{copy.export}</span><span className="block text-xs text-muted-foreground">{language === "en" ? "Download PDF and Excel-compatible CSV reports." : "Télécharger les rapports PDF et CSV compatibles Excel."}</span></span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">{copy.inviteHint}</p>
                <Button type="submit" disabled={sending || !email.trim()}>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailPlus className="mr-2 h-4 w-4" />}{copy.inviteButton}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-gold" />{copy.members}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {context.members.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{copy.noMembers}</p> : context.members.map((member) => (
                <div key={member.id} className="space-y-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-gold" />{member.name || "Manager KORA"}</div>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busyId === member.id} onClick={() => void removeMember(member.id)}><X className="mr-1 h-4 w-4" />{copy.remove}</Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={Boolean(member.permissions?.["analytics.read"])} disabled={busyId === member.id} onCheckedChange={(checked) => void updatePermissions(member, { ...member.permissions, "analytics.read": Boolean(checked), "reports.export": checked ? Boolean(member.permissions?.["reports.export"]) : false })} />
                      {copy.analytics}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={Boolean(member.permissions?.["reports.export"])} disabled={busyId === member.id || !member.permissions?.["analytics.read"]} onCheckedChange={(checked) => void updatePermissions(member, { ...member.permissions, "reports.export": Boolean(checked) })} />
                      {copy.export}
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{copy.pending}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {context.outgoing_invitations.length === 0 ? <p className="text-sm text-muted-foreground">{copy.noPending}</p> : context.outgoing_invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="truncate text-sm">{invitation.email}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{language === "en" ? "Awaiting response" : "En attente de réponse"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold">{copy.upgrade}</p>
            <Button className="mt-4" onClick={() => window.location.assign("/manager/subscription")}>{language === "en" ? "View plans" : "Voir les abonnements"}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{copy.workspaces}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {context.workspaces.length === 0 ? <p className="text-sm text-muted-foreground">{copy.noWorkspaces}</p> : context.workspaces.map((workspace) => (
            <div key={workspace.manager_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div><p className="font-semibold">{workspace.manager_name || "Manager KORA"}</p><p className="text-xs text-muted-foreground">{copy.analytics}</p></div>
              {workspace.permissions?.["analytics.read"] && <Button asChild size="sm"><Link to={`/manager/analytics?workspace=${workspace.manager_id}`}>{copy.open}<BarChart3 className="ml-2 h-4 w-4" /></Link></Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
