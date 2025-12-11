/**
 * Système de gestion d'erreurs catégorisées pour E-Voting Platform
 *
 * 8 catégories d'erreurs :
 * - AUTH : Authentification et autorisation
 * - ELECTIONS : Création, édition, gestion d'élections
 * - VOTERS : Gestion des électeurs
 * - VOTING : Processus de vote
 * - QUORUM : Calculs et validation de quorum
 * - SERVER : Erreurs serveur et base de données
 * - FILE : Upload, download, traitement de fichiers
 * - EMAIL : Envoi d'emails et notifications
 */

export enum ErrorCategory {
  AUTH = 'AUTH',
  ELECTIONS = 'ELECTIONS',
  VOTERS = 'VOTERS',
  VOTING = 'VOTING',
  QUORUM = 'QUORUM',
  SERVER = 'SERVER',
  FILE = 'FILE',
  EMAIL = 'EMAIL',
}

export enum ErrorCode {
  // AUTH (1000-1099)
  AUTH_UNAUTHORIZED = 'AUTH_1000',
  AUTH_FORBIDDEN = 'AUTH_1001',
  AUTH_SESSION_EXPIRED = 'AUTH_1002',
  AUTH_INVALID_CREDENTIALS = 'AUTH_1003',
  AUTH_USER_NOT_FOUND = 'AUTH_1004',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_1005',
  AUTH_WEAK_PASSWORD = 'AUTH_1006',
  AUTH_RATE_LIMIT_EXCEEDED = 'AUTH_1007',

  // ELECTIONS (2000-2099)
  ELECTIONS_NOT_FOUND = 'ELECTIONS_2000',
  ELECTIONS_INVALID_STATUS = 'ELECTIONS_2001',
  ELECTIONS_INVALID_DATES = 'ELECTIONS_2002',
  ELECTIONS_CANNOT_EDIT = 'ELECTIONS_2003',
  ELECTIONS_CANNOT_DELETE = 'ELECTIONS_2004',
  ELECTIONS_DUPLICATE_CANDIDATE = 'ELECTIONS_2005',
  ELECTIONS_INSUFFICIENT_CANDIDATES = 'ELECTIONS_2006',
  ELECTIONS_INVALID_QUORUM = 'ELECTIONS_2007',
  ELECTIONS_NOT_OWNER = 'ELECTIONS_2008',

  // VOTERS (3000-3099)
  VOTERS_NOT_FOUND = 'VOTERS_3000',
  VOTERS_ALREADY_REGISTERED = 'VOTERS_3001',
  VOTERS_INVALID_EMAIL = 'VOTERS_3002',
  VOTERS_INVALID_WEIGHT = 'VOTERS_3003',
  VOTERS_REGISTRATION_CLOSED = 'VOTERS_3004',
  VOTERS_ALREADY_VOTED = 'VOTERS_3005',
  VOTERS_CANNOT_DELETE = 'VOTERS_3006',

  // VOTING (4000-4099)
  VOTING_TOKEN_INVALID = 'VOTING_4000',
  VOTING_TOKEN_EXPIRED = 'VOTING_4001',
  VOTING_ELECTION_NOT_OPEN = 'VOTING_4002',
  VOTING_ALREADY_VOTED = 'VOTING_4003',
  VOTING_INVALID_CHOICES = 'VOTING_4004',
  VOTING_INSUFFICIENT_CHOICES = 'VOTING_4005',
  VOTING_TOO_MANY_CHOICES = 'VOTING_4006',
  VOTING_RATE_LIMIT_EXCEEDED = 'VOTING_4007',

  // QUORUM (5000-5099)
  QUORUM_NOT_REACHED = 'QUORUM_5000',
  QUORUM_INVALID_TYPE = 'QUORUM_5001',
  QUORUM_INVALID_VALUE = 'QUORUM_5002',
  QUORUM_CALCULATION_ERROR = 'QUORUM_5003',

  // SERVER (6000-6099)
  SERVER_DATABASE_ERROR = 'SERVER_6000',
  SERVER_INTERNAL_ERROR = 'SERVER_6001',
  SERVER_NETWORK_ERROR = 'SERVER_6002',
  SERVER_TIMEOUT = 'SERVER_6003',
  SERVER_SERVICE_UNAVAILABLE = 'SERVER_6004',
  SERVER_VALIDATION_ERROR = 'SERVER_6005',

  // FILE (7000-7099)
  FILE_NOT_FOUND = 'FILE_7000',
  FILE_TOO_LARGE = 'FILE_7001',
  FILE_INVALID_TYPE = 'FILE_7002',
  FILE_UPLOAD_FAILED = 'FILE_7003',
  FILE_DOWNLOAD_FAILED = 'FILE_7004',
  FILE_PROCESSING_ERROR = 'FILE_7005',

  // EMAIL (8000-8099)
  EMAIL_SEND_FAILED = 'EMAIL_8000',
  EMAIL_INVALID_ADDRESS = 'EMAIL_8001',
  EMAIL_TEMPLATE_ERROR = 'EMAIL_8002',
  EMAIL_RATE_LIMIT_EXCEEDED = 'EMAIL_8003',
  EMAIL_PROVIDER_ERROR = 'EMAIL_8004',
}

export interface AppErrorOptions {
  category: ErrorCategory
  code: ErrorCode
  message: string
  userMessage?: string
  statusCode?: number
  metadata?: Record<string, any>
  originalError?: Error
}

/**
 * Classe d'erreur personnalisée pour l'application E-Voting
 */
export class AppError extends Error {
  public readonly category: ErrorCategory
  public readonly code: ErrorCode
  public readonly userMessage: string
  public readonly statusCode: number
  public readonly metadata?: Record<string, any>
  public readonly originalError?: Error
  public readonly timestamp: Date

  constructor(options: AppErrorOptions) {
    super(options.message)
    this.name = 'AppError'
    this.category = options.category
    this.code = options.code
    this.userMessage = options.userMessage || options.message
    this.statusCode = options.statusCode || 500
    this.metadata = options.metadata
    this.originalError = options.originalError
    this.timestamp = new Date()

    // Maintient la stack trace correcte
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Retourne une représentation JSON de l'erreur
   */
  toJSON() {
    return {
      name: this.name,
      category: this.category,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
    }
  }

  /**
   * Retourne un message formaté pour les logs
   */
  toLogString(): string {
    return `[${this.category}:${this.code}] ${this.message} | Status: ${this.statusCode} | Time: ${this.timestamp.toISOString()}`
  }
}

/**
 * Factory functions pour créer des erreurs spécifiques
 */

// AUTH Errors
export const createAuthError = {
  unauthorized: (message = 'Non authentifié') =>
    new AppError({
      category: ErrorCategory.AUTH,
      code: ErrorCode.AUTH_UNAUTHORIZED,
      message,
      userMessage: 'Vous devez être connecté pour effectuer cette action.',
      statusCode: 401,
    }),

  forbidden: (message = 'Accès refusé') =>
    new AppError({
      category: ErrorCategory.AUTH,
      code: ErrorCode.AUTH_FORBIDDEN,
      message,
      userMessage: "Vous n'avez pas les permissions nécessaires.",
      statusCode: 403,
    }),

  sessionExpired: () =>
    new AppError({
      category: ErrorCategory.AUTH,
      code: ErrorCode.AUTH_SESSION_EXPIRED,
      message: 'Session expirée',
      userMessage: 'Votre session a expiré. Veuillez vous reconnecter.',
      statusCode: 401,
    }),

  invalidCredentials: () =>
    new AppError({
      category: ErrorCategory.AUTH,
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'Identifiants invalides',
      userMessage: 'Email ou mot de passe incorrect.',
      statusCode: 401,
    }),

  rateLimitExceeded: (retryAfter?: number) =>
    new AppError({
      category: ErrorCategory.AUTH,
      code: ErrorCode.AUTH_RATE_LIMIT_EXCEEDED,
      message: 'Trop de tentatives de connexion',
      userMessage: `Trop de tentatives. Réessayez dans ${retryAfter || 60} secondes.`,
      statusCode: 429,
      metadata: { retryAfter },
    }),
}

// ELECTIONS Errors
export const createElectionsError = {
  notFound: (electionId?: string) =>
    new AppError({
      category: ErrorCategory.ELECTIONS,
      code: ErrorCode.ELECTIONS_NOT_FOUND,
      message: `Élection non trouvée: ${electionId}`,
      userMessage: "Cette élection n'existe pas ou a été supprimée.",
      statusCode: 404,
      metadata: { electionId },
    }),

  invalidStatus: (currentStatus: string, requiredStatus: string) =>
    new AppError({
      category: ErrorCategory.ELECTIONS,
      code: ErrorCode.ELECTIONS_INVALID_STATUS,
      message: `Statut invalide: ${currentStatus}, requis: ${requiredStatus}`,
      userMessage: `Cette action n'est pas disponible pour une élection ${currentStatus}.`,
      statusCode: 400,
      metadata: { currentStatus, requiredStatus },
    }),

  cannotEdit: (reason: string) =>
    new AppError({
      category: ErrorCategory.ELECTIONS,
      code: ErrorCode.ELECTIONS_CANNOT_EDIT,
      message: `Impossible de modifier l'élection: ${reason}`,
      userMessage: 'Cette élection ne peut plus être modifiée.',
      statusCode: 403,
      metadata: { reason },
    }),

  cannotDelete: (reason: string) =>
    new AppError({
      category: ErrorCategory.ELECTIONS,
      code: ErrorCode.ELECTIONS_CANNOT_DELETE,
      message: `Impossible de supprimer l'élection: ${reason}`,
      userMessage: 'Cette élection ne peut pas être supprimée.',
      statusCode: 403,
      metadata: { reason },
    }),

  notOwner: (electionId: string) =>
    new AppError({
      category: ErrorCategory.ELECTIONS,
      code: ErrorCode.ELECTIONS_NOT_OWNER,
      message: `Non propriétaire de l'élection ${electionId}`,
      userMessage: "Vous n'êtes pas le créateur de cette élection.",
      statusCode: 403,
      metadata: { electionId },
    }),
}

// VOTERS Errors
export const createVotersError = {
  notFound: (voterId?: string) =>
    new AppError({
      category: ErrorCategory.VOTERS,
      code: ErrorCode.VOTERS_NOT_FOUND,
      message: `Électeur non trouvé: ${voterId}`,
      userMessage: "Cet électeur n'existe pas.",
      statusCode: 404,
      metadata: { voterId },
    }),

  alreadyRegistered: (email: string) =>
    new AppError({
      category: ErrorCategory.VOTERS,
      code: ErrorCode.VOTERS_ALREADY_REGISTERED,
      message: `Électeur déjà inscrit: ${email}`,
      userMessage: 'Cet email est déjà inscrit pour cette élection.',
      statusCode: 409,
      metadata: { email },
    }),

  registrationClosed: () =>
    new AppError({
      category: ErrorCategory.VOTERS,
      code: ErrorCode.VOTERS_REGISTRATION_CLOSED,
      message: 'Inscriptions fermées',
      userMessage: "Les inscriptions pour cette élection sont fermées.",
      statusCode: 403,
    }),

  alreadyVoted: () =>
    new AppError({
      category: ErrorCategory.VOTERS,
      code: ErrorCode.VOTERS_ALREADY_VOTED,
      message: 'Électeur a déjà voté',
      userMessage: 'Vous avez déjà voté pour cette élection.',
      statusCode: 403,
    }),
}

// VOTING Errors
export const createVotingError = {
  tokenInvalid: () =>
    new AppError({
      category: ErrorCategory.VOTING,
      code: ErrorCode.VOTING_TOKEN_INVALID,
      message: 'Token de vote invalide',
      userMessage: 'Ce lien de vote est invalide.',
      statusCode: 400,
    }),

  tokenExpired: () =>
    new AppError({
      category: ErrorCategory.VOTING,
      code: ErrorCode.VOTING_TOKEN_EXPIRED,
      message: 'Token de vote expiré',
      userMessage: 'Ce lien de vote a expiré.',
      statusCode: 410,
    }),

  electionNotOpen: (status: string) =>
    new AppError({
      category: ErrorCategory.VOTING,
      code: ErrorCode.VOTING_ELECTION_NOT_OPEN,
      message: `Élection non ouverte: ${status}`,
      userMessage: "Le vote n'est pas ouvert pour cette élection.",
      statusCode: 403,
      metadata: { status },
    }),

  rateLimitExceeded: () =>
    new AppError({
      category: ErrorCategory.VOTING,
      code: ErrorCode.VOTING_RATE_LIMIT_EXCEEDED,
      message: 'Trop de tentatives de vote',
      userMessage: 'Trop de tentatives. Veuillez réessayer dans quelques instants.',
      statusCode: 429,
    }),
}

// QUORUM Errors
export const createQuorumError = {
  notReached: (required: number, actual: number) =>
    new AppError({
      category: ErrorCategory.QUORUM,
      code: ErrorCode.QUORUM_NOT_REACHED,
      message: `Quorum non atteint: ${actual}/${required}`,
      userMessage: `Le quorum n'a pas été atteint (${actual}/${required}).`,
      statusCode: 400,
      metadata: { required, actual },
    }),

  invalidValue: (value: number) =>
    new AppError({
      category: ErrorCategory.QUORUM,
      code: ErrorCode.QUORUM_INVALID_VALUE,
      message: `Valeur de quorum invalide: ${value}`,
      userMessage: 'La valeur du quorum est invalide.',
      statusCode: 400,
      metadata: { value },
    }),
}

// SERVER Errors
export const createServerError = {
  database: (operation: string, originalError?: Error) =>
    new AppError({
      category: ErrorCategory.SERVER,
      code: ErrorCode.SERVER_DATABASE_ERROR,
      message: `Erreur base de données: ${operation}`,
      userMessage: 'Une erreur est survenue. Veuillez réessayer.',
      statusCode: 500,
      metadata: { operation },
      originalError,
    }),

  internal: (message: string, originalError?: Error) =>
    new AppError({
      category: ErrorCategory.SERVER,
      code: ErrorCode.SERVER_INTERNAL_ERROR,
      message: `Erreur interne: ${message}`,
      userMessage: 'Une erreur interne est survenue. Notre équipe a été notifiée.',
      statusCode: 500,
      originalError,
    }),

  validation: (field: string, reason: string) =>
    new AppError({
      category: ErrorCategory.SERVER,
      code: ErrorCode.SERVER_VALIDATION_ERROR,
      message: `Validation échouée: ${field} - ${reason}`,
      userMessage: `Données invalides: ${reason}`,
      statusCode: 400,
      metadata: { field, reason },
    }),
}

// FILE Errors
export const createFileError = {
  tooLarge: (maxSize: number) =>
    new AppError({
      category: ErrorCategory.FILE,
      code: ErrorCode.FILE_TOO_LARGE,
      message: `Fichier trop volumineux: max ${maxSize}`,
      userMessage: `Le fichier est trop volumineux (max ${maxSize / 1024 / 1024}MB).`,
      statusCode: 413,
      metadata: { maxSize },
    }),

  invalidType: (allowedTypes: string[]) =>
    new AppError({
      category: ErrorCategory.FILE,
      code: ErrorCode.FILE_INVALID_TYPE,
      message: `Type de fichier invalide: autorisés ${allowedTypes.join(', ')}`,
      userMessage: `Type de fichier non autorisé. Formats acceptés: ${allowedTypes.join(', ')}`,
      statusCode: 400,
      metadata: { allowedTypes },
    }),

  uploadFailed: (reason: string) =>
    new AppError({
      category: ErrorCategory.FILE,
      code: ErrorCode.FILE_UPLOAD_FAILED,
      message: `Échec upload: ${reason}`,
      userMessage: "L'envoi du fichier a échoué. Veuillez réessayer.",
      statusCode: 500,
      metadata: { reason },
    }),
}

// EMAIL Errors
export const createEmailError = {
  sendFailed: (recipient: string, reason: string) =>
    new AppError({
      category: ErrorCategory.EMAIL,
      code: ErrorCode.EMAIL_SEND_FAILED,
      message: `Échec envoi email à ${recipient}: ${reason}`,
      userMessage: "L'envoi de l'email a échoué. Veuillez réessayer.",
      statusCode: 500,
      metadata: { recipient, reason },
    }),

  invalidAddress: (email: string) =>
    new AppError({
      category: ErrorCategory.EMAIL,
      code: ErrorCode.EMAIL_INVALID_ADDRESS,
      message: `Adresse email invalide: ${email}`,
      userMessage: 'Adresse email invalide.',
      statusCode: 400,
      metadata: { email },
    }),

  rateLimitExceeded: () =>
    new AppError({
      category: ErrorCategory.EMAIL,
      code: ErrorCode.EMAIL_RATE_LIMIT_EXCEEDED,
      message: "Limite d'envoi d'emails dépassée",
      userMessage: "Trop d'emails envoyés. Veuillez patienter.",
      statusCode: 429,
    }),
}

/**
 * Utilitaire pour logger les erreurs de manière structurée
 */
export function logError(error: AppError | Error) {
  if (error instanceof AppError) {
    console.error('🚨 [E-Voting Error]', error.toLogString())
    if (error.originalError) {
      console.error('Original Error:', error.originalError)
    }
    if (error.metadata) {
      console.error('Metadata:', JSON.stringify(error.metadata, null, 2))
    }
  } else {
    console.error('🚨 [Unexpected Error]', error.message)
    console.error(error.stack)
  }
}

/**
 * Convertit une erreur inconnue en AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return createServerError.internal(error.message, error)
  }

  return createServerError.internal(String(error))
}
