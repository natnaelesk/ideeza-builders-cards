/**
 * =============================================================================
 * IDEEZA Builders' Lab 2.0 — Social share post copy + modal UI strings
 * =============================================================================
 *
 * Edit this file to change LinkedIn / X post text, IDEEZA link block, and
 * share-sheet labels. Components only call builders / read `modalCopy`.
 *
 * Placeholders filled from the form when present:
 *   {name}     — person name
 *   {project}  — builder project (from subtitle, before an em/en dash)
 *   {title}    — mentor/judge/team title + company (full subtitle)
 *   {role}     — typed team role (Organizer, Volunteer, …)
 *   {a}        — a/an for the typed role
 * =============================================================================
 */

import { indefiniteArticle } from '../lib/roleDisplay'
import type { RoleId } from './cardLayout'

export const WAITLIST_URL = 'https://www.ideeza.com/waitlist'
export const X_CHAR_LIMIT = 280
/** X counts every http(s) URL as this many characters (t.co). */
export const X_URL_WEIGHT = 23

/** Structured IDEEZA links — defined once, used in LinkedIn posts + X modal. */
export interface IdeezaLinkItem {
  label: string
  url: string
}

export interface IdeezaLinkGroup {
  /** Optional heading (omit for the website-only top line) */
  heading?: string
  items: IdeezaLinkItem[]
}

export const IDEEZA_LINK_GROUPS: IdeezaLinkGroup[] = [
  {
    items: [{ label: '🌐 Website', url: 'https://www.ideeza.com/' }],
  },
  {
    heading: 'IDEEZA Ethiopia',
    items: [
      { label: 'Instagram', url: 'http://instagram.com/ideeza_ethiopia/' },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/showcase/ideeza-ethiopia/',
      },
      { label: 'TikTok', url: 'https://www.tiktok.com/@ideeza.ethiopia' },
    ],
  },
  {
    heading: 'IDEEZA Global',
    items: [
      { label: 'Telegram', url: 'https://t.me/make_ideeza' },
      { label: 'Instagram', url: 'http://instagram.com/the_ideeza/' },
      {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/company/makeideeza/',
      },
      { label: 'TikTok', url: 'https://www.tiktok.com/@ideeza' },
    ],
  },
]

/** Render the structured link list as plain text (LinkedIn body / X links box). */
export function formatIdeezaLinksBlock(
  groups: IdeezaLinkGroup[] = IDEEZA_LINK_GROUPS,
): string {
  return groups
    .map((group) => {
      const lines: string[] = []
      if (group.heading) lines.push(group.heading)
      for (const item of group.items) {
        lines.push(`${item.label}: ${item.url}`)
      }
      return lines.join('\n')
    })
    .join('\n\n')
}

export const SHARE_LINKS = {
  waitlist: WAITLIST_URL,
  website: 'https://www.ideeza.com/',
  /** Open LinkedIn feed/app — never use share-offsite (drops post text on mobile). */
  linkedinFeed: 'https://www.linkedin.com/feed/',
} as const

const EVENT_LINE = '📅 Sat, Oct 10 · 📍 6 Kilo, Addis Ababa'
const PARTNERS = 'IDEEZA x Women Techmakers Ethiopia x FCA Creators Hub'
const HASHTAGS_FULL = '#IDEEZA #BuildersLab #WomenTechmakers'
const HASHTAGS_SHORT = '#IDEEZA #BuildersLab'

export type ShareRoleId = RoleId | 'custom'

export interface ShareFields {
  role: ShareRoleId
  name: string
  /** Raw subtitle from the form (project pitch or title, company) */
  sub: string
  /** Required when role === 'custom' — typed label on /team */
  customRole?: string
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
    opener: "I'm pitching at IDEEZA Builders' Lab 2.0! 🚀",
    detail:
      "I built {project} within minutes using IDEEZA, and on Pitch Day I'm showing it to the room.",
  },
  mentor: {
    opener:
      "I'm mentoring at IDEEZA Builders' Lab 2.0! Excited to help builders sharpen their products before Pitch Day.",
    detail: '',
  },
  judge: {
    opener:
      "I'm judging at IDEEZA Builders' Lab 2.0! Can't wait to see what these builders shipped within minutes.",
    detail: '',
  },
}

/** LinkedIn opener for /team custom roles. `{a}` = a/an, `{role}` = typed label. */
export const linkedInCustom: LinkedInTemplates = {
  opener:
    "I'm {a} {role} at IDEEZA Builders' Lab 2.0! Proud to be part of Pitch Day with this crew.",
  detail: '',
}

/**
 * X (Twitter) templates. Keep short — `buildXPost` enforces the 280 limit
 * (URLs count as 23 each). Prefer `{project}` only when it fits.
 * Full IDEEZA links live in the X modal's separate "IDEEZA links" box.
 */
export const xByRole: Record<
  RoleId,
  { withProject: string; withoutProject: string }
> = {
  builder: {
    withProject:
      "I built {project} within minutes using IDEEZA and I'm pitching it at Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Next time, you're in the room: {waitlist} {hashtags}",
    withoutProject:
      "I built something within minutes using IDEEZA and I'm pitching it at Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Next time, you're in the room: {waitlist} {hashtags}",
  },
  mentor: {
    withProject:
      "Mentoring at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Helping builders ship. Next time, you're in the room: {waitlist} {hashtags}",
    withoutProject:
      "Mentoring at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Helping builders ship. Next time, you're in the room: {waitlist} {hashtags}",
  },
  judge: {
    withProject:
      "Judging at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Can't wait to see what shipped within minutes. Next time, you're in the room: {waitlist} {hashtags}",
    withoutProject:
      "Judging at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Can't wait to see what shipped within minutes. Next time, you're in the room: {waitlist} {hashtags}",
  },
}

/** X templates for /team — keep short; `{role}` may be truncated to fit 280. */
export const xCustom = {
  withRole:
    "I'm {a} {role} at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Next time, you're in the room: {waitlist} {hashtags}",
  withoutRole:
    "Part of the crew at IDEEZA Builders' Lab 2.0 🚀 Sat, Oct 10 · 6 Kilo, Addis Ababa. Next time, you're in the room: {waitlist} {hashtags}",
}

/** UI strings for the share bottom-sheet / modal. */
export const modalCopy = {
  titles: {
    linkedin: 'Share on LinkedIn',
    x: 'Share on X',
  },
  steps: {
    linkedin: '1) Save image  2) Copy text  3) Open LinkedIn, paste & attach',
    x: '1) Save image  2) Copy text  3) Open X, paste & attach',
  },
  saveImage: 'Save image',
  shareImageToApp: 'Share image to app…',
  shareImageHint: 'Text copied — paste it as your caption if the app drops it.',
  copyText: 'Copy text',
  copied: 'Copied!',
  openLinkedIn: 'Open LinkedIn',
  openX: 'Open X',
  close: 'Close',
  imageAlt: 'Your share card (1080×1350)',
  longPressHint: 'Tip: you can also long-press the image to save it.',
  preparing: 'Preparing your card…',
  prepareError: 'Couldn’t render the card. Try Download PNG instead.',
  savedDownload: 'Image saved to your downloads.',
  /** X-only: separate copyable link block for a reply/thread */
  ideezaLinksLabel: 'IDEEZA links',
  ideezaLinksHint: 'Paste as a reply or thread so the post stays under 280.',
  copyLinks: 'Copy links',
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
    if (
      cp > 0xffff ||
      (cp >= 0x2600 && cp <= 0x27bf) ||
      (cp >= 0x1f300 && cp <= 0x1faff)
    ) {
      len += 2
    } else {
      len += 1
    }
  }
  return len
}

function customRoleLabel(fields: ShareFields): string {
  return (fields.customRole ?? '').trim() || 'team member'
}

export function buildLinkedInPost(fields: ShareFields): string {
  const name = fields.name.trim()
  const sub = fields.sub.trim()
  const project = extractProject(sub)
  const title = sub

  const tpl =
    fields.role === 'custom'
      ? linkedInCustom
      : linkedInByRole[fields.role]

  const roleLabel = customRoleLabel(fields)
  const opener =
    fields.role === 'custom'
      ? fill(tpl.opener, {
          role: roleLabel,
          a: indefiniteArticle(roleLabel),
        })
      : tpl.opener

  const parts: string[] = [opener]

  if (name || title) {
    parts.push(`— ${[name, title].filter(Boolean).join(', ')}`)
  }

  if (tpl.detail) {
    if (project) {
      parts.push(fill(tpl.detail, { project, name, title }))
    } else if (fields.role === 'builder') {
      parts.push(
        "I built this within minutes using IDEEZA, and on Pitch Day I'm showing it to the room.",
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
    formatIdeezaLinksBlock(),
    '',
    HASHTAGS_FULL,
  )

  return collapseSpaces(parts.join('\n'))
}

/**
 * Build an X post ≤ 280 weighted chars. Trims `{project}` then drops a hashtag
 * if still over the limit. Does NOT include the full IDEEZA links block —
 * that lives in the X modal's separate copyable section.
 */
function buildCustomXPost(fields: ShareFields): string {
  const roleLabel = customRoleLabel(fields)
  const hasRole = Boolean((fields.customRole ?? '').trim())

  const tryBuild = (role: string, hashtags: string) => {
    const article = indefiniteArticle(role)
    const tpl = role ? xCustom.withRole : xCustom.withoutRole
    return collapseSpaces(
      fill(tpl, {
        role,
        a: article,
        waitlist: WAITLIST_URL,
        hashtags,
      }),
    )
  }

  let text = tryBuild(hasRole ? roleLabel : '', HASHTAGS_FULL)
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  if (hasRole) {
    for (let max = Math.min(roleLabel.length, 28); max >= 6; max -= 2) {
      const trimmed =
        roleLabel.length > max
          ? roleLabel.slice(0, max - 1).trimEnd() + '…'
          : roleLabel
      text = tryBuild(trimmed, HASHTAGS_FULL)
      if (xWeightedLength(text) <= X_CHAR_LIMIT) return text
    }
  }

  text = tryBuild(hasRole ? roleLabel.slice(0, 10) + '…' : '', HASHTAGS_SHORT)
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  text = tryBuild('', '#IDEEZA')
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  while (xWeightedLength(text) > X_CHAR_LIMIT && text.length > 0) {
    text = text.slice(0, -1)
  }
  return text.trim()
}

export function buildXPost(fields: ShareFields): string {
  if (fields.role === 'custom') return buildCustomXPost(fields)

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

  if (project) {
    for (let max = Math.min(project.length, 40); max >= 8; max -= 2) {
      const trimmed =
        project.length > max ? project.slice(0, max - 1).trimEnd() + '…' : project
      text = tryBuild(trimmed, HASHTAGS_FULL)
      if (xWeightedLength(text) <= X_CHAR_LIMIT) return text
    }
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

  while (xWeightedLength(text) > X_CHAR_LIMIT && text.length > 0) {
    text = text.slice(0, -1)
  }
  return text.trim()
}

/** Platform open URLs — LinkedIn is feed only (no share-offsite). */
export function buildOpenUrls(text: string): { x: string; linkedin: string } {
  return {
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
    linkedin: SHARE_LINKS.linkedinFeed,
  }
}
