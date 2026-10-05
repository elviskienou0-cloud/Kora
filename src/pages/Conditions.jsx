import { Link } from "react-router-dom"
import LandingFooter from "@/components/landing/LandingFooter.jsx"
export default function Conditions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-gold transition-colors mb-10"
        >
          ← Retour à l'accueil
        </Link>

        <div className="mb-12">
          <p className="text-sm font-medium text-gold mb-3">
            KORA
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Conditions d'utilisation
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            Dernière mise à jour : 5 octobre 2026
          </p>
        </div>

        <article className="space-y-10 text-sm sm:text-base leading-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Objet
            </h2>

            <p>
              Les présentes Conditions d'utilisation définissent les règles
              applicables à l'utilisation de KORA, une plateforme destinée à
              faciliter la mise en relation entre clients et talents.
            </p>

            <p className="mt-4">
              En utilisant KORA, en créant un compte ou en utilisant ses
              fonctionnalités, vous reconnaissez avoir pris connaissance des
              présentes conditions et acceptez de les respecter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Présentation de KORA
            </h2>

            <p>
              KORA permet notamment aux utilisateurs de découvrir des profils
              de talents, de consulter leurs informations publiques, de les
              ajouter à leurs favoris et d'échanger avec eux dans le cadre de
              projets ou de demandes professionnelles.
            </p>

            <p className="mt-4">
              KORA peut évoluer au fil du temps et de nouvelles fonctionnalités
              peuvent être ajoutées, modifiées ou supprimées.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Création et sécurité du compte
            </h2>

            <p>
              Certaines fonctionnalités nécessitent la création d'un compte.
              L'utilisateur s'engage à fournir des informations exactes,
              actuelles et à jour.
            </p>

            <p className="mt-4">
              Chaque utilisateur est responsable de la confidentialité de ses
              identifiants et de toute activité effectuée depuis son compte.
              Toute utilisation non autorisée doit être signalée à KORA dans
              les meilleurs délais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Profils des talents
            </h2>

            <p>
              Les managers peuvent créer et gérer des profils de talents selon
              les fonctionnalités disponibles sur leur compte.
            </p>

            <p className="mt-4">
              Les informations publiées doivent être exactes et ne doivent pas
              porter atteinte aux droits de tiers. KORA peut appliquer des
              mesures de vérification, de modération, de visibilité ou de
              suspension lorsqu'elles sont nécessaires au fonctionnement de la
              plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Contenus et comportements interdits
            </h2>

            <p>
              Il est notamment interdit d'utiliser KORA pour publier,
              transmettre ou promouvoir des contenus frauduleux, illégaux,
              trompeurs, diffamatoires, discriminatoires ou portant atteinte
              aux droits d'autrui.
            </p>

            <p className="mt-4">
              Il est également interdit de tenter de contourner les mesures de
              sécurité, d'accéder à des comptes sans autorisation, de perturber
              le fonctionnement du service ou d'utiliser la plateforme à des
              fins abusives.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Relations entre utilisateurs
            </h2>

            <p>
              KORA facilite la mise en relation entre utilisateurs mais ne se
              substitue pas aux parties dans leurs échanges, négociations,
              contrats ou prestations.
            </p>

            <p className="mt-4">
              Les utilisateurs sont responsables des informations qu'ils
              communiquent et des engagements qu'ils prennent entre eux.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Abonnements et paiements
            </h2>

            <p>
              Certaines fonctionnalités ou certains niveaux de service peuvent
              être proposés sous forme d'abonnement payant.
            </p>

            <p className="mt-4">
              Les conditions tarifaires applicables sont celles affichées au moment de la souscription. Les règles commerciales détaillées figurent dans les CGV de KORA. Lorsqu'une validation manuelle du
              paiement est prévue, l'accès aux fonctionnalités concernées peut
              rester soumis à la confirmation par KORA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Conditions commerciales
            </h2>
            <p>
              Les offres payantes, leurs prix, la période d'essai, les modalités de paiement, l'activation, l'expiration, le remboursement et l'absence de renouvellement automatique sont détaillés dans les Conditions Générales de Vente.
            </p>
            <p className="mt-4"><Link to="/cgv" className="text-gold hover:underline">Consulter les CGV</Link></p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Disponibilité du service
            </h2>

            <p>
              KORA met en œuvre des moyens raisonnables pour maintenir la
              plateforme disponible. Des interruptions peuvent toutefois
              survenir notamment pour des raisons techniques, de maintenance,
              de sécurité ou liées à des services tiers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Propriété intellectuelle
            </h2>

            <p>
              Les éléments graphiques, marques, interfaces, textes,
              fonctionnalités et autres éléments appartenant à KORA restent
              protégés par les droits applicables.
            </p>

            <p className="mt-4">
              Les utilisateurs conservent leurs droits sur les contenus qu'ils
              publient, sous réserve des droits nécessaires au fonctionnement
              du service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Suspension ou limitation
            </h2>

            <p>
              KORA peut suspendre ou limiter un compte lorsque cela est
              nécessaire pour protéger la plateforme, ses utilisateurs ou
              respecter les présentes conditions, notamment en cas
              d'utilisation abusive ou de violation des règles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Données personnelles
            </h2>

            <p>
              Le traitement des données personnelles est décrit dans notre
              Politique de confidentialité.
            </p>

            <p className="mt-4">
              <Link
                to="/confidentialite"
                className="text-gold hover:underline"
              >
                Consulter la Politique de confidentialité
              </Link>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              12. Modification des conditions
            </h2>

            <p>
              KORA peut mettre à jour les présentes conditions afin de tenir
              compte de l'évolution du service, de ses fonctionnalités ou des
              exigences applicables. La date de mise à jour sera indiquée en
              haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              13. Contact
            </h2>

            <p>
              Pour toute question concernant ces conditions, vous pouvez
              contacter KORA depuis la page Contact.
            </p>

            <p className="mt-4">
              <Link
                to="/contact"
                className="text-gold hover:underline"
              >
                Contacter KORA
              </Link>
            </p>
          </section>
        </article>
      </main>

      <LandingFooter />
    </div>
  )
}