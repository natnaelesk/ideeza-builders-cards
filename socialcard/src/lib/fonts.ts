export async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await document.fonts.load('400 64px Anton')
    await document.fonts.load('600 22px Poppins')
    await document.fonts.load('700 20px Poppins')
    await document.fonts.ready
  } catch {
    // continue
  }
}
