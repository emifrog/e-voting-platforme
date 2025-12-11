/**
 * Utilitaires pour l'export PDF
 * Utilise jsPDF pour générer des PDF depuis les résultats d'élections
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ElectionResult {
  election: {
    title: string
    description?: string
    status: string
    start_date?: string
    end_date?: string
    vote_type: string
    is_secret: boolean
  }
  candidates: Array<{
    name: string
    description?: string
    vote_count: number
    percentage: number
    rank: number
  }>
  stats: {
    total_voters: number
    total_votes: number
    participation_rate: number
    quorum_reached: boolean
  }
}

/**
 * Génère un PDF des résultats d'une élection
 */
export async function generateResultsPDF(results: ElectionResult): Promise<void> {
  const doc = new jsPDF()

  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 15
  const marginRight = 15
  const contentWidth = pageWidth - marginLeft - marginRight
  let yPosition = 20

  // Header
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Résultats de l\'Élection', marginLeft, yPosition)

  yPosition += 10

  // Title
  doc.setFontSize(16)
  doc.text(results.election.title, marginLeft, yPosition)

  yPosition += 8

  // Description
  if (results.election.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const descriptionLines = doc.splitTextToSize(
      results.election.description,
      contentWidth
    )
    doc.text(descriptionLines, marginLeft, yPosition)
    yPosition += descriptionLines.length * 5 + 5
  }

  // Election Info
  yPosition += 5
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Informations de l\'élection', marginLeft, yPosition)
  yPosition += 7

  doc.setFont('helvetica', 'normal')
  const info = [
    `Type de vote: ${getVoteTypeLabel(results.election.vote_type)}`,
    `Vote secret: ${results.election.is_secret ? 'Oui' : 'Non'}`,
    `Statut: ${getStatusLabel(results.election.status)}`,
  ]

  if (results.election.start_date) {
    info.push(
      `Période: ${new Date(results.election.start_date).toLocaleDateString('fr-FR')} - ${new Date(results.election.end_date!).toLocaleDateString('fr-FR')}`
    )
  }

  info.forEach((line) => {
    doc.text(line, marginLeft, yPosition)
    yPosition += 5
  })

  // Statistics
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Statistiques', marginLeft, yPosition)
  yPosition += 7

  doc.setFont('helvetica', 'normal')
  const stats = [
    `Électeurs inscrits: ${results.stats.total_voters}`,
    `Votes exprimés: ${results.stats.total_votes}`,
    `Taux de participation: ${results.stats.participation_rate.toFixed(2)}%`,
    `Quorum: ${results.stats.quorum_reached ? 'Atteint ✓' : 'Non atteint ✗'}`,
  ]

  stats.forEach((line) => {
    doc.text(line, marginLeft, yPosition)
    yPosition += 5
  })

  // Results Table
  yPosition += 10

  // Prepare table data
  const tableData = results.candidates.map((candidate, index) => [
    `#${candidate.rank}`,
    candidate.name,
    candidate.vote_count.toString(),
    `${candidate.percentage.toFixed(2)}%`,
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Rang', 'Candidat', 'Votes', 'Pourcentage']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
    margin: { left: marginLeft, right: marginRight },
  })

  // Winner badge
  const finalY = (doc as any).lastAutoTable.finalY + 15
  if (results.candidates.length > 0 && results.candidates[0].rank === 1) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74) // Green
    doc.text(
      `🏆 Gagnant: ${results.candidates[0].name}`,
      marginLeft,
      finalY
    )
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.setFont('helvetica', 'italic')
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.text(
    `Généré le ${new Date().toLocaleString('fr-FR')} par E-Voting Platform`,
    marginLeft,
    footerY
  )

  // Download
  const filename = `resultats_${results.election.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`
  doc.save(filename)
}

function getVoteTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    simple: 'Vote simple',
    approval: 'Vote par approbation',
    ranked: 'Vote par classement',
    list: 'Vote de liste',
  }
  return labels[type] || type
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    scheduled: 'Planifié',
    active: 'En cours',
    closed: 'Terminé',
    archived: 'Archivé',
  }
  return labels[status] || status
}
