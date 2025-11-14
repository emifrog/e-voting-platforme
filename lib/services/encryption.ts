import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm' // GCM mode for authenticated encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY! // Must be 32 bytes (64 hex chars)

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
}

interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Encrypt vote data with AES-256-GCM
 */
export function encryptVote(voteData: any, electionId: string): EncryptedData {
  // Derive election-specific key using PBKDF2
  const salt = Buffer.from(electionId, 'utf8')
  const key = crypto.pbkdf2Sync(
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    salt,
    100000, // iterations
    32, // key length
    'sha256'
  )

  // Generate random IV (never reuse!)
  const iv = crypto.randomBytes(16)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt
  const plaintext = JSON.stringify(voteData)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get authentication tag
  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * Decrypt vote data
 */
export function decryptVote(
  encryptedData: string,
  iv: string,
  authTag: string,
  electionId: string
): any {
  // Derive same key
  const salt = Buffer.from(electionId, 'utf8')
  const key = crypto.pbkdf2Sync(
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    salt,
    100000,
    32,
    'sha256'
  )

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  )

  // Set auth tag
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))

  // Decrypt
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}

/**
 * Generate SHA-256 hash for vote verification
 */
export function generateVoteHash(voteData: any): string {
  const content = JSON.stringify({
    ...voteData,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  })

  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Verify vote hash (timing-safe comparison)
 */
export function verifyVoteHash(voteData: any, hash: string): boolean {
  const computed = generateVoteHash(voteData)
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
  } catch {
    return false
  }
}

/**
 * Generate cryptographically secure random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Hash password (for 2FA backup codes, etc.)
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}
