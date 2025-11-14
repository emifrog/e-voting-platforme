# Guide de Déploiement sur Vercel

Ce guide détaille le déploiement de la plateforme e-voting sur Vercel avec toutes les configurations nécessaires.

## Prérequis

- Compte Vercel (gratuit : https://vercel.com)
- Compte Supabase configuré avec migrations déployées
- Compte Resend configuré (https://resend.com)
- Clé de chiffrement générée (64 caractères hex)

## Étapes de Déploiement

### 1. Préparer le Projet

#### A. Vérifier le Build Local

Avant de déployer, testez le build en local :

```bash
npm run build
```

Si des erreurs TypeScript apparaissent, corrigez-les avant de continuer.

#### B. Créer un `.gitignore` Approprié

Assurez-vous que `.env.local` est bien ignoré :

```gitignore
# .gitignore
.env*.local
.env.local
.next/
node_modules/
.vercel/
```

### 2. Déploiement via GitHub (Recommandé)

#### A. Pousser sur GitHub

```bash
git add .
git commit -m "Production ready - Plateforme e-voting complète"
git push origin main
```

#### B. Importer dans Vercel

1. Aller sur https://vercel.com/new
2. Cliquer sur "Import Git Repository"
3. Sélectionner votre repository `e-voting-platforme`
4. Cliquer sur "Import"

### 3. Configuration des Variables d'Environnement

Dans le dashboard Vercel, avant de déployer :

#### A. Variables Supabase

Récupérer sur : https://supabase.com/dashboard/project/_/settings/api

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important** :
- `NEXT_PUBLIC_*` sont exposées au client
- `SUPABASE_SERVICE_ROLE_KEY` est secrète (ne JAMAIS exposer)

#### B. Clé de Chiffrement

Générer une nouvelle clé de production :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
ENCRYPTION_KEY=a1b2c3d4e5f6789... (64 caractères hex)
```

**CRITIQUE** : Gardez cette clé en sécurité. Si elle est perdue, les votes chiffrés ne pourront plus être déchiffrés.

#### C. Variables Email (Resend)

Récupérer sur : https://resend.com/api-keys

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@votredomain.com
```

**Important** : Configurez votre domaine dans Resend pour éviter que les emails soient marqués comme spam.

#### D. URL du Site

```env
NEXT_PUBLIC_SITE_URL=https://votre-app.vercel.app
```

Mettez à jour cette valeur après le premier déploiement avec votre URL Vercel définitive.

### 4. Configuration Build & Deploy

#### A. Build Settings (Automatique)

Vercel détecte automatiquement Next.js :

- **Framework Preset** : Next.js
- **Build Command** : `npm run build`
- **Output Directory** : `.next` (auto)
- **Install Command** : `npm install --legacy-peer-deps`

**Important** : Si le build échoue, allez dans Settings > General > Build & Development Settings et modifiez :

**Install Command** :
```bash
npm install --legacy-peer-deps
```

#### B. Node.js Version

Spécifier Node.js 18+ dans `package.json` :

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 5. Déploiement

1. Cliquer sur "Deploy"
2. Attendre la fin du build (~2-3 minutes)
3. Vérifier que le déploiement réussit

### 6. Configuration Post-Déploiement

#### A. Mettre à Jour l'URL du Site

Après le premier déploiement, vous obtenez une URL type : `https://e-voting-platforme.vercel.app`

1. Retourner dans Settings > Environment Variables
2. Modifier `NEXT_PUBLIC_SITE_URL` avec la vraie URL
3. Redéployer (Settings > Deployments > ... > Redeploy)

#### B. Configurer un Domaine Personnalisé (Optionnel)

1. Aller dans Settings > Domains
2. Ajouter votre domaine (ex: `vote.monentreprise.com`)
3. Suivre les instructions DNS
4. Mettre à jour `NEXT_PUBLIC_SITE_URL` et `EMAIL_FROM`

#### C. Configurer Resend avec votre Domaine

1. Aller sur https://resend.com/domains
2. Ajouter votre domaine
3. Configurer les DNS (SPF, DKIM, DMARC)
4. Vérifier le domaine
5. Mettre à jour `EMAIL_FROM` : `noreply@votredomain.com`

### 7. Variables d'Environnement Complètes

Voici le récapitulatif de toutes les variables à configurer dans Vercel :

| Variable | Description | Exemple | Environnement |
|----------|-------------|---------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | `eyJhbGc...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (secrète) | `eyJhbGc...` | Production uniquement |
| `ENCRYPTION_KEY` | Clé AES-256 (64 hex) | `a1b2c3d4...` | Production uniquement |
| `RESEND_API_KEY` | Clé API Resend | `re_xxx...` | Production uniquement |
| `EMAIL_FROM` | Email expéditeur | `noreply@domain.com` | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | URL de l'application | `https://app.vercel.app` | Production, Preview, Development |

#### Comment Ajouter les Variables

1. Aller sur le dashboard Vercel de votre projet
2. Settings > Environment Variables
3. Pour chaque variable :
   - Entrer le **Name**
   - Entrer la **Value**
   - Sélectionner les **Environments** :
     - Production : Production seule
     - Preview : Branches de preview (PR)
     - Development : Local development
   - Cliquer sur "Add"

### 8. Vérification du Déploiement

#### A. Tests de Base

1. **Accéder au site** : Ouvrir l'URL Vercel
2. **Page d'accueil** : Doit rediriger vers `/login`
3. **Créer un compte** : Tester `/register`
4. **Se connecter** : Vérifier `/login`
5. **Dashboard** : Vérifier que les stats s'affichent

#### B. Tests Avancés

```bash
# Tester l'API de vote (avec un token valide)
curl -X POST https://votre-app.vercel.app/api/votes/cast \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_token",
    "candidateIds": ["uuid"]
  }'
```

#### C. Vérifier les Logs

1. Dans Vercel : Deployments > [Dernière version] > View Function Logs
2. Vérifier qu'il n'y a pas d'erreurs critiques

### 9. Supabase : Autoriser le Domaine Vercel

#### A. Configuration CORS (si nécessaire)

1. Aller sur https://supabase.com/dashboard/project/_/settings/api
2. Vérifier "API Settings"
3. Dans "CORS Allowed Origins", ajouter :
   ```
   https://votre-app.vercel.app
   ```

#### B. Autoriser l'URL dans Auth

1. Settings > Authentication > URL Configuration
2. Ajouter dans "Site URL" :
   ```
   https://votre-app.vercel.app
   ```
3. Ajouter dans "Redirect URLs" :
   ```
   https://votre-app.vercel.app/auth/callback
   ```

### 10. Optimisations Production

#### A. Activer les Analytics (Optionnel)

Vercel Analytics gratuit :

```bash
npm install @vercel/analytics
```

Dans `app/layout.tsx` :

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### B. Activer Speed Insights (Optionnel)

```bash
npm install @vercel/speed-insights
```

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next'

<SpeedInsights />
```

### 11. Déploiements Multiples (Staging + Production)

#### A. Créer une Branche Staging

```bash
git checkout -b staging
git push origin staging
```

#### B. Configurer dans Vercel

1. Settings > Git
2. Production Branch : `main`
3. Preview Branches : `staging`, `develop`, etc.

Chaque branche aura son URL :
- `main` → `https://e-voting.vercel.app` (production)
- `staging` → `https://e-voting-git-staging.vercel.app` (preview)

### 12. Surveillance et Monitoring

#### A. Vercel Logs

- **Deployment Logs** : Logs de build
- **Function Logs** : Logs runtime (Server Actions, API Routes)
- **Real-time** : Via CLI `vercel logs`

#### B. Supabase Logs

https://supabase.com/dashboard/project/_/logs

- **Postgres Logs** : Requêtes SQL, erreurs
- **Auth Logs** : Connexions, inscriptions
- **API Logs** : Requêtes API

### 13. Rollback en Cas de Problème

Si un déploiement pose problème :

1. Aller dans Deployments
2. Trouver la version précédente qui fonctionnait
3. Cliquer sur "..." > "Promote to Production"
4. Confirmation → Rollback instantané

### 14. CI/CD Automatique

Avec GitHub, chaque push déclenche automatiquement :

```
main branch → Production
autres branches → Preview Deployments
Pull Requests → Preview avec URL unique
```

### 15. Checklist Finale

Avant de mettre en production :

- [ ] Toutes les migrations Supabase sont déployées
- [ ] Toutes les variables d'environnement sont configurées
- [ ] La clé de chiffrement est sauvegardée en sécurité
- [ ] Le domaine Resend est vérifié
- [ ] Les URLs de redirection Auth sont configurées
- [ ] Le build Vercel réussit sans erreurs
- [ ] Test complet du flux : Register → Login → Create Election → Vote → Results
- [ ] Les emails d'invitation fonctionnent
- [ ] Le chiffrement/déchiffrement des votes fonctionne
- [ ] Les RLS policies sont actives (vérifier dans Supabase)
- [ ] Les logs ne montrent pas d'erreurs critiques

## Commandes Utiles

### Déployer via CLI (Alternative)

```bash
# Installer Vercel CLI
npm install -g vercel

# Login
vercel login

# Premier déploiement
vercel

# Déploiement production
vercel --prod

# Voir les logs en temps réel
vercel logs --follow
```

### Variables d'Environnement via CLI

```bash
# Ajouter une variable
vercel env add ENCRYPTION_KEY production

# Lister les variables
vercel env ls

# Supprimer une variable
vercel env rm ENCRYPTION_KEY production
```

## Dépannage

### Erreur : "Your project's URL and Key are required"

- Vérifier que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont bien définies
- Vérifier qu'elles sont dans l'environnement "Production"
- Redéployer après l'ajout

### Erreur : "ENCRYPTION_KEY must be 64 hex characters"

```bash
# Générer une nouvelle clé
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez le résultat complet (64 caractères).

### Les Emails Ne Partent Pas

1. Vérifier `RESEND_API_KEY` dans Vercel
2. Vérifier que le domaine est vérifié dans Resend
3. Vérifier `EMAIL_FROM` correspond au domaine configuré
4. Consulter les logs Resend : https://resend.com/logs

### Build Échoue sur Vercel

**Erreur de dépendances** :

Settings > Build & Development Settings > Install Command :
```bash
npm install --legacy-peer-deps
```

**Erreur TypeScript** :

Corriger en local, tester `npm run build`, puis push.

**Erreur de mémoire** :

Rarement nécessaire, mais possibilité d'augmenter la mémoire :
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

### Votes Non Déchiffrés

- La clé `ENCRYPTION_KEY` en production doit être identique à celle utilisée lors du chiffrement
- Si vous changez la clé, les anciens votes ne pourront plus être déchiffrés
- **Solution** : Ne jamais changer la clé de production

## Sécurité Production

### Headers de Sécurité

Déjà configurés dans `next.config.js` :

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy`

### HTTPS

Vercel force automatiquement HTTPS. Toutes les requêtes HTTP sont redirigées vers HTTPS.

### Secrets

- **JAMAIS** commit `.env.local` ou `.env.production`
- Utiliser uniquement les variables Vercel
- Sauvegarder `ENCRYPTION_KEY` dans un gestionnaire de mots de passe

## Support

- **Documentation Vercel** : https://vercel.com/docs
- **Documentation Supabase** : https://supabase.com/docs
- **Documentation Next.js** : https://nextjs.org/docs

---

**Votre plateforme e-voting est maintenant en production !** 🎉
