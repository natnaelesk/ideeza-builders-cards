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
