/** Wait until Montserrat / Poppins are ready for crisp export. */
export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.load('italic 900 72px Montserrat')
    await document.fonts.load('italic 800 40px Montserrat')
    await document.fonts.load('italic 700 20px Montserrat')
    await document.fonts.load('700 32px Poppins')
    await document.fonts.load('600 20px Poppins')
    await document.fonts.load('500 18px Poppins')
    await document.fonts.ready
  } catch {
    // Fonts may already be cached; continue.
  }
}
