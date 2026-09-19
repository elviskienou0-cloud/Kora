# KORA — Plateforme des Talents Africains

## 📌 Description du projet

**KORA** est une plateforme web moderne qui connecte les talents africains exceptionnels avec des opportunités professionnelles, en Afrique et à l'international. L'application propose des espaces dédiés pour **3 rôles utilisateurs** (Client, Talent/Manager, Admin) avec des tableaux de bord, des fonctionnalités de recherche, de messagerie et de gestion de projets.

L'UI est conçue avec une esthétique **premium "gold"** (dégradés dorés, glassmorphism, animations fluides) et une experience **ultra-responsive et interactive**.

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- npm (inclus avec Node.js)

### Installation et lancement

```powershell
# 1. Installer les dépendances
cd "c:\MES PROJETS\Kora"
npm install

# 2. Lancer le serveur de développement (Vite)
npm run dev
# → Ouvrir http://localhost:5173 (ou le port indiqué)

# 3. Build de production
npm run build

# 4. Prévisualiser le build
npm run preview
```

---

## 🛠️ Stack Technique

| Catégorie | Librairies |
|---|---|
| **Framework** | React 18 + Vite 6 |
| **Router** | React Router DOM v6 |
| **UI System** | Shadcn/UI + Tailwind CSS 3 |
| **Primitives** | Radix UI (Dialog, Select, Tabs, etc.) |
| **Animations** | Framer Motion (motion, AnimatePresence) |
| **État global** | React Context (AuthContext) + React Query v5 |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Notifications** | Sonner (toast) + Radix Toast |
| **Graphiques** | Recharts |
| **Autres** | next-themes (dark mode), clsx/tailwind-merge, date-fns, Stripe |

---

## 📂 Structure du Projet

```
Kora/
├── public/                 # Assets statiques (favicon, icons)
├── src/
│   ├── assets/             # Images (hero.png, react.svg…)
│   ├── components/
│   │   ├── ui/             # ~40 composants Shadcn/UI (Button, Card, Badge…)
│   │   ├── landing/        # LandingHeader, LandingFooter
│   │   ├── AuthLayout.jsx  # Layout pages auth (login/register)
│   │   ├── KoraLayout.jsx  # Layout principal (sidebar + header)
│   │   ├── ProtectedRoute.jsx  # Garde d'authentification
│   │   ├── RoleGuard.jsx   # Garde de rôles
│   │   ├── ScrollToTop.jsx # Reset scroll au changement de route
│   │   └── …               # FileUpload, TalentForm, WeeklyChart…
│   ├── hooks/
│   │   ├── use-mobile.jsx  # Hook détection mobile (< 768px)
│   │   └── use-size.jsx    # Hook taille écran
│   ├── lib/
│   │   ├── AuthContext.jsx     # Contexte authentification (mock users)
│   │   ├── app-params.js       # CONSTANTES globales (nom, catégories, tarifs)
│   │   ├── categoryIcons.js    # Map icônes → catégories
│   │   ├── query-client.js     # Config React Query
│   │   ├── utils.js            # fn utilitaires (cn, formatCurrency…)
│   │   ├── authReturnTo.js     # Redirection post-login
│   │   └── PageNotFound.jsx    # Page 404
│   ├── pages/
│   │   ├── Landing.jsx         # Page d'accueil marketing
│   │   ├── Login.jsx / Register.jsx
│   │   ├── Categories.jsx      # Catalogue catégories
│   │   ├── talent/Detail.jsx   # Fiche détail talent
│   │   ├── client/             # Dashboard, Browse, Favorites, Requests, Notifications
│   │   ├── manager/            # Dashboard, Talents, Requests, Subscription, Settings
│   │   ├── admin/AdminPanel.jsx
│   │   ├── Home.jsx, Messages.jsx
│   │   └── ForgotPassword, ResetPassword, OAuthConsent
│   ├── utils/
│   ├── App.jsx             # Définition des routes (BrowserRouter)
│   ├── main.jsx            # Point d'entrée (Providers + Root render)
│   ├── index.css           # Tailwind + variables CSS globales (gold theme)
│   └── App.css
├── index.html
├── vite.config.js          # Alias '@' → ./src
├── tailwind.config.js      # Thème custom (couleurs gold, animations)
├── jsconfig.json
└── package.json
```

---

## 🧭 Routes & Navigation

### Routes publiques
| Chemin | Page | Description |
|---|---|---|
| `/` | **Landing** | Page marketing (hero, stats, features, tarifs, témoignages) |
| `/categories` | **Categories** | Catalogue des 8 catégories de talents |
| `/talent/:id` | **Talent Detail** | Fiche détaillée d'un talent |
| `/login` | **Login** | Connexion |
| `/register` | **Register** | Inscription (3 rôles : Client / Talent / Manager) |
| `/forgot-password` | ForgotPassword | Mot de passe oublié |
| `/reset-password` | ResetPassword | Réinitialisation |
| `/oauth/consent` | OAuthConsent | Écran consentement OAuth |
| `/404` | 404 | Page introuvable |

### Routes protégées (authentification requise)

#### Routes partagées
| Chemin | Page |
|---|---|
| `/home` | Home (accueil après connexion) |
| `/messages` | Messages (messagerie) |

#### Rôle **Client** (+ Admin)
| Chemin | Page |
|---|---|
| `/client/dashboard` | ClientDashboard |
| `/client/browse` | **Browse** : recherche/filtrer les talents |
| `/client/favorites` | Favoris |
| `/client/requests` | Demandes de projet |
| `/client/notifications` | Notifications |

#### Rôle **Manager / Talent** (+ Admin)
| Chemin | Page |
|---|---|
| `/manager/dashboard` | ManagerDashboard (stats + graphiques) |
| `/manager/talents` | Gestion des talents |
| `/manager/requests` | Demandes reçues |
| `/manager/subscription` | Abonnement (Stripe) |
| `/manager/settings` | Paramètres compte |

#### Rôle **Admin** uniquement
| Chemin | Page |
|---|---|
| `/admin` | AdminPanel (back-office) |

---

## 👥 Comptes de démonstration (Mock Users)

L'authentification est **mockée** (localStorage `kora.auth.user`). Utilisez ces identifiants :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@kora.africa` | `admin123` | Administrateur |
| `manager@kora.africa` | `manager123` | Manager |
| `client@kora.africa` | `client123` | Client |
| `talent@kora.africa` | `talent123` | Talent |

---

## 🎨 Fonctionnement de l'UI / Design System

### Thème visuel
Le thème est basé sur une **palette Gold/Amber premium** avec un mode sombre clair (`:root` / `.dark`).

**Classes utilitaires custom** (définies dans `index.css` + Tailwind) :
- `.gold-gradient` — Dégradé doré boutons/accents
- `.gold-text-gradient` — Texte dégradé doré
- `.shimmer-bg` — Animation shimmer dorée
- `.glass` — Effet glassmorphism (blur + semi-transparent)
- `bg-sidebar, text-sidebar-*` — Couleurs sidebar dédiées

### Animations (Framer Motion)
Toutes les transitions utilisent Framer Motion :
- `fadeInUp` — Fade + translation vers le haut (landing cards, liste)
- `staggerContainer` — Défilement enfants (staggerChildren)
- `whileHover={{ y: -6 }}` — Effet hover "lift" sur cartes
- `AnimatePresence` — Transitions entre routes & modales
- Parallax hero : `useScroll` + `useTransform`

### Responsive
- **Mobile < 768px** : Sidebar devient un **drawer latéral** gauche (burger menu)
- **Breakpoints Tailwind** : `sm: md: lg: xl:` utilisés partout

### Layouts principaux

1. **Landing Layout** (public) — `LandingHeader` (sticky glass) + main + `LandingFooter`
2. **Auth Layout** — Centré verticalement, dégradé subtil, carte blanche
3. **Kora Layout** (authentifié) — Structure 2 colonnes :
   - Sidebar fixe **256px** (logo + nav + CTA Premium + menu user)
   - Colonne principale : Header sticky (notifications + messages + avatar) + `<Outlet />`

### Interactions clés
- **Toasts** : `toast.success / toast.error` (Sonner, top-right)
- **Navigation** : tous les liens utilisent `NavLink` avec `isActive`
- **Forms** : contrôlés, validation client-side, loading state sur boutons

---

## ⚙️ Constantes globales (`lib/app-params.js`)

```js
APP_PARAMS = {
  name: "KORA",
  tagline: "La plateforme des talents africains",
  categories: [
    { id: "tech",       name: "Technologie & Digital", count: 1248 },
    { id: "creative",   name: "Créatif & Design",      count: 872  },
    { id: "business",   name: "Business & Stratégie",  count: 534  },
    { id: "marketing",  name: "Marketing & Comm",      count: 612  },
    { id: "finance",    name: "Finance & Compta",      count: 298  },
    { id: "legal",      name: "Juridique & Conseil",   count: 156  },
    { id: "education",  name: "Formation & Éducation", count: 421  },
    { id: "health",     name: "Santé & Bien-être",     count: 267  },
  ],
  plans: {
    free:     { name: "Découverte",   price: 0 },
    pro:      { name: "Talent Pro",   price: 5_000 },
    business: { name: "Business",     price: 20_000 },
  }
}
```

---

## 🐛 Problèmes résolus (session en cours)

### ❌ Problème initial : Page blanche complète au `npm run dev`
**Cause racine** : `ReferenceError: Megaphone is not defined` dans `src/pages/client/Browse.jsx`

Même si l'utilisateur était sur la page `/` (Landing), **tous les imports d'App.jsx sont évalués au chargement**, y compris Browse.jsx. Une erreur JS dans un module importé casse **l'intégralité du rendu React**.

**3 icônes manquaient** dans l'import `lucide-react` de Browse.jsx :
- `Megaphone` (Marketing)
- `BarChart3` (Data)
- `FileText` (Contenu)

### ✅ Correctifs appliqués
1. **`src/pages/client/Browse.jsx`** — Ajout de `Megaphone, BarChart3, FileText` aux imports lucide-react
2. **`src/App.jsx`** — Extraction de `<ScrollToTop />` hors d'`<AnimatePresence>` (supprime warning duplicate keys)

---

## 🧪 Test recommandé (par étapes)

1. ✅ **Landing `/`** — Vérifier Hero, stats, 6 features, 8 catégories, 3 tarifs, CTA finale, footer
2. ✅ **Login `/login`** — Cliquer sur comptes démo, soumettre le form
3. ✅ **Register `/register`** — Sélection Client/Talent/Manager, remplir formulaires
4. ⏳ **Espace Client** — Connecté en `client@kora.africa` → Test parcours `/client/browse` (filtres + favoris)
5. ⏳ **Espace Manager** — `/manager/dashboard` graphiques + `/manager/subscription`
6. ⏳ **Mobile** — Redimensionner < 768px → tester sidebar drawer

---

## 📝 Notes importantes

- **Aucun backend réel** : Auth, données talents, requêtes sont **mockés en dur** (tableaux JS)
- **Persistance** : uniquement `localStorage` (utilisateur connecté) + `sessionStorage` (returnTo)
- **3 PBs de feature flags React Router** affichés en console : warnings non bloquants (attendus v6 → v7)
- **Tailwind Animate** : plugin `tailwindcss-animate` requis (installé)
- **Alias `@/*`** → mappé vers `./src/*` dans `vite.config.js` + `jsconfig.json`

---

## 🔗 Liens utiles

- Doc React : https://react.dev
- Doc Vite : https://vitejs.dev
- Doc Shadcn/UI : https://ui.shadcn.com
- Doc Framer Motion : https://www.framer.com/motion
- Doc React Router v6 : https://reactrouter.com/en/v6
- Icônes Lucide : https://lucide.dev/icons/
