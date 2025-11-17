/**
 * Service d'export JSON des résultats d'élections
 */

import { ExportElectionResults as ElectionResults } from '@/types/models'
import { format } from 'date-fns'

/**
 * Exporte les résultats en JSON formaté
 */
export function exportResultsToJSON(results: ElectionResults): void {
  // Préparer les données d'export
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'E-Voting Platform',
      version: '1.0',
    },
    election: {
      id: results.election.id,
      title: results.election.title,
      description: results.election.description,
      voteType: results.election.vote_type,
      status: results.election.status,
      startDate: results.election.start_date,
      endDate: results.election.end_date,
      createdAt: results.election.created_at,
    },
    statistics: {
      totalVoters: results.stats.totalVoters,
      totalVotes: results.stats.totalVotes,
      participationRate: results.stats.participationRate,
      abstentions: results.stats.abstentions,
      blanks: results.stats.blanks,
      quorum: results.stats.quorum,
    },
    results: results.candidates.map((candidate, index) => ({
      position: index + 1,
      candidateId: candidate.id,
      name: candidate.name,
      description: candidate.description,
      votes: candidate.votes,
      percentage: candidate.percentage,
      isWinner: candidate.isWinner,
      isTied: candidate.isTied,
    })),
  }

  // Convertir en JSON formaté
  const json = JSON.stringify(exportData, null, 2)

  // Créer le blob et télécharger
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  // Générer le nom de fichier
  const filename = generateJSONFilename(results.election.title)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Génère un nom de fichier sécurisé
 */
function generateJSONFilename(electionTitle: string): string {
  const sanitized = electionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')

  return `resultats-${sanitized}-${timestamp}.json`
}

/**
 * Export JSON minifié (pour API ou intégrations)
 */
export function exportResultsToJSONMinified(results: ElectionResults): string {
  const exportData = {
    electionId: results.election.id,
    title: results.election.title,
    voteType: results.election.vote_type,
    stats: {
      voters: results.stats.totalVoters,
      votes: results.stats.totalVotes,
      participation: results.stats.participationRate,
    },
    results: results.candidates.map((c) => ({
      id: c.id,
      name: c.name,
      votes: c.votes,
      pct: c.percentage,
      winner: c.isWinner,
    })),
  }

  return JSON.stringify(exportData)
}
