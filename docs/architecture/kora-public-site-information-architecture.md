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

Ordre strict de lecture et de présentation validé :

1. **Hero** : promesse KORA, explication courte, aperçu réel des parcours Client et Manager et action principale.
2. **Évolutions** : titre encadré ; quatre indicateurs dynamiques en grille 2x2 à gauche ; à droite, une pile interactive de profils talents réellement publiés, navigable par glissement et commandes précédent/suivant.
3. **De la recherche à la collaboration** : explication du parcours en trois étapes, conforme aux fonctions disponibles.
4. **Catégories** : portes d'entrée vers les univers de talents.
5. **Pourquoi KORA ?** : présentation des bénéfices et capacités réellement disponibles.
6. **Abonnement** : plans et conditions issus des données de plans actives.
7. **Pied de page** : plateforme, assistance et informations légales.

Aucune section autonome supplémentaire ne doit être intercalée dans cet ordre. Les anciens blocs Témoignages et CTA final ne sont pas affichés comme sections indépendantes sur la page d'accueil dans cette architecture.

### Composition de la section Évolutions

- Desktop : indicateurs sur deux colonnes et deux lignes dans la colonne gauche ; pile de cartes talents dans la colonne droite.
- Mobile : indicateurs en grille 2x2 lorsque l'espace le permet, puis vitrine des talents en dessous.
- Les cartes affichent uniquement des profils publiés et visibles issus de la table talent_profiles.
- Le profil actif est déplaçable horizontalement ; les flèches permettent également de parcourir les profils.
- Si aucun profil public n'est disponible, un état vide explicite est affiché. Aucun profil fictif n'est utilisé.

### Animations et accessibilité

- Révélation progressive des sections et cartes lors du défilement.
- Interactions au survol pour les cartes et les contrôles.
- Mouvement lumineux d'ambiance dans le Hero.
- Transition animée lors du changement de profil talent.
- Respect de prefers-reduced-motion pour réduire ou supprimer les mouvements non essentiels.

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
