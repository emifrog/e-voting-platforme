import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Election = Database['public']['Tables']['elections']['Row']
export type Candidate = Database['public']['Tables']['candidates']['Row']
export type Voter = Database['public']['Tables']['voters']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Webhook = Database['public']['Tables']['webhooks']['Row']

export type VoteType = 'simple' | 'approval' | 'ranked' | 'list'
export type ElectionStatus = 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface ElectionWithCandidates extends Election {
  candidates: Candidate[]
}

export interface ElectionWithStats extends Election {
  total_voters: number
  total_votes: number
  participation_rate: number
}

export interface VoteData {
  election_id: string
  candidate_ids: string[]  // For simple/approval voting
  rankings?: Record<string, number>  // For ranked voting
}

export interface ElectionResults {
  election: Election
  candidates: Array<{
    candidate: Candidate
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

// Types pour l'export
export interface CandidateResult {
  id: string
  name: string
  description?: string | null
  votes: number
  percentage: number
  isWinner: boolean
  isTied: boolean
}

export interface QuorumInfo {
  type: 'percentage' | 'absolute' | 'weighted'
  required: number
  reached: boolean
}

export interface ExportElectionResults {
  election: {
    id: string
    title: string
    description?: string | null
    vote_type: VoteType
    status: ElectionStatus
    start_date: string
    end_date: string
    created_at: string
  }
  candidates: CandidateResult[]
  stats: {
    totalVoters: number
    totalVotes: number
    participationRate: number
    abstentions?: number
    blanks?: number
    quorum?: QuorumInfo
  }
}
