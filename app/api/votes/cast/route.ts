import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptVote, generateVoteHash } from '@/lib/services/encryption'
import { castVoteSchema } from '@/lib/validations/vote'
import { applyRateLimit } from '@/lib/utils/rate-limit-middleware'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'vote')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()

    // Validate input
    const validatedFields = castVoteSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validatedFields.error.flatten() },
        { status: 400 }
      )
    }

    const { token, candidateIds, rankings } = validatedFields.data

    // Use admin client to bypass RLS for vote insertion
    const supabase = createAdminClient()

    // Get voter by token
    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .select('*, elections(*)')
      .eq('token', token)
      .single()

    if (voterError || !voter) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 404 })
    }

    // Check if already voted
    if ((voter as any).has_voted) {
      return NextResponse.json({ error: 'Vous avez déjà voté' }, { status: 400 })
    }

    // Check if election is active
    if ((voter as any).elections.status !== 'active') {
      return NextResponse.json(
        { error: 'Le vote n\'est pas encore ouvert ou est déjà terminé' },
        { status: 400 }
      )
    }

    // Prepare vote data
    const voteData = {
      candidate_ids: candidateIds,
      rankings: rankings || null,
      timestamp: new Date().toISOString(),
    }

    // Encrypt vote
    const encrypted = encryptVote(voteData, (voter as any).election_id)

    // Generate verification hash
    const voteHash = generateVoteHash(voteData)

    // Get IP and user agent
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Cast vote atomically using the stored procedure
    const { error: voteError } = await (supabase as any).rpc('cast_vote_atomic', {
      p_election_id: (voter as any).election_id,
      p_voter_id: (voter as any).id,
      p_encrypted_vote: encrypted.encrypted,
      p_vote_hash: voteHash,
      p_iv: encrypted.iv,
      p_auth_tag: encrypted.authTag,
      p_ip: ip,
      p_user_agent: userAgent,
    })

    if (voteError) {
      console.error('Vote error:', voteError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du vote' },
        { status: 500 }
      )
    }

    // Return success with verification hash
    return NextResponse.json({
      success: true,
      voteHash,
      message: 'Vote enregistré avec succès',
    })
  } catch (error) {
    console.error('Cast vote error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
