import { CARD_HEIGHT, CARD_WIDTH } from '../config/event'

/** Instagram Stories canvas */
export const STORY_WIDTH = 1080
export const STORY_HEIGHT = 1920

/**
 * Instagram feed/post: keep the full badge at 1080×1440.
 * (A 1080×1350 crop would clip the tilted badge chrome; full card reads cleaner.)
 */
export const POST_WIDTH = CARD_WIDTH
export const POST_HEIGHT = CARD_HEIGHT

/** Soft lavender → holographic tones sampled from the badge template. */
function paintStoryBackdrop(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT)
  g.addColorStop(0, '#6d4db8')
  g.addColorStop(0.28, '#9b7ad4')
  g.addColorStop(0.55, '#c4b0ea')
  g.addColorStop(0.78, '#b29ae0')
  g.addColorStop(1, '#7a5bc4')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  // Soft holographic sheen
  const sheen = ctx.createRadialGradient(
    STORY_WIDTH * 0.7,
    STORY_HEIGHT * 0.18,
    40,
    STORY_WIDTH * 0.55,
    STORY_HEIGHT * 0.35,
    STORY_WIDTH * 0.85,
  )
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.28)')
  sheen.addColorStop(0.45, 'rgba(200, 240, 255, 0.12)')
  sheen.addColorStop(1, 'rgba(255, 180, 240, 0.06)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

  const bottom = ctx.createRadialGradient(
    STORY_WIDTH * 0.3,
    STORY_HEIGHT * 0.85,
    20,
    STORY_WIDTH * 0.4,
    STORY_HEIGHT * 0.9,
    STORY_WIDTH * 0.7,
  )
  bottom.addColorStop(0, 'rgba(255, 200, 255, 0.18)')
  bottom.addColorStop(1, 'rgba(90, 50, 160, 0)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)
}

/**
 * Wrap the rendered 1080×1440 card on a 1080×1920 Stories canvas,
 * centered with comfortable margins on a matching lavender backdrop.
 */
export function renderStoryFromCard(
  cardCanvas: HTMLCanvasElement,
): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = STORY_WIDTH
  out.height = STORY_HEIGHT
  const ctx = out.getContext('2d')
  if (!ctx) return out

  paintStoryBackdrop(ctx)

  const marginX = 56
  const marginY = 120
  const maxW = STORY_WIDTH - marginX * 2
  const maxH = STORY_HEIGHT - marginY * 2
  const scale = Math.min(maxW / CARD_WIDTH, maxH / CARD_HEIGHT)
  const drawW = CARD_WIDTH * scale
  const drawH = CARD_HEIGHT * scale
  const x = (STORY_WIDTH - drawW) / 2
  const y = (STORY_HEIGHT - drawH) / 2

  // Soft shadow under the card
  ctx.save()
  ctx.shadowColor = 'rgba(40, 15, 90, 0.35)'
  ctx.shadowBlur = 48
  ctx.shadowOffsetY = 18
  ctx.drawImage(cardCanvas, x, y, drawW, drawH)
  ctx.restore()

  return out
}

/** Instagram Post = full badge PNG (1080×1440). */
export function renderPostFromCard(
  cardCanvas: HTMLCanvasElement,
): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = POST_WIDTH
  out.height = POST_HEIGHT
  const ctx = out.getContext('2d')
  if (!ctx) return out
  ctx.fillStyle = '#fbfaff'
  ctx.fillRect(0, 0, POST_WIDTH, POST_HEIGHT)
  ctx.drawImage(cardCanvas, 0, 0)
  return out
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}
