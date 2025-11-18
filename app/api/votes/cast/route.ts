import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptVote, generateVoteHash } from '@/lib/services/encryption'
import { castVoteSchema } from '@/lib/validations/vote'
import { applyRateLimit } from '@/lib/utils/rate-limit-middleware'
import { checkRateLimit } from '@/lib/middleware/rate-limiter'
import { createVotingError, createServerError, logError } from '@/lib/errors'
import { auditLog } from '@/lib/services/audit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting avec notre nouveau système
    const body = await request.json()
    const { token } = body

    try {
      await checkRateLimit('VOTE_CAST', token)
    } catch (rateLimitError) {
      logError(rateLimitError as any)
      return NextResponse.json(
        {
          error: (rateLimitError as any).userMessage || 'Trop de tentatives',
          code: (rateLimitError as any).code,
        },
        { status: 429 }
      )
    }

    // Validate input
    const validatedFields = castVoteSchema.safeParse(body)

    if (!validatedFields.success) {
      const error = createServerError.validation(
        'vote_data',
        'Données de vote invalides'
      )
      logError(error)
      return NextResponse.json(
        { error: error.userMessage, details: validatedFields.error.flatten() },
        { status: 400 }
      )
    }

    const { candidateIds, rankings } = validatedFields.data

    // Use admin client to bypass RLS for vote insertion
    const supabase = createAdminClient()

    // Get voter by token
    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .select('*, elections(*)')
      .eq('token', token)
      .single()

    if (voterError || !voter) {
      const error = createVotingError.tokenInvalid()
      logError(error)
      return NextResponse.json({ error: error.userMessage }, { status: 404 })
    }

    // Check if already voted
    if ((voter as any).has_voted) {
      const error = createVotingError.electionNotOpen('already_voted')
      logError(error)
      return NextResponse.json({ error: error.userMessage }, { status: 400 })
    }

    // Check if election is active
    if ((voter as any).elections.status !== 'active') {
      const error = createVotingError.electionNotOpen((voter as any).elections.status)
      logError(error)
      return NextResponse.json({ error: error.userMessage }, { status: 400 })
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
      const error = createServerError.database('cast_vote', voteError)
      logError(error)
      await auditLog.logError(
        'VOTING',
        'VOTE',
        'votes',
        'Échec enregistrement vote',
        { electionId: (voter as any).election_id, voterId: (voter as any).id }
      )
      return NextResponse.json({ error: error.userMessage }, { status: 500 })
    }

    // Audit log du vote
    await auditLog.castVote(
      'vote-' + Date.now(),
      (voter as any).id,
      (voter as any).election_id,
      candidateIds
    )

    // Return success with verification hash
    return NextResponse.json({
      success: true,
      voteHash,
      message: 'Vote enregistré avec succès',
    })
  } catch (error) {
    console.error('Cast vote error:', error)
    const appError = createServerError.internal('Cast vote failed', error as Error)
    logError(appError)
    return NextResponse.json({ error: appError.userMessage }, { status: 500 })
  }
}
