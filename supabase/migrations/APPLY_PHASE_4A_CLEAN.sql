-- =========================================
-- PHASE 4A MIGRATIONS - VERSION PROPRE
-- =========================================
-- Cette version supprime d'abord les tables/fonctions existantes
-- puis les recrée proprement
-- =========================================

-- =========================================
-- NETTOYAGE PRÉALABLE
-- =========================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Election creators can view their election logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Elections are viewable by everyone" ON elections;
DROP POLICY IF EXISTS "Users can view their own deleted elections" ON elections;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS cleanup_old_audit_logs();
DROP FUNCTION IF EXISTS soft_delete_election(UUID);
DROP FUNCTION IF EXISTS restore_election(UUID);
DROP FUNCTION IF EXISTS hard_delete_election(UUID);
DROP FUNCTION IF EXISTS cleanup_deleted_elections();

-- Supprimer la table audit_logs si elle existe
DROP TABLE IF EXISTS audit_logs CASCADE;

-- =========================================
-- MIGRATION 1: TABLE AUDIT_LOGS
-- =========================================

-- Créer la table audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Qui
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,

  -- Quoi
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
    'VOTE', 'LOGIN', 'LOGOUT', 'REGISTER',
    'INVITE', 'REVOKE', 'CLOSE', 'ARCHIVE',
    'EXPORT', 'IMPORT'
  )),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Election creators can view their election logs"
  ON audit_logs
  FOR SELECT
  USING (
    resource_type = 'elections'
    AND resource_id IN (
      SELECT id FROM elections WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Fonction cleanup
CREATE FUNCTION cleanup_old_audit_logs()
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

-- Ajouter colonne deleted_at si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'elections' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE elections ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_elections_deleted_at ON elections(deleted_at);

-- Fonction soft delete
CREATE FUNCTION soft_delete_election(election_id UUID)
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
CREATE FUNCTION restore_election(election_id UUID)
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
CREATE FUNCTION hard_delete_election(election_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_count INT;
  election_creator UUID;
  election_status TEXT;
BEGIN
  -- Récupérer les infos de l'élection
  SELECT creator_id, status INTO election_creator, election_status
  FROM elections
  WHERE id = election_id;

  -- Vérifier que l'utilisateur est le créateur
  IF election_creator != auth.uid() THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- Vérifier que c'est un draft
  IF election_status != 'draft' THEN
    RAISE EXCEPTION 'Seules les élections en brouillon peuvent être supprimées définitivement';
  END IF;

  -- Vérifier qu'il n'y a aucun vote
  SELECT COUNT(*) INTO vote_count
  FROM votes
  WHERE votes.election_id = hard_delete_election.election_id;

  IF vote_count > 0 THEN
    RAISE EXCEPTION 'Impossible de supprimer une élection avec des votes';
  END IF;

  -- Supprimer les candidats
  DELETE FROM candidates WHERE candidates.election_id = hard_delete_election.election_id;

  -- Supprimer les électeurs
  DELETE FROM voters WHERE voters.election_id = hard_delete_election.election_id;

  -- Supprimer l'élection
  DELETE FROM elections WHERE elections.id = hard_delete_election.election_id;
END;
$$;

-- Recréer les RLS policies pour elections
CREATE POLICY "Elections are viewable by everyone"
  ON elections
  FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Users can view their own deleted elections"
  ON elections
  FOR SELECT
  USING (creator_id = auth.uid() AND deleted_at IS NOT NULL);

-- Fonction cleanup deleted elections
CREATE FUNCTION cleanup_deleted_elections()
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
-- VÉRIFICATIONS FINALES
-- =========================================

SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS audit_logs_count FROM audit_logs;
SELECT
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_elections,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_elections
FROM elections;
