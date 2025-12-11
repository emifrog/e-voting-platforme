'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createElectionSchema, addCandidateSchema } from '@/lib/validations/election'
import { auditLog } from '@/lib/services/audit'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'

export async function createElection(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('Vous devez être connecté'))
  }

  // Rate limiting
  try {
    await checkRateLimit('ELECTION_CREATE', user.id)
  } catch (error) {
    redirect('/elections/new?error=' + encodeURIComponent('Trop de créations d\'élections. Veuillez patienter.')
    )
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
    await auditLog.logError('ELECTIONS', 'CREATE', 'elections', error.message)
    redirect(`/elections/new?error=${encodeURIComponent('Erreur lors de la création de l\'élection')}`)
  }

  // Audit log
  await auditLog.createElection(election.id, data.title, election)

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
    await auditLog.logError('ELECTIONS', 'UPDATE', 'elections', error.message, { electionId })
    redirect(`/elections/${electionId}/edit?error=${encodeURIComponent('Erreur lors de la mise à jour de l\'élection')}`)
  }

  // Audit log
  await auditLog.updateElection(electionId, data.title, existingElection, data)

  revalidatePath('/elections')
  revalidatePath(`/elections/${electionId}`)
  redirect(`/elections/${electionId}`)
}

export async function closeElection(electionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Fetch election with voters
  const { data: election, error: fetchError } = await supabase
    .from('elections')
    .select(`
      *,
      voters(*)
    `)
    .eq('id', electionId)
    .eq('creator_id', user.id)
    .single()

  if (fetchError || !election) {
    return { error: 'Élection non trouvée' }
  }

  // Check quorum
  const voters = (election.voters as any[]) || []
  const totalVoters = voters.length
  const votedCount = voters.filter((v) => v.has_voted).length
  const participationRate = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0

  let quorumReached = false
  let quorumMessage = ''

  if (election.quorum_type === 'percentage') {
    const requiredPercentage = election.quorum_value || 0
    quorumReached = participationRate >= requiredPercentage
    quorumMessage = `Quorum requis: ${requiredPercentage}% - Participation: ${participationRate.toFixed(1)}%`
  } else if (election.quorum_type === 'absolute') {
    const requiredVotes = election.quorum_value || 0
    quorumReached = votedCount >= requiredVotes
    quorumMessage = `Quorum requis: ${requiredVotes} votes - Votes reçus: ${votedCount}`
  } else {
    // No quorum or 'none' type
    quorumReached = true
    quorumMessage = 'Aucun quorum requis'
  }

  // Update election status and quorum_reached
  const { error: updateError } = await supabase
    .from('elections')
    .update({
      status: 'closed',
      quorum_reached: quorumReached,
      updated_at: new Date().toISOString(),
    })
    .eq('id', electionId)

  if (updateError) {
    console.error('Error closing election:', updateError)
    await auditLog.logError('ELECTIONS', 'CLOSE', 'elections', updateError.message, { electionId })
    return { error: 'Erreur lors de la fermeture de l\'élection' }
  }

  // Audit log
  await auditLog.closeElection(electionId, election.title, quorumReached)

  revalidatePath('/elections')
  revalidatePath(`/elections/${electionId}`)

  return {
    success: true,
    quorumReached,
    quorumMessage,
    participationRate: participationRate.toFixed(1),
    votedCount,
    totalVoters,
  }
}

/**
 * Soft delete: Archive une élection (récupérable)
 * Pour toutes les élections avec votes
 */
export async function softDeleteElection(electionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Vérifier que l'élection existe et appartient à l'utilisateur
  const { data: election, error: fetchError } = await supabase
    .from('elections')
    .select('id, title, status, creator_id')
    .eq('id', electionId)
    .eq('creator_id', user.id)
    .single()

  if (fetchError || !election) {
    return { success: false, error: 'Élection non trouvée' }
  }

  // Soft delete (marquer comme supprimée)
  const { error } = await supabase
    .from('elections')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', electionId)

  if (error) {
    console.error('Error soft deleting election:', error)
    return { success: false, error: 'Erreur lors de la suppression' }
  }

  // Audit log
  const { auditLog } = await import('@/lib/services/audit')
  await auditLog.deleteElection(electionId, election.title, true)

  revalidatePath('/elections')
  return { success: true, message: 'Élection archivée avec succès' }
}

/**
 * Hard delete: Suppression définitive
 * Uniquement pour les drafts sans votes
 */
export async function hardDeleteElection(electionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Vérifier que l'élection existe et appartient à l'utilisateur
  const { data: election, error: fetchError } = await supabase
    .from('elections')
    .select('id, title, status, creator_id')
    .eq('id', electionId)
    .eq('creator_id', user.id)
    .single()

  if (fetchError || !election) {
    return { success: false, error: 'Élection non trouvée' }
  }

  // Vérifier que c'est un draft
  if (election.status !== 'draft') {
    return {
      success: false,
      error: 'Seules les élections en brouillon peuvent être supprimées définitivement',
    }
  }

  // Vérifier qu'il n'y a aucun vote
  const { count: voteCount } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('election_id', electionId)

  if (voteCount && voteCount > 0) {
    return {
      success: false,
      error: 'Impossible de supprimer une élection avec des votes',
    }
  }

  // Supprimer les candidats
  await supabase.from('candidates').delete().eq('election_id', electionId)

  // Supprimer les électeurs
  await supabase.from('voters').delete().eq('election_id', electionId)

  // Supprimer l'élection
  const { error } = await supabase.from('elections').delete().eq('id', electionId)

  if (error) {
    console.error('Error hard deleting election:', error)
    return { success: false, error: 'Erreur lors de la suppression définitive' }
  }

  // Audit log
  const { auditLog } = await import('@/lib/services/audit')
  await auditLog.deleteElection(electionId, election.title, false)

  revalidatePath('/elections')
  return { success: true, message: 'Élection supprimée définitivement' }
}

/**
 * Restaurer une élection archivée (soft deleted)
 */
export async function restoreElection(electionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // Vérifier que l'élection existe et appartient à l'utilisateur
  const { data: election, error: fetchError } = await supabase
    .from('elections')
    .select('id, title, creator_id, deleted_at')
    .eq('id', electionId)
    .eq('creator_id', user.id)
    .not('deleted_at', 'is', null)
    .single()

  if (fetchError || !election) {
    return { success: false, error: 'Élection archivée non trouvée' }
  }

  // Restaurer (retirer deleted_at)
  const { error } = await supabase
    .from('elections')
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', electionId)

  if (error) {
    console.error('Error restoring election:', error)
    return { success: false, error: 'Erreur lors de la restauration' }
  }

  // Audit log
  const { auditLog } = await import('@/lib/services/audit')
  await auditLog.createElection(electionId, election.title, { restored: true })

  revalidatePath('/elections')
  return { success: true, message: 'Élection restaurée avec succès' }
}

/**
 * Ancienne fonction deleteElection (conservée pour compatibilité)
 * Utilise maintenant hardDelete pour les drafts sans votes
 */
export async function deleteElection(electionId: string) {
  return hardDeleteElection(electionId)
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
