import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@evoting.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send email via Resend
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      throw new Error('Failed to send email')
    }

    return data
  } catch (error) {
    console.error('Email error:', error)
    throw error
  }
}

/**
 * Send voting invitation email
 */
export async function sendVotingInvitation({
  to,
  voterName,
  electionTitle,
  token,
  startDate,
  endDate,
}: {
  to: string
  voterName: string
  electionTitle: string
  token: string
  startDate: Date
  endDate: Date
}) {
  const voteUrl = `${SITE_URL}/vote/${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invitation à voter</h1>
          </div>
          <div class="content">
            <p>Bonjour ${voterName},</p>
            <p>Vous êtes invité(e) à participer au vote :</p>
            <h2>${electionTitle}</h2>
            <p><strong>Date de début :</strong> ${startDate.toLocaleDateString('fr-FR', { dateStyle: 'full' })} à ${startDate.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}</p>
            <p><strong>Date de fin :</strong> ${endDate.toLocaleDateString('fr-FR', { dateStyle: 'full' })} à ${endDate.toLocaleTimeString('fr-FR', { timeStyle: 'short' })}</p>
            <p>Pour voter, cliquez sur le bouton ci-dessous :</p>
            <a href="${voteUrl}" class="button">Voter maintenant</a>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Ou copiez ce lien dans votre navigateur :<br>
              <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${voteUrl}</code>
            </p>
            <div class="footer">
              <p>Ce lien est personnel et ne doit pas être partagé.</p>
              <p>Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: `Invitation à voter : ${electionTitle}`,
    html,
  })
}

/**
 * Send vote confirmation email
 */
export async function sendVoteConfirmation({
  to,
  voterName,
  electionTitle,
  voteHash,
}: {
  to: string
  voterName: string
  electionTitle: string
  voteHash: string
}) {
  const verifyUrl = `${SITE_URL}/verify/${voteHash}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .hash { background: #e5e7eb; padding: 12px; border-radius: 6px; font-family: monospace; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Vote enregistré</h1>
          </div>
          <div class="content">
            <p>Bonjour ${voterName},</p>
            <p>Votre vote pour <strong>${electionTitle}</strong> a été enregistré avec succès.</p>
            <p>Voici votre hash de vérification :</p>
            <div class="hash">${voteHash}</div>
            <p>Conservez ce hash précieusement. Il vous permettra de vérifier que votre vote a bien été comptabilisé.</p>
            <p><a href="${verifyUrl}">Vérifier mon vote</a></p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: `Vote confirmé : ${electionTitle}`,
    html,
  })
}

/**
 * Send reminder email
 */
export async function sendVotingReminder({
  to,
  voterName,
  electionTitle,
  token,
  hoursRemaining,
}: {
  to: string
  voterName: string
  electionTitle: string
  token: string
  hoursRemaining: number
}) {
  const voteUrl = `${SITE_URL}/vote/${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel de vote</h1>
          </div>
          <div class="content">
            <p>Bonjour ${voterName},</p>
            <p>Il vous reste <strong>${hoursRemaining} heures</strong> pour voter :</p>
            <h2>${electionTitle}</h2>
            <p>N'oubliez pas de participer !</p>
            <a href="${voteUrl}" class="button">Voter maintenant</a>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to,
    subject: `Rappel : ${electionTitle}`,
    html,
  })
}
