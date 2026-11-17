/**
 * Photo reposition coach overlay + layout regression checks.
 * Artifacts: hint-375x667-overlay.png, hint-375x667-after.png,
 * hint-desktop-1280x800.png, hint-checks.json
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
]

async function measure(page) {
  return page.evaluate(() => {
    const shareRow = document.querySelector('.app__share-row')
    const card = document.querySelector('.app__preview-viewport')
    const hint = document.querySelector('.app__photo-hint')
    const coach = document.querySelector('.app__gesture-coach')
    const shareRect = shareRow?.getBoundingClientRect()
    const cardRect = card?.getBoundingClientRect()
    const hintRect = hint?.getBoundingClientRect()
    return {
      innerHeight: window.innerHeight,
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
      hintText: hint?.textContent?.trim() ?? null,
      hintVisible: hint
        ? getComputedStyle(hint).opacity !== '0' &&
          !hint.classList.contains('is-placeholder')
        : false,
      coachPresent: Boolean(coach),
      coachHiding: coach?.classList.contains('is-hiding') ?? false,
      coachOpacity: coach ? Number(getComputedStyle(coach).opacity) : 0,
      hintH: hintRect ? +hintRect.height.toFixed(1) : null,
    }
  })
}

const browser = await chromium.launch({ headless: true })
const report = {
  generatedAt: new Date().toISOString(),
  viewports: [],
  overlayHidesAfterDrag: false,
  exportClean: false,
  desktopOverlay: false,
  helperLine: null,
  allOk: false,
}

// --- 4 mobile viewports: panel + no scroll ---
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
  await page.waitForTimeout(700)
  const m = await measure(page)
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
    'coach',
    m.coachPresent,
  )
  await context.close()
}

// --- 375x667: overlay after upload, hide after drag, helper line, export clean ---
{
  const context = await browser.newContext({
    ...devices['iPhone 13'],
  })
  const page = await context.newPage()
  page.setDefaultTimeout(60_000)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.getByPlaceholder('Hana Tadesse').fill('Natnael Eskinder')
  const before = await measure(page)
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await page.waitForSelector('.app__gesture-coach')
  await page.waitForTimeout(350)
  const afterUpload = await measure(page)
  await page.screenshot({
    path: path.join(OUT, 'hint-375x667-overlay.png'),
    fullPage: false,
  })

  // Canvas-only capture while overlay is visible — coach is a DOM sibling, not painted
  await page.locator('canvas.share-card').screenshot({
    path: path.join(OUT, 'hint-375x667-canvas-only.png'),
  })

  // Drag on the photo hit layer
  const hit = page.locator('.app__photo-hit')
  const box = await hit.boundingBox()
  if (!box) throw new Error('photo hit missing')
  const sx = box.x + box.width * 0.5
  const sy = box.y + box.height * 0.42
  await page.mouse.move(sx, sy)
  await page.mouse.down()
  await page.mouse.move(sx + 36, sy + 10, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(280)
  const afterDrag = await measure(page)
  await page.screenshot({
    path: path.join(OUT, 'hint-375x667-after.png'),
    fullPage: false,
  })

  report.overlayVisibleAfterUpload =
    afterUpload.coachPresent && afterUpload.coachOpacity > 0.5
  report.overlayHidesAfterDrag =
    !afterDrag.coachPresent ||
    afterDrag.coachHiding ||
    afterDrag.coachOpacity < 0.2
  report.helperLine = afterDrag.hintText
  report.helperLineOk =
    afterDrag.hintVisible &&
    /Not centered\? Drag your photo to adjust it/i.test(
      afterDrag.hintText || '',
    )
  report.clsHintStable =
    before.hintH != null &&
    afterUpload.hintH != null &&
    Math.abs(before.hintH - afterUpload.hintH) < 2

  // Export PNG via canvas.toBlob — coach is DOM-only so never in pixels;
  // also verify canvas screenshot dimensions and that coach is not under canvas.
  const exportMeta = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas.share-card')
    const coach = document.querySelector('.app__gesture-coach')
    if (!canvas) return { ok: false, reason: 'no canvas' }
    const coachIsCanvasChild = Boolean(coach && canvas.contains(coach))
    const blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    )
    if (!blob) return { ok: false, reason: 'toBlob failed' }
    const buf = new Uint8Array(await blob.arrayBuffer())
    return {
      ok: true,
      coachIsCanvasChild,
      width: canvas.width,
      height: canvas.height,
      size: buf.byteLength,
      // first 8 bytes PNG signature
      isPng:
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47,
    }
  })
  report.exportMeta = exportMeta
  report.exportClean =
    exportMeta.ok &&
    exportMeta.isPng &&
    exportMeta.width === 1080 &&
    exportMeta.height === 1440 &&
    !exportMeta.coachIsCanvasChild

  console.log('overlay→drag', {
    overlay: report.overlayVisibleAfterUpload,
    hides: report.overlayHidesAfterDrag,
    helper: report.helperLine,
    exportClean: report.exportClean,
  })
  await context.close()
}

// --- Desktop overlay (~800ms after upload, still visible) ---
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.getByPlaceholder('Hana Tadesse').fill('Natnael Eskinder')
  await page.locator('input[type="file"]').setInputFiles(PHOTO)
  await page.waitForSelector('.app__gesture-coach')
  await page.waitForTimeout(800)
  const deskGeom = await page.evaluate(() => {
    const coach = document.querySelector('.app__gesture-coach')
    const preview = document.querySelector('.app__preview-viewport')
    const text = document.querySelector('.app__gesture-coach-text')
    if (!coach || !preview) {
      return { ok: false, reason: 'missing coach or preview' }
    }
    const cs = getComputedStyle(coach)
    const cr = coach.getBoundingClientRect()
    const pr = preview.getBoundingClientRect()
    const within =
      cr.left >= pr.left - 1 &&
      cr.top >= pr.top - 1 &&
      cr.right <= pr.right + 1 &&
      cr.bottom <= pr.bottom + 1
    return {
      ok: true,
      position: cs.position,
      opacity: Number(cs.opacity),
      text: (text?.textContent || '').trim(),
      coachRect: {
        x: +cr.x.toFixed(1),
        y: +cr.y.toFixed(1),
        w: +cr.width.toFixed(1),
        h: +cr.height.toFixed(1),
      },
      previewRect: {
        x: +pr.x.toFixed(1),
        y: +pr.y.toFixed(1),
        w: +pr.width.toFixed(1),
        h: +pr.height.toFixed(1),
      },
      withinPreview: within,
      finePointerMq: window.matchMedia(
        '(hover: hover) and (pointer: fine)',
      ).matches,
    }
  })
  await page.screenshot({
    path: path.join(OUT, 'hint-desktop-1280x800.png'),
    fullPage: false,
  })

  // Wheel zoom smoke (after geometry check — may dismiss coach)
  const hit = page.locator('.app__photo-hit')
  const beforeZoom = await page.evaluate(
    () => window.__badgeDebug?.getTransform?.()?.zoom ?? null,
  )
  const box = await hit.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -240)
  await page.waitForTimeout(200)
  const afterZoom = await page.evaluate(
    () => window.__badgeDebug?.getTransform?.()?.zoom ?? null,
  )

  report.desktopGeom = deskGeom
  report.desktopOverlay =
    deskGeom.ok &&
    deskGeom.position === 'absolute' &&
    deskGeom.withinPreview &&
    deskGeom.opacity === 1 &&
    /Scroll or use the slider/i.test(deskGeom.text || '')
  report.desktopCoachText = deskGeom.text || null
  report.wheelZoom = {
    before: beforeZoom,
    after: afterZoom,
    increased:
      beforeZoom != null && afterZoom != null && afterZoom > beforeZoom + 0.01,
  }
  console.log('desktop', {
    overlay: report.desktopOverlay,
    geom: deskGeom,
    wheel: report.wheelZoom,
  })
  await context.close()
}

report.allViewportsOk = report.viewports.every((v) => v.ok)
report.allOk =
  report.allViewportsOk &&
  report.overlayVisibleAfterUpload &&
  report.overlayHidesAfterDrag &&
  report.helperLineOk &&
  report.exportClean &&
  report.desktopOverlay &&
  report.wheelZoom?.increased

await writeFile(path.join(OUT, 'hint-checks.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
if (!report.allOk) process.exitCode = 1
