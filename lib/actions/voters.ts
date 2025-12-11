'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { addVoterSchema } from '@/lib/validations/voter'

export async function addVoter(electionId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  const validatedFields = addVoterSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    weight: formData.get('weight') ? Number(formData.get('weight')) : 1.0,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  // Check if voter already exists
  const { data: existingVoter } = await supabase
    .from('voters')
    .select('id')
    .eq('election_id', electionId)
    .eq('email', data.email)
    .single()

  if (existingVoter) {
    return { error: { message: 'Cet électeur existe déjà' } }
  }

  const { error } = await supabase.from('voters').insert({
    election_id: electionId,
    email: data.email,
    name: data.name,
    weight: data.weight,
  })

  if (error) {
    console.error('Error adding voter:', error)
    return { error: { message: 'Erreur lors de l\'ajout de l\'électeur' } }
  }

  revalidatePath(`/elections/${electionId}/voters`)
  revalidatePath(`/elections/${electionId}`)
  return { success: true }
}

export async function deleteVoter(voterId: string, electionId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('voters').delete().eq('id', voterId)

  if (error) {
    return { error: { message: 'Erreur lors de la suppression' } }
  }

  revalidatePath(`/elections/${electionId}/voters`)
  revalidatePath(`/elections/${electionId}`)
  return { success: true }
}

export async function importVotersCSV(electionId: string, csvData: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  // Parse CSV (simple implementation)
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const emailIndex = headers.indexOf('email')
  const nameIndex = headers.indexOf('name') >= 0 ? headers.indexOf('name') : headers.indexOf('nom')
  const weightIndex = headers.indexOf('weight') >= 0 ? headers.indexOf('weight') : headers.indexOf('poids')

  if (emailIndex === -1) {
    return { error: { message: 'Colonne "email" requise dans le CSV' } }
  }

  const voters = []
  const errors = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map((v) => v.trim())

    const email = values[emailIndex]
    const name = nameIndex >= 0 ? values[nameIndex] : ''
    const weight = weightIndex >= 0 && values[weightIndex] ? parseFloat(values[weightIndex]) : 1.0

    if (!email || !email.includes('@')) {
      errors.push(`Ligne ${i + 1}: Email invalide`)
      continue
    }

    voters.push({
      election_id: electionId,
      email,
      name,
      weight,
    })
  }

  if (voters.length === 0) {
    return { error: { message: 'Aucun électeur valide trouvé dans le CSV' } }
  }

  // Insert voters
  const { error, data } = await supabase.from('voters').insert(voters).select()

  if (error) {
    console.error('Error importing voters:', error)
    return { error: { message: 'Erreur lors de l\'import' } }
  }

  revalidatePath(`/elections/${electionId}/voters`)
  revalidatePath(`/elections/${electionId}`)

  return {
    success: true,
    imported: data?.length || 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

export async function sendInvitations(electionId: string) {
  const supabase = await createClient()

  // Get election and voters
  const { data: election } = await supabase
    .from('elections')
    .select('*')
    .eq('id', electionId)
    .single()

  if (!election) {
    return { error: { message: 'Élection non trouvée' } }
  }

  const { data: voters } = await supabase
    .from('voters')
    .select('*')
    .eq('election_id', electionId)
    .eq('has_voted', false)

  if (!voters || voters.length === 0) {
    return { error: { message: 'Aucun électeur à inviter' } }
  }

  // In production, this would use the email service
  // For now, just update invitation_sent_at
  const { error } = await supabase
    .from('voters')
    .update({ invitation_sent_at: new Date().toISOString() })
    .eq('election_id', electionId)
    .eq('has_voted', false)
    .is('invitation_sent_at', null)

  if (error) {
    return { error: { message: 'Erreur lors de l\'envoi des invitations' } }
  }

  revalidatePath(`/elections/${electionId}/voters`)
  return { success: true, sent: voters.length }
}

export async function registerVoter(formData: FormData) {
  const supabase = await createClient()
  const electionId = formData.get('electionId') as string
  const email = formData.get('email') as string
  const name = formData.get('name') as string | null

  if (!electionId || !email) {
    redirect(`/elections/${electionId}/register?error=${encodeURIComponent('Données manquantes')}`)
  }

  // Validate email
  if (!email.includes('@')) {
    redirect(`/elections/${electionId}/register?error=${encodeURIComponent('Email invalide')}`)
  }

  // Check if election exists and is open for registration
  const { data: election } = await supabase
    .from('elections')
    .select('id, status')
    .eq('id', electionId)
    .single()

  if (!election || election.status === 'closed' || election.status === 'archived') {
    redirect(`/elections/${electionId}/register?error=${encodeURIComponent('Inscriptions fermées')}`)
  }

  // Check if voter already exists
  const { data: existingVoter } = await supabase
    .from('voters')
    .select('id')
    .eq('election_id', electionId)
    .eq('email', email)
    .single()

  if (existingVoter) {
    redirect(`/elections/${electionId}/register?error=${encodeURIComponent('Vous êtes déjà inscrit')}`)
  }

  // Add voter
  const { error } = await supabase.from('voters').insert({
    election_id: electionId,
    email,
    name: name || email.split('@')[0],
    weight: 1.0,
  })

  if (error) {
    console.error('Error registering voter:', error)
    redirect(`/elections/${electionId}/register?error=${encodeURIComponent('Erreur lors de l\'inscription')}`)
  }

  redirect(`/elections/${electionId}/register?success=true`)
}
