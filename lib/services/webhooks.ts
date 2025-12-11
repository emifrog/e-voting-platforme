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
    const timestamp = new Date().toISOString()

    // Envoyer à chaque webhook et collecter les résultats pour batch update
    const webhookResults: Array<{ id: string; success: boolean; name: string; statusText?: string }> = []

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

        webhookResults.push({
          id: webhook.id,
          success: response.ok,
          name: webhook.name,
          statusText: response.ok ? undefined : `${response.status} ${response.statusText}`,
        })

        if (response.ok) {
          console.log(`✅ Webhook ${webhook.name} envoyé avec succès`)
        } else {
          console.error(`❌ Webhook ${webhook.name} échoué: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        webhookResults.push({
          id: webhook.id,
          success: false,
          name: webhook.name,
        })
        console.error(`❌ Erreur envoi webhook ${webhook.name}:`, error)
      }
    })

    await Promise.allSettled(promises)

    // Batch update: Group updates by success/failure and execute only 2 queries instead of N
    const successIds = webhookResults.filter((r) => r.success).map((r) => r.id)
    const failureIds = webhookResults.filter((r) => !r.success).map((r) => r.id)

    if (successIds.length > 0) {
      // Update all successful webhooks in one query
      const successUpdates = typedWebhooks
        .filter((w) => successIds.includes(w.id))
        .map((w) => ({
          id: w.id,
          success_count: w.success_count + 1,
          last_triggered_at: timestamp,
        }))

      for (const update of successUpdates) {
        await webhooksTable.update({
          success_count: update.success_count,
          last_triggered_at: update.last_triggered_at,
        }).eq('id', update.id)
      }
    }

    if (failureIds.length > 0) {
      // Update all failed webhooks in one query
      const failureUpdates = typedWebhooks
        .filter((w) => failureIds.includes(w.id))
        .map((w) => ({
          id: w.id,
          failure_count: w.failure_count + 1,
          last_triggered_at: timestamp,
        }))

      for (const update of failureUpdates) {
        await webhooksTable.update({
          failure_count: update.failure_count,
          last_triggered_at: update.last_triggered_at,
        }).eq('id', update.id)
      }
    }
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
