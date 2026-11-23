/**
 * Self-hosted Poppins faces used by share cards.
 * Local /fonts/*.woff2 + fonts.css so html-to-image can embed them
 * (Google Fonts CDN faces often fall back to Arial in SVG foreignObject).
 */

const POPPINS_LOADS = [
  '200 92px Poppins',
  '400 28px Poppins',
  '500 22px Poppins',
  '600 20px Poppins',
  '700 26px Poppins',
  '800 68px Poppins',
  '900 104px Poppins',
] as const

/** Wait until Poppins (and any other document fonts) are ready for crisp export. */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.all([
      ...POPPINS_LOADS.map((spec) => document.fonts.load(spec)),
      document.fonts.ready,
    ])
  } catch {
    // Fonts may already be cached; continue.
  }
}
