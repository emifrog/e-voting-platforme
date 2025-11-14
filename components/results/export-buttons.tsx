'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExportElectionResults } from '@/types/models'
import { exportResultsToPDF } from '@/lib/services/export-pdf'
import { exportResultsToCSV } from '@/lib/services/export-csv'

interface ExportButtonsProps {
  results: ExportElectionResults
}

export function ExportButtons({ results }: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      await exportResultsToPDF(results, {
        includeGraphs: true,
        includeMetadata: true,
        includeStats: true,
        includeTimestamp: true,
      })
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportCSV = () => {
    setIsExportingCSV(true)
    try {
      exportResultsToCSV(results, {
        includeMetadata: true,
        includePercentages: true,
        includeStats: true,
      })
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      alert('Erreur lors de l\'export CSV. Veuillez réessayer.')
    } finally {
      setIsExportingCSV(false)
    }
  }

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={isExportingPDF}
      >
        {isExportingPDF ? (
          <>⏳ Export en cours...</>
        ) : (
          <>📄 Exporter en PDF</>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={handleExportCSV}
        disabled={isExportingCSV}
      >
        {isExportingCSV ? (
          <>⏳ Export en cours...</>
        ) : (
          <>📊 Exporter en CSV</>
        )}
      </Button>
    </div>
  )
}
