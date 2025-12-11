'use client'

/**
 * Menu mobile responsive
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/user/user-avatar'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import type { Profile } from '@/types/models'
import type { User } from '@supabase/supabase-js'

interface MobileMenuProps {
  user: User
  profile: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Élections', href: '/elections', icon: '🗳️' },
  { name: 'Calendrier', href: '/calendar', icon: '📅' },
  { name: 'Sécurité', href: '/settings/security', icon: '🔐' },
  { name: 'Paramètres', href: '/settings', icon: '⚙️' },
]

export function MobileMenu({ user, profile }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-muted transition-colors"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <Menu className="w-6 h-6" aria-hidden="true" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-white dark:bg-gray-950 z-50 shadow-xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation mobile"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                  E
                </div>
                <h2 className="text-xl font-bold text-primary">E-Voting</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* User Profile */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <UserAvatar size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4" aria-label="Navigation principale">
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          isActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900',
                          'flex items-center gap-3 rounded-lg p-3 text-base font-medium transition-all'
                        )}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
              <Link
                href="/elections/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <span className="text-xl">➕</span>
                <span>Nouvelle élection</span>
              </Link>

              {/* Logout Button */}
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Déconnexion</span>
                </Button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
