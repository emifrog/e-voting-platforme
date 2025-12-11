-- ============================================
-- APPLY PHASE 4D MIGRATION
-- ============================================
-- Ce fichier applique toutes les migrations de Phase 4D
-- Exécuter via Supabase CLI ou Dashboard SQL Editor
-- ============================================

\i 20250118_phase_4d_push_notifications.sql

-- ============================================
-- Vérification post-migration
-- ============================================

-- Vérifier que la table existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'push_subscriptions'
    ) THEN '✅ Table push_subscriptions créée'
    ELSE '❌ Erreur: Table push_subscriptions manquante'
  END AS status;

-- Vérifier les policies RLS
SELECT
  COUNT(*) || ' policies RLS créées pour push_subscriptions' AS rls_status
FROM pg_policies
WHERE tablename = 'push_subscriptions';

-- Vérifier la colonne platform dans webhooks
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'webhooks' AND column_name = 'platform'
    ) THEN '✅ Colonne webhooks.platform ajoutée'
    ELSE '❌ Erreur: Colonne platform manquante'
  END AS webhook_status;

-- Afficher un résumé
SELECT
  '🎉 Phase 4D migration appliquée avec succès!' AS message,
  NOW() AS applied_at;
