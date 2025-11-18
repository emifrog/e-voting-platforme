import { createAdminClient } from '@/lib/supabase/admin'
import { decryptVote } from './encryption'
import type { Election, Candidate, Vote, Voter } from '@/types/models'
import type { ElectionResults } from '@/types/models'

export async function calculateResults(electionId: string): Promise<ElectionResults | null> {
  const supabase = createAdminClient()

  // Single query with all related data using Supabase relations (4 queries → 1 query)
  const { data, error: electionError } = await supabase
    .from('elections')
    .select(`
      *,
      candidates (*),
      votes (*),
      voters (*)
    `)
    .eq('id', electionId)
    .single()

  if (electionError || !data) {
    return null
  }

  // Extract related data from single query result
  const election = data
  const electionData = data as any
  const candidatesData = (electionData.candidates as any[]) || []
  const votesData = (electionData.votes as any[]) || []
  const votersData = (electionData.voters as any[]) || []

  if (!candidatesData.length) {
    return null
  }

  // Decrypt and count votes
  const voteCounts: Record<string, number> = {}
  candidatesData.forEach((c: any) => {
    voteCounts[c.id] = 0
  })

  for (const vote of votesData) {
    try {
      const decrypted = decryptVote(
        vote.encrypted_vote,
        vote.iv,
        vote.auth_tag,
        electionId
      )

      // Count votes based on vote type
      if (electionData.vote_type === 'simple' || electionData.vote_type === 'approval') {
        decrypted.candidate_ids?.forEach((candidateId: string) => {
          if (voteCounts[candidateId] !== undefined) {
            voteCounts[candidateId]++
          }
        })
      } else if (electionData.vote_type === 'ranked') {
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
  const totalVotes = votesData.length
  let maxVotes = 0
  let winnerId: string | null = null

  const results = candidatesData.map((candidate) => {
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
  const totalVoters = votersData.length
  const votedCount = votersData.filter((v) => v.has_voted).length
  const participationRate = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0

  // Check quorum
  let quorumReached = false
  if (electionData.quorum_type === 'percentage') {
    quorumReached = participationRate >= (electionData.quorum_value || 0)
  } else if (electionData.quorum_type === 'absolute') {
    quorumReached = votedCount >= (electionData.quorum_value || 0)
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
