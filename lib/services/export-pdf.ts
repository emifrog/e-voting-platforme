/**
 * Service d'export PDF des résultats d'élections avec graphiques
 */

'use client'

import { ExportElectionResults as ElectionResults } from '@/types/models'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  includeGraphs?: boolean
  includeMetadata?: boolean
  includeStats?: boolean
  includeTimestamp?: boolean
  orientation?: 'portrait' | 'landscape'
}

/**
 * Export des résultats en PDF
 */
export async function exportResultsToPDF(
  results: ElectionResults,
  options: PDFExportOptions = {},
): Promise<void> {
  const {
    includeGraphs = true,
    includeMetadata = true,
    includeStats = true,
    includeTimestamp = true,
    orientation = 'portrait',
  } = options

  // Créer le PDF
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 20

  // Titre principal
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Résultats de l\'élection', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Titre de l'élection
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'normal')
  const title = truncateText(results.election.title, 60)
  pdf.text(title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 12

  // Métadonnées
  if (includeMetadata) {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    if (results.election.description) {
      const description = pdf.splitTextToSize(results.election.description, pageWidth - 40)
      pdf.text(description, 20, yPosition)
      yPosition += description.length * 5 + 5
    }

    pdf.setFontSize(9)
    pdf.text(
      `Type de vote : ${getVoteTypeLabel(results.election.vote_type)}`,
      20,
      yPosition,
    )
    yPosition += 5

    pdf.text(
      `Période : ${format(new Date(results.election.start_date), 'Pp', { locale: fr })} - ${format(new Date(results.election.end_date), 'Pp', { locale: fr })}`,
      20,
      yPosition,
    )
    yPosition += 10
  }

  // Statistiques
  if (includeStats && results.stats) {
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Statistiques', 20, yPosition)
    yPosition += 7

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')

    const stats = [
      `Total d'électeurs : ${results.stats.totalVoters}`,
      `Votes enregistrés : ${results.stats.totalVotes}`,
      `Taux de participation : ${results.stats.participationRate.toFixed(2)}%`,
    ]

    if (results.stats.abstentions !== undefined) {
      stats.push(`Abstentions : ${results.stats.abstentions}`)
    }

    if (results.stats.blanks !== undefined) {
      stats.push(`Votes blancs : ${results.stats.blanks}`)
    }

    if (results.stats.quorum) {
      stats.push(
        `Quorum : ${results.stats.quorum.required} (${results.stats.quorum.type}) - ${results.stats.quorum.reached ? 'Atteint ✓' : 'Non atteint ✗'}`,
      )
    }

    stats.forEach(stat => {
      pdf.text(stat, 25, yPosition)
      yPosition += 5
    })

    yPosition += 5
  }

  // Graphique (si demandé et disponible)
  if (includeGraphs) {
    const chartElement = document.getElementById('results-chart-for-export')

    if (chartElement) {
      try {
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          backgroundColor: '#ffffff',
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = pageWidth - 40
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Vérifier si on a assez de place, sinon nouvelle page
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 10
      } catch (error) {
        console.error('Erreur lors de la capture du graphique:', error)
      }
    }
  }

  // Nouvelle page pour le tableau si nécessaire
  if (yPosition > pageHeight - 80) {
    pdf.addPage()
    yPosition = 20
  }

  // Tableau des résultats
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Résultats détaillés', 20, yPosition)
  yPosition += 7

  const tableData = results.candidates
    .sort((a, b) => b.votes - a.votes)
    .map((candidate, index) => [
      `${index + 1}`,
      candidate.name,
      `${candidate.votes}`,
      `${candidate.percentage.toFixed(2)}%`,
      candidate.isWinner ? '🏆 Gagnant' : candidate.isTied ? '⚖️ Égalité' : '',
    ])

  autoTable(pdf, {
    startY: yPosition,
    head: [['Position', 'Candidat', 'Voix', 'Pourcentage', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' },
    },
    margin: { left: 20, right: 20 },
  })

  // Footer avec timestamp
  if (includeTimestamp) {
    const finalY = (pdf as any).lastAutoTable.finalY || yPosition + 50
    const footerY = pageHeight - 10

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(128, 128, 128)
    pdf.text(
      `Généré le ${format(new Date(), 'Pp', { locale: fr })}`,
      pageWidth / 2,
      footerY,
      { align: 'center' },
    )

    // Numéro de page si plusieurs pages
    const pageCount = pdf.getNumberOfPages()
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.text(`Page ${i} / ${pageCount}`, pageWidth - 20, footerY, { align: 'right' })
      }
    }
  }

  // Télécharger le PDF
  const filename = generatePDFFilename(results.election.title)
  pdf.save(filename)
}

/**
 * Export PDF avec capture d'un élément DOM spécifique
 */
export async function exportElementToPDF(
  elementId: string,
  filename: string,
  options: {
    orientation?: 'portrait' | 'landscape'
    title?: string
  } = {},
): Promise<void> {
  const { orientation = 'portrait', title } = options
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidth = pageWidth - 40
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let yPosition = 20

  if (title) {
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15
  }

  // Si l'image est plus grande que la page, diviser en plusieurs pages
  if (imgHeight > pageHeight - yPosition - 20) {
    let remainingHeight = imgHeight
    let sourceY = 0

    while (remainingHeight > 0) {
      const sliceHeight = Math.min(pageHeight - yPosition - 20, remainingHeight)
      const sourceHeight = (sliceHeight * canvas.height) / imgHeight

      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sourceHeight

      const ctx = sliceCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight,
        )

        const sliceImgData = sliceCanvas.toDataURL('image/png')
        pdf.addImage(sliceImgData, 'PNG', 20, yPosition, imgWidth, sliceHeight)
      }

      remainingHeight -= sliceHeight
      sourceY += sourceHeight

      if (remainingHeight > 0) {
        pdf.addPage()
        yPosition = 20
      }
    }
  } else {
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
  }

  pdf.save(filename)
}

/**
 * Génère un nom de fichier sécurisé
 */
function generatePDFFilename(electionTitle: string): string {
  const sanitized = electionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')

  return `resultats-${sanitized}-${timestamp}.pdf`
}

/**
 * Tronque le texte si trop long
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
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
