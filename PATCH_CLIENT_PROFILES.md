# KORA — correction erreur profiles.first_name

Dans le projet, rechercher :

```js
.from("profiles")
.select("id,first_name,last_name,name,role")
```

Remplacer par :

```js
.from("profiles")
.select("id,name,role")
```

Ne pas supprimer `first_name` / `last_name` des requêtes `talent_profiles` : ces colonnes appartiennent aux talents.

Le schéma canonique `profiles` utilise `id, name, role, avatar` et, selon les phases, `phone, city, company, bio, preferences`.
