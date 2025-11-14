import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TwoFactorSetup } from '@/components/settings/two-factor-setup'
import { redirect } from 'next/navigation'

export default async function SecuritySettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile with 2FA status
  const { data: profile } = await supabase
    .from('profiles')
    .select('two_factor_enabled')
    .eq('id', user.id)
    .single()

  const is2FAEnabled = profile?.two_factor_enabled || false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sécurité</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les paramètres de sécurité de votre compte
        </p>
      </div>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Authentification à deux facteurs (2FA)</CardTitle>
              <CardDescription className="mt-2">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </CardDescription>
            </div>
            <div>
              {is2FAEnabled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Activé
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Désactivé
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup userEmail={user.email!} isEnabled={is2FAEnabled} />
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Modifiez votre mot de passe régulièrement pour maintenir la sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pour modifier votre mot de passe, utilisez la page "Mot de passe oublié" depuis la page de connexion.
          </p>
        </CardContent>
      </Card>

      {/* Sessions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions actives</CardTitle>
          <CardDescription>
            Gérez vos sessions de connexion actives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Session actuelle</p>
                <p className="text-sm text-muted-foreground">
                  Connecté depuis cet appareil
                </p>
              </div>
              <span className="text-sm text-green-600">● Actif</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
