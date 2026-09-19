import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Globe, Lock, Palette, Save, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"
import { useI18n } from "@/i18n/kora-i18n.jsx"

const TABS = [
  ["profile", "Mon profil", User],
  ["preferences", "Préférences", Palette],
  ["notifications", "Notifications", Bell],
  ["security", "Sécurité", Lock],
]

export default function ClientSettings({ initialTab = "profile" }) {
  const { user } = useAuth()
  const { language, setLanguage, theme, setTheme } = useI18n()
  const authUserId = user?.authId || user?.id
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ name: "", phone: "", city: "", company: "", bio: "" })
  const [preferences, setPreferences] = useState({ email: true, push: true, marketing: false })
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" })

  useEffect(() => setTab(initialTab), [initialTab])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!authUserId) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, role, phone, city, company, bio, preferences")
          .eq("id", authUserId)
          .maybeSingle()
        if (error) throw error
        if (!mounted) return
        const prefs = data?.preferences && typeof data.preferences === "object" ? data.preferences : {}
        const notif = prefs.notifications && typeof prefs.notifications === "object" ? prefs.notifications : {}
        setProfile({ name: data?.name || user?.name || "", phone: data?.phone || "", city: data?.city || "", company: data?.company || "", bio: data?.bio || "" })
        setPreferences({ email: notif.email !== false, push: notif.push !== false, marketing: notif.marketing === true })
      } catch (error) {
        console.error("Erreur paramètres client :", error)
        toast.error(error?.message || "Impossible de charger vos paramètres.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [authUserId, user?.name])

  const saveProfile = async () => {
    if (!authUserId) return
    if (!profile.name.trim()) return toast.error("Le nom est obligatoire.")
    setSaving(true)
    try {
      const { error } = await supabase.from("profiles").update({ name: profile.name.trim(), phone: profile.phone.trim() || null, city: profile.city.trim() || null, company: profile.company.trim() || null, bio: profile.bio.trim() || null }).eq("id", authUserId)
      if (error) throw error
      toast.success("Profil enregistré ✅")
    } catch (error) {
      console.error("Erreur profil client :", error)
      toast.error(error?.message || "Impossible d'enregistrer le profil.")
    } finally { setSaving(false) }
  }

  const savePreferences = async () => {
    if (!authUserId) return
    setSaving(true)
    try {
      const { error } = await supabase.from("profiles").update({
        preferences: { language, theme, notifications: preferences },
      }).eq("id", authUserId)
      if (error) throw error
      toast.success("Préférences enregistrées ✅")
    } catch (error) {
      console.error("Erreur préférences client :", error)
      toast.error(error?.message || "Impossible d'enregistrer les préférences.")
    } finally { setSaving(false) }
  }

  const savePassword = async () => {
    const { current, next, confirm } = passwords
    if (!current || !next || !confirm) return toast.error("Veuillez remplir tous les champs.")
    if (next.length < 8) return toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.")
    if (next !== confirm) return toast.error("Les mots de passe ne correspondent pas.")
    if (!user?.email) return toast.error("Adresse email introuvable.")
    setSaving(true)
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
      if (verifyError) throw new Error("Le mot de passe actuel est incorrect.")
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw error
      setPasswords({ current: "", next: "", confirm: "" })
      toast.success("Mot de passe mis à jour ✅")
    } catch (error) {
      console.error("Erreur mot de passe client :", error)
      toast.error(error?.message || "Impossible de modifier le mot de passe.")
    } finally { setSaving(false) }
  }

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Chargement des paramètres…</div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black tracking-tight">Paramètres</h1><p className="text-sm text-muted-foreground">Gérez votre profil, vos préférences et la sécurité.</p></div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit border-border/60"><CardContent className="p-2"><nav className="space-y-1">
          {TABS.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => setTab(id)} className={cn("w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold", tab === id ? "bg-gold/10 text-gold-dark" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="h-4 w-4" />{label}</button>)}
        </nav></CardContent></Card>
        <div>
          {tab === "profile" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><Card><CardHeader><CardTitle>Mon profil</CardTitle><CardDescription>Informations personnelles de votre compte.</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Nom complet</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div><div className="space-y-2"><Label>Téléphone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div><div className="space-y-2"><Label>Ville</Label><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>Entreprise</Label><Input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>Bio</Label><Textarea rows={5} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div></div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </CardContent></Card></motion.div>}

          {tab === "preferences" && <Card><CardHeader><CardTitle>Préférences</CardTitle><CardDescription>Langue et apparence de votre espace.</CardDescription></CardHeader><CardContent className="space-y-6">
            <div><Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Langue</Label><div className="flex gap-2 mt-2"><Button type="button" variant={language === "fr" ? "default" : "outline"} onClick={() => setLanguage("fr")}>🇫🇷 Français</Button><Button type="button" variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}>🇬🇧 English</Button></div></div>
            <div><Label className="flex items-center gap-2"><Palette className="h-4 w-4" />Thème</Label><div className="grid grid-cols-3 gap-3 mt-2">{[["light", "Clair"], ["dark", "Sombre"], ["auto", "Auto"]].map(([value, label]) => <button type="button" key={value} onClick={() => setTheme(value)} className={cn("rounded-xl border p-3 text-sm font-bold", theme === value ? "border-gold bg-gold/10" : "border-border hover:border-gold/40")}>{label}</button>)}</div></div>
            <Button onClick={savePreferences} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Enregistrement…" : "Enregistrer les préférences"}</Button>
          </CardContent></Card>}

          {tab === "notifications" && <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Choisissez les alertes que vous souhaitez recevoir.</CardDescription></CardHeader><CardContent className="space-y-4">{[["email", "Notifications email"], ["push", "Notifications navigateur"], ["marketing", "Offres et nouveautés KORA"]].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border p-4"><span className="text-sm font-medium">{label}</span><input type="checkbox" checked={preferences[key]} onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })} /></label>)}<Button onClick={savePreferences} disabled={saving} className="gap-2"><Save className="h-4 w-4" />Enregistrer</Button></CardContent></Card>}

          {tab === "security" && <Card><CardHeader><CardTitle>Sécurité</CardTitle><CardDescription>Modifier votre mot de passe.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Mot de passe actuel</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} /></div><div className="space-y-2"><Label>Nouveau mot de passe</Label><Input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} /></div><div className="space-y-2"><Label>Confirmer</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /></div><Button onClick={savePassword} disabled={saving}>Mettre à jour</Button></CardContent></Card>}
        </div>
      </div>
    </div>
  )
}
