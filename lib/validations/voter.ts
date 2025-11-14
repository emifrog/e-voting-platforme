import { z } from 'zod'

export const addVoterSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  weight: z.number().positive('Le poids doit être positif').default(1.0),
})

export const updateVoterSchema = addVoterSchema.partial()

export const importVotersSchema = z.object({
  file: z.any(), // File validation will be done in the handler
  electionId: z.string().uuid('ID d\'élection invalide'),
})

export const csvVoterSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(1, 'Le nom est requis'),
  weight: z.string().optional().transform((val) => val ? parseFloat(val) : 1.0),
})

export type AddVoterInput = z.infer<typeof addVoterSchema>
export type UpdateVoterInput = z.infer<typeof updateVoterSchema>
export type CSVVoterInput = z.infer<typeof csvVoterSchema>
