'use client'

/**
 * Bouton d'export des voteurs en CSV
 */

import { Download } from 'lucide-react'
import { toCSV, downloadCSV } from '@/lib/utils/csv'
import { toast } from 'sonner'

interface ExportVotersCSVProps {
  voters: Array<{
    email: string
    name?: string | null
    weight: number
    has_voted: boolean
    invited_at?: string | null
  }>
  electionTitle: string
}

export function ExportVotersCSV({ voters, electionTitle }: ExportVotersCSVProps) {
  const handleExport = () => {
    if (voters.length === 0) {
      toast.error('Aucun voteur à exporter')
      return
    }

    try {
      const data = voters.map((voter) => ({
        Email: voter.email,
        Nom: voter.name || '',
        Poids: voter.weight,
        'A voté': voter.has_voted ? 'Oui' : 'Non',
        'Invité le': voter.invited_at
          ? new Date(voter.invited_at).toLocaleDateString('fr-FR')
          : '',
      }))

      const csv = toCSV(data)
      const filename = `voteurs_${electionTitle
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`

      downloadCSV(csv, filename)
      toast.success('Voteurs exportés en CSV')
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
      Exporter CSV
    </button>
  )
}
