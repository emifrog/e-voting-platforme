import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PushNotificationToggle } from '@/components/notifications/push-notification-toggle'
import { ThemeToggleWithLabel } from '@/components/ui/theme-toggle'
import { Bell, Shield, CreditCard, Webhook } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      {/* Quick Settings Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/settings/security">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sécurité</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                2FA, sessions, mots de passe
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/webhooks">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Intégrations Teams, Slack, Zoom
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/billing">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturation</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Abonnement et paiements
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configurées ci-dessous
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Preferences Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Préférences</h2>
          <p className="text-muted-foreground mt-2">
            Personnalisez votre expérience
          </p>
        </div>

        <div className="space-y-4">
          {/* Theme Toggle */}
          <ThemeToggleWithLabel />

          {/* Push Notifications */}
          <PushNotificationToggle />
        </div>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
              <p className="text-sm font-medium mt-1">{profile?.full_name || 'Non défini'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Organisation</p>
              <p className="text-sm font-medium mt-1">{profile?.organization || 'Non définie'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rôle</p>
              <p className="text-sm font-medium mt-1 capitalize">{profile?.role || 'user'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
