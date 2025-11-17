'use client'

import { useUser } from '@/lib/hooks/use-user'
import { Avatar } from '@/components/ui/avatar'

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showName?: boolean
}

export function UserAvatar({ size = 'md', className, showName = false }: UserAvatarProps) {
  const { name, email, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className={`rounded-full bg-muted animate-pulse ${
          size === 'sm' ? 'h-8 w-8' :
          size === 'md' ? 'h-10 w-10' :
          size === 'lg' ? 'h-12 w-12' :
          'h-16 w-16'
        }`} />
        {showName && (
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar
        fallback={name}
        alt={name}
        size={size}
        className={className}
      />
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{name}</span>
          {email && (
            <span className="text-xs text-muted-foreground">{email}</span>
          )}
        </div>
      )}
    </div>
  )
}
