import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Mail, UserRound, ArrowRight } from "lucide-react"

import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import koraLogo from "@/assets/kora-logo.svg"

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()

  const requestedRole = searchParams.get("role")
  const initialRole = requestedRole === "manager" ? "manager" : "client"

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: initialRole,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Le prénom et le nom sont obligatoires.")
      return
    }

    if (!form.email.trim()) {
      setError("L'adresse email est obligatoire.")
      return
    }

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setLoading(true)

    try {
      const result = await register({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
      })

      if (result?.pendingEmailConfirmation) {
        setSuccess(
          `Compte créé. Vérifiez votre adresse email : ${result.email}`
        )
        return
      }

      if (result?.role === "manager") {
        navigate("/manager/dashboard", { replace: true })
      } else {
        navigate("/client/dashboard", { replace: true })
      }
    } catch (err) {
      setError(err?.message || "Impossible de créer le compte.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-14">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <Link to="/" className="mx-auto mb-8 flex items-center gap-3 group">
          <div className="h-12 w-12 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border transition-all group-hover:scale-105 group-hover:ring-gold/50">
            <img src={koraLogo} alt="KORA" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">KORA</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Plateforme professionnelle
            </div>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="overflow-hidden border-border/80 shadow-xl">
            <div className="h-0.5 bg-primary" />
            <CardHeader className="pb-3 pt-8 text-center">
              <h1 className="text-3xl font-black tracking-tight">Créer votre compte</h1>
              <CardDescription className="mt-2 text-sm">
                Rejoignez KORA en tant que client ou manager.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-4">
              {error && (
                <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <div className="relative">
                      <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} required autoComplete="given-name" className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} required autoComplete="family-name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="vous@exemple.com" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="6 caractères minimum"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Type de compte</Label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
                  >
                    <option value="client">Client — je recherche des talents</option>
                    <option value="manager">Manager — je gère des talents</option>
                  </select>
                </div>

                <Button type="submit" disabled={loading} className="h-12 w-full gap-2 font-bold">
                  {loading ? "Création du compte..." : "Créer mon compte"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link to="/login" className="font-semibold text-gold-dark hover:underline">
                  Se connecter
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En créant votre compte, vous acceptez les Conditions d'utilisation et la Politique de confidentialité.
        </p>
      </div>
    </main>
  )
}
