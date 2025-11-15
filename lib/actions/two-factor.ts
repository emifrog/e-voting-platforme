'use server'

import { createClient } from '@/lib/supabase/server'
import { prepare2FAActivation, verifyTOTP, verifyBackupCode } from '@/lib/services/two-factor'
import { redirect } from 'next/navigation'
import { checkRateLimitForAction } from '@/lib/utils/server-action-rate-limit'

/**
 * Initialise le processus d'activation du 2FA
 */
export async function initiate2FA(): Promise<{
  success?: boolean
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  error?: { message: string }
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  try {
    // Générer le secret, QR code et codes de secours
    const { secret, qrCodeDataUrl, backupCodes, backupCodesHashed } =
      await prepare2FAActivation(user.email!)

    // Stocker temporairement le secret dans le profil (non activé)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        two_factor_secret: secret,
        two_factor_backup_codes: backupCodesHashed,
        two_factor_enabled: false, // Pas encore activé
      })
      .eq('id', user.id)

    if (updateError) {
      return { error: { message: 'Erreur lors de la sauvegarde du secret' } }
    }

    return {
      success: true,
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
    }
  } catch (error) {
    console.error('Error initiating 2FA:', error)
    return { error: { message: 'Erreur lors de l\'initialisation du 2FA' } }
  }
}

/**
 * Active le 2FA après vérification du code
 */
export async function enable2FA(
  token: string,
): Promise<{
  success?: boolean
  error?: { message: string }
}> {
  // Rate limiting protection against brute force
  const rateLimit = await checkRateLimitForAction('2fa')
  if (rateLimit.limited) {
    return { error: { message: 'Trop de tentatives. Veuillez réessayer plus tard.' } }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  // Récupérer le profil avec le secret temporaire
  const { data: profile } = await supabase
    .from('profiles')
    .select('two_factor_secret')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.two_factor_secret) {
    return { error: { message: 'Secret 2FA non trouvé. Veuillez réinitialiser.' } }
  }

  // Vérifier le code
  const isValid = verifyTOTP(profile.two_factor_secret, token)

  if (!isValid) {
    return { error: { message: 'Code invalide. Veuillez réessayer.' } }
  }

  // Activer le 2FA
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      two_factor_enabled: true,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: { message: 'Erreur lors de l\'activation du 2FA' } }
  }

  return { success: true }
}

/**
 * Désactive le 2FA après vérification du code
 */
export async function disable2FA(
  token: string,
): Promise<{
  success?: boolean
  error?: { message: string }
}> {
  // Rate limiting protection against brute force
  const rateLimit = await checkRateLimitForAction('2fa')
  if (rateLimit.limited) {
    return { error: { message: 'Trop de tentatives. Veuillez réessayer plus tard.' } }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('two_factor_secret')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.two_factor_secret) {
    return { error: { message: 'Pas de 2FA actif' } }
  }

  // Vérifier le code
  const isValid = verifyTOTP(profile.two_factor_secret, token)

  if (!isValid) {
    return { error: { message: 'Code invalide. Veuillez réessayer.' } }
  }

  // Désactiver le 2FA
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: null,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: { message: 'Erreur lors de la désactivation du 2FA' } }
  }

  return { success: true }
}

/**
 * Vérifie le code 2FA lors du login
 */
export async function verify2FALogin(
  userId: string,
  token: string,
  isBackupCode: boolean = false,
): Promise<{
  success?: boolean
  error?: { message: string }
}> {
  const supabase = await createClient()

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('two_factor_secret, two_factor_backup_codes')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { error: { message: 'Profil non trouvé' } }
  }

  let isValid = false

  if (isBackupCode) {
    // Vérifier code de secours
    const backupCodes = profile.two_factor_backup_codes || []

    for (let i = 0; i < backupCodes.length; i++) {
      if (verifyBackupCode(token, backupCodes[i])) {
        isValid = true

        // Retirer le code de secours utilisé
        backupCodes.splice(i, 1)

        await supabase
          .from('profiles')
          .update({
            two_factor_backup_codes: backupCodes,
          })
          .eq('id', userId)

        break
      }
    }
  } else {
    // Vérifier TOTP
    if (!profile.two_factor_secret) {
      return { error: { message: 'Secret 2FA non configuré' } }
    }

    isValid = verifyTOTP(profile.two_factor_secret, token)
  }

  if (!isValid) {
    return { error: { message: 'Code invalide' } }
  }

  return { success: true }
}

/**
 * Regénère les codes de secours
 */
export async function regenerateBackupCodes(): Promise<{
  success?: boolean
  backupCodes?: string[]
  error?: { message: string }
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  const { secret, backupCodes, backupCodesHashed } = await prepare2FAActivation(
    user.email!,
  )

  // Mettre à jour uniquement les codes de secours
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      two_factor_backup_codes: backupCodesHashed,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: { message: 'Erreur lors de la régénération des codes' } }
  }

  return {
    success: true,
    backupCodes,
  }
}
