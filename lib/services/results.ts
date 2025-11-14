import { createAdminClient } from '@/lib/supabase/admin'
import { decryptVote } from './encryption'
import type { Election, Candidate, Vote, Voter } from '@/types/models'
import type { ElectionResults } from '@/types/models'

export async function calculateResults(electionId: string): Promise<ElectionResults | null> {
  const supabase = createAdminClient()

  // Get election
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('*')
    .eq('id', electionId)
    .single()

  if (electionError || !election) {
    return null
  }

  // Get candidates
  const { data: candidates } = await supabase
    .from('candidates')
    .select('*')
    .eq('election_id', electionId)
    .order('position')

  // Get votes
  const { data: votes } = await supabase
    .from('votes')
    .select('*')
    .eq('election_id', electionId)

  // Get voters
  const { data: voters } = await supabase
    .from('voters')
    .select('*')
    .eq('election_id', electionId)

  if (!candidates || !votes || !voters) {
    return null
  }

  // Decrypt and count votes
  const voteCounts: Record<string, number> = {}
  candidates.forEach((c) => {
    voteCounts[c.id] = 0
  })

  for (const vote of votes) {
    try {
      const decrypted = decryptVote(
        vote.encrypted_vote,
        vote.iv,
        vote.auth_tag,
        electionId
      )

      // Count votes based on vote type
      if (election.vote_type === 'simple' || election.vote_type === 'approval') {
        decrypted.candidate_ids?.forEach((candidateId: string) => {
          if (voteCounts[candidateId] !== undefined) {
            voteCounts[candidateId]++
          }
        })
      } else if (election.vote_type === 'ranked') {
        // For ranked voting, give points based on ranking
        // First choice: 3 points, Second: 2 points, Third: 1 point
        const rankings = decrypted.rankings || {}
        Object.entries(rankings).forEach(([candidateId, rank]) => {
          if (voteCounts[candidateId] !== undefined) {
            const points = Math.max(0, 4 - (rank as number))
            voteCounts[candidateId] += points
          }
        })
      }
    } catch (error) {
      console.error('Error decrypting vote:', error)
    }
  }

  // Calculate percentages and determine winner
  const totalVotes = votes.length
  let maxVotes = 0
  let winnerId: string | null = null

  const results = candidates.map((candidate) => {
    const voteCount = voteCounts[candidate.id] || 0
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0

    if (voteCount > maxVotes) {
      maxVotes = voteCount
      winnerId = candidate.id
    }

    return {
      candidate,
      vote_count: voteCount,
      percentage,
      is_winner: false, // Will be set below
    }
  })

  // Mark winner(s)
  results.forEach((r) => {
    r.is_winner = r.candidate.id === winnerId
  })

  // Calculate participation stats
  const totalVoters = voters.length
  const votedCount = voters.filter((v) => v.has_voted).length
  const participationRate = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0

  // Check quorum
  let quorumReached = false
  if (election.quorum_type === 'percentage') {
    quorumReached = participationRate >= (election.quorum_value || 0)
  } else if (election.quorum_type === 'absolute') {
    quorumReached = votedCount >= (election.quorum_value || 0)
  } else {
    quorumReached = true // No quorum or 'none' type
  }

  return {
    election,
    candidates: results.sort((a, b) => b.vote_count - a.vote_count),
    stats: {
      total_voters: totalVoters,
      total_votes: votedCount,
      participation_rate: participationRate,
      quorum_reached: quorumReached,
    },
  }
}
