export interface PhotoTransform {
  x: number
  y: number
  zoom: number
}

export interface CardFormState {
  name: string
  photoUrl: string | null
  photoTransform: PhotoTransform
}

/** Default: slight upward bias so faces sit higher in the window. */
export const defaultPhotoTransform = (): PhotoTransform => ({
  x: 0,
  y: 10,
  zoom: 1.05,
})

export const PHOTO_PAN_MIN = -50
export const PHOTO_PAN_MAX = 50
export const PHOTO_ZOOM_MIN = 1
export const PHOTO_ZOOM_MAX = 2.5
