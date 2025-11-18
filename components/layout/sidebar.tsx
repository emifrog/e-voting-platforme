'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/user/user-avatar'
import { Badge } from '@/components/ui/badge'
import { useSidebar } from './sidebar-layout'
import type { Profile } from '@/types/models'

interface SidebarProps {
  profile: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Vue d\'ensemble' },
  { name: 'Élections', href: '/elections', icon: '🗳️', description: 'Gérer les élections' },
  { name: 'Calendrier', href: '/calendar', icon: '📅', description: 'Vue calendrier', badge: 'Nouveau' },
  { name: 'Sécurité', href: '/settings/security', icon: '🔐', description: 'Authentification 2FA' },
  { name: 'Paramètres', href: '/settings', icon: '⚙️', description: 'Configuration' },
]

const quickActions = [
  { name: 'Nouvelle élection', href: '/elections/new', icon: '➕' },
  { name: 'Aide & Support', href: '/help', icon: '❓' },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useSidebar()

  return (
    <div
      className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:w-20" : "lg:w-64"
      )}
    >
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 dark:border-gray-800 dark:bg-gray-950">
        {/* Logo / Header */}
        <div className="flex h-16 shrink-0 items-center justify-between">
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                E
              </div>
              <h1 className="text-xl font-bold text-primary">E-Voting</h1>
            </Link>
          ) : (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                E
              </div>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title={isCollapsed ? "Agrandir" : "Minimiser"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "transition-transform duration-300",
                isCollapsed && "rotate-180"
              )}
            >
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
          </button>
        </div>

        {/* User Profile */}
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <UserAvatar size="md" showName />
          </div>
        ) : (
          <div className="flex items-center justify-center p-3">
            <UserAvatar size="md" />
          </div>
        )}

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {/* Main Navigation */}
            <li>
              {!isCollapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Navigation
                </p>
              )}
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900',
                          'group flex items-center gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold transition-all',
                          isCollapsed && 'justify-center'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {isCollapsed ? (
                          <div className="relative">
                            <span className="text-xl">{item.icon}</span>
                            {item.badge && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-x-3">
                              <span className="text-xl">{item.icon}</span>
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                <span className="text-xs font-normal text-muted-foreground">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>

            {/* Quick Actions */}
            <li>
              {!isCollapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Actions Rapides
                </p>
              )}
              <ul role="list" className="-mx-2 space-y-1">
                {quickActions.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-x-3 rounded-lg p-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900 transition-all",
                        isCollapsed && 'justify-center'
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <span>{item.icon}</span>
                      {!isCollapsed && item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* Subscription Info */}
            <li className="mt-auto">
              {!isCollapsed ? (
                <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Plan actuel</p>
                    <Badge variant={profile?.subscription_plan === 'pro' ? 'default' : 'secondary'}>
                      {profile?.subscription_plan === 'pro' ? '⭐ Pro' : 'Free'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold capitalize dark:text-gray-200 mb-3">
                    {profile?.subscription_plan === 'pro'
                      ? 'Accès complet'
                      : 'Fonctionnalités limitées'}
                  </p>
                  {profile?.subscription_plan === 'free' && (
                    <Link
                      href="/settings/billing"
                      className="flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                    >
                      Passer à Pro →
                    </Link>
                  )}
                  {profile?.subscription_plan === 'pro' && (
                    <Link
                      href="/settings/billing"
                      className="block text-xs text-primary hover:underline text-center"
                    >
                      Gérer l'abonnement
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/settings/billing"
                  className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-all"
                  title={profile?.subscription_plan === 'pro' ? 'Plan Pro' : 'Passer à Pro'}
                >
                  <span className="text-xl">
                    {profile?.subscription_plan === 'pro' ? '⭐' : '💎'}
                  </span>
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
