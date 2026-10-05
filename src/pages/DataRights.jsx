import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Download, Trash2, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"

export default function DataRights() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userId = user?.authId || user?.id
  const [profile, setProfile] = useState(null)
  const [consents, setConsents] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) return
      const [{ data: profileData, error: profileError }, { data: consentData, error: consentError }] = await Promise.all([
        supabase.from("profiles").select("id,name,role,phone,city,company,bio,email,avatar,cover_url,preferences,created_at,updated_at").eq("id", userId).maybeSingle(),
        supabase.from("user_consents").select("consent_type,consent_given,policy_version,source,granted_at,revoked_at").eq("user_id", userId).order("created_at", { ascending: false }),
      ])
      if (!mounted) return
      if (profileError) toast.error(profileError.message)
      else setProfile(profileData)
      if (consentError) toast.error(consentError.message)
      else setConsents(consentData || [])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [userId])

  const downloadData = () => {
    const payload = { profile, consents, exported_at: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "kora-mes-donnees.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteAccount = async () => {
    if (!window.confirm("La suppression de votre compte est définitive. Les informations pouvant être légalement conservées pourront être anonymisées. Continuer ?")) return
    setDeleting(true)
    try {
      const { error } = await supabase.rpc("delete_my_account")
      if (error) throw error
      await supabase.auth.signOut({ scope: "local" })
      await logout?.()
      navigate("/", { replace: true })
    } catch (error) {
      toast.error(error?.message || "Impossible de supprimer le compte.")
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Retour</Link>
      <div><h1 className="text-2xl font-black">Mes données personnelles</h1><p className="text-sm text-muted-foreground">Consultez les informations principales de votre compte et gérez vos droits.</p></div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Vos informations</CardTitle><CardDescription>Les informations affichées proviennent directement de votre profil KORA.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm">
        {profile ? Object.entries(profile).filter(([key]) => !["preferences","avatar","cover_url"].includes(key)).map(([key,value]) => <div key={key} className="flex flex-col gap-1 rounded-lg border p-3"><span className="text-xs text-muted-foreground">{key}</span><span className="break-words">{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</span></div>) : <p>Aucune donnée de profil trouvée.</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Consentements</CardTitle><CardDescription>Historique des choix enregistrés pour les CGU, la confidentialité et le marketing.</CardDescription></CardHeader><CardContent className="space-y-2">{consents.map((item) => <div key={item.consent_type + item.granted_at} className="rounded-lg border p-3 text-sm"><strong>{item.consent_type}</strong> — {item.consent_given ? "accordé" : "refusé"} — version {item.policy_version} — {new Date(item.granted_at).toLocaleString("fr-FR")}</div>)}{!consents.length && <p className="text-sm text-muted-foreground">Aucun consentement enregistré.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Actions</CardTitle><CardDescription>Vous pouvez récupérer une copie des informations principales ou demander la suppression de votre compte.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button variant="outline" onClick={downloadData} disabled={!profile}><Download className="mr-2 h-4 w-4" />Télécharger mes données</Button><Button variant="destructive" onClick={deleteAccount} disabled={deleting}>{deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Supprimer mon compte</Button></CardContent></Card>
      <p className="text-sm text-muted-foreground">Pour une demande qui n'est pas automatisée ici (rectification, opposition ou demande complémentaire), contactez <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a>.</p>
    </div>
  )
}
