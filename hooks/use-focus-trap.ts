/**
 * Hook pour piéger le focus dans un élément (modale, dialog)
 * WCAG 2.1.2 & 2.4.3 - No Keyboard Trap & Focus Order
 */

import { useEffect, useRef } from 'react'

interface UseFocusTrapOptions {
  enabled?: boolean
  onEscape?: () => void
  autoFocus?: boolean
  restoreFocus?: boolean
}

export function useFocusTrap({
  enabled = true,
  onEscape,
  autoFocus = true,
  restoreFocus = true,
}: UseFocusTrapOptions = {}) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Sauvegarder l'élément actif
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus automatique sur le premier élément focusable
    if (autoFocus && containerRef.current) {
      const firstFocusable = getFocusableElements(containerRef.current)[0]
      firstFocusable?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return

      // Escape pour fermer
      if (event.key === 'Escape' && onEscape) {
        onEscape()
        return
      }

      // Tab pour piéger le focus
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(containerRef.current)

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Shift+Tab sur le premier élément -> dernier élément
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
        // Tab sur le dernier élément -> premier élément
        else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restaurer le focus
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, onEscape, autoFocus, restoreFocus])

  return containerRef
}

/**
 * Récupère tous les éléments focusables dans un conteneur
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector))

  return elements.filter((element) => {
    // Filtrer les éléments invisibles
    const style = window.getComputedStyle(element)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    )
  })
}
