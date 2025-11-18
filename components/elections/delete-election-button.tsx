'use client'

/**
 * Bouton pour supprimer une élection avec confirmation
 */

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { DeleteElectionDialog } from './delete-election-dialog'

interface DeleteElectionButtonProps {
  electionId: string
  electionTitle: string
  status: string
  hasVotes?: boolean
  variant?: 'icon' | 'button'
  className?: string
}

export function DeleteElectionButton({
  electionId,
  electionTitle,
  status,
  hasVotes = false,
  variant = 'button',
  className = '',
}: DeleteElectionButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsDialogOpen(true)}
          className={`p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${className}`}
          title="Supprimer l'élection"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <DeleteElectionDialog
          electionId={electionId}
          electionTitle={electionTitle}
          status={status}
          hasVotes={hasVotes}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800 ${className}`}
      >
        <Trash2 className="w-4 h-4" />
        <span>Supprimer</span>
      </button>
      <DeleteElectionDialog
        electionId={electionId}
        electionTitle={electionTitle}
        status={status}
        hasVotes={hasVotes}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}
