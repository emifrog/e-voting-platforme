'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'election_created' | 'election_started' | 'election_closed' | 'vote_cast' | 'voter_added'
  title: string
  message: string
  election_id?: string
  created_at: string
  read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Load initial notifications (simulated - would come from a notifications table in production)
    loadNotifications()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'elections',
        },
        (payload) => {
          const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            type: 'election_created',
            title: 'Nouvelle élection créée',
            message: `L'élection "${(payload.new as any).title}" a été créée`,
            election_id: (payload.new as any).id,
            created_at: new Date().toISOString(),
            read: false,
          }
          addNotification(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'elections',
          filter: 'status=eq.active',
        },
        (payload) => {
          if ((payload.old as any).status !== 'active') {
            const newNotification: Notification = {
              id: `notif-${Date.now()}`,
              type: 'election_started',
              title: 'Élection démarrée',
              message: `L'élection "${(payload.new as any).title}" est maintenant active`,
              election_id: (payload.new as any).id,
              created_at: new Date().toISOString(),
              read: false,
            }
            addNotification(newNotification)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
        },
        (payload) => {
          const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            type: 'vote_cast',
            title: 'Nouveau vote',
            message: 'Un vote a été enregistré',
            election_id: (payload.new as any).election_id,
            created_at: new Date().toISOString(),
            read: false,
          }
          addNotification(newNotification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadNotifications = () => {
    // In production, this would fetch from a notifications table
    // For now, we'll use localStorage
    const stored = localStorage.getItem('notifications')
    if (stored) {
      const parsed = JSON.parse(stored)
      setNotifications(parsed)
      setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, 50) // Keep last 50
      localStorage.setItem('notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount((prev) => prev + 1)

    // Show toast
    toast.success(notification.title, {
      description: notification.message,
    })
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      localStorage.setItem('notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      localStorage.setItem('notifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'election_created':
        return '🗳️'
      case 'election_started':
        return '✅'
      case 'election_closed':
        return '🔒'
      case 'vote_cast':
        return '📩'
      case 'voter_added':
        return '👤'
      default:
        return '📢'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`
    return `Il y a ${Math.floor(diffMins / 1440)} j`
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
