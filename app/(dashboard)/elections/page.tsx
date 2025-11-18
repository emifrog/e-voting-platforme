import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ElectionFilters } from '@/components/elections/election-filters'

export default async function ElectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; voteType?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { search, status, voteType } = await searchParams

  // Build query with filters
  let query = supabase
    .from('elections')
    .select(`
      *,
      candidates(count),
      voters(count)
    `)
    .eq('creator_id', user.id)

  // Apply search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply status filter
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply vote type filter
  if (voteType && voteType !== 'all') {
    query = query.eq('vote_type', voteType)
  }

  const { data: elections } = await query.order('created_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { emoji: '📝', label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      scheduled: { emoji: '📅', label: 'Planifié', color: 'bg-blue-100 text-blue-800' },
      active: { emoji: '✅', label: 'En cours', color: 'bg-green-100 text-green-800' },
      closed: { emoji: '🔒', label: 'Terminé', color: 'bg-red-100 text-red-800' },
      archived: { emoji: '📦', label: 'Archivé', color: 'bg-gray-100 text-gray-600' },
    }
    return badges[status as keyof typeof badges] || badges.draft
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Élections</h1>
          <p className="text-muted-foreground mt-2">
            Gérez toutes vos élections et votes
          </p>
        </div>
        <Button asChild>
          <Link href="/elections/new">Créer une élection</Link>
        </Button>
      </div>

      {/* Filters */}
      <ElectionFilters initialSearch={search} initialStatus={status} initialVoteType={voteType} />

      {/* Elections Grid */}
      {elections && elections.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => {
            const status = getStatusBadge(election.status)
            return (
              <Card key={election.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {election.title}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.emoji} {status.label}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {election.description || 'Aucune description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type de vote:</span>
                    <span className="font-medium capitalize">{election.vote_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Candidats:</span>
                    <span className="font-medium">
                      {(election.candidates as any)?.[0]?.count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Électeurs:</span>
                    <span className="font-medium">
                      {(election.voters as any)?.[0]?.count || 0}
                    </span>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/elections/${election.id}`}>Voir</Link>
                    </Button>
                    {election.status === 'draft' && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/elections/${election.id}/edit`}>Éditer</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🗳️</div>
            <h3 className="text-lg font-semibold mb-2">
              Aucune élection pour le moment
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Créez votre première élection pour commencer à recueillir des votes
            </p>
            <Button asChild>
              <Link href="/elections/new">Créer ma première élection</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
