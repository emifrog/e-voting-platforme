#!/usr/bin/env node

/**
 * Script pour générer les clés de sécurité nécessaires
 * Utilisation : node scripts/generate-env-keys.js
 */

const crypto = require('crypto')

console.log('='.repeat(60))
console.log('🔐 E-Voting Platform - Générateur de Clés de Sécurité')
console.log('='.repeat(60))
console.log('')

// Générer la clé de chiffrement
const encryptionKey = crypto.randomBytes(32).toString('hex')

console.log('📋 Copiez ces valeurs dans Vercel Environment Variables :')
console.log('')
console.log('-'.repeat(60))
console.log('ENCRYPTION_KEY (64 caractères hex)')
console.log('-'.repeat(60))
console.log(encryptionKey)
console.log('')

// Vérification
console.log('✅ Longueur : ' + encryptionKey.length + ' caractères (doit être 64)')
console.log('')

// Instructions Supabase
console.log('='.repeat(60))
console.log('📌 Variables Supabase')
console.log('='.repeat(60))
console.log('')
console.log('Récupérez ces valeurs sur :')
console.log('👉 https://supabase.com/dashboard/project/_/settings/api')
console.log('')
console.log('Variables à copier :')
console.log('  - NEXT_PUBLIC_SUPABASE_URL')
console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY (anon/public)')
console.log('  - SUPABASE_SERVICE_ROLE_KEY (service_role)')
console.log('')

// Instructions Resend
console.log('='.repeat(60))
console.log('📧 Variables Resend (Email)')
console.log('='.repeat(60))
console.log('')
console.log('Récupérez sur : 👉 https://resend.com/api-keys')
console.log('')
console.log('Variables à configurer :')
console.log('  - RESEND_API_KEY (commencera par "re_")')
console.log('  - EMAIL_FROM (ex: noreply@votredomain.com)')
console.log('')
console.log('⚠️  Configurez d\'abord votre domaine dans Resend :')
console.log('   https://resend.com/domains')
console.log('')

// Instructions Upstash (Optionnel)
console.log('='.repeat(60))
console.log('⚡ Variables Upstash Redis (Optionnel - Rate Limiting)')
console.log('='.repeat(60))
console.log('')
console.log('Gratuit sur : 👉 https://upstash.com')
console.log('')
console.log('Variables à récupérer (REST API) :')
console.log('  - UPSTASH_REDIS_REST_URL')
console.log('  - UPSTASH_REDIS_REST_TOKEN')
console.log('')
console.log('💡 Si non configuré, le rate limiting sera désactivé')
console.log('')

// Site URL
console.log('='.repeat(60))
console.log('🌐 Variable Site URL')
console.log('='.repeat(60))
console.log('')
console.log('Lors du PREMIER déploiement, utilisez :')
console.log('  NEXT_PUBLIC_SITE_URL = https://votre-app.vercel.app')
console.log('')
console.log('⚠️  Après le déploiement, mettez à jour avec l\'URL réelle')
console.log('   et redéployez.')
console.log('')

// Récapitulatif
console.log('='.repeat(60))
console.log('📝 Récapitulatif - Variables Vercel à Configurer')
console.log('='.repeat(60))
console.log('')
console.log('Environment : Production')
console.log('')
console.log('✅ REQUISES :')
console.log('  1. NEXT_PUBLIC_SUPABASE_URL')
console.log('  2. NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('  3. SUPABASE_SERVICE_ROLE_KEY')
console.log('  4. ENCRYPTION_KEY (généré ci-dessus)')
console.log('  5. RESEND_API_KEY')
console.log('  6. EMAIL_FROM')
console.log('  7. NEXT_PUBLIC_SITE_URL')
console.log('')
console.log('⚠️  OPTIONNELLES (mais recommandées) :')
console.log('  8. UPSTASH_REDIS_REST_URL')
console.log('  9. UPSTASH_REDIS_REST_TOKEN')
console.log('')

// Sauvegarde
console.log('='.repeat(60))
console.log('💾 IMPORTANT - Sauvegarde')
console.log('='.repeat(60))
console.log('')
console.log('⚠️  Sauvegardez ENCRYPTION_KEY dans un lieu sûr !')
console.log('   Si perdue, les votes chiffrés ne pourront plus être déchiffrés.')
console.log('')
console.log('Recommandations :')
console.log('  - Gestionnaire de mots de passe (1Password, Bitwarden, etc.)')
console.log('  - Fichier chiffré hors ligne')
console.log('  - Coffre-fort numérique')
console.log('')

console.log('='.repeat(60))
console.log('✨ Génération terminée !')
console.log('='.repeat(60))
console.log('')
