/**
 * Client-side background removal via @imgly/background-removal (full isnet).
 * Lazy-loaded after photo upload. ~176 MB model + ~12 MB WASM on first run (CDN).
 */

export type CutoutProgress = {
  ratio: number
  label: string
}

export type CutoutResult = {
  blob: Blob
  objectUrl: string
  elapsedMs: number
  model: 'isnet'
}

const MODEL = 'isnet' as const

type RemoveBackgroundFn = (
  image: string | Blob | URL | ArrayBuffer | Uint8Array | ImageData,
  config?: Record<string, unknown>,
) => Promise<Blob>

let removeBackgroundFn: RemoveBackgroundFn | null = null

async function loadLibrary(): Promise<RemoveBackgroundFn> {
  if (removeBackgroundFn) return removeBackgroundFn
  const mod = await import('@imgly/background-removal')
  const fn = (mod.removeBackground ??
    (mod as unknown as { default: RemoveBackgroundFn }).default) as RemoveBackgroundFn
  removeBackgroundFn = fn
  return fn
}

/** Soft alpha feather — keeps curly/afro hair edges without hard threshold. */
async function softMatte(blob: Blob, radius = 1.2): Promise<Blob> {
  const bmp = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width
  canvas.height = bmp.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return blob
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const { width, height } = canvas
  const img = ctx.getImageData(0, 0, width, height)
  const src = img.data
  const alpha = new Float32Array(width * height)
  for (let i = 0, p = 0; i < src.length; i += 4, p++) alpha[p] = src[i + 3]
  const tmp = new Float32Array(alpha.length)
  const r = Math.max(1, Math.round(radius))
  for (let y = 0; y < height; y++) {
    let sum = 0
    const row = y * width
    for (let x = 0; x < Math.min(r, width); x++) sum += alpha[row + x]
    for (let x = 0; x < width; x++) {
      const right = x + r
      const left = x - r - 1
      if (right < width) sum += alpha[row + right]
      if (left >= 0) sum -= alpha[row + left]
      const count = Math.min(x + r, width - 1) - Math.max(x - r, 0) + 1
      tmp[row + x] = sum / count
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let y = 0; y < Math.min(r, height); y++) sum += tmp[y * width + x]
    for (let y = 0; y < height; y++) {
      const bot = y + r
      const top = y - r - 1
      if (bot < height) sum += tmp[bot * width + x]
      if (top >= 0) sum -= tmp[top * width + x]
      const count = Math.min(y + r, height - 1) - Math.max(y - r, 0) + 1
      src[(y * width + x) * 4 + 3] = Math.max(
        0,
        Math.min(255, Math.round(sum / count)),
      )
    }
  }
  ctx.putImageData(img, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('softMatte failed'))),
      'image/png',
    )
  })
}

const cache = new Map<string, CutoutResult>()

export function revokeCutout(cacheKey: string) {
  const hit = cache.get(cacheKey)
  if (hit) {
    URL.revokeObjectURL(hit.objectUrl)
    cache.delete(cacheKey)
  }
}

export async function prepareCoverCutout(
  imageSource: string,
  cacheKey: string,
  onProgress?: (p: CutoutProgress) => void,
): Promise<CutoutResult> {
  const hit = cache.get(cacheKey)
  if (hit) {
    onProgress?.({ ratio: 1, label: 'Ready' })
    return hit
  }

  const started = performance.now()
  onProgress?.({ ratio: 0.02, label: 'Loading AI model…' })
  const removeBackground = await loadLibrary()

  const blob = await removeBackground(imageSource, {
    model: MODEL,
    device: 'cpu',
    output: { format: 'image/png', type: 'foreground', quality: 1 },
    progress: (key: string, current: number, total: number) => {
      const part = total > 0 ? current / total : 0
      onProgress?.({
        ratio: Math.min(0.85, part * 0.85),
        label:
          part < 1
            ? `Downloading model… ${Math.round(part * 100)}%`
            : `Running ${key.split('/').pop() || 'isnet'}…`,
      })
    },
  })

  onProgress?.({ ratio: 0.9, label: 'Refining edges…' })
  const softened = await softMatte(blob, 1.2)
  const objectUrl = URL.createObjectURL(softened)
  const result: CutoutResult = {
    blob: softened,
    objectUrl,
    elapsedMs: Math.round(performance.now() - started),
    model: MODEL,
  }
  cache.set(cacheKey, result)
  onProgress?.({ ratio: 1, label: 'Ready' })
  return result
}

export const ISNET_DOWNLOAD_NOTE = {
  model: 'isnet (full)',
  modelMb: 176,
  wasmMb: 12,
  totalColdMbApprox: 188,
} as const
