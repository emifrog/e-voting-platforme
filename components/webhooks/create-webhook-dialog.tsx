'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWebhook } from '@/lib/actions/webhooks'

const AVAILABLE_EVENTS = [
  { value: 'election.created', label: 'Élection créée' },
  { value: 'election.updated', label: 'Élection modifiée' },
  { value: 'election.started', label: 'Élection démarrée' },
  { value: 'election.closed', label: 'Élection fermée' },
  { value: 'vote.cast', label: 'Vote soumis' },
  { value: 'voter.added', label: 'Électeur ajouté' },
  { value: 'results.published', label: 'Résultats publiés' },
]

interface CreateWebhookDialogProps {
  children: React.ReactNode
}

export default function CreateWebhookDialog({ children }: CreateWebhookDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: ['election.created', 'vote.cast', 'election.closed'],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createWebhook({
        ...formData,
        is_active: true,
      })

      if (!result.success) {
        setError(result.error || 'Erreur lors de la création')
        return
      }

      setOpen(false)
      setFormData({ name: '', url: '', events: ['election.created'] })
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un webhook</DialogTitle>
            <DialogDescription>
              Configurez un endpoint pour recevoir des notifications d'événements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="name">Nom du webhook</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon webhook production"
                required
              />
            </div>

            <div>
              <Label htmlFor="url">URL du endpoint</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/webhooks/evoting"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Les événements seront envoyés à cette URL en POST
              </p>
            </div>

            <div>
              <Label>Événements à recevoir</Label>
              <div className="mt-2 space-y-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label
                    key={event.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{event.label}</span>
                    <code className="text-xs text-gray-500">({event.value})</code>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Sélectionnez au moins un événement
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
              <p className="font-medium text-blue-900 dark:text-blue-300">
                💡 Secret de signature
              </p>
              <p className="mt-1 text-blue-800 dark:text-blue-400">
                Un secret sera automatiquement généré pour sécuriser vos webhooks.
                Vous pourrez le voir après la création.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || formData.events.length === 0}>
              {loading ? 'Création...' : 'Créer le webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
