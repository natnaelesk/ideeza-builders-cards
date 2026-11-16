import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO = '/tmp/sample-portrait.jpg'

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
})

async function shotPreview(name) {
  const viewport = page.locator('.app__preview-viewport')
  await viewport.waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
  await viewport.screenshot({
    path: path.join(OUT, name),
    type: 'png',
  })
  console.log('saved', name)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(async () => {
  await document.fonts.ready
  await document.fonts.load('italic 900 72px Montserrat')
})
await page.waitForTimeout(1000)

// No photo
await page.getByLabel('Your name').fill('Hana Tadesse')
await page.waitForTimeout(400)
await shotPreview('hero-no-photo-card.png')

// With realistic photo
await page.locator('input[type="file"]').setInputFiles(PHOTO)
await page.waitForTimeout(800)
await shotPreview('hero-with-photo-card.png')

// Mobile 375px
await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(700)
await page.screenshot({
  path: path.join(OUT, 'hero-mobile-375.png'),
  fullPage: true,
  type: 'png',
})
console.log('saved hero-mobile-375.png')

const overflow = await page.evaluate(() => {
  const doc = document.documentElement
  return {
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }
})
console.log('overflow check', overflow)
if (overflow.scrollWidth > overflow.clientWidth + 1) {
  console.warn('WARNING: horizontal overflow at 375px')
} else {
  console.log('✓ no horizontal overflow at 375px')
}

await browser.close()
