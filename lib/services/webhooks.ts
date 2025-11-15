import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const WEBHOOKS_TABLE = 'webhooks' as const
type WebhookTable = Database['public']['Tables'][typeof WEBHOOKS_TABLE]
type WebhookRow = WebhookTable['Row']
type WebhookUpdate = WebhookTable['Update']

export type WebhookEvent =
  | 'election.created'
  | 'election.updated'
  | 'election.started'
  | 'election.closed'
  | 'vote.cast'
  | 'voter.added'
  | 'results.published'

export interface WebhookPayload {
  event: WebhookEvent
  data: any
  timestamp: string
  electionId?: string
  userId?: string
}

/**
 * Générer une signature HMAC SHA-256 pour un payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Dispatcher un événement webhook vers toutes les URLs abonnées
 */
export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: any,
  electionId?: string
): Promise<void> {
  try {
    const supabase: SupabaseClient<Database> = createAdminClient()
    const webhooksTable = supabase.from(WEBHOOKS_TABLE) as any

    // Récupérer les webhooks actifs de l'utilisateur abonnés à cet événement
    const { data: webhooks, error } = await webhooksTable
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [event])

    if (error || !webhooks || webhooks.length === 0) {
      return
    }

    const typedWebhooks = webhooks as WebhookRow[]

    // Créer le payload
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      electionId,
      userId,
    }

    const payloadString = JSON.stringify(payload)

    // Envoyer à chaque webhook
    const promises = typedWebhooks.map(async (webhook) => {
      try {
        // Générer la signature si un secret est configuré
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'User-Agent': 'E-Voting-Webhook/1.0',
          'X-Webhook-Event': event,
          'X-Webhook-Timestamp': payload.timestamp,
        }

        if (webhook.secret) {
          const signature = generateSignature(payloadString, webhook.secret)
          headers['X-Webhook-Signature'] = signature
        }

        // Envoyer la requête POST
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payloadString,
          signal: AbortSignal.timeout(10000), // Timeout 10s
        })

        // Mettre à jour les statistiques
        if (response.ok) {
          const successUpdate: WebhookUpdate = {
            success_count: webhook.success_count + 1,
            last_triggered_at: new Date().toISOString(),
          }

          await webhooksTable
            .update(successUpdate)
            .eq('id', webhook.id)

          console.log(`✅ Webhook ${webhook.name} envoyé avec succès`)
        } else {
          const failureUpdate: WebhookUpdate = {
            failure_count: webhook.failure_count + 1,
            last_triggered_at: new Date().toISOString(),
          }

          await webhooksTable
            .update(failureUpdate)
            .eq('id', webhook.id)

          console.error(
            `❌ Webhook ${webhook.name} échoué: ${response.status} ${response.statusText}`
          )
        }
      } catch (error) {
        // Incrémenter le compteur d'échecs
        const failureUpdate: WebhookUpdate = {
          failure_count: webhook.failure_count + 1,
          last_triggered_at: new Date().toISOString(),
        }

        await webhooksTable
          .update(failureUpdate)
          .eq('id', webhook.id)

        console.error(`❌ Erreur envoi webhook ${webhook.name}:`, error)
      }
    })

    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Erreur dispatch webhook:', error)
  }
}

/**
 * Tester un webhook en envoyant un événement de test
 */
export async function testWebhook(webhookId: string): Promise<{
  success: boolean
  statusCode?: number
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    // Récupérer le webhook
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (error || !webhook) {
      return { success: false, error: 'Webhook non trouvé' }
    }

    const webhookRecord = webhook as WebhookRow

    // Créer un payload de test
    const testPayload: WebhookPayload = {
      event: 'election.created',
      data: {
        test: true,
        message: 'Ceci est un test de webhook',
        webhookId,
      },
      timestamp: new Date().toISOString(),
      userId: webhookRecord.user_id,
    }

    const payloadString = JSON.stringify(testPayload)

    // Générer la signature
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'E-Voting-Webhook/1.0',
      'X-Webhook-Event': 'test',
      'X-Webhook-Timestamp': testPayload.timestamp,
      'X-Webhook-Test': 'true',
    }

    if (webhookRecord.secret) {
      const signature = generateSignature(payloadString, webhookRecord.secret)
      headers['X-Webhook-Signature'] = signature
    }

    // Envoyer la requête
    const response = await fetch(webhookRecord.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    })

    return {
      success: response.ok,
      statusCode: response.status,
      error: response.ok ? undefined : `${response.status} ${response.statusText}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Vérifier une signature de webhook (pour les endpoints qui reçoivent)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
