/**
 * Utility functions for toast notifications using Sonner
 */

import { toast } from 'sonner'

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 5000,
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 7000,
    })
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 5000,
    })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 6000,
    })
  },

  loading: (message: string) => {
    return toast.loading(message)
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
  ) => {
    return toast.promise(promise, messages)
  },
}

// Exemples d'utilisation :
//
// showToast.success('Vote enregistré !', 'Votre vote a été chiffré et sauvegardé')
// showToast.error('Erreur', 'Impossible de se connecter')
// showToast.info('Nouvelle élection', 'Une nouvelle élection est disponible')
//
// const loadingId = showToast.loading('Envoi en cours...')
// // Après l'opération
// toast.dismiss(loadingId)
// showToast.success('Envoyé !')
//
// showToast.promise(
//   fetchData(),
//   {
//     loading: 'Chargement...',
//     success: 'Données chargées !',
//     error: 'Erreur de chargement'
//   }
// )
