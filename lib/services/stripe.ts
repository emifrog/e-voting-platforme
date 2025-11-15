import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Plans et pricing
export const STRIPE_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 élections maximum',
      '50 électeurs par élection',
      'Vote simple et par approbation',
      'Résultats basiques',
      'Support email',
    ],
    limits: {
      elections: 3,
      votersPerElection: 50,
      voteTypes: ['simple', 'approval'],
    },
  },
  starter: {
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_PRICE_ID_STARTER!,
    features: [
      '10 élections actives',
      '500 électeurs par élection',
      'Tous les types de votes',
      'Export PDF/CSV',
      'Support prioritaire',
    ],
    limits: {
      elections: 10,
      votersPerElection: 500,
      voteTypes: ['simple', 'approval', 'ranked', 'list'],
    },
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    features: [
      'Élections illimitées',
      'Électeurs illimités',
      'Tous les types de votes',
      'Export PDF/CSV avancé',
      'Procurations',
      'Webhooks personnalisés',
      'Support 24/7',
      'Marque blanche (bientôt)',
    ],
    limits: {
      elections: Infinity,
      votersPerElection: Infinity,
      voteTypes: ['simple', 'approval', 'ranked', 'list'],
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // Sur devis
    priceId: null,
    features: [
      'Tout de Pro +',
      'Déploiement on-premise',
      'SLA garanti',
      'Formation dédiée',
      'Manager de compte',
      'Personnalisation complète',
    ],
    limits: {
      elections: Infinity,
      votersPerElection: Infinity,
      voteTypes: ['simple', 'approval', 'ranked', 'list'],
    },
  },
} as const

export type PlanName = keyof typeof STRIPE_PLANS

/**
 * Créer une session de checkout Stripe
 */
export async function createCheckoutSession({
  userId,
  email,
  plan,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  plan: 'starter' | 'pro'
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const planConfig = STRIPE_PLANS[plan]

  if (!planConfig.priceId) {
    throw new Error(`Plan ${plan} n'a pas de priceId configuré`)
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
      trial_period_days: 14, // 14 jours d'essai gratuit
    },
  })

  return session
}

/**
 * Créer un portail client Stripe
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Récupérer ou créer un client Stripe
 */
export async function getOrCreateCustomer({
  userId,
  email,
}: {
  userId: string
  email: string
}): Promise<Stripe.Customer> {
  // Chercher si le client existe déjà
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Créer un nouveau client
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  return customer
}

/**
 * Récupérer l'abonnement actif d'un client
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })

  return subscriptions.data[0] || null
}

/**
 * Annuler un abonnement
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Vérifier si un utilisateur peut créer une élection
 */
export function canCreateElection(
  currentCount: number,
  plan: PlanName
): boolean {
  const limit = STRIPE_PLANS[plan].limits.elections
  return currentCount < limit
}

/**
 * Vérifier si un utilisateur peut ajouter des électeurs
 */
export function canAddVoters(
  currentCount: number,
  plan: PlanName
): boolean {
  const limit = STRIPE_PLANS[plan].limits.votersPerElection
  return currentCount < limit
}

/**
 * Vérifier si un type de vote est disponible pour un plan
 */
export function isVoteTypeAvailable(
  voteType: string,
  plan: PlanName
): boolean {
  return STRIPE_PLANS[plan].limits.voteTypes.includes(voteType as any)
}
