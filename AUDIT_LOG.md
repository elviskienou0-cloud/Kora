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
- Correction appliquée sur cette branche: le manager peut envoyer un fichier autorisé (JPG/PNG/WebP/PDF, 5 Mo max) dans le bucket privé via `attach_payment_proof`; l'admin consulte une URL signée temporaire avant validation. La migration `supabase/migrations/20261124220000_require_payment_proof_for_subscription_validation.sql` impose aussi côté SQL la présence d'une preuve avant le passage d'un paiement d'abonnement à `paid`.
- Commit: `KORA-004: relier les preuves de paiement à la validation admin`.
- Statut: code et migration versionnée corrigés sur la branche; migration non appliquée à la base active; tests CI à vérifier.



### KORA-005 | incomplet / simulation | moyenne | client et manager | connexion / OAuth | `src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/lib/AuthContext.jsx`, `src/pages/OAuthConsent.jsx`

- Étapes: lecture intégrale des pages Login/Register/OAuthConsent et du contexte Auth; recherche des appels `signInWithOAuth`, `signInWithIdToken` et des références Google dans ces fichiers.
- Attendu: si Google OAuth est présenté comme disponible, le bouton doit lancer une authentification réelle et valider la session Supabase.
- Observé: aucun démarrage Google OAuth n'est présent dans Login, Register ou AuthContext. La route `/oauth/consent` affiche un écran de consentement autonome; son bouton attend 800 ms, change un état local, puis redirige vers `/home`, sans appel OAuth, serveur ni session.
- Cause: écran de consentement simulé non relié à un fournisseur OAuth.
- Correction appliquée: suppression de la route publique `/oauth/consent` et du composant simulé, qui redirigeait vers `/home` sans authentifier l'utilisateur.
- Limite restante: aucun démarrage Google OAuth réel n'a été trouvé dans Login, Register ou AuthContext. Le flux Google reste absent; sa configuration dépend de l'activation du fournisseur dans Supabase Auth.
- Commit: `KORA-005: retirer le consentement OAuth simulé`.
- Statut: simulation supprimée; Google OAuth reste ouvert comme fonctionnalité non implémentée.



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



### KORA-010 | UX / incohérence de permissions | moyenne | admin associé | paramètres administration | `src/pages/admin/AdminPanel.jsx`, `src/pages/admin/Settings.jsx`, `public.update_kora_setting(text,jsonb)`

- Étapes: lecture intégrale de la gestion des vues admin et de la page Settings; inspection de la fonction SQL `update_kora_setting`.
- Attendu: un compte ayant seulement `settings.read` consulte les paramètres sans voir d'action d'écriture qu'il ne peut pas exécuter.
- Observé: `AdminPanel` autorise un associé ayant `settings.read` à ouvrir la vue Paramètres; la page affiche systématiquement les boutons Enregistrer. La fonction SQL refuse pourtant toute modification sauf si `is_super_admin()` est vrai.
- Cause: l'interface ne distingue pas les permissions de lecture et d'écriture.
- Correction appliquée: `AdminPanel` passe une propriété `canEdit` vraie uniquement au Super Admin; la page désactive les contrôles et masque les boutons Enregistrer pour les autres admins. Le serveur reste l'autorité finale.
- Commit: `KORA-010: masquer les actions d'écriture des paramètres aux associés`.
- Statut: corrigé sur la branche d'audit; build CI à vérifier.



### KORA-011 | sécurité | moyenne | client et manager | inscription / mot de passe | configuration Supabase Auth

- Étapes: lecture de l'advisor de sécurité Supabase du projet actif, observé le 24 novembre 2026.
- Attendu: la protection contre les mots de passe compromis est activée pour empêcher l'utilisation de secrets connus dans des fuites publiques.
- Observé: l'advisor `auth_leaked_password_protection` signale `Leaked Password Protection Disabled`.
- Cause: option de sécurité Auth désactivée dans la configuration du projet.
- Correction: non appliquée. Ce paramètre relève de la configuration Supabase Auth et non d'une migration SQL; aucune modification manuelle non versionnée n'a été faite.
- Commit: aucun.
- Statut: ouvert, action de configuration à planifier et tracer.



### KORA-013 | incohérence métier | moyenne | manager | `/manager/talents` | `src/pages/manager/Talents.jsx` / calcul de `talentLimit`

- Étapes: lecture du calcul de quota dans la page Manager et de la fonction `get_my_subscription()` dans Supabase.
- Attendu: le quota appliqué dans l'interface provient de `plans.talent_limit`, comme le contrôle serveur `create_manager_talent`.
- Observé: l'interface codait 1 talent pour FREE, 3 pour PRO et illimité pour BUSINESS, alors que `get_my_subscription()` renvoie déjà `talent_limit` depuis la base.
- Cause: duplication des quotas dans le frontend.
- Correction appliquée: l'interface utilise maintenant `subscription.talent_limit`; si la configuration est absente ou invalide, la création est bloquée par défaut au lieu de devenir illimitée.
- Commit: `KORA-013: lire le quota talent depuis la configuration du plan`.
- Statut: corrigé sur la branche d'audit; build CI à vérifier.



### KORA-012 | incomplet | moyenne | client et manager | fiche talent publique | `src/pages/talent/Detail.jsx`, `src/pages/manager/Talents.jsx`, `public.get_talent_manager_profile(uuid)`, schéma public

- Étapes: lecture des zones de chargement et d'affichage de la fiche talent, du formulaire manager, des colonnes de `talent_profiles` et `profiles`, et des fonctions publiques de contact manager.
- Attendu: une fiche talent présente les réseaux sociaux, un calendrier de disponibilité et le numéro de téléphone du manager comme canal de contact.
- Observé: la fiche affiche un booléen Disponible/Indisponible, un portfolio de fichiers/liens génériques et un bouton qui ouvre une conversation KORA. Aucun calendrier de créneaux ni champ social dédié n'existe dans le schéma public inspecté. Le profil manager public renvoie seulement `id, name, avatar, role`; le numéro est dans `profiles.phone` et n'est pas exposé par cette fonction.
- Cause: les champs et parcours de calendrier/réseaux sociaux/contact téléphonique ne sont pas implémentés dans le modèle actuel.
- Correction: aucune. Le numéro de téléphone est une donnée personnelle; sa visibilité publique doit être décidée avant toute exposition (D-007). Le périmètre exact du calendrier et des réseaux doit être confirmé.
- Commit: aucun.
- Statut: ouvert.



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
- Commit: `KORA-015: interdire le paramètre de commission`.
- Statut: migration versionnée sur la branche; non appliquée à la base active.

