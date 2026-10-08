import {
  cardLayout,
  type RoleConfig,
  type RoleId,
} from '../config/cardLayout'
import type { CardFormState } from '../types'

/** Template for /team custom-role cards (company-logo style, no blueprint). */
export const teamRoleTemplate: RoleConfig = {
  pillLabel: 'TEAM',
  headline1: 'Team at',
  headline2: "Builders' Lab 2.0",
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
    headline2: "Builders' Lab 2.0",
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
 * Scale headline1 when the typed role makes "<Role> at" long, so it still
 * fits the 952px slot without colliding with the photo.
 */
export function scaledHeadline1Size(text: string, base: number): number {
  const len = text.trim().length
  if (len <= 14) return base
  if (len <= 18) return Math.round(base * 0.88)
  if (len <= 24) return Math.round(base * 0.74)
  if (len <= 32) return Math.round(base * 0.62)
  return Math.round(base * 0.52)
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
