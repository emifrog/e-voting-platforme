# Fonctionnalités Avancées - E-Voting Platform

Ce document récapitule toutes les fonctionnalités avancées implémentées au-delà des fonctionnalités de base.

## 1. Export des Résultats 📊

### Export PDF avec Graphiques

**Fonctionnalités** :
- Export PDF complet avec visualisations
- Capture automatique des graphiques (recharts)
- Métadonnées complètes de l'élection
- Statistiques de participation
- Tableau détaillé des résultats
- Pagination automatique
- Timestamp et numéros de page

**Utilisation** :
```typescript
import { exportResultsToPDF } from '@/lib/services/export-pdf'

await exportResultsToPDF(results, {
  includeGraphs: true,
  includeMetadata: true,
  includeStats: true,
  includeTimestamp: true,
  orientation: 'portrait'
})
```

**Dépendances** :
- `jspdf` - Génération PDF
- `jspdf-autotable` - Tableaux dans PDF
- `html2canvas` - Capture des graphiques

**Fichiers** :
- [lib/services/export-pdf.ts](./lib/services/export-pdf.ts)
- [components/results/export-buttons.tsx](./components/results/export-buttons.tsx)

### Export CSV

**Fonctionnalités** :
- Export CSV avec métadonnées
- Statistiques de participation
- Résultats détaillés par candidat
- Support UTF-8 avec BOM
- Téléchargement automatique

**Utilisation** :
```typescript
import { exportResultsToCSV } from '@/lib/services/export-csv'

exportResultsToCSV(results, {
  includeMetadata: true,
  includePercentages: true,
  includeStats: true
})
```

**Format CSV** :
```csv
"Élection","Nom de l'élection"
"Type de vote","Vote simple (1 choix)"
...
"Position","Candidat","Voix","Pourcentage","Statut"
"1","Alice","150","60.00%","Gagnant"
"2","Bob","100","40.00%",""
```

**Fichiers** :
- [lib/services/export-csv.ts](./lib/services/export-csv.ts)

## 2. Authentification à Deux Facteurs (2FA) 🔐

### TOTP (Time-based One-Time Password)

**Fonctionnalités** :
- Génération de secrets TOTP sécurisés
- QR codes pour scan facile (Google Authenticator, Authy, etc.)
- Codes à 6 chiffres avec rotation de 30 secondes
- Fenêtre de tolérance (±30s)
- Codes de secours (backup codes)
- Régénération des codes de secours
- Activation/désactivation sécurisée

**Workflow d'activation** :
1. Utilisateur initie l'activation
2. Génération du secret + QR code + 10 codes de secours
3. Scan du QR code dans l'app d'authentification
4. Vérification avec code à 6 chiffres
5. Sauvegarde des codes de secours
6. Activation confirmée

**Codes de Secours** :
- Format : `XXXX-XXXX-XX` (ex: `A1B2-C3D4-E5`)
- 10 codes par défaut
- Hash SHA-256 pour stockage sécurisé
- Usage unique par code
- Téléchargement en fichier texte

**Utilisation** :
```typescript
// Initialiser le 2FA
const { secret, qrCode, backupCodes } = await initiate2FA()

// Activer après vérification
await enable2FA(userCode)

// Désactiver
await disable2FA(userCode)

// Vérifier au login
await verify2FALogin(userId, code, isBackupCode)
```

**Stockage Base de Données** :
```sql
-- Colonnes dans profiles
two_factor_enabled BOOLEAN DEFAULT false
two_factor_secret TEXT
two_factor_backup_codes TEXT[]
```

**Dépendances** :
- `otpauth` - Génération et vérification TOTP
- `qrcode` - Génération de QR codes

**Fichiers** :
- [lib/services/two-factor.ts](./lib/services/two-factor.ts)
- [lib/actions/two-factor.ts](./lib/actions/two-factor.ts)
- [components/settings/two-factor-setup.tsx](./components/settings/two-factor-setup.tsx)
- [app/(dashboard)/settings/security/page.tsx](./app/(dashboard)/settings/security/page.tsx)

**Page d'accès** :
- `/settings/security` - Configuration du 2FA

## 3. Rate Limiting 🛡️

### Upstash Redis Rate Limiting

**Stratégies Implémentées** :

#### 1. Login Rate Limiting
- **Limite** : 5 tentatives par heure
- **Par** : Adresse IP
- **Protection contre** : Brute force sur les mots de passe

#### 2. Vote Rate Limiting
- **Limite** : 10 votes par minute
- **Par** : Adresse IP
- **Protection contre** : Spam de votes, attaques DoS

#### 3. API Rate Limiting
- **Limite** : 100 requêtes par minute
- **Par** : Adresse IP
- **Protection contre** : Abus de l'API

#### 4. 2FA Rate Limiting
- **Limite** : 10 tentatives en 5 minutes
- **Par** : Adresse IP
- **Protection contre** : Brute force sur codes 2FA

**Algorithme** : Sliding Window (fenêtre glissante)

**Headers de Réponse** :
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-01-14T15:30:00.000Z
```

**Réponse Rate Limit Atteint** (429) :
```json
{
  "error": "Too many requests",
  "message": "Trop de tentatives. Veuillez réessayer dans quelques instants.",
  "retryAfter": 45
}
```

**Configuration** :

Variables d'environnement requises :
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Utilisation** :

```typescript
// Dans une API Route
import { applyRateLimit } from '@/lib/utils/rate-limit-middleware'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, 'vote')
  if (rateLimitResponse) {
    return rateLimitResponse // 429 Too Many Requests
  }

  // Continuer le traitement
}
```

**Fonctions Utilitaires** :
```typescript
// Vérifier le rate limit
const { success, remaining, reset } = await checkLoginRateLimit(ip)

// Réinitialiser le compteur
await resetRateLimit('ratelimit:login', ip)

// Obtenir les infos
const info = await getRateLimitInfo('ratelimit:login', ip)
```

**Dépendances** :
- `@upstash/ratelimit` - Bibliothèque de rate limiting
- `@upstash/redis` - Client Redis

**Fichiers** :
- [lib/services/rate-limit.ts](./lib/services/rate-limit.ts)
- [lib/utils/rate-limit-middleware.ts](./lib/utils/rate-limit-middleware.ts)
- [app/api/votes/cast/route.ts](./app/api/votes/cast/route.ts) (exemple d'utilisation)

**Mode Dégradé** :
Si Upstash n'est pas configuré, le rate limiting est désactivé automatiquement (mode permissif).

## 4. Configuration Upstash Redis

### Création du Compte Upstash

1. Aller sur https://upstash.com
2. Créer un compte (gratuit)
3. Créer une base Redis :
   - Type : **Regional** (pour latence faible)
   - Region : Choisir la plus proche de vos utilisateurs
   - TLS activé : Oui

### Récupération des Credentials

Dashboard > Database > REST API :
```
UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXXXXXXXXXxx==
```

### Ajout dans Vercel

Settings > Environment Variables :
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Redéployer après ajout des variables.

### Limites du Plan Gratuit Upstash

- **Requêtes** : 10,000 par jour
- **Stockage** : 256 MB
- **Commandes par seconde** : Illimité
- **Largement suffisant** pour une application moyenne

## 5. Déploiement Vercel 🚀

### Guide Complet

Consultez [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) pour le guide détaillé.

**Étapes Rapides** :
1. Push sur GitHub
2. Importer dans Vercel
3. Configurer les variables d'environnement
4. Déployer

**Variables d'Environnement Production** :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Encryption
ENCRYPTION_KEY=<64 hex chars>

# Email
RESEND_API_KEY=re_xxx...
EMAIL_FROM=noreply@votredomain.com

# Site
NEXT_PUBLIC_SITE_URL=https://votre-app.vercel.app

# Upstash Redis (optionnel mais recommandé)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

## 6. Fonctionnalités à Venir 🚧

Les fonctionnalités suivantes sont préparées (schémas DB prêts) mais non implémentées :

### Stripe Integration
- Plans : Free (3 élections), Starter (10), Pro (illimité)
- Checkout et webhooks
- Gestion des abonnements

### Système de Procurations
- Table `proxies` créée
- Workflow de délégation
- Notifications email

### Webhooks
- Table `webhooks` créée
- Dispatcher d'événements
- Test endpoint

### Dark Mode
- Infrastructure prête avec Tailwind
- Installation de `next-themes`
- Toggle UI

## 7. Statistiques du Projet

### Code
- **TypeScript** : 100% strict mode
- **Lignes de code** : ~15,000+
- **Composants React** : 40+
- **Server Actions** : 20+
- **API Routes** : 3

### Base de Données
- **Tables** : 9
- **Migrations** : 5 fichiers SQL
- **RLS Policies** : 25+
- **Indexes** : 25+
- **Fonctions SQL** : 5+
- **Triggers** : 3

### Tests de Sécurité
- ✅ Row Level Security activé partout
- ✅ Chiffrement AES-256-GCM
- ✅ Rate limiting multi-niveaux
- ✅ 2FA avec TOTP
- ✅ Protection CSRF via Server Actions
- ✅ Headers de sécurité HTTP
- ✅ Validation Zod sur tous les inputs
- ✅ Protection SQL injection (Supabase)
- ✅ Protection XSS (React escape automatique)

## 8. Performance

### Optimisations Implémentées
- **Server Components** par défaut
- **Indexes** sur toutes les FK et colonnes fréquentes
- **Recharts** avec lazy loading
- **Images** optimisées avec Next.js Image
- **Static Generation** où possible

### Métriques Cibles
- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Lighthouse Score** : > 90

## 9. Monitoring et Logs

### Supabase Logs
- Postgres Logs : Requêtes lentes, erreurs
- Auth Logs : Connexions, inscriptions
- API Logs : Requêtes REST

### Vercel
- Function Logs : Runtime des Server Actions
- Analytics : Trafic, géolocalisation
- Speed Insights : Core Web Vitals

## 10. Maintenance

### Backups
- **Supabase** : Backup automatique quotidien (plan payant)
- **Code** : GitHub
- **Clé de chiffrement** : À sauvegarder manuellement (CRITIQUE)

### Mises à Jour
```bash
# Dépendances
npm update

# Vérifier les vulnérabilités
npm audit

# Next.js
npm install next@latest

# React
npm install react@latest react-dom@latest
```

## Support

Pour toute question sur les fonctionnalités avancées :
1. Consulter ce document
2. Vérifier [README.md](./README.md)
3. Consulter [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md)

---

**Projet développé avec Next.js 15, Supabase, TypeScript et ❤️**
