'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Election {
  id?: string
  title: string
  description?: string
  vote_type: string
  start_date?: string
  end_date?: string
  is_secret?: boolean
  is_weighted?: boolean
  allow_abstention?: boolean
  quorum_type?: string
  quorum_value?: number
}

interface ElectionFormProps {
  election?: Election
  action: (formData: FormData) => Promise<void>
  submitLabel?: string
  isEdit?: boolean
}

export function ElectionForm({ election, action, submitLabel = 'Créer l\'élection', isEdit = false }: ElectionFormProps) {
  // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return (
    <form action={action}>
      {election?.id && <input type="hidden" name="id" value={election.id} />}
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Définissez les informations de base de votre élection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'élection *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Élection du président"
                defaultValue={election?.title}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Décrivez l'objectif de ce vote..."
                defaultValue={election?.description}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voteType">Type de vote *</Label>
              <select
                id="voteType"
                name="voteType"
                required
                defaultValue={election?.vote_type || 'simple'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="simple">Vote simple (un seul choix)</option>
                <option value="approval">Vote par approbation (plusieurs choix)</option>
                <option value="ranked">Vote par classement</option>
                <option value="list">Vote de liste</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Période de vote</CardTitle>
            <CardDescription>
              Définissez quand le vote sera ouvert
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                defaultValue={formatDateTimeLocal(election?.start_date)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="datetime-local"
                defaultValue={formatDateTimeLocal(election?.end_date)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Vote Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options de vote</CardTitle>
            <CardDescription>
              Configurez les paramètres du vote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSecret"
                name="isSecret"
                defaultChecked={election?.is_secret ?? true}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isSecret" className="font-normal cursor-pointer">
                Vote secret (recommandé)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isWeighted"
                name="isWeighted"
                defaultChecked={election?.is_weighted ?? false}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isWeighted" className="font-normal cursor-pointer">
                Vote pondéré (selon le poids des électeurs)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowAbstention"
                name="allowAbstention"
                defaultChecked={election?.allow_abstention ?? true}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="allowAbstention" className="font-normal cursor-pointer">
                Autoriser l'abstention
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Quorum */}
        <Card>
          <CardHeader>
            <CardTitle>Quorum</CardTitle>
            <CardDescription>
              Définissez le seuil de participation minimum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quorumType">Type de quorum</Label>
              <select
                id="quorumType"
                name="quorumType"
                defaultValue={election?.quorum_type || 'none'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="none">Aucun quorum</option>
                <option value="percentage">Pourcentage de participation</option>
                <option value="absolute">Nombre absolu de votants</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quorumValue">Valeur du quorum</Label>
              <Input
                id="quorumValue"
                name="quorumValue"
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 50 pour 50%"
                defaultValue={election?.quorum_value}
              />
              <p className="text-xs text-muted-foreground">
                Pour un quorum en pourcentage, entrez une valeur entre 0 et 100
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
