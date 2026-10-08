import type { RoleId } from './config/cardLayout'

export interface PhotoTransform {
  /** Horizontal pan as % of photo width (-50 … 50) */
  x: number
  /** Vertical pan as % of photo height (-50 … 50) */
  y: number
  /** Zoom multiplier (1 … 2.5) */
  zoom: number
}

export interface CardFormState {
  role: RoleId
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
