import { canvasToPngDataUrl } from './drawBadge'

export async function renderCardPng(canvas: HTMLCanvasElement): Promise<string> {
  // Ensure fonts are painted
  if (document.fonts?.ready) await document.fonts.ready
  return canvasToPngDataUrl(canvas)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function dataUrlToFile(
  dataUrl: string,
  filename: string,
): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: 'image/png' })
}

export function canShareFiles(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'
    )
  } catch {
    return false
  }
}

export async function shareCardFile(
  file: File,
  title: string,
): Promise<boolean> {
  if (!canShareFiles()) return false
  const data = { files: [file], title, text: title }
  if (!navigator.canShare?.(data)) return false
  await navigator.share(data)
  return true
}
