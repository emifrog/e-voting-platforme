'use client'

import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types/models'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
  profile: Profile | null
}

export default function Header({ user, profile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          {/* Mobile menu button could go here */}
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-x-4">
            <span className="text-sm font-medium text-gray-700">
              {profile?.full_name || user.email}
            </span>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
