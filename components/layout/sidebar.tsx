'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/models'

interface SidebarProps {
  profile: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Élections', href: '/elections', icon: '🗳️' },
  { name: 'Sécurité', href: '/settings/security', icon: '🔐' },
  { name: 'Paramètres', href: '/settings', icon: '⚙️' },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-primary">E-Voting</h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? 'bg-gray-50 text-primary'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <span>{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-600">Plan actuel</p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {profile?.subscription_plan || 'Free'}
                </p>
                {profile?.subscription_plan === 'free' && (
                  <Link
                    href="/settings/billing"
                    className="mt-2 block text-xs text-primary hover:underline"
                  >
                    Passer à Pro →
                  </Link>
                )}
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
