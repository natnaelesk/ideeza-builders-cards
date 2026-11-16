import {
  BADGE_TILT_DEG,
  EVENT_SLOT,
  NAME_SLOT,
  PHOTO_WINDOW,
  TEMPLATE_DATES,
} from '../config/badgeGeometry'
import { CARD_HEIGHT, CARD_WIDTH, UNIVERSITY } from '../config/event'
import { coverLayout } from './photoCover'
import type { CardFormState } from '../types'

export const BADGE_TILT_RAD = (BADGE_TILT_DEG * Math.PI) / 180

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

/**
 * Draw in the badge window's de-rotated frame:
 * translate → rotate → clip rounded rect → fill backdrop → cover-fit photo.
 * Backdrop fill guarantees no black/transparent gaps at any edge.
 */
function drawPhotoLayer(
  ctx: CanvasRenderingContext2D,
  state: CardFormState,
  photoImg: HTMLImageElement | ImageBitmap | null,
) {
  const { center, width, height, radius } = PHOTO_WINDOW
  const [cx, cy] = center

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(BADGE_TILT_RAD)

  roundRectPath(ctx, -width / 2, -height / 2, width, height, radius)
  ctx.clip()

  // Always paint a light backdrop first — never let canvas default/black show.
  const grad = ctx.createLinearGradient(0, -height / 2, 0, height / 2)
  grad.addColorStop(0, '#ece8f2')
  grad.addColorStop(1, '#d9d4e3')
  ctx.fillStyle = grad
  ctx.fillRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4)

  if (photoImg) {
    const sw =
      'naturalWidth' in photoImg && photoImg.naturalWidth
        ? photoImg.naturalWidth
        : photoImg.width
    const sh =
      'naturalHeight' in photoImg && photoImg.naturalHeight
        ? photoImg.naturalHeight
        : photoImg.height
    const { drawW, drawH, ox, oy } = coverLayout(sw, sh, state.photoTransform)
    ctx.drawImage(
      photoImg,
      0,
      0,
      sw,
      sh,
      -drawW / 2 + ox,
      -drawH / 2 + oy,
      drawW,
      drawH,
    )
  } else {
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
  ctx.rotate(BADGE_TILT_RAD)
  const size = fitText(ctx, label, NAME_SLOT.maxWidth, NAME_SLOT.fontSize, 28)
  ctx.font = `400 ${size}px Anton, "Arial Narrow", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(45, 15, 90, 0.38)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 3
  ctx.fillStyle = '#f7f5ff'
  ctx.fillText(label, 0, 0)
  ctx.shadowColor = 'rgba(255, 255, 255, 0.45)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  ctx.fillStyle = '#fbfaff'
  ctx.fillText(label, 0, 0)
  ctx.restore()
}

function drawEventLine(ctx: CanvasRenderingContext2D) {
  const text = `${UNIVERSITY} · ${TEMPLATE_DATES}`
  const [cx, cy] = EVENT_SLOT.center
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(BADGE_TILT_RAD)
  ctx.font = `600 ${EVENT_SLOT.fontSize}px Poppins, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#2a1858'
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

  // Opaque clear — never leave transparent→black seams
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#fbfaff'
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  ctx.restore()

  ctx.drawImage(template, 0, 0, CARD_WIDTH, CARD_HEIGHT)
  drawPhotoLayer(ctx, state, photoImg)
  drawName(ctx, state.name)
  drawEventLine(ctx)
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
