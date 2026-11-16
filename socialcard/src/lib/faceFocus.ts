import { PHOTO_WINDOW } from '../config/badgeGeometry'
import { clampTransform } from './photoCover'
import { defaultPhotoTransform, type PhotoTransform } from '../types'

type FaceBox = { x: number; y: number; width: number; height: number }

/**
 * Prefer FaceDetector when available; otherwise return default upward bias.
 * Offsets are in window-local pixels (same space as PhotoTransform.ox/oy).
 */
export async function focusTransformForPhoto(
  dataUrl: string,
): Promise<PhotoTransform> {
  const base = defaultPhotoTransform()
  try {
    const FaceDetectorCtor = (
      globalThis as unknown as {
        FaceDetector?: new (opts?: {
          fastMode?: boolean
          maxDetectedFaces?: number
        }) => {
          detect: (source: ImageBitmapSource) => Promise<
            Array<{ boundingBox: FaceBox }>
          >
        }
      }
    ).FaceDetector
    if (!FaceDetectorCtor) return base

    const img = await loadImage(dataUrl)
    const detector = new FaceDetectorCtor({
      fastMode: true,
      maxDetectedFaces: 1,
    })
    const faces = await detector.detect(img)
    if (!faces.length) return base

    const box = faces[0].boundingBox
    const faceCx = box.x + box.width / 2
    const faceCy = box.y + box.height / 2
    const nx = faceCx / img.width - 0.5
    const ny = faceCy / img.height - 0.5
    const { width: winW, height: winH } = PHOTO_WINDOW
    const zoom = Math.max(1.05, Math.min(1.4, 1.08 + box.height / img.height))
    const proposed: PhotoTransform = {
      // Shift image so face moves toward upper center of the window
      ox: -nx * winW * 0.55,
      oy: -ny * winH * 0.55 - 14,
      zoom,
    }
    return clampTransform(proposed, img.naturalWidth || img.width, img.naturalHeight || img.height)
  } catch {
    return base
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('face focus image load failed'))
    img.src = src
  })
}
