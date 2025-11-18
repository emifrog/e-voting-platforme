'use client'

import { useState, useOptimistic } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Election, Candidate } from '@/types/models'

interface VoteInterfaceProps {
  token: string
  election: Election
  candidates: Candidate[]
  voterName: string
}

export function VoteInterface({ token, election, candidates, voterName }: VoteInterfaceProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [voteHash, setVoteHash] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Optimistic UI state
  const [optimisticSubmitted, setOptimisticSubmitted] = useOptimistic(
    submitted,
    (state, newValue: boolean) => newValue
  )

  const sortedCandidates = [...candidates].sort((a, b) => a.position - b.position)

  const handleCandidateToggle = (candidateId: string) => {
    if (election.vote_type === 'simple') {
      // Simple vote: only one selection
      setSelectedCandidates([candidateId])
    } else if (election.vote_type === 'approval') {
      // Approval vote: multiple selections
      if (selectedCandidates.includes(candidateId)) {
        setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId))
      } else {
        setSelectedCandidates([...selectedCandidates, candidateId])
      }
    }
  }

  const handleSubmit = async () => {
    if (selectedCandidates.length === 0) {
      alert('Veuillez sélectionner au moins un candidat')
      return
    }

    setShowConfirmation(true)
  }

  const confirmVote = async () => {
    setShowConfirmation(false)

    // Optimistic update: afficher immédiatement l'écran de succès
    setOptimisticSubmitted(true)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/votes/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          candidateIds: selectedCandidates,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Confirmation du serveur
        setVoteHash(data.voteHash)
        setSubmitted(true)
        toast.success('Vote enregistré avec succès !', {
          description: 'Votre vote a été comptabilisé',
        })
      } else {
        // Rollback de l'état optimiste en cas d'erreur
        setOptimisticSubmitted(false)
        toast.error(data.error || 'Erreur lors de l\'enregistrement du vote', {
          description: 'Veuillez réessayer',
        })
      }
    } catch (error) {
      // Rollback en cas d'erreur réseau
      setOptimisticSubmitted(false)
      toast.error('Erreur de connexion', {
        description: 'Veuillez vérifier votre connexion et réessayer',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success screen (optimiste ou confirmé)
  if (optimisticSubmitted) {
    return (
      <Card className="bg-white">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <CardTitle className="text-2xl">Vote enregistré avec succès !</CardTitle>
          <CardDescription>
            Merci {voterName} pour votre participation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Hash de vérification</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Conservez ce code pour vérifier que votre vote a bien été comptabilisé
            </p>
            {voteHash ? (
              <div className="bg-white p-4 rounded border font-mono text-sm break-all">
                {voteHash}
              </div>
            ) : (
              <div className="bg-white p-4 rounded border flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Génération du hash...</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm">
              <strong>Note:</strong> Pour des raisons de sécurité et d'anonymat, vous ne
              pourrez plus modifier votre vote. Un email de confirmation vous a été envoyé.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Confirmation dialog
  if (showConfirmation) {
    const selectedCandidateNames = sortedCandidates
      .filter((c) => selectedCandidates.includes(c.id))
      .map((c) => c.name)

    return (
      <Card className="bg-white">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <CardTitle className="text-2xl">Confirmez votre vote</CardTitle>
          <CardDescription>
            Vérifiez votre sélection avant de valider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Votre sélection:</h3>
            <ul className="space-y-2">
              {selectedCandidateNames.map((name, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="font-medium">{name}</span>
                </li>
              ))}
            </ul>
          </div>

          {election.is_secret && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Vote secret:</strong> Votre choix restera anonyme et ne pourra
                pas être lié à votre identité.
              </p>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-900">
              ⚠️ Attention: Une fois validé, vous ne pourrez plus modifier votre vote.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={confirmVote}
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Confirmer mon vote'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className="flex-1"
              size="lg"
            >
              Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Vote interface
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Sélectionnez votre choix</CardTitle>
        <CardDescription>
          {election.vote_type === 'simple' && 'Sélectionnez un seul candidat'}
          {election.vote_type === 'approval' && 'Vous pouvez sélectionner plusieurs candidats'}
          {election.vote_type === 'ranked' && 'Classez les candidats par ordre de préférence'}
          {election.vote_type === 'list' && 'Sélectionnez une liste'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {sortedCandidates.map((candidate, index) => {
            const isSelected = selectedCandidates.includes(candidate.id)

            return (
              <div
                key={candidate.id}
                onClick={() => handleCandidateToggle(candidate.id)}
                className={`
                  p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0
                      ${isSelected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                  >
                    {isSelected ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                    {candidate.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {candidate.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {election.allow_abstention && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCandidates.length === 0}
                onChange={() => setSelectedCandidates([])}
                className="h-4 w-4 rounded"
              />
              <span>S'abstenir</span>
            </Label>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={selectedCandidates.length === 0}
          className="w-full"
          size="lg"
        >
          Valider mon vote
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          🔒 Vote sécurisé et chiffré de bout en bout
        </div>
      </CardContent>
    </Card>
  )
}
