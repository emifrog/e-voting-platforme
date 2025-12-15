import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons, OAuthDivider } from '@/components/auth/oauth-buttons'
import { RegisterForm } from '@/components/auth/register-form'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo-removebg.png"
            alt="E-Voting Platform"
            width={80}
            height={80}
            priority
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
        <CardDescription className="text-center">
          Inscrivez-vous pour commencer à créer vos votes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
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

      <RegisterForm />
    </Card>
  )
}
