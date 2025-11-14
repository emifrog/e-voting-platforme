'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addCandidate } from '@/lib/actions/elections'

interface AddCandidateDialogProps {
  electionId: string
  nextPosition: number
}

export function AddCandidateDialog({ electionId, nextPosition }: AddCandidateDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    formData.append('position', nextPosition.toString())

    const result = await addCandidate(electionId, formData)

    if (result?.error) {
      alert('Erreur lors de l\'ajout du candidat')
    } else {
      setIsOpen(false)
    }

    setIsLoading(false)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        Ajouter un candidat
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Ajouter un candidat</h2>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du candidat *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Description du candidat..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Ajout...' : 'Ajouter'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
