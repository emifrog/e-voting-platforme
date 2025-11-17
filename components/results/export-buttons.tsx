'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExportElectionResults } from '@/types/models'
import { exportResultsToPDF } from '@/lib/services/export-pdf'
import { exportResultsToCSV } from '@/lib/services/export-csv'
import { exportResultsToJSON } from '@/lib/services/export-json'
import { exportResultsToExcel } from '@/lib/services/export-excel'
import { showToast } from '@/lib/utils/toast'

interface ExportButtonsProps {
  results: ExportElectionResults
}

export function ExportButtons({ results }: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [isExportingJSON, setIsExportingJSON] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

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
      showToast.success('Export CSV réussi', 'Le fichier CSV a été téléchargé')
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      showToast.error('Erreur d\'export', 'Impossible d\'exporter le CSV')
    } finally {
      setIsExportingCSV(false)
    }
  }

  const handleExportJSON = () => {
    setIsExportingJSON(true)
    try {
      exportResultsToJSON(results)
      showToast.success('Export JSON réussi', 'Le fichier JSON a été téléchargé')
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error)
      showToast.error('Erreur d\'export', 'Impossible d\'exporter le JSON')
    } finally {
      setIsExportingJSON(false)
    }
  }

  const handleExportExcel = () => {
    setIsExportingExcel(true)
    try {
      exportResultsToExcel(results)
      showToast.success('Export Excel réussi', 'Le fichier Excel a été téléchargé')
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      showToast.error('Erreur d\'export', 'Impossible d\'exporter le fichier Excel')
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
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
      <Button
        variant="outline"
        onClick={handleExportJSON}
        disabled={isExportingJSON}
      >
        {isExportingJSON ? (
          <>⏳ Export en cours...</>
        ) : (
          <>📦 Exporter en JSON</>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={handleExportExcel}
        disabled={isExportingExcel}
      >
        {isExportingExcel ? (
          <>⏳ Export en cours...</>
        ) : (
          <>📗 Exporter en Excel</>
        )}
      </Button>
    </div>
  )
}
