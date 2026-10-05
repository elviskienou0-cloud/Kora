# Dossier de préparation CIL — KORA
Date de préparation : 5 octobre 2026

> Document de préparation interne. Ce document ne constitue pas une déclaration déposée auprès de la CIL.

## 1. Responsable du traitement
- Responsable : Kienou Elvis Dan Aurèle
- Établissement : Ouagadougou, Burkina Faso
- Téléphone professionnel : +226 70 27 18 10
- E-mail : kora.contact1@gmail.com

## 2. Service concerné
KORA est une plateforme de mise en relation entre clients et managers/talents.

Fonctionnalités concernées :
- création et gestion de comptes ;
- profils clients et managers ;
- profils de talents gérés par les managers ;
- recherche et consultation ;
- favoris ;
- demandes et projets ;
- conversations, messages et notifications ;
- avis et signalements ;
- abonnements et paiements ;
- modération et administration ;
- support et exercice des droits ;
- cookies et stockage technique.

## 3. Catégories de personnes
- clients ;
- managers ;
- talents dont les profils sont gérés par des managers ;
- administrateurs et superadministrateurs ;
- personnes contactant KORA pour le support ou les droits.

## 4. Catégories de données
### Identification et profil
- nom ;
- téléphone ;
- ville ;
- entreprise ;
- biographie ;
- avatar et couverture ;
- préférences de compte.

### Authentification
- identifiant utilisateur ;
- adresse e-mail ;
- téléphone ;
- état de confirmation ;
- dates de création, modification et dernière connexion ;
- identités de connexion.

Les mots de passe et jetons techniques d'authentification ne sont pas exportés aux utilisateurs.

### Données d'activité
- demandes ;
- projets ;
- favoris ;
- messages ;
- conversations ;
- notifications ;
- avis ;
- signalements ;
- journaux d'activité.

### Données commerciales
- abonnements ;
- paiements ;
- références de paiement ;
- statut et dates des paiements ;
- informations nécessaires à la validation manuelle SasPay.

### Données des talents
- identité/profil du talent ;
- catégorie ;
- pays/ville ;
- tarif ;
- disponibilité ;
- statut ;
- portfolio et métadonnées des fichiers.

### Consentements
- type de consentement ;
- version de la politique ;
- source ;
- date d'accord ;
- date de révocation le cas échéant.

## 5. Finalités
- fournir les fonctionnalités KORA ;
- gérer les comptes et l'authentification ;
- mettre en relation clients et managers/talents ;
- gérer les demandes, projets et communications ;
- gérer les abonnements et paiements ;
- assurer la sécurité, la modération et la prévention des abus ;
- répondre aux demandes des utilisateurs ;
- respecter les obligations légales ;
- envoyer des communications marketing uniquement lorsque le consentement requis existe.

## 6. Sources
- utilisateur lui-même ;
- actions réalisées dans KORA ;
- managers pour les informations de talents qu'ils gèrent ;
- informations générées par les opérations de paiement et d'administration.

## 7. Hébergement et prestataires
- Vercel : déploiement de l'interface ;
- Supabase : Auth, PostgreSQL, Storage et Edge Functions ;
- SasPay : paiement selon le parcours actuellement configuré.

Des traitements ou transferts peuvent être effectués hors du Burkina Faso selon l'infrastructure des prestataires.

## 8. Droits des personnes
KORA fournit actuellement :
- accès/consultation des données via /mes-donnees ;
- export JSON ;
- suppression du compte pour les clients et managers ;
- gestion du consentement marketing ;
- contact pour rectification, opposition ou demande complémentaire.

## 9. Conservation
La durée de conservation doit être finalisée par catégorie dans la documentation CIL et alignée avec les finalités et obligations applicables.

Principe technique KORA :
- suppression des données personnelles lors de la suppression du compte lorsque leur conservation n'est pas nécessaire ;
- conservation éventuelle des éléments nécessaires aux obligations légales, à la sécurité, à la preuve ou à la gestion des litiges, avec limitation et anonymisation lorsque cela est approprié.

## 10. Sécurité
- Supabase RLS sur les tables exposées ;
- séparation des rôles client/manager/admin/superadmin ;
- fonctions privilégiées protégées ;
- secrets serveur non exposés au frontend ;
- suppression Storage via l'API Storage ;
- suppression Auth côté serveur ;
- consentements obligatoires contrôlés côté serveur ;
- journalisation administrative.

## 11. Formalités CIL à finaliser
- identifier la formalité exacte applicable à chaque traitement ;
- préparer le formulaire d'identification du responsable ;
- préparer la description des traitements ;
- préparer l'annexe relative aux transferts hors du Burkina Faso ;
- finaliser les durées de conservation par catégorie ;
- finaliser les destinataires/catégories de destinataires ;
- vérifier les mesures de sécurité et les pièces justificatives ;
- déposer la formalité auprès de la CIL et conserver la preuve de dépôt/réponse.

## 12. Point de vigilance
Le présent document est un dossier préparatoire. La publication des pages légales et la mise en place technique des droits ne remplacent pas la formalité administrative auprès de la CIL lorsqu'elle est requise.
