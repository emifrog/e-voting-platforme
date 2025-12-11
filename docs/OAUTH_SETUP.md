# 🔐 Configuration OAuth - Google & Azure (Outlook)

Guide pour configurer l'authentification OAuth avec Google et Microsoft (Outlook).

---

## 📋 Prérequis

- Compte Supabase avec projet actif
- Compte Google Cloud Console (pour Google OAuth)
- Compte Microsoft Azure (pour Outlook OAuth)

---

## 🔵 1. Configuration OAuth Google

### Étape 1 : Créer les identifiants Google

1. **Allez sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Créez un nouveau projet** ou sélectionnez un projet existant
3. **Activez Google+ API** :
   - Menu → "APIs & Services" → "Library"
   - Cherchez "Google+ API"
   - Cliquez "Enable"

4. **Créez des identifiants OAuth 2.0** :
   - Menu → "APIs & Services" → "Credentials"
   - Cliquez "Create Credentials" → "OAuth client ID"
   - Type d'application : **Web application**
   - Nom : `E-Voting Platform`

5. **Configurez les URI de redirection** :
   ```
   https://<votre-projet>.supabase.co/auth/v1/callback
   ```

   Exemple :
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```

6. **Notez vos identifiants** :
   - Client ID : `123456789-abc.apps.googleusercontent.com`
   - Client Secret : `GOCSPX-xxxxxxxxxxxxx`

### Étape 2 : Configurer dans Supabase

1. **Allez sur votre Dashboard Supabase**
2. **Authentication** → **Providers**
3. **Activez Google** :
   - Toggle "Google Enabled" → ON
   - Client ID : Collez votre Client ID Google
   - Client Secret : Collez votre Client Secret Google
   - Cliquez "Save"

### Étape 3 : Configurer l'écran de consentement (optionnel)

1. **Google Cloud Console** → "OAuth consent screen"
2. **Type d'utilisateur** : External (ou Internal si Google Workspace)
3. **Informations de l'application** :
   - Nom : `E-Voting Platform`
   - Email d'assistance : Votre email
   - Logo : Upload logo (optionnel)
4. **Scopes** : Ajouter les scopes suivants
   - `userinfo.email`
   - `userinfo.profile`
5. **Utilisateurs de test** : Ajoutez des emails pour tester (mode Development)

---

## 🔵 2. Configuration OAuth Azure (Outlook)

### Étape 1 : Créer une application Azure AD

1. **Allez sur** [Azure Portal](https://portal.azure.com/)
2. **Azure Active Directory** → **App registrations** → **New registration**
3. **Configurez l'application** :
   - Name : `E-Voting Platform`
   - Supported account types : **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI :
     - Type : **Web**
     - URI : `https://<votre-projet>.supabase.co/auth/v1/callback`
   - Cliquez "Register"

### Étape 2 : Récupérer les identifiants

1. **Dans votre application Azure** → "Overview"
2. **Notez** :
   - Application (client) ID : `12345678-1234-1234-1234-123456789abc`
   - Directory (tenant) ID : `87654321-4321-4321-4321-cba987654321`

3. **Créez un Client Secret** :
   - Menu → "Certificates & secrets"
   - "New client secret"
   - Description : `E-Voting Supabase`
   - Expires : 24 months (recommandé)
   - Cliquez "Add"
   - **⚠️ IMPORTANT** : Copiez immédiatement la **Value** (pas l'ID). Elle ne sera plus visible après !

### Étape 3 : Configurer les permissions API

1. **API permissions** → **Add a permission**
2. **Microsoft Graph** → **Delegated permissions**
3. **Ajoutez** :
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
4. **Grant admin consent** (si nécessaire)

### Étape 4 : Configurer dans Supabase

1. **Dashboard Supabase** → **Authentication** → **Providers**
2. **Activez Azure** :
   - Toggle "Azure Enabled" → ON
   - Client ID : Collez votre Application (client) ID
   - Client Secret : Collez votre Client Secret Value
   - Azure Tenant : Collez votre Directory (tenant) ID
   - Cliquez "Save"

---

## 🧪 3. Tester l'authentification OAuth

### Test Local (Développement)

Si vous testez en local, ajoutez également l'URI de redirection locale :

```
http://localhost:3000/auth/callback
```

### Code de test

Utilisez les composants créés dans `components/auth/oauth-buttons.tsx` :

```tsx
import { OAuthButtons } from '@/components/auth/oauth-buttons'

<OAuthButtons />
```

---

## 🔒 4. Sécurité

### Variables d'environnement

**NE JAMAIS** commiter les secrets OAuth dans Git. Utilisez `.env.local` :

```env
# Ces valeurs sont déjà dans Supabase, pas besoin de les dupliquer
# Sauf si vous avez besoin de logique custom côté serveur
```

### PKCE (Proof Key for Code Exchange)

Supabase utilise automatiquement PKCE pour OAuth, ce qui améliore la sécurité :
- Pas besoin de stocker le client secret côté client
- Protection contre les attaques d'interception

### Scopes minimaux

Demandez uniquement les permissions nécessaires :
- ✅ `email`, `profile` : Informations basiques
- ❌ `calendar`, `contacts` : Pas nécessaire pour l'authentification

---

## 🐛 5. Dépannage

### Erreur : "Redirect URI mismatch"

**Cause** : L'URI de redirection configurée ne correspond pas.

**Solution** :
1. Vérifiez l'URL exacte dans Supabase Dashboard
2. Copiez-collez (pas de typo, pas d'espace)
3. Google : Doit être en HTTPS (sauf localhost)
4. Azure : Sensible à la casse

### Erreur : "Access blocked: This app's request is invalid"

**Cause** : Écran de consentement Google non configuré.

**Solution** :
1. Google Cloud Console → "OAuth consent screen"
2. Complétez toutes les informations obligatoires
3. Ajoutez votre email dans "Test users" (mode Development)
4. Publiez l'app (mode Production) si vous voulez la rendre publique

### Erreur : "AADSTS50011: The reply URL specified in the request does not match"

**Cause** : URI de redirection Azure incorrecte.

**Solution** :
1. Azure Portal → Votre App → "Authentication"
2. Vérifiez que l'URI est bien en "Web" (pas "SPA")
3. Format exact : `https://xxx.supabase.co/auth/v1/callback`

### Les utilisateurs ne voient pas le bouton OAuth

**Vérifiez** :
1. Le provider est activé dans Supabase Dashboard
2. Les variables d'environnement Supabase sont correctes (`.env.local`)
3. Le composant `OAuthButtons` est bien importé
4. Pas d'erreur dans la console navigateur

---

## 📚 6. Ressources

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [PKCE Standard (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)

---

## ✅ Checklist Configuration

### Google OAuth
- [ ] Projet Google Cloud créé
- [ ] Google+ API activée
- [ ] OAuth Client ID créé (Web application)
- [ ] URI de redirection configurée
- [ ] Client ID et Secret notés
- [ ] Supabase Provider activé
- [ ] Écran de consentement configuré
- [ ] Test réussi avec un utilisateur

### Azure OAuth
- [ ] Application Azure AD créée
- [ ] Redirect URI configurée
- [ ] Client ID et Secret notés
- [ ] API permissions ajoutées
- [ ] Supabase Provider activé
- [ ] Test réussi avec un compte Microsoft

---

**Configuration terminée !** Vos utilisateurs peuvent maintenant se connecter avec Google et Outlook. 🎉
