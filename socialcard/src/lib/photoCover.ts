import { PHOTO_WINDOW } from '../config/badgeGeometry'
import type { PhotoTransform } from '../types'

/** Extra px so antialias/clip never reveals a gap. */
export const COVER_BLEED = 3

export type CoverLayout = {
  drawW: number
  drawH: number
  ox: number
  oy: number
  maxOx: number
  maxOy: number
  zoom: number
}

export function coverLayout(
  imgW: number,
  imgH: number,
  t: PhotoTransform,
  winW = PHOTO_WINDOW.width,
  winH = PHOTO_WINDOW.height,
  bleed = COVER_BLEED,
): CoverLayout {
  const targetW = winW + bleed * 2
  const targetH = winH + bleed * 2
  const base = Math.max(targetW / Math.max(1, imgW), targetH / Math.max(1, imgH))
  const zoom = Math.max(1, t.zoom)
  const drawW = imgW * base * zoom
  const drawH = imgH * base * zoom
  const maxOx = Math.max(0, (drawW - winW) / 2)
  const maxOy = Math.max(0, (drawH - winH) / 2)
  const ox = clamp(t.ox, -maxOx, maxOx)
  const oy = clamp(t.oy, -maxOy, maxOy)
  return { drawW, drawH, ox, oy, maxOx, maxOy, zoom }
}

export function clampTransform(
  t: PhotoTransform,
  imgW: number,
  imgH: number,
): PhotoTransform {
  const layout = coverLayout(imgW, imgH, t)
  return {
    ox: layout.ox,
    oy: layout.oy,
    zoom: layout.zoom,
  }
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * Soft edge resistance for live gestures: past the hard max, only a fraction
 * of the delta applies, then hard-clamp so the window stays fully covered.
 * No snap — the value never leaves the fillable range.
 */
export function resistAxis(current: number, delta: number, max: number): number {
  if (max <= 0) return 0
  const next = current + delta
  if (Math.abs(next) <= max) return next
  // Approaching / past the edge: damp the outbound component
  const sign = Math.sign(next) || 1
  const outbound = next - sign * max
  const resisted = sign * max + outbound * 0.18
  return clamp(resisted, -max, max)
}

export function liveClampTransform(
  t: PhotoTransform,
  imgW: number,
  imgH: number,
  prev?: PhotoTransform,
): PhotoTransform {
  const zoom = clamp(t.zoom, 1, 4)
  const layout = coverLayout(imgW, imgH, { ...t, zoom })
  if (!prev) {
    return { ox: layout.ox, oy: layout.oy, zoom: layout.zoom }
  }
  const dOx = t.ox - prev.ox
  const dOy = t.oy - prev.oy
  return {
    ox: resistAxis(prev.ox, dOx, layout.maxOx),
    oy: resistAxis(prev.oy, dOy, layout.maxOy),
    zoom: layout.zoom,
  }
}

/** Window-local point → is inside the (axis-aligned) photo window. */
export function inPhotoWindowLocal(lx: number, ly: number, pad = 0): boolean {
  const { width, height } = PHOTO_WINDOW
  return (
    Math.abs(lx) <= width / 2 + pad && Math.abs(ly) <= height / 2 + pad
  )
}
