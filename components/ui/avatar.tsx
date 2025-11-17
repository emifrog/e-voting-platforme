'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  // Générer les initiales à partir du nom
  const getInitials = (name: string): string => {
    if (!name) return '?'

    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }

  // Générer une couleur de fond basée sur le nom
  const getColorFromName = (name: string): string => {
    if (!name) return 'hsl(var(--muted))'

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const initials = getInitials(fallback || alt || '')
  const bgColor = getColorFromName(fallback || alt || '')

  const showImage = src && !imageError

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        sizeClasses[size],
        !showImage && bgColor,
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-semibold text-white select-none">
          {initials}
        </span>
      )}
    </div>
  )
}

interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  className?: string
}

export function AvatarGroup({ children, max = 3, className }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children)
  const displayChildren = max ? childArray.slice(0, max) : childArray
  const remaining = childArray.length - displayChildren.length

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-muted ring-2 ring-background">
          <span className="text-xs font-semibold text-muted-foreground">
            +{remaining}
          </span>
        </div>
      )}
    </div>
  )
}
