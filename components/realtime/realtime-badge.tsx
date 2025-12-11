'use client'

import { useRealtimeElection } from '@/lib/hooks/use-realtime-election'

interface RealtimeBadgeProps {
  electionId: string
}

export function RealtimeBadge({ electionId }: RealtimeBadgeProps) {
  const { isConnected, notifications } = useRealtimeElection(electionId)

  return (
    <div className="flex items-center gap-2">
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        ${isConnected
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        }
      `}>
        <div className={`
          w-2 h-2 rounded-full
          ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}
        `} />
        <span>
          {isConnected ? 'Temps réel actif' : 'Hors ligne'}
        </span>
      </div>

      {notifications.length > 0 && (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
          {notifications.length}
        </div>
      )}
    </div>
  )
}
