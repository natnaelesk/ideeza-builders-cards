import { defaultPhotoTransform, type PhotoTransform } from '../types'

type FaceBox = { x: number; y: number; width: number; height: number }

/**
 * Prefer FaceDetector when available; otherwise return default upward bias.
 * Maps the detected face center into our pan/zoom transform space.
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
    // Normalize face center to [-1, 1] relative to image center
    const nx = (faceCx / img.width - 0.5) * 2
    const ny = (faceCy / img.height - 0.5) * 2
    // Pan so the face sits slightly above center (negative y in our space = up)
    return {
      x: Math.max(-40, Math.min(40, -nx * 28)),
      y: Math.max(-20, Math.min(40, 12 - ny * 22)),
      zoom: Math.max(1.02, Math.min(1.35, 1.08 + box.height / img.height)),
    }
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
