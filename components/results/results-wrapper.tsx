'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResultsChart } from './results-chart'
import { ResultsPodium } from './results-podium'
import { ExportButtons } from './export-buttons'
import { adaptResultsForExport } from '@/lib/utils/results-adapter'

interface ResultsWrapperProps {
  results: any // DB results format
}

export function ResultsWrapper({ results }: ResultsWrapperProps) {
  const { candidates, stats, election } = results

  // Adapter les résultats pour l'export
  const exportResults = adaptResultsForExport(results)

  return (
    <div className="space-y-8">
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
            {candidates.map((result: any, index: number) => (
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
          <CardDescription>
            Exportez les résultats pour partage ou archivage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportButtons results={exportResults} />
        </CardContent>
      </Card>
    </div>
  )
}
