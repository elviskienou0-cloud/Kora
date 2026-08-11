import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  User, Bell, Shield, Palette, Globe, Key, Trash2, CheckCircle2,
  Camera, Mail, Phone, MapPin, Save, AlertTriangle, Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const NAV = [
  { id: "profile", label: "Profil", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "appearance", label: "Apparence", icon: Palette },
]

export default function ManagerSettings() {
  const [tab, setTab] = useState("profile")
  const [profile, setProfile] = useState({
    name: "Mamadou Diallo",
    email: "mamadou@kora.africa",
    phone: "+221 77 000 00 00",
    location: "Dakar, Sénégal",
    company: "KORA Management Studio",
    role: "Manager",
    bio: "Passionné par la mise en relation de talents avec les opportunités qui leur sont dues.",
  })
  const [security, setSecurity] = useState({ oldPwd: "", newPwd: "", confirm: "" })
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    emails: true,
    push: true,
    marketing: false,
    twofa: false,
    darkMode: "auto",
    lang: "fr",
  })

  const save = async (key) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    toast.success("Paramètres enregistrés ✅", { description: key === "profile" ? "Profil mis à jour" : key === "security" ? "Sécurité appliquée" : "Préférences prises en compte" })
    setSaving(false)
  }

  const updateProfile = (k) => (e) => setProfile({ ...profile, [k]: e.target.value })
  const updateSec = (k) => (e) => setSecurity({ ...security, [k]: e.target.value })

  const initials = profile.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre compte et vos préférences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <Card className="border-border/60 h-fit lg:sticky lg:top-20 overflow-hidden">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {NAV.map((n) => {
                const Icon = n.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => setTab(n.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group",
                      tab === n.id
                        ? "bg-gold/10 text-gold-dark shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4.5 w-4.5", tab === n.id ? "text-gold-dark" : "text-muted-foreground group-hover:text-foreground")} />
                    {n.label}
                  </button>
                )
              })}
            </nav>
            <Separator className="my-2" />
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-500/10 transition-all" onClick={() => toast.error("Action irréversible confirmée dans le dialogue.")}>
              <Trash2 className="h-4.5 w-4.5" /> Supprimer mon compte
            </button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {tab === "profile" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/60 overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                      <AvatarFallback className="gold-gradient text-white text-2xl font-black">{initials}</AvatarFallback>
                    </Avatar>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/30 border-2 border-background" onClick={() => toast.info("Upload photo à venir")}>
                      <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg mb-0.5">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{profile.email} · {profile.role}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-bold">
                        <CheckCircle2 className="h-3 w-3" /> Email vérifié
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 font-bold">
                        <Key className="h-3 w-3" /> Authentification OK
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2"><User className="h-5 w-5 text-gold" /> Informations du profil</CardTitle>
                  <CardDescription className="text-sm">Ces informations sont visibles par les talents de votre équipe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-bold">Nom complet</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="name" value={profile.name} onChange={updateProfile("name")} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" value={profile.email} onChange={updateProfile("email")} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-bold">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" value={profile.phone} onChange={updateProfile("phone")} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loc" className="text-xs font-bold">Localisation</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="loc" value={profile.location} onChange={updateProfile("location")} className="pl-10" />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="company" className="text-xs font-bold">Structure / Entreprise</Label>
                      <Input id="company" value={profile.company} onChange={updateProfile("company")} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="bio" className="text-xs font-bold">À propos / Bio</Label>
                      <textarea
                        id="bio"
                        rows={4}
                        value={profile.bio}
                        onChange={updateProfile("bio")}
                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setProfile(profile)}>Annuler</Button>
                    <Button className="gap-2" onClick={() => save("profile")} disabled={saving}>
                      {saving ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" /> Enregistrement...</>
                      ) : (
                        <><Save className="h-4 w-4" /> Enregistrer</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2"><Bell className="h-5 w-5 text-gold" /> Préférences de notifications</CardTitle>
                  <CardDescription className="text-sm">Choisissez les canaux et types d'alertes que vous souhaitez recevoir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { k: "emails", t: "Notifications par email", d: "Tâches assignées, réponses, rappels d'échéance" },
                    { k: "push", t: "Notifications push navigateur", d: "Alertes instantanées quand vous êtes en ligne" },
                    { k: "marketing", t: "Offres et actualités KORA", d: "Nouvelles fonctionnalités, évènements, réductions exclusives" },
                    { k: "twofa", t: "Alertes de sécurité critiques", d: "Connexions suspectes, modifications mot de passe" },
                  ].map((row) => (
                    <div key={row.k} className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl hover:bg-accent/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm mb-0.5">{row.t}</p>
                        <p className="text-xs text-muted-foreground">{row.d}</p>
                      </div>
                      <Switch
                        checked={prefs[row.k]}
                        onCheckedChange={(v) => setPrefs({ ...prefs, [row.k]: v })}
                        className="shrink-0 data-[state=checked]:bg-gold-dark"
                      />
                    </div>
                  ))}
                  <Separator />
                  <div className="pt-2 flex justify-end">
                    <Button className="gap-2" onClick={() => save("notifs")} disabled={saving}>
                      <Save className="h-4 w-4" /> Sauvegarder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === "security" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2"><Lock className="h-5 w-5 text-gold" /> Changer le mot de passe</CardTitle>
                  <CardDescription className="text-sm">Minimum 8 caractères, avec chiffres et symboles recommandés.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="old" className="text-xs font-bold">Mot de passe actuel</Label>
                    <Input id="old" type="password" value={security.oldPwd} onChange={updateSec("oldPwd")} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new1" className="text-xs font-bold">Nouveau mot de passe</Label>
                      <Input id="new1" type="password" value={security.newPwd} onChange={updateSec("newPwd")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new2" className="text-xs font-bold">Confirmer</Label>
                      <Input id="new2" type="password" value={security.confirm} onChange={updateSec("confirm")} />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button variant="outline" onClick={() => setSecurity({ oldPwd: "", newPwd: "", confirm: "" })}>Effacer</Button>
                    <Button className="gap-2" onClick={() => save("security")} disabled={saving}>
                      {saving ? "Mise à jour..." : <><Key className="h-4 w-4" /> Mettre à jour</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-gold/20">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-emerald-600" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black mb-1">Activer l'authentification à deux facteurs (2FA)</h3>
                    <p className="text-sm text-muted-foreground mb-3">Ajoutez une couche de sécurité à votre compte KORA. Accès par code SMS ou application authenticator.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="gap-2" onClick={() => toast.info("Configuration 2FA à venir")}>
                        Configurer par SMS
                      </Button>
                      <Button className="gap-2" onClick={() => setPrefs({ ...prefs, twofa: !prefs.twofa })} variant={prefs.twofa ? "default" : "secondary"}>
                        <CheckCircle2 className="h-4 w-4" /> {prefs.twofa ? "Activé · App" : "Activer · App"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black mb-1 text-red-700">Zone dangereuse</h3>
                    <p className="text-sm text-muted-foreground mb-3">La suppression de votre compte est définitive. Vos données et accès seront effacés.</p>
                    <Button variant="destructive" className="gap-2" onClick={() => toast.error("Contactez le support avant toute suppression.")}>
                      <Trash2 className="h-4 w-4" /> Supprimer mon compte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {tab === "appearance" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-black flex items-center gap-2"><Palette className="h-5 w-5 text-gold" /> Apparence</CardTitle>
                  <CardDescription className="text-sm">Personnalisez votre interface KORA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-xs font-bold mb-2 block">Thème</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { k: "light", l: "Clair", icon: "☀️" },
                        { k: "dark", l: "Sombre", icon: "🌙" },
                        { k: "auto", l: "Auto", icon: "🪟" },
                      ].map((t) => (
                        <button
                          key={t.k}
                          onClick={() => setPrefs({ ...prefs, darkMode: t.k })}
                          className={cn(
                            "relative rounded-2xl border p-4 text-center transition-all",
                            prefs.darkMode === t.k ? "border-gold bg-gold/5 shadow-md shadow-gold/10" : "border-border/60 hover:border-gold/40"
                          )}
                        >
                          <div className="text-2xl mb-1.5">{t.icon}</div>
                          <p className="text-xs font-bold">{t.l}</p>
                          {prefs.darkMode === t.k && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-gold-dark" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lang" className="text-xs font-bold mb-2 block">Langue de l'interface</Label>
                    <div className="relative max-w-xs">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={prefs.lang} onValueChange={(v) => setPrefs({ ...prefs, lang: v })}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Langue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="wo">🇸🇳 Wolof</SelectItem>
                          <SelectItem value="ar">🇹🇳 العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button className="gap-2" onClick={() => save("appearance")}>
                      <Save className="h-4 w-4" /> Appliquer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
