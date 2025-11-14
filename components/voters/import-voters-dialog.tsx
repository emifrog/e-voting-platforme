'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { importVotersCSV } from '@/lib/actions/voters'

interface ImportVotersDialogProps {
  electionId: string
}

export function ImportVotersDialog({ electionId }: ImportVotersDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert('Veuillez sélectionner un fichier CSV')
      return
    }

    setIsLoading(true)

    try {
      const text = await file.text()
      const result = await importVotersCSV(electionId, text)

      if (result?.error) {
        alert(result.error.message || 'Erreur lors de l\'import')
      } else if (result?.success) {
        alert(
          `${result.imported} électeur(s) importé(s) avec succès` +
            (result.errors ? `\n\nErreurs:\n${result.errors.join('\n')}` : '')
        )
        setIsOpen(false)
        setFile(null)
      }
    } catch (error) {
      alert('Erreur lors de la lecture du fichier')
    }

    setIsLoading(false)
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Importer CSV
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Importer des électeurs (CSV)</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Fichier CSV</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Format attendu:</h3>
            <pre className="text-xs bg-white p-2 rounded">
              email,name,weight{'\n'}
              user@example.com,User Name,1.0
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              La colonne "email" est obligatoire
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || !file}>
              {isLoading ? 'Import en cours...' : 'Importer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setFile(null)
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
