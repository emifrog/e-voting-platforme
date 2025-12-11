/**
 * Formatters spécifiques pour les webhooks Teams, Slack, et Zoom
 * Convertit les événements en format adapté à chaque plateforme
 */

import type { WebhookPayload } from './webhooks'

/**
 * Formate un payload pour Microsoft Teams (Adaptive Card)
 */
export function formatTeamsMessage(payload: WebhookPayload): any {
  const { emoji, title, color } = getEventMetadata(payload.event)

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: `${emoji} ${title}`,
              weight: 'Bolder',
              size: 'Large',
              color: color,
            },
            {
              type: 'TextBlock',
              text: getEventDescription(payload),
              size: 'Medium',
              wrap: true,
            },
            {
              type: 'FactSet',
              facts: buildFactSet(payload),
            },
          ],
          actions: buildActions(payload),
        },
      },
    ],
  }
}

/**
 * Formate un payload pour Slack
 */
export function formatSlackMessage(payload: WebhookPayload): any {
  const { emoji, title, color } = getEventMetadata(payload.event)

  return {
    attachments: [
      {
        color: color === 'Attention' ? 'warning' : color === 'Good' ? 'good' : '#0078d4',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} ${title}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: getEventDescription(payload),
            },
          },
          {
            type: 'section',
            fields: buildSlackFields(payload),
          },
          ...buildSlackActions(payload),
        ],
      },
    ],
  }
}

/**
 * Formate un payload pour Zoom
 */
export function formatZoomMessage(payload: WebhookPayload): any {
  const { emoji, title } = getEventMetadata(payload.event)

  return {
    head: {
      text: `${emoji} ${title}`,
    },
    body: [
      {
        type: 'message',
        text: getEventDescription(payload),
      },
      {
        type: 'fields',
        items: buildZoomFields(payload),
      },
    ],
  }
}

/**
 * Métadonnées pour chaque type d'événement
 */
function getEventMetadata(event: string) {
  const metadata: Record<string, { emoji: string; title: string; color: string }> = {
    'election.created': {
      emoji: '📝',
      title: 'Nouvelle élection créée',
      color: 'Accent',
    },
    'election.updated': {
      emoji: '✏️',
      title: 'Élection mise à jour',
      color: 'Default',
    },
    'election.started': {
      emoji: '▶️',
      title: 'Élection démarrée',
      color: 'Good',
    },
    'election.closed': {
      emoji: '🔒',
      title: 'Élection terminée',
      color: 'Attention',
    },
    'vote.cast': {
      emoji: '🗳️',
      title: 'Nouveau vote enregistré',
      color: 'Accent',
    },
    'voter.added': {
      emoji: '👤',
      title: 'Électeur ajouté',
      color: 'Default',
    },
    'results.published': {
      emoji: '📊',
      title: 'Résultats publiés',
      color: 'Good',
    },
  }

  return metadata[event] || { emoji: '📢', title: 'Événement', color: 'Default' }
}

/**
 * Description de l'événement
 */
function getEventDescription(payload: WebhookPayload): string {
  if (payload.data?.title) {
    return payload.data.title
  }
  if (payload.data?.message) {
    return payload.data.message
  }
  return 'Un événement s\'est produit sur la plateforme'
}

/**
 * Construit le FactSet pour Teams
 */
function buildFactSet(payload: WebhookPayload) {
  const facts = [
    {
      title: 'Date',
      value: new Date(payload.timestamp).toLocaleString('fr-FR'),
    },
  ]

  if (payload.electionId) {
    facts.push({
      title: 'Élection ID',
      value: payload.electionId,
    })
  }

  // Ajouter des données spécifiques selon l'événement
  if (payload.data) {
    if (payload.data.status) {
      facts.push({
        title: 'Statut',
        value: payload.data.status,
      })
    }
    if (payload.data.participation) {
      facts.push({
        title: 'Participation',
        value: `${payload.data.participation}%`,
      })
    }
    if (payload.data.totalVotes !== undefined) {
      facts.push({
        title: 'Votes',
        value: String(payload.data.totalVotes),
      })
    }
  }

  return facts
}

/**
 * Construit les champs pour Slack
 */
function buildSlackFields(payload: WebhookPayload) {
  const fields = [
    {
      type: 'mrkdwn',
      text: `*Date:*\n${new Date(payload.timestamp).toLocaleString('fr-FR')}`,
    },
  ]

  if (payload.data?.status) {
    fields.push({
      type: 'mrkdwn',
      text: `*Statut:*\n${payload.data.status}`,
    })
  }

  if (payload.data?.participation) {
    fields.push({
      type: 'mrkdwn',
      text: `*Participation:*\n${payload.data.participation}%`,
    })
  }

  return fields
}

/**
 * Construit les champs pour Zoom
 */
function buildZoomFields(payload: WebhookPayload) {
  const fields = [
    {
      key: 'Date',
      value: new Date(payload.timestamp).toLocaleString('fr-FR'),
    },
  ]

  if (payload.data?.status) {
    fields.push({
      key: 'Statut',
      value: payload.data.status,
    })
  }

  return fields
}

/**
 * Construit les actions pour Teams
 */
function buildActions(payload: WebhookPayload) {
  const actions = []

  if (payload.electionId) {
    actions.push({
      type: 'Action.OpenUrl',
      title: 'Voir l\'élection',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/elections/${payload.electionId}`,
    })

    if (payload.event === 'election.closed' || payload.event === 'results.published') {
      actions.push({
        type: 'Action.OpenUrl',
        title: 'Voir les résultats',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/elections/${payload.electionId}/results`,
      })
    }
  }

  return actions
}

/**
 * Construit les actions pour Slack
 */
function buildSlackActions(payload: WebhookPayload) {
  if (!payload.electionId) return []

  return [
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Voir l\'élection',
          },
          url: `${process.env.NEXT_PUBLIC_APP_URL}/elections/${payload.electionId}`,
        },
      ],
    },
  ]
}
