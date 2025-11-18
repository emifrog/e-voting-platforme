'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import frLocale from '@fullcalendar/core/locales/fr'

interface Election {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  status: 'draft' | 'open' | 'closed'
  vote_type: string
}

interface ElectionCalendarProps {
  elections: Election[]
}

export function ElectionCalendar({ elections }: ElectionCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Transformer les élections en événements FullCalendar
  const events = elections.map((election) => {
    let color = '#3b82f6' // blue par défaut

    switch (election.status) {
      case 'draft':
        color = '#6b7280' // gray
        break
      case 'open':
        color = '#22c55e' // green
        break
      case 'closed':
        color = '#ef4444' // red
        break
    }

    return {
      id: election.id,
      title: election.title,
      start: election.start_date,
      end: election.end_date,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        description: election.description,
        status: election.status,
        voteType: election.vote_type,
      },
    }
  })

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event)
  }

  const handleDateClick = (arg: any) => {
    console.log('Date clicked:', arg.dateStr)
    // Pourrait ouvrir un modal pour créer une nouvelle élection
  }

  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendrier des Élections</CardTitle>
          <CardDescription>
            Vue d'ensemble de toutes vos élections planifiées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span className="text-sm">Brouillon</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Terminée</span>
            </div>
          </div>

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={frLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listWeek',
            }}
            buttonText={{
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              list: 'Liste',
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            displayEventTime={true}
            displayEventEnd={true}
            weekends={true}
            nowIndicator={true}
            editable={false}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            moreLinkText={(num) => `+${num} autres`}
          />
        </CardContent>
      </Card>

      {/* Détails de l'événement sélectionné */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedEvent.title}</CardTitle>
                <CardDescription className="mt-2">
                  {selectedEvent.extendedProps.description || 'Aucune description'}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Début</p>
                <p className="text-sm">
                  {new Date(selectedEvent.start).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fin</p>
                <p className="text-sm">
                  {new Date(selectedEvent.end).toLocaleString('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Badge
                variant={
                  selectedEvent.extendedProps.status === 'open'
                    ? 'default'
                    : selectedEvent.extendedProps.status === 'closed'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {selectedEvent.extendedProps.status === 'draft'
                  ? 'Brouillon'
                  : selectedEvent.extendedProps.status === 'open'
                    ? 'En cours'
                    : 'Terminée'}
              </Badge>
              <Badge variant="outline">
                {selectedEvent.extendedProps.voteType === 'simple'
                  ? 'Vote simple'
                  : selectedEvent.extendedProps.voteType === 'approval'
                    ? 'Vote par approbation'
                    : selectedEvent.extendedProps.voteType === 'ranked'
                      ? 'Vote par classement'
                      : 'Vote de liste'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <a
                href={`/elections/${selectedEvent.id}`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Voir les détails
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
