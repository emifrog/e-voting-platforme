import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { registerVoter } from '@/lib/actions/voters'

export default async function PublicRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const { success, error } = await searchParams
  const supabase = await createClient()

  // Fetch election (public info only)
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('id, title, description, status, start_date, end_date')
    .eq('id', id)
    .single()

  if (electionError || !election) {
    notFound()
  }

  // Check if election is open for registration (draft or scheduled)
  if (election.status === 'closed' || election.status === 'archived') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Inscription fermée</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les inscriptions pour cette élection sont fermées.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inscription à l'élection</CardTitle>
          <CardDescription>{election.title}</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                ✅ Inscription réussie! Vous recevrez un email avec votre lien de vote.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
            </div>
          )}

          {election.description && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">{election.description}</p>
            </div>
          )}

          <form action={registerVoter} className="space-y-4">
            <input type="hidden" name="electionId" value={election.id} />

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre.email@exemple.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Vous recevrez un lien unique pour voter à cette adresse
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet (optionnel)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Jean Dupont"
              />
            </div>

            <Button type="submit" className="w-full">
              S'inscrire pour voter
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Dates du vote: {new Date(election.start_date).toLocaleDateString('fr-FR')} - {new Date(election.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
