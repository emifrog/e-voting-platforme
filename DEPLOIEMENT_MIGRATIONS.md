# 🚀 Guide de Déploiement des Migrations Supabase

## Option 1 : Via l'Interface Supabase (Recommandé pour démarrage rapide)

### Étape 1 : Accéder à l'éditeur SQL

1. Connectez-vous sur [https://supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Allez dans **SQL Editor** (menu de gauche)

### Étape 2 : Exécuter les migrations dans l'ordre

Copiez-collez et exécutez chaque fichier SQL dans l'ordre suivant :

#### 1. Schema Initial

Fichier : `supabase/migrations/20250114000000_initial_schema.sql`

```sql
-- Copiez tout le contenu de ce fichier
-- Cliquez sur "Run" pour exécuter
```

✅ Vérification : 9 tables créées (profiles, elections, candidates, voters, votes, proxies, invitations, audit_logs, webhooks)

#### 2. Policies RLS

Fichier : `supabase/migrations/20250114000001_rls_policies.sql`

```sql
-- Copiez tout le contenu de ce fichier
-- Cliquez sur "Run" pour exécuter
```

✅ Vérification : RLS activé sur toutes les tables, policies créées

#### 3. Indexes

Fichier : `supabase/migrations/20250114000002_indexes.sql`

```sql
-- Copiez tout le contenu de ce fichier
-- Cliquez sur "Run" pour exécuter
```

✅ Vérification : ~25 indexes créés pour optimisation

#### 4. Fonctions SQL

Fichier : `supabase/migrations/20250114000003_functions.sql`

```sql
-- Copiez tout le contenu de ce fichier
-- Cliquez sur "Run" pour exécuter
```

✅ Vérification : 4 fonctions créées (handle_new_user, cast_vote_atomic, update_updated_at, calculate_election_results, check_quorum)

#### 5. Triggers

Fichier : `supabase/migrations/20250114000004_triggers.sql`

```sql
-- Copiez tout le contenu de ce fichier
-- Cliquez sur "Run" pour exécuter
```

✅ Vérification : 3 triggers créés

---

## Option 2 : Via Supabase CLI (Pour développeurs avancés)

### Installation de Supabase CLI

**Windows (via Scoop)**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS (via Homebrew)**
```bash
brew install supabase/tap/supabase
```

**Linux**
```bash
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

**Autres méthodes** : https://supabase.com/docs/guides/cli

### Configuration du Projet

1. **Login à Supabase**
```bash
supabase login
```

2. **Initialiser le projet local**
```bash
supabase init
```

3. **Lier au projet cloud**
```bash
supabase link --project-ref your-project-ref
```

Pour trouver votre `project-ref` :
- Allez sur votre dashboard Supabase
- URL format : `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`
- Ou dans **Settings > General > Reference ID**

4. **Pousser les migrations**
```bash
supabase db push
```

Cette commande va :
- Détecter toutes les migrations dans `supabase/migrations/`
- Les exécuter dans l'ordre chronologique
- Créer toutes les tables, policies, indexes, fonctions et triggers

---

## Vérification Post-Déploiement

### 1. Vérifier les tables

Dans **Table Editor** (menu Supabase), vous devriez voir :
- ✅ profiles
- ✅ elections
- ✅ candidates
- ✅ voters
- ✅ votes
- ✅ proxies
- ✅ invitations
- ✅ audit_logs
- ✅ webhooks

### 2. Vérifier RLS

Dans **Authentication > Policies**, chaque table devrait avoir :
- Row Level Security : **Enabled** ✅
- Plusieurs policies configurées

### 3. Vérifier les fonctions

Dans **SQL Editor**, exécutez :
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';
```

Vous devriez voir :
- handle_new_user
- cast_vote_atomic
- update_updated_at
- calculate_election_results
- check_quorum

### 4. Vérifier les triggers

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Vous devriez voir :
- on_auth_user_created (sur auth.users)
- update_profiles_updated_at (sur profiles)
- update_elections_updated_at (sur elections)

---

## Configuration des Variables d'Environnement

Après le déploiement des migrations, configurez `.env.local` :

### 1. Récupérer les credentials Supabase

Allez dans **Settings > API** de votre projet Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

⚠️ **Important** : Ne JAMAIS exposer le `SERVICE_ROLE_KEY` côté client !

### 2. Générer la clé de chiffrement

**Windows (PowerShell)**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Linux/macOS**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez le résultat (64 caractères hex) dans :
```env
ENCRYPTION_KEY=votre_cle_de_64_caracteres
```

### 3. Configurer Resend (Email)

1. Créez un compte sur [https://resend.com](https://resend.com)
2. Créez une API Key
3. Ajoutez à `.env.local` :

```env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@votredomain.com
```

### 4. URL du site

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# En production : https://votredomaine.com
```

---

## Tester la Configuration

### 1. Démarrer le serveur

```bash
npm run dev
```

### 2. Créer un compte

1. Allez sur `http://localhost:3000/register`
2. Créez un compte avec :
   - Nom complet
   - Email
   - Mot de passe (min 8 caractères, avec maj/min/chiffre)

### 3. Vérifier la création automatique du profile

Dans Supabase **Table Editor > profiles**, vous devriez voir :
- Votre nouveau profile créé automatiquement (via trigger)
- ID correspondant à l'utilisateur dans `auth.users`

### 4. Créer une élection de test

1. Cliquez sur "Créer une élection"
2. Remplissez le formulaire
3. Vérifiez dans **Table Editor > elections**

Si tout fonctionne, ✅ **vos migrations sont correctement déployées** !

---

## Troubleshooting

### Erreur : "relation does not exist"
➡️ Les migrations n'ont pas été exécutées. Recommencez depuis l'étape 1.

### Erreur : "permission denied for schema public"
➡️ Problème de permissions. Vérifiez que vous utilisez le bon projet Supabase.

### Erreur : "JWT expired"
➡️ Reconnectez-vous à Supabase CLI : `supabase login`

### Les policies RLS bloquent tout
➡️ Vérifiez que les policies ont bien été créées dans le bon ordre.

### Fonction "cast_vote_atomic" introuvable
➡️ La migration 03_functions.sql n'a pas été exécutée correctement.

---

## Scripts NPM Utiles (À ajouter)

Ajoutez ces scripts dans `package.json` :

```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --project-id your-ref > types/database.ts",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:pull": "supabase db pull"
  }
}
```

Usage :
```bash
npm run db:types   # Générer les types TypeScript
npm run db:push    # Pousser les migrations
npm run db:pull    # Récupérer le schema distant
npm run db:reset   # Reset la DB locale (développement uniquement)
```

---

## 🎉 Félicitations !

Une fois les migrations déployées et l'environnement configuré, votre plateforme de vote électronique est **opérationnelle** !

Vous pouvez maintenant :
- ✅ Créer des comptes utilisateurs
- ✅ Créer des élections
- ✅ Ajouter des candidats
- ✅ Ajouter des électeurs
- ✅ Envoyer des invitations
- ✅ Voter de manière sécurisée
- ✅ Consulter les résultats

---

## Support

Si vous rencontrez des problèmes :
1. Consultez la [documentation Supabase](https://supabase.com/docs)
2. Vérifiez les logs dans **Logs > Postgres Logs**
3. Testez les requêtes SQL directement dans le **SQL Editor**
