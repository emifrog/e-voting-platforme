'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface Election {
  id: string
  title: string
  status: string
  created_at: string
  candidates?: any[]
  voters?: any[]
}

interface AnalyticsChartsProps {
  initialElections: Election[]
}

export function AnalyticsCharts({ initialElections }: AnalyticsChartsProps) {
  const [elections, setElections] = useState<Election[]>(initialElections)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to realtime changes on elections table
    const channel = supabase
      .channel('elections-analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'elections',
        },
        (payload) => {
          console.log('📊 Elections updated in real-time:', payload)
          // Refresh elections data
          fetchElections()
        }
      )
      .subscribe()

    async function fetchElections() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('elections')
        .select(`
          *,
          candidates(count),
          voters(count)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setElections(data as Election[])
      }
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Status Distribution Data
  const statusData = [
    { name: 'Brouillon', value: elections.filter((e) => e.status === 'draft').length, color: '#6b7280' },
    { name: 'Planifié', value: elections.filter((e) => e.status === 'scheduled').length, color: '#3b82f6' },
    { name: 'En cours', value: elections.filter((e) => e.status === 'active').length, color: '#22c55e' },
    { name: 'Terminé', value: elections.filter((e) => e.status === 'closed').length, color: '#ef4444' },
  ].filter((item) => item.value > 0)

  // Elections over time (last 7 days)
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        count: elections.filter((e) => {
          const electionDate = new Date(e.created_at)
          return electionDate.toDateString() === date.toDateString()
        }).length,
      })
    }
    return days
  }

  const timelineData = getLast7Days()

  // Candidates and Voters Stats
  const statsData = elections.slice(0, 5).map((election) => ({
    name: election.title.length > 15 ? election.title.substring(0, 15) + '...' : election.title,
    candidats: (election.candidates as any)?.[0]?.count || 0,
    électeurs: (election.voters as any)?.[0]?.count || 0,
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
          <CardDescription>Distribution de vos élections par statut</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Aucune donnée à afficher
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Élections créées ces 7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Élections" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Candidates vs Voters Bar Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Candidats et Électeurs</CardTitle>
          <CardDescription>Comparaison pour vos 5 dernières élections</CardDescription>
        </CardHeader>
        <CardContent>
          {statsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="candidats" fill="#3b82f6" />
                <Bar dataKey="électeurs" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Créez des élections pour voir les statistiques
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
