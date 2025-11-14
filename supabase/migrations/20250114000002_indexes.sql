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
