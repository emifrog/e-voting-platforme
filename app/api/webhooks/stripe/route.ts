import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/services/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const PROFILES_TABLE = 'profiles' as const
type ProfilesTable = Database['public']['Tables'][typeof PROFILES_TABLE]
type ProfileRow = ProfilesTable['Row']
type ProfileUpdate = ProfilesTable['Update']
type ProfileId = Pick<ProfileRow, 'id'>

/**
 * Webhook Stripe pour gérer les événements d'abonnement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase: SupabaseClient<Database> = createAdminClient()
    const profiles = supabase.from(PROFILES_TABLE)
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature manquante' },
        { status: 400 }
      )
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Erreur vérification signature webhook:', err)
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 400 }
      )
    }

    // Traiter l'événement
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Récupérer l'abonnement
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as string

        if (!userId || !plan) {
          console.error('Metadata manquante dans la session')
          break
        }

        // Mettre à jour le profil
        const profileUpdate = {
          stripe_customer_id: session.customer as string,
          subscription_plan: plan as ProfileUpdate['subscription_plan'],
          subscription_status: 'active',
          subscription_end_date: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          elections_limit: plan === 'starter' ? 10 : 999999,
          voters_per_election_limit: plan === 'starter' ? 500 : 999999,
        } satisfies ProfileUpdate

        await (profiles as any).update(profileUpdate).eq('id', userId)

        console.log(
          `✅ Abonnement activé pour l'utilisateur ${userId} au plan ${plan}`
        )
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Trouver l'utilisateur par customer_id
        const { data: profile } = await profiles
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single<ProfileId>()

        if (!profile) {
          console.error(`Utilisateur non trouvé pour customer ${customerId}`)
          break
        }

        // Mettre à jour le statut
        const status = subscription.status
        const plan = subscription.metadata.plan || 'free'

        const statusUpdate = {
          subscription_status: status as ProfileUpdate['subscription_status'],
          subscription_end_date: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        } satisfies ProfileUpdate

        await (profiles as any).update(statusUpdate).eq('id', profile.id)

        console.log(
          `✅ Abonnement mis à jour pour l'utilisateur ${profile.id}: ${status}`
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Trouver l'utilisateur
        const { data: profile } = await supabase
          .from(PROFILES_TABLE)
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single<ProfileId>()

        if (!profile) {
          console.error(`Utilisateur non trouvé pour customer ${customerId}`)
          break
        }

        // Réinitialiser au plan gratuit
        const cancelUpdate = {
          subscription_plan: 'free',
          subscription_status: 'canceled',
          subscription_end_date: null,
          elections_limit: 3,
          voters_per_election_limit: 50,
        } satisfies ProfileUpdate

        await (profiles as any).update(cancelUpdate).eq('id', profile.id)

        console.log(
          `✅ Abonnement annulé pour l'utilisateur ${profile.id}, retour au plan Free`
        )
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`💳 Paiement réussi: ${invoice.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Marquer l'abonnement comme "past_due"
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single<ProfileId>()

        if (profile) {
          const pastDueUpdate = {
            subscription_status: 'past_due',
          } satisfies ProfileUpdate

          await (profiles as any).update(pastDueUpdate).eq('id', profile.id)

          console.log(
            `⚠️ Paiement échoué pour l'utilisateur ${profile.id}`
          )
        }
        break
      }

      default:
        console.log(`Événement non géré: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erreur webhook Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
