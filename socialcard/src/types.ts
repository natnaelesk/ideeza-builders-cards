/**
 * Photo placement in the badge window's local (unrotated) frame.
 * ox/oy = image-center offset from window center (px). Positive ox → right,
 * positive oy → down. Always clamped so the cover-fit image never gaps.
 */
export interface PhotoTransform {
  ox: number
  oy: number
  zoom: number
}

export interface CardFormState {
  name: string
  photoUrl: string | null
  photoTransform: PhotoTransform
}

/** Default: slight upward bias so faces sit higher in the window. */
export const defaultPhotoTransform = (): PhotoTransform => ({
  ox: 0,
  oy: -12,
  zoom: 1.05,
})

export const PHOTO_ZOOM_MIN = 1
export const PHOTO_ZOOM_MAX = 4
