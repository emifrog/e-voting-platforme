'use client'

/**
 * Dashboard d'analytics avancées
 * Statistiques détaillées sur les élections
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, Vote, Calendar, Award } from 'lucide-react'

interface AnalyticsData {
  totalElections: number
  activeElections: number
  totalVotes: number
  totalVoters: number
  averageParticipation: number
  trends: {
    electionsChange: number
    votesChange: number
    participationChange: number
  }
  recentActivity: Array<{
    id: string
    type: 'election_created' | 'vote_cast' | 'election_closed'
    description: string
    timestamp: Date
  }>
  topElections: Array<{
    id: string
    title: string
    votes: number
    participation: number
  }>
}

interface AdvancedAnalyticsDashboardProps {
  data: AnalyticsData
}

export function AdvancedAnalyticsDashboard({ data }: AdvancedAnalyticsDashboardProps) {
  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return null
  }

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Elections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élections Total</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalElections}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(data.trends.electionsChange)}
              <span className={data.trends.electionsChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatChange(data.trends.electionsChange)}
              </span>
              <span>vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Elections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élections Actives</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeElections}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En cours maintenant
            </p>
          </CardContent>
        </Card>

        {/* Total Votes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votes Total</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalVotes.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(data.trends.votesChange)}
              <span className={data.trends.votesChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatChange(data.trends.votesChange)}
              </span>
              <span>vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Participation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation Moy.</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageParticipation.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(data.trends.participationChange)}
              <span className={data.trends.participationChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatChange(data.trends.participationChange)}
              </span>
              <span>vs mois dernier</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Elections */}
        <Card>
          <CardHeader>
            <CardTitle>Élections les Plus Populaires</CardTitle>
            <CardDescription>Classement par nombre de votes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topElections.map((election, index) => (
                <div key={election.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{election.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {election.votes} votes • {election.participation.toFixed(1)}% participation
                    </p>
                  </div>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${election.participation}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Dernières actions sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity) => {
                const icons = {
                  election_created: '📝',
                  vote_cast: '🗳️',
                  election_closed: '🔒',
                }

                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="text-2xl">{icons[activity.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Détaillées</CardTitle>
          <CardDescription>Vue d'ensemble de vos métriques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Électeurs Inscrits</p>
              <p className="text-2xl font-bold">{data.totalVoters.toLocaleString()}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(data.totalVotes / data.totalVoters) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {((data.totalVotes / data.totalVoters) * 100).toFixed(1)}% ont voté
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Taux de Quorum</p>
              <p className="text-2xl font-bold">
                {data.totalElections > 0
                  ? ((data.totalVotes / data.totalElections) * 100).toFixed(0)
                  : 0}%
              </p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-muted-foreground">Élections ayant atteint le quorum</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Temps Moyen de Vote</p>
              <p className="text-2xl font-bold">2.3 min</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-muted-foreground">Durée moyenne par votant</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
