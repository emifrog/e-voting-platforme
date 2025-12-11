import { z } from 'zod'

export const createElectionSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(500, 'Le titre est trop long'),
  description: z.string().max(5000, 'La description est trop longue').optional(),
  voteType: z.enum(['simple', 'approval', 'ranked', 'list'], {
    required_error: 'Veuillez sélectionner un type de vote',
  }),
  isSecret: z.boolean().default(true),
  isWeighted: z.boolean().default(false),
  allowAbstention: z.boolean().default(true),
  quorumType: z.enum(['none', 'percentage', 'absolute', 'weighted']).default('none'),
  quorumValue: z.number().min(0).max(100).optional(),
  startDate: z.string().min(1, 'Date de début requise').transform((val) => {
    // Convertir datetime-local (YYYY-MM-DDTHH:mm) en ISO 8601
    if (!val.includes('Z') && !val.includes('+')) {
      return new Date(val).toISOString()
    }
    return val
  }),
  endDate: z.string().min(1, 'Date de fin requise').transform((val) => {
    // Convertir datetime-local (YYYY-MM-DDTHH:mm) en ISO 8601
    if (!val.includes('Z') && !val.includes('+')) {
      return new Date(val).toISOString()
    }
    return val
  }),
  meetingPlatform: z.enum(['teams', 'zoom', 'custom']).optional(),
  meetingUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  meetingPassword: z.string().optional(),
  resultsVisible: z.boolean().default(true),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'La date de fin doit être après la date de début',
    path: ['endDate'],
  }
).refine(
  (data) => {
    if (data.quorumType !== 'none' && !data.quorumValue) {
      return false
    }
    return true
  },
  {
    message: 'Valeur de quorum requise',
    path: ['quorumValue'],
  }
)

export const updateElectionSchema = z.object({
  title: z.string().min(3).max(500).optional(),
  description: z.string().max(5000).optional(),
  voteType: z.enum(['simple', 'approval', 'ranked', 'list']).optional(),
  isSecret: z.boolean().optional(),
  isWeighted: z.boolean().optional(),
  allowAbstention: z.boolean().optional(),
  quorumType: z.enum(['none', 'percentage', 'absolute', 'weighted']).optional(),
  quorumValue: z.number().min(0).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  meetingPlatform: z.enum(['teams', 'zoom', 'custom']).optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  meetingPassword: z.string().optional(),
  resultsVisible: z.boolean().optional(),
}).partial()

export const addCandidateSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du candidat est requis')
    .max(500, 'Le nom est trop long'),
  description: z.string().max(5000, 'La description est trop longue').optional(),
  position: z.number().int().min(0),
  listName: z.string().optional(),
})

export const updateCandidateSchema = addCandidateSchema.partial()

export type CreateElectionInput = z.infer<typeof createElectionSchema>
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>
export type AddCandidateInput = z.infer<typeof addCandidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>
