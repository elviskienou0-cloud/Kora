import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Mail,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils.js"

export default function VerificationRequestDialog({
  open = false,
  onOpenChange,
  email,
  onSuccess,
  onCancel,
}) {
  const [step, setStep] = useState("request")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [codeInput, setCodeInput] = useState(Array(6).fill(""))

  useEffect(() => {
    if (!open) {
      setStep("request")
      setCodeInput(Array(6).fill(""))
    }
  }, [open])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleRequest = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1200))
      setCountdown(60)
      setStep("verify")
      toast.success("Code de vérification envoyé")
    } catch (_) {
      toast.error("Erreur lors de l&apos;envoi du code")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (index, value) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 1)
    const next = [...codeInput]
    next[index] = sanitized
    setCodeInput(next)
  }

  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (data.length > 0) {
      e.preventDefault()
      const next = Array(6).fill("")
      for (let i = 0; i < Math.min(data.length, 6); i++) {
        next[i] = data[i]
      }
      setCodeInput(next)
    }
  }

  const handleVerify = async (e) => {
    e?.preventDefault()
    const code = codeInput.join("")
    if (code.length !== 6) {
      toast.error("Veuillez saisir le code complet à 6 chiffres")
      return
    }
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      setStep("success")
      setTimeout(() => {
        onSuccess?.(code)
      }, 1500)
    } catch (_) {
      toast.error("Code invalide, veuillez réessayer")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-card rounded-2xl shadow-2xl shadow-black/20 border border-border overflow-hidden">
              <div className="flex items-start justify-between p-5 sm:p-6 border-b border-border">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                      step === "success"
                        ? "bg-emerald-500/10"
                        : step === "verify"
                        ? "bg-gold/10"
                        : "bg-accent"
                    )}
                  >
                    {step === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : step === "verify" ? (
                      <ShieldCheck className="h-5 w-5 text-gold" />
                    ) : (
                      <Mail className="h-5 w-5 text-gold" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight">
                      {step === "request" && "Vérification de votre compte"}
                      {step === "verify" && "Saisissez le code"}
                      {step === "success" && "Compte vérifié !"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step === "request" &&
                        (email
                          ? `Un code sera envoyé à ${email}`
                          : "Un code de vérification sera envoyé par email")}
                      {step === "verify" &&
                        `Code envoyé à ${email || "votre adresse email"}`}
                      {step === "success" && "Redirection en cours..."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="p-1.5 -m-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {step === "request" && (
                  <div className="space-y-5">
                    <div className="rounded-xl bg-accent/50 p-4 text-sm text-muted-foreground leading-relaxed">
                      Pour sécuriser votre compte KORA, nous allons vous envoyer un code
                      de vérification à 6 chiffres par email.
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={handleRequest}
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl gold-gradient text-white font-semibold shadow-md shadow-gold/25 hover:shadow-gold/40 hover:opacity-95 transition-all disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        Envoyer le code
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="sm:w-auto px-5 py-3 rounded-xl border border-border hover:bg-accent/50 font-medium transition-all disabled:opacity-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {step === "verify" && (
                  <form onSubmit={handleVerify} className="space-y-5">
                    <div className="flex justify-center gap-2 sm:gap-3 my-2">
                      {codeInput.map((digit, i) => (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={digit}
                          onChange={(e) => handleCodeChange(i, e.target.value)}
                          onPaste={i === 0 ? handlePaste : undefined}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !digit && i > 0) {
                              const prev = document.getElementById(`otp-${i - 1}`)
                              prev?.focus()
                            }
                            if (digit && e.key !== "Backspace" && i < 5) {
                              const next = document.getElementById(`otp-${i + 1}`)
                              next?.focus()
                            }
                          }}
                          id={`otp-${i}`}
                          className={cn(
                            "w-10 h-12 sm:w-12 sm:h-14 rounded-xl text-center text-xl sm:text-2xl font-bold",
                            "border-2 bg-background focus:outline-none transition-all",
                            digit
                              ? "border-gold focus:ring-2 focus:ring-gold/30"
                              : "border-border focus:border-gold focus:ring-2 focus:ring-gold/30"
                          )}
                          maxLength={1}
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {countdown > 0 ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Renvoyer dans {countdown}s
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequest}
                          disabled={loading}
                          className="text-sm font-medium text-gold hover:text-gold-dark disabled:opacity-50"
                        >
                          Renvoyer le code
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="submit"
                        disabled={loading || codeInput.join("").length !== 6}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl gold-gradient text-white font-semibold shadow-md shadow-gold/25 hover:shadow-gold/40 hover:opacity-95 transition-all disabled:opacity-60"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        Vérifier
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("request")}
                        disabled={loading}
                        className="sm:w-auto px-5 py-3 rounded-xl border border-border hover:bg-accent/50 font-medium transition-all disabled:opacity-50"
                      >
                        Retour
                      </button>
                    </div>
                  </form>
                )}

                {step === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </motion.div>
                    <p className="text-base font-semibold mb-1">Vérification réussie</p>
                    <p className="text-sm text-muted-foreground">
                      Bienvenue dans KORA ! Préparation de votre espace...
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
