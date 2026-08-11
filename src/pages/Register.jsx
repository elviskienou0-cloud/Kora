import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Sparkles, User, Mail, Lock, Eye, EyeOff, ArrowRight, UserCircle2, Briefcase, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import GoogleIcon from "@/components/GoogleIcon"
import { useAuth } from "@/lib/AuthContext"
import { APP_PARAMS } from "@/lib/app-params"
import { cn } from "@/lib/utils"

const ROLES = [
  {
    id: "client",
    label: "Client",
    description: "Je recrute des talents",
    icon: Users,
    color: "from-blue-400/20 to-blue-500/10 text-blue-600",
  },
  {
    id: "talent",
    label: "Talent",
    description: "Je propose mes services",
    icon: UserCircle2,
    color: "from-emerald-400/20 to-emerald-500/10 text-emerald-600",
  },
  {
    id: "manager",
    label: "Manager",
    description: "Je gère une équipe",
    icon: Briefcase,
    color: "from-violet-400/20 to-violet-500/10 text-violet-600",
  },
]

export default function Register() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: searchParams.get("role") || "client",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate("/home", { replace: true })
  }, [isAuthenticated, navigate])

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { firstName, lastName, email, password, confirmPassword, role } = form
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs")
      return
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }
    setIsLoading(true)
    try {
      await register({ firstName, lastName, email, password, role })
      toast.success("Compte créé avec succès !", { description: "Bienvenue dans la communauté KORA 🎉" })
      setTimeout(() => navigate("/home"), 50)
    } catch (err) {
      toast.error("Erreur d'inscription", { description: err.message || "Une erreur est survenue" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    toast.loading("Inscription avec Google...")
    await new Promise(r => setTimeout(r, 1200))
    toast.dismiss()
    toast.success("Compte Google créé !", { description: "Bienvenue sur KORA ✨" })
    setTimeout(() => {
      const mock = { id: "u_g", email: "google.new@demo.africa", name: "Nouveau Talent", role: form.role, avatar: null }
      localStorage.setItem("kora.auth.user", JSON.stringify(mock))
      window.location.href = "/home"
    }, 800)
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-accent/30 to-background py-12 px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/30 group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-2xl font-black gold-text-gradient">{APP_PARAMS.name}</span>
            <span className="text-[10px] font-semibold text-muted-foreground -mt-1 tracking-widest uppercase">{APP_PARAMS.tagline}</span>
          </div>
        </Link>

        <Card className="shadow-2xl shadow-gold/5 border-gold/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
          <CardHeader className="text-center pb-2 pt-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
              <h1 className="text-3xl font-black tracking-tight mb-2">Créer un compte ✨</h1>
              <CardDescription className="text-base">Rejoignez la communauté des talents africains</CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Button variant="outline" className="w-full h-12 gap-3 font-semibold" onClick={handleGoogleRegister} disabled={googleLoading}>
                <GoogleIcon className={cn("h-5 w-5", googleLoading && "animate-spin")} />
                {googleLoading ? "Inscription..." : "S'inscrire avec Google"}
              </Button>
            </motion.div>

            <div className="flex items-center gap-4 py-1">
              <Separator className="flex-1" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ou avec email</span>
              <Separator className="flex-1" />
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Label className="mb-3 block">Je suis...</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {ROLES.map((r) => {
                  const Icon = r.icon
                  const selected = form.role === r.id
                  return (
                    <button
                    key={r.id}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.id })}
                    className={cn(
                      "relative rounded-2xl border-2 p-3.5 text-left transition-all duration-200",
                      selected
                        ? "border-gold bg-gold/10 shadow-lg shadow-gold/10 ring-2 ring-gold/20"
                        : "border-border/60 hover:border-gold/30 hover:bg-gold/5"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-xl mb-2 flex items-center justify-center bg-gradient-to-br", r.color)}>
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    <p className="font-bold text-sm">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold leading-tight">{r.description}</p>
                    {selected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full gold-gradient flex items-center justify-center">
                        <ShieldCheck className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                  )
                })}
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input id="firstName" placeholder="Amadou" value={form.firstName} onChange={update("firstName")} className="pl-11" autoComplete="given-name" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input id="lastName" placeholder="Diallo" value={form.lastName} onChange={update("lastName")} className="pl-11" autoComplete="family-name" />
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="vous@exemple.com" value={form.email} onChange={update("email")} className="pl-11" autoComplete="email" />
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3.5">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={update("password")} className="pl-11 pr-11" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirmPassword} onChange={update("confirmPassword")} className="pl-11 pr-11" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Button type="submit" className="w-full h-12 gap-2 font-bold text-base" disabled={isLoading}>
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />Création du compte...</>
                  ) : (
                    <>Créer mon compte <ArrowRight className="h-4.5 w-4.5" /></>
                  )}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-sm font-medium">
              Déjà un compte ?{" "}
              <Link to="/login" className="font-black gold-text-gradient hover:underline">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
          En vous inscrivant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
        </p>
      </motion.div>
    </div>
  )
}
