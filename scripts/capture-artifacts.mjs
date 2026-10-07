/**
 * Captures mobile UI screenshots + real 1080×1350 PNG downloads for each role.
 * Expects preview server at http://localhost:4173
 */
import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE = process.env.APP_URL || 'http://localhost:4173'
const OUT = '/opt/cursor/artifacts'
const FIXTURES = path.resolve('scripts/fixtures')

const ROLES = [
  {
    id: 'builder',
    name: 'Hana Tadesse',
    sub: 'SoilSense — moisture intel for small farms',
  },
  {
    id: 'mentor',
    name: 'Sara Bekele',
    sub: 'Hardware Lead, Acme Labs',
  },
  {
    id: 'judge',
    name: 'Meron Alemu',
    sub: 'Partner, Addis Ventures',
  },
]

fs.mkdirSync(OUT, { recursive: true })

async function fillForm(page, role) {
  await page
    .getByRole('button', {
      name: role.id.charAt(0).toUpperCase() + role.id.slice(1),
    })
    .click()
  await page.locator('.app__form input').nth(0).fill(role.name)
  await page.locator('.app__form input').nth(1).fill(role.sub)

  const photoInput = page.locator('input[type="file"]').nth(0)
  const badgeInput = page.locator('input[type="file"]').nth(1)
  // Clear first so role switches re-fire change with the same fixture path
  await photoInput.setInputFiles([])
  await badgeInput.setInputFiles([])
  await photoInput.setInputFiles(path.join(FIXTURES, 'sample-photo.png'))
  await badgeInput.setInputFiles(path.join(FIXTURES, 'sample-badge.png'))

  await page.waitForTimeout(600)
  await page.evaluate(() => document.fonts.ready)
}

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

const browser = await chromium.launch()

// --- Mobile UI ---
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.share-card')
  await page.evaluate(() => document.fonts.ready)

  for (const role of ROLES) {
    await fillForm(page, role)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
      path: path.join(OUT, `mobile-ui-${role.id}.png`),
      fullPage: true,
      type: 'png',
    })
    await page.locator('.app__preview').scrollIntoViewIfNeeded()
    await page.locator('.app__preview').screenshot({
      path: path.join(OUT, `mobile-preview-${role.id}.png`),
      type: 'png',
    })
    console.log('mobile ui', role.id)
  }
  await ctx.close()
}

// --- Real PNG downloads via Download button ---
{
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 1600 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.share-card')
  await page.evaluate(() => document.fonts.ready)

  for (const role of ROLES) {
    await fillForm(page, role)
    const downloadBtn = page.getByRole('button', { name: 'Download PNG' })
    await downloadBtn.waitFor({ state: 'visible' })
    // Wait until fonts ready disables the button
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
    const outPath = path.join(OUT, `exported-card-${role.id}.png`)
    await download.saveAs(outPath)
    const buf = fs.readFileSync(outPath)
    const { w, h } = pngSize(buf)
    console.log(`exported ${role.id}: ${w}x${h} (${buf.length} bytes)`)
    if (w !== 1080 || h !== 1350) {
      console.error(`BAD SIZE for ${role.id}`)
      process.exitCode = 1
    }
  }
  await ctx.close()
}

await browser.close()
