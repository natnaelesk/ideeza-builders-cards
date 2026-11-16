/**
 * Mobile viewport layout checks for polish PR.
 * Verifies panel fully visible, no document scroll, card CLS on photo load / IG sheet.
 */
import { chromium, devices } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO =
  process.env.BADGE_PHOTO || '/tmp/badge-photos/wide-4000x3000.jpg'

await mkdir(OUT, { recursive: true })

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
  { name: '375x590-chrome', width: 375, height: 590 },
  { name: '390x750-chrome', width: 390, height: 750 },
]

async function measure(page) {
  return page.evaluate(() => {
    const shareRow = document.querySelector('.app__share-row')
    const card = document.querySelector('.app__preview-viewport')
    const sheet = document.querySelector('.app__sheet')
    const shareRect = shareRow?.getBoundingClientRect()
    const cardRect = card?.getBoundingClientRect()
    const sheetRect = sheet?.getBoundingClientRect()
    return {
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      noDocScroll:
        document.documentElement.scrollHeight <= window.innerHeight + 1 &&
        document.body.scrollHeight <= window.innerHeight + 1,
      shareBottom: shareRect ? shareRect.bottom : null,
      panelFullyVisible: shareRect
        ? shareRect.bottom <= window.innerHeight + 0.5
        : false,
      cardBox: cardRect
        ? {
            x: +cardRect.x.toFixed(1),
            y: +cardRect.y.toFixed(1),
            w: +cardRect.width.toFixed(1),
            h: +cardRect.height.toFixed(1),
          }
        : null,
      sheetTop: sheetRect ? +sheetRect.top.toFixed(1) : null,
    }
  })
}

const browser = await chromium.launch({ headless: true })
const report = { generatedAt: new Date().toISOString(), viewports: [], cls: null }

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  page.setDefaultTimeout(60_000)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.getByPlaceholder('Hana Tadesse').fill('Natnael Eskinder')
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await page.waitForTimeout(900)
  const m = await measure(page)
  await page.screenshot({
    path: path.join(OUT, `vp-${vp.name}.png`),
    fullPage: false,
  })
  report.viewports.push({
    name: vp.name,
    ...vp,
    ...m,
    ok: m.panelFullyVisible && m.noDocScroll,
  })
  console.log(
    vp.name,
    'panel',
    m.panelFullyVisible,
    'noScroll',
    m.noDocScroll,
    'shareBottom',
    m.shareBottom,
    '/',
    m.innerHeight,
  )
  await context.close()
}

// CLS-ish: card box before/after photo + IG sheet at 375x667
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.getByPlaceholder('Hana Tadesse').fill('Natnael')
  await page.waitForTimeout(300)
  const beforePhoto = await measure(page)
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await page.waitForTimeout(900)
  const afterPhoto = await measure(page)
  await page.getByRole('button', { name: /Share on Instagram/i }).click()
  await page.waitForTimeout(400)
  const withIg = await measure(page)
  await page.screenshot({
    path: path.join(OUT, 'vp-375x667-instagram-sheet.png'),
    fullPage: false,
  })
  const boxEq = (a, b) =>
    a &&
    b &&
    Math.abs(a.x - b.x) < 1 &&
    Math.abs(a.y - b.y) < 1 &&
    Math.abs(a.w - b.w) < 1 &&
    Math.abs(a.h - b.h) < 1
  report.cls = {
    beforePhoto: beforePhoto.cardBox,
    afterPhoto: afterPhoto.cardBox,
    withIgSheet: withIg.cardBox,
    cardUnchangedOnPhotoLoad: boxEq(beforePhoto.cardBox, afterPhoto.cardBox),
    // IG sheet is an overlay — card box should stay put
    cardUnchangedOnIgSheet: boxEq(afterPhoto.cardBox, withIg.cardBox),
  }
  console.log('CLS', report.cls)
  await context.close()
}

report.allViewportsOk = report.viewports.every((v) => v.ok)
report.clsOk =
  report.cls?.cardUnchangedOnPhotoLoad && report.cls?.cardUnchangedOnIgSheet

await writeFile(path.join(OUT, 'layout-checks.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
if (!report.allViewportsOk || !report.clsOk) process.exitCode = 1
