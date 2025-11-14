import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddCandidateDialog } from '@/components/elections/add-candidate-dialog'
import { CandidateList } from '@/components/elections/candidate-list'

export default async function ElectionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch election with candidates and voters
  const { data: election, error } = await supabase
    .from('elections')
    .select(`
      *,
      candidates(*),
      voters(*)
    `)
    .eq('id', params.id)
    .eq('creator_id', user.id)
    .single()

  if (error || !election) {
    notFound()
  }

  const candidates = (election.candidates as any) || []
  const voters = (election.voters as any) || []

  const getStatusInfo = (status: string) => {
    const statuses = {
      draft: { emoji: '📝', label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      scheduled: { emoji: '📅', label: 'Planifié', color: 'bg-blue-100 text-blue-800' },
      active: { emoji: '✅', label: 'En cours', color: 'bg-green-100 text-green-800' },
      closed: { emoji: '🔒', label: 'Terminé', color: 'bg-red-100 text-red-800' },
      archived: { emoji: '📦', label: 'Archivé', color: 'bg-gray-100 text-gray-600' },
    }
    return statuses[status as keyof typeof statuses] || statuses.draft
  }

  const status = getStatusInfo(election.status)
  const votedCount = voters.filter((v: any) => v.has_voted).length
  const participationRate = voters.length > 0 ? (votedCount / voters.length) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{election.title}</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}
            >
              {status.emoji} {status.label}
            </span>
          </div>
          {election.description && (
            <p className="text-muted-foreground mt-2">{election.description}</p>
          )}
        </div>
        {election.status === 'draft' && (
          <Button asChild>
            <Link href={`/elections/${election.id}/edit`}>Éditer</Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidats</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-xs text-muted-foreground">
              {candidates.length === 0 ? 'Aucun candidat' : 'Candidats configurés'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Électeurs</CardTitle>
            <span className="text-2xl">📧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voters.length}</div>
            <p className="text-xs text-muted-foreground">
              Électeurs inscrits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votes</CardTitle>
            <span className="text-2xl">🗳️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{votedCount}</div>
            <p className="text-xs text-muted-foreground">
              sur {voters.length} électeurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participationRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Taux de participation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Election Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'élection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type de vote</p>
              <p className="text-base font-semibold capitalize">{election.vote_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vote secret</p>
              <p className="text-base font-semibold">
                {election.is_secret ? '✅ Oui' : '❌ Non'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date de début</p>
              <p className="text-base font-semibold">
                {election.start_date
                  ? new Date(election.start_date).toLocaleString('fr-FR')
                  : 'Non définie'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date de fin</p>
              <p className="text-base font-semibold">
                {election.end_date
                  ? new Date(election.end_date).toLocaleString('fr-FR')
                  : 'Non définie'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Candidats / Options</CardTitle>
              <CardDescription>
                Gérez les candidats ou options de vote
              </CardDescription>
            </div>
            {election.status === 'draft' && (
              <AddCandidateDialog electionId={election.id} nextPosition={candidates.length} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {candidates.length > 0 ? (
            <CandidateList
              candidates={candidates}
              electionId={election.id}
              canEdit={election.status === 'draft'}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Aucun candidat ajouté pour le moment
              </p>
              {election.status === 'draft' && (
                <AddCandidateDialog electionId={election.id} nextPosition={0} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Électeurs</CardTitle>
              <CardDescription>
                Gérez la liste des électeurs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {election.status === 'draft' && (
                <>
                  <Button variant="outline" asChild>
                    <Link href={`/elections/${election.id}/voters`}>
                      Gérer les électeurs
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {voters.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                {voters.length} électeur(s) inscrit(s)
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/elections/${election.id}/voters`}>
                  Voir tous les électeurs
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Aucun électeur ajouté pour le moment
              </p>
              {election.status === 'draft' && (
                <Button asChild>
                  <Link href={`/elections/${election.id}/voters`}>
                    Ajouter des électeurs
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {election.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild>
              <Link href={`/elections/${election.id}/results`}>
                Voir les résultats
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
