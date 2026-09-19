# KORA — PHASE 16 CORRECTIONS / INSTALLATION

## 1. Supabase

Dans Supabase > SQL Editor, exécuter d'abord :

1. `supabase/supabase_phase13_admin.sql` si la partie administration Phase 13 n'est pas déjà installée.
2. `supabase/PHASE16_FINAL_FIX.sql`

Aucune table existante n'est supprimée par `PHASE16_FINAL_FIX.sql`.
Les colonnes métier manquantes sont ajoutées avec `add column if not exists`.

## 2. Fichiers frontend à remplacer/ajouter

Remplacer :

- `src/App.jsx`
- `src/components/KoraLayout.jsx`
- `src/pages/talent/Detail.jsx`
- `src/pages/client/ClientSettings.jsx`
- `src/pages/client/ProjectDetail.jsx`
- `src/pages/client/ReviewProject.jsx`
- `src/pages/manager/Settings.jsx`
- `src/pages/manager/RequestDetail.jsx`
- `src/pages/admin/AdminPanel.jsx`
- `src/pages/admin/Users.jsx`
- `src/pages/admin/Payments.jsx`
- `src/pages/admin/Settings.jsx`
- `src/lib/admin.js`
- `src/lib/requestInvitations.js`

Ajouter :

- `src/components/TalentRequestButton.jsx`
- `supabase/functions/admin-users/index.ts`

## 3. Edge Function

IMPORTANT : `supabase/functions/admin-users/index.ts` est du code Deno/Supabase Edge Function.
Il ne doit pas être collé dans `src/` ou dans un fichier JavaScript du frontend.

Depuis le dossier du projet :

`supabase functions deploy admin-users`

La fonction utilise `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` côté Supabase.
La clé service_role ne doit jamais être exposée dans le frontend.

## 4. Ce qui est corrigé

- Client : `/client/profile` et `/client/settings` fonctionnent et sauvegardent directement dans `profiles`.
- Manager : le bouton de sauvegarde du profil ne dépend plus de `AuthContext.updateUser`.
- Manager : préférences, langue et thème sont persistants.
- Demande de collaboration : titre, type, description, période, budget, lieu et informations complémentaires.
- Sans projet préalable, la demande peut créer le projet automatiquement.
- Manager : le projet issu d'une demande acceptée peut être activé, terminé ou annulé.
- Client : un projet terminé affiche le bouton d'évaluation.
- Client : la note 1–5 et le commentaire sont enregistrés par RPC sécurisé.
- Admin : modification des informations utilisateur.
- Admin : suspension / réactivation.
- Admin : suppression réelle via Edge Function.
- Admin : validation des paiements.
- Admin : vrai écran « Paramètres administration » au lieu de l'écran Manager.

## 5. Vérification

Après copie :

`npm run build`

Puis :

`npm run dev`

Tester obligatoirement :

Client -> Profil -> Modifier -> Mettre à jour
Client -> Paramètres -> Enregistrer
Manager -> Paramètres -> Profil -> Enregistrer
Client -> Projet terminé -> Laisser un avis
Manager -> Demande acceptée -> Gestion du projet -> Marquer terminé
Admin -> Utilisateurs -> Modifier / Suspendre / Supprimer
Admin -> Paiements -> Gérer -> Confirmer
