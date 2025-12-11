'use client'

/**
 * Formulaire de création/édition d'élection avec auto-save
 * Wrapper du ElectionForm existant qui ajoute l'auto-save
 */

import { useState, useEffect } from 'react'
import { ElectionForm } from './election-form'
import { useAutoSave } from '@/hooks/use-auto-save'
import { AutoSaveBanner, AutoSaveIndicator } from '@/components/forms/auto-save-banner'

interface ElectionFormWithAutosaveProps {
  election?: any
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
  isEdit?: boolean
}

export function ElectionFormWithAutosave({
  election,
  action,
  submitLabel,
  isEdit = false,
}: ElectionFormWithAutosaveProps) {
  // État du formulaire (synchronisé avec les inputs)
  const [formData, setFormData] = useState<Record<string, any>>({
    title: election?.title || '',
    description: election?.description || '',
    voteType: election?.vote_type || 'single',
    isSecret: election?.is_secret ?? true,
    isWeighted: election?.is_weighted ?? false,
    allowAbstention: election?.allow_abstention ?? true,
    quorumType: election?.quorum_type || 'none',
    quorumValue: election?.quorum_value || '',
    startDate: election?.start_date || '',
    endDate: election?.end_date || '',
    meetingPlatform: election?.meeting_platform || '',
    meetingUrl: election?.meeting_url || '',
    meetingPassword: election?.meeting_password || '',
    resultsVisible: election?.results_visible ?? true,
  })

  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showRestoreBanner, setShowRestoreBanner] = useState(false)

  // Auto-save hook
  const { save, restore, clear, hasSaved, getSavedAge } = useAutoSave({
    key: isEdit ? `edit-election-${election?.id}` : 'create-election',
    data: formData,
    enabled: !isEdit, // Auto-save uniquement pour création (pas édition)
    debounceMs: 500,
    onSave: () => {
      setLastSavedAt(new Date())
    },
  })

  // Vérifier si une sauvegarde existe au montage
  useEffect(() => {
    if (!isEdit && hasSaved()) {
      setShowRestoreBanner(true)
    }
  }, [hasSaved, isEdit])

  // Restaurer la sauvegarde
  const handleRestore = () => {
    const restored = restore()
    if (restored) {
      setFormData(restored)
      // Déclencher un événement personnalisé pour mettre à jour les inputs du formulaire
      window.dispatchEvent(
        new CustomEvent('autosave-restore', { detail: restored })
      )
    }
  }

  // Ignorer/supprimer la sauvegarde
  const handleDismiss = () => {
    clear()
    setShowRestoreBanner(false)
  }

  // Wrapper de l'action pour nettoyer l'auto-save après soumission réussie
  const wrappedAction = async (formData: FormData) => {
    try {
      await action(formData)
      // Si réussi, supprimer l'auto-save
      clear()
    } catch (error) {
      // Laisser l'auto-save en cas d'erreur
      throw error
    }
  }

  // Suivre les changements du formulaire
  useEffect(() => {
    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      const { name, type } = target
      const value =
        type === 'checkbox' ? (target as HTMLInputElement).checked : target.value

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Écouter tous les changements d'input dans le formulaire
    const form = document.querySelector('form')
    form?.addEventListener('input', handleChange)
    form?.addEventListener('change', handleChange)

    return () => {
      form?.removeEventListener('input', handleChange)
      form?.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <div>
      {/* Bannière de restauration */}
      {showRestoreBanner && (
        <AutoSaveBanner
          hasSaved={hasSaved()}
          savedAgeMinutes={getSavedAge()}
          onRestore={handleRestore}
          onDismiss={handleDismiss}
        />
      )}

      {/* Formulaire original */}
      <ElectionForm
        election={election}
        action={wrappedAction}
        submitLabel={submitLabel}
        isEdit={isEdit}
      />

      {/* Indicateur d'auto-save (uniquement en création) */}
      {!isEdit && (
        <AutoSaveIndicator isSaving={false} lastSavedAt={lastSavedAt} />
      )}
    </div>
  )
}
