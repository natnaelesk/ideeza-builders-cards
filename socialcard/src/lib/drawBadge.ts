import {
  BADGE_TILT_DEG,
  EVENT_SLOT,
  NAME_SLOT,
  PHOTO_WINDOW,
  TEMPLATE_DATES,
} from '../config/badgeGeometry'
import { CARD_HEIGHT, CARD_WIDTH, UNIVERSITY } from '../config/event'
import type { CardFormState } from '../types'

const RAD = (BADGE_TILT_DEG * Math.PI) / 180

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Alpha bbox of a cutout image (headroom above top of head). */
function alphaBBox(
  img: HTMLImageElement | ImageBitmap,
): { x: number; y: number; w: number; h: number } | null {
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  let minX = c.width,
    minY = c.height,
    maxX = 0,
    maxY = 0
  let found = false
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 24) {
        found = true
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (!found) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  state: CardFormState,
  photoImg: HTMLImageElement | ImageBitmap | null,
) {
  const { center, width, height, radius } = PHOTO_WINDOW
  const t = state.photoTransform
  const [cx, cy] = center

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(RAD)

  // Clip to rounded photo window (local space, centered)
  roundRectPath(ctx, -width / 2, -height / 2, width, height, radius)
  ctx.clip()

  if (photoImg) {
    const bbox = alphaBBox(photoImg as HTMLImageElement)
    // Source crop: prefer alpha bbox (face+upper body) with headroom
    let sx = 0,
      sy = 0,
      sw = photoImg.width,
      sh = photoImg.height
    if (bbox) {
      const headroom = bbox.h * 0.08
      sy = Math.max(0, bbox.y - headroom)
      sx = bbox.x
      sw = bbox.w
      sh = Math.min(photoImg.height - sy, bbox.h + headroom * 1.2)
    }

    // Cover-fit into window with pan/zoom
    const scale0 = Math.max(width / sw, height / sh) * t.zoom
    const dw = sw * scale0
    const dh = sh * scale0
    const ox = (t.x / 50) * (dw - width) * 0.5
    const oy = (-t.y / 50) * (dh - height) * 0.5
    ctx.drawImage(
      photoImg,
      sx,
      sy,
      sw,
      sh,
      -dw / 2 + ox,
      -dh / 2 + oy,
      dw,
      dh,
    )
  } else {
    // No-photo fallback: soft silhouette circle + initials
    ctx.fillStyle = '#e6e0ee'
    ctx.fillRect(-width / 2, -height / 2, width, height)
    const initials = (state.name.trim() || '?')
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    ctx.fillStyle = 'rgba(90, 60, 140, 0.2)'
    ctx.beginPath()
    ctx.arc(0, -height * 0.08, Math.min(width, height) * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(90, 60, 140, 0.18)'
    ctx.beginPath()
    ctx.ellipse(0, height * 0.28, width * 0.32, height * 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
    if (initials && initials !== '?') {
      ctx.fillStyle = 'rgba(60, 30, 110, 0.55)'
      ctx.font = `700 ${Math.round(height * 0.18)}px Poppins, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initials, 0, -height * 0.06)
    }
  }

  ctx.restore()
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): number {
  let size = maxSize
  ctx.font = `400 ${size}px Anton, "Arial Narrow", sans-serif`
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1
    ctx.font = `400 ${size}px Anton, "Arial Narrow", sans-serif`
  }
  return size
}

function drawName(ctx: CanvasRenderingContext2D, name: string) {
  const label = (name.trim() || 'YOUR NAME').toUpperCase()
  const [cx, cy] = NAME_SLOT.center
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(RAD)
  const size = fitText(ctx, label, NAME_SLOT.maxWidth, NAME_SLOT.fontSize, 28)
  ctx.font = `400 ${size}px Anton, "Arial Narrow", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(40, 10, 80, 0.35)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 2
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, 0, 0)
  ctx.restore()
}

function drawEventLine(ctx: CanvasRenderingContext2D) {
  const text = `${UNIVERSITY} · ${TEMPLATE_DATES}`
  const [cx, cy] = EVENT_SLOT.center
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(RAD)
  ctx.font = `600 ${EVENT_SLOT.fontSize}px Poppins, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#2a1858'
  // Shrink if needed
  let size = EVENT_SLOT.fontSize
  while (size > 14 && ctx.measureText(text).width > EVENT_SLOT.maxWidth) {
    size -= 1
    ctx.font = `600 ${size}px Poppins, sans-serif`
  }
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.decoding = 'async'
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
  return img
}

export async function paintBadge(
  canvas: HTMLCanvasElement,
  state: CardFormState,
  template: HTMLImageElement,
  photoImg: HTMLImageElement | null,
) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  ctx.drawImage(template, 0, 0, CARD_WIDTH, CARD_HEIGHT)

  // Prefer cutout when ready; else original photo (fallback); else silhouette
  const usePhoto =
    state.cutoutStatus === 'ready' && state.cutoutUrl
      ? photoImg
      : state.cutoutStatus === 'fallback' && state.photoUrl
        ? photoImg
        : state.photoUrl && state.cutoutStatus !== 'preparing'
          ? photoImg
          : null

  drawPhotoLayer(ctx, state, usePhoto)
  drawName(ctx, state.name)
  drawEventLine(ctx)
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
