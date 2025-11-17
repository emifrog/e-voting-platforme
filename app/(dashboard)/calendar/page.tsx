import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ElectionCalendar } from '@/components/calendar/election-calendar'

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer toutes les élections de l'utilisateur
  const { data: elections, error } = await supabase
    .from('elections')
    .select('id, title, description, start_date, end_date, status, vote_type, created_by')
    .eq('created_by', user.id)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des élections:', error)
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de vos élections
          </p>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            Erreur lors du chargement des élections
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendrier des Élections</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de toutes vos élections planifiées
        </p>
      </div>

      <ElectionCalendar elections={elections || []} />
    </div>
  )
}
