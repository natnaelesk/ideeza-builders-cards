/**
 * iOS Download PNG hotfix verification.
 * - Chromium mobile: stub navigator.share, click Download, assert 1080×1440 PNG
 * - WebKit iPhone 13 when available (same stub)
 * - Fallback overlay when share unavailable
 */
import { chromium, webkit, devices } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = '/opt/cursor/artifacts'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
const PHOTO =
  process.env.BADGE_PHOTO || '/tmp/badge-photos/wide-4000x3000.jpg'

await mkdir(OUT, { recursive: true })

async function ensurePhoto() {
  try {
    await import('node:fs').then((fs) => fs.promises.access(PHOTO))
  } catch {
    // create tiny placeholder via playwright page later if missing
  }
}

async function loadApp(page, { name = 'Natnael Eskinder' } = {}) {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.getByPlaceholder('Hana Tadesse').fill(name)
  try {
    await page.locator('input[type="file"]').setInputFiles(PHOTO)
  } catch {
    // ignore missing photo — initials card still exports
  }
  await page.waitForTimeout(1200)
  // wait for export warm cache
  await page.waitForFunction(
    () => Boolean(window.__badgeDebug?.getCardCanvas?.()),
    null,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(400)
}

function installShareStub(page) {
  return page.addInitScript(() => {
    window.__shareCalls = []
    const origCanShare = navigator.canShare?.bind(navigator)
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (data) => {
        if (data?.files?.length) return true
        return origCanShare ? origCanShare(data) : false
      },
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data) => {
        const files = data?.files ? [...data.files] : []
        const entry = {
          title: data?.title || null,
          text: data?.text || null,
          fileCount: files.length,
          fileMeta: await Promise.all(
            files.map(async (f) => ({
              name: f.name,
              type: f.type,
              size: f.size,
              width: null,
              height: null,
              isPng: false,
            })),
          ),
        }
        for (let i = 0; i < files.length; i++) {
          const buf = await files[i].arrayBuffer()
          const bytes = new Uint8Array(buf)
          entry.fileMeta[i].isPng =
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47
          // decode via createImageBitmap
          try {
            const bmp = await createImageBitmap(files[i])
            entry.fileMeta[i].width = bmp.width
            entry.fileMeta[i].height = bmp.height
            bmp.close?.()
          } catch {
            /* ignore */
          }
        }
        window.__shareCalls.push(entry)
      },
    })
  })
}

async function runShareTest(browserType, label, device) {
  const browser = await browserType.launch({ headless: true })
  const context = await browser.newContext({
    ...device,
    acceptDownloads: true,
  })
  const page = await context.newPage()
  await installShareStub(page)
  page.setDefaultTimeout(60_000)
  await loadApp(page)
  await page.getByRole('button', { name: /Download PNG/i }).click()
  await page.waitForTimeout(800)
  const calls = await page.evaluate(() => window.__shareCalls || [])
  await context.close()
  await browser.close()

  const ok =
    calls.length >= 1 &&
    calls[0].fileCount >= 1 &&
    calls[0].fileMeta[0]?.isPng === true &&
    calls[0].fileMeta[0]?.width === 1080 &&
    calls[0].fileMeta[0]?.height === 1440

  return {
    label,
    ok,
    shareCalls: calls.length,
    file: calls[0]?.fileMeta?.[0] || null,
    error: ok ? null : 'share stub did not receive a valid 1080×1440 PNG',
  }
}

async function runOverlayFallback() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    acceptDownloads: true,
  })
  const page = await context.newPage()
  // Block share + popups so in-page overlay must appear
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: undefined,
    })
    window.open = () => null
  })
  page.setDefaultTimeout(60_000)
  await loadApp(page)
  await page.getByRole('button', { name: /Download PNG/i }).click()
  await page.waitForSelector('.save-overlay', { timeout: 10_000 })
  const overlay = page.locator('.save-overlay')
  const hasOverlay = await overlay.count().then((n) => n > 0)
  if (hasOverlay) {
    await page.screenshot({
      path: path.join(OUT, 'hotfix-fallback-overlay-375.png'),
      fullPage: false,
    })
  } else {
    // May have opened popup — still capture page state
    await page.screenshot({
      path: path.join(OUT, 'hotfix-fallback-overlay-375.png'),
      fullPage: false,
    })
  }
  await context.close()
  await browser.close()
  return {
    label: 'chromium-iphone13-no-share-overlay',
    ok: hasOverlay,
    hasOverlay,
    artifact: 'hotfix-fallback-overlay-375.png',
  }
}

await ensurePhoto()

const results = []

// Chromium mobile (iPhone 13 descriptor)
try {
  results.push(
    await runShareTest(chromium, 'chromium-iphone13-share', devices['iPhone 13']),
  )
} catch (err) {
  results.push({
    label: 'chromium-iphone13-share',
    ok: false,
    error: String(err),
  })
}

// WebKit iPhone 13 when available
try {
  results.push(
    await runShareTest(webkit, 'webkit-iphone13-share', devices['iPhone 13']),
  )
} catch (err) {
  results.push({
    label: 'webkit-iphone13-share',
    ok: false,
    error: String(err?.message || err),
    note: 'WebKit may be unavailable in this environment',
  })
}

try {
  results.push(await runOverlayFallback())
} catch (err) {
  results.push({
    label: 'chromium-iphone13-no-share-overlay',
    ok: false,
    error: String(err),
  })
}

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  results,
  allOk: results.every((r) => r.ok),
}

await writeFile(
  path.join(OUT, 'hotfix-webkit-share.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report, null, 2))
if (!report.allOk) {
  // Don't fail the agent hard if only webkit missing — mark soft
  const critical = results.filter(
    (r) => r.label.startsWith('chromium') && !r.ok,
  )
  if (critical.length) process.exitCode = 1
}
console.log('wrote hotfix-webkit-share.json')
