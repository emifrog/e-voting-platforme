import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ElectionForm } from '@/components/elections/election-form'
import { updateElection } from '@/lib/actions/elections'

export default async function EditElectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error: errorParam } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch election
  const { data: election, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (error || !election) {
    notFound()
  }

  // Only allow editing draft elections
  if (election.status !== 'draft') {
    redirect(`/elections/${id}?error=${encodeURIComponent('Seules les élections en brouillon peuvent être modifiées')}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href={`/elections/${id}`}
          className="text-sm text-primary hover:underline mb-2 inline-block"
        >
          ← Retour à l'élection
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Modifier l'élection</h1>
        <p className="text-muted-foreground mt-2">
          Mettez à jour les paramètres de votre élection
        </p>
      </div>

      {errorParam && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{decodeURIComponent(errorParam)}</p>
        </div>
      )}

      <ElectionForm
        election={election as any}
        action={updateElection}
        submitLabel="Enregistrer les modifications"
        isEdit
      />
    </div>
  )
}
