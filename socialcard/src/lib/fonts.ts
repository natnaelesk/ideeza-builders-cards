/** Wait until Poppins (incl. italic) is ready for crisp export. */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.load('900 64px Poppins')
    await document.fonts.load('italic 900 64px Poppins')
    await document.fonts.load('800 42px Poppins')
    await document.fonts.load('700 28px Poppins')
    await document.fonts.load('500 22px Poppins')
    await document.fonts.ready
  } catch {
    // Fonts may already be cached; continue.
  }
}
