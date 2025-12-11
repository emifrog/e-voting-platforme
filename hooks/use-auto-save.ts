/**
 * Hook useAutoSave - Sauvegarde automatique des formulaires dans localStorage
 *
 * Évite la perte de données si l'utilisateur ferme accidentellement l'onglet
 * ou si le navigateur crash pendant la saisie
 */

import { useEffect, useRef, useCallback } from 'react'
import { useDebounce } from './use-debounce'

interface UseAutoSaveOptions {
  key: string // Clé unique localStorage
  data: Record<string, any> // Données du formulaire
  enabled?: boolean // Activer/désactiver l'auto-save
  debounceMs?: number // Délai de debounce (défaut: 500ms)
  onSave?: () => void // Callback appelé après sauvegarde
  onRestore?: (data: Record<string, any>) => void // Callback appelé après restauration
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  debounceMs = 500,
  onSave,
  onRestore,
}: UseAutoSaveOptions) {
  const isFirstRender = useRef(true)
  const debouncedData = useDebounce(data, debounceMs)

  /**
   * Sauvegarde dans localStorage
   */
  const save = useCallback(() => {
    if (!enabled) return

    try {
      const serialized = JSON.stringify({
        data: debouncedData,
        timestamp: Date.now(),
      })
      localStorage.setItem(`autosave_${key}`, serialized)
      onSave?.()
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }, [key, debouncedData, enabled, onSave])

  /**
   * Restaure depuis localStorage
   */
  const restore = useCallback((): Record<string, any> | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      if (!saved) return null

      const parsed = JSON.parse(saved)
      const { data: savedData, timestamp } = parsed

      // Vérifier que les données ne sont pas trop anciennes (7 jours)
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 jours en ms
      if (Date.now() - timestamp > maxAge) {
        // Supprimer les données expirées
        clear()
        return null
      }

      onRestore?.(savedData)
      return savedData
    } catch (error) {
      console.error('Auto-restore error:', error)
      return null
    }
  }, [key, onRestore])

  /**
   * Supprime la sauvegarde
   */
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`)
    } catch (error) {
      console.error('Auto-save clear error:', error)
    }
  }, [key])

  /**
   * Vérifie si une sauvegarde existe
   */
  const hasSaved = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      return saved !== null
    } catch {
      return false
    }
  }, [key])

  /**
   * Obtient l'âge de la sauvegarde en minutes
   */
  const getSavedAge = useCallback((): number | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      if (!saved) return null

      const { timestamp } = JSON.parse(saved)
      const ageMs = Date.now() - timestamp
      return Math.floor(ageMs / 1000 / 60) // Retourner en minutes
    } catch {
      return null
    }
  }, [key])

  /**
   * Auto-save au changement des données (après debounce)
   */
  useEffect(() => {
    // Ne pas sauvegarder au premier rendu (éviter d'écraser une sauvegarde existante)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!enabled) return

    save()
  }, [debouncedData, enabled, save])

  /**
   * Cleanup au démontage
   */
  useEffect(() => {
    return () => {
      // Optionnel : sauvegarder une dernière fois au démontage
      // save()
    }
  }, [])

  return {
    save, // Sauvegarder manuellement
    restore, // Restaurer manuellement
    clear, // Supprimer la sauvegarde
    hasSaved, // Vérifie si sauvegarde existe
    getSavedAge, // Âge de la sauvegarde en minutes
  }
}
