import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Mot de passe oublié
        </CardTitle>
        <CardDescription className="text-center">
          Entrez votre email pour réinitialiser votre mot de passe
        </CardDescription>
      </CardHeader>
      <form>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full">
            Envoyer le lien de réinitialisation
          </Button>
          <Link
            href="/login"
            className="text-sm text-center text-primary hover:underline"
          >
            Retour à la connexion
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
