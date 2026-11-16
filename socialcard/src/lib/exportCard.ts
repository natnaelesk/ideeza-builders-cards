import { toPng } from 'html-to-image'
import { CARD_HEIGHT, CARD_WIDTH } from '../config/cardLayout'
import { waitForFonts } from './fonts'

export async function renderCardPng(node: HTMLElement): Promise<string> {
  await waitForFonts()
  await toPng(node, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      left: '0',
      top: '0',
    },
  })
  return toPng(node, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      left: '0',
      top: '0',
    },
  })
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
