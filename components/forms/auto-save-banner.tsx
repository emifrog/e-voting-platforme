'use client'

/**
 * Bannière pour restaurer une sauvegarde automatique
 */

import { useState, useEffect } from 'react'
import { AlertCircle, X, RotateCcw } from 'lucide-react'

interface AutoSaveBannerProps {
  hasSaved: boolean
  savedAgeMinutes: number | null
  onRestore: () => void
  onDismiss: () => void
}

export function AutoSaveBanner({
  hasSaved,
  savedAgeMinutes,
  onRestore,
  onDismiss,
}: AutoSaveBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(hasSaved)
  }, [hasSaved])

  if (!isVisible) return null

  const formatAge = (minutes: number | null) => {
    if (!minutes) return 'récemment'
    if (minutes < 1) return 'il y a moins d\'une minute'
    if (minutes === 1) return 'il y a 1 minute'
    if (minutes < 60) return `il y a ${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'il y a 1 heure'
    if (hours < 24) return `il y a ${hours} heures`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'il y a 1 jour'
    return `il y a ${days} jours`
  }

  const handleRestore = () => {
    onRestore()
    setIsVisible(false)
  }

  const handleDismiss = () => {
    onDismiss()
    setIsVisible(false)
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Brouillon sauvegardé automatiquement
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Nous avons trouvé un brouillon sauvegardé {formatAge(savedAgeMinutes)}.
            Voulez-vous le restaurer ?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestore}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurer le brouillon
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors"
            >
              Ignorer
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

/**
 * Indicateur d'auto-save en bas à droite
 */
interface AutoSaveIndicatorProps {
  isSaving: boolean
  lastSavedAt: Date | null
}

export function AutoSaveIndicator({ isSaving, lastSavedAt }: AutoSaveIndicatorProps) {
  if (!isSaving && !lastSavedAt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          {isSaving ? (
            <>
              <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-gray-600 dark:text-gray-400">
                Sauvegarde...
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                Sauvegardé {lastSavedAt && formatTimeAgo(lastSavedAt)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 5) return 'à l\'instant'
  if (seconds < 60) return `il y a ${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `il y a ${minutes}min`

  return 'récemment'
}
