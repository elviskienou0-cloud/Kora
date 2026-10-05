import { Link } from "react-router-dom"
import { Scale, ArrowLeft } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Retour à l'accueil</Link>
        <div className="mb-10"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900"><Scale className="h-6 w-6" /></div><h1 className="text-4xl font-bold tracking-tight">Mentions légales</h1><p className="mt-4 text-sm text-gray-500">Dernière mise à jour : 5 octobre 2026</p></div>
        <div className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">1. Éditeur</h2><p>KORA est exploité par <strong>Kienou Elvis Dan Aurèle</strong>, personne physique établie à Ouagadougou, Burkina Faso.</p><div className="mt-4 rounded-xl bg-gray-50 p-5 dark:bg-gray-900"><p><strong>Adresse :</strong> Ouagadougou, Burkina Faso</p><p><strong>Téléphone professionnel :</strong> +226 70 27 18 10</p><p><strong>E-mail :</strong> kora.contact1@gmail.com</p><p><strong>RCCM :</strong> Non communiqué à ce stade.</p><p><strong>IFU :</strong> Non communiqué à ce stade.</p></div></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">2. Directeur de publication</h2><p><strong>Directeur de publication :</strong> Kienou Elvis Dan Aurèle.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">3. Hébergement et services techniques</h2><p>KORA utilise Vercel pour le déploiement de l'interface et Supabase pour l'authentification, la base de données, le stockage et certains services backend. Ces prestataires peuvent traiter des données depuis l'étranger.</p><div className="mt-4 rounded-xl bg-gray-50 p-5 dark:bg-gray-900"><p><strong>Déploiement :</strong> Vercel Inc.</p><p><strong>Backend / base / authentification :</strong> Supabase Pte. Ltd.</p></div></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">4. Propriété intellectuelle</h2><p>Le nom KORA, son logo, ses interfaces, textes, éléments graphiques et logiciels sont protégés par les règles applicables. Les contenus publiés par les utilisateurs restent sous leur responsabilité et selon leurs droits.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">5. Responsabilité</h2><p>KORA facilite la mise en relation entre clients et managers/talents. KORA ne se substitue pas aux parties dans leurs négociations ou prestations et ne garantit pas l'exécution d'une prestation conclue entre utilisateurs.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">6. Signalement et abus</h2><p>Les utilisateurs peuvent signaler les faux profils, tentatives d'arnaque ou autres comportements abusifs via les moyens de signalement prévus par KORA. Les administrateurs et superadministrateurs peuvent prendre les mesures nécessaires conformément aux CGU.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">7. Contact</h2><p>Pour toute question : <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a>.</p><Link to="/contact" className="mt-4 inline-flex font-medium underline">Contacter KORA</Link></section>
        </div>
      </main><LandingFooter />
    </div>
  )
}
