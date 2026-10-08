/**
 * =============================================================================
 * IDEEZA Builders' Lab 2.0 — Social share post copy
 * =============================================================================
 *
 * Edit this file to change LinkedIn / X post text. Components only call
 * `buildLinkedInPost` / `buildXPost` / `buildShareUrls` — no hard-coded copy.
 *
 * Placeholders filled from the form when present:
 *   {name}     — person name
 *   {project}  — builder project (from subtitle, before an em/en dash)
 *   {title}    — mentor/judge title + company (full subtitle)
 * =============================================================================
 */

import type { RoleId } from './cardLayout'

export const WAITLIST_URL = 'https://www.ideeza.com/waitlist'
export const X_CHAR_LIMIT = 280
/** X counts every http(s) URL as this many characters (t.co). */
export const X_URL_WEIGHT = 23

export const SHARE_LINKS = {
  ideazaEthiopia: 'https://www.linkedin.com/showcase/ideeza-ethiopia/',
  ideazaCompany: 'https://www.linkedin.com/company/makeideeza/',
  telegram: 'https://t.me/make_ideeza',
  website: 'https://www.ideeza.com/',
  waitlist: WAITLIST_URL,
} as const

const EVENT_LINE = '📅 Sat, Oct 10 · 📍 6 Kilo, Addis Ababa'
const PARTNERS = 'IDEEZA x Women Techmakers Ethiopia x FCA Creators Hub'
const HASHTAGS_FULL = '#IDEEZA #BuildersLab #WomenTechmakers'
const HASHTAGS_SHORT = '#IDEEZA #BuildersLab'

export interface ShareFields {
  role: RoleId
  name: string
  /** Raw subtitle from the form (project pitch or title, company) */
  sub: string
}

export interface LinkedInTemplates {
  /** Opening sentence(s) before the shared body */
  opener: string
  /** Clause that mentions the project / role detail; may include {project} or {title} */
  detail: string
}

/**
 * LinkedIn post templates per role.
 * `{name}`, `{project}`, and `{title}` are optional — builders strip unused bits.
 */
export const linkedInByRole: Record<RoleId, LinkedInTemplates> = {
  builder: {
    opener:
      "I'm pitching at IDEEZA Builders' Lab 2.0! 🚀",
    detail:
      'I built {project} in 14 days with IDEEZA, and on Pitch Day I\'m showing it to the room.',
  },
  mentor: {
    opener:
      "I'm mentoring at IDEEZA Builders' Lab 2.0! Excited to help builders sharpen their products before Pitch Day.",
    detail: '',
  },
  judge: {
    opener:
      "I'm judging at IDEEZA Builders' Lab 2.0! Can't wait to see what these builders shipped in 14 days.",
    detail: '',
  },
}

/**
 * X (Twitter) templates. Keep short — `buildXPost` enforces the 280 limit
 * (URLs count as 23 each). Prefer `{project}` only when it fits.
 */
export const xByRole: Record<
  RoleId,
  { withProject: string; withoutProject: string }
> = {
  builder: {
    withProject:
      "I built {project} in 14 days with IDEEZA and I'm pitching it at Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Next time, you're in the room: {waitlist} {hashtags}",
    withoutProject:
      "I built something in 14 days with IDEEZA and I'm pitching it at Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Next time, you're in the room: {waitlist} {hashtags}",
  },
  mentor: {
    withProject:
      "Mentoring at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Helping builders ship. Next time, you're in the room: {waitlist} {hashtags}",
    withoutProject:
      "Mentoring at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Helping builders ship. Next time, you're in the room: {waitlist} {hashtags}",
  },
  judge: {
    withProject:
      "Judging at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Can't wait to see what shipped in 14 days. Next time, you're in the room: {waitlist} {hashtags}",
    withoutProject:
      "Judging at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Can't wait to see what shipped in 14 days. Next time, you're in the room: {waitlist} {hashtags}",
  },
}

export const toastCopy = {
  linkedin:
    'Card saved · post text copied. Attach the image in LinkedIn and hit post.',
  x: 'Card saved · post text copied. Attach the image on X and hit post.',
} as const

/** Extract builder project name from "Project — pitch" / "Project - pitch". */
export function extractProject(sub: string): string {
  const raw = sub.trim()
  if (!raw) return ''
  const parts = raw.split(/\s*[—–-]\s*/)
  return (parts[0] || raw).trim()
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

function collapseSpaces(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim()
}

/**
 * Weighted length for X: each http(s) URL = X_URL_WEIGHT; most emoji = 2;
 * other code points = 1.
 */
export function xWeightedLength(text: string): number {
  const urlRe = /https?:\/\/[^\s]+/gi
  const urls = text.match(urlRe) ?? []
  let rest = text
  for (const u of urls) {
    rest = rest.replace(u, '')
  }

  let len = urls.length * X_URL_WEIGHT
  for (const ch of rest) {
    const cp = ch.codePointAt(0) ?? 0
    // Non-BMP (emoji, etc.) or common emoji presentation → weight 2
    if (cp > 0xffff || (cp >= 0x2600 && cp <= 0x27bf) || (cp >= 0x1f300 && cp <= 0x1faff)) {
      len += 2
    } else {
      len += 1
    }
  }
  return len
}

export function buildLinkedInPost(fields: ShareFields): string {
  const name = fields.name.trim()
  const sub = fields.sub.trim()
  const project = extractProject(sub)
  const title = sub
  const tpl = linkedInByRole[fields.role]

  const parts: string[] = [tpl.opener]

  if (name || title) {
    parts.push(`— ${[name, title].filter(Boolean).join(', ')}`)
  }

  if (tpl.detail) {
    if (project) {
      parts.push(fill(tpl.detail, { project, name, title }))
    } else if (fields.role === 'builder') {
      parts.push(
        "I built this in 14 days with IDEEZA, and on Pitch Day I'm showing it to the room.",
      )
    }
  }

  parts.push(
    '',
    EVENT_LINE,
    PARTNERS,
    '',
    "Next time, you're in the room. Join the waitlist: " + WAITLIST_URL,
    '',
    'Follow IDEEZA:',
    `IDEEZA Ethiopia: ${SHARE_LINKS.ideazaEthiopia}`,
    `IDEEZA: ${SHARE_LINKS.ideazaCompany}`,
    `Telegram: ${SHARE_LINKS.telegram}`,
    `Website: ${SHARE_LINKS.website}`,
    '',
    HASHTAGS_FULL,
  )

  return collapseSpaces(parts.join('\n'))
}

/**
 * Build an X post ≤ 280 weighted chars. Trims `{project}` then drops a hashtag
 * if still over the limit.
 */
export function buildXPost(fields: ShareFields): string {
  const project = extractProject(fields.sub)
  const tpl = xByRole[fields.role]
  const baseTpl = project ? tpl.withProject : tpl.withoutProject

  const tryBuild = (proj: string, hashtags: string) =>
    collapseSpaces(
      fill(baseTpl, {
        project: proj,
        waitlist: WAITLIST_URL,
        hashtags,
      }),
    )

  let text = tryBuild(project, HASHTAGS_FULL)
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  // Trim project name gradually
  if (project) {
    for (let max = Math.min(project.length, 40); max >= 8; max -= 2) {
      const trimmed =
        project.length > max ? project.slice(0, max - 1).trimEnd() + '…' : project
      text = tryBuild(trimmed, HASHTAGS_FULL)
      if (xWeightedLength(text) <= X_CHAR_LIMIT) return text
    }
    // Drop project entirely
    text = tryBuild('', HASHTAGS_FULL)
    // Rebuild without empty "I built  in"
    text = collapseSpaces(
      fill(tpl.withoutProject, {
        project: '',
        waitlist: WAITLIST_URL,
        hashtags: HASHTAGS_FULL,
      }),
    )
    if (xWeightedLength(text) <= X_CHAR_LIMIT) return text
  }

  text = tryBuild(project ? project.slice(0, 12) + '…' : '', HASHTAGS_SHORT)
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  text = collapseSpaces(
    fill(tpl.withoutProject, {
      project: '',
      waitlist: WAITLIST_URL,
      hashtags: '#IDEEZA',
    }),
  )
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  // Last resort hard slice (should not happen with current templates)
  while (xWeightedLength(text) > X_CHAR_LIMIT && text.length > 0) {
    text = text.slice(0, -1)
  }
  return text.trim()
}

export function buildShareUrls(text: string): { x: string; linkedin: string } {
  const encoded = encodeURIComponent(text)
  return {
    x: `https://x.com/intent/post?text=${encoded}`,
    linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encoded}`,
  }
}

/** Fallback LinkedIn share if the composer URL is blocked / fails. */
export function linkedInFallbackUrl(): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(WAITLIST_URL)}`
}
