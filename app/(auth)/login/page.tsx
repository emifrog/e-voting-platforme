import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons, OAuthDivider } from '@/components/auth/oauth-buttons'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; expired?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const expired = params.expired === 'true'

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
        <CardDescription className="text-center">
          Connectez-vous à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {expired && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Votre session a expiré
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Veuillez vous reconnecter pour continuer.
            </p>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{decodeURIComponent(error)}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <OAuthButtons redirectTo="/dashboard" />

        {/* Divider */}
        <OAuthDivider />
      </CardContent>

      <LoginForm />
    </Card>
  )
}
