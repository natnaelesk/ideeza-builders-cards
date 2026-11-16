export interface PhotoTransform {
  x: number
  y: number
  zoom: number
}

export type CutoutStatus = 'idle' | 'preparing' | 'ready' | 'fallback'

export interface CardFormState {
  name: string
  photoUrl: string | null
  cutoutUrl: string | null
  cutoutStatus: CutoutStatus
  cutoutProgress: number
  cutoutProgressLabel: string
  photoTransform: PhotoTransform
}

export const defaultPhotoTransform = (): PhotoTransform => ({
  x: 0,
  y: 6,
  zoom: 1.08,
})

export const PHOTO_PAN_MIN = -50
export const PHOTO_PAN_MAX = 50
export const PHOTO_ZOOM_MIN = 1
export const PHOTO_ZOOM_MAX = 2.5
