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

