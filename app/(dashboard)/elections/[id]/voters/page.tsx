import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddVoterDialog } from '@/components/voters/add-voter-dialog'
import { ImportVotersDialog } from '@/components/voters/import-voters-dialog'
import { VotersList } from '@/components/voters/voters-list'
import { sendInvitations } from '@/lib/actions/voters'

export default async function VotersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

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

  // Fetch voters
  const { data: voters } = await supabase
    .from('voters')
    .select('*')
    .eq('election_id', id)
    .order('created_at', { ascending: false })

  const votersData = voters || []
  const votedCount = votersData.filter((v) => v.has_voted).length
  const invitedCount = votersData.filter((v) => v.invitation_sent_at).length

  const handleSendInvitations = async () => {
    'use server'
    const result = await sendInvitations(id)
    if (result.error) {
      // Handle error
      return
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/elections/${id}`}
            className="text-sm text-primary hover:underline mb-2 inline-block"
          >
            ← Retour à l'élection
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Électeurs - {election.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez la liste des électeurs pour cette élection
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{votersData.length}</div>
            <p className="text-xs text-muted-foreground">Électeurs inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invités</CardTitle>
            <span className="text-2xl">📧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitedCount}</div>
            <p className="text-xs text-muted-foreground">Invitations envoyées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Votes</CardTitle>
            <span className="text-2xl">🗳️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{votedCount}</div>
            <p className="text-xs text-muted-foreground">Ont voté</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {votersData.length > 0
                ? ((votedCount / votersData.length) * 100).toFixed(0)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Taux actuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {election.status === 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Ajoutez des électeurs ou importez une liste
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <AddVoterDialog electionId={election.id} />
            <ImportVotersDialog electionId={election.id} />
            {votersData.length > 0 && invitedCount < votersData.length && (
              <form action={handleSendInvitations as any}>
                <Button type="submit" variant="outline">
                  Envoyer les invitations ({votersData.length - invitedCount})
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voters List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des électeurs ({votersData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {votersData.length > 0 ? (
            <VotersList
              voters={votersData}
              electionId={election.id}
              canEdit={election.status === 'draft'}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">
                Aucun électeur pour le moment
              </p>
              <div className="flex gap-4 justify-center">
                <AddVoterDialog electionId={election.id} />
                <ImportVotersDialog electionId={election.id} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Template */}
      {election.status === 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>Modèle CSV</CardTitle>
            <CardDescription>
              Utilisez ce format pour importer vos électeurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              email,name,weight{'\n'}
              jean.dupont@example.com,Jean Dupont,1.0{'\n'}
              marie.martin@example.com,Marie Martin,1.0{'\n'}
              paul.bernard@example.com,Paul Bernard,2.0
            </pre>
            <p className="text-sm text-muted-foreground mt-4">
              <strong>Note:</strong> La colonne "email" est obligatoire. Les colonnes "name" et "weight" sont optionnelles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
