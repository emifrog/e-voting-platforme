import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VoteInterface } from '@/components/vote/vote-interface'

export default async function VotePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAdminClient()

  // Get voter and election info
  const { data: voter, error } = await supabase
    .from('voters')
    .select(`
      *,
      elections(
        *,
        candidates(*)
      )
    `)
    .eq('token', params.token)
    .single()

  if (error || !voter) {
    notFound()
  }

  const election = (voter.elections as any)
  const candidates = (election.candidates as any) || []

  // Check if already voted
  if (voter.has_voted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <CardTitle className="text-2xl">Vous avez déjà voté</CardTitle>
            <CardDescription>
              Merci pour votre participation à: {election.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Votre vote a été enregistré le{' '}
              {new Date(voter.voted_at).toLocaleString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if election is active
  if (election.status !== 'active') {
    const statusMessages = {
      draft: 'Le vote n\'est pas encore ouvert',
      scheduled: 'Le vote ouvrira bientôt',
      closed: 'Le vote est terminé',
      archived: 'Le vote est archivé',
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">⏸️</div>
            <CardTitle className="text-2xl">
              {statusMessages[election.status as keyof typeof statusMessages]}
            </CardTitle>
            <CardDescription>{election.title}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {election.start_date && (
              <p className="text-muted-foreground">
                Date de début: {new Date(election.start_date).toLocaleString('fr-FR')}
              </p>
            )}
            {election.end_date && (
              <p className="text-muted-foreground mt-2">
                Date de fin: {new Date(election.end_date).toLocaleString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show voting interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {election.title}
          </h1>
          {election.description && (
            <p className="text-muted-foreground">{election.description}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>📧 {voter.email}</span>
            <span>•</span>
            <span>
              🕐 Jusqu'au {new Date(election.end_date).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>

        <VoteInterface
          token={params.token}
          election={election}
          candidates={candidates}
          voterName={voter.name || voter.email}
        />
      </div>
    </div>
  )
}
