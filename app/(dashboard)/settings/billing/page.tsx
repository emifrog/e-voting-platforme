import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createStripeCheckout, createStripePortal, getUserSubscription, countUserElections } from '@/lib/actions/stripe'
import { STRIPE_PLANS } from '@/lib/services/stripe'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const supabase = await createServerClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const subscription = await getUserSubscription()
  const electionsCount = await countUserElections()

  const currentPlan = subscription?.subscription_plan || 'free'
  const isTrialing = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Facturation & Abonnement</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gérez votre abonnement et consultez vos factures
        </p>
      </div>

      {/* Messages de succès/annulation */}
      {params.success && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            ✅ Abonnement activé avec succès ! Bienvenue dans votre nouveau plan.
          </p>
        </div>
      )}

      {params.canceled && (
        <div className="mb-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            ℹ️ Le processus de paiement a été annulé.
          </p>
        </div>
      )}

      {/* Abonnement actuel */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Abonnement actuel</CardTitle>
            <CardDescription>
              Vous êtes actuellement sur le plan{' '}
              <span className="font-semibold capitalize">{currentPlan}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                <p className="mt-1 font-medium capitalize">
                  {subscription.subscription_status === 'active' ? '✅ Actif' : subscription.subscription_status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Élections utilisées</p>
                <p className="mt-1 font-medium">
                  {electionsCount} / {subscription.elections_limit === 999999 ? '∞' : subscription.elections_limit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Électeurs max/élection</p>
                <p className="mt-1 font-medium">
                  {subscription.voters_per_election_limit === 999999 ? 'Illimité' : subscription.voters_per_election_limit}
                </p>
              </div>
              {subscription.subscription_end_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isTrialing ? 'Fin de l\'essai' : 'Renouvellement'}
                  </p>
                  <p className="mt-1 font-medium">
                    {new Date(subscription.subscription_end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            {isTrialing && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  🎉 Vous profitez actuellement de 14 jours d'essai gratuit !
                </p>
              </div>
            )}
          </CardContent>
          {currentPlan !== 'free' && subscription.stripe_customer_id && (
            <CardFooter>
              <form action={createStripePortal}>
                <Button type="submit" variant="outline">
                  Gérer mon abonnement
                </Button>
              </form>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Plans disponibles */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Plans disponibles</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Choisissez le plan qui correspond à vos besoins
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Free */}
        <Card className={currentPlan === 'free' ? 'border-primary ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {STRIPE_PLANS.free.name}
              {currentPlan === 'free' && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  Actuel
                </span>
              )}
            </CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">Gratuit</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {STRIPE_PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentPlan !== 'free' ? (
              <Button variant="outline" disabled className="w-full">
                Plan actuel supérieur
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full">
                Plan actuel
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Plan Starter */}
        <Card className={currentPlan === 'starter' ? 'border-primary ring-2 ring-primary' : 'border-primary'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {STRIPE_PLANS.starter.name}
              {currentPlan === 'starter' && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  Actuel
                </span>
              )}
            </CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">{STRIPE_PLANS.starter.price}€</span>
              <span className="text-gray-600 dark:text-gray-400">/mois</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {STRIPE_PLANS.starter.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentPlan === 'starter' ? (
              <Button variant="outline" disabled className="w-full">
                Plan actuel
              </Button>
            ) : currentPlan === 'free' ? (
              <form action={createStripeCheckout.bind(null, 'starter')} className="w-full">
                <Button type="submit" className="w-full">
                  Passer à Starter
                </Button>
              </form>
            ) : (
              <Button variant="outline" disabled className="w-full">
                Contactez-nous
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Plan Pro */}
        <Card className={currentPlan === 'pro' ? 'border-primary ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {STRIPE_PLANS.pro.name}
              {currentPlan === 'pro' && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  Actuel
                </span>
              )}
            </CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">{STRIPE_PLANS.pro.price}€</span>
              <span className="text-gray-600 dark:text-gray-400">/mois</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {STRIPE_PLANS.pro.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentPlan === 'pro' ? (
              <Button variant="outline" disabled className="w-full">
                Plan actuel
              </Button>
            ) : currentPlan === 'free' || currentPlan === 'starter' ? (
              <form action={createStripeCheckout.bind(null, 'pro')} className="w-full">
                <Button type="submit" className="w-full">
                  Passer à Pro
                </Button>
              </form>
            ) : (
              <Button variant="outline" disabled className="w-full">
                Contactez-nous
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Note sur l'essai gratuit */}
      <div className="mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Essai gratuit de 14 jours</strong> sur tous les plans payants. Aucune carte
          bancaire requise pour commencer.
        </p>
      </div>
    </div>
  )
}
