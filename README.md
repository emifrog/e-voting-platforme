# E-Voting Platform - Plateforme de Vote Électronique Complète

Plateforme SaaS professionnelle de vote électronique sécurisé avec chiffrement de bout en bout, développée avec **Next.js 15**, **Supabase** et **TypeScript**.

---

## 🎯 Résumé Exécutif

Plateforme **production-ready** de vote électronique sécurisé avec **~20,000 lignes de code**, **95+ fichiers TypeScript**, et **15+ guides** de documentation complète.

### 🔐 Sécurité & Compliance
- ✅ **Chiffrement AES-256-GCM** de bout en bout pour votes secrets
- ✅ **2FA (TOTP)** avec Google Authenticator + backup codes
- ✅ **Protection CSRF** complète + Rate Limiting multi-niveaux
- ✅ **Accessibilité WCAG 2.1 AA** : Navigation clavier, ARIA, contrastes optimisés
- ✅ **RLS Policies (29+)** + Audit trail immutable
- ✅ **OAuth Social** : Google et Microsoft/Outlook

### 🗳️ Fonctionnalités Core
- ✅ **4 types de votes** : Simple, Approbation, Classé, Liste
- ✅ **CRUD élections** : Création, Édition, Recherche/Filtrage, Suppression (soft delete)
- ✅ **Gestion électeurs** : Import CSV masse, Pagination 1000+, QR Code inscription
- ✅ **Templates élections** : Réutilisation configurations (AGO, CA, etc.)
- ✅ **Calendrier interactif** : Vue agenda avec FullCalendar
- ✅ **Auto-save formulaires** : Récupération après crash navigateur

### 📊 Analytics & Visualisations
- ✅ **Dashboard temps réel** : KPIs, tendances, top élections, timeline activité
- ✅ **10+ statistiques** : Participation, conversion, temps moyen, heure pointe, distribution horaire
- ✅ **Graphiques avancés** : BarChart, PieChart, AreaChart, LineChart (Recharts)
- ✅ **Export multi-formats** : PDF (avec graphiques), Excel, CSV, JSON

### 🎨 UX & Design
- ✅ **Responsive complet** : Mobile menu, breakpoints adaptatifs, hooks personnalisés
- ✅ **Dark Mode** : 3 modes (Light/Dark/System) avec persistance
- ✅ **Design ultra-moderne** : Animations, shimmer, scrollbar macOS-like
- ✅ **Notifications** : Push Web (Service Worker) + Toast (Sonner)

### 🔗 Intégrations
- ✅ **Webhooks multi-plateformes** : Teams (Adaptive Cards), Slack (Block Kit), Zoom
- ✅ **Stripe** : Plans Free/Starter/Pro avec paiements et abonnements
- ✅ **Procurations** : Système complet de délégation de vote
- ✅ **Emails** : Invitations, notifications, 2FA (Resend)

**Voir le récapitulatif complet** : [RECAP_COMPLET_FONCTIONNALITES.md](./docs/RECAP_COMPLET_FONCTIONNALITES.md)

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Ce fichier - Vue d'ensemble et installation |
| [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md) | Guide complet administrateur + électeur (80+ pages) |
| [PROJET_COMPLET.md](./PROJET_COMPLET.md) | Récapitulatif technique du projet |
| [DEPLOIEMENT_MIGRATIONS.md](./DEPLOIEMENT_MIGRATIONS.md) | Déploiement des migrations Supabase |
| [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) | Déploiement sur Vercel (production) |
| [FONCTIONNALITES_AVANCEES.md](./FONCTIONNALITES_AVANCEES.md) | Guide des fonctionnalités avancées (2FA, exports, rate limiting) |
| [docs/PHASE_4D_COMPLETE.md](./docs/PHASE_4D_COMPLETE.md) | Documentation technique Phase 4D |
| [docs/PHASE_4D_INTEGRATION.md](./docs/PHASE_4D_INTEGRATION.md) | Guide d'intégration Phase 4D |
| [supabase/migrations/README_PHASE_4D.md](./supabase/migrations/README_PHASE_4D.md) | Guide migration Supabase Phase 4D |
| [supabase/migrations/TROUBLESHOOTING_PHASE_4D.md](./supabase/migrations/TROUBLESHOOTING_PHASE_4D.md) | Dépannage migration Phase 4D |

---

## ✨ Fonctionnalités Principales

### 🔐 Sécurité de Classe Entreprise
- **Chiffrement AES-256-GCM** pour votes secrets
- **Hash SHA-256** pour vérification des votes
- **Row Level Security (RLS)** sur toutes les tables (29+ policies)
- **2FA (TOTP)** avec Google Authenticator
  - QR codes pour activation facile
  - 10 codes de secours
  - Protection brute force
- **Protection CSRF** complète avec tokens (@edge-csrf/nextjs)
- **Rate Limiting** multi-niveaux avec Upstash Redis
  - Login : 5 tentatives/heure
  - Vote : 10 requêtes/minute
  - API : 100 requêtes/minute
  - 2FA : 10 tentatives/5 minutes
- **Protection anti-double vote** avec fonction SQL atomique
- **Gestion sessions** : Expiration automatique et refresh tokens
- **Messages d'erreur catégorisés** : 8 catégories (AUTH, ELECTIONS, VOTERS, VOTING, QUORUM, SERVER, FILE, EMAIL)
- **Tokens cryptographiques** (32 bytes random)
- **Headers HTTP sécurisés** (CSP, X-Frame-Options, etc.)
- **Audit trail immutable** avec chaîne de hash
- **Optimisations anti N+1 queries** pour performance et sécurité

### 🗳️ Gestion des Élections
- **CRUD complet** : Créer, Lire, Modifier, Supprimer (avec soft delete)
- **Édition complète** : Modification des élections en mode draft
- **Recherche et filtrage** : Par statut, date, type de vote, texte
- **4 types de votes** :
  - Simple (1 choix)
  - Approbation (plusieurs choix)
  - Classé (ranking)
  - Liste (multi-sièges)
- **Configuration du quorum** (pourcentage, absolu, pondéré)
- **Paramètres avancés** : vote secret, pondéré, abstention
- **5 statuts** : draft, scheduled, active, closed, archived
- **Planification** avec dates de début/fin automatiques
- **Templates d'élections** : Réutilisation de configurations
- **Calendrier interactif** : Vue agenda avec FullCalendar

### 👥 Gestion des Électeurs
- **Ajout manuel** via formulaire
- **Import CSV en masse** avec validation ligne par ligne
- **Export CSV/Excel** de la liste des électeurs
- **Invitations email** automatiques avec liens uniques
- **QR Code d'inscription** pour accès rapide aux élections publiques
- **Pagination intelligente** : Gestion de 1000+ électeurs sans lag
- **Suivi complet** :
  - Invitation envoyée/ouverte/cliquée
  - Participation (a voté / non voté)
  - Timestamp du vote
  - Temps moyen de réponse
- **Votes pondérés** (multiplicateur par électeur)
- **Statistiques temps réel** avec graphiques de distribution

### 🎯 Interface de Vote
- **Accès sécurisé** par token unique (32 bytes)
- **Validation multi-niveaux** :
  - Token valide
  - Élection active
  - Pas de double vote
  - Respect du type de vote
- **Chiffrement côté serveur** avant stockage
- **Hash de vérification** remis à l'électeur
- **UI responsive** adaptée mobile/desktop
- **Écrans de confirmation** clairs

### 📊 Résultats et Visualisations
- **Calcul automatique** avec déchiffrement sécurisé
- **Visualisations multiples** :
  - 🏆 Podium animé (top 3)
  - 📊 Graphiques en barres interactifs (Recharts)
  - 🥧 Graphiques circulaires avec dégradés
  - 📋 Tableau détaillé avec badges et progress bars
  - 📈 AreaChart d'évolution de la participation
  - 📉 LineChart de distribution horaire des votes
- **Vérification du quorum** automatique à la fermeture
- **Export professionnel** :
  - **PDF** avec graphiques et mise en page pro (jsPDF + html2canvas)
  - **CSV** avec métadonnées complètes
  - **Excel** (XLSX) avec styles et formules
  - **JSON** pour intégrations API
- **Statistiques détaillées** :
  - Total électeurs/votes
  - Taux de participation en temps réel
  - Taux de conversion (emails → votes)
  - Temps moyen de vote
  - Heure de pointe d'activité
  - Distribution horaire
  - Engagement (ouverture, clics)
  - Abstentions
  - Votes blancs (si applicable)
- **Caching intelligent** : Résultats des élections closes mis en cache pour performance optimale

### ♿ Accessibilité & UX

- **WCAG 2.1 AA compliant** :
  - Contrastes de couleurs optimisés
  - Navigation clavier complète
  - ARIA labels et roles
  - Skip links pour navigation rapide
  - Support lecteurs d'écran
- **Auto-save formulaires** :
  - Sauvegarde automatique localStorage
  - Debounce 300ms
  - Récupération après crash navigateur
  - Indicateur visuel de sauvegarde
- **OAuth Social Login** :
  - Connexion avec Google
  - Connexion avec Outlook/Azure
  - Réduction friction inscription
- **Design ultra-moderne** :
  - Animations fluides (cubic-bezier)
  - Effets hover avancés
  - Boutons avec effet shimmer
  - Scrollbar personnalisée macOS-like
  - Progress bars animées
- **Date et heure** affichées en temps réel dans le dashboard

### 🎨 Phase 4D - Fonctionnalités Avancées (Nouveau !)
- **📱 Responsive Design** :
  - Menu mobile hamburger avec overlay
  - Breakpoints adaptatifs (mobile/tablet/desktop)
  - Hooks personnalisés `useMediaQuery`
  - Navigation optimisée pour petits écrans
- **📊 Analytics Avancées** :
  - Dashboard KPIs en temps réel
  - Tendances avec comparaison période précédente
  - Top 5 élections par votes
  - Timeline d'activité récente
  - Graphiques de participation
- **🌙 Mode Sombre Complet** :
  - Toggle accessible dans header
  - Configuration détaillée dans settings
  - 3 modes : Light, Dark, System
  - Persistance localStorage
  - Compatible SSR (Next.js)
- **🔔 Notifications Push Web** :
  - Web Push API avec Service Worker
  - Subscription/Unsubscription utilisateur
  - Événements : élection démarrée, clôture proche, résultats publiés
  - Compatible Chrome, Firefox, Edge
  - VAPID keys sécurisées
- **📄 Export PDF Avancé** :
  - Génération professionnelle avec jsPDF
  - Inclusion des graphiques (html2canvas)
  - Métadonnées complètes
  - Tables formatées (autotable)
  - Multi-pages automatique
- **🔗 Webhooks Multi-Plateformes** :
  - **Microsoft Teams** : Adaptive Cards v1.4
  - **Slack** : Block Kit format
  - **Zoom** : Chat messages
  - Formatters automatiques par événement
  - Support Discord (à venir)

---

## 🚀 Installation Rapide

### Prérequis

- **Node.js** 18 ou supérieur
- **Compte Supabase** (gratuit : https://supabase.com)
- **Compte Resend** pour emails (gratuit : https://resend.com)
- **Compte Upstash** pour rate limiting (optionnel, gratuit : https://upstash.com)

### 1. Cloner et Installer

```bash
git clone <votre-repo>
cd e-voting-platforme
npm install --legacy-peer-deps
```

### 2. Configuration des Variables d'Environnement

Créez `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Encryption (générer avec commande ci-dessous)
ENCRYPTION_KEY=<64 caractères hex>

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@votredomain.com

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Rate Limiting (optionnel)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Phase 4D - Push Notifications (optionnel)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<votre_clé_publique_vapid>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Générer la clé de chiffrement** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Générer les VAPID keys (pour push notifications)** :
```bash
npx web-push generate-vapid-keys
```

### 3. Déployer les Migrations Supabase

Consultez [DEPLOIEMENT_MIGRATIONS.md](./DEPLOIEMENT_MIGRATIONS.md) pour le guide complet.

**Option rapide** : Via l'interface Supabase (SQL Editor), exécutez dans l'ordre :
1. [20250114000000_initial_schema.sql](./supabase/migrations/20250114000000_initial_schema.sql)
2. [20250114000001_rls_policies.sql](./supabase/migrations/20250114000001_rls_policies.sql)
3. [20250114000002_indexes.sql](./supabase/migrations/20250114000002_indexes.sql)
4. [20250114000003_functions.sql](./supabase/migrations/20250114000003_functions.sql)
5. [20250114000004_triggers.sql](./supabase/migrations/20250114000004_triggers.sql)
6. [20250118_phase_4d_push_notifications_simple.sql](./supabase/migrations/20250118_phase_4d_push_notifications_simple.sql) ⭐ **Nouveau**

Pour Phase 4D, consultez le guide détaillé : [README_PHASE_4D.md](./supabase/migrations/README_PHASE_4D.md)

### 4. Démarrer le Serveur

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📁 Structure du Projet

```
e-voting-platforme/
├── app/
│   ├── (auth)/              # Authentification (login, register)
│   ├── (dashboard)/         # Dashboard protégé
│   │   ├── dashboard/       # Page d'accueil
│   │   ├── elections/       # CRUD élections
│   │   └── settings/        # Paramètres (2FA, profil)
│   ├── (public)/            # Pages publiques
│   │   └── vote/[token]/    # Interface de vote
│   └── api/                 # API Routes
│       └── votes/cast/      # Endpoint de vote
├── components/
│   ├── ui/                  # Composants UI de base (shadcn/ui)
│   ├── elections/           # Composants élections
│   ├── voters/              # Composants électeurs
│   ├── vote/                # Interface de vote
│   ├── results/             # Visualisations résultats
│   ├── settings/            # Paramètres (2FA setup)
│   └── layout/              # Layout (sidebar, header)
├── lib/
│   ├── actions/             # Server Actions (auth, elections, voters, 2FA)
│   ├── supabase/            # Clients Supabase (client, server, admin, middleware)
│   ├── services/            # Services métier (encryption, email, results, exports, 2FA, rate limit)
│   ├── validations/         # Schémas Zod
│   └── utils/               # Utilitaires
├── supabase/
│   └── migrations/          # 5 fichiers SQL
├── types/                   # Types TypeScript
├── public/                  # Assets statiques
└── Documentation complète (7 fichiers .md)
```

---

## 🛠️ Technologies Utilisées

| Catégorie | Technologie | Version | Usage |
|-----------|-------------|---------|-------|
| **Framework** | Next.js | 15.0.3 | App Router, Server Components, Server Actions |
| **Langage** | TypeScript | 5.3.3 | 100% strict mode |
| **Base de données** | PostgreSQL | Latest | Via Supabase |
| **Backend** | Supabase | 2.39.0 | Database, Auth, Storage, Realtime |
| **Authentification** | Supabase Auth | - | JWT + 2FA TOTP |
| **Validation** | Zod | 3.22.4 | Runtime + compile-time |
| **Styling** | Tailwind CSS | 3.4.0 | v4 ready |
| **UI Components** | shadcn/ui | Latest | Radix UI primitives |
| **Graphiques** | Recharts | 2.12.0 | Bar charts, responsive |
| **Email** | Resend | 3.2.0 | Templates HTML professionnels |
| **Chiffrement** | Node.js crypto | Built-in | AES-256-GCM, SHA-256, PBKDF2 |
| **2FA** | OTPAuth | 9.2.2 | TOTP generation/verification |
| **QR Codes** | qrcode | 1.5.3 | QR code generation |
| **Rate Limiting** | @upstash/ratelimit | 1.0.0 | Sliding window algorithm |
| **Redis** | @upstash/redis | 1.28.0 | Serverless Redis |
| **Export PDF** | jsPDF | 2.5.1 | PDF generation |
| **PDF Tables** | jspdf-autotable | 3.8.2 | Tables dans PDF |
| **Screenshot** | html2canvas | 1.4.1 | Capture de graphiques |
| **CSV Parsing** | papaparse | 5.4.1 | Import CSV |
| **Dates** | date-fns | 3.6.0 | Formatting et localization |
| **Theming** | next-themes | 0.4.6 | Dark mode avec persistance |
| **Calendar** | FullCalendar | 6.1.19 | Calendrier interactif |
| **Excel Export** | xlsx | 0.18.5 | Export format Excel |

---

## 📊 Statistiques du Projet

### Code
- **Lignes de code** : ~20,000+
- **Fichiers TypeScript** : 95+
- **Composants React** : 58+
- **Server Actions** : 25+
- **API Routes** : 4
- **Services** : 15+
- **Hooks personnalisés** : 7+
- **Fichiers de documentation** : 15+

### Base de Données
- **Tables** : 10 (dont `push_subscriptions`)
- **Migrations SQL** : 6 fichiers
- **RLS Policies** : 29+
- **Indexes** : 27+
- **Fonctions SQL** : 7
- **Triggers** : 4

### Documentation
- **Fichiers Markdown** : 11
- **Pages documentation** : 250+
- **Guides utilisateur** : 2
- **Guides technique** : 5
- **Guides déploiement** : 2
- **Guides Phase 4D** : 4

---

## 🔒 Sécurité

### Checklist de Sécurité

- ✅ **Chiffrement des votes** : AES-256-GCM avec IV uniques
- ✅ **Hash de vérification** : SHA-256
- ✅ **Row Level Security** : Activé sur toutes les tables
- ✅ **2FA** : TOTP avec backup codes
- ✅ **Rate Limiting** : 4 niveaux (login, vote, API, 2FA)
- ✅ **Protection CSRF** : Server Actions de Next.js
- ✅ **Protection SQL Injection** : Supabase + Zod
- ✅ **Protection XSS** : React escape automatique
- ✅ **Headers HTTP sécurisés** : CSP, X-Frame-Options, etc.
- ✅ **Tokens cryptographiques** : 32 bytes random
- ✅ **Function atomique anti-race** : Pour double vote
- ✅ **Audit trail** : Logs immutables avec hash chain
- ✅ **HTTPS forcé** : Sur Vercel
- ✅ **Secrets** : Jamais en code, uniquement env vars

### Encryption Details

**Votes Secrets** :
- Algorithme : AES-256-GCM
- IV : 16 bytes random par vote
- Auth Tag : Vérification d'intégrité
- Dérivation de clé : PBKDF2 avec salt par élection

**Stockage** :
```json
{
  "encrypted_vote": "hex_string",
  "iv": "16_bytes_hex",
  "auth_tag": "16_bytes_hex",
  "vote_hash": "sha256_hash"
}
```

---

## 📖 Guide d'Utilisation

### Pour les Administrateurs

1. **Créer un compte** : `/register`
2. **Se connecter** : `/login`
3. **Activer le 2FA** : `/settings/security` (recommandé)
4. **Créer une élection** :
   - Dashboard > "Créer une élection"
   - Remplir le formulaire
   - Choisir le type de vote
   - Configurer le quorum
5. **Ajouter des candidats** :
   - Page élection > "Ajouter un candidat"
   - Nom, description, photo (optionnel)
6. **Ajouter des électeurs** :
   - "Gérer les électeurs"
   - Ajout manuel OU
   - Import CSV (email,name,weight)
7. **Envoyer les invitations** :
   - "Envoyer les invitations"
   - Emails automatiques avec liens uniques
8. **Activer l'élection** :
   - Statut > "Active"
   - Les votes sont maintenant ouverts
9. **Suivre le vote en temps réel** :
   - Dashboard : statistiques
   - Page élection : liste des électeurs
10. **Fermer et consulter les résultats** :
    - Statut > "Closed"
    - "Voir les résultats"
    - Export PDF/CSV

### Pour les Électeurs

1. Recevoir l'email d'invitation
2. Cliquer sur le lien unique
3. Page de vote affichée :
   - Informations sur l'élection
   - Liste des candidats
4. Sélectionner choix selon le type :
   - Simple : 1 candidat
   - Approbation : plusieurs candidats
   - Classé : ordonner par préférence
5. Confirmer le vote
6. Écran de succès avec **hash de vérification**
7. Conserver le hash (preuve de vote)

---

## 🚀 Déploiement en Production

### Vercel (Recommandé)

Consultez le guide complet : [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md)

**Étapes rapides** :
1. Push sur GitHub
2. Importer dans Vercel
3. Configurer toutes les variables d'environnement
4. Build automatique
5. Déploiement en quelques minutes

**URL exemple** : `https://e-voting-platforme.vercel.app`

### Variables d'Environnement Production

| Variable | Description | Requis |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | ✅ Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase | ✅ Oui |
| `ENCRYPTION_KEY` | Clé AES-256 (64 hex) | ✅ Oui |
| `RESEND_API_KEY` | Clé API Resend | ✅ Oui |
| `EMAIL_FROM` | Email expéditeur | ✅ Oui |
| `NEXT_PUBLIC_SITE_URL` | URL du site | ✅ Oui |
| `UPSTASH_REDIS_REST_URL` | URL Upstash Redis | ⚠️ Recommandé |
| `UPSTASH_REDIS_REST_TOKEN` | Token Upstash | ⚠️ Recommandé |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID (push) | 🔵 Optionnel |
| `NEXT_PUBLIC_APP_URL` | URL app (push) | 🔵 Optionnel |

---

## 🆘 Support et Dépannage

### Problèmes Courants

**Erreur : "Your project's URL and Key are required"**
- Vérifier `.env.local` existe
- Vérifier `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redémarrer le serveur

**Erreur : "ENCRYPTION_KEY must be 64 hex characters"**
- Générer une nouvelle clé : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Copier les 64 caractères

**Les emails ne partent pas**
- Vérifier `RESEND_API_KEY`
- Vérifier domaine vérifié dans Resend
- Vérifier `EMAIL_FROM` correspond au domaine

**Build échoue sur Vercel**
- Aller dans Settings > Build & Development Settings
- Install Command : `npm install --legacy-peer-deps`
- Redéployer

### Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [Issues GitHub](https://github.com/votre-repo/issues)

---

## 🗺️ Roadmap

### ✅ Phase 3 - Performance & UX (Complétée)
- ✅ **Fix N+1 Queries** : Optimisation SQL avec relations
- ✅ **Pagination électeurs** : Gestion de 1000+ électeurs
- ✅ **Gestion sessions** : Expiration et refresh automatiques
- ✅ **Édition élections** : Modification complète en mode draft
- ✅ **Recherche/Filtrage** : Élections par statut, date, type
- ✅ **Date/Heure Dashboard** : Affichage temps réel
- ✅ **Analytics temps réel** : Graphiques interactifs Recharts
- ✅ **Notifications système** : Toast avec Sonner
- ✅ **Inscription QR Code** : Accès rapide pour électeurs
- ✅ **Application quorums** : Validation automatique fermeture

### ✅ Phase 4A-4C - Sécurité & Polish (Complétées)
- ✅ **Protection CSRF** : Tokens @edge-csrf/nextjs
- ✅ **Rate Limiting** : Multi-niveaux avec Upstash
- ✅ **Messages d'erreur** : 8 catégories spécifiques
- ✅ **Suppression élections** : Soft delete avec archivage
- ✅ **Audit logging** : Traçabilité complète
- ✅ **OAuth Social** : Google et Azure (Outlook)
- ✅ **Auto-save formulaires** : localStorage + debounce
- ✅ **Import/Export CSV** : Électeurs en masse
- ✅ **Accessibilité WCAG 2.1 AA** : Navigation, contrastes, ARIA
- ✅ **Optimistic UI** : Feedback instantané
- ✅ **Caching résultats** : Performance optimale
- ✅ **Templates élections** : Réutilisation configurations

### ✅ Phase 4D - Avancé (Complétée)
- ✅ **Dark Mode** : Thème sombre avec next-themes
- ✅ **Notifications Push** : Web Push API
- ✅ **Export avancé** : PDF, Excel, JSON, CSV
- ✅ **Analytics avancées** : Dashboard KPIs + tendances
- ✅ **Webhooks** : Teams, Slack, Zoom
- ✅ **Responsive Design** : Mobile menu + breakpoints

### 🔜 Phase 5 - Extensions (Optionnel)
- ✅ **Stripe Integration** : Plans Free/Starter/Pro (déjà implémenté dans NOUVELLES_1.md)
- ✅ **Procurations** : Système de délégation de vote (déjà implémenté dans NOUVELLES_1.md)
- [ ] **Internationalisation (i18n)** : Multi-langues (FR, EN, ES)
- [ ] **Tests automatisés** : Jest (unit), Playwright (E2E)
- [ ] **Monitoring** : Sentry pour error tracking
- [ ] **Analytics Web** : Plausible ou Umami
- [ ] **API publique REST** : Pour intégrations tierces
- [ ] **SDK JavaScript** : Client library
- [ ] **Mobile App** : React Native
- [ ] **Blockchain** : Vérification immuable des votes
- [ ] **Biométrie** : Authentification par empreinte/face ID

---

## 📝 Licence

Ce projet est développé comme plateforme SaaS de vote électronique sécurisée.

---

## 👨‍💻 Développé avec

- ❤️ Passion pour la sécurité et la démocratie numérique
- ☕ Beaucoup de café
- 🎯 Next.js 15, Supabase et TypeScript
- 🔐 Obsession pour la sécurité

---

**E-Voting Platform** - Vote Électronique Sécurisé de Nouvelle Génération
