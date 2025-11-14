-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.profiles_sensitive_fields_unchanged(
  target_id uuid,
  new_stripe_customer_id text,
  new_subscription_plan text,
  new_subscription_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_role text := current_setting('request.jwt.claim.role', true);
  old_stripe_customer_id text;
  old_subscription_plan text;
  old_subscription_status text;
BEGIN
  IF requester_role = 'service_role' THEN
    RETURN TRUE;
  END IF;

  SELECT
    stripe_customer_id,
    subscription_plan,
    subscription_status
  INTO
    old_stripe_customer_id,
    old_subscription_plan,
    old_subscription_status
  FROM public.profiles
  WHERE id = target_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN
    old_stripe_customer_id IS NOT DISTINCT FROM new_stripe_customer_id
    AND old_subscription_plan IS NOT DISTINCT FROM new_subscription_plan
    AND old_subscription_status IS NOT DISTINCT FROM new_subscription_status;
END;
$$;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (except sensitive fields)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND public.profiles_sensitive_fields_unchanged(
    id,
    stripe_customer_id,
    subscription_plan,
    subscription_status
  )
);

-- ============================================
-- ELECTIONS POLICIES
-- ============================================

-- Users can view their own elections
CREATE POLICY "Users can view own elections"
ON public.elections FOR SELECT
USING (auth.uid() = creator_id);

-- Users can create elections (respecting plan limits)
CREATE POLICY "Users can create elections"
ON public.elections FOR INSERT
WITH CHECK (
  auth.uid() = creator_id
  AND (
    -- Check if user is within their election limit
    SELECT
      CASE
        WHEN p.subscription_plan = 'free' THEN (
          SELECT COUNT(*) FROM public.elections e
          WHERE e.creator_id = auth.uid()
          AND e.status != 'archived'
        ) < 3
        WHEN p.subscription_plan = 'starter' THEN (
          SELECT COUNT(*) FROM public.elections e
          WHERE e.creator_id = auth.uid()
          AND e.status != 'archived'
        ) < 10
        ELSE TRUE  -- pro/enterprise: unlimited
      END
    FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);

-- Users can update their own draft/scheduled elections
CREATE POLICY "Users can update own elections"
ON public.elections FOR UPDATE
USING (
  auth.uid() = creator_id
  AND status IN ('draft', 'scheduled')
);

-- Users can delete their own draft elections
CREATE POLICY "Users can delete own draft elections"
ON public.elections FOR DELETE
USING (
  auth.uid() = creator_id
  AND status = 'draft'
);

-- ============================================
-- CANDIDATES POLICIES
-- ============================================

-- Users can view candidates of their elections
CREATE POLICY "Users can view candidates of own elections"
ON public.candidates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = candidates.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Users can manage candidates of their draft elections
CREATE POLICY "Users can manage candidates"
ON public.candidates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = candidates.election_id
    AND e.creator_id = auth.uid()
    AND e.status IN ('draft', 'scheduled')
  )
);

-- ============================================
-- VOTERS POLICIES
-- ============================================

-- Election creators can view their voters
CREATE POLICY "Creators can view voters"
ON public.voters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = voters.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Election creators can add voters (respecting plan limits)
CREATE POLICY "Creators can add voters"
ON public.voters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.elections e
    JOIN public.profiles p ON p.id = e.creator_id
    WHERE e.id = voters.election_id
    AND e.creator_id = auth.uid()
    AND e.status IN ('draft', 'scheduled')
    AND (
      CASE
        WHEN p.subscription_plan = 'free' THEN (
          SELECT COUNT(*) FROM public.voters v
          WHERE v.election_id = voters.election_id
        ) < 50
        WHEN p.subscription_plan = 'starter' THEN (
          SELECT COUNT(*) FROM public.voters v
          WHERE v.election_id = voters.election_id
        ) < 500
        ELSE TRUE  -- pro/enterprise: unlimited
      END
    )
  )
);

-- Creators can update/delete voters before election starts
CREATE POLICY "Creators can manage voters"
ON public.voters FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = voters.election_id
    AND e.creator_id = auth.uid()
    AND e.status IN ('draft', 'scheduled')
  )
);

CREATE POLICY "Creators can delete voters"
ON public.voters FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = voters.election_id
    AND e.creator_id = auth.uid()
    AND e.status IN ('draft', 'scheduled')
  )
);

-- ============================================
-- VOTES POLICIES
-- ============================================

-- Election creators can view vote stats (but not content for secret ballots)
CREATE POLICY "Creators can view vote stats"
ON public.votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = votes.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Votes are inserted via API route (bypasses RLS with service role)
-- No INSERT policy needed

-- ============================================
-- WEBHOOKS POLICIES
-- ============================================

-- Users can view their own webhooks
CREATE POLICY "Users can view own webhooks"
ON public.webhooks FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own webhooks
CREATE POLICY "Users can manage own webhooks"
ON public.webhooks FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Users can view audit logs of their elections
CREATE POLICY "Users can view audit logs of own elections"
ON public.audit_logs FOR SELECT
USING (
  election_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.elections e
    WHERE e.id = audit_logs.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Audit logs are inserted via triggers/functions (service role)
