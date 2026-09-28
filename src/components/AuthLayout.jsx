import { Outlet, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils.js"

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/30 to-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/10 blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gold-light/20 blur-3xl translate-y-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className={cn(
              "w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/25 group-hover:shadow-gold/40 transition-shadow duration-300"
            )}>
              <img src="/favicon.svg" alt="KORA" className="h-full w-full rounded-2xl object-contain" />
            </div>
            <span className="text-3xl font-bold tracking-tight gold-text-gradient font-display">
              KORA
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border p-8 backdrop-blur-sm"
        >
          <Outlet />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-muted-foreground"
        >
          En vous connectant, vous acceptez nos Conditions d&apos;Utilisation
          et notre Politique de Confidentialité.
        </motion.p>
      </div>
    </div>
  )
}
