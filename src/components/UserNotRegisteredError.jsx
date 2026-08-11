import { motion } from "framer-motion"
import { AlertTriangle, ArrowRight, LogIn, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils.js"

export default function UserNotRegisteredError({
  email,
  onRetry,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6",
        className
      )}
    >
      <div className="flex gap-4">
        <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            Compte introuvable
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {email ? (
              <>
                Aucun compte KORA n&apos;est associé à l&apos;adresse{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            ) : (
              "Aucun compte KORA ne correspond aux informations fournies."
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-white font-medium shadow-md shadow-gold/25 hover:shadow-gold/40 hover:opacity-95 transition-all text-sm"
            >
              <UserPlus className="h-4 w-4" />
              Créer un compte
              <ArrowRight className="h-4 w-4 -mr-1" />
            </Link>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-accent font-medium transition-all text-sm text-foreground"
            >
              <LogIn className="h-4 w-4" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
