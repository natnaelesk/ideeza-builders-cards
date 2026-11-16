import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO = process.env.BADGE_PHOTO || '/tmp/sample-portrait.jpg'

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ acceptDownloads: true })
const page = await context.newPage()
await page.setViewportSize({ width: 1280, height: 900 })
page.setDefaultTimeout(600_000)

async function waitCutoutReady() {
  await page.waitForFunction(() => {
    const status = document.querySelector('.app__status')?.textContent || ''
    const overlay = document.querySelector('.app__preview-overlay')
    return !overlay && (status.includes('Cover ready') || status.includes('unavailable') || status.includes('overlay'))
  }, { timeout: 600_000 })
  await page.waitForTimeout(600)
}

async function exportPng(name) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120_000 }),
    page.getByRole('button', { name: /Download PNG/i }).click(),
  ])
  await download.saveAs(path.join(OUT, name))
  console.log('exported', name)
}

async function shotPreview(name) {
  await page.locator('.app__preview-viewport').screenshot({ path: path.join(OUT, name), type: 'png' })
  console.log('saved', name)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  await document.fonts.ready
  await document.fonts.load('400 64px Anton')
})
await page.waitForTimeout(800)

await page.getByLabel('Your name').fill('Hana Tadesse')
await page.waitForTimeout(500)
await shotPreview('badge-no-photo-preview.png')
await exportPng('badge-no-photo.png')

await page.locator('input[type="file"]').setInputFiles(PHOTO)
console.log('waiting cutout…')
await waitCutoutReady()
console.log('status', await page.locator('.app__status').textContent())
await page.waitForTimeout(800)
await shotPreview('badge-with-photo-preview.png')
await exportPng('badge-with-photo.png')

await page.setViewportSize({ width: 375, height: 900 })
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(OUT, 'badge-mobile-375.png'), fullPage: true })
console.log('saved badge-mobile-375.png')

const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))
console.log('overflow', overflow)
await browser.close()
