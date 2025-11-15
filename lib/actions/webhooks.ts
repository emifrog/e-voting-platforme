'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { testWebhook as testWebhookService } from '@/lib/services/webhooks'
import crypto from 'crypto'

export interface WebhookFormData {
  name: string
  url: string
  events: string[]
  secret?: string
  is_active: boolean
}

/**
 * Créer un nouveau webhook
 */
export async function createWebhook(formData: WebhookFormData) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Générer un secret si non fourni
    const secret = formData.secret || crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: user.id,
        name: formData.name,
        url: formData.url,
        events: formData.events,
        secret,
        is_active: formData.is_active,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings/webhooks')
    return { success: true, data }
  } catch (error) {
    console.error('Erreur création webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Mettre à jour un webhook
 */
export async function updateWebhook(
  webhookId: string,
  formData: Partial<WebhookFormData>
) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { data, error } = await supabase
      .from('webhooks')
      .update(formData)
      .eq('id', webhookId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings/webhooks')
    return { success: true, data }
  } catch (error) {
    console.error('Erreur mise à jour webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Supprimer un webhook
 */
export async function deleteWebhook(webhookId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings/webhooks')
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Toggle actif/inactif d'un webhook
 */
export async function toggleWebhook(webhookId: string, isActive: boolean) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: isActive })
      .eq('id', webhookId)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/settings/webhooks')
    return { success: true }
  } catch (error) {
    console.error('Erreur toggle webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Tester un webhook
 */
export async function testWebhook(webhookId: string) {
  try {
    const result = await testWebhookService(webhookId)
    revalidatePath('/settings/webhooks')
    return result
  } catch (error) {
    console.error('Erreur test webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Récupérer tous les webhooks de l'utilisateur
 */
export async function getUserWebhooks() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié', data: [] }
    }

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erreur récupération webhooks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      data: [],
    }
  }
}
