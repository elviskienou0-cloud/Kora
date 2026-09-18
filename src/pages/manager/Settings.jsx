// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Trash2,
  CheckCircle2,
  Camera,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  AlertTriangle,
  Lock,
  Monitor,
  LogOut,
  Smartphone,
  RefreshCw,
  Languages,
  Eye,
  EyeOff,
  Copy,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/AuthContext"

const NAV = [
  { id: "profile", label: "Profil", icon: User },
  { id: "account", label: "Compte", icon: Key },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "preferences", label: "Préférences", icon: Palette },
]

const DEFAULT_PREFERENCES = {
  language: "fr",
  theme: "system",
  notifications: {
    email: true,
    push: true,
    marketing: false,
  },
}

function mergePreferences(value) {
  const source = value && typeof value === "object" ? value : {}
  const notifications =
    source.notifications && typeof source.notifications === "object"
      ? source.notifications
      : {}

  return {
    language: source.language || DEFAULT_PREFERENCES.language,
    theme: source.theme || DEFAULT_PREFERENCES.theme,
    notifications: {
      email:
        typeof notifications.email === "boolean"
          ? notifications.email
          : DEFAULT_PREFERENCES.notifications.email,
      push:
        typeof notifications.push === "boolean"
          ? notifications.push
          : DEFAULT_PREFERENCES.notifications.push,
      marketing:
        typeof notifications.marketing === "boolean"
          ? notifications.marketing
          : DEFAULT_PREFERENCES.notifications.marketing,
    },
  }
}

function initialsFromName(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "K"
}

function formatDateTime(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function applyTheme(theme) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const mode = theme || "system"

  if (mode === "dark") {
    root.classList.add("dark")
    return
  }

  if (mode === "light") {
    root.classList.remove("dark")
    return
  }

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches

  root.classList.toggle("dark", !!prefersDark)
}

export default function ManagerSettings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const authUserId = user?.authId || user?.id

  const [tab, setTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "manager",
    avatar: "",
    phone: "",
    city: "",
    company: "",
    bio: "",
  })

  const [email, setEmail] = useState("")

  const [security, setSecurity] = useState({
    oldPwd: "",
    newPwd: "",
    confirm: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  })

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)

  const [session, setSession] = useState(null)
  const [mfaFactors, setMfaFactors] = useState([])
  const [mfaSetup, setMfaSetup] = useState(null)
  const [mfaCode, setMfaCode] = useState("")
  const [mfaLoading, setMfaLoading] = useState(false)

  const loadSettings = useCallback(async () => {
    if (!authUserId) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const [profileResult, sessionResult, factorsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, name, role, avatar, phone, city, company, bio, preferences, created_at, updated_at"
          )
          .eq("id", authUserId)
          .maybeSingle(),
        supabase.auth.getSession(),
        supabase.auth.mfa.listFactors(),
      ])

      if (profileResult.error) throw profileResult.error

      const row = profileResult.data || {}
      const currentSession = sessionResult?.data?.session || null
      const factors = factorsResult?.data?.totp || []

      setProfile({
        name: row.name || user?.name || "",
        email:
          currentSession?.user?.email ||
          user?.email ||
          row.email ||
          "",
        role: row.role || user?.role || "manager",
        avatar: row.avatar || user?.avatar || "",
        phone: row.phone || "",
        city: row.city || "",
        company: row.company || "",
        bio: row.bio || "",
      })

      setEmail(currentSession?.user?.email || user?.email || "")
      setPreferences(mergePreferences(row.preferences))
      setSession(currentSession)
      setMfaFactors(factors)
    } catch (error) {
      console.error("Erreur chargement paramètres :", error)
      toast.error("Impossible de charger vos paramètres", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setLoading(false)
    }
  }, [authUserId, user?.name, user?.email, user?.role, user?.avatar])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    applyTheme(preferences.theme)
  }, [preferences.theme])

  useEffect(() => {
    if (preferences.theme !== "system") return undefined
    if (typeof window === "undefined" || !window.matchMedia) return undefined

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyTheme("system")

    media.addEventListener?.("change", handleChange)
    return () => media.removeEventListener?.("change", handleChange)
  }, [preferences.theme])

  const initials = useMemo(
    () => initialsFromName(profile.name),
    [profile.name]
  )

  const verifiedMfaFactors = useMemo(
    () =>
      (mfaFactors || []).filter(
        (factor) => factor.status === "verified"
      ),
    [mfaFactors]
  )

  const updateProfile = (field) => (event) => {
    const value = event?.target?.value ?? ""
    setProfile((current) => ({ ...current, [field]: value }))
  }

  const saveProfile = async () => {
    if (!authUserId) {
      toast.error("Connexion requise.")
      return
    }

    if (!profile.name.trim()) {
      toast.error("Le nom est obligatoire.")
      return
    }

    setSaving(true)

    try {
      const payload = {
        name: profile.name.trim(),
        avatar: profile.avatar || null,
        phone: profile.phone.trim() || null,
        city: profile.city.trim() || null,
        company: profile.company.trim() || null,
        bio: profile.bio.trim() || null,
      }

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", authUserId)

      if (error) throw error

      if (typeof updateUser === "function") {
        await updateUser({
          name: payload.name,
          avatar: payload.avatar,
        })
      }

      toast.success("Profil enregistré ✅")
    } catch (error) {
      console.error("Erreur sauvegarde profil :", error)
      toast.error("Impossible d'enregistrer le profil", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !authUserId) return

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast.error("Format d'image non pris en charge.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.")
      return
    }

    setUploadingAvatar(true)

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg"
      const path = `${authUserId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path)

      const avatarUrl = publicUrlData?.publicUrl
      if (!avatarUrl) throw new Error("URL avatar introuvable")

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar: avatarUrl })
        .eq("id", authUserId)

      if (profileError) throw profileError

      setProfile((current) => ({
        ...current,
        avatar: avatarUrl,
      }))

      if (typeof updateUser === "function") {
        await updateUser({ avatar: avatarUrl })
      }

      toast.success("Avatar mis à jour ✅")
    } catch (error) {
      console.error("Erreur avatar :", error)
      toast.error("Impossible d'envoyer l'avatar", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const savePreferences = async () => {
    if (!authUserId) {
      toast.error("Connexion requise.")
      return
    }

    setSaving(true)

    try {
      const normalized = mergePreferences(preferences)

      const { error } = await supabase
        .from("profiles")
        .update({ preferences: normalized })
        .eq("id", authUserId)

      if (error) throw error

      localStorage.setItem(
        "kora_preferences",
        JSON.stringify(normalized)
      )

      applyTheme(normalized.theme)
      toast.success("Préférences enregistrées ✅")
    } catch (error) {
      console.error("Erreur préférences :", error)
      toast.error("Impossible d'enregistrer les préférences", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveEmail = async () => {
    const nextEmail = email.trim().toLowerCase()
    const currentEmail =
      session?.user?.email || user?.email || ""

    if (!nextEmail) {
      toast.error("L'adresse email est obligatoire.")
      return
    }

    if (nextEmail === currentEmail.toLowerCase()) {
      toast.info("Cette adresse email est déjà utilisée.")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        email: nextEmail,
      })

      if (error) throw error

      toast.success("Demande de changement d'email enregistrée ✅", {
        description:
          "Vérifiez votre boîte email si une confirmation vous est demandée.",
      })
    } catch (error) {
      console.error("Erreur email :", error)
      toast.error("Impossible de modifier l'email", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    const { oldPwd, newPwd, confirm } = security

    if (!session?.user?.email && !user?.email) {
      toast.error("Adresse email introuvable.")
      return
    }

    if (!oldPwd || !newPwd || !confirm) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }

    if (newPwd.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }

    if (newPwd !== confirm) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.")
      return
    }

    setSaving(true)

    try {
      const currentEmail =
        session?.user?.email || user?.email

      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: oldPwd,
        })

      if (verifyError) {
        throw new Error("L'ancien mot de passe est incorrect.")
      }

      const { error } = await supabase.auth.updateUser({
        password: newPwd,
      })

      if (error) throw error

      setSecurity({ oldPwd: "", newPwd: "", confirm: "" })

      toast.success("Mot de passe mis à jour ✅")
      await loadSettings()
    } catch (error) {
      console.error("Erreur mot de passe :", error)
      toast.error("Impossible de modifier le mot de passe", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setSaving(false)
    }
  }

  const startMfaEnrollment = async () => {
    setMfaLoading(true)

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `KORA — ${profile.name || "Compte"}`,
      })

      if (error) throw error

      if (!data?.id || !data?.totp?.qr_code) {
        throw new Error("Configuration 2FA incomplète.")
      }

      setMfaSetup({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret || "",
      })
      setMfaCode("")

      toast.info("Scannez le QR code avec votre application d'authentification.")
    } catch (error) {
      console.error("Erreur enrollment MFA :", error)
      toast.error("Impossible d'activer la 2FA", {
        description: error?.message || "Vérifiez la configuration Supabase Auth MFA.",
      })
    } finally {
      setMfaLoading(false)
    }
  }

  const verifyMfaEnrollment = async () => {
    if (!mfaSetup?.factorId) return

    const code = mfaCode.replace(/\D/g, "").slice(0, 6)
    if (code.length !== 6) {
      toast.error("Entrez le code à 6 chiffres.")
      return
    }

    setMfaLoading(true)

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: mfaSetup.factorId,
        })

      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaSetup.factorId,
        challengeId: challenge.id,
        code,
      })

      if (verifyError) throw verifyError

      toast.success("Authentification à deux facteurs activée ✅")
      setMfaSetup(null)
      setMfaCode("")
      await loadSettings()
    } catch (error) {
      console.error("Erreur vérification MFA :", error)
      toast.error("Code 2FA invalide ou expiré", {
        description: error?.message || "Réessayez avec le code courant.",
      })
    } finally {
      setMfaLoading(false)
    }
  }

  const removeMfaFactor = async (factorId) => {
    if (!factorId) return

    const confirmed = window.confirm(
      "Désactiver cette authentification à deux facteurs ?"
    )

    if (!confirmed) return

    setMfaLoading(true)

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      })

      if (error) throw error

      toast.success("2FA désactivée pour ce facteur.")
      await loadSettings()
    } catch (error) {
      console.error("Erreur suppression MFA :", error)
      toast.error("Impossible de désactiver la 2FA", {
        description: error?.message || "Veuillez réessayer.",
      })
    } finally {
      setMfaLoading(false)
    }
  }

  const signOutEverywhere = async () => {
    const confirmed = window.confirm(
      "Voulez-vous déconnecter ce compte de toutes ses sessions ?"
    )

    if (!confirmed) return

    try {
      const { error } = await supabase.auth.signOut({
        scope: "global",
      })

      if (error) throw error

      if (typeof logout === "function") {
        await logout()
      }

      navigate("/login", { replace: true })
    } catch (error) {
      console.error("Erreur déconnexion globale :", error)
      toast.error("Impossible de fermer toutes les sessions", {
        description: error?.message || "Veuillez réessayer.",
      })
    }
  }

  const deleteAccount = async () => {
    const firstConfirm = window.confirm(
      "La suppression du compte est définitive. Continuer ?"
    )

    if (!firstConfirm) return

    const secondConfirm = window.confirm(
      "Dernière confirmation : supprimer définitivement votre compte KORA ?"
    )

    if (!secondConfirm) return

    setSaving(true)

    try {
      const { error } = await supabase.rpc("delete_my_account")
      if (error) throw error

      await supabase.auth.signOut({ scope: "local" })

      if (typeof logout === "function") {
        await logout()
      }

      toast.success("Votre compte a été supprimé.")
      navigate("/", { replace: true })
    } catch (error) {
      console.error("Erreur suppression compte :", error)
      toast.error("Impossible de supprimer le compte", {
        description: error?.message || "Vérifiez que la fonction delete_my_account est installée.",
      })
    } finally {
      setSaving(false)
    }
  }

  const copySecret = async () => {
    if (!mfaSetup?.secret) return

    try {
      await navigator.clipboard.writeText(mfaSetup.secret)
      toast.success("Clé secrète copiée.")
    } catch {
      toast.error("Impossible de copier la clé.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Chargement des paramètres…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre profil, votre compte, votre sécurité et vos préférences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Navigation */}
        <Card className="border-border/60 h-fit lg:sticky lg:top-20 overflow-hidden">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group text-left",
                      tab === item.id
                        ? "bg-gold/10 text-gold-dark shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        tab === item.id
                          ? "text-gold-dark"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* =====================================================
              PROFIL
          ====================================================== */}
          {tab === "profile" && (
            <div className="space-y-6">
              <Card className="border-border/60 overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                      {profile.avatar ? (
                        <AvatarImage
                          src={profile.avatar}
                          alt={profile.name || "Avatar"}
                        />
                      ) : null}
                      <AvatarFallback className="gold-gradient text-white text-2xl font-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/30 border-2 border-background cursor-pointer"
                      title="Changer la photo"
                    >
                      {uploadingAvatar ? (
                        <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5 text-white" />
                      )}
                    </label>

                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg mb-0.5">
                      {profile.name || "Votre nom"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {profile.email || "Email"} · {profile.role || "manager"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-bold"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Compte actif
                      </Badge>

                      {verifiedMfaFactors.length > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 font-bold"
                        >
                          <Shield className="h-3 w-3" />
                          2FA activée
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <User className="h-5 w-5 text-gold" />
                    Informations du profil
                  </CardTitle>
                  <CardDescription>
                    Toutes les informations ci-dessous sont enregistrées dans votre profil KORA.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-name" className="text-xs font-bold">
                        Nom complet
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-name"
                          value={profile.name}
                          onChange={updateProfile("name")}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="profile-phone" className="text-xs font-bold">
                        Téléphone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-phone"
                          value={profile.phone}
                          onChange={updateProfile("phone")}
                          className="pl-10"
                          placeholder="+226 …"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="profile-city" className="text-xs font-bold">
                        Ville
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-city"
                          value={profile.city}
                          onChange={updateProfile("city")}
                          className="pl-10"
                          placeholder="Ouagadougou"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="profile-company" className="text-xs font-bold">
                        Entreprise
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="profile-company"
                          value={profile.company}
                          onChange={updateProfile("company")}
                          className="pl-10"
                          placeholder="Nom de l'entreprise"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profile-bio" className="text-xs font-bold">
                      Bio
                    </Label>
                    <textarea
                      id="profile-bio"
                      value={profile.bio}
                      onChange={updateProfile("bio")}
                      rows={5}
                      maxLength={1000}
                      placeholder="Présentez votre activité, vos spécialités ou votre équipe."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-gold/30"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">
                      {profile.bio.length}/1000
                    </p>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      className="gap-2"
                      onClick={saveProfile}
                      disabled={saving || uploadingAvatar}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Enregistrement…" : "Enregistrer le profil"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =====================================================
              COMPTE
          ====================================================== */}
          {tab === "account" && (
            <div className="space-y-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gold" />
                    Adresse email
                  </CardTitle>
                  <CardDescription>
                    L'adresse email est gérée par Supabase Auth. Une confirmation peut être demandée après modification.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1.5 max-w-xl">
                    <Label htmlFor="account-email" className="text-xs font-bold">
                      Email du compte
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="account-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="gap-2" onClick={saveEmail} disabled={saving}>
                      <Save className="h-4 w-4" />
                      Modifier l'email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Supprimer mon compte
                  </CardTitle>
                  <CardDescription>
                    Cette action supprime définitivement votre compte KORA. Elle ne peut pas être annulée.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Utilisez cette option uniquement lorsque vous êtes certain de vouloir quitter KORA.
                  </p>

                  <Button
                    variant="destructive"
                    className="gap-2 shrink-0"
                    onClick={deleteAccount}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =====================================================
              SÉCURITÉ
          ====================================================== */}
          {tab === "security" && (
            <div className="space-y-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gold" />
                    Mot de passe
                  </CardTitle>
                  <CardDescription>
                    Le mot de passe doit contenir au moins 8 caractères. Le mot de passe actuel est vérifié avant la modification.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="old-password" className="text-xs font-bold">
                      Mot de passe actuel
                    </Label>
                    <div className="relative">
                      <Input
                        id="old-password"
                        type={showPasswords.old ? "text" : "password"}
                        value={security.oldPwd}
                        onChange={(event) =>
                          setSecurity((current) => ({
                            ...current,
                            oldPwd: event.target.value,
                          }))
                        }
                        className="pr-11"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((current) => ({
                            ...current,
                            old: !current.old,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label="Afficher ou masquer le mot de passe actuel"
                      >
                        {showPasswords.old ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password" className="text-xs font-bold">
                        Nouveau mot de passe
                      </Label>
                      <Input
                        id="new-password"
                        type={showPasswords.new ? "text" : "password"}
                        value={security.newPwd}
                        onChange={(event) =>
                          setSecurity((current) => ({
                            ...current,
                            newPwd: event.target.value,
                          }))
                        }
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password" className="text-xs font-bold">
                        Confirmer
                      </Label>
                      <Input
                        id="confirm-password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={security.confirm}
                        onChange={(event) =>
                          setSecurity((current) => ({
                            ...current,
                            confirm: event.target.value,
                          }))
                        }
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">
                      Les champs de mot de passe restent uniquement dans cette session du navigateur.
                    </p>
                    <button
                      type="button"
                      className="text-xs font-bold text-gold-dark hover:underline"
                      onClick={() =>
                        setShowPasswords({
                          old: !showPasswords.old,
                          new: !showPasswords.new,
                          confirm: !showPasswords.confirm,
                        })
                      }
                    >
                      Afficher / masquer
                    </button>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setSecurity({ oldPwd: "", newPwd: "", confirm: "" })
                      }
                    >
                      Effacer
                    </Button>
                    <Button
                      className="gap-2"
                      onClick={changePassword}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      Mettre à jour
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2FA */}
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gold" />
                    Authentification à deux facteurs (2FA)
                  </CardTitle>
                  <CardDescription>
                    Utilisez une application d'authentification TOTP pour protéger votre compte KORA.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {verifiedMfaFactors.length > 0 ? (
                    <div className="space-y-3">
                      {verifiedMfaFactors.map((factor) => (
                        <div
                          key={factor.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <Smartphone className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-black text-sm">
                                {factor.friendly_name || "Application d'authentification"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Facteur TOTP vérifié · actif
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                            onClick={() => removeMfaFactor(factor.id)}
                            disabled={mfaLoading}
                          >
                            <XCircle className="h-4 w-4" />
                            Désactiver
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                      <p className="font-bold text-sm mb-1">
                        2FA non activée
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ajoutez un facteur TOTP pour renforcer la protection de votre compte.
                      </p>
                    </div>
                  )}

                  {!mfaSetup && (
                    <Button
                      className="gap-2"
                      onClick={startMfaEnrollment}
                      disabled={mfaLoading}
                    >
                      {mfaLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      {verifiedMfaFactors.length > 0
                        ? "Ajouter un facteur 2FA"
                        : "Activer la 2FA"}
                    </Button>
                  )}

                  {mfaSetup && (
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-5">
                      <div>
                        <p className="font-black text-sm mb-1">
                          1. Scannez le QR code
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ouvrez Google Authenticator, Microsoft Authenticator, Authy ou une application TOTP compatible.
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-5 items-start">
                        <div className="rounded-2xl bg-white p-3 border shadow-sm">
                          <img
                            src={mfaSetup.qrCode}
                            alt="QR code de configuration 2FA"
                            className="w-48 h-48 object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-4 w-full">
                          <div>
                            <p className="font-black text-sm mb-1">
                              2. Entrez le code affiché
                            </p>
                            <Input
                              value={mfaCode}
                              onChange={(event) =>
                                setMfaCode(
                                  event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6)
                                )
                              }
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              placeholder="000000"
                              className="text-center text-xl tracking-[0.35em] font-black max-w-xs"
                            />
                          </div>

                          {mfaSetup.secret ? (
                            <div className="space-y-2">
                              <Label className="text-xs font-bold">
                                Clé secrète de secours
                              </Label>
                              <div className="flex gap-2 max-w-xl">
                                <Input
                                  value={mfaSetup.secret}
                                  readOnly
                                  className="font-mono text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={copySecret}
                                  title="Copier la clé"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="gap-2"
                              onClick={verifyMfaEnrollment}
                              disabled={mfaLoading || mfaCode.length !== 6}
                            >
                              {mfaLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Vérifier et activer
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setMfaSetup(null)
                                setMfaCode("")
                              }}
                              disabled={mfaLoading}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-gold" />
                    Sessions
                  </CardTitle>
                  <CardDescription>
                    Consultez la session active dans ce navigateur et fermez toutes les autres sessions avec la déconnexion globale.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Monitor className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-black text-sm">Session actuelle</p>
                        <p className="text-xs text-muted-foreground">
                          {session?.user?.email || profile.email || "Compte KORA"}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Dernière connexion : {formatDateTime(session?.user?.last_sign_in_at)}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    >
                      Active
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm">
                        Déconnexion globale
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ferme les sessions distantes et la session de ce navigateur.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                      onClick={signOutEverywhere}
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnecter partout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* =====================================================
              PRÉFÉRENCES
          ====================================================== */}
          {tab === "preferences" && (
            <div className="space-y-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Palette className="h-5 w-5 text-gold" />
                    Thème
                  </CardTitle>
                  <CardDescription>
                    Le thème choisi est enregistré dans votre profil et appliqué immédiatement.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "light", label: "Clair", icon: "☀️" },
                      { key: "dark", label: "Sombre", icon: "🌙" },
                      { key: "system", label: "Système", icon: "🪟" },
                    ].map((theme) => (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() =>
                          setPreferences((current) => ({
                            ...current,
                            theme: theme.key,
                          }))
                        }
                        className={cn(
                          "relative rounded-2xl border p-4 text-center transition-all",
                          preferences.theme === theme.key
                            ? "border-gold bg-gold/5 shadow-md shadow-gold/10"
                            : "border-border/60 hover:border-gold/40"
                        )}
                      >
                        <div className="text-2xl mb-1.5">{theme.icon}</div>
                        <p className="text-xs font-bold">{theme.label}</p>

                        {preferences.theme === theme.key ? (
                          <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-gold-dark" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gold" />
                    Langue
                  </CardTitle>
                  <CardDescription>
                    La préférence de langue est enregistrée pour votre compte.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="max-w-sm">
                    <Label className="text-xs font-bold mb-2 block">
                      Langue de l'interface
                    </Label>

                    <div className="relative">
                      <Languages className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Select
                        value={preferences.language}
                        onValueChange={(value) =>
                          setPreferences((current) => ({
                            ...current,
                            language: value,
                          }))
                        }
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Choisir une langue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="wo">🇸🇳 Wolof</SelectItem>
                          <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gold" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Ces choix sont enregistrés avec votre profil. Les mécanismes de notifications peuvent ensuite respecter ces préférences.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  {[
                    {
                      key: "email",
                      title: "Notifications par email",
                      description: "Recevoir les alertes KORA importantes par email.",
                    },
                    {
                      key: "push",
                      title: "Notifications push",
                      description: "Recevoir les alertes instantanées du navigateur lorsqu'elles sont disponibles.",
                    },
                    {
                      key: "marketing",
                      title: "Offres et actualités KORA",
                      description: "Recevoir les annonces, nouveautés et offres commerciales.",
                    },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm mb-0.5">{row.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.description}
                        </p>
                      </div>

                      <Switch
                        checked={!!preferences.notifications?.[row.key]}
                        onCheckedChange={(checked) =>
                          setPreferences((current) => ({
                            ...current,
                            notifications: {
                              ...current.notifications,
                              [row.key]: checked,
                            },
                          }))
                        }
                        className="shrink-0 data-[state=checked]:bg-gold-dark"
                      />
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-end pt-2">
                    <Button
                      className="gap-2"
                      onClick={savePreferences}
                      disabled={saving}
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Enregistrer les préférences
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-black text-sm mb-1">Préférences persistées</p>
                    <p className="text-xs text-muted-foreground">
                      Les choix de langue, thème et notifications sont stockés dans votre profil KORA. Le thème est appliqué immédiatement.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
