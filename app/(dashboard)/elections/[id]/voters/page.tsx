import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddVoterDialog } from '@/components/voters/add-voter-dialog'
import { ImportVotersDialog } from '@/components/voters/import-voters-dialog'
import { VotersList } from '@/components/voters/voters-list'
import { QRCodeInvitation } from '@/components/voters/qr-code-invitation'
import { sendInvitations } from '@/lib/actions/voters'

const VOTERS_PER_PAGE = 50

export default async function VotersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))

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

  // Fetch voters count and stats (lightweight query)
  const { data: votersStats, count: totalVoters } = await supabase
    .from('voters')
    .select('has_voted, invitation_sent_at', { count: 'exact' })
    .eq('election_id', id)

  const votersStatsData = votersStats || []
  const votedCount = votersStatsData.filter((v) => v.has_voted).length
  const invitedCount = votersStatsData.filter((v) => v.invitation_sent_at).length
  const totalPages = Math.ceil((totalVoters || 0) / VOTERS_PER_PAGE)

  // Fetch paginated voters data
  const from = (currentPage - 1) * VOTERS_PER_PAGE
  const to = from + VOTERS_PER_PAGE - 1

  const { data: voters } = await supabase
    .from('voters')
    .select('*')
    .eq('election_id', id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const votersData = voters || []

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
            <div className="text-2xl font-bold">{totalVoters || 0}</div>
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
              {(totalVoters || 0) > 0
                ? ((votedCount / (totalVoters || 1)) * 100).toFixed(0)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Taux actuel</p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Invitation */}
      {(election.status === 'draft' || election.status === 'scheduled') && (
        <QRCodeInvitation electionId={election.id} electionTitle={election.title} />
      )}

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
            {(totalVoters || 0) > 0 && invitedCount < (totalVoters || 0) && (
              <form action={handleSendInvitations as any}>
                <Button type="submit" variant="outline">
                  Envoyer les invitations ({(totalVoters || 0) - invitedCount})
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Voters List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des électeurs ({totalVoters || 0})</CardTitle>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {votersData.length > 0 ? (
            <>
              <VotersList
                voters={votersData}
                electionId={election.id}
                canEdit={election.status === 'draft'}
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={currentPage === 1}
                  >
                    <Link href={`/elections/${id}/voters?page=${currentPage - 1}`}>
                      ← Précédent
                    </Link>
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          asChild
                        >
                          <Link href={`/elections/${id}/voters?page=${pageNum}`}>
                            {pageNum}
                          </Link>
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={currentPage === totalPages}
                  >
                    <Link href={`/elections/${id}/voters?page=${currentPage + 1}`}>
                      Suivant →
                    </Link>
                  </Button>
                </div>
              )}
            </>
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
