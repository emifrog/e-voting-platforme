-- Migration: Soft delete pour les élections
-- Permet d'archiver les élections au lieu de les supprimer définitivement

-- Ajouter la colonne deleted_at pour soft delete
ALTER TABLE elections
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Index pour filtrer les élections non supprimées
CREATE INDEX IF NOT EXISTS idx_elections_deleted_at ON elections(deleted_at);

-- Fonction pour soft delete une élection
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

-- Fonction pour restaurer une élection soft deleted
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

-- Fonction pour hard delete une élection (uniquement drafts sans votes)
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

-- Modifier les RLS policies pour exclure les élections soft deleted
DROP POLICY IF EXISTS "Elections are viewable by everyone" ON elections;

CREATE POLICY "Elections are viewable by everyone"
  ON elections
  FOR SELECT
  USING (deleted_at IS NULL);

-- Policy pour voir ses propres élections supprimées (pour restauration)
CREATE POLICY "Users can view their own deleted elections"
  ON elections
  FOR SELECT
  USING (creator_id = auth.uid() AND deleted_at IS NOT NULL);

-- Fonction pour nettoyer les élections soft deleted de plus de 90 jours
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
