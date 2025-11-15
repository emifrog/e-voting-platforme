import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateResults } from '@/lib/services/results'
import { ResultsWrapper } from '@/components/results/results-wrapper'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Verify election ownership
  const { data: election, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (error || !election) {
    notFound()
  }

  // Calculate results
  const results = await calculateResults(id)

  if (!results) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Impossible de calculer les résultats
        </p>
      </div>
    )
  }

  const { candidates, stats } = results

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/elections/${id}`}
            className="text-sm text-primary hover:underline mb-2 inline-block"
          >
            ← Retour à l'élection
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Résultats - {election.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble des résultats du vote
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Électeurs</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_voters}</div>
            <p className="text-xs text-muted-foreground">Total inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votes</CardTitle>
            <span className="text-2xl">🗳️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_votes}</div>
            <p className="text-xs text-muted-foreground">Votes exprimés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.participation_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Taux de participation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quorum</CardTitle>
            <span className="text-2xl">
              {stats.quorum_reached ? '✅' : '❌'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.quorum_reached ? 'Atteint' : 'Non atteint'}
            </div>
            <p className="text-xs text-muted-foreground">
              {election.quorum_type !== 'none'
                ? `Requis: ${election.quorum_value}${election.quorum_type === 'percentage' ? '%' : ' votes'}`
                : 'Aucun quorum requis'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results with exports */}
      <ResultsWrapper results={results} />
    </div>
  )
}
