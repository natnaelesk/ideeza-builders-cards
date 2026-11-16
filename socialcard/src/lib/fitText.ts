/**
 * Shrink font-size until the element's scrollWidth fits its clientWidth.
 * Returns the size used (or max if already fitting / element missing).
 */
export function fitFontSize(
  el: HTMLElement | null,
  maxPx: number,
  minPx: number,
): number {
  if (!el) return maxPx
  let size = maxPx
  el.style.fontSize = `${size}px`
  while (size > minPx && el.scrollWidth > el.clientWidth + 1) {
    size -= 2
    el.style.fontSize = `${size}px`
  }
  return size
}

/**
 * Fit a name into one line if possible; otherwise allow two lines and shrink
 * until scrollHeight fits ~2× line height.
 */
export function fitNameFontSize(
  el: HTMLElement | null,
  maxPx: number,
  minPx: number,
): { size: number; multiline: boolean } {
  if (!el) return { size: maxPx, multiline: false }

  el.style.whiteSpace = 'nowrap'
  el.style.fontSize = `${maxPx}px`
  if (el.scrollWidth <= el.clientWidth + 1) {
    return { size: maxPx, multiline: false }
  }

  let size = maxPx
  while (size > minPx && el.scrollWidth > el.clientWidth + 1) {
    size -= 2
    el.style.fontSize = `${size}px`
  }
  if (el.scrollWidth <= el.clientWidth + 1) {
    return { size, multiline: false }
  }

  // Two-line wrap
  el.style.whiteSpace = 'normal'
  size = Math.min(maxPx, Math.round(maxPx * 0.82))
  el.style.fontSize = `${size}px`
  const maxHeight = size * 2.15
  while (size > minPx && el.scrollHeight > maxHeight + 2) {
    size -= 2
    el.style.fontSize = `${size}px`
  }
  return { size, multiline: true }
}
