import { Link } from "react-router-dom"
import { Scale, ArrowLeft } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function MentionsLegales() {
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
            <Scale className="h-6 w-6" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Mentions légales
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            Dernière mise à jour : 17 septembre 2026
          </p>
        </div>

        <div className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Éditeur du site
            </h2>

            <p>
              La plateforme KORA est éditée par l'entité légalement
              responsable de l'exploitation du service.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 p-5 dark:bg-gray-900">
              <p>
                <strong>Nom :</strong> [À compléter]
              </p>
              <p>
                <strong>Forme juridique :</strong> [À compléter]
              </p>
              <p>
                <strong>Adresse :</strong> [À compléter]
              </p>
              <p>
                <strong>RCCM :</strong> [À compléter si applicable]
              </p>
              <p>
                <strong>IFU :</strong> [À compléter si applicable]
              </p>
              <p>
                <strong>E-mail :</strong> [À compléter]
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Directeur de publication
            </h2>

            <p>
              <strong>Directeur de publication :</strong> [À compléter]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Hébergement
            </h2>

            <p>
              Les informations relatives à l'hébergeur de KORA doivent être
              complétées avec les coordonnées exactes du prestataire utilisé
              pour l'hébergement de la plateforme.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 p-5 dark:bg-gray-900">
              <p>
                <strong>Hébergeur :</strong> [À compléter]
              </p>
              <p>
                <strong>Adresse :</strong> [À compléter]
              </p>
              <p>
                <strong>Site web :</strong> [À compléter]
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Propriété intellectuelle
            </h2>

            <p>
              Sauf indication contraire, les éléments composant KORA,
              notamment le nom, le logo, les interfaces, les textes, les
              éléments graphiques et les logiciels, sont protégés par les
              règles applicables en matière de propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Responsabilité
            </h2>

            <p>
              KORA met en œuvre des moyens raisonnables pour assurer la
              disponibilité et la sécurité du service. Toutefois, aucune
              plateforme en ligne ne peut garantir une disponibilité
              permanente ou l'absence totale d'erreurs, d'interruptions ou de
              problèmes de sécurité.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Contenu des utilisateurs
            </h2>

            <p>
              Les utilisateurs restent responsables des informations,
              photographies, vidéos, portfolios et autres contenus qu'ils
              publient sur KORA et doivent disposer des droits nécessaires
              pour les utiliser.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Liens externes
            </h2>

            <p>
              KORA peut contenir des liens vers des services ou sites
              externes. KORA n'est pas responsable du contenu, de la
              disponibilité ou des pratiques de ces services externes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              8. Contact
            </h2>

            <p>
              Pour toute question concernant les présentes mentions légales,
              vous pouvez contacter KORA.
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