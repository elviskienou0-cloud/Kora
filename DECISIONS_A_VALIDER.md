# Décisions métier à valider

Les points ci-dessous sont volontairement laissés ouverts. Aucune logique tarifaire, de paiement ou de stack n'est modifiée sans arbitrage.

## D-001 | Tarifs contradictoires entre versions

**Constat vérifié:** le `README.md` du snapshot `main` décrit Gratuit à 0 XOF avec 1 talent, Pro à 2 500 XOF/mois avec 3 talents et Business à 5 000 XOF/mois sans limite. D'autres versions historiques de la définition produit mentionnent Standard à 5 000 XOF pour 5 talents et Agent à 20 000 XOF sans limite, tandis que le présent cahier d'audit mentionne Standard limité à 1 talent.

**Options**
1. Confirmer les offres du README comme vérité métier actuelle.
2. Remplacer par une grille Standard/Pro/Business explicitement approuvée.
3. Définir les tarifs et limites uniquement dans la configuration admin et traiter les valeurs du README comme documentation historique à mettre à jour.

**Recommandation:** option 3, après validation écrite des noms, prix, durées, limites et droits de chaque offre. Ne pas modifier les valeurs existantes avant confirmation.

## D-002 | Stack Next.js + Prisma vs Supabase

**Constat vérifié:** `package.json`, `vite.config.js` et `capacitor.config.ts` confirment actuellement React + Vite + Capacitor. Supabase JS est installé. Aucun Next.js, Prisma ou Expo n'a été constaté dans les manifests racine lus.

**Options**
1. Conserver React/Vite + Supabase + Capacitor (aligné sur le dépôt existant).
2. Migrer vers Next.js + Prisma (changement d'architecture important).
3. Introduire Expo/React Native en complément de l'application web Capacitor.

**Recommandation:** option 1 pour cet audit, sans migration de stack. Toute évolution mobile native doit faire l'objet d'une décision distincte et d'un plan de compatibilité.

## D-003 | Périmètre des plans

**Constat:** le README annonce Gratuit 1 talent, Pro 3 talents et Business illimité. Les invariants d'audit imposent un essai d'un mois pour les nouveaux managers et citent Standard limité à 1 talent, mais ne définissent pas entièrement les droits de chaque plan.

**Options**
1. Confirmer les limites et fonctionnalités exactes du README.
2. Définir un plan Standard distinct.
3. Définir une matrice officielle des droits, quotas et restrictions par plan dans l'admin.

**Recommandation:** option 3. Faire valider une matrice complète avant de modifier les contrôles front, RPC, fonctions SQL ou policies.

## D-004 | Paiement direct Orange Money / Moov Money vs SasPay

**Constat vérifié:** le README affirme que SasPay est actuellement utilisé pour les abonnements Manager. Le cahier d'audit impose Orange Money / Moov Money directs et exclut les agrégateurs tiers.

**Options**
1. Confirmer SasPay et réviser l'invariant de paiement direct.
2. Remplacer SasPay par des flux directs Orange Money et Moov Money, après validation de leurs API, contrats et exigences opérateur.
3. Maintenir temporairement le flux existant tout en bloquant toute nouvelle activation automatique, jusqu'à migration validée.

**Recommandation:** ne pas supprimer ni remplacer un flux de paiement en production avant validation technique et opérationnelle. Confirmer explicitement l'option cible; toute activation d'abonnement doit rester manuelle conformément à l'invariant métier.

## D-005 | Périmètre de l'essai gratuit

**À confirmer:** essai gratuit de 30 jours attribué à tous les nouveaux managers, date de début (création du compte ou première configuration), nombre de talents et droits autorisés pendant l'essai, comportement à expiration.

**Recommandation:** essai de 30 jours à partir de la création du compte manager, avec droits explicitement définis et blocage contrôlé à expiration, si cette règle est confirmée.

## D-006 | Blocage à expiration

**À confirmer:** « blocage complet » peut signifier interdiction de toute action métier tout en conservant la possibilité de connexion, de consulter l'état du compte, de télécharger ses données ou de soumettre une preuve de paiement. Ces exceptions ne doivent pas être déduites.

**Recommandation:** définir une matrice des actions autorisées après expiration avant de modifier les guards ou policies.

## D-007 | Visibilité du numéro du manager sur les fiches talents

**Constat:** le numéro est stocké dans `profiles.phone`, mais la fonction publique `get_talent_manager_profile` ne renvoie pas ce champ. La fiche talent ouvre actuellement une conversation KORA.

**Options**
1. Numéro visible publiquement à tous les visiteurs.
2. Numéro visible uniquement aux clients connectés.
3. Numéro révélé après action volontaire du client, avec consentement explicite du manager pour chaque talent.
4. Conserver la messagerie KORA comme canal principal et proposer le téléphone uniquement sur activation volontaire.

**Recommandation:** option 3 ou 4. Le numéro doit rester privé par défaut; prévoir un consentement explicite du manager avant toute exposition, avec possibilité de retrait.

## D-008 | Réseaux sociaux et calendrier de disponibilité

**Constat:** le modèle actuel permet des liens génériques de portfolio et un booléen `available`; il ne comporte pas de champs sociaux structurés ni de calendrier de créneaux.

**Options**
1. Garder uniquement les liens génériques du portfolio et le statut Disponible/Indisponible.
2. Ajouter des profils sociaux structurés (Instagram, TikTok, YouTube, Facebook, LinkedIn, site web) sans calendrier de réservation.
3. Ajouter profils sociaux structurés et calendrier de disponibilités par dates/créneaux, avec fuseau horaire.

**Recommandation:** option 3 si le calendrier doit servir à des demandes de booking réelles; sinon option 2 et conserver le statut de disponibilité simple. Ne pas créer de calendrier simulé ou non connecté à une source de données.


## D-009 | Pièces jointes de la messagerie

**Constat:** la messagerie actuelle stocke uniquement le texte. Aucun champ ou bucket de pièce jointe n'existe.

**Options**
1. Images uniquement, limite de 5 Mo.
2. Images et PDF, limite de 10 Mo.
3. Images, PDF et documents bureautiques, limite de 10 Mo.
4. Ajouter également des vidéos, avec une limite distincte.

**Recommandation:** option 2 pour une première version. Utiliser un bucket privé, des chemins liés à `conversation_id` et `message_id`, des policies vérifiant la participation à la conversation, et des URL signées temporaires. La taille et les MIME doivent être contrôlés côté client et côté Storage. Ne pas rendre les pièces jointes publiques.


### Complément D-002 | Stack mobile réellement présente

- Le dépôt utilise React + Vite pour le web, Supabase pour Auth/DB/Storage/Edge Functions, et Capacitor pour l'application Android.
- Aucun Next.js, Prisma, React Native ou Expo n'a été trouvé dans le manifeste et l'arborescence inspectés.
- Le projet contient un dossier Android; aucun dossier iOS n'a été trouvé dans l'arborescence actuelle.
- **Recommandation:** conserver Capacitor pour éviter une réécriture tant que les besoins natifs ne l'exigent pas; valider explicitement le support iOS et les parcours mobiles sur appareils réels avant lancement.

## D-010 | Attribution du rôle administrateur

**Constat:** l'inscription publique ne propose que Client et Manager. En parallèle, un parcours d'invitation réservé au Super Admin permet à un utilisateur invité d'accepter un accès Admin associé.

**Options**
1. Exiger exclusivement une modification manuelle en base; supprimer le parcours d'invitation.
2. Autoriser les invitations créées par le Super Admin, sans jamais proposer Admin dans l'inscription publique.
3. Autoriser les invitations pour les administrateurs associés, mais réserver le rôle Super Admin à une attribution manuelle en base.

**Recommandation:** option 3. Elle conserve un contrôle centralisé tout en évitant l'auto-attribution publique. À confirmer au regard de la règle « admin attribué manuellement en base ».
