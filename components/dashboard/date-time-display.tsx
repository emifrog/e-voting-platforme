'use client'

import { useEffect, useState } from 'react'

export function DateTimeDisplay() {
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())

  useEffect(() => {
    // Update every second
    const interval = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)
  }

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-sm font-medium text-muted-foreground">
        {formatDate(currentDateTime)}
      </div>
      <div className="text-2xl font-bold tabular-nums">
        {formatTime(currentDateTime)}
      </div>
    </div>
  )
}
