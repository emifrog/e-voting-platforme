-- ============================================
-- Phase 4D - Push Notifications
-- Migration pour ajouter le support des notifications push web
-- ============================================

-- Table pour stocker les subscriptions push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Push subscription data (from PushSubscription API)
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- {p256dh: string, auth: string}

  -- Metadata
  user_agent TEXT, -- Browser/device info
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one user can have multiple devices
  CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push API subscriptions for browser notifications';

-- Index pour recherche rapide par user_id
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- ============================================
-- RLS Policies pour push_subscriptions
-- ============================================

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Fonction pour nettoyer les subscriptions inactives
-- ============================================

CREATE OR REPLACE FUNCTION clean_inactive_push_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les subscriptions inactives depuis plus de 90 jours
  DELETE FROM public.push_subscriptions
  WHERE is_active = FALSE
    AND updated_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clean_inactive_push_subscriptions IS 'Cleanup inactive push subscriptions older than 90 days';

-- ============================================
-- Fonction pour mettre à jour updated_at automatiquement
-- ============================================

-- Créer la fonction si elle n'existe pas déjà
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.handle_updated_at IS 'Automatically update updated_at timestamp';

-- ============================================
-- Trigger pour updated_at
-- ============================================

DROP TRIGGER IF EXISTS set_updated_at ON public.push_subscriptions;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Amélioration de la table webhooks (optionnel)
-- Ajouter une colonne pour le type de plateforme
-- ============================================

-- Ajouter colonne platform si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhooks'
    AND column_name = 'platform'
  ) THEN
    ALTER TABLE public.webhooks
    ADD COLUMN platform TEXT CHECK (platform IN ('generic', 'teams', 'slack', 'zoom', 'discord'));

    COMMENT ON COLUMN public.webhooks.platform IS 'Webhook platform type for automatic formatting';
  END IF;
END $$;

-- Mettre à jour les webhooks existants
UPDATE public.webhooks
SET platform = 'generic'
WHERE platform IS NULL;
