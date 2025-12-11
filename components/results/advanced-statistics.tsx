'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AdvancedStatisticsProps {
  stats: {
    totalVoters: number
    totalVotes: number
    participationRate: number
    abstentions: number
    blanks: number
    quorum: number
  }
  candidates: any[]
}

export function AdvancedStatistics({ stats, candidates }: AdvancedStatisticsProps) {
  // Calculer les statistiques avancées
  const validVotes = stats.totalVotes - stats.blanks
  const blankRate = stats.totalVotes > 0 ? (stats.blanks / stats.totalVotes) * 100 : 0
  const abstentionRate = stats.totalVoters > 0 ? (stats.abstentions / stats.totalVoters) * 100 : 0

  // Trouver le vainqueur et son écart
  const winner = candidates.find(c => c.is_winner)
  const secondPlace = candidates.filter(c => !c.is_winner)[0]
  const winMargin = winner && secondPlace ? winner.vote_count - secondPlace.vote_count : 0
  const winMarginPercent = winner && secondPlace ? winner.percentage - secondPlace.percentage : 0

  // Calculer la moyenne et la médiane des votes
  const voteCounts = candidates.map(c => c.vote_count)
  const avgVotes = voteCounts.reduce((a, b) => a + b, 0) / voteCounts.length
  const sortedVotes = [...voteCounts].sort((a, b) => a - b)
  const medianVotes = sortedVotes.length % 2 === 0
    ? (sortedVotes[sortedVotes.length / 2 - 1] + sortedVotes[sortedVotes.length / 2]) / 2
    : sortedVotes[Math.floor(sortedVotes.length / 2)]

  // Calculer l'écart-type
  const variance = voteCounts.reduce((sum, count) => sum + Math.pow(count - avgVotes, 2), 0) / voteCounts.length
  const stdDev = Math.sqrt(variance)

  // Indice de concentration (Herfindahl-Hirschman Index)
  const hhi = candidates.reduce((sum, c) => sum + Math.pow(c.percentage, 2), 0)
  const competitiveness = hhi < 2500 ? 'Très compétitive' : hhi < 5000 ? 'Modérément compétitive' : 'Peu compétitive'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Participation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taux de Participation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {stats.participationRate.toFixed(1)}%
          </div>
          <Progress value={stats.participationRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalVotes} votes sur {stats.totalVoters} électeurs
          </p>
        </CardContent>
      </Card>

      {/* Abstentions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taux d'Abstention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {abstentionRate.toFixed(1)}%
          </div>
          <Progress value={abstentionRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.abstentions} abstentions
          </p>
        </CardContent>
      </Card>

      {/* Votes blancs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Votes Blancs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-600">
            {blankRate.toFixed(1)}%
          </div>
          <Progress value={blankRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.blanks} votes blancs
          </p>
        </CardContent>
      </Card>

      {/* Quorum */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Quorum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {stats.quorum.toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.participationRate >= stats.quorum ? (
              <span className="text-green-600 font-semibold">✓ Atteint</span>
            ) : (
              <span className="text-red-600 font-semibold">✗ Non atteint</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Écart de victoire */}
      {winner && secondPlace && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Écart de Victoire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {winMarginPercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {winMargin} votes d'écart
            </p>
          </CardContent>
        </Card>
      )}

      {/* Compétitivité */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Compétitivité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">
            {competitiveness}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Indice HHI: {hhi.toFixed(0)}
          </p>
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Statistiques Détaillées</CardTitle>
          <CardDescription>Analyse statistique des votes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Votes Valides</p>
              <p className="text-2xl font-bold">{validVotes}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Moyenne par Candidat</p>
              <p className="text-2xl font-bold">{avgVotes.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Médiane</p>
              <p className="text-2xl font-bold">{medianVotes.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Écart-Type</p>
              <p className="text-2xl font-bold">{stdDev.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
