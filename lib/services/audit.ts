/**
 * Service d'audit logging pour tracer toutes les actions importantes
 */

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'VOTE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'INVITE'
  | 'REVOKE'
  | 'CLOSE'
  | 'ARCHIVE'
  | 'EXPORT'
  | 'IMPORT'

export type AuditResourceType =
  | 'elections'
  | 'voters'
  | 'votes'
  | 'users'
  | 'candidates'
  | 'proxies'
  | 'settings'

export type AuditCategory =
  | 'AUTH'
  | 'ELECTIONS'
  | 'VOTERS'
  | 'VOTING'
  | 'QUORUM'
  | 'SERVER'
  | 'FILE'
  | 'EMAIL'

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface AuditLogEntry {
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  category: AuditCategory
  severity: AuditSeverity
  description: string
  oldData?: Record<string, any>
  newData?: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * Récupère l'IP et le User-Agent de la requête
 */
async function getRequestInfo() {
  const headersList = await headers()

  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    'unknown'

  const userAgent = headersList.get('user-agent') || 'unknown'

  return { ip, userAgent }
}

/**
 * Crée une entrée dans les logs d'audit
 *
 * @example
 * await createAuditLog({
 *   action: 'CREATE',
 *   resourceType: 'elections',
 *   resourceId: election.id,
 *   category: 'ELECTIONS',
 *   severity: 'info',
 *   description: 'Nouvelle élection créée',
 *   newData: election,
 * })
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()

    // Récupérer l'utilisateur actuel
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Récupérer les infos de la requête
    const { ip, userAgent } = await getRequestInfo()

    // Insérer le log
    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.userId || user?.id,
      user_email: entry.userEmail || user?.email,
      ip_address: entry.ipAddress || ip,
      user_agent: entry.userAgent || userAgent,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      category: entry.category,
      severity: entry.severity,
      description: entry.description,
      old_data: entry.oldData,
      new_data: entry.newData,
      metadata: entry.metadata,
    })

    if (error) {
      // Ne pas bloquer l'opération si le log échoue
      console.error('❌ Failed to create audit log:', error)
    }
  } catch (error) {
    console.error('❌ Audit logging error:', error)
  }
}

/**
 * Helpers pour créer des logs d'audit rapidement
 */

export const auditLog = {
  // AUTH
  login: async (userId: string, email: string) => {
    await createAuditLog({
      userId,
      userEmail: email,
      action: 'LOGIN',
      resourceType: 'users',
      resourceId: userId,
      category: 'AUTH',
      severity: 'info',
      description: `Connexion réussie pour ${email}`,
    })
  },

  logout: async (userId: string, email: string) => {
    await createAuditLog({
      userId,
      userEmail: email,
      action: 'LOGOUT',
      resourceType: 'users',
      resourceId: userId,
      category: 'AUTH',
      severity: 'info',
      description: `Déconnexion de ${email}`,
    })
  },

  register: async (userId: string, email: string) => {
    await createAuditLog({
      userId,
      userEmail: email,
      action: 'REGISTER',
      resourceType: 'users',
      resourceId: userId,
      category: 'AUTH',
      severity: 'info',
      description: `Nouveau compte créé: ${email}`,
    })
  },

  // ELECTIONS
  createElection: async (electionId: string, title: string, data: any) => {
    await createAuditLog({
      action: 'CREATE',
      resourceType: 'elections',
      resourceId: electionId,
      category: 'ELECTIONS',
      severity: 'info',
      description: `Élection créée: ${title}`,
      newData: data,
    })
  },

  updateElection: async (electionId: string, title: string, oldData: any, newData: any) => {
    await createAuditLog({
      action: 'UPDATE',
      resourceType: 'elections',
      resourceId: electionId,
      category: 'ELECTIONS',
      severity: 'info',
      description: `Élection modifiée: ${title}`,
      oldData,
      newData,
    })
  },

  deleteElection: async (electionId: string, title: string, soft: boolean = false) => {
    await createAuditLog({
      action: soft ? 'SOFT_DELETE' : 'DELETE',
      resourceType: 'elections',
      resourceId: electionId,
      category: 'ELECTIONS',
      severity: 'warning',
      description: soft
        ? `Élection archivée: ${title}`
        : `Élection supprimée définitivement: ${title}`,
    })
  },

  closeElection: async (electionId: string, title: string, quorumReached: boolean) => {
    await createAuditLog({
      action: 'CLOSE',
      resourceType: 'elections',
      resourceId: electionId,
      category: 'ELECTIONS',
      severity: 'info',
      description: `Élection clôturée: ${title} (Quorum: ${quorumReached ? 'Atteint' : 'Non atteint'})`,
      metadata: { quorumReached },
    })
  },

  // VOTERS
  createVoter: async (voterId: string, email: string, electionId: string) => {
    await createAuditLog({
      action: 'CREATE',
      resourceType: 'voters',
      resourceId: voterId,
      category: 'VOTERS',
      severity: 'info',
      description: `Électeur ajouté: ${email}`,
      metadata: { electionId },
    })
  },

  deleteVoter: async (voterId: string, email: string, electionId: string) => {
    await createAuditLog({
      action: 'DELETE',
      resourceType: 'voters',
      resourceId: voterId,
      category: 'VOTERS',
      severity: 'warning',
      description: `Électeur retiré: ${email}`,
      metadata: { electionId },
    })
  },

  inviteVoter: async (voterId: string, email: string, electionId: string) => {
    await createAuditLog({
      action: 'INVITE',
      resourceType: 'voters',
      resourceId: voterId,
      category: 'VOTERS',
      severity: 'info',
      description: `Invitation envoyée à: ${email}`,
      metadata: { electionId },
    })
  },

  // VOTING
  castVote: async (voteId: string, voterId: string, electionId: string, choices: any) => {
    await createAuditLog({
      action: 'VOTE',
      resourceType: 'votes',
      resourceId: voteId,
      category: 'VOTING',
      severity: 'info',
      description: `Vote enregistré`,
      metadata: {
        voterId,
        electionId,
        choicesCount: Array.isArray(choices) ? choices.length : 1,
      },
    })
  },

  // FILE
  exportData: async (resourceType: AuditResourceType, resourceId: string, format: string) => {
    await createAuditLog({
      action: 'EXPORT',
      resourceType,
      resourceId,
      category: 'FILE',
      severity: 'info',
      description: `Export ${format}: ${resourceType}/${resourceId}`,
      metadata: { format },
    })
  },

  importData: async (
    resourceType: AuditResourceType,
    resourceId: string,
    count: number,
    format: string
  ) => {
    await createAuditLog({
      action: 'IMPORT',
      resourceType,
      resourceId,
      category: 'FILE',
      severity: 'info',
      description: `Import ${format}: ${count} enregistrements`,
      metadata: { count, format },
    })
  },

  // ERRORS
  logError: async (
    category: AuditCategory,
    action: AuditAction,
    resourceType: AuditResourceType,
    error: string,
    metadata?: any
  ) => {
    await createAuditLog({
      action,
      resourceType,
      category,
      severity: 'error',
      description: `Erreur: ${error}`,
      metadata,
    })
  },

  logCritical: async (
    category: AuditCategory,
    action: AuditAction,
    resourceType: AuditResourceType,
    error: string,
    metadata?: any
  ) => {
    await createAuditLog({
      action,
      resourceType,
      category,
      severity: 'critical',
      description: `Erreur critique: ${error}`,
      metadata,
    })
  },
}

/**
 * Récupère les logs d'audit pour un utilisateur
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }

  return data
}

/**
 * Récupère les logs d'audit pour une ressource
 */
export async function getResourceAuditLogs(
  resourceType: AuditResourceType,
  resourceId: string,
  limit: number = 50
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }

  return data
}
