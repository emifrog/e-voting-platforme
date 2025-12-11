-- =========================================
-- PHASE 4A MIGRATIONS - À EXÉCUTER SUR SUPABASE
-- =========================================
-- Instructions :
-- 1. Allez sur https://supabase.com/dashboard
-- 2. Sélectionnez votre projet
-- 3. Allez dans SQL Editor
-- 4. Copiez tout ce fichier et exécutez-le
-- =========================================

-- =========================================
-- MIGRATION 1: TABLE AUDIT_LOGS
-- =========================================

-- Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Qui
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Quoi
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,

  -- Détails
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  description TEXT NOT NULL,

  -- Données avant/après
  old_data JSONB,
  new_data JSONB,
  metadata JSONB,

  -- Quand
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraint
  CONSTRAINT audit_logs_action_check CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
    'VOTE', 'LOGIN', 'LOGOUT', 'REGISTER',
    'INVITE', 'REVOKE', 'CLOSE', 'ARCHIVE',
    'EXPORT', 'IMPORT'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Election creators can view their election logs" ON audit_logs;
CREATE POLICY "Election creators can view their election logs"
  ON audit_logs
  FOR SELECT
  USING (
    resource_type = 'elections'
    AND resource_id IN (
      SELECT id FROM elections WHERE creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Fonction cleanup
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

-- Commentaires
COMMENT ON TABLE audit_logs IS 'Table de traçabilité pour toutes les actions importantes (RGPD, sécurité)';
COMMENT ON COLUMN audit_logs.user_id IS 'ID de l''utilisateur ayant effectué l''action';
COMMENT ON COLUMN audit_logs.action IS 'Type d''action effectuée (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type de ressource concernée (elections, voters, votes)';
COMMENT ON COLUMN audit_logs.severity IS 'Niveau de sévérité (info, warning, error, critical)';
COMMENT ON COLUMN audit_logs.old_data IS 'État de la ressource avant modification (pour rollback potentiel)';
COMMENT ON COLUMN audit_logs.new_data IS 'État de la ressource après modification';

-- =========================================
-- MIGRATION 2: SOFT DELETE ELECTIONS
-- =========================================

-- Ajouter colonne deleted_at
ALTER TABLE elections
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_elections_deleted_at ON elections(deleted_at);

-- Fonction soft delete
CREATE OR REPLACE FUNCTION soft_delete_election(election_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE elections
  SET deleted_at = NOW()
  WHERE id = election_id
    AND creator_id = auth.uid()
    AND deleted_at IS NULL;
END;
$$;

-- Fonction restore
CREATE OR REPLACE FUNCTION restore_election(election_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE elections
  SET deleted_at = NULL
  WHERE id = election_id
    AND creator_id = auth.uid()
    AND deleted_at IS NOT NULL;
END;
$$;

-- Fonction hard delete
CREATE OR REPLACE FUNCTION hard_delete_election(election_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_count INT;
BEGIN
  -- Vérifier que l'élection est un draft
  IF NOT EXISTS (
    SELECT 1 FROM elections
    WHERE id = election_id
      AND creator_id = auth.uid()
      AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'Seules les élections en brouillon sans votes peuvent être supprimées définitivement';
  END IF;

  -- Vérifier qu'il n'y a aucun vote
  SELECT COUNT(*) INTO vote_count
  FROM votes
  WHERE election_id = election_id;

  IF vote_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer une élection avec des votes';
  END IF;

  -- Supprimer les candidats
  DELETE FROM candidates WHERE election_id = election_id;

  -- Supprimer les électeurs
  DELETE FROM voters WHERE election_id = election_id;

  -- Supprimer l'élection
  DELETE FROM elections WHERE id = election_id;
END;
$$;

-- Modifier RLS policies
DROP POLICY IF EXISTS "Elections are viewable by everyone" ON elections;
CREATE POLICY "Elections are viewable by everyone"
  ON elections
  FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can view their own deleted elections" ON elections;
CREATE POLICY "Users can view their own deleted elections"
  ON elections
  FOR SELECT
  USING (creator_id = auth.uid() AND deleted_at IS NOT NULL);

-- Fonction cleanup deleted elections
CREATE OR REPLACE FUNCTION cleanup_deleted_elections()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM elections
  WHERE deleted_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Commentaires
COMMENT ON COLUMN elections.deleted_at IS 'Date de suppression logique (soft delete). NULL = active, NOT NULL = supprimée';
COMMENT ON FUNCTION soft_delete_election IS 'Marque une élection comme supprimée (soft delete) au lieu de la supprimer définitivement';
COMMENT ON FUNCTION restore_election IS 'Restaure une élection précédemment soft deleted';
COMMENT ON FUNCTION hard_delete_election IS 'Supprime définitivement une élection (uniquement drafts sans votes)';

-- =========================================
-- FIN DES MIGRATIONS
-- =========================================

-- Vérification
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS audit_logs_count FROM audit_logs;
SELECT COUNT(*) AS elections_with_deleted_at FROM elections WHERE deleted_at IS NOT NULL;
