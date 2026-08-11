import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles as SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import GoogleIcon from "@/components/GoogleIcon"
import { useAuth } from "@/lib/AuthContext"
import { APP_PARAMS } from "@/lib/app-params"
import { cn } from "@/lib/utils"

export default function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate("/home", { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs")
      return
    }
    setIsLoading(true)
    try {
      await login({ email, password })
      toast.success("Connexion réussie !", { description: "Bienvenue sur KORA 🎉" })
      setTimeout(() => navigate("/home"), 50)
    } catch (err) {
      toast.error("Erreur de connexion", { description: err.message || "Identifiants incorrects" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    toast.loading("Connexion avec Google...")
    await new Promise(r => setTimeout(r, 1200))
    toast.dismiss()
    toast.message("Mode démo", { description: "Connexion Google simulée avec succès !", icon: <SparklesIcon className='h-5 w-5 text-gold-dark' /> })
    setTimeout(() => {
      const mock = { id: "u_google", email: "google@demo.africa", name: "Google User", role: "client", avatar: null }
      localStorage.setItem("kora.auth.user", JSON.stringify(mock))
      window.location.href = "/home"
    }, 800)
    setGoogleLoading(false)
  }

  const fillMock = (role) => {
    if (role === "admin") { setEmail("admin@kora.africa"); setPassword("admin123") }
    else if (role === "manager") { setEmail("manager@kora.africa"); setPassword("manager123") }
    else if (role === "client") { setEmail("client@kora.africa"); setPassword("client123") }
    else { setEmail("talent@kora.africa"); setPassword("talent123") }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-accent/30 to-background py-12 px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenue 👋</h1>
              <CardDescription className="text-base">Connectez-vous pour accéder à votre espace</CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Button
                variant="outline"
                className="w-full h-12 gap-3 font-semibold"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                <GoogleIcon className={cn("h-5 w-5", googleLoading && "animate-spin")} />
                {googleLoading ? "Connexion..." : "Continuer avec Google"}
              </Button>
            </motion.div>

            <div className="flex items-center gap-4 py-1">
              <Separator className="flex-1" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ou avec email</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                    autoComplete="email"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link to="/forgot-password" className="text-xs font-bold text-gold-dark hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button type="submit" className="w-full h-12 gap-2 font-bold text-base" disabled={isLoading}>
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />Connexion...</>
                  ) : (
                    <>Se connecter <ArrowRight className="h-4.5 w-4.5" /></>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="rounded-2xl border border-gold/15 bg-gold/5 p-4">
              <p className="text-xs font-bold text-gold-dark mb-2.5 flex items-center gap-1.5">
                <SparklesIcon className="h-3.5 w-3.5" /> Comptes de démonstration (cliquez pour remplir)
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Admin", role: "admin" },
                  { label: "Manager", role: "manager" },
                  { label: "Client", role: "client" },
                  { label: "Talent", role: "talent" },
                ].map((r) => (
                  <Badge
                    key={r.role}
                    variant="outline"
                    className="cursor-pointer hover:bg-gold/20 hover:border-gold/40 transition-all select-none"
                    onClick={() => fillMock(r.role)}
                  >
                    {r.label}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-center text-sm font-medium">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-black gold-text-gradient hover:underline">
                Créer un compte
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
          En vous connectant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
        </p>
      </motion.div>
    </div>
  )
}
