/**
 * Self-hosted Poppins faces for share cards + PNG export.
 * We inline every weight as a data-URL @font-face so html-to-image's
 * SVG foreignObject never falls back to Arial for small text.
 */

const POPPINS_FACES: ReadonlyArray<{ weight: number; path: string }> = [
  { weight: 200, path: '/fonts/Poppins-ExtraLight.woff2' },
  { weight: 300, path: '/fonts/Poppins-Light.woff2' },
  { weight: 400, path: '/fonts/Poppins-Regular.woff2' },
  { weight: 500, path: '/fonts/Poppins-Medium.woff2' },
  { weight: 600, path: '/fonts/Poppins-SemiBold.woff2' },
  { weight: 700, path: '/fonts/Poppins-Bold.woff2' },
  { weight: 800, path: '/fonts/Poppins-ExtraBold.woff2' },
  { weight: 900, path: '/fonts/Poppins-Black.woff2' },
]

/** Anton is used for the display type on the Virtual Hackathon holo card. */
const ANTON_PATH = '/fonts/Anton-Regular.woff2'

const POPPINS_LOADS = [
  ...POPPINS_FACES.map((f) => `${f.weight} 48px Poppins`),
  '400 48px Anton',
] as readonly string[]

let cachedEmbedCss: string | null = null
let embedCssPromise: Promise<string> | null = null

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Build complete Poppins @font-face CSS with inlined woff2 data URLs. */
export async function getPoppinsEmbedCss(): Promise<string> {
  if (cachedEmbedCss) return cachedEmbedCss
  if (!embedCssPromise) {
    embedCssPromise = (async () => {
      const parts: string[] = []
      for (const face of POPPINS_FACES) {
        const res = await fetch(face.path)
        if (!res.ok) {
          throw new Error(`Failed to load font ${face.path}: ${res.status}`)
        }
        const b64 = bufferToBase64(await res.arrayBuffer())
        // application/font-woff2 is what Chromium accepts inside foreignObject.
        parts.push(
          `@font-face{font-family:'Poppins';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:${face.weight};font-style:normal;font-display:block;}`,
        )
      }
      const antonRes = await fetch(ANTON_PATH)
      if (!antonRes.ok) {
        throw new Error(`Failed to load font ${ANTON_PATH}: ${antonRes.status}`)
      }
      const antonB64 = bufferToBase64(await antonRes.arrayBuffer())
      parts.push(
        `@font-face{font-family:'Anton';src:url(data:font/woff2;base64,${antonB64}) format('woff2');font-weight:400;font-style:normal;font-display:block;}`,
      )
      // Force every node in the card (and builders cards) to use Poppins,
      // except the hackathon card's Anton display type.
      parts.push(
        `.hk-card,.hk-card *,.share-card,.share-card *{font-family:Poppins,sans-serif!important;}`,
        `.hk-card .hk-anton,.hk-card .hk-anton *{font-family:Anton,Poppins,sans-serif!important;}`,
      )
      cachedEmbedCss = parts.join('')
      return cachedEmbedCss
    })().catch((err) => {
      embedCssPromise = null
      throw err
    })
  }
  return embedCssPromise
}

/** Wait until all Poppins weights are ready for crisp export. */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    void getPoppinsEmbedCss().catch(() => {})
    await Promise.all([
      ...POPPINS_LOADS.map((spec) => document.fonts.load(spec)),
      // Also warm common text sizes used on the hackathon card.
      document.fonts.load('400 100px Anton'),
      document.fonts.load('200 150px Poppins'),
      document.fonts.load('600 32px Poppins'),
      document.fonts.load('700 18px Poppins'),
      document.fonts.load('300 17px Poppins'),
      document.fonts.load('400 17px Poppins'),
      document.fonts.load('400 20px Poppins'),
      document.fonts.load('500 14px Poppins'),
      document.fonts.load('500 17px Poppins'),
      document.fonts.load('500 20px Poppins'),
      document.fonts.load('600 15px Poppins'),
      document.fonts.load('600 19px Poppins'),
      document.fonts.load('700 15px Poppins'),
      document.fonts.load('700 16px Poppins'),
      document.fonts.load('700 20px Poppins'),
      document.fonts.load('700 24px Poppins'),
      document.fonts.load('800 20px Poppins'),
      document.fonts.load('800 40px Poppins'),
      document.fonts.load('900 88px Poppins'),
      document.fonts.load('200 58px Poppins'),
      document.fonts.load('300 48px Poppins'),
      document.fonts.ready,
    ])
  } catch {
    // Fonts may already be cached; continue.
  }
}
