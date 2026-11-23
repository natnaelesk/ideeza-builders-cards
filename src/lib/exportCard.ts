import { toPng } from 'html-to-image'
import { CARD_HEIGHT, CARD_WIDTH } from '../config/cardLayout'
import { getPoppinsEmbedCss, waitForFonts } from './fonts'

export async function renderCardPng(node: HTMLElement): Promise<string> {
  await waitForFonts()
  let fontEmbedCSS = ''
  try {
    fontEmbedCSS = await getPoppinsEmbedCss()
  } catch (err) {
    console.warn('Poppins embed CSS unavailable; export may use fallback fonts', err)
  }

  // Inject inlined @font-face into the live card so the clone inherits it
  // even if foreignObject embedding is flaky for small text sizes.
  const styleId = 'ideeza-poppins-embed'
  let injected = document.getElementById(styleId) as HTMLStyleElement | null
  if (fontEmbedCSS) {
    if (!injected) {
      injected = document.createElement('style')
      injected.id = styleId
      document.head.appendChild(injected)
    }
    injected.textContent = fontEmbedCSS
  }

  const opts = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    fontEmbedCSS,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      left: '0',
      top: '0',
      fontFamily: 'Poppins, sans-serif',
    },
  }

  // Double-pass: first warm up layout/images/fonts, second is the crisp capture.
  await toPng(node, opts)
  return toPng(node, opts)
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

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
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

export async function shareCardFile(file: File, title: string): Promise<boolean> {
  if (!canShareFiles()) return false
  const data = { files: [file], title, text: title }
  if (!navigator.canShare?.(data)) return false
  await navigator.share(data)
  return true
}
