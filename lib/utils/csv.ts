/**
 * Utilitaires pour import/export CSV
 */

/**
 * Parse un fichier CSV en tableau d'objets
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    throw new Error('Fichier CSV vide')
  }

  // Première ligne = headers
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

  // Lignes suivantes = données
  const data: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])

    if (values.length !== headers.length) {
      console.warn(`Ligne ${i + 1} ignorée : nombre de colonnes incorrect`)
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index].trim()
    })

    data.push(row)
  }

  return data
}

/**
 * Parse une ligne CSV (gère les guillemets et virgules dans les valeurs)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Toggle quotes
      if (inQuotes && line[i + 1] === '"') {
        // Guillemet échappé ""
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Fin de colonne
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Ajouter la dernière colonne
  result.push(current)

  return result
}

/**
 * Convertit un tableau d'objets en CSV
 */
export function toCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) {
    return ''
  }

  // Utiliser les headers fournis ou extraire depuis les objets
  const cols = headers || Object.keys(data[0])

  // Ligne d'en-têtes
  const headerLine = cols.map(escapeCSVValue).join(',')

  // Lignes de données
  const dataLines = data.map((row) => {
    return cols.map((col) => escapeCSVValue(row[col] ?? '')).join(',')
  })

  return [headerLine, ...dataLines].join('\n')
}

/**
 * Échappe une valeur pour CSV (ajoute guillemets si nécessaire)
 */
function escapeCSVValue(value: any): string {
  const str = String(value ?? '')

  // Si contient virgule, guillemet ou retour ligne, entourer de guillemets
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // Échapper les guillemets en les doublant
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Télécharge un CSV (déclenche un download dans le navigateur)
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  }) // \uFEFF = BOM pour Excel

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
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valide les données d'un voteur importé
 */
export interface VoterImportRow {
  email: string
  name?: string
  weight?: number
}

export interface VoterValidationResult {
  valid: VoterImportRow[]
  invalid: Array<{
    row: number
    data: Record<string, string>
    errors: string[]
  }>
}

export function validateVoterImport(
  data: Record<string, string>[]
): VoterValidationResult {
  const result: VoterValidationResult = {
    valid: [],
    invalid: [],
  }

  data.forEach((row, index) => {
    const errors: string[] = []
    const rowNumber = index + 2 // +2 car index 0 = ligne 2 du CSV (ligne 1 = headers)

    // Vérifier email (obligatoire)
    const email = row.email || row.Email || row.EMAIL
    if (!email) {
      errors.push('Email manquant')
    } else if (!isValidEmail(email)) {
      errors.push('Email invalide')
    }

    // Vérifier weight (optionnel, défaut 1.0)
    const weightStr =
      row.weight || row.Weight || row.poids || row.Poids || '1.0'
    const weight = parseFloat(weightStr)
    if (isNaN(weight) || weight <= 0) {
      errors.push('Poids invalide (doit être > 0)')
    }

    if (errors.length > 0) {
      result.invalid.push({ row: rowNumber, data: row, errors })
    } else {
      result.valid.push({
        email: email.trim().toLowerCase(),
        name: row.name || row.Name || row.nom || row.Nom || undefined,
        weight: weight || 1.0,
      })
    }
  })

  return result
}
