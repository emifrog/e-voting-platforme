/**
 * Templates d'élections prédéfinis
 * Permet de créer rapidement des élections courantes
 */

export interface ElectionTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'general' | 'corporate' | 'association' | 'education'
  config: {
    vote_type: 'simple' | 'approval' | 'ranked'
    is_secret: boolean
    quorum_type: 'none' | 'percentage' | 'absolute'
    quorum_value?: number
    candidate_limit?: number
    suggested_duration_hours?: number
  }
  candidates?: {
    name: string
    description?: string
  }[]
}

export const electionTemplates: ElectionTemplate[] = [
  // Général
  {
    id: 'simple-poll',
    name: 'Sondage Simple',
    description: 'Vote simple pour une décision rapide',
    icon: '📊',
    category: 'general',
    config: {
      vote_type: 'simple',
      is_secret: false,
      quorum_type: 'none',
      suggested_duration_hours: 24,
    },
    candidates: [
      { name: 'Oui', description: 'J\'approuve' },
      { name: 'Non', description: 'Je désapprouve' },
      { name: 'Abstention', description: 'Je ne me prononce pas' },
    ],
  },
  {
    id: 'secret-vote',
    name: 'Vote Secret',
    description: 'Vote confidentiel avec scrutin secret',
    icon: '🗳️',
    category: 'general',
    config: {
      vote_type: 'simple',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 50,
      suggested_duration_hours: 72,
    },
  },
  {
    id: 'approval-voting',
    name: 'Vote par Approbation',
    description: 'Votez pour tous les candidats que vous approuvez',
    icon: '✅',
    category: 'general',
    config: {
      vote_type: 'approval',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 50,
      suggested_duration_hours: 96,
    },
  },

  // Entreprise
  {
    id: 'board-election',
    name: 'Élection Conseil d\'Administration',
    description: 'Élection des membres du conseil d\'administration',
    icon: '👔',
    category: 'corporate',
    config: {
      vote_type: 'approval',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 66.67, // 2/3
      candidate_limit: 5,
      suggested_duration_hours: 168, // 7 jours
    },
  },
  {
    id: 'shareholder-vote',
    name: 'Vote d\'Actionnaires',
    description: 'Résolution lors d\'une assemblée générale',
    icon: '💼',
    category: 'corporate',
    config: {
      vote_type: 'simple',
      is_secret: false,
      quorum_type: 'percentage',
      quorum_value: 50,
      suggested_duration_hours: 24,
    },
    candidates: [
      { name: 'Pour', description: 'Approuver la résolution' },
      { name: 'Contre', description: 'Rejeter la résolution' },
      { name: 'Abstention', description: 'Ne pas se prononcer' },
    ],
  },

  // Association
  {
    id: 'ago-president',
    name: 'Élection Président (AGO)',
    description: 'Élection du président lors d\'une assemblée générale ordinaire',
    icon: '🏛️',
    category: 'association',
    config: {
      vote_type: 'simple',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 50,
      suggested_duration_hours: 48,
    },
  },
  {
    id: 'ago-resolution',
    name: 'Résolution AGO',
    description: 'Vote sur une résolution en assemblée générale ordinaire',
    icon: '📝',
    category: 'association',
    config: {
      vote_type: 'simple',
      is_secret: false,
      quorum_type: 'percentage',
      quorum_value: 50,
      suggested_duration_hours: 24,
    },
    candidates: [
      { name: 'Pour', description: 'Adopter la résolution' },
      { name: 'Contre', description: 'Rejeter la résolution' },
      { name: 'Abstention' },
    ],
  },
  {
    id: 'age-modification',
    name: 'Modification Statuts (AGE)',
    description: 'Vote pour modifier les statuts (assemblée générale extraordinaire)',
    icon: '⚖️',
    category: 'association',
    config: {
      vote_type: 'simple',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 66.67, // 2/3
      suggested_duration_hours: 168, // 7 jours
    },
    candidates: [
      { name: 'Pour la modification', description: 'Approuver les modifications proposées' },
      { name: 'Contre la modification', description: 'Rejeter les modifications' },
      { name: 'Abstention' },
    ],
  },

  // Éducation
  {
    id: 'class-delegate',
    name: 'Délégué de Classe',
    description: 'Élection des délégués de classe',
    icon: '🎓',
    category: 'education',
    config: {
      vote_type: 'simple',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 50,
      suggested_duration_hours: 48,
    },
  },
  {
    id: 'student-council',
    name: 'Conseil Étudiant',
    description: 'Élection des représentants étudiants',
    icon: '🏫',
    category: 'education',
    config: {
      vote_type: 'approval',
      is_secret: true,
      quorum_type: 'percentage',
      quorum_value: 40,
      candidate_limit: 10,
      suggested_duration_hours: 72,
    },
  },
]

/**
 * Récupère un template par son ID
 */
export function getTemplateById(id: string): ElectionTemplate | undefined {
  return electionTemplates.find((t) => t.id === id)
}

/**
 * Récupère tous les templates d'une catégorie
 */
export function getTemplatesByCategory(
  category: ElectionTemplate['category']
): ElectionTemplate[] {
  return electionTemplates.filter((t) => t.category === category)
}

/**
 * Catégories de templates avec labels
 */
export const templateCategories = [
  { id: 'general', label: 'Général', icon: '📊' },
  { id: 'corporate', label: 'Entreprise', icon: '💼' },
  { id: 'association', label: 'Association', icon: '🏛️' },
  { id: 'education', label: 'Éducation', icon: '🎓' },
] as const
