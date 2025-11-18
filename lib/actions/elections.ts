'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createElectionSchema, addCandidateSchema } from '@/lib/validations/election'

export async function createElection(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('Vous devez être connecté'))
  }

  // Parse and validate form data
  const validatedFields = createElectionSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    voteType: formData.get('voteType'),
    isSecret: formData.get('isSecret') === 'true',
    isWeighted: formData.get('isWeighted') === 'true',
    allowAbstention: formData.get('allowAbstention') === 'true',
    quorumType: formData.get('quorumType') || 'none',
    quorumValue: formData.get('quorumValue') ? Number(formData.get('quorumValue')) : undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    meetingPlatform: formData.get('meetingPlatform') || undefined,
    meetingUrl: formData.get('meetingUrl') || undefined,
    meetingPassword: formData.get('meetingPassword') || undefined,
    resultsVisible: formData.get('resultsVisible') === 'true',
  })

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMsg = Object.values(errors).flat().join(', ')
    redirect(`/elections/new?error=${encodeURIComponent(errorMsg)}`)
  }

  const data = validatedFields.data

  // Create election
  const { data: election, error } = await supabase
    .from('elections')
    .insert({
      creator_id: user.id,
      title: data.title,
      description: data.description,
      vote_type: data.voteType,
      is_secret: data.isSecret,
      is_weighted: data.isWeighted,
      allow_abstention: data.allowAbstention,
      quorum_type: data.quorumType,
      quorum_value: data.quorumValue,
      start_date: data.startDate,
      end_date: data.endDate,
      meeting_platform: data.meetingPlatform,
      meeting_url: data.meetingUrl,
      meeting_password: data.meetingPassword,
      results_visible: data.resultsVisible,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating election:', error)
    redirect(`/elections/new?error=${encodeURIComponent('Erreur lors de la création de l\'élection')}`)
  }

  revalidatePath('/elections')
  redirect(`/elections/${election.id}`)
}

export async function updateElection(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('Vous devez être connecté'))
  }

  const electionId = formData.get('id') as string

  if (!electionId) {
    redirect('/elections?error=' + encodeURIComponent('ID d\'élection manquant'))
  }

  // Check if election exists and belongs to user
  const { data: existingElection, error: fetchError } = await supabase
    .from('elections')
    .select('id, status, creator_id')
    .eq('id', electionId)
    .eq('creator_id', user.id)
    .single()

  if (fetchError || !existingElection) {
    redirect('/elections?error=' + encodeURIComponent('Élection introuvable'))
  }

  // Only allow editing draft elections
  if (existingElection.status !== 'draft') {
    redirect(`/elections/${electionId}?error=${encodeURIComponent('Seules les élections en brouillon peuvent être modifiées')}`)
  }

  // Parse and validate form data
  const validatedFields = createElectionSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    voteType: formData.get('voteType'),
    isSecret: formData.get('isSecret') === 'on',
    isWeighted: formData.get('isWeighted') === 'on',
    allowAbstention: formData.get('allowAbstention') === 'on',
    quorumType: formData.get('quorumType') || 'none',
    quorumValue: formData.get('quorumValue') ? Number(formData.get('quorumValue')) : undefined,
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    meetingPlatform: formData.get('meetingPlatform') || undefined,
    meetingUrl: formData.get('meetingUrl') || undefined,
    meetingPassword: formData.get('meetingPassword') || undefined,
    resultsVisible: formData.get('resultsVisible') === 'on',
  })

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const errorMsg = Object.values(errors).flat().join(', ')
    redirect(`/elections/${electionId}/edit?error=${encodeURIComponent(errorMsg)}`)
  }

  const data = validatedFields.data

  // Update election
  const { error } = await supabase
    .from('elections')
    .update({
      title: data.title,
      description: data.description,
      vote_type: data.voteType,
      is_secret: data.isSecret,
      is_weighted: data.isWeighted,
      allow_abstention: data.allowAbstention,
      quorum_type: data.quorumType,
      quorum_value: data.quorumValue,
      start_date: data.startDate,
      end_date: data.endDate,
      meeting_platform: data.meetingPlatform,
      meeting_url: data.meetingUrl,
      meeting_password: data.meetingPassword,
      results_visible: data.resultsVisible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', electionId)

  if (error) {
    console.error('Error updating election:', error)
    redirect(`/elections/${electionId}/edit?error=${encodeURIComponent('Erreur lors de la mise à jour de l\'élection')}`)
  }

  revalidatePath('/elections')
  revalidatePath(`/elections/${electionId}`)
  redirect(`/elections/${electionId}`)
}

export async function deleteElection(electionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  const { error } = await supabase
    .from('elections')
    .delete()
    .eq('id', electionId)
    .eq('creator_id', user.id)
    .eq('status', 'draft')

  if (error) {
    return { error: { message: 'Erreur lors de la suppression' } }
  }

  revalidatePath('/elections')
  redirect('/elections')
}

export async function addCandidate(electionId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: { message: 'Non authentifié' } }
  }

  const validatedFields = addCandidateSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    position: Number(formData.get('position')),
    listName: formData.get('listName') || undefined,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const data = validatedFields.data

  const { error } = await supabase.from('candidates').insert({
    election_id: electionId,
    name: data.name,
    description: data.description,
    position: data.position,
    list_name: data.listName,
  })

  if (error) {
    return { error: { message: 'Erreur lors de l\'ajout du candidat' } }
  }

  revalidatePath(`/elections/${electionId}`)
  return { success: true }
}

export async function deleteCandidate(candidateId: string, electionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId)

  if (error) {
    return { error: { message: 'Erreur lors de la suppression' } }
  }

  revalidatePath(`/elections/${electionId}`)
  return { success: true }
}
