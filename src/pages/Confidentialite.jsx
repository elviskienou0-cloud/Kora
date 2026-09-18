import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
            KORA
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Politique de confidentialité
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            Dernière mise à jour : 17 septembre 2026
          </p>
        </div>

        <div className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Introduction
            </h2>

            <p>
              KORA accorde une importance particulière à la protection des
              données personnelles de ses utilisateurs. Cette politique
              explique quelles données peuvent être collectées, pourquoi elles
              sont utilisées et comment elles peuvent être protégées.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Données collectées
            </h2>

            <p>
              Selon les fonctionnalités utilisées, KORA peut collecter des
              informations nécessaires à la création et à l'utilisation d'un
              compte, notamment le nom, l'adresse e-mail, le numéro de
              téléphone, les informations relatives au profil professionnel
              ainsi que les informations ajoutées volontairement par
              l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Utilisation des données
            </h2>

            <p>
              Les données peuvent être utilisées afin de permettre la création
              et la gestion des comptes, l'affichage des profils, la mise en
              relation entre utilisateurs, la gestion des demandes et projets,
              l'amélioration du service et la sécurité de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Partage des données
            </h2>

            <p>
              KORA ne doit partager les données personnelles qu'avec les
              services et prestataires nécessaires au fonctionnement de la
              plateforme ou lorsque la loi l'exige. Les informations visibles
              publiquement sur un profil peuvent naturellement être consultées
              par les visiteurs et utilisateurs autorisés.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Sécurité
            </h2>

            <p>
              KORA met en place des mesures techniques et organisationnelles
              destinées à protéger les données contre les accès non autorisés,
              la perte, l'altération ou la divulgation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Conservation
            </h2>

            <p>
              Les données sont conservées pendant la durée nécessaire au
              fonctionnement du service et conformément aux obligations
              légales applicables.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Droits des utilisateurs
            </h2>

            <p>
              Selon la réglementation applicable, les utilisateurs peuvent
              disposer de droits concernant leurs données personnelles,
              notamment des droits d'accès, de rectification, de suppression
              ou d'opposition.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              8. Cookies
            </h2>

            <p>
              KORA peut utiliser des cookies ou technologies similaires pour
              assurer certaines fonctionnalités, améliorer l'expérience
              utilisateur et, lorsque cela est applicable, mesurer l'utilisation
              du service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">
              9. Contact
            </h2>

            <p>
              Pour toute question concernant la protection des données
              personnelles ou l'exercice de vos droits, veuillez utiliser la
              page de contact de KORA.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
