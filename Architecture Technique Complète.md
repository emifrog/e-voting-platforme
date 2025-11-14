# 🏗️ Architecture Technique Complète - Monolithe Next.js + Supabase

**Version**: 2.0.0

**Date**: 14 Novembre 2025

**Status**: ✅ Production Ready

---

## 🎯 Vue d'ensemble de l'architecture

### Stack technique

**Monolithe Full-Stack**

- **Next.js 15** (App Router) - Framework React avec backend intégré
- **TypeScript 5** - Type safety complet
- **React 19** - UI avec Server Components

**Database & Backend**

- **Supabase** - PostgreSQL + Auth + Storage + Real-time
- **Row Level Security (RLS)** - Sécurité au niveau base de données
- **Edge Functions** - Serverless functions

**Frontend**

- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - Composants accessibles (Radix UI)
- **Lucide React** - Icônes

**Validation & Types**

- **Zod** - Runtime validation
- **TypeScript** - Compile-time type safety

### Pourquoi cette architecture ?

✅ **Simplicité opérationnelle**

- Un seul déploiement
- Un seul codebase
- Debugging simplifié
- Stack traces complètes

✅ **Performance**

- Pas de latence réseau inter-services
- Server Components pour hydratation optimale
- Edge caching Vercel
- CDN global automatique

✅ **Developer Experience**

- Hot reload complet (frontend + backend)
- Types partagés naturellement
- Refactoring facile
- Un seul package.json

✅ **Coûts réduits**

- Infrastructure minimale
- Pas d'orchestration (Kubernetes, etc.)
- Scaling automatique (Vercel)
- Free tier généreux (Supabase + Vercel)

---

## 📐 Architecture des Composants

### Diagramme de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js App (Browser)                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │   Pages    │  │ Components │  │   Hooks    │     │   │
│  │  │ (React 19) │  │ (shadcn/ui)│  │            │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  │           │              │              │            │   │
│  │           └──────────────┴──────────────┘            │   │
│  │                      │                               │   │
│  │              ┌───────▼────────┐                      │   │
│  │              │ Supabase Client│                      │   │
│  │              │   (Browser)    │                      │   │
│  │              └───────┬────────┘                      │   │
│  └──────────────────────┼───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ HTTPS / WebSocket
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    NEXT.JS SERVER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              App Router                              │   │
│  │  ┌────────────────┐  ┌──────────────────────┐       │   │
│  │  │  Pages (SSR)   │  │   API Routes         │       │   │
│  │  │  - Server      │  │   - /api/auth        │       │   │
│  │  │    Components  │  │   - /api/elections   │       │   │
│  │  │  - Streaming   │  │   - /api/votes       │       │   │
│  │  └────────────────┘  └──────────────────────┘       │   │
│  │           │                      │                   │   │
│  │           └──────────────────────┘                   │   │
│  │                      │                               │   │
│  │           ┌──────────▼──────────┐                    │   │
│  │           │  Server Actions     │                    │   │
│  │           │  - createElection() │                    │   │
│  │           │  - castVote()       │                    │   │
│  │           └──────────┬──────────┘                    │   │
│  │                      │                               │   │
│  │           ┌──────────▼──────────┐                    │   │
│  │           │ Supabase Client     │                    │   │
│  │           │   (Server)          │                    │   │
│  │           └──────────┬──────────┘                    │   │
│  └──────────────────────┼───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ PostgREST API
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      SUPABASE                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                PostgreSQL 15                         │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  Tables    │  │    RLS     │  │  Triggers  │     │   │
│  │  │  - users   │  │  Policies  │  │  Functions │     │   │
│  │  │  - elections│ │            │  │            │     │   │
│  │  │  - votes   │  │            │  │            │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Auth (GoTrue)                       │   │
│  │  - JWT tokens                                        │   │
│  │  - OAuth providers                                   │   │
│  │  - 2FA (TOTP)                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Storage (S3-compatible)                 │   │
│  │  - PDFs, exports                                     │   │
│  │  - Public/Private buckets                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Realtime (WebSocket)                     │   │
│  │  - Postgres changes                                  │   │
│  │  - Broadcast channels                                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Flux de données

**1. Lecture de données (SSR)**

```
User Request → Next.js Server → Supabase Server Client → PostgreSQL
                    ↓
            Server Component Render
                    ↓
            HTML Stream to Client
```

**2. Mutation de données (Server Action)**

```
User Action → Server Action → Validation (Zod) → Supabase
                                                      ↓
                                              PostgreSQL + RLS
                                                      ↓
                                              revalidatePath()
                                                      ↓
                                                  UI Update
```

**3. Vote (Chiffré)**

```
Voter → Vote Page → API Route (/api/votes/cast)
                         ↓
                  Verify Token
                         ↓
                  Encrypt Vote (AES-256)
                         ↓
                  Transaction SQL
                         ↓
              Insert vote + Update voter
                         ↓
                  Return Receipt
```

---

## 📁 Structure Détaillée du Projet

```
e-voting-platform/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Auth routes (layout group)
│   │   ├── login/
│   │   │   └── page.tsx          # Page de login
│   │   ├── register/
│   │   │   └── page.tsx          # Page d'inscription
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Layout auth (centered, no sidebar)
│   │
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard overview
│   │   ├── elections/
│   │   │   ├── page.tsx          # Liste élections
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Créer élection
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Détails élection
│   │   │       ├── edit/
│   │   │       │   └── page.tsx  # Éditer élection
│   │   │       ├── voters/
│   │   │       │   └── page.tsx  # Gérer électeurs
│   │   │       └── results/
│   │   │           └── page.tsx  # Résultats
│   │   ├── settings/
│   │   │   ├── page.tsx          # Settings généraux
│   │   │   ├── profile/
│   │   │   ├── security/         # 2FA, password
│   │   │   ├── billing/          # Stripe
│   │   │   └── webhooks/
│   │   └── layout.tsx            # Layout dashboard (with sidebar)
│   │
│   ├── (public)/                 # Public routes
│   │   ├── vote/
│   │   │   └── [token]/
│   │   │       └── page.tsx      # Interface de vote
│   │   ├── results/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Résultats publics
│   │   └── verify/
│   │       └── [hash]/
│   │           └── page.tsx      # Vérifier vote
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   ├── logout/
│   │   │   │   └── route.ts
│   │   │   └── 2fa/
│   │   │       ├── enable/
│   │   │       │   └── route.ts
│   │   │       └── verify/
│   │   │           └── route.ts
│   │   ├── elections/
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PUT, DELETE
│   │   │       ├── start/
│   │   │       │   └── route.ts
│   │   │       ├── close/
│   │   │       │   └── route.ts
│   │   │       └── results/
│   │   │           ├── route.ts
│   │   │           └── export/
│   │   │               └── route.ts
│   │   ├── voters/
│   │   │   ├── route.ts
│   │   │   ├── import/
│   │   │   │   └── route.ts      # CSV import
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── resend/
│   │   │           └── route.ts
│   │   ├── votes/
│   │   │   ├── cast/
│   │   │   │   └── route.ts      # Vote submission
│   │   │   └── verify/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   ├── route.ts
│   │   │   ├── test/
│   │   │   │   └── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── stripe/
│   │       ├── checkout/
│   │       │   └── route.ts
│   │       └── webhook/
│   │           └── route.ts      # Stripe webhooks
│   │
│   ├── globals.css                # Global styles + Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── tooltip.tsx
│   │
│   ├── elections/                 # Election components
│   │   ├── election-form.tsx
│   │   ├── election-card.tsx
│   │   ├── election-list.tsx
│   │   ├── candidate-form.tsx
│   │   ├── candidate-list.tsx
│   │   └── status-badge.tsx
│   │
│   ├── voters/                   # Voter components
│   │   ├── voter-table.tsx
│   │   ├── voter-row.tsx
│   │   ├── add-voter-dialog.tsx
│   │   ├── import-voters-dialog.tsx
│   │   └── voter-stats.tsx
│   │
│   ├── vote/                     # Vote components
│   │   ├── vote-interface.tsx
│   │   ├── vote-confirmation.tsx
│   │   ├── vote-receipt.tsx
│   │   └── vote-timer.tsx
│   │
│   ├── results/                  # Results components
│   │   ├── results-chart.tsx
│   │   ├── results-table.tsx
│   │   ├── results-podium.tsx
│   │   ├── winner-badge.tsx
│   │   └── export-buttons.tsx
│   │
│   ├── layout/                   # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── user-nav.tsx
│   │
│   └── providers/
│       ├── auth-provider.tsx
│       └── toast-provider.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   ├── middleware.ts        # Auth middleware
│   │   └── admin.ts             # Service role client
│   │
│   ├── db/
│   │   ├── schema.ts            # Database types
│   │   ├── queries/             # Query builders
│   │   │   ├── elections.ts
│   │   │   ├── voters.ts
│   │   │   ├── votes.ts
│   │   │   └── users.ts
│   │   └── mutations/           # Mutation helpers
│   │       ├── elections.ts
│   │       ├── voters.ts
│   │       └── votes.ts
│   │
│   ├── validations/             # Zod schemas
│   │   ├── election.ts
│   │   ├── voter.ts
│   │   ├── vote.ts
│   │   └── auth.ts
│   │
│   ├── services/                # Business logic
│   │   ├── encryption.ts        # AES-256 encryption
│   │   ├── email.ts            # Email service (Resend)
│   │   ├── pdf.ts              # PDF generation
│   │   ├── webhook.ts          # Webhook dispatcher
│   │   ├── csv.ts              # CSV parser
│   │   └── audit.ts            # Audit trail
│   │
│   ├── hooks/                   # React hooks
│   │   ├── use-elections.ts
│   │   ├── use-voters.ts
│   │   ├── use-auth.ts
│   │   ├── use-realtime.ts
│   │   └── use-toast.ts
│   │
│   ├── actions/                 # Server Actions
│   │   ├── elections.ts
│   │   ├── voters.ts
│   │   ├── auth.ts
│   │   └── settings.ts
│   │
│   └── utils.ts                 # Utility functions
│
├── types/
│   ├── database.ts              # Generated from Supabase
│   ├── models.ts                # Business models
│   └── api.ts                   # API types
│
├── supabase/
│   ├── migrations/              # SQL migrations
│   │   ├── 20250114000000_initial_schema.sql
│   │   ├── 20250114000001_rls_policies.sql
│   │   ├── 20250114000002_indexes.sql
│   │   ├── 20250114000003_functions.sql
│   │   └── 20250114000004_triggers.sql
│   │
│   ├── functions/               # Edge Functions
│   │   ├── send-invitation/
│   │   │   └── index.ts
│   │   ├── process-vote/
│   │   │   └── index.ts
│   │   └── scheduled-jobs/
│   │       └── index.ts
│   │
│   ├── seed.sql                 # Test data
│   └── config.toml              # Supabase config
│
├── public/
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json              # shadcn config
├── package.json
└── [README.md](http://README.md)
```

---

## 🗄️ Schéma Base de Données Complet

### Migration initiale

```sql
-- supabase/migrations/20250114000000_initial_schema.sql

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
  
  -- Metadata (can be anonymized for secret votes)
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_vote_per_voter UNIQUE(election_id, voter_id)
);

COMMENT ON TABLE public.votes IS 'Cast votes (encrypted for secret ballots)';
COMMENT ON COLUMN public.votes.encrypted_vote IS 'AES-256 encrypted vote data or plaintext JSON';
COMMENT ON COLUMN [public.votes.vote](http://public.votes.vote)_hash IS 'SHA-256 hash for vote verification';

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
```

### Indexes de performance

```sql
-- supabase/migrations/20250114000002_indexes.sql

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Elections
CREATE INDEX idx_elections_creator ON public.elections(creator_id);
CREATE INDEX idx_elections_status ON public.elections(status);
CREATE INDEX idx_elections_dates ON public.elections(start_date, end_date) WHERE status IN ('scheduled', 'active');
CREATE INDEX idx_elections_created ON public.elections(created_at DESC);

-- Candidates
CREATE INDEX idx_candidates_election ON public.candidates(election_id);
CREATE INDEX idx_candidates_position ON public.candidates(election_id, position);

-- Voters
CREATE INDEX idx_voters_election ON public.voters(election_id);
CREATE INDEX idx_voters_token ON public.voters(token);
CREATE INDEX idx_voters_email ON public.voters(election_id, email);
CREATE INDEX idx_voters_voted ON public.voters(election_id, has_voted);

-- Votes
CREATE INDEX idx_votes_election ON public.votes(election_id);
CREATE INDEX idx_votes_hash ON public.votes(vote_hash);
CREATE INDEX idx_votes_created ON public.votes(created_at DESC);

-- Proxies
CREATE INDEX idx_proxies_election ON public.proxies(election_id);
CREATE INDEX idx_proxies_donor ON public.proxies(donor_voter_id);
CREATE INDEX idx_proxies_proxy ON public.proxies(proxy_voter_id) WHERE proxy_voter_id IS NOT NULL;
CREATE INDEX idx_proxies_status ON public.proxies(status) WHERE status = 'validated';

-- Invitations
CREATE INDEX idx_invitations_scheduled ON public.invitations(scheduled_at, status) WHERE status = 'pending';
CREATE INDEX idx_invitations_election ON public.invitations(election_id);

-- Audit logs
CREATE INDEX idx_audit_election ON public.audit_logs(election_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id) WHERE actor_id IS NOT NULL;

-- Webhooks
CREATE INDEX idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX idx_webhooks_active ON public.webhooks(is_active) WHERE is_active = TRUE;
```

---

## 🔐 Sécurité - Row Level Security (RLS)

### Policies RLS complètes

```sql
-- supabase/migrations/20250114000001_rls_policies.sql

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
  -- Cannot directly modify these fields
  AND stripe_customer_id = OLD.stripe_customer_id
  AND subscription_plan = OLD.subscription_plan
  AND subscription_status = OLD.subscription_status
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
    WHERE [p.id](http://p.id) = auth.uid()
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
    WHERE [e.id](http://e.id) = candidates.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Users can manage candidates of their draft elections
CREATE POLICY "Users can manage candidates"
ON public.candidates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE [e.id](http://e.id) = candidates.election_id
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
    WHERE [e.id](http://e.id) = voters.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Election creators can add voters (respecting plan limits)
CREATE POLICY "Creators can add voters"
ON public.voters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.elections e
    JOIN public.profiles p ON [p.id](http://p.id) = e.creator_id
    WHERE [e.id](http://e.id) = voters.election_id
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
    WHERE [e.id](http://e.id) = voters.election_id
    AND e.creator_id = auth.uid()
    AND e.status IN ('draft', 'scheduled')
  )
);

CREATE POLICY "Creators can delete voters"
ON public.voters FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.elections e
    WHERE [e.id](http://e.id) = voters.election_id
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
    WHERE [e.id](http://e.id) = votes.election_id
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
    WHERE [e.id](http://e.id) = audit_logs.election_id
    AND e.creator_id = auth.uid()
  )
);

-- Audit logs are inserted via triggers/functions (service role)
```

### Bonnes pratiques de sécurité

**1. Tokens sécurisés**

```tsx
// lib/services/security.ts
import crypto from 'crypto';

// Generate cryptographically secure random token
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Voter tokens are generated at DB level with gen_random_bytes()
// Never use Math.random() or uuid for security tokens
```

**2. Rate limiting**

```tsx
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different limits for different endpoints
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),  // 5 attempts per 15 min
  prefix: 'auth',
});

export const voteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'),  // 3 votes per minute
  prefix: 'vote',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),  // 100 requests per 15 min
  prefix: 'api',
});
```

**3. Input validation (Zod)**

```tsx
// lib/validations/election.ts
import { z } from 'zod';

export const createElectionSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(500, 'Title too long')
    .trim(),
  description: z.string().max(5000).optional(),
  voteType: z.enum(['simple', 'approval', 'ranked', 'list']),
  isSecret: z.boolean().default(true),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);
```

**4. XSS Prevention**

```tsx
// React automatically escapes content
// But for user-generated HTML (descriptions), use DOMPurify
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}
```

**5. CSRF Protection**

```tsx
// Next.js API routes automatically include CSRF protection
// For additional security, verify Origin header

export function verifySameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (!origin) return false;
  
  const originHost = new URL(origin).host;
  return originHost === host;
}
```

---

## ⚡ Performance & Optimisations

### 1. Caching Strategy

**Edge Caching (Vercel)**

```tsx
// app/elections/[id]/page.tsx
import { unstable_cache } from 'next/cache';

// Cache election data for 60 seconds
const getElection = unstable_cache(
  async (id: string) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  },
  ['election'],
  {
    revalidate: 60,
    tags: ['elections'],
  }
);
```

**Redis Caching**

```tsx
// lib/cache/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function cacheElectionResults(
  electionId: string,
  results: any,
  ttl: number = 3600  // 1 hour
) {
  await redis.setex(`results:${electionId}`, ttl, JSON.stringify(results));
}

export async function getCachedResults(electionId: string) {
  const cached = await redis.get(`results:${electionId}`);
  return cached ? JSON.parse(cached as string) : null;
}
```

### 2. Database Query Optimization

**Use indexes strategically**

```sql
-- Composite indexes for common queries
CREATE INDEX idx_voters_election_voted 
ON public.voters(election_id, has_voted);

-- Partial indexes for specific conditions
CREATE INDEX idx_elections_active 
ON public.elections(created_at DESC) 
WHERE status = 'active';
```

**Pagination**

```tsx
// lib/db/queries/elections.ts
export async function getElections({
  userId,
  page = 1,
  limit = 20,
}: {
  userId: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, count } = await supabase
    .from('elections')
    .select('*', { count: 'exact' })
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}
```

**Select only needed columns**

```tsx
// ❌ Bad: Select all columns
await supabase.from('elections').select('*');

// ✅ Good: Select only what you need
await supabase.from('elections').select('id, title, status, created_at');
```

### 3. Code Splitting

```tsx
// app/elections/[id]/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const ResultsChart = dynamic(() => import('@/components/results/results-chart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false,  // Don't render on server
});

// Lazy load modals
const ExportDialog = dynamic(() => import('@/components/results/export-dialog'));
```

### 4. Image Optimization

```tsx
import Image from 'next/image';

// Use Next.js Image component
<Image
  src="/hero.png"
  alt="E-Voting Platform"
  width={1200}
  height={630}
  priority  // LCP optimization
  placeholder="blur"  // Show blur while loading
/>
```

### 5. Bundle Size Optimization

```jsx
// next.config.js
module.exports = {
  // Analyze bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace heavy libraries
        'moment': 'dayjs',
      };
    }
    return config;
  },
  
  // Tree shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
};
```

### 6. Server Components vs Client Components

```tsx
// ✅ Server Component (default in App Router)
// Fetches data on server, no JS sent to client
export default async function ElectionPage({ params }: { params: { id: string } }) {
  const election = await getElection([params.id](http://params.id));
  
  return (
    <div>
      <h1>{election.title}</h1>
      {/* This is also a Server Component */}
      <ElectionStats election={election} />
      
      {/* Client Component for interactivity */}
      <VoteButton electionId={[election.id](http://election.id)} />
    </div>
  );
}

// ✅ Client Component (when needed)
'use client';

export function VoteButton({ electionId }: { electionId: string }) {
  const [loading, setLoading] = useState(false);
  
  return (
    <Button onClick={handleVote} disabled={loading}>
      Vote Now
    </Button>
  );
}
```

### 7. Streaming & Suspense

```tsx
import { Suspense } from 'react';

export default function ElectionPage() {
  return (
    <div>
      {/* Fast: Show immediately */}
      <ElectionHeader />
      
      {/* Slow: Stream in */}
      <Suspense fallback={<Skeleton />}>
        <ElectionResults />
      </Suspense>
      
      {/* Also slow: Stream independently */}
      <Suspense fallback={<Skeleton />}>
        <RecentVotes />
      </Suspense>
    </div>
  );
}
```

---

## 🔧 Détails Opérationnels

### Configuration Supabase

**1. Setup initial**

```bash
# Installer CLI
npm install -g supabase

# Login
supabase login

# Init project local
supabase init

# Link to cloud project
supabase link --project-ref your-project-ref

# Start local dev
supabase start

# Push migrations
supabase db push

# Generate types
supabase gen types typescript --project-id your-project-ref > types/database.ts
```

**2. Environment variables**

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=[https://xxxxx.supabase.co](https://xxxxx.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Never expose to client!

# Database direct connection (for migrations)
DATABASE_URL=postgresql://postgres:[password]@[db.xxxxx.supabase.co:5432/postgres](http://db.xxxxx.supabase.co:5432/postgres)

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key-here
JWT_SECRET=your-jwt-secret

# Email (Resend)
RESEND_API_KEY=re_xxx
[EMAIL_FROM=noreply@yourdomain.com](mailto:EMAIL_FROM=noreply@yourdomain.com)

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Redis (Upstash)
UPSTASH_REDIS_URL=[https://xxx.upstash.io](https://xxx.upstash.io)
UPSTASH_REDIS_TOKEN=xxx

# App
NEXT_PUBLIC_SITE_URL=[http://localhost:3000](http://localhost:3000)
NODE_ENV=development
```

### Déploiement Vercel

**1. Configuration vercel.json**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**2. Déploiement**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Monitoring & Observability

**1. Sentry (Error tracking)**

```tsx
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: [process.env.NEXT](http://process.env.NEXT)_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**2. Vercel Analytics**

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**3. Custom logging**

```tsx
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  browser: {
    asObject: true,
  },
});

// Usage
[logger.info](http://logger.info)({ electionId, userId }, 'Election created');
logger.error({ error, electionId }, 'Failed to cast vote');
```

### Backup & Disaster Recovery

**1. Database backups (Supabase)**

- Automatic daily backups (retained 7 days on free tier)
- Point-in-time recovery (Pro plan)
- Manual backups via CLI:

```bash
supabase db dump -f backup.sql
```

**2. Regular testing**

```bash
# Test restore locally
supabase db reset
psql $DATABASE_URL < backup.sql
```

### Scaling Considerations

**Quand scaler ?**

- > 100,000 users actifs
- > 1000 élections actives simultanées
- > 10,000 votes/heure

**Comment scaler ?**

1. **Database**:
    - Upgrade Supabase plan (more CPU/RAM)
    - Read replicas pour reads intensifs
    - Connection pooling (PgBouncer)
2. **Application**:
    - Vercel scale automatiquement
    - Pas d'action nécessaire jusqu'à millions de requêtes
3. **Caching**:
    - Redis pour sessions, results
    - CDN pour assets statiques

---

## ✅ Checklist Développement

### Phase 1: Setup (Semaine 1)

- [ ]  Créer projet Next.js avec TypeScript
- [ ]  Setup Supabase (projet cloud + local dev)
- [ ]  Migrations initiales (tables + RLS + indexes)
- [ ]  Configuration shadcn/ui
- [ ]  Setup Tailwind + design system
- [ ]  Configurer ESLint + Prettier

### Phase 2: Auth (Semaine 2)

- [ ]  Page login/register
- [ ]  Auth middleware
- [ ]  Protected routes
- [ ]  2FA (TOTP)
- [ ]  Password reset
- [ ]  Email verification

### Phase 3: Core Features (Semaines 3-6)

- [ ]  Dashboard
- [ ]  CRUD Élections
- [ ]  Gestion candidats
- [ ]  Gestion électeurs (CRUD + import CSV)
- [ ]  Interface de vote
- [ ]  Chiffrement votes
- [ ]  Résultats & visualisations

### Phase 4: Features Avancées (Semaines 7-10)

- [ ]  Real-time updates (Supabase subscriptions)
- [ ]  Export PDF
- [ ]  Webhooks
- [ ]  Procurations
- [ ]  Email reminders
- [ ]  Audit trail

### Phase 5: Billing (Semaines 11-12)

- [ ]  Intégration Stripe
- [ ]  Plans & pricing
- [ ]  Usage limits
- [ ]  Billing portal

### Phase 6: Production (Semaines 13-16)

- [ ]  Tests (unit + integration + e2e)
- [ ]  Performance optimization
- [ ]  SEO optimization
- [ ]  Documentation
- [ ]  Déploiement Vercel
- [ ]  Monitoring (Sentry)
- [ ]  Analytics

---

## 📦 Dependencies

```json
{
  "name": "e-voting-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "db:generate-types": "supabase gen types typescript --project-id your-ref > types/database.ts",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "recharts": "^2.12.0",
    "date-fns": "^3.3.0",
    "lucide-react": "^0.344.0",
    "@upstash/ratelimit": "^1.0.0",
    "@upstash/redis": "^1.28.0",
    "resend": "^3.2.0",
    "stripe": "^14.14.0",
    "papaparse": "^5.4.1",
    "pdfkit": "^0.14.0",
    "react-pdf": "^7.7.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/papaparse": "^5.3.14",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^4",
    "eslint": "^8",
    "eslint-config-next": "15.0.0",
    "prettier": "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.11",
    "@testing-library/react": "^14.2.1",
    "@testing-library/jest-dom": "^6.3.0",
    "jest": "^29.7.0",
    "@playwright/test": "^1.41.0",
    "supabase": "^1.142.2"
  }
}
```