import { Link } from "react-router-dom"
import { Cookie, ArrowLeft } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function Cookies() {
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
            <Cookie className="h-6 w-6" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Politique cookies
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            Dernière mise à jour : 17 septembre 2026
          </p>
        </div>

        <div className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Qu'est-ce qu'un cookie ?
            </h2>

            <p>
              Un cookie est un petit fichier enregistré sur votre appareil
              lorsqu'un site ou une application est consulté. Il peut
              permettre au service de reconnaître votre navigateur et de
              conserver certaines informations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Utilisation des cookies par KORA
            </h2>

            <p>
              KORA peut utiliser des cookies ou des technologies similaires
              pour assurer le fonctionnement de la plateforme, maintenir
              certaines préférences et améliorer l'expérience utilisateur.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Cookies nécessaires
            </h2>

            <p>
              Certains cookies ou mécanismes de stockage peuvent être
              nécessaires au fonctionnement de fonctionnalités essentielles,
              notamment l'authentification, la sécurité et la conservation de
              certaines préférences.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Cookies de mesure et d'amélioration
            </h2>

            <p>
              Lorsque ces outils sont utilisés, certaines technologies peuvent
              permettre de comprendre comment les visiteurs utilisent KORA afin
              d'améliorer les performances et l'expérience de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Gestion des cookies
            </h2>

            <p>
              Vous pouvez généralement contrôler ou supprimer les cookies
              depuis les paramètres de votre navigateur. La désactivation de
              certains cookies peut toutefois affecter le fonctionnement de
              certaines fonctionnalités.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Évolution de cette politique
            </h2>

            <p>
              Cette politique peut être mise à jour lorsque les fonctionnalités
              de KORA ou les technologies utilisées par la plateforme évoluent.
              La date de dernière mise à jour sera indiquée en haut de cette
              page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Contact
            </h2>

            <p>
              Pour toute question concernant l'utilisation des cookies sur
              KORA, vous pouvez consulter notre page de contact.
            </p>

            <Link
              to="/contact"
              className="mt-4 inline-flex font-medium underline underline-offset-4"
            >
              Contacter KORA
            </Link>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
