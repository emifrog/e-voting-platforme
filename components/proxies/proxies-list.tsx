'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { validateProxy, revokeProxy } from '@/lib/actions/proxies'

interface Proxy {
  id: string
  donor_email: string
  proxy_email: string
  status: 'pending' | 'validated' | 'revoked' | 'used'
  validated_at: string | null
  revoked_at: string | null
  used_at: string | null
  created_at: string
}

interface ProxiesListProps {
  proxies: Proxy[]
}

export default function ProxiesList({ proxies }: ProxiesListProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleValidate = async (id: string) => {
    setLoadingId(id)
    try {
      await validateProxy(id)
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer cette procuration ?')) {
      return
    }

    setLoadingId(id)
    try {
      await revokeProxy(id)
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  const getStatusBadge = (status: Proxy['status']) => {
    const badges = {
      pending: {
        icon: Clock,
        label: 'En attente',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      validated: {
        icon: CheckCircle,
        label: 'Validée',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      revoked: {
        icon: Ban,
        label: 'Révoquée',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
      used: {
        icon: CheckCircle,
        label: 'Utilisée',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
    }

    const badge = badges[status]
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {proxies.map((proxy) => (
        <Card key={proxy.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                {getStatusBadge(proxy.status)}
              </CardTitle>
              <div className="flex gap-2">
                {proxy.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidate(proxy.id)}
                      disabled={loadingId === proxy.id}
                    >
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Valider
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(proxy.id)}
                      disabled={loadingId === proxy.id}
                    >
                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                      Refuser
                    </Button>
                  </>
                )}
                {proxy.status === 'validated' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(proxy.id)}
                    disabled={loadingId === proxy.id}
                  >
                    Révoquer
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mandant (donneur)
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {proxy.donor_email}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mandataire (qui vote)
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {proxy.proxy_email}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <div>
                Créée le {new Date(proxy.created_at).toLocaleDateString('fr-FR')}
              </div>
              {proxy.validated_at && (
                <div>
                  Validée le {new Date(proxy.validated_at).toLocaleDateString('fr-FR')}
                </div>
              )}
              {proxy.revoked_at && (
                <div>
                  Révoquée le {new Date(proxy.revoked_at).toLocaleDateString('fr-FR')}
                </div>
              )}
              {proxy.used_at && (
                <div>
                  Utilisée le {new Date(proxy.used_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
