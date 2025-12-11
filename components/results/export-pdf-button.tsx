'use client'

/**
 * Bouton pour exporter les résultats en PDF
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { generateResultsPDF } from '@/lib/utils/pdf-export'
import { toast } from 'sonner'

interface ExportPDFButtonProps {
  results: any // Type from calculateResults
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ExportPDFButton({ results, variant = 'outline', size = 'default' }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      await generateResultsPDF(results)
      toast.success('PDF généré !', {
        description: 'Le fichier PDF a été téléchargé',
      })
    } catch (error) {
      console.error('Erreur export PDF:', error)
      toast.error('Erreur lors de l\'export PDF', {
        description: 'Veuillez réessayer',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Génération...</span>
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" aria-hidden="true" />
          <span>Export PDF</span>
        </>
      )}
    </Button>
  )
}
