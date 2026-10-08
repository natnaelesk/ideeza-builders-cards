import type { RoleId } from './config/cardLayout'

/**
 * Photo pan/zoom inside the arch slot.
 *
 * x/y are pan offsets in the −50…50 range (percent of the slot).
 * Positive x pans the visible window toward the right edge of the source.
 * Positive y pans toward the top of the source (so max y reveals the head).
 *
 * These map to CSS `object-position` / `transform-origin` — NOT translate —
 * so `object-fit: cover` keeps the slot filled while panning the source crop.
 */
export interface PhotoTransform {
  x: number
  y: number
  /** Zoom multiplier (1 … 2.5) */
  zoom: number
}

export interface CardFormState {
  role: RoleId
  /**
   * When set (team page), overrides the fixed Builder/Mentor/Judge pill +
   * headline with the typed role label.
   */
  customRole?: string
  name: string
  sub: string
  photoUrl: string | null
  photoTransform: PhotoTransform
  badgeUrl: string | null
}

export const defaultPhotoTransform = (): PhotoTransform => ({
  x: 0,
  y: 0,
  zoom: 1.15,
})

/** Full pan range — must reach every edge of a cover-cropped source. */
export const PHOTO_PAN_MIN = -50
export const PHOTO_PAN_MAX = 50
export const PHOTO_ZOOM_MIN = 1
export const PHOTO_ZOOM_MAX = 2.5
