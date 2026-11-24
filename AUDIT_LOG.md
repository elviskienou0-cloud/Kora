# Journal d'audit KORA

## Périmètre et méthode

- Dépôt: `elviskienou0-cloud/Kora`
- Branche d'audit: `audit/kora-full`
- Branche de référence: `main`
- Commit de base: `8c8494bfd062fdcedfa808aa47f77d66c3ef5ffc`
- Inventaire initial: 419 fichiers suivis.
- Aucun changement n'est effectué sur `main`.
- Les corrections seront ciblées, avec migrations versionnées pour toute modification SQL.
- Un constat ne sera marqué « corrigé » qu'après vérification effective.

## État initial vérifié

### KORA-001 | incohérence | moyenne | tous rôles | documentation produit | `README.md` / section Abonnements et Paiements

- Étapes: lecture intégrale du fichier `README.md`.
- Attendu: la documentation reflète les invariants métier donnés pour cet audit.
- Observé: le README décrit SasPay comme moyen actuel de paiement d'abonnement, alors que l'invariant de cet audit impose Orange Money / Moov Money directs et exclut les agrégateurs tiers.
- Cause: contradiction entre la documentation du dépôt et les règles métier fournies.
- Correction: aucune à ce stade; la décision de paiement doit être confirmée et le flux réel audité avant modification.
- Commit: à renseigner après décision et correction éventuelle.
- Statut: ouvert, décision requise.

### KORA-002 | incohérence | moyenne | manager | documentation abonnement | `README.md` / tableau des offres

- Étapes: lecture intégrale du fichier `README.md`.
- Attendu: les limites et tarifs décrits sont cohérents avec la règle produit approuvée.
- Observé: README indique Gratuit 0 XOF / 1 talent, Pro 2 500 XOF / mois / 3 talents, Business 5 000 XOF / mois / illimité. L'invariant de référence de l'audit mentionne notamment Standard limité à 1 talent; l'historique produit contient d'autres versions de plans.
- Cause: versions métier contradictoires.
- Correction: aucune valeur n'est changée sans arbitrage.
- Commit: sans objet à ce stade.
- Statut: ouvert, décision requise.

## Inventaire technique initial

- `package.json` confirme React 18, Vite 6, React Router, Supabase JS, et des scripts npm de test, lint, build et contrôle de secrets.
- `capacitor.config.ts` confirme une cible Capacitor Android (`com.kora.app`, `webDir: dist`). Aucune preuve d'Expo ou React Native n'a été trouvée dans les manifests racine lus.
- Aucun `next.config.js`, `tsconfig.json` ou `app.json` n'existe à la racine.
- `.env.example` contient uniquement l'URL Supabase et une clé publishable factice.
- `.gitignore` ignore `.env` et `.env.*`, avec exception explicite pour `.env.example`.
- Le snapshot courant de l'arborescence contient `.env.example`, mais aucun fichier `.env` suivi. L'historique Git n'a pas encore été audité pour rechercher d'éventuels secrets antérieurement commités.
- `vercel.json` définit une CSP en mode `Content-Security-Policy-Report-Only`; son efficacité réelle et ses violations doivent être examinées lors de l'audit sécurité.
- `package.json` définit `npm run build` comme enchaînement de tests i18n, tests unitaires, lint, build Vite et contrôle des secrets.

## Exécution initiale

- Installation des dépendances: non exécutée dans cet environnement.
- Build: non exécuté dans cet environnement.
- Lint: non exécuté dans cet environnement.
- Tests: non exécutés dans cet environnement.
- `npm audit`: non exécuté dans cet environnement.
- Tests RLS avec identités anon/client/manager/admin: non exécutés; aucun accès de test authentifié n'a été établi.
- Parcours navigateur/mobile de bout en bout: non exécutés.

Ces éléments ne sont pas des résultats négatifs. Ils restent à vérifier dans l'environnement local connecté au projet.

## Registre des constats

| ID | Gravité | Type | Statut |
|---|---|---|---|
| KORA-001 | Moyenne | Incohérence | Ouvert, décision requise |
| KORA-002 | Moyenne | Incohérence | Ouvert, décision requise |

## Historique des corrections

Aucune correction de code n'a encore été appliquée.

### KORA-003 | incohérence | moyenne | manager | abonnement / création de paiement | `supabase/functions/create-payment/index.ts` / handler POST

- Étapes: lecture intégrale de la fonction Edge `create-payment` et de la migration `20261106192218_enforce_saspay_monthly_subscription_payments.sql`.
- Attendu: le montant accepté par le flux de paiement suit la configuration du plan gérée par l'administration.
- Observé: la fonction lit bien `plans.price`, mais impose ensuite des montants constants (PRO = 2 500 XOF, BUSINESS = 5 000 XOF) avant de créer le paiement. Une modification tarifaire en base provoquera donc un refus HTTP 409.
- Cause: validation tarifaire dupliquée en dur dans la fonction Edge.
- Correction: non appliquée à ce stade. Le checkout utilise également des liens SasPay fixes par plan; remplacer uniquement le montant contrôlé sans confirmer le mode de paiement pourrait créer un écart entre le montant enregistré et celui effectivement demandé au prestataire.
- Commit: aucun, en attente de l'arbitrage D-001 / D-004.
- Statut: ouvert, correction bloquée par décision de paiement.



### KORA-004 | incomplet | haute | manager et admin | abonnement / validation paiement | `src/pages/manager/Subscription.jsx`, `src/pages/admin/Payments.jsx`, `supabase/migrations/20261121100000_payment_proofs_private_storage.sql`

- Étapes: lecture intégrale des deux pages, du helper `src/components/FileUpload.jsx` et de la migration de stockage des preuves.
- Attendu: le manager dépose une capture de paiement dans le bucket privé; l'admin consulte cette preuve avant de valider le paiement.
- Observé: la migration crée le bucket privé `payment-proofs` et la RPC `attach_payment_proof`, mais la page Manager ne propose aucun upload de preuve et son bouton « paiement effectué » ne fait que modifier `sessionStorage`. La page Admin ne sélectionne pas `proof_url` et n'affiche aucune preuve.
- Cause: le stockage et la RPC de preuve ne sont pas raccordés au parcours d'abonnement et à l'interface de validation.
- Correction: non appliquée dans cette étape. Le parcours de paiement doit d'abord être confirmé (D-004); la correction devra relier l'upload sécurisé et l'affichage d'une URL signée, sans rendre le bucket public.
- Commit: aucun.
- Statut: ouvert, correction requise après confirmation du flux de paiement.



### KORA-005 | incomplet / simulation | moyenne | client et manager | connexion / OAuth | `src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/lib/AuthContext.jsx`, `src/pages/OAuthConsent.jsx`

- Étapes: lecture intégrale des pages Login/Register/OAuthConsent et du contexte Auth; recherche des appels `signInWithOAuth`, `signInWithIdToken` et des références Google dans ces fichiers.
- Attendu: si Google OAuth est présenté comme disponible, le bouton doit lancer une authentification réelle et valider la session Supabase.
- Observé: aucun démarrage Google OAuth n'est présent dans Login, Register ou AuthContext. La route `/oauth/consent` affiche un écran de consentement autonome; son bouton attend 800 ms, change un état local, puis redirige vers `/home`, sans appel OAuth, serveur ni session.
- Cause: écran de consentement simulé non relié à un fournisseur OAuth.
- Correction: non appliquée à ce stade. Il faut soit retirer/désactiver cette route simulée, soit configurer un véritable flux OAuth; aucun fournisseur ni configuration Google n'est confirmé par le dépôt.
- Commit: aucun.
- Statut: ouvert.



### KORA-006 | sécurité / intégrité des déploiements | haute | tous rôles | schéma Supabase / migrations | `supabase/migrations/*`

- Étapes: comparaison des 99 fichiers de migration du dépôt avec les 100 versions appliquées dans `supabase_migrations.schema_migrations` du projet Supabase actif.
- Attendu: chaque migration appliquée en production possède un fichier versionné correspondant dans le dépôt; aucun fichier local ne doit réutiliser une migration déjà appliquée sous un autre numéro.
- Observé: versions appliquées absentes du dépôt `20261121001412_payment_proofs_private_storage` et `20261122011054_payment_proofs_notify_superadmin`; le dépôt contenait à la place `20261121100000_payment_proofs_private_storage.sql`, non appliqué, qui fusionnait le contenu des deux versions.
- Cause: dérive de l'historique de migrations entre Git et la base active.
- Risque: les prochains déploiements peuvent rejouer une migration déjà appliquée et ne pas reproduire fidèlement l'état de production.
- Correction appliquée sur cette branche: restauration des deux fichiers SQL exacts depuis `supabase_migrations.schema_migrations`; déplacement du fichier non appliqué et fusionné vers `supabase/migrations_archive/` afin de préserver son contenu sans le faire exécuter par la CLI. Aucune requête DDL n'a été exécutée sur la base active et aucune donnée n'a été supprimée.
- Vérification après correction: à refaire par comparaison exhaustive des versions locales et distantes.
- Commit: `c6b2a1b7a53e4f837a0bdd5132d592768c29e8cf`.
- Vérification: 100 versions locales et 100 versions distantes; aucune version manquante ni migration locale non appliquée.
- Statut: corrigé sur la branche d'audit; aucune modification de la base active.



### KORA-008 | bug fonctionnel | moyenne | admin | `/admin?view=subscriptions` | `src/pages/admin/Subscriptions.jsx` / composant principal

- Étapes: navigation via `AdminPanel.jsx` vers la vue `subscriptions`; lecture intégrale de la page.
- Attendu: afficher les abonnements de la table `subscriptions`.
- Observé: la route `subscriptions` rendait une page exportée sous le nom `AdminPayments` qui interrogeait `payments`, sans aucune requête sur `subscriptions`. La section Abonnements affichait donc une seconde liste de paiements.
- Cause: mauvais composant et mauvaise table reliés à la route.
- Correction appliquée: remplacement par une liste réelle des abonnements, avec recherche, filtre de statut, pagination, états de chargement/erreur/vide; la validation reste dans la section Paiements.
- Commit: `KORA-008: corriger la page Abonnements`.
- Statut: corrigé sur la branche d'audit; build CI à vérifier.

