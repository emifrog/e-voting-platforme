'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addVoter } from '@/lib/actions/voters'

interface AddVoterDialogProps {
  electionId: string
}

export function AddVoterDialog({ electionId }: AddVoterDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)

    const result = await addVoter(electionId, formData)

    if (result?.error) {
      alert(result.error.message || 'Erreur lors de l\'ajout')
    } else {
      setIsOpen(false)
    }

    setIsLoading(false)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        Ajouter un électeur
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Ajouter un électeur</h2>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="electeur@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Poids du vote</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="0.1"
              defaultValue="1.0"
              placeholder="1.0"
            />
            <p className="text-xs text-muted-foreground">
              Pour les votes pondérés uniquement
            </p>
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
