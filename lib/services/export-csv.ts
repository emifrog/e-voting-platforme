/**
 * Service d'export CSV des résultats d'élections
 */

import { ExportElectionResults as ElectionResults } from '@/types/models'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface CSVExportOptions {
  includeMetadata?: boolean
  includePercentages?: boolean
  includeStats?: boolean
}

/**
 * Convertit les résultats en CSV
 */
export function resultsToCSV(
  results: ElectionResults,
  options: CSVExportOptions = {}
): string {
  const {
    includeMetadata = true,
    includePercentages = true,
    includeStats = true,
  } = options

  const lines: string[] = []

  // Metadata
  if (includeMetadata) {
    lines.push(`"Élection","${escapeCSV(results.election.title)}"`)
    lines.push(`"Description","${escapeCSV(results.election.description || '')}"`)
    lines.push(`"Type de vote","${getVoteTypeLabel(results.election.vote_type)}"`)
    lines.push(
      `"Date de début","${format(new Date(results.election.start_date), 'Pp', { locale: fr })}"`,
    )
    lines.push(
      `"Date de fin","${format(new Date(results.election.end_date), 'Pp', { locale: fr })}"`,
    )
    lines.push(`"Statut","${getStatusLabel(results.election.status)}"`)
    lines.push('') // Ligne vide
  }

  // Statistiques
  if (includeStats && results.stats) {
    lines.push('"Statistiques"')
    lines.push(`"Total d'électeurs","${results.stats.totalVoters}"`)
    lines.push(`"Votes enregistrés","${results.stats.totalVotes}"`)
    lines.push(`"Taux de participation","${results.stats.participationRate.toFixed(2)}%"`)

    if (results.stats.abstentions !== undefined) {
      lines.push(`"Abstentions","${results.stats.abstentions}"`)
    }

    if (results.stats.blanks !== undefined) {
      lines.push(`"Votes blancs","${results.stats.blanks}"`)
    }

    if (results.stats.quorum) {
      lines.push(
        `"Quorum requis","${results.stats.quorum.required} (${results.stats.quorum.type})"`,
      )
      lines.push(
        `"Quorum atteint","${results.stats.quorum.reached ? 'Oui' : 'Non'}"`,
      )
    }

    lines.push('') // Ligne vide
  }

  // Header des résultats
  const headers: string[] = ['Position', 'Candidat']

  if (includePercentages) {
    headers.push('Voix', 'Pourcentage', 'Statut')
  } else {
    headers.push('Voix', 'Statut')
  }

  lines.push(headers.map(h => `"${h}"`).join(','))

  // Données des candidats
  results.candidates
    .sort((a, b) => b.votes - a.votes)
    .forEach((candidate, index) => {
      const row: string[] = [
        `${index + 1}`,
        escapeCSV(candidate.name),
        `${candidate.votes}`,
      ]

      if (includePercentages) {
        row.push(`${candidate.percentage.toFixed(2)}%`)
      }

      row.push(candidate.isWinner ? 'Gagnant' : candidate.isTied ? 'Égalité' : '')

      lines.push(row.map(cell => `"${cell}"`).join(','))
    })

  // Footer
  lines.push('')
  lines.push(
    `"Généré le","${format(new Date(), 'Pp', { locale: fr })}"`,
  )

  return lines.join('\n')
}

/**
 * Télécharge le CSV côté client
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export CSV complet avec téléchargement
 */
export function exportResultsToCSV(
  results: ElectionResults,
  options?: CSVExportOptions,
): void {
  const csvContent = resultsToCSV(results, options)
  const filename = generateCSVFilename(results.election.title)

  downloadCSV(csvContent, filename)
}

/**
 * Génère un nom de fichier sécurisé
 */
function generateCSVFilename(electionTitle: string): string {
  const sanitized = electionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')

  return `resultats-${sanitized}-${timestamp}.csv`
}

/**
 * Échappe les caractères spéciaux CSV
 */
function escapeCSV(text: string): string {
  if (!text) return ''

  // Remplace les guillemets doubles par deux guillemets
  return text.replace(/"/g, '""')
}

/**
 * Labels des types de vote
 */
function getVoteTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    simple: 'Vote simple (1 choix)',
    approval: 'Vote par approbation (plusieurs choix)',
    ranked: 'Vote par classement',
    list: 'Vote de liste',
  }

  return labels[type] || type
}

/**
 * Labels des statuts
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    scheduled: 'Programmée',
    active: 'En cours',
    closed: 'Terminée',
    archived: 'Archivée',
  }

  return labels[status] || status
}

/**
 * Export CSV détaillé avec votes individuels (pour audit)
 */
export interface DetailedVote {
  timestamp: string
  voteHash: string
  ipAddress?: string
}

export function exportDetailedAuditCSV(
  results: ElectionResults,
  votes: DetailedVote[],
): void {
  const lines: string[] = []

  // Header
  lines.push('"Timestamp","Hash du vote","Adresse IP"')

  // Votes
  votes.forEach(vote => {
    lines.push(
      `"${vote.timestamp}","${vote.voteHash}","${vote.ipAddress || 'Non enregistrée'}"`,
    )
  })

  const content = lines.join('\n')
  const filename = generateCSVFilename(results.election.title + '-audit')

  downloadCSV(content, filename)
}
