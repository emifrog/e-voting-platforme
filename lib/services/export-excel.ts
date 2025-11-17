/**
 * Service d'export Excel des résultats d'élections
 */

import * as XLSX from 'xlsx'
import { ExportElectionResults } from '@/types/models'
import { format } from 'date-fns'

/**
 * Exporte les résultats en fichier Excel (.xlsx)
 */
export function exportResultsToExcel(results: ExportElectionResults): void {
  // Créer un nouveau workbook
  const workbook = XLSX.utils.book_new()

  // Feuille 1: Résumé
  const summaryData = [
    ['RÉSULTATS DE L\'ÉLECTION'],
    [],
    ['Titre', results.election.title],
    ['Description', results.election.description || '-'],
    ['Type de vote', results.election.vote_type === 'simple' ? 'Vote simple' : 'Vote préférentiel'],
    ['Statut', results.election.status],
    ['Date de début', format(new Date(results.election.start_date), 'dd/MM/yyyy HH:mm')],
    ['Date de fin', format(new Date(results.election.end_date), 'dd/MM/yyyy HH:mm')],
    ['Exporté le', format(new Date(), 'dd/MM/yyyy HH:mm')],
    [],
    ['STATISTIQUES GÉNÉRALES'],
    [],
    ['Électeurs inscrits', results.stats.totalVoters],
    ['Votes exprimés', results.stats.totalVotes],
    ['Taux de participation', `${results.stats.participationRate.toFixed(2)}%`],
    ['Abstentions', results.stats.abstentions],
    ['Votes blancs', results.stats.blanks],
    ['Quorum requis', `${results.stats.quorum}%`],
    ['Quorum atteint', results.stats.participationRate >= results.stats.quorum ? 'Oui' : 'Non'],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Appliquer des styles (largeur de colonnes)
  summarySheet['!cols'] = [
    { wch: 25 },
    { wch: 50 },
  ]

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé')

  // Feuille 2: Résultats détaillés
  const resultsData = [
    ['Position', 'Candidat', 'Description', 'Votes', 'Pourcentage', 'Vainqueur'],
    ...results.candidates.map((candidate, index) => [
      index + 1,
      candidate.name,
      candidate.description || '-',
      candidate.votes,
      `${candidate.percentage.toFixed(2)}%`,
      candidate.isWinner ? 'OUI' : 'Non',
    ]),
  ]

  const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData)

  // Largeur de colonnes
  resultsSheet['!cols'] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 40 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
  ]

  XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Résultats')

  // Feuille 3: Statistiques avancées
  const validVotes = results.stats.totalVotes - results.stats.blanks
  const blankRate = results.stats.totalVotes > 0 ? (results.stats.blanks / results.stats.totalVotes) * 100 : 0
  const abstentionRate = results.stats.totalVoters > 0 ? (results.stats.abstentions / results.stats.totalVoters) * 100 : 0

  const winner = results.candidates.find(c => c.isWinner)
  const secondPlace = results.candidates.filter(c => !c.isWinner)[0]
  const winMargin = winner && secondPlace ? winner.votes - secondPlace.votes : 0
  const winMarginPercent = winner && secondPlace ? winner.percentage - secondPlace.percentage : 0

  const voteCounts = results.candidates.map(c => c.votes)
  const avgVotes = voteCounts.reduce((a, b) => a + b, 0) / voteCounts.length
  const sortedVotes = [...voteCounts].sort((a, b) => a - b)
  const medianVotes = sortedVotes.length % 2 === 0
    ? (sortedVotes[sortedVotes.length / 2 - 1] + sortedVotes[sortedVotes.length / 2]) / 2
    : sortedVotes[Math.floor(sortedVotes.length / 2)]

  const variance = voteCounts.reduce((sum, count) => sum + Math.pow(count - avgVotes, 2), 0) / voteCounts.length
  const stdDev = Math.sqrt(variance)

  const hhi = results.candidates.reduce((sum, c) => sum + Math.pow(c.percentage, 2), 0)
  const competitiveness = hhi < 2500 ? 'Très compétitive' : hhi < 5000 ? 'Modérément compétitive' : 'Peu compétitive'

  const statsData = [
    ['STATISTIQUES AVANCÉES'],
    [],
    ['Votes valides', validVotes],
    ['Taux de votes blancs', `${blankRate.toFixed(2)}%`],
    ['Taux d\'abstention', `${abstentionRate.toFixed(2)}%`],
    [],
    ['ÉCART DE VICTOIRE'],
    [],
    ['Vainqueur', winner?.name || '-'],
    ['Deuxième place', secondPlace?.name || '-'],
    ['Écart en votes', winMargin],
    ['Écart en pourcentage', `${winMarginPercent.toFixed(2)}%`],
    [],
    ['DISTRIBUTION DES VOTES'],
    [],
    ['Moyenne par candidat', avgVotes.toFixed(2)],
    ['Médiane', medianVotes.toFixed(2)],
    ['Écart-type', stdDev.toFixed(2)],
    [],
    ['COMPÉTITIVITÉ'],
    [],
    ['Indice HHI', hhi.toFixed(2)],
    ['Évaluation', competitiveness],
  ]

  const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
  statsSheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques')

  // Générer le nom de fichier
  const filename = generateExcelFilename(results.election.title)

  // Exporter le fichier
  XLSX.writeFile(workbook, filename)
}

/**
 * Génère un nom de fichier sécurisé pour Excel
 */
function generateExcelFilename(electionTitle: string): string {
  const sanitized = electionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')

  return `resultats-${sanitized}-${timestamp}.xlsx`
}

/**
 * Exporte uniquement les résultats bruts (sans statistiques)
 */
export function exportResultsToExcelSimple(results: ExportElectionResults): void {
  const workbook = XLSX.utils.book_new()

  const data = [
    ['Position', 'Candidat', 'Votes', 'Pourcentage', 'Vainqueur'],
    ...results.candidates.map((candidate, index) => [
      index + 1,
      candidate.name,
      candidate.votes,
      candidate.percentage,
      candidate.isWinner ? 'OUI' : 'Non',
    ]),
  ]

  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
  ]

  XLSX.utils.book_append_sheet(workbook, sheet, 'Résultats')

  const filename = generateExcelFilename(results.election.title)
  XLSX.writeFile(workbook, filename)
}
