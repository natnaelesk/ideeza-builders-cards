import { clampTransform, coverLayout, COVER_BLEED } from './photoCover'
import { PHOTO_WINDOW } from '../config/badgeGeometry'
import { defaultPhotoTransform } from '../types'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertCover(
  label: string,
  imgW: number,
  imgH: number,
  t: { ox: number; oy: number; zoom: number },
) {
  const layout = coverLayout(imgW, imgH, t)
  const { width: winW, height: winH } = PHOTO_WINDOW
  // Drawn rect must cover window with bleed
  const left = -layout.drawW / 2 + layout.ox
  const top = -layout.drawH / 2 + layout.oy
  const right = left + layout.drawW
  const bottom = top + layout.drawH
  assert(
    left <= -winW / 2 + 0.01,
    `${label}: left gap ${left} vs ${-winW / 2}`,
  )
  assert(
    top <= -winH / 2 + 0.01,
    `${label}: top gap ${top} vs ${-winH / 2}`,
  )
  assert(
    right >= winW / 2 - 0.01,
    `${label}: right gap ${right} vs ${winW / 2}`,
  )
  assert(
    bottom >= winH / 2 - 0.01,
    `${label}: bottom gap ${bottom} vs ${winH / 2}`,
  )
  assert(layout.drawW >= winW + COVER_BLEED * 2 - 0.01, `${label}: width bleed`)
  assert(layout.drawH >= winH + COVER_BLEED * 2 - 0.01, `${label}: height bleed`)
}

const cases: Array<[string, number, number]> = [
  ['wide-4000x3000', 4000, 3000],
  ['wide-3000x1200', 3000, 1200],
  ['tall-1200x2400', 1200, 2400],
  ['tiny-80x60', 80, 60],
  ['square', 500, 500],
]

for (const [label, w, h] of cases) {
  assertCover(label, w, h, defaultPhotoTransform())
  assertCover(`${label}@2x`, w, h, { ox: 0, oy: 0, zoom: 2 })
  assertCover(`${label}@4x-shift`, w, h, { ox: 9999, oy: -9999, zoom: 4 })
  const clamped = clampTransform({ ox: 9999, oy: -9999, zoom: 3 }, w, h)
  assertCover(`${label}-clamped`, w, h, clamped)
}

console.log('photoCover.test.ts: ok')
