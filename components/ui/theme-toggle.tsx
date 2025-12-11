'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Éviter le hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
      <span className="sr-only">Changer de thème</span>
    </Button>
  )
}

/**
 * Toggle avec label (pour settings page)
 */
export function ThemeToggleWithLabel() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">Thème</div>
        <div className="text-xs text-muted-foreground">
          Choisir entre le mode clair et sombre
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme('light')}
          className={`p-2 rounded-md transition-colors ${
            theme === 'light'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
          aria-label="Mode clair"
          aria-pressed={theme === 'light'}
        >
          <Sun className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-2 rounded-md transition-colors ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
          aria-label="Mode sombre"
          aria-pressed={theme === 'dark'}
        >
          <Moon className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            theme === 'system'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
          aria-label="Thème système"
          aria-pressed={theme === 'system'}
        >
          Auto
        </button>
      </div>
    </div>
  )
}
