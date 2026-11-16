/**
 * Measured layout for final-badge-v2 template (1080×1440).
 * Values from scripts/make-template.py (photo-window top-edge tilt).
 */
export const BADGE_TILT_DEG = 5.673

export const PHOTO_WINDOW = {
  center: [542.15, 522.03] as [number, number],
  width: 403.1,
  height: 380.5,
  /** Corner radius of the photo window (px in template space) */
  radius: 28,
}

export const NAME_SLOT = {
  center: [540, 760] as [number, number],
  maxWidth: 520,
  fontSize: 64,
}

export const EVENT_SLOT = {
  center: [560, 888] as [number, number],
  maxWidth: 480,
  fontSize: 22,
}

export const TEMPLATE_DATES = 'Nov 20–22'

export const TEMPLATE_SRC = '/template/badge-template.png'
