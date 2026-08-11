// @ts-nocheck
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Sparkles, ShieldCheck, User, Lock, ChevronRight, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { APP_PARAMS } from "@/lib/app-params"

const DEFAULT_SCOPES = [
  { id: "profile", label: "Profil public", desc: "Nom, photo et email", icon: User },
  { id: "email", label: "Adresse email", desc: "Pour vous contacter", icon: ShieldCheck },
]

export default function OAuthConsent() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const client = searchParams.get("client") || "Application Partenaire"
  const [isLoading, setIsLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const handleAccept = async () => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setAccepted(true)
    toast.success("Autorisation accordée ✅")
    setTimeout(() => navigate("/home"), 900)
  }

  const handleDecline = () => {
    toast.info("Autorisation refusée")
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background via-accent/30 to-background py-12 px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-400/15 blur-3xl" />
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400/20 to-blue-500/20 flex items-center justify-center border border-violet-400/30">
                <Lock className="h-7 w-7 text-violet-600" />
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-md shadow-gold/25">
                <Sparkles className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">
              {accepted ? "Connexion réussie" : "Demande d'autorisation"}
            </h1>
            <CardDescription className="text-base">
              {accepted
                ? "Redirection en cours..."
                : <> <span className="font-black text-foreground">{client}</span> souhaite accéder à votre compte KORA </>}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-6">
            {accepted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <p className="font-black text-lg">Autorisation accordée</p>
              </motion.div>
            ) : (
              <>
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-border/60 bg-muted/30">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Autorisations demandées</p>
                  </div>
                  <div className="divide-y divide-border/60">
                    {DEFAULT_SCOPES.map((s) => {
                      const Icon = s.icon
                      return (
                        <div key={s.id} className="flex items-start gap-3 px-5 py-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-gold-dark" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm">{s.label}</p>
                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold">Requis</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Sécurité garantie :</span> cette application ne pourra jamais modifier votre mot de passe ni accéder à vos informations de paiement. Vous pouvez révoquer cet accès à tout moment depuis vos paramètres.
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 h-12 font-bold gap-2" onClick={handleDecline} disabled={isLoading}>
                    <X className="h-4.5 w-4.5" /> Refuser
                  </Button>
                  <Button className="flex-1 h-12 font-bold gap-2" onClick={handleAccept} disabled={isLoading}>
                    {isLoading ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />Validation...</>
                    ) : (
                      <><CheckCircle2 className="h-4.5 w-4.5" /> Autoriser</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
