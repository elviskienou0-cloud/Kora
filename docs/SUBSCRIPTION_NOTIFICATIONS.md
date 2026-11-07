# KORA — notifications d'expiration des abonnements

## Fonctionnement

- Un rappel e-mail est préparé 7 jours avant l'échéance.
- Un second rappel e-mail est préparé 3 jours avant l'échéance.
- Le jour de l'expiration, KORA crée une notification interne et envoie un e-mail de confirmation. Les rappels à 7 et 3 jours sont envoyés par e-mail uniquement.
- Les événements sont uniques par abonnement, type et date d'échéance : chaque nouveau cycle peut recevoir ses propres rappels sans doublons.
- Les rappels sont envoyés uniquement aux comptes Manager.
- Le traitement quotidien est déclenché par GitHub Actions à 08:00 UTC (heure du Burkina Faso).
- Aucun bandeau n'est ajouté au tableau de bord.

## Déploiement après fusion

Depuis le dossier du dépôt KORA :

```powershell
supabase db push --project-ref lhqbvswhfudcsrtvqzqj
supabase functions deploy subscription-notifications --project-ref lhqbvswhfudcsrtvqzqj
```

## Secrets Supabase

Créer un secret aléatoire d'au moins 32 caractères, puis enregistrer **la même valeur** dans Supabase et GitHub. Ne jamais le committer ni le partager dans une conversation.

Dans Supabase Edge Function Secrets, configurer :

- `KORA_SUBSCRIPTION_CRON_SECRET` : secret aléatoire partagé avec GitHub Actions.
- `RESEND_API_KEY` : clé API Resend (serveur uniquement).
- `KORA_EMAIL_FROM` (facultatif) : expéditeur vérifié, par exemple `KORA <no-reply@auth.koratalent.online>`.

Le projet doit également disposer de sa clé serveur Supabase gérée par la plateforme (`SUPABASE_SECRET_KEYS` ou variable de compatibilité service role). Aucune clé serveur ne doit être ajoutée au frontend. Configure `RESEND_API_KEY` uniquement après vérification du domaine d'envoi dans Resend ; sinon les cinq premières tentatives d'envoi pourraient échouer et être conservées pour inspection.

## Secrets GitHub

Dans GitHub → Settings → Secrets and variables → Actions, créer :

- `SUPABASE_URL` : URL API du projet Supabase.
- `SUPABASE_PUBLISHABLE_KEY` : clé publishable du projet (clé publique, mais à conserver dans les secrets GitHub pour le workflow).
- `KORA_SUBSCRIPTION_CRON_SECRET` : exactement la même valeur que dans Supabase.

Le workflow `.github/workflows/subscription-expiry-notifications.yml` s'exécute chaque jour à 08:00 UTC. Il peut aussi être lancé manuellement depuis l'onglet Actions.

## Condition d'envoi Resend

L'e-mail n'est considéré comme envoyé que lorsque l'API Resend répond avec succès. Les échecs sont conservés dans `subscription_notification_events` et peuvent être retentés jusqu'à cinq fois. Si `RESEND_API_KEY` manque, les notifications internes sont créées mais les e-mails restent en attente.

Le domaine d'envoi Resend doit être vérifié et ses enregistrements DNS doivent être valides avant de considérer la livraison comme opérationnelle. Une réponse API acceptée ne garantit pas à elle seule l'arrivée dans la boîte de réception.
