# 🧪 Guide de Tests Phase 4D

## 📋 Checklist de Tests Fonctionnels

### ✅ Configuration Préalable

- [x] Migration Supabase appliquée
- [x] VAPID keys générées et configurées
- [x] Variables d'environnement configurées
- [x] Build réussi (`npm run build`)
- [x] Service Worker créé (`public/sw.js`)

---

## 1. 📱 Tests Responsive Design

### Test 1.1 - Menu Mobile
**Objectif** : Vérifier que le menu hamburger apparaît sur petits écrans

**Étapes** :
1. Démarrer : `npm run dev`
2. Ouvrir : `http://localhost:3000/dashboard`
3. Ouvrir DevTools (F12) → Mode responsive
4. Définir viewport : 375x667 (iPhone)

**Résultat attendu** :
- ✅ Icône hamburger (☰) visible en haut à gauche
- ✅ Navigation desktop masquée
- ✅ Clic sur hamburger → Menu slide-in depuis la gauche
- ✅ Overlay semi-transparent visible
- ✅ Clic sur overlay → Menu se ferme

### Test 1.2 - Breakpoints
**Étapes** :
1. Tester différentes largeurs :
   - 375px (mobile) → Menu hamburger
   - 768px (tablet) → Menu hamburger
   - 1024px (desktop) → Navigation complète

**Résultat attendu** :
- ✅ < 1024px : Menu hamburger visible
- ✅ ≥ 1024px : Navigation desktop visible
- ✅ Transitions fluides entre breakpoints

### Test 1.3 - Responsive Components
**Composants à tester** :
- `/dashboard` → Cartes analytics responsive
- `/elections` → Grille élections (1 col mobile, 2 col tablet, 3 col desktop)
- `/elections/[id]/results` → Graphiques s'adaptent

---

## 2. 📊 Tests Analytics Dashboard

### Test 2.1 - Affichage du Dashboard
**Étapes** :
1. Ouvrir : `http://localhost:3000/dashboard`
2. Vérifier que `AdvancedAnalyticsDashboard` s'affiche

**Résultat attendu** :
- ✅ 4 cartes KPI visibles :
  - Total Elections
  - Elections Actives
  - Total Votes
  - Participation Moyenne
- ✅ Badge de tendance (↑ rouge ou ↓ vert)
- ✅ Graphiques Recharts chargés
- ✅ Tableau "Top Elections" avec données

### Test 2.2 - Données Dynamiques
**Étapes** :
1. Créer une nouvelle élection
2. Rafraîchir `/dashboard`
3. Vérifier que "Total Elections" a augmenté

**Résultat attendu** :
- ✅ Compteur mis à jour en temps réel
- ✅ Graphiques reflètent nouvelles données

### Test 2.3 - Performance
**Vérification** :
- ✅ Chargement < 2 secondes
- ✅ Pas de flickering lors du rendu
- ✅ Animations fluides (60 FPS)

---

## 3. 🌙 Tests Dark Mode

### Test 3.1 - Toggle Theme
**Étapes** :
1. Ouvrir : `http://localhost:3000/settings`
2. Localiser le composant "Thème de l'interface"
3. Cliquer sur "Clair"

**Résultat attendu** :
- ✅ Interface passe en mode clair
- ✅ Toutes les couleurs s'inversent correctement
- ✅ Pas de texte illisible (contraste suffisant)

### Test 3.2 - Modes Disponibles
**Tester les 3 modes** :
1. **Clair** → Fond blanc, texte noir
2. **Sombre** → Fond noir, texte blanc
3. **Système** → Suit les préférences OS

**Résultat attendu** :
- ✅ Bouton actif surligné en bleu
- ✅ Changement instantané (< 100ms)
- ✅ Persistance après refresh (localStorage)

### Test 3.3 - Compatibilité Composants
**Composants critiques à vérifier** :
- Header/Footer
- Boutons (primary, secondary, danger)
- Cards/Dialogs
- Forms/Inputs
- Tableaux
- Graphiques (Recharts)

**Résultat attendu** :
- ✅ Tous les composants lisibles en dark mode
- ✅ Pas de "flash" blanc au chargement

---

## 4. 🔔 Tests Notifications Push

### Test 4.1 - Demande de Permission
**Étapes** :
1. Ouvrir : `http://localhost:3000/settings`
2. Localiser "Notifications push"
3. Cliquer sur le toggle OFF → ON

**Résultat attendu** :
- ✅ Popup navigateur "Autoriser les notifications ?"
- ✅ Clic "Autoriser" → Toggle passe à ON
- ✅ Message de confirmation affiché
- ✅ Badge "Activées" visible

### Test 4.2 - Vérification Base de Données
**Étapes** :
1. Après activation, ouvrir Supabase Dashboard
2. Table Editor → `push_subscriptions`
3. Vérifier qu'une ligne existe

**Résultat attendu** :
- ✅ 1 ligne avec votre `user_id`
- ✅ `endpoint` rempli (URL push)
- ✅ `keys` contient `{p256dh, auth}`
- ✅ `is_active` = true

### Test 4.3 - Test Notification Locale
**Étapes** :
1. Ouvrir Console DevTools
2. Exécuter :
```javascript
new Notification('Test E-Voting', {
  body: 'Ceci est une notification test',
  icon: '/logo.png'
})
```

**Résultat attendu** :
- ✅ Notification apparaît (coin supérieur droit)
- ✅ Icône E-Voting visible
- ✅ Clic sur notification → Focus app

### Test 4.4 - Service Worker
**Vérification** :
1. DevTools → Application → Service Workers
2. Vérifier que `sw.js` est enregistré

**Résultat attendu** :
- ✅ Status : "activated and is running"
- ✅ Scope : `/`
- ✅ Update on reload : Cochée

### Test 4.5 - Test Notification Push Backend
**Créer un script de test** :

```bash
# test-push.js
const webpush = require('web-push')

webpush.setVapidDetails(
  'mailto:xav.robart@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const subscription = {
  endpoint: 'VOTRE_ENDPOINT', // Copier depuis DB
  keys: {
    p256dh: 'VOTRE_P256DH',
    auth: 'VOTRE_AUTH'
  }
}

const payload = JSON.stringify({
  title: 'Test E-Voting',
  body: 'Notification push backend',
  icon: '/logo.png',
  data: { url: '/dashboard' }
})

webpush.sendNotification(subscription, payload)
  .then(() => console.log('✅ Notification envoyée'))
  .catch(err => console.error('❌ Erreur:', err))
```

**Exécuter** :
```bash
node test-push.js
```

**Résultat attendu** :
- ✅ Notification reçue même si app fermée
- ✅ Clic → Ouvre `/dashboard`

---

## 5. 📄 Tests Export PDF

### Test 5.1 - Export Simple
**Étapes** :
1. Créer une élection avec votes
2. Ouvrir `/elections/[id]/results`
3. Cliquer sur bouton "Exporter PDF"

**Résultat attendu** :
- ✅ Téléchargement automatique `election_results_[id].pdf`
- ✅ PDF contient :
  - Titre élection
  - Description
  - Date export
  - Tableau résultats
  - Statistiques (participation, abstention)

### Test 5.2 - Export avec Graphiques
**Étapes** :
1. Vérifier que graphiques sont visibles dans `/results`
2. Exporter PDF

**Résultat attendu** :
- ✅ PDF contient captures des graphiques :
  - BarChart (comparaison votes)
  - PieChart (répartition %)
- ✅ Résolution acceptable (pas flou)

### Test 5.3 - Export Multi-Options
**Tester avec** :
- Élection 2 options
- Élection 5 options
- Élection 10+ options

**Résultat attendu** :
- ✅ Toutes options affichées
- ✅ Pagination automatique si > 1 page
- ✅ Pas de coupure au milieu d'une ligne

---

## 6. 🔗 Tests Webhooks

### Test 6.1 - Webhook Teams
**Setup** :
1. Créer un webhook Teams (Incoming Webhook)
2. Ajouter dans `/settings/webhooks`
3. Sélectionner Platform : "teams"
4. Déclencher événement (ex: élection créée)

**Résultat attendu** :
- ✅ Message reçu dans Teams
- ✅ Format Adaptive Card
- ✅ Titre, description, bouton "Voir" présents

### Test 6.2 - Webhook Slack
**Setup** :
1. Créer Slack App avec Incoming Webhook
2. Ajouter webhook avec platform "slack"
3. Créer une élection

**Résultat attendu** :
- ✅ Message Slack avec blocks
- ✅ Markdown formaté (gras, italique)
- ✅ Couleur barre latérale selon type événement

### Test 6.3 - Webhook Générique
**Tester avec RequestBin ou Webhook.site** :
1. Obtenir URL test : https://webhook.site
2. Ajouter webhook "generic"
3. Déclencher événements

**Résultat attendu** :
- ✅ Payload JSON reçu
- ✅ Structure :
  ```json
  {
    "event": "election.created",
    "election": { "id": "...", "title": "..." },
    "timestamp": "2025-01-19T..."
  }
  ```

---

## 🚀 Tests de Performance

### Test P1 - Lighthouse Score
**Étapes** :
1. Build production : `npm run build && npm start`
2. Ouvrir : `http://localhost:3000`
3. DevTools → Lighthouse → Générer rapport

**Objectifs** :
- ✅ Performance : > 90
- ✅ Accessibility : > 90
- ✅ Best Practices : > 90
- ✅ SEO : > 80

### Test P2 - Bundle Size
**Vérifier** :
```bash
npm run build
```

**Résultat attendu** :
- ✅ First Load JS : < 300 kB (shared)
- ✅ Page la plus lourde : < 600 kB (`/elections/[id]/results`)
- ✅ Pas de chunks > 1 MB

### Test P3 - Network Throttling
**Tester avec 3G lent** :
1. DevTools → Network → Slow 3G
2. Naviguer entre pages

**Résultat attendu** :
- ✅ Time to Interactive : < 5s
- ✅ Loading spinners affichés
- ✅ Pas d'erreurs timeout

---

## 🐛 Tests de Régression

### Test R1 - Fonctionnalités Existantes
**Vérifier que Phase 4D n'a rien cassé** :

- [ ] Authentification (login/register/logout)
- [ ] CRUD élections (create/read/update/delete)
- [ ] Vote simple (anonymous/registered)
- [ ] 2FA (activation/désactivation)
- [ ] Gestion électeurs (import CSV, ajout manuel)
- [ ] Exports (CSV, JSON, Excel)
- [ ] Calendrier (FullCalendar)
- [ ] Webhooks existants
- [ ] Stripe (créer checkout)

### Test R2 - Sécurité
**Tests de sécurité critiques** :

- [ ] RLS Policies actives (users ne voient que leurs données)
- [ ] CSRF Token présent dans formulaires
- [ ] XSS : Tester `<script>alert(1)</script>` dans champs
- [ ] SQL Injection : Tester `' OR 1=1--` dans recherche
- [ ] Vote multiple bloqué
- [ ] Accès admin protégé

---

## 📊 Rapport de Tests

### Template de Rapport

```markdown
# Rapport de Tests Phase 4D
**Date** : [DATE]
**Testeur** : [NOM]
**Environnement** : Development / Production

## Résumé
- Tests passés : X/Y
- Tests échoués : Z
- Blockers : [LISTE]

## Détails par Fonctionnalité

### 1. Responsive Design
- [ ] Menu mobile : ✅ / ❌
- [ ] Breakpoints : ✅ / ❌
- [ ] Composants responsive : ✅ / ❌
- **Commentaires** : [...]

### 2. Analytics Dashboard
- [ ] Affichage : ✅ / ❌
- [ ] Données dynamiques : ✅ / ❌
- [ ] Performance : ✅ / ❌
- **Commentaires** : [...]

[... Suite pour chaque fonctionnalité ...]

## Bugs Identifiés
1. [TITRE BUG] - Priorité : Haute/Moyenne/Basse
   - **Description** : [...]
   - **Steps to reproduce** : [...]
   - **Résultat attendu** : [...]
   - **Résultat actuel** : [...]

## Recommandations
- [ACTION 1]
- [ACTION 2]
```

---

## 🎯 Critères de Validation Phase 4D

**Phase 4D est validée si** :
- ✅ Tous les tests fonctionnels passent (sections 1-6)
- ✅ Aucun blocker identifié
- ✅ Lighthouse score > 85 (moyenne)
- ✅ Aucune régression sur phases précédentes
- ✅ Documentation complète

---

## 📞 Support

**En cas de problème** :
1. Consulter [`TROUBLESHOOTING_PHASE_4D.md`](../supabase/migrations/TROUBLESHOOTING_PHASE_4D.md)
2. Vérifier logs console (DevTools)
3. Vérifier logs Supabase (Dashboard → Logs)
4. Créer issue GitHub avec :
   - Description problème
   - Steps to reproduce
   - Logs/screenshots
   - Environnement (OS, browser, versions)

---

**Bon testing ! 🧪**
