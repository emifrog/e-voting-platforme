import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getElectionProxies } from '@/lib/actions/proxies'
import ProxiesList from '@/components/proxies/proxies-list'
import CreateProxyDialog from '@/components/proxies/create-proxy-dialog'

export default async function ElectionProxiesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer l'élection
  const { data: election, error } = await supabase
    .from('elections')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (error || !election) {
    redirect('/elections')
  }

  // Récupérer les procurations
  const { data: proxies } = await getElectionProxies(id)

  // Statistiques
  const pendingCount = proxies?.filter((p: any) => p.status === 'pending').length || 0
  const validatedCount = proxies?.filter((p: any) => p.status === 'validated').length || 0
  const usedCount = proxies?.filter((p: any) => p.status === 'used').length || 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procurations</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {election.title}
          </p>
        </div>
        <CreateProxyDialog electionId={id}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle procuration
          </Button>
        </CreateProxyDialog>
      </div>

      {/* Statistiques */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>En attente</CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Validées</CardDescription>
            <CardTitle className="text-3xl text-green-600">{validatedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Utilisées</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{usedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Guide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Comment fonctionnent les procurations ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Création</strong> - L'administrateur crée une procuration entre deux électeurs inscrits
            </div>
            <div>
              <strong>2. Notification</strong> - Le mandataire reçoit un email l'informant de la procuration
            </div>
            <div>
              <strong>3. Validation</strong> - L'administrateur valide la procuration
            </div>
            <div>
              <strong>4. Vote</strong> - Le mandataire peut voter en son nom ET au nom du mandant
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>Important :</strong> Les procurations ne peuvent être créées que pour des électeurs qui n'ont pas encore voté.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des procurations */}
      {proxies && proxies.length > 0 ? (
        <ProxiesList proxies={proxies} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Aucune procuration configurée
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Créez une procuration pour permettre à un électeur de voter au nom d'un autre
            </p>
            <CreateProxyDialog electionId={id}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Créer une procuration
              </Button>
            </CreateProxyDialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
