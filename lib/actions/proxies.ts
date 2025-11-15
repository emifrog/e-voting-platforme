'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { sendProxyRequestEmail, sendProxyConfirmationEmail } from '@/lib/services/email'

export interface ProxyFormData {
  electionId: string
  donorEmail: string
  proxyEmail: string
}

/**
 * Créer une demande de procuration
 */
export async function createProxy(formData: ProxyFormData) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { electionId, donorEmail, proxyEmail } = formData

    // Vérifier que l'élection existe et appartient à l'utilisateur
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('id, title, creator_id')
      .eq('id', electionId)
      .eq('creator_id', user.id)
      .single()

    if (electionError || !election) {
      return { success: false, error: 'Élection non trouvée' }
    }

    // Vérifier que les deux électeurs existent
    const { data: donorVoter, error: donorError } = await supabase
      .from('voters')
      .select('id, email, name')
      .eq('election_id', electionId)
      .eq('email', donorEmail)
      .single()

    if (donorError || !donorVoter) {
      return { success: false, error: 'Électeur donneur non trouvé' }
    }

    const { data: proxyVoter, error: proxyError } = await supabase
      .from('voters')
      .select('id, email, name')
      .eq('election_id', electionId)
      .eq('email', proxyEmail)
      .single()

    if (proxyError || !proxyVoter) {
      return { success: false, error: 'Électeur mandataire non trouvé' }
    }

    // Vérifier que le donneur n'a pas déjà voté
    if (donorVoter.has_voted) {
      return { success: false, error: 'Le donneur a déjà voté' }
    }

    // Vérifier qu'il n'y a pas déjà une procuration active
    const { data: existingProxy } = await supabase
      .from('proxies')
      .select('id')
      .eq('election_id', electionId)
      .eq('donor_voter_id', donorVoter.id)
      .in('status', ['pending', 'validated'])
      .single()

    if (existingProxy) {
      return { success: false, error: 'Une procuration est déjà en cours pour cet électeur' }
    }

    // Créer la procuration
    const { data, error } = await supabase
      .from('proxies')
      .insert({
        election_id: electionId,
        donor_voter_id: donorVoter.id,
        donor_email: donorEmail,
        proxy_voter_id: proxyVoter.id,
        proxy_email: proxyEmail,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Envoyer un email de notification au mandataire
    try {
      await sendProxyRequestEmail({
        to: proxyEmail,
        proxyName: proxyVoter.name || proxyEmail,
        donorName: donorVoter.name || donorEmail,
        electionTitle: election.title,
      })
    } catch (emailError) {
      console.error('Erreur envoi email procuration:', emailError)
      // Ne pas bloquer si l'email échoue
    }

    revalidatePath(`/elections/${electionId}/proxies`)
    return { success: true, data }
  } catch (error) {
    console.error('Erreur création procuration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Valider une procuration
 */
export async function validateProxy(proxyId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Récupérer la procuration
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select(`
        *,
        elections!inner(creator_id, title)
      `)
      .eq('id', proxyId)
      .single()

    if (proxyError || !proxy) {
      return { success: false, error: 'Procuration non trouvée' }
    }

    // Vérifier que l'utilisateur est le créateur de l'élection
    if (proxy.elections.creator_id !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    // Valider la procuration
    const { error } = await supabase
      .from('proxies')
      .update({
        status: 'validated',
        validated_at: new Date().toISOString(),
      })
      .eq('id', proxyId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Envoyer un email de confirmation
    try {
      await sendProxyConfirmationEmail({
        to: proxy.proxy_email,
        donorName: proxy.donor_email,
        electionTitle: proxy.elections.title,
      })
    } catch (emailError) {
      console.error('Erreur envoi email confirmation:', emailError)
    }

    revalidatePath(`/elections/${proxy.election_id}/proxies`)
    return { success: true }
  } catch (error) {
    console.error('Erreur validation procuration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Révoquer une procuration
 */
export async function revokeProxy(proxyId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié' }
    }

    // Récupérer la procuration
    const { data: proxy, error: proxyError } = await supabase
      .from('proxies')
      .select(`
        *,
        elections!inner(creator_id)
      `)
      .eq('id', proxyId)
      .single()

    if (proxyError || !proxy) {
      return { success: false, error: 'Procuration non trouvée' }
    }

    // Vérifier que l'utilisateur est le créateur de l'élection
    if (proxy.elections.creator_id !== user.id) {
      return { success: false, error: 'Non autorisé' }
    }

    // Vérifier qu'elle n'a pas déjà été utilisée
    if (proxy.status === 'used') {
      return { success: false, error: 'La procuration a déjà été utilisée' }
    }

    // Révoquer la procuration
    const { error } = await supabase
      .from('proxies')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', proxyId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/elections/${proxy.election_id}/proxies`)
    return { success: true }
  } catch (error) {
    console.error('Erreur révocation procuration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Récupérer toutes les procurations d'une élection
 */
export async function getElectionProxies(electionId: string) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Non authentifié', data: [] }
    }

    // Vérifier que l'élection appartient à l'utilisateur
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('id')
      .eq('id', electionId)
      .eq('creator_id', user.id)
      .single()

    if (electionError || !election) {
      return { success: false, error: 'Élection non trouvée', data: [] }
    }

    // Récupérer les procurations
    const { data, error } = await supabase
      .from('proxies')
      .select('*')
      .eq('election_id', electionId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erreur récupération procurations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      data: [],
    }
  }
}
