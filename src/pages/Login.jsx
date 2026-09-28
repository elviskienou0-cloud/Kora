import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"

import { useAuth } from "@/lib/AuthContext"
import { APP_PARAMS } from "@/lib/app-params"
import koraLogo from "@/assets/kora-logo.svg"

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading: authLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }

    setIsLoading(true)

    try {
      const connectedUser = await login({ email: email.trim(), password })

      toast.success("Connexion réussie !", {
        description: "Bienvenue sur KORA.",
      })

      const destination =
        connectedUser?.role === "admin"
          ? "/admin"
          : connectedUser?.role === "manager"
          ? "/manager/dashboard"
          : "/client/dashboard"

      navigate(destination, { replace: true })
    } catch (error) {
      toast.error("Erreur de connexion", {
        description: error?.message || "Identifiants incorrects.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loading = isLoading || authLoading

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm ring-1 ring-border group-hover:ring-gold/50 group-hover:scale-105 transition-all">
            <img src={koraLogo} alt="KORA" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-2xl font-black tracking-tight text-foreground">{APP_PARAMS.name}</span>
            <span className="text-[10px] font-semibold text-muted-foreground -mt-1 tracking-widest uppercase">
              {APP_PARAMS.tagline}
            </span>
          </div>
        </Link>

        <Card className="shadow-xl border-border/80 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />

          <CardHeader className="text-center pb-2 pt-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
              <h1 className="text-3xl font-black tracking-tight mb-2">Bienvenue 👋</h1>
              <CardDescription className="text-base">Connectez-vous pour accéder à votre espace</CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-11"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="space-y-2">
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-11 pr-11"
                    autoComplete="current-password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button type="submit" className="w-full h-12 gap-2 font-bold text-base" disabled={loading}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="h-4.5 w-4.5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-semibold text-gold-dark hover:underline">
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