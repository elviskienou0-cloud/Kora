import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Bell, Globe, Lock, Palette, Save, User, Camera, Image as ImageIcon } from "lucide-react"
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
import { uploadProfileImage } from "@/lib/profileMedia"

export default function ClientSettings({ initialTab = "profile" }) {
  const { user } = useAuth()
  const { t, language, setLanguage, theme, setTheme } = useI18n()
  const tabs = [
    ["profile", t("clientSettings.tabs.profile"), User],
    ["preferences", t("clientSettings.tabs.preferences"), Palette],
    ["notifications", t("clientSettings.tabs.notifications"), Bell],
    ["security", t("clientSettings.tabs.security"), Lock],
  ]
  const authUserId = user?.authId || user?.id
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ name: "", phone: "", city: "", company: "", bio: "", avatar: "", cover_url: "" })
  const [uploadingImage, setUploadingImage] = useState(null)
  const [preferences, setPreferences] = useState({ email: true, push: true, marketing: false })
  const [storedPreferences, setStoredPreferences] = useState({})
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
          .select("id, name, role, avatar, cover_url, phone, city, company, bio, preferences")
          .eq("id", authUserId)
          .maybeSingle()
        if (error) throw error
        if (!mounted) return
        const prefs = data?.preferences && typeof data.preferences === "object" ? data.preferences : {}
        const notif = prefs.notifications && typeof prefs.notifications === "object" ? prefs.notifications : {}
        setStoredPreferences(prefs)
        if (["light", "dark", "auto"].includes(prefs.theme)) setTheme(prefs.theme)
        setProfile({ name: data?.name || user?.name || "", phone: data?.phone || "", city: data?.city || "", company: data?.company || "", bio: data?.bio || "", avatar: data?.avatar || "", cover_url: data?.cover_url || "" })
        setPreferences({ email: notif.email !== false, push: notif.push !== false, marketing: notif.marketing === true })
      } catch (error) {
        console.error("Erreur paramètres client :", error)
        toast.error(t("clientSettings.errors.load"))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [authUserId, user?.name])

  const uploadImage = async (file, kind) => {
    if (!authUserId || !file) return
    setUploadingImage(kind)
    try {
      const url = await uploadProfileImage(authUserId, file, kind)
      setProfile((p) => ({ ...p, ...(kind === "avatar" ? { avatar: url } : { cover_url: url }) }))
      toast.success(kind === "avatar" ? t("clientSettings.success.avatar") : t("clientSettings.success.cover"))
    } catch (error) { console.error(error); toast.error(t("clientSettings.errors.upload")) }
    finally { setUploadingImage(null) }
  }

  const saveProfile = async () => {
    if (!authUserId) return
    if (!profile.name.trim()) return toast.error(t("clientSettings.errors.nameRequired"))
    setSaving(true)
    try {
      const { error } = await supabase.from("profiles").update({ name: profile.name.trim(), avatar: profile.avatar || null, cover_url: profile.cover_url || null, phone: profile.phone.trim() || null, city: profile.city.trim() || null, company: profile.company.trim() || null, bio: profile.bio.trim() || null }).eq("id", authUserId)
      if (error) throw error
      toast.success(t("clientSettings.success.profile"))
    } catch (error) {
      console.error("Erreur profil client :", error)
      toast.error(t("clientSettings.errors.profileSave"))
    } finally { setSaving(false) }
  }

  const savePreferences = async () => {
    if (!authUserId) return
    setSaving(true)
    try {
      const { error } = await supabase.from("profiles").update({
        preferences: { ...storedPreferences, language, theme, notifications: preferences },
      }).eq("id", authUserId)
      if (error) throw error
      const { error: consentError } = await supabase.rpc("set_my_marketing_consent", { p_enabled: Boolean(preferences.marketing) })
      if (consentError) throw consentError
      setStoredPreferences((current) => ({ ...current, language, theme, notifications: preferences }))
      toast.success(t("clientSettings.success.preferences"))
    } catch (error) {
      console.error("Erreur préférences client :", error)
      toast.error(t("clientSettings.errors.preferencesSave"))
    } finally { setSaving(false) }
  }

  const savePassword = async () => {
    const { current, next, confirm } = passwords
    if (!current || !next || !confirm) return toast.error(t("clientSettings.errors.fieldsRequired"))
    if (next.length < 8) return toast.error(t("clientSettings.errors.passwordLength"))
    if (next !== confirm) return toast.error(t("clientSettings.errors.passwordMismatch"))
    if (!user?.email) return toast.error(t("clientSettings.errors.emailMissing"))
    setSaving(true)
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
      if (verifyError) throw new Error(t("clientSettings.errors.currentPassword"))
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw error
      setPasswords({ current: "", next: "", confirm: "" })
      toast.success(t("clientSettings.success.password"))
    } catch (error) {
      console.error("Erreur mot de passe client :", error)
      toast.error(t("clientSettings.errors.passwordUpdate"))
    } finally { setSaving(false) }
  }

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">{t("clientSettings.loading")}</div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black tracking-tight">{t("settings.title")}</h1><p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p></div><div className="mt-3"><Link to="/mes-donnees" className="text-sm font-semibold text-gold-dark hover:underline">{t("clientSettings.profile.personalData")}</Link></div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit border-border/60"><CardContent className="p-2"><nav className="space-y-1">
          {tabs.map(([id, label, Icon]) => <button type="button" key={id} onClick={() => setTab(id)} className={cn("w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold", tab === id ? "bg-gold/10 text-gold-dark" : "text-muted-foreground hover:bg-accent hover:text-foreground")}><Icon className="h-4 w-4" />{label}</button>)}
        </nav></CardContent></Card>
        <div>
          {tab === "profile" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><Card><CardHeader><CardTitle>{t("clientSettings.profile.title")}</CardTitle><CardDescription>{t("clientSettings.profile.description")}</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="space-y-4 mb-6"><div className="relative h-32 rounded-2xl overflow-hidden border bg-muted">{profile.cover_url ? <img src={profile.cover_url} alt={t("clientSettings.profile.cover")} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}<label className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-lg bg-black/70 text-white px-3 py-2 text-xs font-bold cursor-pointer"><Camera className="h-4 w-4" />{uploadingImage === "cover" ? t("clientSettings.profile.uploadInProgress") : t("clientSettings.profile.changeCover")}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={!!uploadingImage} onChange={(e) => { const f=e.target.files?.[0]; if(f) uploadImage(f,"cover"); e.target.value="" }} /></label></div><div className="flex items-center gap-4"><div className="relative h-20 w-20 shrink-0">{profile.avatar ? <img src={profile.avatar} alt={t("clientSettings.profile.avatar")} className="h-20 w-20 rounded-full object-cover border-4 border-background shadow" /> : <div className="h-20 w-20 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xl font-black">{profile.name?.trim()?.charAt(0)?.toUpperCase() || "K"}</div>}<label className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-gold text-white flex items-center justify-center cursor-pointer border-2 border-background"><Camera className="h-4 w-4" /><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={!!uploadingImage} onChange={(e) => { const f=e.target.files?.[0]; if(f) uploadImage(f,"avatar"); e.target.value="" }} /></label></div><span className="text-sm text-muted-foreground">{uploadingImage ? t("clientSettings.profile.uploadInProgress") : t("clientSettings.profile.photoAndCover")}</span></div></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>{t("clientSettings.profile.fullName")}</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div><div className="space-y-2"><Label>{t("clientSettings.profile.phone")}</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div><div className="space-y-2"><Label>{t("clientSettings.profile.city")}</Label><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>{t("clientSettings.profile.company")}</Label><Input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} /></div><div className="space-y-2 md:col-span-2"><Label>{t("clientSettings.profile.bio")}</Label><Textarea rows={5} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div></div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? t("common.saving") : t("common.save")}</Button>
          </CardContent></Card></motion.div>}

          {tab === "preferences" && <Card><CardHeader><CardTitle>{t("clientSettings.preferences.title")}</CardTitle><CardDescription>{t("clientSettings.preferences.description")}</CardDescription></CardHeader><CardContent className="space-y-6">
            <div><Label className="flex items-center gap-2"><Globe className="h-4 w-4" />{t("clientSettings.preferences.language")}</Label><div className="flex gap-2 mt-2"><Button type="button" variant={language === "fr" ? "default" : "outline"} onClick={() => setLanguage("fr")}>🇫🇷 Français</Button><Button type="button" variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}>🇬🇧 English</Button></div></div>
            <div><Label className="flex items-center gap-2"><Palette className="h-4 w-4" />{t("clientSettings.preferences.theme")}</Label><div className="grid grid-cols-3 gap-3 mt-2">{[["light", t("clientSettings.preferences.light")], ["dark", t("clientSettings.preferences.dark")], ["auto", t("clientSettings.preferences.auto")]].map(([value, label]) => <button type="button" key={value} onClick={() => setTheme(value)} className={cn("rounded-xl border p-3 text-sm font-bold", theme === value ? "border-gold bg-gold/10" : "border-border hover:border-gold/40")}>{label}</button>)}</div></div>
            <Button onClick={savePreferences} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? t("common.saving") : t("clientSettings.preferences.save")}</Button>
          </CardContent></Card>}

          {tab === "notifications" && <Card><CardHeader><CardTitle>{t("clientSettings.notifications.title")}</CardTitle><CardDescription>{t("clientSettings.notifications.description")}</CardDescription></CardHeader><CardContent className="space-y-4">{[["email", t("clientSettings.notifications.email")], ["push", t("clientSettings.notifications.browser")], ["marketing", t("clientSettings.notifications.marketing")]].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border p-4"><span className="text-sm font-medium">{label}</span><input type="checkbox" checked={preferences[key]} onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })} /></label>)}<Button onClick={savePreferences} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{t("clientSettings.notifications.save")}</Button></CardContent></Card>}

          {tab === "security" && <Card><CardHeader><CardTitle>{t("clientSettings.security.title")}</CardTitle><CardDescription>{t("clientSettings.security.description")}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>{t("clientSettings.security.currentPassword")}</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} /></div><div className="space-y-2"><Label>{t("clientSettings.security.newPassword")}</Label><Input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} /></div><div className="space-y-2"><Label>{t("clientSettings.security.confirmPassword")}</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /></div><Button onClick={savePassword} disabled={saving}>{t("clientSettings.security.update")}</Button></CardContent></Card>}
        </div>
      </div>
    </div>
  )
}
