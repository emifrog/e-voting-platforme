/**
 * Callback OAuth pour Google et Azure
 * Gère la redirection après authentification
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { auditLog } from '@/lib/services/audit'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Échanger le code contre une session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Erreur d\'authentification')}`)
    }

    if (data.user) {
      // Audit log de la connexion OAuth
      await auditLog.login(data.user.id, data.user.email || 'unknown')

      // Déterminer le provider
      const provider = data.user.app_metadata?.provider || 'unknown'

      console.log(`✅ OAuth login successful: ${data.user.email} via ${provider}`)

      // Rediriger vers le dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Erreur : pas de code ou échec de l'échange
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Code d\'authentification invalide')}`)
}
