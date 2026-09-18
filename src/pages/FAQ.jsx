import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import LandingFooter from "@/components/landing/LandingFooter.jsx"

const FAQS = [
  {
    question: "Qu'est-ce que KORA ?",
    answer:
      "KORA est une plateforme qui permet de découvrir des talents, de consulter leurs profils et de faciliter les échanges autour de projets.",
  },
  {
    question: "Quels types de talents peuvent être présents sur KORA ?",
    answer:
      "KORA peut accueillir différents profils : artistes, créateurs de contenu, influenceurs, sportifs, photographes, vidéastes, humoristes, mannequins, consultants et autres professionnels créatifs.",
  },
  {
    question: "Qui peut utiliser KORA ?",
    answer:
      "KORA est destiné notamment aux clients qui recherchent des talents et aux managers qui souhaitent présenter et gérer les profils des talents qu'ils accompagnent.",
  },
  {
    question: "Comment rechercher un talent ?",
    answer:
      "Depuis l'espace de recherche, vous pouvez parcourir les talents disponibles et utiliser les informations et catégories proposées pour trouver un profil correspondant à votre besoin.",
  },
  {
    question: "Pourquoi un talent que je viens de créer n'apparaît-il pas dans ma recherche ?",
    answer:
      "Un talent nouvellement créé peut ne pas être immédiatement visible publiquement. Sa visibilité peut dépendre notamment de son statut, de sa validation et des règles de publication appliquées par KORA.",
  },
  {
    question: "Comment un manager peut-il gérer un talent ?",
    answer:
      "Un manager peut gérer les talents associés à son compte depuis son espace Manager, notamment consulter leurs informations et, selon les fonctionnalités disponibles, modifier leurs profils.",
  },
  {
    question: "Un manager peut-il modifier un profil ?",
    answer:
      "Oui. Un manager peut modifier les informations des talents qu'il est autorisé à gérer. Les modifications restent soumises aux règles de sécurité et d'accès de KORA.",
  },
  {
    question: "Puis-je ajouter plusieurs talents ?",
    answer:
      "Oui, un manager peut ajouter plusieurs talents selon les limites prévues par son abonnement et les règles applicables à son compte.",
  },
  {
    question: "Comment contacter un talent ?",
    answer:
      "Lorsqu'une fonctionnalité de contact est disponible sur un profil, vous pouvez utiliser les outils proposés par KORA pour envoyer une demande ou échanger avec le talent ou son manager.",
  },
  {
    question: "KORA est-il une agence artistique ?",
    answer:
      "Non. KORA est une plateforme de mise en relation et de gestion de profils. KORA n'est pas automatiquement le représentant, l'agent ou le manager des talents présents sur la plateforme.",
  },
  {
    question: "Les informations présentes sur les profils sont-elles vérifiées ?",
    answer:
      "Toutes les informations d'un profil ne doivent pas être considérées comme vérifiées automatiquement. Certaines informations peuvent être fournies directement par les utilisateurs. KORA peut mettre en place des processus de vérification pour certains profils ou certaines informations.",
  },
  {
    question: "Que signifie un profil vérifié ?",
    answer:
      "La vérification indique qu'un contrôle spécifique a été effectué conformément au processus de vérification utilisé par KORA. Elle ne signifie pas que toutes les informations ou toutes les prestations du talent sont garanties par KORA.",
  },
  {
    question: "Pourquoi certains talents ne sont-ils pas visibles publiquement ?",
    answer:
      "Un profil peut ne pas être visible publiquement notamment lorsqu'il est en attente de validation, désactivé, masqué par son gestionnaire ou soumis à une restriction de publication.",
  },
  {
    question: "KORA propose-t-il des abonnements pour les managers ?",
    answer:
      "Oui. KORA peut proposer différentes formules d'abonnement aux managers. Les fonctionnalités et limites associées à chaque formule sont présentées dans l'espace Abonnement.",
  },
  {
    question: "Comment fonctionne la période d'essai ?",
    answer:
      "Lorsqu'une période d'essai est proposée, elle permet au manager d'utiliser les fonctionnalités prévues pendant la durée indiquée par KORA. À la fin de cette période, les conditions applicables à son compte et à son abonnement s'appliquent.",
  },
  {
    question: "Comment fonctionne le paiement d'un abonnement ?",
    answer:
      "Les modalités de paiement disponibles sont indiquées dans l'espace Abonnement. Lorsqu'un paiement nécessite une validation manuelle, l'activation de l'abonnement intervient après vérification du paiement par KORA.",
  },
  {
    question: "Que faire si mon paiement n'est pas encore validé ?",
    answer:
      "Si votre paiement nécessite une validation manuelle et que votre abonnement n'est pas encore activé, vérifiez que les informations ou justificatifs demandés ont bien été transmis, puis contactez KORA si nécessaire.",
  },
  {
    question: "Que faire si je rencontre un bug ?",
    answer:
      "Vous pouvez utiliser la page « Signaler un problème » afin de transmettre une description du bug, la page concernée, les étapes permettant de reproduire le problème et, si possible, une capture d'écran.",
  },
  {
    question: "Comment signaler un profil ou un contenu problématique ?",
    answer:
      "Vous pouvez contacter KORA afin de signaler un profil, un contenu ou un comportement qui semble contraire aux règles de la plateforme. Donnez autant de détails que possible pour faciliter l'examen du signalement.",
  },
  {
    question: "Comment protéger mon compte KORA ?",
    answer:
      "Utilisez un mot de passe suffisamment robuste, ne partagez jamais vos identifiants et évitez de vous connecter depuis un appareil auquel d'autres personnes ont accès. Contactez KORA si vous constatez une activité inhabituelle sur votre compte.",
  },
  {
    question: "Puis-je supprimer mon compte ?",
    answer:
      "Vous pouvez demander la suppression de votre compte en contactant KORA. Certaines informations peuvent toutefois être conservées lorsque la loi ou des obligations légitimes l'exigent.",
  },
  {
    question: "Comment contacter KORA ?",
    answer:
      "Vous pouvez utiliser la page Contact pour envoyer votre demande à l'équipe KORA. Pour un problème technique, vous pouvez également utiliser la page « Signaler un problème ».",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleQuestion = (index) => {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? null : index
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* =========================
          HEADER
      ========================== */}

      <header className="border-b border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour à l'accueil
          </Link>

        </div>
      </header>

      {/* =========================
          CONTENT
      ========================== */}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        <div className="text-center mb-12">
          <p className="text-sm font-medium text-gold mb-3">
            Centre d'aide
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Questions fréquentes
          </h1>

          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Retrouvez les réponses aux principales questions concernant
            KORA, les talents, les managers et l'utilisation de la plateforme.
          </p>
        </div>

        {/* =========================
            FAQ ACCORDION
        ========================== */}

        <div className="space-y-3">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <div
                key={item.question}
                className="border border-border rounded-2xl bg-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {item.question}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-5 pb-5"
                  >
                    <div className="border-t border-border pt-4 text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* =========================
            CONTACT CTA
        ========================== */}

        <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">

          <h2 className="text-xl font-semibold text-foreground">
            Vous ne trouvez pas votre réponse ?
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Notre équipe peut vous aider pour une question ou un problème
            concernant KORA.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">

            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Contacter KORA
            </Link>

            <Link
              to="/signaler-un-probleme"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Signaler un problème
            </Link>

          </div>
        </div>

      </main>

      <LandingFooter />
    </div>
  )
}
