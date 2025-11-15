# 🚀 Guide Rapide - Déploiement Vercel

## ⏱️ Temps estimé : 15-20 minutes

---

## 📋 Checklist Avant de Commencer

Avant de déployer, assurez-vous d'avoir :

- [ ] Compte GitHub avec le repository `e-voting-platforme`
- [ ] Compte Supabase créé
- [ ] Migrations Supabase déployées (voir [DEPLOIEMENT_MIGRATIONS.md](./DEPLOIEMENT_MIGRATIONS.md))
- [ ] Compte Resend créé
- [ ] (Optionnel) Compte Upstash Redis créé

---

## 🎯 Étapes de Déploiement

### **Étape 1 : Se Connecter à Vercel** (2 min)

1. Ouvrir https://vercel.com
2. Cliquer **"Sign Up"** (ou "Log In" si compte existant)
3. Choisir **"Continue with GitHub"**
4. Autoriser Vercel à accéder à vos repositories

---

### **Étape 2 : Importer le Projet** (1 min)

1. Sur le dashboard Vercel, cliquer **"Add New..."** en haut à droite
2. Sélectionner **"Project"**
3. Dans la liste, chercher **`e-voting-platforme`**
4. Cliquer **"Import"** à côté du repository

---

### **Étape 3 : Configuration Build** (2 min)

Sur l'écran de configuration :

#### **A. Configure Project**
- **Framework Preset** : Next.js (détecté automatiquement) ✅
- **Root Directory** : `.` (par défaut) ✅

#### **B. Build and Output Settings**

⚠️ **IMPORTANT** : Modifier le Install Command

1. Cliquer sur **"Build and Output Settings"**
2. Cocher **"Override"** sur **Install Command**
3. Entrer :
   ```bash
   npm install --legacy-peer-deps
   ```

**Screenshot** :
```
Install Command: [npm install --legacy-peer-deps]  ✅ Override checked
Build Command:   [next build]                      (default)
Output Directory: [.next]                          (default)
```

---

### **Étape 4 : Variables d'Environnement** (10 min)

#### **Clé de Chiffrement (Déjà Générée)**

Votre clé de chiffrement unique :
```
ENCRYPTION_KEY = f1cb9f195f5e499720b800b9cbbc72dc9111860a2edc18465a5f931b96d6ede0
```

⚠️ **Sauvegardez cette clé dans un gestionnaire de mots de passe !**

---

#### **Ajouter les Variables une par une**

Sur l'écran de configuration Vercel, section **"Environment Variables"** :

**Format pour chaque variable** :
```
Name:  [NOM_DE_LA_VARIABLE]
Value: [valeur]
Environment: ✅ Production (coché)
```

---

#### **Variables à Ajouter**

##### **1. Supabase (3 variables)**

Aller sur : https://supabase.com/dashboard/project/_/settings/api

| Name | Value | Où trouver |
|------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Project API keys > `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` | Project API keys > `service_role` (⚠️ secret) |

**Screenshot de Supabase** :
```
Project URL: https://xxxxxxxxxxxxxx.supabase.co
API Keys:
  anon (public)    : eyJhbGc... [Reveal] [Copy]  ← NEXT_PUBLIC_SUPABASE_ANON_KEY
  service_role     : eyJhbGc... [Reveal] [Copy]  ← SUPABASE_SERVICE_ROLE_KEY
```

---

##### **2. Encryption (1 variable)**

| Name | Value |
|------|-------|
| `ENCRYPTION_KEY` | `f1cb9f195f5e499720b800b9cbbc72dc9111860a2edc18465a5f931b96d6ede0` |

---

##### **3. Email / Resend (2 variables)**

Aller sur : https://resend.com/api-keys

| Name | Value | Notes |
|------|-------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` | Créer une API key |
| `EMAIL_FROM` | `noreply@votredomain.com` | Votre domaine vérifié |

**Étapes Resend** :
1. Aller sur https://resend.com/domains
2. Cliquer **"Add Domain"**
3. Entrer votre domaine (ex: `votredomain.com`)
4. Ajouter les DNS records (SPF, DKIM)
5. Attendre vérification (~10 min)
6. Utiliser `noreply@votredomain.com` dans `EMAIL_FROM`

💡 **Astuce** : Si pas de domaine, utilisez l'email de test Resend pour débuter.

---

##### **4. Site URL (1 variable)**

| Name | Value | Notes |
|------|-------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://e-voting-platforme.vercel.app` | Temporaire |

⚠️ **Cette valeur sera mise à jour après le déploiement**

---

##### **5. Upstash Redis (Optionnel - 2 variables)**

Aller sur : https://upstash.com

| Name | Value | Où trouver |
|------|-------|------------|
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | Database > REST API > UPSTASH_REDIS_REST_URL |
| `UPSTASH_REDIS_REST_TOKEN` | `AXXXXXxxxxxx==` | Database > REST API > UPSTASH_REDIS_REST_TOKEN |

**Si vous sautez Upstash** :
- Le rate limiting sera désactivé automatiquement
- L'application fonctionnera normalement
- À ajouter plus tard si besoin

---

### **Étape 5 : Déployer** (5 min)

1. **Vérifier** que toutes les variables sont ajoutées :
   ```
   ✅ NEXT_PUBLIC_SUPABASE_URL
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ✅ ENCRYPTION_KEY
   ✅ RESEND_API_KEY
   ✅ EMAIL_FROM
   ✅ NEXT_PUBLIC_SITE_URL
   ```

2. Cliquer sur **"Deploy"** en bas

3. Attendre le build (2-3 minutes)

4. 🎉 **Déploiement réussi !**

---

### **Étape 6 : Post-Déploiement** (3 min)

#### **A. Récupérer l'URL de Production**

Après le déploiement, Vercel affiche :
```
🎉 Your project has been deployed!
https://e-voting-platforme-abc123.vercel.app
```

#### **B. Mettre à Jour NEXT_PUBLIC_SITE_URL**

1. Copier l'URL complète (ex: `https://e-voting-platforme-abc123.vercel.app`)
2. Aller dans **Settings** > **Environment Variables**
3. Trouver `NEXT_PUBLIC_SITE_URL`
4. Cliquer sur **"..."** > **"Edit"**
5. Remplacer par la vraie URL
6. Cliquer **"Save"**
7. **Redéployer** :
   - Aller dans **Deployments**
   - Cliquer **"..."** sur le dernier déploiement
   - **"Redeploy"**

#### **C. Configurer Supabase Auth URLs**

1. Aller sur https://supabase.com/dashboard/project/_/auth/url-configuration
2. **Site URL** : `https://votre-app.vercel.app`
3. **Redirect URLs** : Ajouter `https://votre-app.vercel.app/auth/callback`
4. Cliquer **"Save"**

---

## ✅ Vérification du Déploiement

### **Tests de Base**

1. **Ouvrir l'URL** : `https://votre-app.vercel.app`
2. **Page d'accueil** : Doit rediriger vers `/login`
3. **Créer un compte** : Tester `/register`
4. **Se connecter** : Tester `/login`
5. **Dashboard** : Vérifier que les stats s'affichent
6. **Créer une élection** : Tester le formulaire

### **Vérifier les Logs**

Si problème :

1. Vercel Dashboard > Votre Projet > **"Deployments"**
2. Cliquer sur le déploiement
3. Onglet **"Function Logs"**
4. Chercher les erreurs

---

## 🐛 Dépannage

### **Erreur : "Your project's URL and Key are required"**

**Cause** : Variables Supabase manquantes

**Solution** :
1. Vérifier que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont bien dans Environment Variables
2. Vérifier qu'elles sont dans l'environnement **"Production"**
3. Redéployer

---

### **Build échoue avec erreur npm**

**Cause** : Install command non modifié

**Solution** :
1. Settings > General > Build & Development Settings
2. Install Command : `npm install --legacy-peer-deps`
3. Save
4. Redeploy

---

### **Emails ne partent pas**

**Cause** : Resend mal configuré

**Solution** :
1. Vérifier `RESEND_API_KEY` est correct
2. Vérifier domaine vérifié dans Resend
3. Vérifier `EMAIL_FROM` correspond au domaine
4. Consulter logs Resend : https://resend.com/logs

---

### **Rate Limiting ne fonctionne pas**

**Cause** : Upstash non configuré

**Solution** :
- C'est normal si variables Upstash non ajoutées
- L'app fonctionne sans rate limiting
- Ajouter les variables Upstash et redéployer

---

## 🎯 Prochaines Étapes

Une fois déployé :

1. ✅ **Créer votre premier compte** administrateur
2. ✅ **Activer le 2FA** : `/settings/security`
3. ✅ **Créer une élection test**
4. ✅ **Ajouter des candidats**
5. ✅ **Inviter des électeurs**
6. ✅ **Tester le vote**
7. ✅ **Consulter les résultats**
8. ✅ **Exporter en PDF/CSV**

---

## 📞 Support

**Documentation** :
- [README_FINAL.md](./README_FINAL.md) - Vue d'ensemble
- [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md) - Guide utilisateur complet
- [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) - Guide détaillé

**Ressources** :
- Vercel : https://vercel.com/docs
- Supabase : https://supabase.com/docs
- Next.js : https://nextjs.org/docs

---

## 🎉 Félicitations !

Votre plateforme e-voting est maintenant **EN LIGNE** et **PRÊTE À L'EMPLOI** ! 🗳️✨

---

**Dernière mise à jour** : 15 janvier 2025
