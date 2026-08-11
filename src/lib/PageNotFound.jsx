import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Compass, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-lg w-full text-center"
      >
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-black gold-text-gradient mb-4 tracking-tight">
            404
          </h1>
          <div className="h-1 w-24 mx-auto gold-gradient rounded-full shimmer-bg" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Page introuvable
        </h2>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Cette page a peut-être été déplacée, supprimée ou n'a jamais existé.
          Revenons vers les terres connues.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gold-gradient text-foreground border-0 w-full sm:w-auto hover:opacity-90 transition">
            <Link to="/">
              <Home className="h-5 w-5 mr-2" />
              Accueil
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link to="/categories">
              <Compass className="h-5 w-5 mr-2" />
              Explorer
            </Link>
          </Button>
        </div>

        <div className="mt-12">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la page précédente
          </button>
        </div>
      </motion.div>
    </div>
  )
}
