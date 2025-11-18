'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800',
          title: 'text-gray-900 dark:text-gray-100',
          description: 'text-gray-600 dark:text-gray-400',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800',
        },
      }}
      richColors
    />
  )
}
