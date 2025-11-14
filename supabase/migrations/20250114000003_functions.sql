-- ============================================
-- FUNCTION: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Atomic vote casting
-- ============================================
CREATE OR REPLACE FUNCTION public.cast_vote_atomic(
  p_election_id UUID,
  p_voter_id UUID,
  p_encrypted_vote TEXT,
  p_vote_hash TEXT,
  p_iv TEXT,
  p_auth_tag TEXT,
  p_ip INET,
  p_user_agent TEXT
) RETURNS void AS $$
DECLARE
  v_has_voted BOOLEAN;
BEGIN
  -- Lock voter row
  SELECT has_voted INTO v_has_voted
  FROM voters
  WHERE id = p_voter_id
  FOR UPDATE;

  -- Check if already voted
  IF v_has_voted THEN
    RAISE EXCEPTION 'Already voted';
  END IF;

  -- Insert vote
  INSERT INTO votes (
    election_id,
    voter_id,
    encrypted_vote,
    vote_hash,
    iv,
    auth_tag,
    ip_address,
    user_agent
  ) VALUES (
    p_election_id,
    p_voter_id,
    p_encrypted_vote,
    p_vote_hash,
    p_iv,
    p_auth_tag,
    p_ip,
    p_user_agent
  );

  -- Update voter
  UPDATE voters
  SET has_voted = true, voted_at = NOW()
  WHERE id = p_voter_id;

  -- Create audit log
  INSERT INTO audit_logs (election_id, action, details)
  VALUES (p_election_id, 'vote.cast', jsonb_build_object('voter_id', p_voter_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Calculate election results
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_election_results(
  p_election_id UUID
)
RETURNS TABLE (
  candidate_id UUID,
  candidate_name TEXT,
  vote_count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  v_total_votes BIGINT;
BEGIN
  -- Get total votes
  SELECT COUNT(*) INTO v_total_votes
  FROM votes
  WHERE election_id = p_election_id;

  -- Return results (simplified - actual implementation depends on vote_type)
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    COUNT(v.id) as vote_count,
    CASE
      WHEN v_total_votes > 0 THEN (COUNT(v.id)::NUMERIC / v_total_votes::NUMERIC * 100)
      ELSE 0
    END as percentage
  FROM candidates c
  LEFT JOIN votes v ON v.election_id = c.election_id
  WHERE c.election_id = p_election_id
  GROUP BY c.id, c.name
  ORDER BY vote_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if quorum is reached
-- ============================================
CREATE OR REPLACE FUNCTION public.check_quorum(
  p_election_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_election RECORD;
  v_total_voters INTEGER;
  v_total_votes INTEGER;
  v_participation_rate NUMERIC;
BEGIN
  -- Get election info
  SELECT * INTO v_election
  FROM elections
  WHERE id = p_election_id;

  -- Count voters and votes
  SELECT COUNT(*) INTO v_total_voters
  FROM voters
  WHERE election_id = p_election_id;

  SELECT COUNT(*) INTO v_total_votes
  FROM votes
  WHERE election_id = p_election_id;

  -- Check based on quorum type
  CASE v_election.quorum_type
    WHEN 'none' THEN
      RETURN TRUE;

    WHEN 'percentage' THEN
      v_participation_rate := (v_total_votes::NUMERIC / v_total_voters::NUMERIC * 100);
      RETURN v_participation_rate >= v_election.quorum_value;

    WHEN 'absolute' THEN
      RETURN v_total_votes >= v_election.quorum_value;

    WHEN 'weighted' THEN
      -- TODO: Implement weighted quorum
      RETURN TRUE;

    ELSE
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql;
