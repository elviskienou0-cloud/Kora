import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Sparkles, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { APP_PARAMS } from "@/lib/app-params"
import { supabase } from "@/lib/supabase"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: "", confirm: "" })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!mounted) return
        setHasRecoverySession(Boolean(data?.session))
      } catch (error) {
        console.error("Erreur session de récupération :", error)
        if (mounted) setHasRecoverySession(false)
      } finally {
        if (mounted) setCheckingSession(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(Boolean(session))
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const update = (key) => (event) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { password, confirm } = form

    if (!hasRecoverySession) {
      toast.error("Lien de récupération invalide ou expiré", {
        description: "Demandez un nouveau lien de réinitialisation.",
      })
      return
    }

    if (!password || !confirm) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    if (password.length < 8) {
      toast.error("8 caractères minimum requis")
      return
    }

    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setDone(true)
      toast.success("Mot de passe mis à jour 🎉")
    } catch (error) {
      console.error("Erreur réinitialisation mot de passe :", error)
      toast.error("Impossible de modifier le mot de passe", {
        description: error?.message || "Le lien peut être expiré.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const strengthClasses = [
    "bg-muted",
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-emerald-600",
  ]

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
            <h1 className="text-3xl font-black tracking-tight mb-2">Nouveau mot de passe</h1>
            <CardDescription className="text-base">
              {done
                ? "Mot de passe réinitialisé avec succès"
                : checkingSession
                  ? "Vérification du lien de récupération..."
                  : "Choisissez un mot de passe sécurisé"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-6">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div>
                  <p className="font-black text-xl mb-1">Parfait !</p>
                  <p className="text-sm text-muted-foreground">Votre mot de passe a bien été modifié.</p>
                </div>
                <Button className="w-full h-12 font-bold gap-2" onClick={() => navigate("/login")}>Se connecter <ArrowRight className="h-4.5 w-4.5" /></Button>
              </motion.div>
            ) : !checkingSession && !hasRecoverySession ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-4">
                <p className="font-black text-lg">Lien non valide</p>
                <p className="text-sm text-muted-foreground">Demandez un nouveau lien de récupération pour continuer.</p>
                <Button className="w-full" onClick={() => navigate("/forgot-password")}>Demander un nouveau lien</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pwd">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input id="pwd" type={showPwd ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={update("password")} className="pl-11 pr-11" autoComplete="new-password" minLength={8} required />
                    <button type="button" onClick={() => setShowPwd((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors" aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                      {showPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-colors ${i <= strength ? strengthClasses[strength] : strengthClasses[0]}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={update("confirm")} className="pl-11 pr-11" autoComplete="new-password" minLength={8} required />
                    <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors" aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}>
                      {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 gap-2 font-bold text-base" disabled={isLoading || checkingSession || !hasRecoverySession}>
                  {isLoading ? "Mise à jour..." : "Réinitialiser"}
                  {!isLoading && <ArrowRight className="h-4.5 w-4.5" />}
                </Button>
              </form>
            )}

            <p className="text-center text-sm font-medium"><Link to="/login" className="font-bold gold-text-gradient hover:underline">← Retour à la connexion</Link></p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
