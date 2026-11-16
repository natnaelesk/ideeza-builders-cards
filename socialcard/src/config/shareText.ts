/**
 * =============================================================================
 * Vibe Builders National Tour — Social share post copy + modal UI strings
 * =============================================================================
 *
 * Placeholders: {name}, {university}, {dates}, {event}, {prize}, {register}
 * =============================================================================
 */

import { cardLayout } from './cardLayout'

export const REGISTER_URL = cardLayout.registerUrl
export const X_CHAR_LIMIT = 280
export const X_URL_WEIGHT = 23

export interface IdeezaLinkItem {
  label: string
  url: string
}

export interface IdeezaLinkGroup {
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
  name: string
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
    name: fields.name.trim(),
    university: fields.universityName?.trim() || cardLayout.university.name,
    dates: fields.universityDates?.trim() || cardLayout.university.dates,
    event: cardLayout.eventName,
    prize: cardLayout.prizeHeadline,
    register: REGISTER_URL,
  }
}

export function buildLinkedInPost(fields: ShareFields): string {
  const v = uniFields(fields)
  const parts: string[] = [
    `I'm a Vibe Builder at the ${v.event}, ${v.university}, ${v.dates}! 🚀`,
  ]

  if (v.name) {
    parts.push(`— ${v.name}`)
  }

  parts.push(
    '',
    `Built with IDEEZA, with Cheche Impact. ${v.prize}.`,
    '',
    `${LI_TAGS}`,
    '',
    `Register: ${v.register}`,
    '',
    formatIdeezaLinksBlock(),
    '',
    HASHTAGS_FULL,
  )

  return collapseSpaces(parts.join('\n'))
}

/**
 * X post ≤ 280 weighted chars. Trims `{name}` then drops a hashtag if needed.
 */
export function buildXPost(fields: ShareFields): string {
  const v = uniFields(fields)

  const withName =
    "I'm a Vibe Builder at the {event}, {university}, {dates} — {name}. By IDEEZA with Cheche. {prize}. Register: {register} {hashtags}"
  const withoutName =
    "I'm a Vibe Builder at the {event}, {university}, {dates}. By IDEEZA with Cheche. {prize}. Register: {register} {hashtags}"

  const tryBuild = (name: string, hashtags: string) =>
    collapseSpaces(
      fill(name ? withName : withoutName, {
        ...v,
        name,
        hashtags,
      }),
    )

  let text = tryBuild(v.name, HASHTAGS_FULL)
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  if (v.name) {
    for (let max = Math.min(v.name.length, 36); max >= 6; max -= 2) {
      const trimmed =
        v.name.length > max ? v.name.slice(0, max - 1).trimEnd() + '…' : v.name
      text = tryBuild(trimmed, HASHTAGS_FULL)
      if (xWeightedLength(text) <= X_CHAR_LIMIT) return text
    }
    text = tryBuild('', HASHTAGS_FULL)
    if (xWeightedLength(text) <= X_CHAR_LIMIT) return text
  }

  text = tryBuild(v.name ? v.name.slice(0, 10) + '…' : '', HASHTAGS_SHORT)
  if (xWeightedLength(text) <= X_CHAR_LIMIT) return text

  text = tryBuild('', '#VibeBuilders')
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
