import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO = '/tmp/sample-photo.jpg'

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
})

async function fillSample() {
  await page.getByLabel('Your name').fill('Hana Tadesse')
  await page.getByLabel(/Project name/).fill('SoilSense')
  await page.getByLabel(/One-line pitch/).fill('Moisture intel for small farms')
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  // give fonts/images a moment
  await page.waitForTimeout(800)
}

async function clickDay(label) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).click()
  await page.waitForTimeout(400)
}

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
await page.waitForTimeout(1000)
await fillSample()

await clickDay('Day 1')
await shotPreview('wolkite-day1-card.png')

await clickDay('Day 2')
await shotPreview('wolkite-day2-card.png')

await clickDay('Day 3')
await shotPreview('wolkite-day3-card.png')

// Mobile page shot at 375px
await page.setViewportSize({ width: 375, height: 812 })
await page.waitForTimeout(600)
await page.screenshot({
  path: path.join(OUT, 'wolkite-mobile-375.png'),
  fullPage: true,
  type: 'png',
})
console.log('saved wolkite-mobile-375.png')

// Check no horizontal overflow at 375
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
