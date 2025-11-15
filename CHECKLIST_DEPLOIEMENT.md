# ✅ Checklist Déploiement Vercel - E-Voting Platform

**À imprimer ou garder sous les yeux pendant le déploiement**

---

## 🔑 Informations Critiques à Sauvegarder

### **Clé de Chiffrement (UNIQUE - NE PAS PERDRE)**

```
ENCRYPTION_KEY = f1cb9f195f5e499720b800b9cbbc72dc9111860a2edc18465a5f931b96d6ede0
```

⚠️ **SAUVEGARDER IMMÉDIATEMENT DANS** :
- [ ] Gestionnaire de mots de passe
- [ ] Fichier chiffré hors ligne
- [ ] Autre lieu sûr

---

## 📝 Checklist Pré-Déploiement

### **Comptes Requis**
- [ ] Compte GitHub (avec repository e-voting-platforme)
- [ ] Compte Vercel (se connecter avec GitHub)
- [ ] Compte Supabase (créé et configuré)
- [ ] Compte Resend (créé)
- [ ] (Optionnel) Compte Upstash Redis

### **Supabase Préparé**
- [ ] Projet Supabase créé
- [ ] Migration 1 déployée : `20250114000000_initial_schema.sql`
- [ ] Migration 2 déployée : `20250114000001_rls_policies.sql`
- [ ] Migration 3 déployée : `20250114000002_indexes.sql`
- [ ] Migration 4 déployée : `20250114000003_functions.sql`
- [ ] Migration 5 déployée : `20250114000004_triggers.sql`

### **Valeurs Collectées**

#### **Supabase** (https://supabase.com/dashboard/project/_/settings/api)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` : _______________________________
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` : _______________________________
- [ ] `SUPABASE_SERVICE_ROLE_KEY` : _______________________________

#### **Resend** (https://resend.com)
- [ ] `RESEND_API_KEY` : _______________________________
- [ ] `EMAIL_FROM` : _______________________________
- [ ] Domaine vérifié dans Resend

#### **Upstash** (https://upstash.com) - Optionnel
- [ ] `UPSTASH_REDIS_REST_URL` : _______________________________
- [ ] `UPSTASH_REDIS_REST_TOKEN` : _______________________________

---

## 🚀 Checklist Déploiement Vercel

### **1. Import du Projet**
- [ ] Aller sur https://vercel.com
- [ ] Se connecter avec GitHub
- [ ] Cliquer "Add New..." > "Project"
- [ ] Chercher `e-voting-platforme`
- [ ] Cliquer "Import"

### **2. Configuration Build**
- [ ] Framework : Next.js (auto) ✅
- [ ] Root Directory : `.` ✅
- [ ] Build Settings > Override "Install Command"
- [ ] Install Command = `npm install --legacy-peer-deps`

### **3. Variables d'Environnement (7 requises + 2 optionnelles)**

Pour chaque variable :
- [ ] Cliquer "Add"
- [ ] Name : [copier depuis liste]
- [ ] Value : [coller valeur]
- [ ] Environment : ✅ Production (coché)
- [ ] Cliquer "Add"

**Variables à ajouter** :

#### **Requises**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ENCRYPTION_KEY` (voir clé en haut de ce document)
- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://e-voting-platforme.vercel.app` (temporaire)

#### **Optionnelles**
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

### **4. Lancer le Déploiement**
- [ ] Vérifier que les 7 variables requises sont ajoutées
- [ ] Cliquer "Deploy"
- [ ] Attendre 2-3 minutes

### **5. Déploiement Réussi**
- [ ] Message "Congratulations!" affiché
- [ ] URL du site affichée (ex: `https://e-voting-platforme-xyz123.vercel.app`)
- [ ] **Copier l'URL complète** : _______________________________

---

## 🔧 Checklist Post-Déploiement

### **1. Mettre à Jour l'URL du Site**
- [ ] Aller dans Settings > Environment Variables
- [ ] Trouver `NEXT_PUBLIC_SITE_URL`
- [ ] Cliquer "..." > "Edit"
- [ ] Remplacer par l'URL réelle (copiée ci-dessus)
- [ ] Save
- [ ] Deployments > ... > "Redeploy"

### **2. Configurer Supabase Auth**
- [ ] Aller sur https://supabase.com/dashboard/project/_/auth/url-configuration
- [ ] Site URL = [URL Vercel]
- [ ] Redirect URLs > Add : `[URL Vercel]/auth/callback`
- [ ] Save

### **3. Configurer Resend (si domaine personnalisé)**
- [ ] Aller sur https://resend.com/domains
- [ ] Add Domain
- [ ] Configurer DNS (SPF, DKIM, DMARC)
- [ ] Attendre vérification

---

## ✅ Tests de Vérification

### **Tests Fonctionnels**
- [ ] Ouvrir l'URL du site
- [ ] Page redirige vers `/login`
- [ ] Créer un compte (`/register`)
- [ ] Se connecter (`/login`)
- [ ] Dashboard affiche les statistiques
- [ ] Créer une élection (formulaire complet)
- [ ] Ajouter un candidat
- [ ] Ajouter un électeur
- [ ] Activer le 2FA (`/settings/security`)

### **Tests d'Email**
- [ ] Inviter un électeur
- [ ] Vérifier réception email
- [ ] Cliquer sur le lien unique
- [ ] Page de vote s'affiche

### **Tests de Vote**
- [ ] Voter via le lien unique
- [ ] Confirmation affichée
- [ ] Hash de vérification généré
- [ ] Dashboard met à jour les stats

### **Tests de Résultats**
- [ ] Fermer l'élection
- [ ] Voir les résultats
- [ ] Podium affiché
- [ ] Graphiques affichés
- [ ] Export PDF fonctionne
- [ ] Export CSV fonctionne

---

## 🐛 Dépannage Rapide

### **Build échoue**
**Solution** :
- [ ] Vérifier Install Command = `npm install --legacy-peer-deps`
- [ ] Settings > General > Build Settings
- [ ] Modifier et redéployer

### **Erreur Supabase au runtime**
**Solution** :
- [ ] Vérifier 3 variables Supabase dans Environment Variables
- [ ] Vérifier Environment = "Production"
- [ ] Redéployer

### **Emails ne partent pas**
**Solution** :
- [ ] Vérifier RESEND_API_KEY correct
- [ ] Vérifier domaine vérifié dans Resend
- [ ] Vérifier EMAIL_FROM = domaine vérifié
- [ ] Consulter logs : https://resend.com/logs

### **Voir les Logs**
- [ ] Vercel > Deployments > [dernier] > "Function Logs"
- [ ] Chercher les erreurs en rouge

---

## 📊 Métriques de Succès

### **Performance**
- [ ] Page se charge en < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Lighthouse Score > 80

### **Sécurité**
- [ ] HTTPS activé (automatique Vercel)
- [ ] Headers de sécurité présents
- [ ] RLS Supabase actif

### **Fonctionnalités**
- [ ] Auth fonctionne
- [ ] 2FA fonctionne
- [ ] CRUD élections fonctionne
- [ ] Votes chiffrés correctement
- [ ] Résultats calculés correctement
- [ ] Exports fonctionnent

---

## 🎯 Prochaines Actions

### **Immédiat**
- [ ] Créer compte administrateur
- [ ] Activer 2FA sur ce compte
- [ ] Créer élection de test
- [ ] Tester workflow complet

### **Dans les 24h**
- [ ] Configurer domaine personnalisé (optionnel)
- [ ] Ajouter monitoring (Vercel Analytics)
- [ ] Tester sur mobile
- [ ] Partager avec utilisateurs bêta

### **Dans la semaine**
- [ ] Créer première élection réelle
- [ ] Former les administrateurs
- [ ] Documenter les processus internes
- [ ] Planifier sauvegardes

---

## 📞 Ressources

| Besoin | Lien |
|--------|------|
| Guide détaillé | [DEPLOIEMENT_VERCEL.md](./DEPLOIEMENT_VERCEL.md) |
| Guide utilisateur | [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md) |
| Fonctionnalités avancées | [FONCTIONNALITES_AVANCEES.md](./FONCTIONNALITES_AVANCEES.md) |
| Vercel Support | https://vercel.com/docs |
| Supabase Support | https://supabase.com/docs |

---

## ✨ Notes Personnelles

Espace pour vos notes pendant le déploiement :

```
URL Vercel finale : _______________________________________________

Erreurs rencontrées : _______________________________________________

Solutions appliquées : _______________________________________________

Date du déploiement : _______________________________________________

Personnes à former : _______________________________________________
```

---

**🎉 Bon déploiement !**

---

**Document créé le** : 15 janvier 2025
**Version** : 1.0
**Projet** : E-Voting Platform
