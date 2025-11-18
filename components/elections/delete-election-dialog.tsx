'use client'

/**
 * Dialogue de confirmation pour supprimer une élection
 * Exige la saisie du nom de l'élection pour confirmation
 */

import { useState, useTransition } from 'react'
import {
  hardDeleteElection,
  softDeleteElection,
} from '@/lib/actions/elections'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DeleteElectionDialogProps {
  electionId: string
  electionTitle: string
  status: string
  hasVotes: boolean
  isOpen: boolean
  onClose: () => void
}

export function DeleteElectionDialog({
  electionId,
  electionTitle,
  status,
  hasVotes,
  isOpen,
  onClose,
}: DeleteElectionDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Détermine le type de suppression
  const canHardDelete = status === 'draft' && !hasVotes
  const deleteType = canHardDelete ? 'définitive' : 'archivage'

  const handleDelete = () => {
    if (confirmText !== electionTitle) {
      toast.error('Le nom de l\'élection ne correspond pas')
      return
    }

    startTransition(async () => {
      let result

      if (canHardDelete) {
        result = await hardDeleteElection(electionId)
      } else {
        result = await softDeleteElection(electionId)
      }

      if (result.success) {
        toast.success(result.message)
        onClose()
        router.push('/elections')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {canHardDelete ? 'Supprimer définitivement' : 'Archiver l\'élection'}
        </h2>

        <div className="space-y-4">
          {/* Warning message */}
          <div
            className={`p-4 rounded-lg border ${
              canHardDelete
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}
          >
            <p
              className={`text-sm ${
                canHardDelete
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}
            >
              {canHardDelete ? (
                <>
                  <strong>⚠️ Action irréversible !</strong>
                  <br />
                  Cette élection sera <strong>supprimée définitivement</strong>{' '}
                  ainsi que tous ses candidats et électeurs.
                </>
              ) : (
                <>
                  <strong>📦 Archivage</strong>
                  <br />
                  Cette élection sera <strong>archivée</strong> (car elle
                  contient des votes ou n'est pas en brouillon). Vous pourrez la
                  restaurer plus tard depuis la corbeille.
                </>
              )}
            </p>
          </div>

          {/* Confirmation input */}
          <div>
            <label
              htmlFor="confirm-text"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Pour confirmer, saisissez le nom de l'élection :
            </label>
            <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded mb-2 text-gray-900 dark:text-white">
              {electionTitle}
            </p>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Saisissez le nom exact"
              disabled={isPending}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || confirmText !== electionTitle}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                canHardDelete
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isPending
                ? 'Suppression...'
                : canHardDelete
                ? 'Supprimer définitivement'
                : 'Archiver'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
