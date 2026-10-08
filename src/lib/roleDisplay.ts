import {
  cardLayout,
  type RoleConfig,
  type RoleId,
} from '../config/cardLayout'
import type { CardFormState } from '../types'

/** Second headline line for /team — names IDEEZA so the phrase reads complete. */
export const TEAM_HEADLINE2 = "IDEEZA Builders' Lab 2.0"

/**
 * Headline block width for team cards (px in 1080 space).
 * Leaves clear air before the decorative cube (~right:72, 96px wide).
 */
export const TEAM_HEADLINE_MAX_W = 800

/** Template for /team custom-role cards (company-logo style, no blueprint). */
export const teamRoleTemplate: RoleConfig = {
  pillLabel: 'TEAM',
  headline1: 'Team at',
  headline2: TEAM_HEADLINE2,
  kickerHtml:
    '<b>Pitch Day</b> · IDEEZA x Women Techmakers x FCA Creators Hub',
  defaultName: 'Your Name',
  defaultSub: 'Title, Company',
  nameLabel: 'Your name',
  namePlaceholder: 'Natnael Eskinder',
  subLabel: 'Title, company',
  subPlaceholder: 'Community Lead, IDEEZA',
  badgeTag: 'COMPANY',
  badgeUploadLabel: 'Company logo (optional)',
  panelIcon: 'person',
  // Designers: drop /frames/team.png and set frameSrc here (or per-card later).
  frameSrc: null,
  showBlueprint: false,
}

/** Build role config from a typed team role label. */
export function buildCustomRoleConfig(label: string): RoleConfig {
  const trimmed = label.trim() || 'Team'
  return {
    ...teamRoleTemplate,
    pillLabel: truncatePill(trimmed.toUpperCase()),
    headline1: `${trimmed} at`,
    headline2: TEAM_HEADLINE2,
  }
}

export function resolveRoleConfig(state: CardFormState): RoleConfig {
  const custom = state.customRole?.trim()
  if (custom) return buildCustomRoleConfig(custom)
  return cardLayout.roles[state.role]
}

export function isBuilderStyle(state: CardFormState): boolean {
  return state.role === 'builder' && !state.customRole?.trim()
}

/** English indefinite article for a role noun (Organizer → an, Host → a). */
export function indefiniteArticle(word: string): 'a' | 'an' {
  const w = word.trim().toLowerCase()
  if (!w) return 'a'
  if (/^(hour|honest|heir|honor)/.test(w)) return 'an'
  // "a university", "a European", "a one-off", "a user"
  if (/^(uni|eu|one|u[bcdfgjklnprstvwxz])/.test(w)) return 'a'
  if (/^[aeiou]/.test(w)) return 'an'
  return 'a'
}

export function truncatePill(label: string, max = 22): string {
  if (label.length <= max) return label
  return label.slice(0, max - 1).trimEnd() + '…'
}

/**
 * Starting (max) size for headline1 before DOM fit-shrink.
 * Long typed roles get a lower starting point so fit converges quickly.
 */
export function scaledHeadline1Size(text: string, base: number): number {
  const len = text.trim().length
  if (len <= 12) return base
  if (len <= 16) return Math.round(base * 0.9)
  if (len <= 20) return Math.round(base * 0.78)
  if (len <= 26) return Math.round(base * 0.66)
  if (len <= 34) return Math.round(base * 0.54)
  return Math.round(base * 0.44)
}

/** Starting size for team headline2 ("IDEEZA Builders' Lab 2.0"). */
export function scaledHeadline2Size(text: string, base: number): number {
  const len = text.trim().length
  if (len <= 18) return base
  if (len <= 24) return Math.round(base * 0.92)
  return Math.round(base * 0.82)
}

export function scaledPillFontSize(label: string, base: number): number {
  if (label.length <= 14) return base
  if (label.length <= 18) return Math.round(base * 0.9)
  return Math.round(base * 0.78)
}

export type StudioMode = 'pitch' | 'team'

export function roleIdForShare(
  state: CardFormState,
): RoleId | 'custom' {
  return state.customRole?.trim() ? 'custom' : state.role
}
