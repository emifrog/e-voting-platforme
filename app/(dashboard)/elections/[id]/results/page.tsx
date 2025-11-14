import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateResults } from '@/lib/services/results'
import { ResultsChart } from '@/components/results/results-chart'
import { ResultsPodium } from '@/components/results/results-podium'

export default async function ResultsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Verify election ownership
  const { data: election, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', params.id)
    .eq('creator_id', user.id)
    .single()

  if (error || !election) {
    notFound()
  }

  // Calculate results
  const results = await calculateResults(params.id)

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
            href={`/elections/${params.id}`}
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

      {/* Podium */}
      <ResultsPodium candidates={candidates.slice(0, 3)} />

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des votes</CardTitle>
          <CardDescription>
            Graphique de répartition par candidat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsChart candidates={candidates} />
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats détaillés</CardTitle>
          <CardDescription>
            Tableau complet des résultats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {candidates.map((result, index) => (
              <div
                key={result.candidate.id}
                className={`
                  p-4 border rounded-lg
                  ${result.is_winner ? 'border-green-500 bg-green-50' : 'border-gray-200'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full font-bold
                        ${result.is_winner
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {result.candidate.name}
                        </h3>
                        {result.is_winner && (
                          <span className="text-sm bg-green-500 text-white px-2 py-0.5 rounded-full">
                            🏆 Vainqueur
                          </span>
                        )}
                      </div>
                      {result.candidate.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.candidate.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {result.vote_count}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      result.is_winner ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">
            📄 Exporter en PDF
          </Button>
          <Button variant="outline">
            📊 Exporter en CSV
          </Button>
          <Button variant="outline">
            📧 Partager les résultats
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
