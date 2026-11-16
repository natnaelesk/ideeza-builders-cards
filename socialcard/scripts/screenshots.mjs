import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO =
  process.env.BADGE_PHOTO || '/tmp/badge-photos/wide-4000x3000.jpg'

await mkdir(OUT, { recursive: true })

async function dataUrlToFile(dataUrl, filePath) {
  const b64 = dataUrl.split(',')[1]
  await writeFile(filePath, Buffer.from(b64, 'base64'))
}

async function waitPaint(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await document.fonts.load('400 64px Anton')
    await document.fonts.load('600 28px Poppins')
  })
  await page.waitForTimeout(500)
}

async function loadCard(page, { name = 'Natnael Eskinder', photo = PHOTO } = {}) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await waitPaint(page)
  const nameInput = page.getByPlaceholder('Hana Tadesse')
  await nameInput.fill(name)
  await nameInput.blur()
  await page.locator('input[type="file"]').setInputFiles(photo)
  await page.waitForTimeout(900)
  await page.waitForFunction(() => Boolean(window.__badgeDebug?.getCardCanvas?.()))
  // Ensure keyboard collapse class is cleared for normal panel shots
  await page.evaluate(() => {
    document.activeElement?.blur?.()
    document.querySelector('.app')?.classList.remove('app--keyboard')
    document.querySelector('.app')?.style.setProperty('--vv-bottom', '0px')
  })
  await page.waitForTimeout(200)
}

const browser = await chromium.launch({ headless: true })

// ——— Mobile 375: wide photo default fit ———
{
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  await loadCard(page)
  await page.screenshot({
    path: path.join(OUT, 'mobile-375-wide-photo.png'),
    fullPage: false,
  })
  console.log('saved mobile-375-wide-photo.png')

  await page.screenshot({
    path: path.join(OUT, 'mobile-375-panel.png'),
    fullPage: false,
  })
  console.log('saved mobile-375-panel.png')

  // Move + zoom via debug API (same clamp/cover path as gestures)
  await page.evaluate(() => {
    window.__badgeDebug.setTransform({ ox: 48, oy: -36, zoom: 2.15 })
  })
  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(OUT, 'mobile-375-moved-zoomed.png'),
    fullPage: false,
  })
  console.log('saved mobile-375-moved-zoomed.png')

  // Export matching that state
  const exportUrl = await page.evaluate(async () => {
    const canvas = window.__badgeDebug.getCardCanvas()
    return canvas.toDataURL('image/png')
  })
  await dataUrlToFile(exportUrl, path.join(OUT, 'export-moved-zoomed.png'))
  console.log('saved export-moved-zoomed.png')

  // Instagram sheet
  const igBtn = page.locator('button.btn--ig')
  await igBtn.scrollIntoViewIfNeeded()
  await igBtn.click({ force: true })
  await page.waitForTimeout(350)
  await page.screenshot({
    path: path.join(OUT, 'mobile-375-instagram-sheet.png'),
    fullPage: false,
  })
  console.log('saved mobile-375-instagram-sheet.png')

  // Story + Post exports from current card canvas
  const formats = await page.evaluate(async () => {
    const card = window.__badgeDebug.getCardCanvas()
    const STORY_W = 1080
    const STORY_H = 1920
    const story = document.createElement('canvas')
    story.width = STORY_W
    story.height = STORY_H
    const sctx = story.getContext('2d')
    const g = sctx.createLinearGradient(0, 0, STORY_W, STORY_H)
    g.addColorStop(0, '#6d4db8')
    g.addColorStop(0.28, '#9b7ad4')
    g.addColorStop(0.55, '#c4b0ea')
    g.addColorStop(0.78, '#b29ae0')
    g.addColorStop(1, '#7a5bc4')
    sctx.fillStyle = g
    sctx.fillRect(0, 0, STORY_W, STORY_H)
    const marginX = 56
    const marginY = 120
    const maxW = STORY_W - marginX * 2
    const maxH = STORY_H - marginY * 2
    const scale = Math.min(maxW / 1080, maxH / 1440)
    const drawW = 1080 * scale
    const drawH = 1440 * scale
    const x = (STORY_W - drawW) / 2
    const y = (STORY_H - drawH) / 2
    sctx.shadowColor = 'rgba(40, 15, 90, 0.35)'
    sctx.shadowBlur = 48
    sctx.shadowOffsetY = 18
    sctx.drawImage(card, x, y, drawW, drawH)

    const post = document.createElement('canvas')
    post.width = 1080
    post.height = 1440
    const pctx = post.getContext('2d')
    pctx.fillStyle = '#fbfaff'
    pctx.fillRect(0, 0, 1080, 1440)
    pctx.drawImage(card, 0, 0)

    return {
      story: story.toDataURL('image/png'),
      post: post.toDataURL('image/png'),
    }
  })
  await dataUrlToFile(
    formats.story,
    path.join(OUT, 'export-story-1080x1920.png'),
  )
  await dataUrlToFile(formats.post, path.join(OUT, 'export-post.png'))
  console.log('saved export-story-1080x1920.png + export-post.png')

  await page.getByRole('button', { name: 'Close' }).click()
  await context.close()
}

// ——— Focused name, NO keyboard (375×812) — panel must stay full ———
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  await loadCard(page, { name: 'Natnael Eskinder' })
  await page.getByPlaceholder('Hana Tadesse').focus()
  await page.waitForTimeout(400)
  // Confirm collapse did NOT trigger (vv shrink ≈ 0)
  const collapsed = await page.evaluate(
    () => document.querySelector('.app')?.classList.contains('app--keyboard'),
  )
  if (collapsed) throw new Error('panel collapsed without keyboard shrink')
  await page.screenshot({
    path: path.join(OUT, 'mobile-375-focused-no-keyboard.png'),
    fullPage: false,
  })
  console.log('saved mobile-375-focused-no-keyboard.png')
  await context.close()
}

// ——— Real keyboard: visualViewport shrink > 120px on 375×812 ———
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(120_000)
  await loadCard(page, { name: 'Natnael' })
  await page.getByPlaceholder('Hana Tadesse').focus()
  // 812 − 420 = 392px shrink (>120) → collapse panel, hug-frame rescales
  await page.evaluate(() => window.__badgeDebug.setViewportShrink(392))
  await page.waitForTimeout(500)
  const collapsed = await page.evaluate(
    () => document.querySelector('.app')?.classList.contains('app--keyboard'),
  )
  if (!collapsed) throw new Error('keyboard collapse did not apply')
  // Capture the visual viewport only (keyboard occupies the rest)
  await page.screenshot({
    path: path.join(OUT, 'mobile-375-keyboard.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 375, height: 420 },
  })
  console.log('saved mobile-375-keyboard.png')
  await context.close()
}

// Extra cover-fit sanity: tall + tiny + ultra-wide (no black strip in export)
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  for (const [label, file] of [
    ['tall', '/tmp/badge-photos/tall-1200x2400.jpg'],
    ['tiny', '/tmp/badge-photos/tiny-80x60.jpg'],
    ['ultrawide', '/tmp/badge-photos/wide-3000x1200.jpg'],
  ]) {
    await loadCard(page, { photo: file })
    const url = await page.evaluate(() =>
      window.__badgeDebug.getCardCanvas().toDataURL('image/png'),
    )
    await dataUrlToFile(url, path.join(OUT, `export-cover-${label}.png`))
    console.log('saved export-cover-' + label + '.png')
  }
  await context.close()
}

await browser.close()
console.log('done')
