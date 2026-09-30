import { useNavigate } from "react-router-dom"
import { Crown, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/AuthContext"
import AdminDashboardView from "@/components/admin/AdminDashboardView.jsx"

export default function SuperAdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const goTo = (view = "dashboard") => {
    navigate(view === "dashboard" ? "/admin" : `/admin?view=${view}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-background to-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-white shadow-sm">
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">
                Dashboard CEO
              </h1>
              <Badge variant="outline" className="gap-1 border-gold/40 text-gold-dark">
                <ShieldCheck className="h-3.5 w-3.5" />
                SuperAdmin
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Bonjour {user?.name || "CEO"} — vue globale et contrôle de KORA.
            </p>
          </div>
        </div>
      </div>

      <AdminDashboardView onNavigate={goTo} />
    </div>
  )
}
