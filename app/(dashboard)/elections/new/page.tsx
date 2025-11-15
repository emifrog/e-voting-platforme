import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createElection } from '@/lib/actions/elections'

export default function NewElectionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Créer une élection</h1>
        <p className="text-muted-foreground mt-2">
          Configurez votre nouvelle élection ou vote
        </p>
      </div>

      <form action={createElection as any}>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voteType">Type de vote *</Label>
                <select
                  id="voteType"
                  name="voteType"
                  required
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vote Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de vote</CardTitle>
              <CardDescription>
                Configurez les options du vote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSecret"
                  name="isSecret"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isSecret" className="font-normal">
                  Vote secret (anonyme)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isWeighted"
                  name="isWeighted"
                  value="true"
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isWeighted" className="font-normal">
                  Vote pondéré (poids différents par électeur)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowAbstention"
                  name="allowAbstention"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="allowAbstention" className="font-normal">
                  Permettre l'abstention
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="resultsVisible"
                  name="resultsVisible"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="resultsVisible" className="font-normal">
                  Résultats visibles après le vote
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Quorum */}
          <Card>
            <CardHeader>
              <CardTitle>Quorum (optionnel)</CardTitle>
              <CardDescription>
                Définissez un seuil minimum de participation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quorumType">Type de quorum</Label>
                <select
                  id="quorumType"
                  name="quorumType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="none">Aucun quorum</option>
                  <option value="percentage">Pourcentage de participation</option>
                  <option value="absolute">Nombre absolu de votes</option>
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
                  placeholder="Ex: 50 (pour 50%)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" size="lg">
              Créer l'élection
            </Button>
            <Button type="button" variant="outline" size="lg">
              Annuler
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
