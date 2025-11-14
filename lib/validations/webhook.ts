import { z } from 'zod'

export const createWebhookSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  url: z.string().url('URL invalide'),
  secret: z.string().optional(),
  events: z.array(z.string()).min(1, 'Sélectionnez au moins un événement'),
  isActive: z.boolean().default(true),
})

export const updateWebhookSchema = createWebhookSchema.partial()

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>
