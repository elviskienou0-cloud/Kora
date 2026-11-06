# Migrations non appliquées archivées

Ces fichiers étaient présents dans `supabase/migrations/` mais leurs versions ne figurent pas dans `supabase_migrations.schema_migrations` du projet KORA au moment de l'audit du 6 novembre 2026.

Ils sont conservés ici pour préserver l'historique du dépôt, mais retirés du dossier surveillé par Supabase CLI afin d'éviter qu'une prochaine commande de migration tente de les appliquer automatiquement.

- `20261009220000_automatic_subscription_expiration.sql` et `20261009221000_expired_manager_read_only.sql` sont des copies exactes de versions antérieures déjà appliquées.
- `20261009222000_global_expired_manager_write_lock.sql` est une variante non appliquée de la migration de verrouillage. Elle n'est pas activée automatiquement, car elle diffère de la version réellement appliquée et doit être examinée séparément avant toute décision.
- `20261009223000_expired_manager_write_trigger_guard.sql` reprend la migration de trigger déjà appliquée, avec une différence de fin de fichier uniquement.

Ne pas réintroduire ces fichiers dans `supabase/migrations/` sans comparaison avec l'état réel de la base et validation dédiée.
