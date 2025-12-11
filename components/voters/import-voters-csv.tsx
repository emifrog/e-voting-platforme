'use client'

/**
 * Composant d'import de voteurs via CSV
 * Supporte drag & drop et validation
 */

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { parseCSV, validateVoterImport, type VoterImportRow } from '@/lib/utils/csv'
import { toast } from 'sonner'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface ImportVotersCSVProps {
  electionId: string
  onImport: (voters: VoterImportRow[]) => Promise<void>
  onClose: () => void
}

export function ImportVotersCSV({
  electionId,
  onImport,
  onClose,
}: ImportVotersCSVProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validVoters, setValidVoters] = useState<VoterImportRow[]>([])
  const [invalidRows, setInvalidRows] = useState<
    Array<{ row: number; data: Record<string, string>; errors: string[] }>
  >([])
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Focus trap pour accessibilité
  const dialogRef = useFocusTrap({
    enabled: true,
    onEscape: onClose,
    autoFocus: true,
    restoreFocus: true,
  })

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV')
      return
    }

    setIsProcessing(true)

    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      const validation = validateVoterImport(parsed)

      setValidVoters(validation.valid)
      setInvalidRows(validation.invalid)
      setStep('preview')

      if (validation.invalid.length > 0) {
        toast.warning(
          `${validation.invalid.length} ligne(s) invalide(s) détectée(s)`
        )
      }
    } catch (error) {
      console.error('CSV parse error:', error)
      toast.error('Erreur lors de la lecture du fichier CSV')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleImport = async () => {
    if (validVoters.length === 0) {
      toast.error('Aucun voteur valide à importer')
      return
    }

    setIsProcessing(true)

    try {
      await onImport(validVoters)
      toast.success(`${validVoters.length} voteur(s) importé(s) avec succès`)
      onClose()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Erreur lors de l\'importation')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'email,name,weight\nexemple@email.com,Jean Dupont,1.0'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template_voteurs.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-labelledby="import-csv-title"
        aria-modal="true"
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="import-csv-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Importer des voteurs (CSV)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fermer la fenêtre d'import"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' ? (
            <>
              {/* Template download */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  Le fichier CSV doit contenir les colonnes suivantes :
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside mb-3">
                  <li>
                    <strong>email</strong> (obligatoire)
                  </li>
                  <li>
                    <strong>name</strong> (optionnel)
                  </li>
                  <li>
                    <strong>weight</strong> (optionnel, défaut: 1.0)
                  </li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Télécharger un modèle CSV
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Upload
                  className={`w-12 h-12 mx-auto mb-4 ${
                    isDragging ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Glissez-déposez votre fichier CSV ici
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  ou
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Traitement...' : 'Choisir un fichier'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-900 dark:text-green-100">
                        {validVoters.length} valides
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Prêts à être importés
                    </p>
                  </div>

                  {invalidRows.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="font-semibold text-red-900 dark:text-red-100">
                          {invalidRows.length} invalides
                        </span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Seront ignorés
                      </p>
                    </div>
                  )}
                </div>

                {/* Valid voters preview */}
                {validVoters.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Aperçu des voteurs valides ({validVoters.length})
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-2 text-left">Email</th>
                              <th className="px-4 py-2 text-left">Nom</th>
                              <th className="px-4 py-2 text-left">Poids</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {validVoters.slice(0, 10).map((voter, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2">{voter.email}</td>
                                <td className="px-4 py-2">
                                  {voter.name || '-'}
                                </td>
                                <td className="px-4 py-2">{voter.weight}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {validVoters.length > 10 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                          + {validVoters.length - 10} autres voteurs...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Invalid rows */}
                {invalidRows.length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      Lignes invalides ({invalidRows.length})
                    </h3>
                    <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        {invalidRows.map((item, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 border-b border-red-200 dark:border-red-800 last:border-0"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-mono text-red-600 dark:text-red-400">
                                L{item.row}:
                              </span>
                              <div className="flex-1">
                                <p className="text-xs text-red-700 dark:text-red-300 mb-1">
                                  {JSON.stringify(item.data)}
                                </p>
                                <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside">
                                  {item.errors.map((err, j) => (
                                    <li key={j}>{err}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setStep('upload')}
                  disabled={isProcessing}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing || validVoters.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing
                    ? 'Importation...'
                    : `Importer ${validVoters.length} voteur(s)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
