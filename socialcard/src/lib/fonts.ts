/** Wait until Montserrat / Poppins are ready for crisp export. */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.load('italic 900 56px Montserrat')
    await document.fonts.load('italic 800 34px Montserrat')
    await document.fonts.load('italic 700 20px Montserrat')
    await document.fonts.load('900 48px Poppins')
    await document.fonts.load('800 34px Poppins')
    await document.fonts.load('700 24px Poppins')
    await document.fonts.load('500 20px Poppins')
    await document.fonts.ready
  } catch {
    // Fonts may already be cached; continue.
  }
}
