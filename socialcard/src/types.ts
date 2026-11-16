import type { DayId } from './config/cardLayout'

/**
 * Photo pan/zoom inside the circular photo slot.
 *
 * x/y are pan offsets in the −50…50 range (percent of the slot).
 * Positive x pans toward the right edge of the source.
 * Positive y pans toward the top of the source.
 *
 * Maps to CSS `object-position` / `transform-origin` — NOT translate —
 * so `object-fit: cover` keeps the slot filled while panning.
 */
export interface PhotoTransform {
  x: number
  y: number
  /** Zoom multiplier (1 … 2.5) */
  zoom: number
}

export interface CardFormState {
  day: DayId
  name: string
  project: string
  pitch: string
  photoUrl: string | null
  photoTransform: PhotoTransform
}

export const defaultPhotoTransform = (): PhotoTransform => ({
  x: 0,
  y: 0,
  zoom: 1.15,
})

export const PHOTO_PAN_MIN = -50
export const PHOTO_PAN_MAX = 50
export const PHOTO_ZOOM_MIN = 1
export const PHOTO_ZOOM_MAX = 2.5
