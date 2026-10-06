import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Bell, Globe, Key, Loader2, Lock, Palette, Save, Shield, Trash2, User, Camera, Image as ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase"
import { useI18n } from "@/i18n/kora-i18n.jsx"
import { uploadProfileImage } from "@/lib/profileMedia"

const DEFAULT_PREFERENCES = {
  language: "fr",
theme: "light",
  notifications: { email: true, push: true, marketing: false },
}

function mergePreferences(value) {
  const source = value && typeof value === "object" ? value : {}
  const n = source.notifications && typeof source.notifications === "object" ? source.notifications : {}
  return {
    language: source.language === "en" ? "en" : "fr",
theme: ["light", "dark", "auto"].includes(source.theme) ? source.theme : "light",
    notifications: {
      email: typeof n.email === "boolean" ? n.email : true,
      push: typeof n.push === "boolean" ? n.push : true,
      marketing: typeof n.marketing === "boolean" ? n.marketing : false,
    },
  }
}

function initials(name = "KORA") {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "K"
}

export default function ManagerSettings() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const { t, language, setLanguage, theme, setTheme } = useI18n()
  const userId = user?.authId || user?.id || null

  const [tab, setTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", city: "", company: "", bio: "", avatar: "", cover_url: "" })
  const [uploadingImage, setUploadingImage] = useState(null)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [passwords, setPasswords] = useState({ old: "", next: "", confirm: "" })
  const [planAccess, setPlanAccess] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!userId) { setLoading(false); return }
      setLoading(true)
      try {
        const [{ data, error }, { data: accessData, error: accessError }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, name, role, avatar, cover_url, phone, city, company, bio, preferences")
            .eq("id", userId)
            .maybeSingle(),
          supabase.rpc("get_my_manager_plan_access"),
        ])
        if (error) throw error
        if (accessError) throw accessError
        if (!mounted) return
        const p = mergePreferences(data?.preferences)
        setProfile({
          name: data?.name || user?.name || "",
          email: user?.email || "",
          phone: data?.phone || "",
          city: data?.city || "",
          company: data?.company || "",
          bio: data?.bio || "",
          avatar: data?.avatar || "",
          cover_url: data?.cover_url || "",
        })
        setPreferences(p)
        setPlanAccess(accessData || null)
        setLanguage(p.language)
        setTheme(p.theme)
      } catch (error) {
        if (mounted) toast.error(error?.message || "Impossible de charger votre profil.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [userId])

  useEffect(() => {
    setPreferences((p) => ({ ...p, language, theme }))
  }, [language, theme])

  const uploadImage = async (file, kind) => {
    if (!userId || !file) return
    setUploadingImage(kind)
    try {
      const url = await uploadProfileImage(userId, file, kind)
      setProfile((p) => ({ ...p, ...(kind === "avatar" ? { avatar: url } : { cover_url: url }) }))
      toast.success(kind === "avatar" ? "Photo de profil mise à jour." : "Photo de couverture mise à jour.")
    } catch (error) { console.error(error); toast.error(error?.message || "Impossible d’envoyer l’image.") }
    finally { setUploadingImage(null) }
  }

  const saveProfile = async () => {
    if (!userId) return toast.error("Connexion requise.")
    if (!profile.name.trim()) return toast.error(t("settings.errors.nameRequired"))
    setSavingProfile(true)
    try {
      const patch = {
        name: profile.name.trim(),
        avatar: profile.avatar.trim() || null,
        cover_url: profile.cover_url.trim() || null,
        phone: profile.phone.trim() || null,
        city: profile.city.trim() || null,
        company: profile.company.trim() || null,
        bio: profile.bio.trim() || null,
      }
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("id, name, avatar, cover_url, phone, city, company, bio, preferences").single()
      if (error) throw error
      setProfile((p) => ({ ...p, ...patch, avatar: data.avatar || "", cover_url: data.cover_url || "" }))
      toast.success(t("settings.success.profile"))
    } catch (error) {
      console.error(error)
      toast.error(error?.message || t("settings.errors.save"))
    } finally { setSavingProfile(false) }
  }

  const savePreferences = async () => {
    if (!userId) return toast.error("Connexion requise.")
    setSavingPrefs(true)
    try {
      const normalized = mergePreferences({ ...preferences, language, theme })
      const { error } = await supabase.from("profiles").update({ preferences: normalized }).eq("id", userId)
      if (error) throw error
      const { error: consentError } = await supabase.rpc("set_my_marketing_consent", { p_enabled: Boolean(normalized.notifications?.marketing) })
      if (consentError) throw consentError
      setPreferences(normalized)
      toast.success(t("settings.success.preferences"))
    } catch (error) {
      console.error(error)
      toast.error(error?.message || t("settings.errors.save"))
    } finally { setSavingPrefs(false) }
  }

  const changePassword = async () => {
    if (!user?.email) return toast.error(t("settings.errors.emailMissing"))
    if (!passwords.old || !passwords.next || !passwords.confirm) return toast.error(t("settings.errors.passwordFields"))
    if (passwords.next.length < 8) return toast.error(t("settings.errors.passwordLength"))
    if (passwords.next !== passwords.confirm) return toast.error(t("settings.errors.passwordMismatch"))
    setSavingPassword(true)
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwords.old })
      if (verifyError) throw new Error(t("settings.errors.oldPassword"))
      const { error } = await supabase.auth.updateUser({ password: passwords.next })
      if (error) throw error
      setPasswords({ old: "", next: "", confirm: "" })
      toast.success(t("settings.success.password"))
    } catch (error) {
      console.error(error)
      toast.error(error?.message || t("settings.errors.save"))
    } finally { setSavingPassword(false) }
  }

  const deleteAccount = async () => {
    if (!window.confirm("La suppression de votre compte est définitive. Continuer ?")) return
    setDeleting(true)
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { body: {} })
      if (error) throw error
      if (!data?.ok) throw new Error(data?.error || "La suppression du compte a échoué.")
      await supabase.auth.signOut({ scope: "local" })
      await logout?.()
      window.location.assign("/")
    } catch (error) {
      console.error(error)
      toast.error(error?.message || "Impossible de supprimer le compte.")
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold" /></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black">{t("settings.title")}</h1><p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p></div><div className="mt-3"><Link to="/mes-donnees" className="text-sm font-semibold text-gold-dark hover:underline">{t("settings.title")}</Link></div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit"><CardContent className="p-2">
          <div className="space-y-1">
            {[
              ["profile", t("settings.profileTab"), User],
              ["notifications", t("settings.notificationsTab"), Bell],
              ["security", t("settings.securityTab"), Shield],
              ["appearance", t("settings.appearanceTab"), Palette],
            ].map(([key, label, Icon]) => <button key={key} type="button" onClick={() => setTab(key)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${tab === key ? "bg-gold/10 text-gold-dark" : "text-muted-foreground hover:bg-accent"}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>
        </CardContent></Card>

        <div className="space-y-6">
          {tab === "profile" && <Card><CardHeader><CardTitle>{t("settings.profileInfo.title")}</CardTitle><CardDescription>{t("settings.profileInfo.description")}</CardDescription></CardHeader><CardContent className="space-y-5">
            <div className="space-y-4"><div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border bg-muted">{profile.cover_url ? <img src={profile.cover_url} alt="Couverture" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}<label className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-lg bg-black/70 text-white px-3 py-2 text-xs font-bold cursor-pointer"><Camera className="h-4 w-4" />{uploadingImage === "cover" ? "Envoi…" : "Changer la couverture"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={!!uploadingImage} onChange={(e) => { const f=e.target.files?.[0]; if(f) uploadImage(f,"cover"); e.target.value="" }} /></label></div><div className="flex items-center gap-4"><div className="relative h-20 w-20 shrink-0">{profile.avatar ? <img src={profile.avatar} alt="Profil" className="h-20 w-20 rounded-full object-cover border-4 border-background shadow" /> : <div className="h-20 w-20 rounded-full gold-gradient text-white flex items-center justify-center text-xl font-black">{initials(profile.name)}</div>}<label className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-gold text-white flex items-center justify-center cursor-pointer border-2 border-background"><Camera className="h-4 w-4" /><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={!!uploadingImage} onChange={(e) => { const f=e.target.files?.[0]; if(f) uploadImage(f,"avatar"); e.target.value="" }} /></label></div><div><div className="font-black">{profile.name || "Manager KORA"}</div><div className="mt-1 flex flex-wrap gap-2"><Badge variant="outline">Manager</Badge>{planAccess?.business_badge && <Badge className="bg-gold text-white">Business</Badge>}</div></div></div></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>{t("account.name")}</Label><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("account.email")}</Label><Input value={profile.email} disabled readOnly /></div>
              <div className="space-y-2"><Label>{t("common.contact")}</Label><Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("talents.city")}</Label><Input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t("common.appName")}</Label><Input value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} /></div>
              
              <div className="space-y-2 md:col-span-2"><Label>{t("talents.bio")}</Label><Textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={5} maxLength={2000} /></div>
            </div>
            <div className="flex justify-end"><Button onClick={saveProfile} disabled={savingProfile} className="gap-2">{savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {savingProfile ? t("common.saving") : t("common.save")}</Button></div>
          </CardContent></Card>}

          {tab === "notifications" && <Card><CardHeader><CardTitle>{t("settings.notifications.title")}</CardTitle><CardDescription>{t("settings.notifications.description")}</CardDescription></CardHeader><CardContent className="space-y-4">
            {[["email","settings.notifications.emailTitle","settings.notifications.emailDescription"],["push","settings.notifications.pushTitle","settings.notifications.pushDescription"],["marketing","settings.notifications.marketingTitle","settings.notifications.marketingDescription"]].map(([key,title,desc]) => <div key={key} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-bold">{t(title)}</p><p className="text-xs text-muted-foreground">{t(desc)}</p></div><Switch checked={preferences.notifications[key]} onCheckedChange={(v) => setPreferences((p) => ({ ...p, notifications: { ...p.notifications, [key]: v } }))} /></div>)}
            <div className="flex justify-end"><Button onClick={savePreferences} disabled={savingPrefs} className="gap-2">{savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("common.save")}</Button></div>
          </CardContent></Card>}

          {tab === "security" && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-gold" />{t("settings.security.passwordTitle")}</CardTitle><CardDescription>{t("settings.security.passwordDescription")}</CardDescription></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label>{t("settings.security.currentPassword")}</Label><Input type="password" value={passwords.old} onChange={(e) => setPasswords((p) => ({ ...p, old: e.target.value }))} /></div>
            <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>{t("settings.security.newPassword")}</Label><Input type="password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} /></div><div className="space-y-2"><Label>{t("settings.security.confirmPassword")}</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} /></div></div>
            <div className="flex justify-end"><Button onClick={changePassword} disabled={savingPassword} className="gap-2">{savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />} {t("settings.security.update")}</Button></div>
            <Separator />
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting} className="gap-2"><Trash2 className="h-4 w-4" /> {deleting ? "Suppression…" : t("settings.delete.button")}</Button>
          </CardContent></Card>}

          {tab === "appearance" && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-gold" />{t("settings.appearance.title")}</CardTitle><CardDescription>{t("settings.appearance.description")}</CardDescription></CardHeader><CardContent className="space-y-6">
            <div><Label className="mb-2 block">{t("settings.appearance.theme")}</Label><div className="grid grid-cols-3 gap-3">{[["light","☀️",t("settings.appearance.light")],["dark","🌙",t("settings.appearance.dark")],["auto","🪟",t("settings.appearance.auto")]].map(([key,icon,label]) => <button key={key} type="button" onClick={() => setTheme(key)} className={`rounded-2xl border p-4 text-center ${theme === key ? "border-gold bg-gold/5" : "border-border/60"}`}><div className="text-2xl">{icon}</div><div className="text-xs font-bold mt-1">{label}</div></button>)}</div></div>
            <div><Label className="mb-2 block">{t("settings.appearance.language")}</Label><div className="grid grid-cols-2 gap-3"><Button type="button" variant={language === "fr" ? "default" : "outline"} onClick={() => setLanguage("fr")}><Globe className="mr-2 h-4 w-4" /> Français</Button><Button type="button" variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}><Globe className="mr-2 h-4 w-4" /> English</Button></div></div>
            <div className="flex justify-end"><Button onClick={savePreferences} disabled={savingPrefs} className="gap-2">{savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("common.save")}</Button></div>
          </CardContent></Card>}
        </div>
      </div>
    </div>
  )
}
