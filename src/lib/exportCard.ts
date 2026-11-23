import { getFontEmbedCSS, toPng } from 'html-to-image'
import { CARD_HEIGHT, CARD_WIDTH } from '../config/cardLayout'
import { waitForFonts } from './fonts'

let cachedFontEmbedCSS: string | null = null

async function resolveFontEmbedCSS(node: HTMLElement): Promise<string> {
  if (cachedFontEmbedCSS) return cachedFontEmbedCSS
  try {
    // Library walks document stylesheets (incl. /fonts/fonts.css) and inlines
    // same-origin woff2 as data URLs — required for SVG foreignObject capture.
    cachedFontEmbedCSS = await getFontEmbedCSS(node)
    return cachedFontEmbedCSS
  } catch (err) {
    console.warn('getFontEmbedCSS failed; export may use fallback fonts', err)
    return ''
  }
}

export async function renderCardPng(node: HTMLElement): Promise<string> {
  await waitForFonts()
  const fontEmbedCSS = await resolveFontEmbedCSS(node)

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
