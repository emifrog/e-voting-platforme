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
import { createProxy } from '@/lib/actions/proxies'

interface CreateProxyDialogProps {
  electionId: string
  children: React.ReactNode
}

export default function CreateProxyDialog({ electionId, children }: CreateProxyDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    donorEmail: '',
    proxyEmail: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createProxy({
        electionId,
        ...formData,
      })

      if (!result.success) {
        setError(result.error || 'Erreur lors de la création')
        return
      }

      setOpen(false)
      setFormData({ donorEmail: '', proxyEmail: '' })
      router.refresh()
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer une procuration</DialogTitle>
            <DialogDescription>
              Permettre à un électeur de voter au nom d'un autre
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="donorEmail">Email du mandant (donneur de procuration)</Label>
              <Input
                id="donorEmail"
                type="email"
                value={formData.donorEmail}
                onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                placeholder="mandant@example.com"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                La personne qui donne procuration
              </p>
            </div>

            <div>
              <Label htmlFor="proxyEmail">Email du mandataire (qui votera)</Label>
              <Input
                id="proxyEmail"
                type="email"
                value={formData.proxyEmail}
                onChange={(e) => setFormData({ ...formData, proxyEmail: e.target.value })}
                placeholder="mandataire@example.com"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                La personne qui votera au nom du mandant
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
              <p className="font-medium text-blue-900 dark:text-blue-300">
                ℹ️ Conditions requises
              </p>
              <ul className="mt-2 space-y-1 text-blue-800 dark:text-blue-400">
                <li>• Les deux électeurs doivent être inscrits à l'élection</li>
                <li>• Le mandant ne doit pas avoir déjà voté</li>
                <li>• Le mandataire recevra un email de notification</li>
                <li>• Vous devrez valider la procuration avant qu'elle soit active</li>
              </ul>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la procuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
