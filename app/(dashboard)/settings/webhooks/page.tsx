import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserWebhooks } from '@/lib/actions/webhooks'
import WebhooksList from '@/components/webhooks/webhooks-list'
import CreateWebhookDialog from '@/components/webhooks/create-webhook-dialog'

export default async function WebhooksPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: webhooks } = await getUserWebhooks()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Recevez des notifications en temps réel sur vos événements
          </p>
        </div>
        <CreateWebhookDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau webhook
          </Button>
        </CreateWebhookDialog>
      </div>

      {/* Guide rapide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Comment utiliser les webhooks ?</CardTitle>
          <CardDescription>
            Les webhooks vous permettent de recevoir des notifications HTTP en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Créez un endpoint</strong> - Configurez une URL qui recevra les événements
            </div>
            <div>
              <strong>2. Sélectionnez les événements</strong> - Choisissez quels événements vous souhaitez recevoir
            </div>
            <div>
              <strong>3. Vérifiez la signature</strong> - Utilisez le secret pour vérifier l'authenticité des requêtes
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-sm font-medium">Événements disponibles :</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• <code>election.created</code> - Nouvelle élection créée</li>
              <li>• <code>election.updated</code> - Élection modifiée</li>
              <li>• <code>election.started</code> - Élection démarrée</li>
              <li>• <code>election.closed</code> - Élection fermée</li>
              <li>• <code>vote.cast</code> - Vote soumis</li>
              <li>• <code>voter.added</code> - Électeur ajouté</li>
              <li>• <code>results.published</code> - Résultats publiés</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Liste des webhooks */}
      {webhooks && webhooks.length > 0 ? (
        <WebhooksList webhooks={webhooks} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Aucun webhook configuré
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Créez votre premier webhook pour commencer à recevoir des notifications
            </p>
            <CreateWebhookDialog>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Créer un webhook
              </Button>
            </CreateWebhookDialog>
          </CardContent>
        </Card>
      )}

      {/* Exemple de code */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Exemple de vérification de signature</CardTitle>
          <CardDescription>
            Code pour vérifier l'authenticité des webhooks dans votre backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
{`import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// Dans votre endpoint
app.post('/webhooks/e-voting', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const payload = JSON.stringify(req.body)

  if (!verifyWebhookSignature(payload, signature, YOUR_SECRET)) {
    return res.status(401).send('Signature invalide')
  }

  // Traiter l'événement
  const { event, data } = req.body
  console.log(\`Événement reçu: \${event}\`, data)

  res.json({ received: true })
})`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
