-- Migration: Table audit_logs pour tracer toutes les actions importantes
-- Conformité RGPD et sécurité

-- Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Qui
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Copie pour historique si user supprimé
  ip_address INET, -- Adresse IP de l'utilisateur
  user_agent TEXT, -- User agent du navigateur

  -- Quoi
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, VOTE, LOGIN, etc.
  resource_type TEXT NOT NULL, -- elections, voters, votes, users, etc.
  resource_id UUID, -- ID de la ressource concernée

  -- Détails
  category TEXT NOT NULL, -- AUTH, ELECTIONS, VOTERS, VOTING, etc.
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  description TEXT NOT NULL,

  -- Données avant/après (pour traçabilité)
  old_data JSONB, -- État avant modification
  new_data JSONB, -- État après modification
  metadata JSONB, -- Métadonnées supplémentaires

  -- Quand
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Index pour performances
  CONSTRAINT audit_logs_action_check CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
    'VOTE', 'LOGIN', 'LOGOUT', 'REGISTER',
    'INVITE', 'REVOKE', 'CLOSE', 'ARCHIVE',
    'EXPORT', 'IMPORT'
  ))
);

-- Indexes pour recherches rapides
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- RLS: Seuls les admins et le propriétaire peuvent voir les logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les créateurs d'élection peuvent voir les logs de leurs élections
CREATE POLICY "Election creators can view their election logs"
  ON audit_logs
  FOR SELECT
  USING (
    resource_type = 'elections'
    AND resource_id IN (
      SELECT id FROM elections WHERE creator_id = auth.uid()
    )
  );

-- Policy: Seul le système peut insérer des logs (via service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Fonction pour nettoyer les vieux logs (>1 an)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

-- Commentaires pour documentation
COMMENT ON TABLE audit_logs IS 'Table de traçabilité pour toutes les actions importantes (RGPD, sécurité)';
COMMENT ON COLUMN audit_logs.user_id IS 'ID de l''utilisateur ayant effectué l''action';
COMMENT ON COLUMN audit_logs.action IS 'Type d''action effectuée (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type de ressource concernée (elections, voters, votes)';
COMMENT ON COLUMN audit_logs.severity IS 'Niveau de sévérité (info, warning, error, critical)';
COMMENT ON COLUMN audit_logs.old_data IS 'État de la ressource avant modification (pour rollback potentiel)';
COMMENT ON COLUMN audit_logs.new_data IS 'État de la ressource après modification';
