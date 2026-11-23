/**
 * Share post copy for the IDEEZA Virtual Hackathon card.
 * No judges / dates / extra claims — matches the card facts only.
 */

import { xWeightedLength, X_CHAR_LIMIT } from './shareText'

export const HACKATHON_SHARE_BASE =
  "I'm building in the IDEEZA Virtual Hackathon 🚀 160,000 ETB in prizes. Public vote decides. Vote for my project and join at www.ideeza.com"

const HASHTAGS = '#IDEEZA #VirtualHackathon'

export interface HackathonShareFields {
  name: string
  project: string
}

/** LinkedIn / long-form post suggestion. */
export function buildHackathonLinkedInPost(fields: HackathonShareFields): string {
  const name = fields.name.trim()
  const project = fields.project.trim()
  const parts = [HACKATHON_SHARE_BASE]

  if (name || project) {
    parts.push(`— ${[name, project].filter(Boolean).join(', ')}`)
  }

  parts.push('', 'www.ideeza.com', 't.me/ideeza_chat', '', HASHTAGS)
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** X post — keep under 280 weighted chars. */
export function buildHackathonXPost(fields: HackathonShareFields): string {
  const name = fields.name.trim()
  const project = fields.project.trim()

  const candidates = [
    `${HACKATHON_SHARE_BASE}${name || project ? `\n— ${[name, project].filter(Boolean).join(', ')}` : ''} ${HASHTAGS}`,
    `${HACKATHON_SHARE_BASE} ${HASHTAGS}`,
    HACKATHON_SHARE_BASE,
  ]

  for (const text of candidates) {
    const collapsed = text.replace(/ {2,}/g, ' ').trim()
    if (xWeightedLength(collapsed) <= X_CHAR_LIMIT) return collapsed
  }

  let text = HACKATHON_SHARE_BASE
  while (xWeightedLength(text) > X_CHAR_LIMIT && text.length > 0) {
    text = text.slice(0, -1)
  }
  return text.trim()
}

export function buildHackathonPostText(
  platform: 'linkedin' | 'x',
  fields: HackathonShareFields,
): string {
  return platform === 'linkedin'
    ? buildHackathonLinkedInPost(fields)
    : buildHackathonXPost(fields)
}
