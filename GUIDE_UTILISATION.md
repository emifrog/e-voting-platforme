# 📘 Guide d'Utilisation - E-Voting Platform

## 🚀 Démarrage Rapide

### Prérequis

1. **Créer un compte Supabase** : https://supabase.com
2. **Créer un compte Resend** : https://resend.com (pour les emails)
3. **Node.js 18+** installé sur votre machine

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
```

### Configuration .env.local

```env
# Supabase (récupérer sur https://supabase.com/dashboard/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Générer une clé de chiffrement (32 bytes = 64 caractères hex)
# Exécuter: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=votre_cle_64_caracteres_hex

# Resend (pour les emails)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@votredomain.com

# URL de votre site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Déployer les migrations Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref votre-project-ref

# Pousser les migrations
supabase db push
```

### Démarrer le serveur

```bash
npm run dev
# Ouvrir http://localhost:3000
```

---

## 👨‍💼 Guide Administrateur

### 1. Créer un compte

1. Aller sur `/register`
2. Remplir le formulaire (nom, email, mot de passe)
3. Vous êtes automatiquement connecté et redirigé vers le dashboard

### 2. Créer une élection

#### Étape 1 : Informations générales
1. Cliquer sur **"Créer une élection"**
2. Remplir :
   - **Titre** : Ex: "Élection du délégué de classe"
   - **Description** : Objectif du vote (optionnel)
   - **Type de vote** :
     - **Simple** : Un seul choix
     - **Approbation** : Plusieurs choix possibles
     - **Classé** : Ordonner les candidats par préférence
     - **Liste** : Voter pour une liste complète

#### Étape 2 : Dates
- **Date de début** : Quand le vote s'ouvre
- **Date de fin** : Quand le vote se ferme

#### Étape 3 : Paramètres
- **Vote secret** : Les votes sont anonymes (recommandé ✅)
- **Vote pondéré** : Certains électeurs ont plus de poids
- **Permettre l'abstention** : Option "vote blanc"
- **Résultats visibles** : Afficher les résultats après le vote

#### Étape 4 : Quorum (optionnel)
- **Aucun** : Pas de seuil minimum
- **Pourcentage** : Ex: 50% de participation requise
- **Absolu** : Ex: 100 votes minimum

### 3. Ajouter des candidats

Une fois l'élection créée :
1. Aller dans la page de détail de l'élection
2. Cliquer sur **"Ajouter un candidat"**
3. Remplir :
   - **Nom** : Ex: "Jean Dupont"
   - **Description** : Présentation (optionnel)
4. Répéter pour chaque candidat

### 4. Ajouter des électeurs

#### Méthode 1 : Manuel
1. Aller dans **"Gérer les électeurs"**
2. Cliquer sur **"Ajouter un électeur"**
3. Remplir :
   - **Email**
   - **Nom**
   - **Poids** (si vote pondéré)

#### Méthode 2 : Import CSV
1. Préparer un fichier CSV :
```csv
email,name,weight
jean.dupont@example.com,Jean Dupont,1.0
marie.martin@example.com,Marie Martin,1.0
```

2. Cliquer sur **"Importer CSV"**
3. Sélectionner le fichier
4. Vérifier l'import

### 5. Envoyer les invitations

1. Aller dans **"Gérer les électeurs"**
2. Cliquer sur **"Envoyer les invitations"**
3. Chaque électeur reçoit un email avec son lien unique de vote

### 6. Suivre le vote

- **Dashboard** : Vue d'ensemble en temps réel
- **Page élection** : Statistiques détaillées
  - Nombre de votes
  - Taux de participation
  - Qui a voté (sans voir le choix)

### 7. Consulter les résultats

1. Aller dans **"Voir les résultats"** (uniquement si vote terminé)
2. Visualisations disponibles :
   - **Podium** : Top 3
   - **Graphique en barres** : Tous les candidats
   - **Tableau détaillé** : Votes et pourcentages
3. Actions :
   - Exporter en PDF
   - Exporter en CSV
   - Partager les résultats

---

## 🗳️ Guide Électeur

### 1. Recevoir l'invitation

Vous recevez un email avec :
- Le titre de l'élection
- Les dates de début/fin
- Un lien unique et sécurisé

### 2. Voter

1. Cliquer sur le lien dans l'email
2. Vérifier les informations de l'élection
3. Sélectionner votre/vos choix
4. Cliquer sur **"Valider mon vote"**
5. Confirmer votre choix
6. Recevoir votre **hash de vérification**

⚠️ **Important** : Vous ne pouvez voter qu'une seule fois !

### 3. Vérifier votre vote

- Conservez le hash de vérification
- Utilisez-le pour confirmer que votre vote a été comptabilisé
- Le hash ne révèle pas votre choix

### 4. Voir les résultats

Si les résultats sont publics :
- Accéder via le lien dans l'email de confirmation
- Ou via l'URL publique partagée par l'organisateur

---

## 🔐 Sécurité & Confidentialité

### Votes Secrets

- **Chiffrement AES-256-GCM** : Vos votes sont chiffrés de bout en bout
- **Anonymat garanti** : Impossible de lier un vote à une personne
- **Hash de vérification** : Prouve que votre vote est comptabilisé sans révéler votre choix

### Protection des Données

- **Row Level Security** : Seul le créateur voit ses élections
- **Tokens uniques** : Chaque électeur a un lien personnel non-devinable
- **Protection double vote** : Impossible de voter 2 fois (verrouillage atomique en base)

### Audit Trail

- Toutes les actions sont enregistrées
- Journal d'audit immutable (blockchain-like)
- Traçabilité complète pour conformité

---

## 📊 Types de Votes Expliqués

### Vote Simple
- **Usage** : Élection d'un représentant, choix unique
- **Fonctionnement** : Choisir 1 seul candidat
- **Gagnant** : Candidat avec le plus de voix

### Vote par Approbation
- **Usage** : Sélection de plusieurs options, comité
- **Fonctionnement** : Choisir autant de candidats que souhaité
- **Gagnant** : Candidat avec le plus d'approbations

### Vote Classé (Ranked Choice)
- **Usage** : Élections complexes, préférences multiples
- **Fonctionnement** : Ordonner les candidats par préférence
- **Gagnant** : Calculé avec système de points (1er choix = 3 pts, 2ème = 2 pts, 3ème = 1 pt)

### Vote de Liste
- **Usage** : Élections de conseils, groupes
- **Fonctionnement** : Voter pour une liste complète de candidats
- **Gagnant** : Liste avec le plus de voix

---

## 🎨 Statuts d'Élection

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| 📝 **Brouillon** | En préparation | Éditer, ajouter candidats/électeurs |
| 📅 **Planifié** | Programmé pour le futur | Modifier dates, électeurs |
| ✅ **Actif** | Vote en cours | Suivre participation |
| 🔒 **Terminé** | Vote fermé | Voir résultats |
| 📦 **Archivé** | Archivé | Consultation seule |

---

## ❓ FAQ

### Puis-je modifier une élection en cours ?
Non, une fois l'élection active, vous ne pouvez plus modifier les candidats ou électeurs pour garantir l'intégrité du vote.

### Comment garantir l'anonymat ?
Activez l'option **"Vote secret"**. Les votes seront chiffrés et impossible à relier à un électeur spécifique.

### Que se passe-t-il si un électeur perd son lien ?
Vous pouvez renvoyer l'invitation depuis la page "Gérer les électeurs".

### Puis-je voter depuis mon téléphone ?
Oui, l'interface est responsive et fonctionne sur mobile, tablette et desktop.

### Les résultats sont-ils en temps réel ?
Oui, vous voyez le nombre de votes en temps réel, mais les résultats détaillés ne sont visibles qu'après la fermeture du vote.

### Comment exporter les résultats ?
Dans la page résultats, cliquez sur **"Exporter en PDF"** ou **"Exporter en CSV"**.

---

## 🆘 Support

### Problèmes courants

**Erreur "Token invalide"**
- Le lien de vote a peut-être expiré
- Contactez l'organisateur pour recevoir un nouveau lien

**Impossible de voter**
- Vérifiez que le vote est bien ouvert (dates)
- Vérifiez que vous n'avez pas déjà voté

**Email d'invitation non reçu**
- Vérifiez vos spams
- Contactez l'organisateur

### Contact
Pour toute question ou problème, contactez votre administrateur système.
