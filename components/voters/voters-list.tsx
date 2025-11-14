'use client'

import { deleteVoter } from '@/lib/actions/voters'
import { Button } from '@/components/ui/button'
import type { Voter } from '@/types/models'

interface VotersListProps {
  voters: Voter[]
  electionId: string
  canEdit: boolean
}

export function VotersList({ voters, electionId, canEdit }: VotersListProps) {
  const handleDelete = async (voterId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet électeur ?')) {
      return
    }

    const result = await deleteVoter(voterId, electionId)
    if (result?.error) {
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
        <div className="col-span-4">Email</div>
        <div className="col-span-3">Nom</div>
        <div className="col-span-1">Poids</div>
        <div className="col-span-2">Statut</div>
        {canEdit && <div className="col-span-2">Actions</div>}
      </div>

      {voters.map((voter) => (
        <div
          key={voter.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-gray-50 items-center"
        >
          <div className="col-span-4 font-medium text-sm truncate">
            {voter.email}
          </div>
          <div className="col-span-3 text-sm truncate">{voter.name || '-'}</div>
          <div className="col-span-1 text-sm">{voter.weight}</div>
          <div className="col-span-2">
            {voter.has_voted ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ A voté
              </span>
            ) : voter.invitation_sent_at ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📧 Invité
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                En attente
              </span>
            )}
          </div>
          {canEdit && (
            <div className="col-span-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(voter.id)}
                disabled={voter.has_voted}
              >
                Supprimer
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
