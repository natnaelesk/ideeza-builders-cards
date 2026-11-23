/**
 * Captures /hackathon UI + a real 1080×1350 PNG export.
 * Expects preview server at http://localhost:4173
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE = process.env.APP_URL || 'http://localhost:4173'
const OUT = '/opt/cursor/artifacts'
const FIXTURES = path.resolve('scripts/fixtures')

fs.mkdirSync(OUT, { recursive: true })

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

const browser = await chromium.launch()

{
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 1600 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/hackathon`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.hk-card')
  await page.evaluate(() => document.fonts.ready)

  await page.locator('.app__form input').nth(0).fill('Hana Tadesse')
  await page
    .locator('.app__form input')
    .nth(1)
    .fill('SoilSense — moisture intel for small farms')

  const photoInput = page.locator('input[type="file"]').first()
  await photoInput.setInputFiles(path.join(FIXTURES, 'sample-photo.png'))
  await page.waitForTimeout(800)
  await page.evaluate(() => document.fonts.ready)

  await page.screenshot({
    path: path.join(OUT, 'hackathon-generator-page.png'),
    fullPage: true,
    type: 'png',
  })
  await page.locator('.app__preview').screenshot({
    path: path.join(OUT, 'hackathon-preview.png'),
    type: 'png',
  })

  // Placeholder (no photo) export reference — reload clean then fill name only
  await page.goto(`${BASE}/hackathon`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.hk-card')
  await page.locator('.app__form input').nth(0).fill('Your Name')
  await page.waitForTimeout(400)
  await page.locator('.hk-card').screenshot({
    path: path.join(OUT, 'hackathon-card-placeholder-preview.png'),
    type: 'png',
  })

  // Filled card again for export
  await page.goto(`${BASE}/hackathon`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.hk-card')
  await page.locator('.app__form input').nth(0).fill('Hana Tadesse')
  await page
    .locator('.app__form input')
    .nth(1)
    .fill('SoilSense — moisture intel for small farms')
  await photoInput.setInputFiles(path.join(FIXTURES, 'sample-photo.png'))
  await page.waitForTimeout(800)
  await page.evaluate(() => document.fonts.ready)

  const downloadBtn = page.getByRole('button', { name: 'Download PNG' })
  await page.waitForFunction(() => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Download PNG'),
    )
    return btn && !btn.disabled
  })

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    downloadBtn.click(),
  ])
  const outPath = path.join(OUT, 'hackathon-exported-card.png')
  await download.saveAs(outPath)
  const buf = fs.readFileSync(outPath)
  const { w, h } = pngSize(buf)
  console.log(`exported hackathon: ${w}x${h} (${buf.length} bytes)`)
  if (w !== 1080 || h !== 1350) {
    console.error('BAD SIZE for hackathon export')
    process.exitCode = 1
  }

  // Mobile UI
  await ctx.close()
}

{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/hackathon`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.hk-card')
  await page.locator('.app__form input').nth(0).fill('Hana Tadesse')
  await page
    .locator('.app__form input')
    .nth(1)
    .fill('SoilSense — moisture intel')
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles(path.join(FIXTURES, 'sample-photo.png'))
  await page.waitForTimeout(600)
  await page.screenshot({
    path: path.join(OUT, 'hackathon-mobile-ui.png'),
    fullPage: true,
    type: 'png',
  })
  await ctx.close()
}

await browser.close()
console.log('hackathon capture done')
