import { Link } from "react-router-dom"
import { Cookie, ArrowLeft } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

export default function Cookies() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Retour à l'accueil</Link>
        <div className="mb-10"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900"><Cookie className="h-6 w-6" /></div><h1 className="text-4xl font-bold tracking-tight">Politique cookies</h1><p className="mt-4 text-sm text-gray-500">Dernière mise à jour : 5 octobre 2026</p></div>
        <div className="space-y-10 leading-7 text-gray-700 dark:text-gray-300">
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">1. Cookies et technologies similaires</h2><p>Un cookie ou mécanisme similaire peut permettre à un service de reconnaître un navigateur, conserver une session ou mémoriser une préférence.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">2. Ce que KORA utilise</h2><p>KORA utilise principalement les mécanismes nécessaires à l'authentification, à la sécurité, à la session et aux préférences de l'application. Le consentement de choix est mémorisé dans le cookie « kora_cookie_consent ». KORA peut également utiliser le stockage local ou de session du navigateur pour conserver des préférences, des brouillons ou des informations techniques nécessaires au fonctionnement de l'interface. Les technologies facultatives ne doivent être activées que lorsqu'elles sont effectivement utilisées.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">3. Technologies nécessaires</h2><p>Les mécanismes strictement nécessaires au fonctionnement de KORA peuvent être utilisés sans désactivation lorsque celle-ci empêcherait le service de fonctionner correctement.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">4. Technologies facultatives</h2><p>Si KORA active ultérieurement un outil de mesure, d'analyse ou de personnalisation non nécessaire au fonctionnement du service, sa finalité, son fournisseur et ses modalités de consentement seront indiqués avant son activation lorsque cela est requis.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">5. Gestion</h2><p>Lors de la première visite, KORA affiche un module permettant d'accepter les technologies facultatives, de les refuser ou de personnaliser le choix. Le choix peut ensuite être modifié depuis les préférences disponibles lorsque cette fonction est proposée. Vous pouvez également gérer les cookies depuis votre navigateur. La désactivation des mécanismes nécessaires peut empêcher certaines fonctions de KORA de fonctionner.</p></section>
          <section><h2 className="mb-3 text-2xl font-semibold text-gray-900 dark:text-white">6. Contact</h2><p>Pour toute question : <a className="underline" href="mailto:kora.contact1@gmail.com">kora.contact1@gmail.com</a>.</p><Link to="/contact" className="mt-4 inline-flex font-medium underline">Contacter KORA</Link></section>
        </div>
      </main><LandingFooter />
    </div>
  )
}
