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

## Synthèse des constats (snapshot du 24 novembre 2026)

- **33 constats** enregistrés.
- **Haute : 8** (1 corrigé, 2 partiellement corrigés/en attente de migration, 5 ouverts).
- **Moyenne : 20** (9 corrigés, 3 partiellement corrigés/en attente de migration, 8 ouverts).
- **Basse : 5** (5 corrigés).
- **Total : 15 corrigés, 5 partiellement corrigés/en attente de déploiement, 13 ouverts.**
- Le statut « corrigé » désigne une correction sur la branche d'audit, pas une mise en production. Les migrations versionnées ne sont pas appliquées à Supabase.
- Les sections ci-dessous sont triées par gravité, puis par identifiant.

### KORA-001 | incohérence métier / paiement | haute | manager | abonnement / création de paiement | `README.md`, `supabase/functions/create-payment/index.ts`

- Étapes: lecture intégrale du README et de l'Edge Function `create-payment`; recherche des intégrations Orange Money, Moov Money, SasPay, CinetPay et PayDunya.
- Attendu: le manager paie directement via Orange Money ou Moov Money; aucun agrégateur tiers n'intervient.
- Observé: le README documente SasPay et l'Edge Function `create-payment` construit le checkout via SasPay. Aucun flux direct Orange Money ou Moov Money n'a été trouvé dans le dépôt.
- Cause: l'intégration de paiement actuelle repose sur un agrégateur, contrairement à l'invariant métier.
- Correction: non appliquée. La cible métier est déjà claire; l'implémentation attend les API/contrats opérateur, identifiants marchand et paramètres de callback de chaque opérateur. Les secrets devront rester côté Edge Function.
- Commit: aucun.
- Statut: ouvert, priorité haute; intégration directe à réaliser.

### KORA-004 | incomplet | haute | manager et admin | abonnement / validation paiement | `src/pages/manager/Subscription.jsx`, `src/pages/admin/Payments.jsx`, `supabase/migrations/20261121001412_payment_proofs_private_storage.sql`

- Étapes: lecture intégrale des deux pages, du helper `src/components/FileUpload.jsx` et de la migration de stockage des preuves.
- Attendu: le manager dépose une capture de paiement dans le bucket privé; l'admin consulte cette preuve avant de valider le paiement.
- Observé: la migration crée le bucket privé `payment-proofs` et la RPC `attach_payment_proof`, mais la page Manager ne propose aucun upload de preuve et son bouton « paiement effectué » ne fait que modifier `sessionStorage`. La page Admin ne sélectionne pas `proof_url` et n'affiche aucune preuve.
- Cause: le stockage et la RPC de preuve ne sont pas raccordés au parcours d'abonnement et à l'interface de validation.
- Correction appliquée sur cette branche: le manager peut envoyer un fichier autorisé (JPG/PNG/WebP/PDF, 5 Mo max) dans le bucket privé via `attach_payment_proof`; l'admin consulte une URL signée temporaire avant validation. La migration `supabase/migrations/20261124220000_require_payment_proof_for_subscription_validation.sql` impose aussi côté SQL la présence d'une preuve avant le passage d'un paiement d'abonnement à `paid`.
- Commit: `bc6c641fb3e0fbf5e4aeddc1202854f474fe10b0` (`KORA-004: relier les preuves de paiement à la validation admin`).
- Statut: code et migration versionnée corrigés; build/lint/tests CI réussis sur un commit ultérieur; migration non appliquée à la base active.



### KORA-006 | sécurité / intégrité des déploiements | haute | tous rôles | schéma Supabase / migrations | `supabase/migrations/*`

- Étapes: comparaison des 99 fichiers de migration du dépôt avec les 100 versions appliquées dans `supabase_migrations.schema_migrations` du projet Supabase actif.
- Attendu: chaque migration appliquée en production possède un fichier versionné correspondant dans le dépôt; aucun fichier local ne doit réutiliser une migration déjà appliquée sous un autre numéro.
- Observé: versions appliquées absentes du dépôt `20261121001412_payment_proofs_private_storage` et `20261122011054_payment_proofs_notify_superadmin`; le dépôt contenait à la place `20261121100000_payment_proofs_private_storage.sql`, non appliqué, qui fusionnait le contenu des deux versions.
- Cause: dérive de l'historique de migrations entre Git et la base active.
- Risque: les prochains déploiements peuvent rejouer une migration déjà appliquée et ne pas reproduire fidèlement l'état de production.
- Correction appliquée sur cette branche: restauration des deux fichiers SQL exacts depuis `supabase_migrations.schema_migrations`; déplacement du fichier non appliqué et fusionné vers `supabase/migrations_archive/` afin de préserver son contenu sans le faire exécuter par la CLI. Aucune requête DDL n'a été exécutée sur la base active et aucune donnée n'a été supprimée.
- Vérification après correction: 100 versions historiques locales et 100 versions appliquées distantes correspondent exactement. Trois migrations nouvelles sont présentes localement et non appliquées: `20261124220000`, `20261124230000`, `20261124240000`.
- Commits: `c6b2a1b7a53e4f837a0bdd5132d592768c29e8cf` (restauration) et `7c7ac804d988310e08671748f9b224da41b818bd` (confirmation de parité).
- Statut: problème initial corrigé; historique appliqué réconcilié. Les trois migrations ajoutées pour KORA-004/015/020 restent en attente de revue/déploiement; aucune modification de la base active.



### KORA-007 | sécurité / dette de dépendances | haute | tous rôles | build / dépendances | `package-lock.json` et `.github/workflows/kora-quality.yml`

- Étapes: lecture des journaux CI du commit d'audit; `npm ci` a installé 589 paquets; lecture de la sortie de `npm audit --json`.
- Attendu: dépendances corrigées ou risques connus documentés; le contrôle de vulnérabilités doit être visible et exploitable.
- Observé: le rapport JSON signale 19 vulnérabilités (1 faible, 12 modérées, 6 élevées, 0 critique), notamment dans `vite`, `nanoid`, `js-yaml`, `brace-expansion`, `source-map-js`, `react-router`, `react-quill`, `quill`, `moment`, `glob`, `minimatch`, `uuid`, `xcode`, `@capacitor/cli` et `zod`. Le workflow exécute `npm audit --json || true`, donc le rapport ne bloque pas la CI. La synthèse de `npm ci` affiche un total différent (11), à réconcilier avec le rapport JSON détaillé.
- Cause: dépendances vulnérables et audit configuré comme rapport non bloquant.
- Correction: non appliquée. Les mises à jour doivent être testées par groupes; le rapport propose une correction majeure pour Zod, qui nécessite une vérification de compatibilité.
- Vérification positive: `npm run build` réussit malgré ces alertes.
- Commit: aucun.
- Statut: ouvert, priorité haute.



### KORA-009 | incomplet / incohérence métier | haute | admin et manager | paramètres / abonnements | `src/pages/admin/Settings.jsx`, `src/pages/admin/AdminPanel.jsx`, `public.plans`

- Étapes: lecture intégrale de la page de paramètres et du routage admin; inspection des policies de `plans`, des fonctions SQL contenant `plan` ou `subscription`, et des valeurs de la table active.
- Attendu: le Super Admin peut modifier les prix, quotas et paramètres des plans depuis l'interface d'administration; le frontend et le backend lisent la même configuration.
- Observé: la page Paramètres expose uniquement les réglages généraux de la plateforme. Elle ne contient aucun champ de tarif ou de quota. La table `plans` n'a qu'une policy SELECT; aucune policy d'écriture ni RPC admin de mise à jour de plan n'a été trouvée dans les fonctions inspectées.
- Cause: absence d'interface et de voie serveur dédiée à l'édition des plans.
- Correction: non appliquée. Il faut définir le périmètre des plans dans D-001/D-003 avant d'ajouter les contrôles d'édition.
- Commit: aucun.
- Statut: ouvert, priorité haute.



### KORA-021 | sécurité / autorisations admin | haute | admin associé | 21 tables publiques et Storage | policies RLS utilisant `is_admin()`

- Étapes: inspection de toutes les policies RLS publiques; comparaison avec `is_admin()`, `admin_has_permission()` et la matrice `associatePermissionByView` de `AdminPanel.jsx`.
- Attendu: un administrateur associé n'accède qu'aux tables et opérations correspondant à ses permissions attribuées; le Super Admin conserve l'accès complet.
- Observé: 51 policies sur 21 tables publiques et 5 policies Storage sur `storage.objects` utilisent `is_admin()`. Cette fonction renvoie vrai pour tout profil de rôle `admin` ou `superadmin`, sans vérifier les permissions de l'administrateur associé. Exemples: lecture des conversations/messages, notifications, paiements/transactions, portefeuilles, talents, projets, demandes, avis, compétences et demandes de vérification; les policies Storage autorisent aussi un associé à lire, téléverser, modifier ou supprimer des fichiers de portfolio de n'importe quel talent.
- Cause: policies RLS héritées du modèle « admin global », alors que le frontend possède désormais des permissions par vue.
- Risque: un admin associé sans permission correspondante peut appeler directement Supabase et contourner les restrictions de navigation de l'interface.
- Correction: non appliquée. Il faut remplacer les accès admin génériques par `admin_has_permission(permission)` pour les lectures autorisées et réserver les écritures sans permission dédiée au Super Admin. La matrice exacte doit être validée et testée avec un vrai compte admin associé.
- Limite de vérification: aucun profil `admin` associé n'existe actuellement dans la base active; seul un Super Admin a pu être testé.
- Commit: aucun.
- Statut: ouvert, priorité haute.



### KORA-027 | incomplet / faux réglages | haute | Super Admin et tous utilisateurs | paramètres plateforme | `src/pages/admin/Settings.jsx`, `src/lib/ThemeContext.jsx`, `src/pages/Register.jsx`, `src/pages/manager/Talents.jsx`, `public/maintenance.html`

- Étapes: lecture de la page Settings, recherche des clés `maintenance_mode`, `registrations_enabled`, `talent_auto_publish`, `default_theme` dans les pages et fonctions SQL actives.
- Attendu: chaque réglage enregistré par le Super Admin produit réellement l'effet annoncé.
- Observé: la page admin enregistre les clés de configuration dans `app_settings`, mais aucun consommateur n'a été trouvé pour `site_name`, `site_tagline`, `support_email`, `contact_email`, `currency`, `maintenance_mode`, `registrations_enabled` ou `talent_auto_publish`. Le site utilise encore les constantes de `APP_PARAMS` pour le nom, le slogan et les emails. `get_kora_default_theme()` existe côté SQL, mais `ThemeContext.jsx` utilise une constante locale `light` et ne l'appelle pas. La page `public/maintenance.html` est statique et aucun middleware/rewrite n'applique le mode maintenance global.
- Cause: interface de paramètres créée sans raccordement des effets opérationnels.
- Correction: non appliquée; le mode maintenance global doit être conçu pour retourner une vraie page et un statut HTTP approprié sans exposer de secret; l'inscription et l'auto-publication doivent être contrôlées côté serveur.
- Commit: aucun.
- Statut: ouvert, priorité haute; les interrupteurs ne doivent pas être présentés comme opérationnels tant que les consommateurs ne sont pas implémentés.



### KORA-028 | sécurité / fail-open | haute | admin associé | espace administration | `src/pages/admin/AdminPanel.jsx` / chargement de `get_my_admin_access`

- Étapes: lecture intégrale du composant et du flux de chargement des permissions.
- Attendu: si le profil d'accès associé ne peut pas être chargé, aucune vue administrative ne doit être affichée.
- Observé: en cas d'erreur RPC ou de réponse sans `access_level`, `adminAccess` restait `null`; les conditions de restriction ne s'exécutaient alors pas et le panneau affichait les vues comme si l'utilisateur avait tous les droits.
- Cause: contrôle d'accès fail-open, sans état de chargement ni erreur bloquante.
- Correction appliquée: chargement explicite des permissions; l'accès reste bloqué tant que le niveau n'est pas confirmé; ajout d'une action de nouvelle tentative.
- Commit: `eb8bdb0d28992706fb172c1d89ff791090bcea88` (`KORA-028: fermer l'accès admin si les permissions échouent`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur le commit `d73e1b7`. Les policies RLS trop larges (KORA-021) restent à corriger séparément.



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
- Aucun fichier `.env` n'est suivi dans l'arborescence actuelle. Les deux versions historiques retrouvées sur le chemin `.env` de la branche principale ont été scannées sans détecter de motif `service_role`, `sb_secret` ou JWT; les autres branches historiques restent à examiner.
- `vercel.json` définit une CSP en mode `Content-Security-Policy-Report-Only`; son efficacité réelle et ses violations doivent être examinées lors de l'audit sécurité.
- `package.json` définit `npm run build` comme enchaînement de tests i18n, tests unitaires, lint, build Vite et contrôle des secrets.

## Exécution et vérifications CI

- Environnement local Windows: non exécuté depuis cette session; le chemin local fourni n'est pas monté ici.
- CI GitHub: `npm ci` a installé 589 paquets; le pipeline qualité a exécuté `npm run build`.
- `test:i18n`: réussi.
- `test:unit`: 5 tests réussis.
- `lint`: réussi.
- `vite build`: réussi.
- `security:secrets`: réussi.
- Workflow i18n séparé: réussi.
- `npm audit --json`: 19 vulnérabilités signalées (1 faible, 12 modérées, 6 élevées, 0 critique). La synthèse de `npm ci` affiche 11 vulnérabilités; cet écart de comptage doit être réconcilié. L'étape audit du workflow utilise `|| true` et ne bloque donc pas la CI.
- Ces validations CI couvrent le code jusqu'au commit `0ec9f0e182bc84ecd5de1018e25ccc9c4d3c4838`; le build qualité et les tests i18n sont réussis sur ce commit. Deux runs intermédiaires ont échoué à cause d'une fermeture JSX incorrecte dans les nouvelles actions de suppression des notifications; KORA-031 a corrigé le problème et les runs suivants sont réussis.
- Tests SELECT RLS: exécutés avec `anon`, un client, un manager et le Super Admin; détails plus bas. Les tests INSERT/UPDATE/DELETE n'ont pas été exécutés sur des données métier réelles; policies et privilèges inspectés.
- Aucun profil `admin` associé n'existe dans la base active; les permissions fines de cet acteur restent non testées.
- Parcours navigateur/mobile de bout en bout: non exécutés; aucun appareil Android/iOS ni navigateur E2E connecté n'a été utilisé.

Les résultats CI sont positifs pour le build, le lint et les tests existants, mais ne remplacent pas les tests E2E ni l'audit complet des fichiers.

## Registre des constats

| ID | Gravité | Type | Statut |
|---|---|---|---|
| KORA-001 | Moyenne | Incohérence | Ouvert, décision requise |
| KORA-002 | Moyenne | Incohérence | Ouvert, décision requise |

## Historique des corrections

Des corrections ciblées ont été commitées sur `audit/kora-full`; aucune n'a été fusionnée dans `main`. Les migrations ajoutées restent non appliquées à la base active.

### KORA-003 | incohérence | moyenne | manager | abonnement / création de paiement | `supabase/functions/create-payment/index.ts` / handler POST

- Étapes: lecture intégrale de la fonction Edge `create-payment` et de la migration `20261106192218_enforce_saspay_monthly_subscription_payments.sql`.
- Attendu: le montant accepté par le flux de paiement suit la configuration du plan gérée par l'administration.
- Observé: la fonction lit bien `plans.price`, mais impose ensuite des montants constants (PRO = 2 500 XOF, BUSINESS = 5 000 XOF) avant de créer le paiement. Une modification tarifaire en base provoquera donc un refus HTTP 409.
- Cause: validation tarifaire dupliquée en dur dans la fonction Edge.
- Correction: non appliquée à ce stade. Le checkout utilise également des liens SasPay fixes par plan; remplacer uniquement le montant contrôlé sans confirmer le mode de paiement pourrait créer un écart entre le montant enregistré et celui effectivement demandé au prestataire.
- Commit: aucun, en attente de l'arbitrage D-001 / D-004.
- Statut: ouvert; le flux SasPay doit être remplacé par des intégrations directes. Détails opérateurs requis (D-004) et tarifs à confirmer (D-001).



### KORA-005 | incomplet / simulation | moyenne | client et manager | connexion / OAuth | `src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/lib/AuthContext.jsx`, `src/pages/OAuthConsent.jsx`

- Étapes: lecture intégrale des pages Login/Register/OAuthConsent et du contexte Auth; recherche des appels `signInWithOAuth`, `signInWithIdToken` et des références Google dans ces fichiers.
- Attendu: si Google OAuth est présenté comme disponible, le bouton doit lancer une authentification réelle et valider la session Supabase.
- Observé: aucun démarrage Google OAuth n'est présent dans Login, Register ou AuthContext. La route `/oauth/consent` affiche un écran de consentement autonome; son bouton attend 800 ms, change un état local, puis redirige vers `/home`, sans appel OAuth, serveur ni session.
- Cause: écran de consentement simulé non relié à un fournisseur OAuth.
- Correction appliquée: suppression de la route publique `/oauth/consent` et du composant simulé, qui redirigeait vers `/home` sans authentifier l'utilisateur.
- Limite restante: aucun démarrage Google OAuth réel n'a été trouvé dans Login, Register ou AuthContext. Le flux Google reste absent; sa configuration dépend de l'activation du fournisseur dans Supabase Auth.
- Commit: `715c6840bb2d2320ed07df9a7eb512745cb23bb3` (`KORA-005: retirer le consentement OAuth simulé`).
- Statut: simulation supprimée; build CI réussi; Google OAuth reste non implémenté.



### KORA-008 | bug fonctionnel | moyenne | admin | `/admin?view=subscriptions` | `src/pages/admin/Subscriptions.jsx` / composant principal

- Étapes: navigation via `AdminPanel.jsx` vers la vue `subscriptions`; lecture intégrale de la page.
- Attendu: afficher les abonnements de la table `subscriptions`.
- Observé: la route `subscriptions` rendait une page exportée sous le nom `AdminPayments` qui interrogeait `payments`, sans aucune requête sur `subscriptions`. La section Abonnements affichait donc une seconde liste de paiements.
- Cause: mauvais composant et mauvaise table reliés à la route.
- Correction appliquée: remplacement par une liste réelle des abonnements, avec recherche, filtre de statut, pagination, états de chargement/erreur/vide; la validation reste dans la section Paiements.
- Commit: `2b935c4f29b22a2e70fa4ea10bc723f0bfed4ef4` (`KORA-008: corriger la page Abonnements`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur un commit ultérieur.



### KORA-010 | UX / incohérence de permissions | moyenne | admin associé | paramètres administration | `src/pages/admin/AdminPanel.jsx`, `src/pages/admin/Settings.jsx`, `public.update_kora_setting(text,jsonb)`

- Étapes: lecture intégrale de la gestion des vues admin et de la page Settings; inspection de la fonction SQL `update_kora_setting`.
- Attendu: un compte ayant seulement `settings.read` consulte les paramètres sans voir d'action d'écriture qu'il ne peut pas exécuter.
- Observé: `AdminPanel` autorise un associé ayant `settings.read` à ouvrir la vue Paramètres; la page affiche systématiquement les boutons Enregistrer. La fonction SQL refuse pourtant toute modification sauf si `is_super_admin()` est vrai.
- Cause: l'interface ne distingue pas les permissions de lecture et d'écriture.
- Correction appliquée: `AdminPanel` passe une propriété `canEdit` vraie uniquement au Super Admin; la page désactive les contrôles et masque les boutons Enregistrer pour les autres admins. Le serveur reste l'autorité finale.
- Commit: `a81ceab7acd13157a3607709b442d47c657842fd` (`KORA-010: masquer les actions d'écriture des paramètres aux associés`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur un commit ultérieur.



### KORA-011 | sécurité | moyenne | client et manager | inscription / mot de passe | configuration Supabase Auth

- Étapes: lecture de l'advisor de sécurité Supabase du projet actif, observé le 24 novembre 2026.
- Attendu: la protection contre les mots de passe compromis est activée pour empêcher l'utilisation de secrets connus dans des fuites publiques.
- Observé: l'advisor `auth_leaked_password_protection` signale `Leaked Password Protection Disabled`.
- Cause: option de sécurité Auth désactivée dans la configuration du projet.
- Correction: non appliquée. Ce paramètre relève de la configuration Supabase Auth et non d'une migration SQL; aucune modification manuelle non versionnée n'a été faite.
- Commit: aucun.
- Statut: ouvert, action de configuration à planifier et tracer.



### KORA-012 | incomplet | moyenne | client et manager | fiche talent publique | `src/pages/talent/Detail.jsx`, `src/pages/manager/Talents.jsx`, `public.get_talent_manager_profile(uuid)`, schéma public

- Étapes: lecture des zones de chargement et d'affichage de la fiche talent, du formulaire manager, des colonnes de `talent_profiles` et `profiles`, et des fonctions publiques de contact manager.
- Attendu: une fiche talent présente les réseaux sociaux, un calendrier de disponibilité et le numéro de téléphone du manager comme canal de contact.
- Observé: la fiche affiche un booléen Disponible/Indisponible, un portfolio de fichiers/liens génériques et un bouton qui ouvre une conversation KORA. Aucun calendrier de créneaux ni champ social dédié n'existe dans le schéma public inspecté. Le profil manager public renvoie seulement `id, name, avatar, role`; le numéro est dans `profiles.phone` et n'est pas exposé par cette fonction.
- Cause: les champs et parcours de calendrier/réseaux sociaux/contact téléphonique ne sont pas implémentés dans le modèle actuel.
- Correction: aucune. Le numéro de téléphone est une donnée personnelle; sa visibilité publique doit être décidée avant toute exposition (D-007). Le périmètre exact du calendrier et des réseaux doit être confirmé.
- Commit: aucun.
- Statut: ouvert.



### KORA-013 | incohérence métier | moyenne | manager | `/manager/talents` | `src/pages/manager/Talents.jsx` / calcul de `talentLimit`

- Étapes: lecture du calcul de quota dans la page Manager et de la fonction `get_my_subscription()` dans Supabase.
- Attendu: le quota appliqué dans l'interface provient de `plans.talent_limit`, comme le contrôle serveur `create_manager_talent`.
- Observé: l'interface codait 1 talent pour FREE, 3 pour PRO et illimité pour BUSINESS, alors que `get_my_subscription()` renvoie déjà `talent_limit` depuis la base.
- Cause: duplication des quotas dans le frontend.
- Correction appliquée: l'interface utilise maintenant `subscription.talent_limit`; si la configuration est absente ou invalide, la création est bloquée par défaut au lieu de devenir illimitée.
- Commit: `2dab5efaca64bbd41239f8e7d4b8bb3567afd96e` (`KORA-013: lire le quota talent depuis la configuration du plan`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur un commit ultérieur.



### KORA-014 | incohérence métier | moyenne | manager | `/manager/subscription` | `src/pages/manager/Subscription.jsx` / `getPlanDetails`

- Étapes: lecture intégrale de la page abonnement et comparaison avec la colonne `plans.features` du projet actif.
- Attendu: les avantages affichés correspondent à la configuration des plans, avec une présentation cohérente en français et en anglais.
- Observé: la page charge `plan.features`, mais `getPlanDetails` ignore cette colonne pour FREE, PRO et BUSINESS et affiche des listes de clés i18n codées en dur. Les trois lignes de la table `plans` ont actuellement le même tableau de fonctionnalités, différent des listes présentées par le frontend.
- Cause: deux sources de vérité distinctes pour le contenu des offres.
- Correction: non appliquée; le contenu exact des plans et sa traduction dépendent de l'arbitrage D-003.
- Commit: aucun.
- Statut: ouvert, décision requise.



## Vérifications Supabase / RLS réalisées le 24 novembre 2026

### Couverture des tables

- 33 tables du schéma `public` inspectées: RLS activée sur les 33.
- 32 tables accordent SELECT à `authenticated`; `subscription_notification_events` ne donne aucun accès direct à `anon` ou `authenticated` et ne possède aucune policy, ce qui la réserve aux traitements backend/service role.
- 10 tables accordent SELECT à `anon`; les policies publiques portent sur les données de découverte (talents publiés, portfolio, compétences, catégories, pays, plans, avis visibles, annonces et paramètres publics).
- Les tables privées `profiles`, `payments`, `subscriptions`, `messages`, `requests`, `projects`, `admin_audit_logs` ne donnent pas de lecture à `anon`.
- Les opérations d'écriture absentes de la matrice de policies restent refusées par RLS même lorsque le rôle SQL dispose d'un privilège de table.

### Tests SELECT exécutés sous les rôles PostgreSQL

Les tests ont utilisé des identités existantes du projet, sans afficher leurs identifiants ni modifier leurs données.

| Rôle simulé | Profils visibles | Talents visibles | Abonnements visibles | Paiements visibles | Messages visibles |
|---|---:|---:|---:|---:|---:|
| anon | aucun accès à profiles | 1 talent public | non autorisé | non autorisé | non autorisé |
| client | 1 | 1 | 0 | 0 | 0 |
| manager | 1 | 1 | 1 | 0 | 0 |
| superadmin | 5 | 1 | 2 | 1 | 0 |

- `anon` peut lire le talent public; les requêtes sur `profiles` et `payments` échouent avec permission denied.
- Le client ne voit que son profil et aucune ligne de paiement ou d'abonnement.
- Le manager voit son profil et son abonnement; il ne voit aucune ligne de paiement dans l'échantillon courant.
- Le Super Admin voit les lignes administratives et les données de paiement.
- Aucun profil de rôle `admin` standard n'existe dans la base active (0 compte); le test administrateur a donc utilisé le Super Admin.
- Une tentative de modification du rôle du client a été refusée au niveau des privilèges SQL. `authenticated` ne possède pas UPDATE sur les colonnes `role`, `is_suspended`, `suspended_at`, `suspended_reason`, `id` ou `last_seen`; les colonnes de profil ordinaires autorisées disposent de droits distincts.
- Une tentative d'UPDATE de talents dont `managed_by <> auth.uid()` n'a retourné aucune ligne. L'échantillon ne contient qu'un talent; ce test ne remplace pas un test avec deux managers propriétaires de talents distincts.
- Les tests d'écriture n'ont pas été exécutés sur des données réelles; la couverture INSERT/UPDATE/DELETE a été vérifiée par inspection des policies et privilèges. Les parcours E2E restent à faire.

### Migrations destructives

- Les 100 versions appliquées ont été recherchées pour `DELETE FROM`, `TRUNCATE`, `DROP TABLE`, `DROP COLUMN` et `DROP SCHEMA`.
- Résultat: aucune instruction de suppression de données ou de table/colonne détectée dans l'historique appliqué.
- Les `DROP POLICY`, `DROP TRIGGER` et `DROP CONSTRAINT` trouvés servent à remplacer des policies, triggers et contraintes; ils ne suppriment pas les lignes métier.

### Advisors Supabase

- L'advisor signale des fonctions `SECURITY DEFINER` exécutables par `authenticated`; plusieurs fonctions sensibles examinées contrôlent `auth.uid()`, le rôle, la propriété ou une permission admin. L'examen exhaustif des 49 fonctions signalées reste ouvert.
- Les fonctions publiques `is_talent_public` et `get_talent_manager_profile` contrôlent la visibilité du talent; la seconde ne renvoie pas le numéro de téléphone.
- L'advisor signale également la protection des mots de passe compromis désactivée (KORA-011).


### KORA-015 | incohérence métier | moyenne | Super Admin | paramètres plateforme / transactions | `public.update_kora_setting(text,jsonb)`, `public.create_kora_transaction(...)`

- Étapes: lecture intégrale des fonctions actives `update_kora_setting` et `create_kora_transaction`, inspection des triggers sur `kora_transactions` et de la configuration `app_settings`.
- Attendu: aucun paramètre ne permet d'activer une commission KORA; le montant versé au manager reste égal au montant de transaction.
- Observé: `create_kora_transaction` fixe actuellement `commission_rate = 0`, `commission_amount = 0` et `manager_amount = p_amount`; aucun trigger de commission n'est actif. En revanche, `update_kora_setting` acceptait encore la clé `commission_rate` et validait un taux de 0 à 100, bien que ce taux ne soit pas appliqué.
- Cause: vestige de l'ancien modèle de commission dans la fonction de paramètres.
- Correction appliquée sur cette branche: ajout de `supabase/migrations/20261124230000_block_commission_setting.sql`, qui refuse explicitement la clé `commission_rate`. Aucun paramètre existant n'a été supprimé; la table `app_settings` ne contient actuellement aucune ligne.
- Commit: `5174d3bd77e901d8fabe059b3de0a90a9f491dd5` (`KORA-015: interdire le paramètre de commission`).
- Statut: migration versionnée sur la branche; non appliquée à la base active.



### KORA-016 | incomplet | moyenne | client et manager | messagerie | `src/pages/Messages.jsx`, `public.messages`, schéma Storage

- Étapes: lecture intégrale de la page Messages, inspection de la table `messages` et des buckets Storage actifs.
- Attendu: la messagerie accepte les pièces jointes, les stocke dans un espace privé et n'autorise la lecture qu'aux participants de la conversation.
- Observé: l'interface ne permet que l'envoi de texte. La table `messages` contient `body`, `sender_id`, `conversation_id`, `read_at`, `created_at`, sans champ de pièce jointe ni table liée. Aucun bucket dédié aux pièces jointes de messages n'existe.
- Cause: le modèle et le parcours d'upload des pièces jointes ne sont pas implémentés.
- Correction: aucune; le type de fichiers, la taille maximale et la politique de conservation doivent être validés avant de créer un bucket et des policies dédiés (D-009).
- Commit: aucun.
- Statut: ouvert.



### KORA-018 | bug fonctionnel | moyenne | manager et client | fiche talent / édition | `src/pages/manager/Talents.jsx` / `saveTalent`

- Étapes: lecture du formulaire TalentEditor, de `buildFormData` et des branches INSERT/UPDATE de `saveTalent`.
- Attendu: le champ Titre saisi par le manager est enregistré dans `talent_profiles.title` à la création comme à la modification.
- Observé: le formulaire conservait `formData.title`, mais les deux branches d'écriture envoyaient systématiquement `title: null` / `p_title: null`.
- Cause: valeur du formulaire ignorée lors de la persistance.
- Correction appliquée: normalisation de `formData.title` puis transmission de la valeur aux deux branches INSERT et UPDATE.
- Commit: `5245f5580d220b3d0c13f29a489ff701287751a0` (`KORA-018: enregistrer le titre du talent`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur un commit ultérieur.



### KORA-020 | sécurité / cohérence métier | moyenne | client et manager | abonnement | `public.ensure_my_subscription()`, `public.get_my_subscription()`

- Étapes: lecture de `ensure_my_subscription` et `get_my_subscription`; vérification des appels dans les 10 pages client.
- Attendu: seul un manager peut créer ou initialiser son abonnement; les clients ne doivent pas créer de lignes d'abonnement.
- Observé: `ensure_my_subscription()` appelait `ensure_subscription_for_user(auth.uid())` sans vérifier le rôle; en outre, `ensure_subscription_for_user(uuid)` était directement exécutable par `authenticated` et ne contrôlait le rôle que lorsque l'appel ciblait un autre utilisateur. Un client pouvait donc appeler directement le RPC et créer une ligne FREE.
- Cause: absence de contrôle du rôle dans les deux fonctions SECURITY DEFINER.
- Correction appliquée sur cette branche: la migration `supabase/migrations/20261124240000_restrict_subscription_bootstrap_to_managers.sql` exige le rôle manager dans les deux fonctions pour un appel personnel; l'accès administrateur à un autre utilisateur reste protégé par `subscriptions.manage`.
- Commit: `9de65bb29743e368cc7679ec8b6119e314285eb4` (`KORA-020: réserver l'initialisation d'abonnement aux managers`).
- Statut: migration versionnée; non appliquée à la base active; validation SQL à effectuer avant déploiement.



### KORA-024 | i18n / UX | moyenne | tous rôles | inscription, catégories et espace admin | `src/pages/Register.jsx`, `src/pages/Categories.jsx`, `src/pages/admin/AdminPanel.jsx`, `src/pages/admin/Settings.jsx`, `src/pages/admin/Payments.jsx`, `src/pages/admin/Subscriptions.jsx`

- Étapes: inspection des pages publiques et administratives et comparaison avec le système de langue global.
- Attendu: toutes les routes accessibles en anglais affichent des libellés cohérents dans la langue choisie.
- Observé: `Register.jsx`, `Categories.jsx`, `AdminPanel.jsx` et `Settings.jsx` ne consomment pas le contexte i18n et contiennent des libellés français statiques. Les pages Paiements et Abonnements contiennent également des textes français statiques.
- Cause: ces vues n'ont pas été raccordées au dictionnaire FR/EN global.
- Correction: non appliquée dans cette étape; les pages doivent être traduites sans changer les libellés métier ni les permissions.
- Commit: aucun.
- Statut: ouvert; audit i18n des routes restantes à poursuivre.



### KORA-025 | incomplet | moyenne | client et manager | notifications | `src/pages/client/Notifications.jsx`, `src/pages/manager/Notifications.jsx`, `public.notifications`

- Étapes: lecture intégrale des deux pages et inspection de la policy `notifications_delete_own`.
- Attendu: un utilisateur peut supprimer ses propres notifications; RLS interdit toute suppression d'une notification appartenant à un autre utilisateur.
- Observé: les pages permettaient de marquer une notification comme lue, mais n'exposaient aucune action de suppression alors que la policy DELETE personnelle existe.
- Cause: action de suppression non raccordée à l'interface.
- Correction appliquée: ajout d'une action Supprimer dans les deux pages, avec filtre explicite sur `id` et `user_id`, contrôle du résultat et actualisation du cache.
- Commits: `42a06d036f549b84a31f0cf5997e6af833de4ac2` (ajout) et `d73e1b7060f47ce8996695436ebde6a51b30fe8f` (correction JSX KORA-031).
- Statut: corrigé sur la branche; build/lint/tests et validation i18n CI réussis.



### KORA-030 | incohérence métier / configuration | moyenne | manager et Super Admin | plans / configuration globale | `src/lib/app-params.js`

- Étapes: lecture intégrale de `APP_PARAMS` et comparaison avec les lignes `plans` de Supabase et les règles de prix/quota.
- Attendu: les prix, durées et limites de talents proviennent d'une seule source administrable; aucune valeur tarifaire n'est dupliquée dans le frontend.
- Observé: `APP_PARAMS.plans` contient encore les prix 0/2500/5000 FCFA, les limites 1/3/illimité et `commissionPct: 0`, alors que la table `plans` possède déjà les champs `price`, `trial_days` et `talent_limit`. Le parcours manager utilise désormais la valeur DB pour le quota, mais cette configuration statique reste présente et son graphe d'utilisation doit être vérifié avant suppression.
- Cause: ancienne configuration frontend conservée en parallèle de la configuration Supabase.
- Correction: non appliquée; rechercher tous les consommateurs de `APP_PARAMS.plans`, puis supprimer le doublon s'il est inutilisé ou le remplacer par les données DB.
- Commit: aucun.
- Statut: ouvert.



### KORA-031 | bug de syntaxe JSX | moyenne | client et manager | notifications | `src/pages/client/Notifications.jsx`, `src/pages/manager/Notifications.jsx`

- Étapes: exécution CI après KORA-025.
- Attendu: les boutons Marquer comme lu (conditionnel) et Supprimer (toujours disponible) sont deux éléments JSX frères correctement structurés.
- Observé: la fermeture du bloc conditionnel `unread` se trouvait après le bouton Supprimer; ESLint et le build échouaient avec « Adjacent JSX elements must be wrapped ».
- Cause: fermeture JSX mal positionnée lors de l'ajout du bouton Supprimer.
- Correction appliquée: fermeture du bloc conditionnel immédiatement après le bouton Marquer comme lu; bouton Supprimer rendu comme élément frère.
- Commit: `d73e1b7060f47ce8996695436ebde6a51b30fe8f` (`KORA-031: corriger la structure JSX des notifications`).
- Statut: corrigé; build/lint/tests et validation i18n CI réussis.



### KORA-032 | bug fonctionnel / données | moyenne | client et manager | page Catégories et statistiques | `src/pages/Categories.jsx`, `src/lib/useKoraStats.js`, `public.categories`, `public.get_kora_live_stats()`

- Étapes: lecture intégrale de la page Catégories et du hook de statistiques; comparaison de `APP_PARAMS.categories` avec la table active Supabase.
- Attendu: la page publique et les compteurs affichent toutes les catégories actives réellement configurées dans Supabase.
- Observé: le code ne connaissait que 11 catégories statiques; la table contient 19 catégories actives. Business, Créatif, Finance, Formation, Juridique, Marketing, Santé et Technologie étaient invisibles dans la page et ignorées par les compteurs. Le total de la page additionne désormais uniquement les catégories actives affichées.
- Cause: liste frontend figée et résolution des compteurs limitée à `APP_PARAMS.categories`.
- Correction appliquée: la page charge maintenant les catégories actives depuis Supabase avec gestion des exceptions réseau; le hook construit les compteurs dynamiquement à partir du slug renvoyé par `get_kora_live_stats()`. Le total est calculé uniquement sur les catégories actives visibles.
- Commit: `24727c67ffc4362213b765115548fdb53556e5be` (`KORA-032: charger les catégories depuis Supabase`).
- Statut: corrigé; build/lint/tests et validation i18n CI réussis. La traduction anglaise de la page reste ouverte dans KORA-024.

### KORA-033 | incomplet / UX / accessibilité | moyenne | client et tous rôles connectés | accueil `/home` | `src/pages/Home.jsx`

- Étapes: lecture intégrale de l'accueil et vérification des handlers de ses contrôles.
- Attendu: chaque contrôle visible effectue une action réelle et les cartes interactives sont utilisables au clavier.
- Observé: le champ de recherche desktop n'avait ni état ni handler; le bouton cœur des talents recommandés n'avait aucun handler et pouvait déclencher la navigation de la carte. La carte entière était cliquable sans rôle clavier.
- Cause: contrôles visuels non raccordés aux parcours métier.
- Correction appliquée: suppression du champ de recherche inerte (l'action Explorer reste disponible), raccordement du cœur à la table `favorites` pour les clients seulement, gestion d'erreur et d'état pending, arrêt de propagation; carte rendue accessible au clavier avec rôle link.
- Commit: `8c959ada168b0f72db28745d9c536cba1cfcf9c7` (`KORA-033: rendre les actions de l'accueil fonctionnelles`).
- Statut: corrigé; build/lint/tests et validation i18n CI réussis.



### KORA-034 | sécurité / confidentialité / concurrence asynchrone | moyenne | tous rôles connectés | accueil `/home` | `src/pages/Home.jsx` / chargement recommandations, favoris, messages non lus et activité

- Étapes: lecture intégrale de l'accueil et inspection des effets déclenchés lors d'un changement de session.
- Attendu: une réponse asynchrone lancée pour un utilisateur ne doit jamais remplacer les données de l'utilisateur connecté ensuite.
- Observé: les chargements des favoris, messages non lus et activités n'avaient pas de garde de démontage/changement d'identité; une réponse tardive pouvait afficher des données du compte précédent après un changement de session. Les erreurs de certaines requêtes étaient aussi ignorées.
- Cause: effets asynchrones sans invalidation lorsque l'identité change.
- Correction appliquée: ajout de gardes `mounted`, contrôle des erreurs Supabase et réinitialisation des états en cas de session absente/erreur.
- Commit: `0ec9f0e182bc84ecd5de1018e25ccc9c4d3c4838` (`KORA-034: isoler les données de l'accueil par session`).
- Statut: corrigé; build/lint/tests et validation i18n CI réussis.

### KORA-019 | UX / i18n | basse | client et manager | liste des conversations | `src/pages/Messages.jsx` / `formatConversationTime`

- Étapes: lecture intégrale de la page Messages et comparaison des deux formatters de dates.
- Attendu: la date de la dernière activité suit la langue sélectionnée.
- Observé: `formatConversationTime` acceptait un paramètre `locale`, mais utilisait toujours `fr-FR` pour l'heure et la date. La liste des conversations restait donc en français en mode anglais.
- Cause: locale passée mais non utilisée dans les deux appels `toLocale*`.
- Correction appliquée: remplacement des locales fixes par le paramètre `locale`.
- Commit: `c04a9e508e1415bdc97d25bf1d9ba71bf66039af` (`KORA-019: respecter la langue dans les dates de messagerie`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur un commit ultérieur.



### KORA-022 | UX / validation upload | basse | manager | édition média talent | `src/lib/talentMedia.js` / `uploadTalentProfileMedia`

- Étapes: lecture intégrale du helper d'upload et comparaison avec la configuration réelle du bucket `talent-profile-media`.
- Attendu: la validation côté client accepte exactement les types MIME autorisés par Storage.
- Observé: le helper acceptait tout type commençant par `image/`, alors que le bucket autorise uniquement JPEG, PNG et WebP (5 Mo max). Des formats tels que SVG, GIF ou HEIC passaient la validation locale puis échouaient au stockage.
- Cause: validation MIME trop large par rapport à la policy Storage.
- Correction appliquée: restriction côté client aux trois MIME réellement autorisés.
- Commit: `70e7e5a92896a7da7249985f03d46009c8765a53` (`KORA-022: aligner les formats image sur Storage`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur un commit ultérieur.



### KORA-023 | UX / i18n / données réelles | basse | tous rôles connectés | accueil `/home` | `src/pages/Home.jsx`, `src/lib/useKoraStats.js`

- Étapes: lecture de l'accueil, du hook `useKoraStats` et des clés i18n de la landing page.
- Attendu: les statistiques indisponibles affichent un état neutre et leurs libellés suivent la langue choisie.
- Observé: en cas d'erreur RPC, l'accueil affichait des zéros par défaut; les libellés renvoyés par le hook étaient en français même en mode anglais.
- Cause: valeur initiale `DEFAULT_STATS` et libellés français réutilisés directement dans Home.
- Correction appliquée: Home demande l'état neutre en cas d'erreur, traduit les quatre libellés avec les clés i18n existantes; le hook initialise également ses valeurs à « — » lorsque `emptyOnError` est activé.
- Commit: `a47fd58cc22f8996bd5b5cf476264af4edec5ee5` (`KORA-023: fiabiliser les statistiques et leur traduction sur l'accueil`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis.



### KORA-026 | UX / fiabilité upload | basse | client et manager | avatar / couverture profil | `src/lib/profileMedia.js` / `uploadProfileImage`

- Étapes: lecture intégrale du helper et comparaison avec le bucket public `profile-media`.
- Attendu: validation locale identique aux MIME acceptés par Storage; aucun fichier orphelin si l'enregistrement du profil échoue.
- Observé: le helper acceptait tout type `image/*`, alors que le bucket n'accepte que JPEG, PNG et WebP. En cas d'échec de mise à jour de `profiles`, le fichier déjà téléversé restait orphelin.
- Cause: validation MIME trop large et absence de nettoyage après échec partiel.
- Correction appliquée: whitelist MIME alignée sur le bucket et suppression du fichier si l'URL ou la mise à jour du profil échoue.
- Commit: `ad051251a579a7f84d7e980647228c02b3fe183d` (`KORA-026: aligner les uploads de profil sur Storage`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur le commit `d73e1b7`.



### KORA-029 | bug / accessibilité | basse | Super Admin | paramètres plateforme | `src/pages/admin/Settings.jsx` / `parseValue`, `loadSettings`, interrupteurs

- Étapes: lecture intégrale de la page Paramètres.
- Attendu: les booléens stockés sous forme JSON ou texte sont interprétés correctement; une erreur réseau ne laisse pas l'écran en chargement; chaque interrupteur possède un nom accessible.
- Observé: `Boolean("false")` pouvait convertir une valeur textuelle false en true; une exception réseau hors réponse RPC pouvait laisser `loading` actif; les boutons de bascule n'avaient pas de nom accessible. Une variable `isNumber` était inutilisée.
- Cause: parsing permissif et gestion d'erreur/accessibilité incomplètes.
- Correction appliquée: parsing booléen explicite, `try/catch/finally` autour du chargement, rôle/état/nom accessible pour les interrupteurs, suppression de la variable morte.
- Commit: `09df2cbc2456f46af3fc41c7323d957e49f780d9` (`KORA-029: fiabiliser le chargement des paramètres admin`).
- Statut: corrigé sur la branche; build/lint/tests CI réussis sur le commit `d73e1b7`.







### KORA-035 | incomplet / transparence commerciale | moyenne | visiteurs et managers | landing / tarifs | `src/components/landing/LandingPricing.jsx`

- Étapes: lecture intégrale de la section Tarifs et inspection du champ `plans.features` consommé depuis Supabase.
- Attendu: chaque formule affiche les fonctionnalités réellement enregistrées pour cette formule.
- Observé: les cartes affichaient un texte générique « toutes les fonctionnalités »; la section complémentaire ne listait que l'intersection des fonctionnalités communes à tous les plans. Les différences entre formules étaient invisibles.
- Cause: le composant calculait uniquement les fonctionnalités communes et ne rendait pas les listes propres à chaque plan.
- Correction appliquée: affichage de `plans.features` dans chaque carte, avec traduction anglaise connue et fallback sur le libellé source; suppression de la section redondante des fonctionnalités communes.
- Commit: `KORA-035: afficher les fonctionnalités propres à chaque plan`.
- Statut: corrigé sur la branche d'audit; build CI à vérifier.

