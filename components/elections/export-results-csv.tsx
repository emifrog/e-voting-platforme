'use client'

/**
 * Bouton d'export des résultats en CSV
 */

import { Download } from 'lucide-react'
import { toCSV, downloadCSV } from '@/lib/utils/csv'
import { toast } from 'sonner'

interface ExportResultsCSVProps {
  results: {
    candidates: Array<{
      name: string
      votes: number
      percentage: number
      position?: number
    }>
    stats: {
      totalVoters: number
      totalVotes: number
      participationRate: number
      quorumReached: boolean
    }
    electionTitle: string
    voteType: string
  }
}

export function ExportResultsCSV({ results }: ExportResultsCSVProps) {
  const handleExport = () => {
    if (!results || results.candidates.length === 0) {
      toast.error('Aucun résultat à exporter')
      return
    }

    try {
      const data = results.candidates.map((candidate) => ({
        Candidat: candidate.name,
        Votes: candidate.votes,
        'Pourcentage (%)': candidate.percentage.toFixed(2),
        Position: candidate.position || '-',
      }))

      // Ajouter ligne de statistiques
      data.push({
        Candidat: '--- STATISTIQUES ---',
        Votes: '',
        'Pourcentage (%)': '',
        Position: '',
      } as any)

      data.push({
        Candidat: 'Total électeurs',
        Votes: results.stats.totalVoters,
        'Pourcentage (%)': '',
        Position: '',
      } as any)

      data.push({
        Candidat: 'Votes exprimés',
        Votes: results.stats.totalVotes,
        'Pourcentage (%)': '',
        Position: '',
      } as any)

      data.push({
        Candidat: 'Taux de participation',
        Votes: '',
        'Pourcentage (%)': results.stats.participationRate.toFixed(2),
        Position: '',
      } as any)

      data.push({
        Candidat: 'Quorum atteint',
        Votes: results.stats.quorumReached ? 'Oui' : 'Non',
        'Pourcentage (%)': '',
        Position: '',
      } as any)

      const csv = toCSV(data)
      const filename = `resultats_${results.electionTitle
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`

      downloadCSV(csv, filename)
      toast.success('Résultats exportés en CSV')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <Download className="w-4 h-4" />
      Exporter résultats CSV
    </button>
  )
}
