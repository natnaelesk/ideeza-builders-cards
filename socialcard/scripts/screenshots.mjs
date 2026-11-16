import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO = process.env.BADGE_PHOTO || '/tmp/sample-portrait.jpg'

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true })

async function exportPng(page, name) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120_000 }),
    page.getByRole('button', { name: /Download PNG/i }).click(),
  ])
  await download.saveAs(path.join(OUT, name))
  console.log('exported', name)
}

// Mobile empty
{
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
    await document.fonts.load('400 64px Anton')
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'mobile-375-empty.png'), fullPage: false })
  console.log('saved mobile-375-empty.png')

  // Typing state (focus name — approximates keyboard open via vv)
  await page.getByPlaceholder('Hana Tadesse').fill('Hana')
  await page.getByPlaceholder('Hana Tadesse').focus()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(OUT, 'mobile-375-typing.png'), fullPage: false })
  console.log('saved mobile-375-typing.png')

  await page.getByPlaceholder('Hana Tadesse').fill('Hana Tadesse')
  await page.getByRole('button', { name: /Pick photo|Change photo/i }).click()
  // Use file chooser via input
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT, 'mobile-375-photo.png'), fullPage: false })
  console.log('saved mobile-375-photo.png')
  await exportPng(page, 'export-with-photo.png')
  await context.close()
}

// Desktop
{
  const context = await browser.newContext({ acceptDownloads: true })
  const page = await context.newPage()
  await page.setViewportSize({ width: 1280, height: 900 })
  page.setDefaultTimeout(120_000)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
    await document.fonts.load('400 64px Anton')
  })
  await page.getByPlaceholder('Hana Tadesse').fill('Hana Tadesse')
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT, 'desktop-1280.png'), fullPage: true })
  console.log('saved desktop-1280.png')
  await context.close()
}

await browser.close()
console.log('done')
