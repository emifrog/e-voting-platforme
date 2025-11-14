-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: profiles
-- Extension de auth.users pour données additionnelles
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- 2FA
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret TEXT,
  backup_codes TEXT[],

  -- Subscription (Stripe)
  stripe_customer_id TEXT UNIQUE,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  subscription_end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Usage limits (based on plan)
  elections_limit INTEGER DEFAULT 3,  -- free: 3, starter: 10, pro: unlimited
  voters_per_election_limit INTEGER DEFAULT 50,  -- free: 50, starter: 500, pro: unlimited

  -- Metadata
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile data';

-- ============================================
-- TABLE: elections
-- ============================================
CREATE TABLE public.elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Basic information
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 500),
  description TEXT,

  -- Vote configuration
  vote_type TEXT NOT NULL CHECK (vote_type IN ('simple', 'approval', 'ranked', 'list')),
  is_secret BOOLEAN DEFAULT TRUE,
  is_weighted BOOLEAN DEFAULT FALSE,
  allow_abstention BOOLEAN DEFAULT TRUE,

  -- Quorum
  quorum_type TEXT DEFAULT 'none' CHECK (quorum_type IN ('none', 'percentage', 'absolute', 'weighted')),
  quorum_value INTEGER CHECK (quorum_value >= 0 AND quorum_value <= 100),
  quorum_reached BOOLEAN DEFAULT FALSE,

  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,

  CONSTRAINT valid_date_range CHECK (end_date > start_date),

  -- Meeting info
  meeting_platform TEXT CHECK (meeting_platform IN ('teams', 'zoom', 'custom')),
  meeting_url TEXT,
  meeting_password TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'closed', 'archived')),

  -- Results
  results_visible BOOLEAN DEFAULT TRUE,
  results_published_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED
);

COMMENT ON TABLE public.elections IS 'Elections/votes configuration';

CREATE INDEX idx_elections_search ON public.elections USING GIN(search_vector);

-- ============================================
-- TABLE: candidates
-- ============================================
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 500),
  description TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),

  -- For list voting
  list_name TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_position_per_election UNIQUE(election_id, position)
);

COMMENT ON TABLE public.candidates IS 'Election candidates/options';

-- ============================================
-- TABLE: voters
-- ============================================
CREATE TABLE public.voters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,

  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  name TEXT,
  weight NUMERIC(10,2) DEFAULT 1.0 CHECK (weight > 0),

  -- Unique voting token (secure random)
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Voting status
  has_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMPTZ,

  -- Invitation tracking
  invitation_sent_at TIMESTAMPTZ,
  invitation_opened_at TIMESTAMPTZ,  -- Email tracking pixel
  invitation_clicked_at TIMESTAMPTZ,  -- Link clicked

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_voter_per_election UNIQUE(election_id, email)
);

COMMENT ON TABLE public.voters IS 'Registered voters for elections';
COMMENT ON COLUMN public.voters.token IS 'Secure random token for voting (non-guessable)';

-- ============================================
-- TABLE: votes
-- ============================================
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,

  -- Encrypted vote data (for secret ballots)
  encrypted_vote TEXT NOT NULL,
  vote_hash TEXT UNIQUE NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,

  -- Metadata (can be anonymized for secret votes)
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_vote_per_voter UNIQUE(election_id, voter_id)
);

COMMENT ON TABLE public.votes IS 'Cast votes (encrypted for secret ballots)';
COMMENT ON COLUMN public.votes.encrypted_vote IS 'AES-256-GCM encrypted vote data';
COMMENT ON COLUMN public.votes.vote_hash IS 'SHA-256 hash for vote verification';

-- ============================================
-- TABLE: proxies (Procurations)
-- ============================================
CREATE TABLE public.proxies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,

  -- Donor (person giving proxy)
  donor_voter_id UUID NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  donor_email TEXT NOT NULL,

  -- Proxy holder (person receiving proxy)
  proxy_voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE,
  proxy_email TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'revoked', 'used')),
  validated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.proxies IS 'Proxy voting (procurations)';

-- ============================================
-- TABLE: invitations
-- ============================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN ('initial', 'reminder_7d', 'reminder_3d', 'reminder_1d', 'reminder_1h')),

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.invitations IS 'Scheduled email invitations and reminders';

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,

  action TEXT NOT NULL,

  -- Actor
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_ip INET,

  -- Details
  details JSONB DEFAULT '{}'::jsonb,

  -- Blockchain-like chain for immutability
  previous_hash TEXT,
  current_hash TEXT NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail with blockchain-like chain';

-- ============================================
-- TABLE: webhooks
-- ============================================
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,  -- For HMAC signature

  -- Subscribed events
  events TEXT[] NOT NULL DEFAULT ARRAY['election.created', 'vote.cast', 'election.closed'],

  is_active BOOLEAN DEFAULT TRUE,

  -- Stats
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.webhooks IS 'User-configured webhooks for event notifications';
