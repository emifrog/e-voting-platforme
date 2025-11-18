import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Single query to fetch all elections with related data for analytics
  const { data: elections, count: totalElections } = await supabase
    .from('elections')
    .select(`
      *,
      candidates(count),
      voters(count)
    `, { count: 'exact' })
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  // Calculate stats from fetched data (no additional queries)
  const activeElections = elections?.filter((e) => e.status === 'active').length || 0
  const draftElections = elections?.filter((e) => e.status === 'draft').length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de vos élections et votes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Élections</CardTitle>
            <span className="text-2xl">🗳️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalElections || 0}</div>
            <p className="text-xs text-muted-foreground">
              Toutes vos élections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeElections || 0}</div>
            <p className="text-xs text-muted-foreground">
              Votes actifs en ce moment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftElections || 0}</div>
            <p className="text-xs text-muted-foreground">
              En préparation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Créez une nouvelle élection ou consultez vos votes existants
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link href="/elections/new">Créer une élection</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/elections">Voir toutes les élections</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      {elections && elections.length > 0 && (
        <>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground mt-2">
              Statistiques et tendances en temps réel
            </p>
          </div>
          <AnalyticsCharts initialElections={elections as any} />
        </>
      )}

      {/* Recent Elections */}
      {elections && elections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Élections récentes</CardTitle>
            <CardDescription>
              Vos dernières élections créées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {elections.slice(0, 5).map((election) => (
                <div
                  key={election.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-medium">{election.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {election.status === 'draft' && '📝 Brouillon'}
                      {election.status === 'scheduled' && '📅 Planifié'}
                      {election.status === 'active' && '✅ En cours'}
                      {election.status === 'closed' && '🔒 Terminé'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/elections/${election.id}`}>Voir</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!elections || elections.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🗳️</div>
            <h3 className="text-lg font-semibold mb-2">
              Aucune élection pour le moment
            </h3>
            <p className="text-muted-foreground mb-6 text-center">
              Créez votre première élection pour commencer
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
