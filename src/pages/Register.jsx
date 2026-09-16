import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "@/lib/AuthContext"

export default function Register() {
const navigate = useNavigate()
const { register } = useAuth()

const [form, setForm] = useState({
firstName: "",
lastName: "",
email: "",
password: "",
role: "client",
})

const [loading, setLoading] = useState(false)
const [error, setError] = useState("")
const [success, setSuccess] = useState("")

function handleChange(event) {
const { name, value } = event.target

setForm((previous) => ({
  ...previous,
  [name]: value,
}))

}

async function handleSubmit(event) {
event.preventDefault()

setError("")
setSuccess("")
setLoading(true)

try {
  const result = await register(form)

 if (result?.pendingEmailConfirmation) {
  setSuccess(
    "Compte créé. Vérifiez votre adresse email : " +
      result.email
  )
  return
}

  navigate("/home", { replace: true })
} catch (err) {
  setError(
    err?.message ||
      "Impossible de créer le compte."
  )
} finally {
  setLoading(false)
}

}

return ( <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10"> <div className="w-full max-w-md"> <div className="mb-8 text-center"> <h1 className="text-3xl font-bold">
Créer un compte KORA </h1>

      <p className="mt-2 text-muted-foreground">
        Rejoignez KORA en tant que client ou manager.
      </p>
    </div>

    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      {error && (
        <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
          {success}
        </div>
      )}

      <form
  onSubmit={handleSubmit}
  className="space-y-4 relative z-[9999] pointer-events-auto"
>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="mb-2 block text-sm font-medium"
            >
              Prénom
            </label>

            <input
  id="firstName"
  name="firstName"
  type="text"
  value={form.firstName}
  onChange={handleChange}
  required
  autoFocus
  className="w-full rounded-lg border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary pointer-events-auto"
/>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-2 block text-sm font-medium"
            >
              Nom
            </label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium"
          >
            Mot de passe
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="mb-2 block text-sm font-medium"
          >
            Type de compte
          </label>

          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-lg border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="client">
              Client
            </option>

            <option value="manager">
              Manager
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Création du compte..."
            : "Créer mon compte"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ?{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:underline"
        >
          Se connecter
        </Link>
      </div>
    </div>
  </div>
</main>
)
}