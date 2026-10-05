import { Link } from "react-router-dom"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">KORA</p>
          <h1 className="text-4xl font-bold tracking-tight">Politique de confidentialité</h1>
          <p className="mt-4 text-sm text-gray-500">Dernière mise à jour : 5 octobre 2026</p>
        </div>

        <div className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">1. Responsable du traitement</h2>
            <p>KORA est exploité par <strong>Kienou Elvis Dan Aurèle</strong>, personne physique établie à Ouagadougou, Burkina Faso.</p>
            <p className="mt-3">Contact pour les données personnelles : <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a> — +226 70 27 18 10.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">2. Données que KORA peut traiter</h2>
            <p>Selon les fonctionnalités utilisées, KORA peut traiter notamment : identité et nom, adresse e-mail, numéro de téléphone, ville, entreprise, biographie, préférences, photo de profil et de couverture, informations de profils de talents, demandes, projets, favoris, messages, notifications, informations d'abonnement et de paiement nécessaires au suivi du service, ainsi que les données techniques nécessaires à la sécurité et au fonctionnement.</p>
            <p className="mt-3">Les utilisateurs doivent éviter de publier des données sensibles ou concernant des tiers lorsqu'elles ne sont pas nécessaires au service et ne disposent pas des droits nécessaires.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">3. Finalités</h2>
            <p>Les données sont utilisées pour créer et administrer les comptes, authentifier les utilisateurs, permettre la mise en relation entre clients et managers, gérer les talents et projets, traiter les demandes et messages, gérer les abonnements et paiements, assurer la sécurité, prévenir les abus et fraudes, répondre aux demandes des utilisateurs, réaliser les opérations administratives nécessaires et améliorer le fonctionnement de KORA.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">4. Données nécessaires et facultatives</h2>
            <p>Les informations indispensables à la création du compte ou à une fonctionnalité sont signalées dans les formulaires concernés. D'autres informations, telles que certaines informations professionnelles, biographiques, photos ou préférences, peuvent être facultatives mais leur absence peut limiter certaines fonctionnalités.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">5. Destinataires et prestataires</h2>
            <p>Les données sont accessibles uniquement aux personnes et services nécessaires au fonctionnement de KORA, selon leurs droits : l'utilisateur lui-même, les autres utilisateurs lorsque la fonctionnalité rend l'information visible, les administrateurs habilités et les prestataires techniques nécessaires.</p>
            <p className="mt-3">KORA utilise notamment Vercel pour le déploiement de l'interface et Supabase pour l'authentification, la base de données et certains services backend. Les paiements sont prévus via SasPay selon le fonctionnement commercial en vigueur.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">6. Transferts et hébergement</h2>
            <p>Certains prestataires techniques utilisés par KORA peuvent traiter des données depuis ou vers des pays situés hors du Burkina Faso. KORA documente ces prestataires et les traitements concernés dans ses dossiers de conformité et applique les mesures nécessaires à la protection des données.</p>
            <p className="mt-3">Les utilisateurs seront informés des évolutions importantes affectant les prestataires ou les modalités de traitement lorsque cela est nécessaire.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">7. Conservation</h2>
            <p>KORA conserve les données pendant la durée nécessaire aux finalités pour lesquelles elles sont traitées. Lorsqu'un compte est supprimé, les données qui n'ont plus de raison légitime d'être conservées sont supprimées ou anonymisées selon le cas.</p>
            <p className="mt-3">Certaines informations peuvent être conservées plus longtemps lorsqu'elles sont nécessaires à la sécurité, à la prévention de la fraude, à la gestion d'un litige, à la comptabilité, à l'exercice ou à la défense de droits, ou à une obligation légale.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">8. Sécurité</h2>
            <p>KORA met en œuvre des mesures techniques et organisationnelles adaptées, notamment des contrôles d'accès, des règles de sécurité de la base de données, une séparation des rôles, des protections côté serveur et des mesures destinées à limiter les accès non autorisés. Aucun service en ligne ne peut toutefois garantir une sécurité absolue.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">9. Vos droits</h2>
            <p>Selon la réglementation applicable, vous pouvez demander l'accès, la rectification, la suppression ou l'opposition au traitement de vos données, ainsi que l'exercice de tout autre droit applicable.</p>
            <p className="mt-3">Vous pouvez utiliser les fonctionnalités disponibles dans vos paramètres ou contacter KORA à <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a>. KORA peut demander des informations raisonnables pour vérifier l'identité du demandeur avant de traiter une demande.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">10. Prospection et préférences marketing</h2>
            <p>Les communications marketing sont distinctes des communications indispensables au fonctionnement du compte. Lorsqu'un consentement est requis, elles ne sont envoyées qu'après un choix positif de l'utilisateur. Le choix marketing peut être retiré depuis les préférences disponibles dans KORA ou en contactant KORA.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">11. Cookies et technologies similaires</h2>
            <p>KORA peut utiliser des mécanismes techniques nécessaires à l'authentification, à la sécurité et au fonctionnement de l'application. Les technologies non nécessaires seront traitées selon leur finalité et les choix de l'utilisateur lorsqu'un consentement est requis.</p>
            <p className="mt-3"><Link to="/cookies" className="underline">Consulter la politique cookies</Link>.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">12. Modification de la politique</h2>
            <p>Cette politique peut évoluer pour refléter les changements du service, des prestataires ou des obligations applicables. La date de dernière mise à jour est indiquée en haut de cette page.</p>
          </section>

          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">13. Contact</h2>
            <p>Pour toute question ou demande relative aux données personnelles : <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a>.</p>
            <p className="mt-3"><Link to="/contact" className="underline">Contacter KORA</Link>.</p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
