import { Link } from "react-router-dom"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function Cgv() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link to="/" className="mb-8 inline-flex text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">← Retour à l'accueil</Link>
        <div className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">KORA</p>
          <h1 className="text-4xl font-bold tracking-tight">Conditions Générales de Vente</h1>
          <p className="mt-4 text-sm text-gray-500">Dernière mise à jour : 5 octobre 2026</p>
        </div>
        <article className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">1. Objet</h2><p>Les présentes CGV encadrent la souscription aux offres payantes KORA proposées aux managers.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">2. Offres et prix</h2><p>L'offre Pro est proposée à <strong>2 500 FCFA</strong> et l'offre Business à <strong>5 000 FCFA</strong>, selon les fonctionnalités et limites affichées par KORA au moment de la souscription. KORA affiche le prix applicable avant validation du paiement.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">3. Essai gratuit</h2><p>KORA peut proposer une période d'essai gratuite de <strong>30 jours</strong>. L'essai est destiné à être utilisé une seule fois par utilisateur et n'est pas renouvelé automatiquement.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">4. Paiement et activation</h2><p>Les paiements sont traités via le moyen de paiement retenu par KORA, actuellement SasPay. Lorsqu'une vérification manuelle est prévue, le paiement est contrôlé par un administrateur avant l'activation de l'abonnement. Un paiement en attente ne vaut pas activation définitive tant que KORA n'a pas confirmé l'opération.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">5. Durée et expiration</h2><p>Les abonnements payants sont souscrits pour la période affichée au moment du paiement. Il n'y a pas de renouvellement automatique. À l'expiration, l'accès aux fonctionnalités payantes peut être limité, notamment par un passage en mode lecture seule selon les règles du plan.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">6. Remboursement</h2><p>Sauf disposition légale impérative contraire ou erreur imputable à KORA, les paiements ne sont pas remboursables une fois l'abonnement correctement activé. Une demande liée à un paiement erroné ou non identifié peut être adressée à KORA pour vérification.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">7. Suspension</h2><p>KORA peut suspendre ou limiter l'accès à une offre payante en cas de fraude, utilisation abusive, violation des CGU ou risque de sécurité. Les droits légalement applicables du client restent préservés.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">8. Modification des offres</h2><p>KORA peut modifier ses offres et tarifs pour les nouvelles souscriptions. Le prix applicable à une souscription déjà validée reste celui accepté lors de cette souscription, sous réserve des règles contractuelles applicables.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">9. Relation entre utilisateurs</h2><p>L'abonnement KORA donne accès aux fonctionnalités de la plateforme. KORA agit comme intermédiaire technique de mise en relation et ne garantit pas l'exécution, le prix ou la qualité d'une prestation négociée directement entre utilisateurs.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">10. Contact</h2><p>Pour toute question relative à un paiement ou abonnement : <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a>.</p><p className="mt-3"><Link to="/conditions" className="underline">Consulter les CGU</Link>.</p></section>
        </article>
      </main>
      <LandingFooter />
    </div>
  )
}
