'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import {
  createCheckoutSession,
  createCustomerPortalSession,
  getOrCreateCustomer,
  type PlanName,
} from '@/lib/services/stripe'

/**
 * Créer une session de checkout pour un plan
 */
export async function createStripeCheckout(plan: 'starter' | 'pro') {
  try {
    const supabase = await createServerClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Non authentifié')
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profil non trouvé')
    }

    // Vérifier si déjà abonné
    if (profile.subscription_plan !== 'free' && profile.subscription_status === 'active') {
      throw new Error('Vous avez déjà un abonnement actif. Utilisez le portail client pour le gérer.')
    }

    // Créer ou récupérer le client Stripe
    const customer = await getOrCreateCustomer({
      userId: user.id,
      email: user.email!,
    })

    // Mettre à jour le stripe_customer_id si nécessaire
    if (!profile.stripe_customer_id) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id)
    }

    // Créer la session de checkout
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      plan,
      successUrl: `${baseUrl}/settings/billing?success=true`,
      cancelUrl: `${baseUrl}/settings/billing?canceled=true`,
    })

    // Rediriger vers Stripe Checkout
    redirect(session.url!)
  } catch (error) {
    console.error('Erreur création checkout:', error)
    throw error
  }
}

/**
 * Créer une session du portail client Stripe
 */
export async function createStripePortal() {
  try {
    const supabase = await createServerClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Non authentifié')
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profil non trouvé')
    }

    if (!profile.stripe_customer_id) {
      throw new Error('Aucun compte Stripe associé')
    }

    // Créer la session du portail
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const session = await createCustomerPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: `${baseUrl}/settings/billing`,
    })

    // Rediriger vers le portail Stripe
    redirect(session.url)
  } catch (error) {
    console.error('Erreur création portail:', error)
    throw error
  }
}

/**
 * Récupérer les informations d'abonnement de l'utilisateur
 */
export async function getUserSubscription() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_plan, subscription_status, subscription_end_date, trial_ends_at, elections_limit, voters_per_election_limit')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    console.error('Erreur récupération abonnement:', error)
    return null
  }
}

/**
 * Compter les élections actives de l'utilisateur
 */
export async function countUserElections() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return 0
    }

    const { count } = await supabase
      .from('elections')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user.id)
      .not('status', 'eq', 'archived')

    return count || 0
  } catch (error) {
    console.error('Erreur comptage élections:', error)
    return 0
  }
}
