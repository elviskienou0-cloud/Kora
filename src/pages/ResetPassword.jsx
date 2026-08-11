// @ts-nocheck
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Sparkles, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { APP_PARAMS } from "@/lib/app-params"

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: "", confirm: "" })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

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
    if (!password || !confirm) {
      toast.error("Veuillez remplir tous les champs")
      return
    }
    if (password.length < 6) {
      toast.error("6 caractères minimum requis")
      return
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success("Mot de passe mis à jour 🎉", { description: "Vous pouvez maintenant vous connecter." })
    setDone(true)
    setIsLoading(false)
  }

  const strengthColors = ["bg-muted", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"]

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
              {done ? "Mot de passe réinitialisé avec succès" : "Choisissez un mot de passe sécurisé"}
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
                <Button className="w-full h-12 font-bold gap-2" onClick={() => navigate("/login")}>
                  Se connecter <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pwd">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="pwd"
                      type={showPwd ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={update("password")}
                      className="pl-11 pr-11"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors" tabIndex={-1}>
                      {showPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : strengthColors[0]}`} />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={update("confirm")}
                      className="pl-11 pr-11"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-gold-dark transition-colors" tabIndex={-1}>
                      {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 gap-2 font-bold text-base" disabled={isLoading}>
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />Mise à jour...</>
                  ) : (
                    <>Réinitialiser <ArrowRight className="h-4.5 w-4.5" /></>
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-sm font-medium">
              <Link to="/login" className="font-bold gold-text-gradient hover:underline">
                ← Retour à la connexion
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
