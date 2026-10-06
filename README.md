# KORA

KORA est une plateforme qui met en relation des clients avec des talents via leurs managers. Elle centralise la découverte de profils, les demandes, les messages, les projets, les notifications et la gestion des talents.

## Règle produit : 0 donnée fictive

KORA ne doit jamais présenter comme réelle une donnée qui n'existe pas réellement dans la base ou dans un service connecté.

Cela s'applique notamment aux :
- avis et témoignages ;
- statistiques et compteurs ;
- revenus et transactions ;
- projets et notifications ;
- badges et vérifications ;
- utilisateurs, talents et partenaires ;
- tarifs et fonctionnalités ;
- résultats de recherche ;
- contenus de démonstration.

Lorsqu'aucune donnée réelle n'existe, l'interface doit afficher un état vide explicite ou masquer l'élément. Exemple : « Aucun avis publié pour le moment », et non « 0,0/5 » ou un témoignage de démonstration.

## Stack

- React + Vite
- React Router
- Tailwind CSS + composants UI
- Framer Motion
- Supabase Auth
- Supabase PostgreSQL + RLS
- Supabase Storage
- Supabase Edge Functions
- Vercel pour le déploiement
- SasPay pour les abonnements Manager

## Rôles

### Client
Le client peut notamment :
- rechercher et filtrer les talents publiés ;
- consulter les profils ;
- gérer ses favoris ;
- envoyer et suivre ses demandes ;
- échanger via la messagerie ;
- gérer ses projets ;
- recevoir ses notifications.

### Manager
Le manager peut notamment :
- gérer son profil ;
- créer et gérer les profils de ses talents ;
- gérer les demandes ;
- gérer ses projets et échanges ;
- souscrire à une offre.

Les talents ne créent pas directement de compte public : ils sont gérés par leur manager.

### Admin / Super Admin
Les comptes administrateurs sont gérés séparément et ne constituent pas un rôle d'inscription publique.

## Abonnements Manager

Les offres actives actuellement sont pilotées par la table `plans` de Supabase :

| Offre | Prix | Limite talents |
|---|---:|---:|
| Gratuit | 0 XOF | 1 |
| Pro | 2 500 XOF / mois | 3 |
| Business | 5 000 XOF / mois | Illimitée |

- Essai gratuit : 30 jours sur l'offre Gratuit.
- Renouvellement : manuel, sans renouvellement automatique.
- Paiement d'abonnement : SasPay.
- Commission KORA sur les prestations : 0 %.
- Les prix affichés dans l'interface doivent toujours correspondre aux données actives de Supabase.

## Paiements

KORA utilise actuellement SasPay pour les abonnements Manager.

Les paiements de prestations ne doivent pas être présentés comme encaissés par KORA tant qu'un flux réel correspondant n'est pas activé et vérifié.

Aucun paiement fictif, succès de paiement fictif ou transaction de démonstration ne doit être créé dans l'environnement de production.

## Données et sécurité

- Authentification via Supabase Auth.
- PostgreSQL avec RLS.
- Les autorisations sensibles sont contrôlées côté serveur / base de données.
- Les secrets ne doivent jamais être exposés dans le frontend.
- Les fonctions privilégiées doivent vérifier l'utilisateur et leurs permissions.
- Les données personnelles doivent respecter les mécanismes d'export et de suppression prévus par KORA.
- Ne jamais utiliser une donnée de démonstration comme donnée de production.

## Développement local

Pré-requis :
- Node.js 18+
- npm
- accès aux variables d'environnement Supabase nécessaires au projet

Installation :

```bash
npm install
npm run dev
```

Build :

```bash
npm run build
```

Preview :

```bash
npm run preview
```

## Structure principale

```
src/
  components/
  hooks/
  i18n/
  lib/
  pages/
  App.jsx
  main.jsx

supabase/
  migrations/
  functions/
```

## Données publiques

Les statistiques publiques, catégories, profils publiés et avis visibles doivent être chargés depuis les données réelles disponibles.

Si une table ne contient aucune donnée :
- ne pas inventer de valeur ;
- ne pas utiliser de fallback marketing fictif ;
- afficher un état vide cohérent.

## Avis

Les avis affichés publiquement doivent provenir de la table `reviews` et être visibles selon les règles prévues par la base.

Aucun témoignage statique ou utilisateur de démonstration ne doit être conservé dans le frontend. », « Mohamed T. », « Fatou D. » ou autre utilisateur fictif ne doit être conservé dans le frontend.

## Vérification des talents

Le statut « Vérifié KORA » doit uniquement refléter une vérification réellement enregistrée et autorisée. Un manager ne doit pas pouvoir transformer arbitrairement un profil en profil vérifié.

Les notes, nombre d'avis et projets terminés doivent également provenir de données réelles.

## Internationalisation

KORA est conçu avec le français comme langue par défaut et l'anglais comme langue disponible. Les pages doivent utiliser les mécanismes i18n existants et ne doivent pas laisser de clés de traduction visibles à l'utilisateur.

## Responsive

L'interface est mobile-first. Toute nouvelle page ou modification doit être vérifiée au minimum sur des largeurs proches de 360 px, 390 px et 430 px, puis sur tablette et desktop.

## Environnement de production

Avant une mise en production, vérifier au minimum :

1. build frontend ;
2. authentification ;
3. RLS et permissions ;
4. création et publication d'un talent ;
5. demandes et messagerie ;
6. notifications ;
7. abonnement SasPay ;
8. expiration d'abonnement ;
9. suppression/export de compte ;
10. absence de données fictives ;
11. affichage FR/EN ;
12. responsive mobile.

## Important

Ce README décrit le fonctionnement actuel attendu de KORA. Il ne contient volontairement aucun compte de démonstration, aucune statistique inventée, aucun utilisateur fictif et aucune ancienne tarification.
