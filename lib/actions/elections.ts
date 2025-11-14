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
    return { error: { message: 'Non authentifié' } }
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
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
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
    return { error: { message: 'Erreur lors de la création de l\'élection' } }
  }

  revalidatePath('/elections')
  redirect(`/elections/${election.id}`)
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
