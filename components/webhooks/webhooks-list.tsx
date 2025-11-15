'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Copy, Trash2, PlayCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteWebhook, toggleWebhook, testWebhook } from '@/lib/actions/webhooks'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  is_active: boolean
  success_count: number
  failure_count: number
  last_triggered_at: string | null
  created_at: string
}

interface WebhooksListProps {
  webhooks: Webhook[]
}

export default function WebhooksList({ webhooks }: WebhooksListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({})
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce webhook ?')) {
      return
    }

    setLoadingId(id)
    try {
      await deleteWebhook(id)
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setLoadingId(id)
    try {
      await toggleWebhook(id, !currentStatus)
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleTest = async (id: string) => {
    setLoadingId(id)
    try {
      const result = await testWebhook(id)
      setTestResults({ ...testResults, [id]: result })
      setTimeout(() => {
        setTestResults((prev) => {
          const newResults = { ...prev }
          delete newResults[id]
          return newResults
        })
      }, 5000)
    } finally {
      setLoadingId(null)
    }
  }

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
  }

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <Card key={webhook.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{webhook.name}</CardTitle>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      webhook.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {webhook.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <CardDescription className="mt-1">
                  <a
                    href={webhook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {webhook.url}
                  </a>
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(webhook.id, webhook.is_active)}
                  disabled={loadingId === webhook.id}
                >
                  {webhook.is_active ? 'Désactiver' : 'Activer'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(webhook.id)}
                  disabled={loadingId === webhook.id}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Tester
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(webhook.id)}
                  disabled={loadingId === webhook.id}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Résultat du test */}
            {testResults[webhook.id] && (
              <div
                className={`mb-4 rounded-lg p-3 ${
                  testResults[webhook.id].success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResults[webhook.id].success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Test réussi !
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        Test échoué : {testResults[webhook.id].error}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Événements */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Événements ({webhook.events.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <code
                      key={event}
                      className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800"
                    >
                      {event}
                    </code>
                  ))}
                </div>
              </div>

              {/* Statistiques */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Statistiques
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Succès :</span>
                    <span className="font-medium text-green-600">
                      {webhook.success_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Échecs :</span>
                    <span className="font-medium text-red-600">
                      {webhook.failure_count}
                    </span>
                  </div>
                  {webhook.last_triggered_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dernier :</span>
                      <span className="font-medium">
                        {new Date(webhook.last_triggered_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secret */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Secret de signature
                  </p>
                  <code className="mt-1 block font-mono text-xs text-gray-600 dark:text-gray-400">
                    {visibleSecrets[webhook.id] ? webhook.secret : '••••••••••••••••'}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSecretVisibility(webhook.id)}
                  >
                    {visibleSecrets[webhook.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySecret(webhook.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Créé le {new Date(webhook.created_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
