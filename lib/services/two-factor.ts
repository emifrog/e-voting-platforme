/**
 * Service de gestion du 2FA (TOTP)
 */

import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import crypto from 'crypto'

const APP_NAME = 'E-Voting Platform'

/**
 * Génère un secret 2FA pour un utilisateur
 */
export function generateTOTPSecret(userEmail: string): {
  secret: string
  uri: string
} {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromRandom(20),
  })

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  }
}

/**
 * Génère un QR code à partir de l'URI TOTP
 */
export async function generateQRCode(uri: string): Promise<string> {
  try {
    // Retourne un Data URL pour l'image
    return await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256,
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Vérifie un code TOTP
 */
export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })

  // Vérifier le token avec une fenêtre de tolérance de ±1 période (30s)
  const delta = totp.validate({
    token,
    window: 1, // Accepte le code précédent et suivant
  })

  return delta !== null
}

/**
 * Génère des codes de secours (backup codes)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    // Génère un code de 8 caractères alphanumériques
    const code = crypto
      .randomBytes(5)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-') || ''

    codes.push(code)
  }

  return codes
}

/**
 * Hash un code de secours pour stockage sécurisé
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Vérifie un code de secours contre son hash
 */
export function verifyBackupCode(code: string, hash: string): boolean {
  const codeHash = hashBackupCode(code)
  return codeHash === hash
}

/**
 * Prépare les données complètes pour l'activation du 2FA
 */
export async function prepare2FAActivation(userEmail: string): Promise<{
  secret: string
  qrCodeDataUrl: string
  backupCodes: string[]
  backupCodesHashed: string[]
}> {
  const { secret, uri } = generateTOTPSecret(userEmail)
  const qrCodeDataUrl = await generateQRCode(uri)
  const backupCodes = generateBackupCodes(10)
  const backupCodesHashed = backupCodes.map(hashBackupCode)

  return {
    secret,
    qrCodeDataUrl,
    backupCodes,
    backupCodesHashed,
  }
}
