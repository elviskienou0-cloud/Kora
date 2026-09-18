import { Link } from "react-router-dom"
import { Bug, ArrowLeft, Mail } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function SignalerProbleme() {
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
            <Bug className="h-6 w-6" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Signaler un problème
          </h1>

          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Vous avez rencontré un bug ou un problème sur KORA ? Signalez-le
            afin que nous puissions l'identifier et l'améliorer.
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-2xl font-semibold">
              Comment signaler un problème ?
            </h2>

            <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">
              Lorsque vous signalez un problème, essayez de fournir le plus
              d'informations possible afin de faciliter son identification.
            </p>

            <ul className="mt-5 list-disc space-y-3 pl-6 text-gray-600 dark:text-gray-400">
              <li>Décrivez clairement le problème rencontré.</li>
              <li>Indiquez la page ou la fonctionnalité concernée.</li>
              <li>Expliquez les étapes qui permettent de reproduire le problème.</li>
              <li>Indiquez le message d'erreur affiché, s'il y en a un.</li>
              <li>
                Ajoutez une capture d'écran si elle permet de mieux comprendre
                le problème.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
            <h2 className="text-2xl font-semibold">
              Nous contacter
            </h2>

            <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">
              Pour signaler un bug, vous pouvez contacter l'équipe KORA par
              e-mail en décrivant le problème rencontré.
            </p>

            <a
              href="mailto:kora.contact@gmail.com"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
            >
              <Mail className="h-4 w-4" />
              Signaler par e-mail
            </a>
          </section>

          <section className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-900">
            <h2 className="text-xl font-semibold">
              Autre demande ?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
              Pour une question générale, consultez la FAQ ou contactez
              directement KORA.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/faq"
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium transition hover:bg-white dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Consulter la FAQ
              </Link>

              <Link
                to="/contact"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
              >
                Contact
              </Link>
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}