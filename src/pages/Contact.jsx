import { Link } from "react-router-dom"
import { Mail, ArrowLeft } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function Contact() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        <div className="mb-10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900">
            <Mail className="h-6 w-6" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Contact
          </h1>

          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Une question, une demande ou besoin d'aide ? L'équipe KORA est à
            votre écoute.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-xl font-semibold">
              Nous contacter
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              Pour toute question concernant KORA, votre compte, votre profil
              ou l'utilisation de la plateforme, vous pouvez nous contacter
              par e-mail.
            </p>

            <a
              href="mailto:kora.contact1@gmail.com"
              className="mt-6 inline-flex items-center gap-2 font-medium underline underline-offset-4"
            >
              <Mail className="h-4 w-4" />
              kora.contact1@gmail.com
            </a>
          </section>

          <section className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-xl font-semibold">
              Besoin d'aide ?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              Consultez également notre FAQ pour trouver rapidement les
              réponses aux questions les plus fréquentes.
            </p>

            <Link
              to="/faq"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
            >
              Consulter la FAQ
            </Link>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
