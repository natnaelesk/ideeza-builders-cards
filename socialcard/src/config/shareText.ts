/**
 * =============================================================================
 * Vibe Builders National Tour — Social share post copy + modal UI strings
 * =============================================================================
 *
 * Edit this file to change LinkedIn / X post text, IDEEZA link block, and
 * share-sheet labels. Components only call builders / read `modalCopy`.
 *
 * Placeholders:
 *   {name}       — person name
 *   {project}    — project name
 *   {pitch}      — one-line pitch
 *   {university} — university name
 *   {dates}      — event dates
 * =============================================================================
 */

import { cardLayout, type DayId } from './cardLayout'

export const REGISTER_URL = cardLayout.registerUrl
export const X_CHAR_LIMIT = 280
/** X counts every http(s) URL as this many characters (t.co). */
export const X_URL_WEIGHT = 23

export interface IdeezaLinkItem {
  label: string
  url: string
}

export interface IdeezaLinkGroup {
  heading?: string
  items: IdeezaLinkItem[]
}

/** Same IDEEZA link block as the Builders' Lab root app. */
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
  register: REGISTER_URL,
  website: 'https://www.ideeza.com/',
  linkedinFeed: 'https://www.linkedin.com/feed/',
} as const

const HASHTAGS_FULL = '#VibeBuilders #IDEEZA #Cheche'
const HASHTAGS_SHORT = '#VibeBuilders #IDEEZA'
const LI_TAGS = '@IDEEZA @Cheche Impact'

export interface ShareFields {
  day: DayId
  name: string
  project: string
  pitch: string
  /** Defaults to config university when omitted */
  universityName?: string
  universityDates?: string
}

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
  ideezaLinksLabel: 'IDEEZA links',
  ideezaLinksHint: 'Paste as a reply or thread so the post stays under 280.',
  copyLinks: 'Copy links',
} as const

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

function uniFields(fields: ShareFields) {
  return {
    university: fields.universityName?.trim() || cardLayout.university.name,
    dates: fields.universityDates?.trim() || cardLayout.university.dates,
  }
}

function dayOpenerLinkedIn(day: DayId, project: string): string {
  if (day === 'day1') {
    return 'I joined the Vibe Builders Workshop at the Vibe Builders National Tour! 🚀'
  }
  if (day === 'day2') {
    return project
      ? `I built ${project} at the IDEEZA Vibe Inventing Hackathon — Vibe Builders National Tour! 🚀`
      : 'I built this at the IDEEZA Vibe Inventing Hackathon — Vibe Builders National Tour! 🚀'
  }
  // Day 3 — first-person for the poster owner
  return project
    ? `I built ${project} at the Code H.E.R Future Hackathon by Cheche Technologies, built with IDEEZA — Vibe Builders National Tour! 🚀`
    : 'I built this at the Code H.E.R Future Hackathon by Cheche Technologies, built with IDEEZA — Vibe Builders National Tour! 🚀'
}

export function buildLinkedInPost(fields: ShareFields): string {
  const name = fields.name.trim()
  const project = fields.project.trim()
  const pitch = fields.pitch.trim()
  const { university, dates } = uniFields(fields)

  const parts: string[] = [dayOpenerLinkedIn(fields.day, project)]

  if (name || project || pitch) {
    const detail = [name, project, pitch].filter(Boolean).join(' · ')
    parts.push(`— ${detail}`)
  }

  parts.push(
    '',
    `📍 ${university} · ${dates}`,
    'IDEEZA × Cheche Impact × Zemenay Tech × INSA',
    '',
    `${LI_TAGS}`,
    '',
    `Register: ${REGISTER_URL}`,
    '',
    formatIdeezaLinksBlock(),
    '',
    HASHTAGS_FULL,
  )

  return collapseSpaces(parts.join('\n'))
}

type XTemplate = { withProject: string; withoutProject: string }

const xByDay: Record<DayId, XTemplate> = {
  day1: {
    withProject:
      'I joined the Vibe Builders Workshop at {university} ({dates}) — Vibe Builders National Tour with IDEEZA & Cheche. {project} Register: {register} {hashtags}',
    withoutProject:
      'I joined the Vibe Builders Workshop at {university} ({dates}) — Vibe Builders National Tour with IDEEZA & Cheche. Register: {register} {hashtags}',
  },
  day2: {
    withProject:
      'I built {project} at the IDEEZA Vibe Inventing Hackathon — {university}, Vibe Builders National Tour with IDEEZA & Cheche. Register: {register} {hashtags}',
    withoutProject:
      'I built this at the IDEEZA Vibe Inventing Hackathon — {university}, Vibe Builders National Tour with IDEEZA & Cheche. Register: {register} {hashtags}',
  },
  day3: {
    withProject:
      'I built {project} at the Code H.E.R Future Hackathon by Cheche Technologies, built with IDEEZA — {university}, Vibe Builders National Tour. Register: {register} {hashtags}',
    withoutProject:
      'I built this at the Code H.E.R Future Hackathon by Cheche Technologies, built with IDEEZA — {university}, Vibe Builders National Tour. Register: {register} {hashtags}',
  },
}

/**
 * Build an X post ≤ 280 weighted chars. Trims `{project}` then drops a hashtag
 * if still over. Full IDEEZA links live in the X modal's separate box.
 */
export function buildXPost(fields: ShareFields): string {
  const project = fields.project.trim()
  const { university, dates } = uniFields(fields)
  const tpl = xByDay[fields.day]
  const baseTpl = project ? tpl.withProject : tpl.withoutProject

  const tryBuild = (proj: string, hashtags: string) =>
    collapseSpaces(
      fill(baseTpl, {
        project: proj,
        university,
        dates,
        register: REGISTER_URL,
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
        university,
        dates,
        register: REGISTER_URL,
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
      university,
      dates,
      register: REGISTER_URL,
      hashtags: '#VibeBuilders',
    }),
  )
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  while (xWeightedLength(text) > X_CHAR_LIMIT && text.length > 0) {
    text = text.slice(0, -1)
  }
  return text.trim()
}

export function buildOpenUrls(text: string): { x: string; linkedin: string } {
  return {
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
    linkedin: SHARE_LINKS.linkedinFeed,
  }
}
