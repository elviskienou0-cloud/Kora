import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Sparkles, Mail, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { APP_PARAMS } from "@/lib/app-params"
import { supabase } from "@/lib/supabase"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      toast.error("Veuillez saisir votre email")
      return
    }

    setIsLoading(true)

    try {
      const redirectTo = `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        { redirectTo }
      )

      if (error) throw error

      // Message volontairement générique : on ne révèle pas
      // si une adresse existe ou non dans Supabase Auth.
      setEmail(cleanEmail)
      setSent(true)
      toast.success("Demande envoyée", {
        description: "Vérifiez votre boîte de réception et vos spams.",
      })
    } catch (error) {
      console.error("Erreur récupération mot de passe :", error)
      toast.error("Impossible d'envoyer le lien", {
        description: error?.message || "Réessayez dans quelques instants.",
      })
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-3xl font-black tracking-tight mb-2">Mot de passe oublié</h1>
            <CardDescription className="text-base">
              {sent ? "Consultez votre email pour réinitialiser" : "Saisissez votre email pour recevoir un lien"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-6">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="font-black text-lg mb-1">Lien de récupération envoyé ✅</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Si un compte KORA correspond à cette adresse, vous recevrez un email de réinitialisation.
                  </p>
                  <p className="text-xs text-muted-foreground">Pensez à vérifier vos spams.</p>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate("/login")}>
                    <ArrowLeft className="h-4 w-4" /> Retour connexion
                  </Button>
                  <Button className="flex-1 gap-2" onClick={() => setSent(false)}>
                    Renvoyer <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
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
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 gap-2 font-bold text-base" disabled={isLoading}>
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />Envoi...</>
                  ) : (
                    <>Envoyer le lien <ArrowRight className="h-4.5 w-4.5" /></>
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

        <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
          Besoin d'aide ? Contactez {APP_PARAMS.supportEmail}
        </p>
      </motion.div>
    </div>
  )
}
