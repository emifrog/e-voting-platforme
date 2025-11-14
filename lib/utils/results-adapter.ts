/**
 * Adapte les résultats DB vers le format ElectionResults pour les exports
 */

import type { ExportElectionResults, CandidateResult } from '@/types/models'

interface DBResults {
  election: any
  candidates: Array<{
    candidate: any
    vote_count: number
    percentage: number
    is_winner: boolean
  }>
  stats: {
    total_voters: number
    total_votes: number
    participation_rate: number
    quorum_reached: boolean
  }
}

export function adaptResultsForExport(dbResults: DBResults): ExportElectionResults {
  const candidates: CandidateResult[] = dbResults.candidates.map((result) => ({
    id: result.candidate.id,
    name: result.candidate.name,
    description: result.candidate.description,
    votes: result.vote_count,
    percentage: result.percentage,
    isWinner: result.is_winner,
    isTied: false, // TODO: implement tie detection
  }))

  // Determine quorum info
  const quorum = dbResults.election.quorum_type !== 'none'
    ? {
        type: dbResults.election.quorum_type,
        required: dbResults.election.quorum_value,
        reached: dbResults.stats.quorum_reached,
      }
    : undefined

  return {
    election: {
      id: dbResults.election.id,
      title: dbResults.election.title,
      description: dbResults.election.description,
      vote_type: dbResults.election.vote_type,
      status: dbResults.election.status,
      start_date: dbResults.election.start_date,
      end_date: dbResults.election.end_date,
      created_at: dbResults.election.created_at,
    },
    candidates,
    stats: {
      totalVoters: dbResults.stats.total_voters,
      totalVotes: dbResults.stats.total_votes,
      participationRate: dbResults.stats.participation_rate,
      abstentions: dbResults.stats.total_voters - dbResults.stats.total_votes,
      quorum,
    },
  }
}
