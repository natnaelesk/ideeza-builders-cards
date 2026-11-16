import { BADGE_TILT_DEG, PHOTO_WINDOW } from '../config/badgeGeometry'
import { CARD_HEIGHT, CARD_WIDTH } from '../config/event'

const RAD = (BADGE_TILT_DEG * Math.PI) / 180
const COS = Math.cos(RAD)
const SIN = Math.sin(RAD)

/** Card-space → window-local (centered, unrotated). */
export function cardToWindowLocal(cardX: number, cardY: number) {
  const [cx, cy] = PHOTO_WINDOW.center
  const dx = cardX - cx
  const dy = cardY - cy
  // Inverse of rotate(+RAD): rotate by -RAD
  return {
    lx: dx * COS + dy * SIN,
    ly: -dx * SIN + dy * COS,
  }
}

/** Window-local → card-space. */
export function windowLocalToCard(lx: number, ly: number) {
  const [cx, cy] = PHOTO_WINDOW.center
  return {
    x: cx + lx * COS - ly * SIN,
    y: cy + lx * SIN + ly * COS,
  }
}

/**
 * Map a viewport client point into card coordinates for the mobile/desktop
 * preview scale wrappers used in App.
 *
 * Mobile: scale origin = top center of the 1080×1440 card
 * Desktop: scale origin = top left
 */
export function clientToCard(
  clientX: number,
  clientY: number,
  viewport: DOMRect,
  scale: number,
  mode: 'mobile' | 'desktop',
): { x: number; y: number } {
  const localX = clientX - viewport.left
  const localY = clientY - viewport.top
  if (mode === 'mobile') {
    // Card is centered horizontally: left edge at (vw/2 - 540*scale)
    const originX = viewport.width / 2 - (CARD_WIDTH / 2) * scale
    return {
      x: (localX - originX) / scale,
      y: localY / scale,
    }
  }
  return {
    x: localX / scale,
    y: localY / scale,
  }
}

/** Axis-aligned bbox of the rotated photo window in card space (with pad). */
export function photoWindowCardAabb(pad = 8) {
  const { width, height } = PHOTO_WINDOW
  const corners = [
    windowLocalToCard(-width / 2, -height / 2),
    windowLocalToCard(width / 2, -height / 2),
    windowLocalToCard(width / 2, height / 2),
    windowLocalToCard(-width / 2, height / 2),
  ]
  const xs = corners.map((c) => c.x)
  const ys = corners.map((c) => c.y)
  return {
    left: Math.min(...xs) - pad,
    top: Math.min(...ys) - pad,
    right: Math.max(...xs) + pad,
    bottom: Math.max(...ys) + pad,
    width: Math.max(...xs) - Math.min(...xs) + pad * 2,
    height: Math.max(...ys) - Math.min(...ys) + pad * 2,
  }
}

export { CARD_WIDTH, CARD_HEIGHT, PHOTO_WINDOW }
