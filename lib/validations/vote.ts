import { z } from 'zod'

export const castVoteSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  candidateIds: z.array(z.string().uuid()).min(1, 'Sélectionnez au moins un candidat'),
  rankings: z.record(z.string(), z.number()).optional(), // For ranked voting
})

export const verifyVoteSchema = z.object({
  voteHash: z.string().min(1, 'Hash de vote requis'),
})

export type CastVoteInput = z.infer<typeof castVoteSchema>
export type VerifyVoteInput = z.infer<typeof verifyVoteSchema>
