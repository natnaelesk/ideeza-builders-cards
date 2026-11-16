import { chromium } from 'playwright'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
// Pillow via pre-saved before pngs preferred

const OUT = '/opt/cursor/artifacts'
const TMP = '/tmp/bgtest'
const BASE = process.env.SOCIALCARD_URL || 'http://127.0.0.1:4173'
await mkdir(OUT, { recursive: true })
await mkdir(TMP, { recursive: true })

const SAMPLES = [
  { key: 'curly', url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&h=1200&fit=crop&crop=faces' },
  { key: 'busy', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=1200&fit=crop&crop=faces' },
  { key: 'lowlight', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1200&fit=crop&crop=faces' },
]

for (const s of SAMPLES) {
  const dest = path.join(TMP, `${s.key}.jpg`)
  const res = await fetch(s.url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
  console.log('dl', s.key)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ acceptDownloads: true })
const page = await context.newPage()
await page.setViewportSize({ width: 1100, height: 900 })
page.setDefaultTimeout(600_000)
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })

const timings = []
for (const s of SAMPLES) {
  await page.getByLabel('Your name').fill(s.key === 'curly' ? 'Hana Tadesse' : s.key === 'busy' ? 'Abel Bekele' : 'Sara Mengistu')
  const t0 = Date.now()
  await page.locator('input[type="file"]').setInputFiles(path.join(TMP, `${s.key}.jpg`))
  await page.waitForFunction(() => {
    const status = document.querySelector('.app__status')?.textContent || ''
    return status.includes('Cover ready') || status.includes('unavailable') || status.includes('overlay')
  }, { timeout: 600_000 })
  const elapsed = Date.now() - t0
  const status = await page.locator('.app__status').textContent()
  timings.push({ key: s.key, elapsedMs: elapsed, status })
  console.log(s.key, elapsed, status)
  await page.waitForTimeout(500)
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120_000 }),
    page.getByRole('button', { name: /Download PNG/i }).click(),
  ])
  await download.saveAs(path.join(OUT, `bgtest-${s.key}-after.png`))
}

await writeFile(path.join(OUT, 'bgtest-timings.json'), JSON.stringify({
  model: 'isnet (full)',
  approxDownloadMb: 188,
  tiltDegClockwise: 5.673,
  timings,
}, null, 2))
await browser.close()
console.log('done', timings)
