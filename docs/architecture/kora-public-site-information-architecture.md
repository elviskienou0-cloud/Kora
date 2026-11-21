# Architecture de l'information du site public KORA

## Objectif

Documenter la structure publique cible de KORA, inspirée des principes organisationnels observés sur Remakeit, sans reprendre ses fonctionnalités propres. Ce document concerne uniquement les pages publiques. Les espaces Client, Manager, Admin et Super Admin conservent leurs layouts, routes, permissions et fonctions métier.

## 1. Inventaire réel des routes publiques

| Route | Page | Fonction |
|---|---|---|
| `/` | Accueil | Présenter la marketplace et orienter vers les parcours Client et Manager |
| `/categories` | Catégories | Explorer les catégories, rechercher et filtrer les talents publiés |
| `/talent/:id` | Détail d'un talent | Consulter un profil public disponible |
| `/faq` | FAQ | Répondre aux questions fréquentes |
| `/contact` | Contact | Donner un canal de contact et orienter vers l'aide |
| `/signaler-un-probleme` | Signalement | Recevoir un signalement utilisateur |
| `/conditions` | Conditions | Présenter les conditions d'utilisation |
| `/confidentialite` | Confidentialité | Informer sur le traitement des données |
| `/cookies` | Cookies | Expliquer les mécanismes de cookies et préférences |
| `/cgv` | CGV | Présenter les conditions de vente |
| `/mentions-legales` | Mentions légales | Identifier l'éditeur et les informations légales |

Les routes d'authentification (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`) sont des parcours d'accès et non des pages de présentation marketing. Elles ne doivent pas être mélangées à la navigation éditoriale.

## 2. Architecture cible de l'accueil

Ordre de lecture recommandé :

1. Header public : marque, Catégories, Abonnement, FAQ, Contact, langue, connexion et inscription.
2. Hero : proposition de valeur, explication courte, démonstration visuelle Client/Manager et action principale.
3. Catégories : portes d'entrée vers les univers de talents.
4. Fonctionnement : parcours synthétique en trois étapes, conforme aux fonctions réellement disponibles.
5. Fonctionnalités : capacités réelles de la plateforme, sans promesses non implémentées.
6. Évolutions : indicateurs dynamiques et vérifiables.
7. Témoignages : uniquement les avis authentiques visibles et autorisés.
8. Offres : plans et conditions issus des données de plans actives.
9. CTA final : deux parcours distincts, Client et Manager.
10. Footer : plateforme, assistance et informations légales.

La page ne doit pas recevoir artificiellement une comparaison concurrentielle, un carrousel ou une section de cas d'usage si les contenus et preuves correspondants ne sont pas disponibles. Ces blocs pourront être ajoutés ultérieurement après validation des données et des objectifs.

## 3. Architecture des pages secondaires

### Catégories

- Header public partagé.
- Introduction expliquant la découverte.
- Recherche et filtres.
- Navigation par catégories.
- Résultats issus des profils réellement publiés.
- Cartes de talents avec informations disponibles.
- États de chargement, erreur et absence de résultats.
- Footer public partagé.

La page ne doit pas inventer de profils, notes, tarifs ou disponibilités. Les données affichées doivent provenir des sources existantes.

### Détail d'un talent

- Header public partagé.
- État d'indisponibilité si le profil n'est pas accessible.
- Identité et informations principales.
- Présentation, compétences et disponibilité lorsqu'elles existent.
- Action de contact uniquement si le flux correspondant est autorisé et disponible.
- Footer public partagé.

### FAQ

- Header public partagé.
- Introduction du centre d'aide.
- Accordéon accessible avec une question ouverte à la fois.
- CTA vers Contact et Signalement.
- Footer public partagé.

### Contact

- Header public partagé.
- Introduction.
- Canaux de contact réels.
- Orientation vers la FAQ et le signalement.
- Footer public partagé.

### Pages légales et de conformité

- Header public partagé.
- Titre, date de mise à jour si connue, contenu structuré en sections.
- Liens internes vers les documents associés.
- Footer public partagé.

Les textes juridiques ne doivent pas être réécrits ou raccourcis dans le cadre d'une simple harmonisation structurelle.

## 4. Composants partagés

- `LandingHeader` : identité, navigation principale, langue, connexion et inscription, menu mobile.
- `LandingFooter` : navigation de plateforme, assistance et liens légaux.
- `LandingHero` : proposition de valeur et aperçu des parcours.
- `SectionHeading` : introduction homogène des sections.
- `CategoryCard` : accès à une catégorie.
- `TalentCard` : résumé d'un profil réel.
- `MetricCard` : valeur dynamique et libellé.
- `TestimonialCard` : témoignage authentique.
- `PricingCard` : plan chargé depuis les données actives.
- `FAQItem` : question et réponse accessibles.
- `PublicPageContainer` : largeur et espacement communs des pages publiques, à introduire uniquement si cela évite une duplication réelle.

## 5. Responsive

### Desktop
- Conteneur central avec largeur maximale.
- Header horizontal.
- Hero en deux colonnes.
- Grilles de catégories et de fonctionnalités.
- Comparaisons en colonnes uniquement si elles sont nécessaires.
- Footer en colonnes.

### Tablette
- Réduction des espacements et de la largeur utile.
- Grilles à deux colonnes.
- Navigation simplifiée si nécessaire.
- Visuels empilés lorsque les colonnes deviennent trop étroites.

### Mobile
- Navigation dans un menu accessible.
- Sections empilées dans l'ordre de lecture.
- Cartes sur une ou deux colonnes selon leur contenu.
- CTA pleine largeur lorsque pertinent.
- Tableaux remplacés par des blocs verticaux lisibles.
- Aucun contenu essentiel supprimé.

## 6. Contraintes d'implémentation

- Conserver React, Vite, React Router et les composants UI existants.
- Réutiliser les hooks et services Supabase existants.
- Ne pas modifier les tables, migrations, RLS, fonctions Edge, rôles ou règles métier.
- Ne pas déplacer les routes protégées dans le layout public.
- Respecter les dictionnaires FR/EN existants pour tout nouveau texte.
- Conserver les états de chargement, erreur et absence de données.
- Ne pas fabriquer de chiffres, témoignages, talents ou contenus.
- Ne pas fusionner automatiquement cette branche dans `main`.

## 7. Périmètre de la première adaptation

- Réordonner les sections d'accueil existantes pour donner la priorité à la découverte des catégories, puis au fonctionnement et aux fonctionnalités.
- Conserver les données, les CTA, les plans et les composants métier.
- Ajouter des identifiants stables aux sections Évolutions et CTA final.
- Clarifier le lien Contact dans la navigation.
- Corriger le lien du footer vers les offres afin qu'il fonctionne également depuis une page secondaire.

## 8. Hors périmètre

- Refonte des dashboards Client, Manager, Admin et Super Admin.
- Modification des paiements, abonnements, permissions ou politiques RLS.
- Création de nouvelles fonctionnalités métier.
- Réécriture des documents juridiques.
- Ajout de témoignages, chiffres ou profils fictifs.
