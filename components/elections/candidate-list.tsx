'use client'

import { deleteCandidate } from '@/lib/actions/elections'
import { Button } from '@/components/ui/button'
import type { Candidate } from '@/types/models'

interface CandidateListProps {
  candidates: Candidate[]
  electionId: string
  canEdit: boolean
}

export function CandidateList({ candidates, electionId, canEdit }: CandidateListProps) {
  const handleDelete = async (candidateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce candidat ?')) {
      return
    }

    const result = await deleteCandidate(candidateId, electionId)
    if (result?.error) {
      alert('Erreur lors de la suppression')
    }
  }

  const sortedCandidates = [...candidates].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-3">
      {sortedCandidates.map((candidate, index) => (
        <div
          key={candidate.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{candidate.name}</h4>
              {candidate.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {candidate.description}
                </p>
              )}
            </div>
          </div>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(candidate.id)}
              aria-label={`Supprimer le candidat ${candidate.name}`}
            >
              Supprimer
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
