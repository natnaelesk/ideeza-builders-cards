/** Wait until Poppins (and any other document fonts) are ready for crisp export. */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.load('900 104px Poppins')
    await document.fonts.load('800 68px Poppins')
    await document.fonts.load('700 26px Poppins')
    await document.fonts.load('500 22px Poppins')
    await document.fonts.load('200 92px Poppins')
    await document.fonts.ready
  } catch {
    // Fonts may already be cached; continue.
  }
}
