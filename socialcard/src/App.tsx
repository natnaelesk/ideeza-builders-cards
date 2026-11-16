import { useCallback, useEffect, useRef, useState } from 'react'
import { LinkedInIcon, XIcon } from './components/BrandIcons'
import { ShareCard } from './components/ShareCard'
import { ShareSheet } from './components/ShareSheet'
import { Toast } from './components/Toast'
import { cardLayout, DAY_ORDER, type DayId } from './config/cardLayout'
import { modalCopy } from './config/shareText'
import {
  canShareFiles,
  dataUrlToFile,
  downloadDataUrl,
  renderCardPng,
  shareCardFile,
} from './lib/exportCard'
import { waitForFonts } from './lib/fonts'
import type { SocialPlatform } from './lib/socialShare'
import {
  defaultPhotoTransform,
  PHOTO_PAN_MAX,
  PHOTO_PAN_MIN,
  PHOTO_ZOOM_MAX,
  PHOTO_ZOOM_MIN,
  type CardFormState,
  type PhotoTransform,
} from './types'
import './App.css'

interface ShareSheetState {
  platform: SocialPlatform
  imageDataUrl: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function App() {
  const uni = cardLayout.university
  const [day, setDay] = useState<DayId>('day1')
  const [name, setName] = useState('')
  const [project, setProject] = useState('')
  const [pitch, setPitch] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>(
    defaultPhotoTransform,
  )
  const [fontsReady, setFontsReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [shareSheet, setShareSheet] = useState<ShareSheetState | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [shareSupported] = useState(() => canShareFiles())

  const cardRef = useRef<HTMLDivElement>(null)
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const dayCfg = cardLayout.days[day]

  useEffect(() => {
    waitForFonts().then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    const el = previewViewportRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return
      setPreviewScale(Math.min(1, w / cardLayout.width))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const state: CardFormState = {
    day,
    name,
    project,
    pitch,
    photoUrl,
    photoTransform,
  }

  const onDayChange = (next: DayId) => {
    setDay(next)
  }

  const onPhotoChange = async (file: File | null) => {
    if (!file) {
      setPhotoUrl(null)
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setPhotoUrl(dataUrl)
    setPhotoTransform(defaultPhotoTransform())
  }

  const filename = `vibe-builders-${uni.id}-${day}-${(name || 'card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)}.png`

  const runExport = useCallback(async () => {
    if (!cardRef.current) return null
    setExporting(true)
    setStatus('Rendering card…')
    try {
      await waitForFonts()
      const images = Array.from(cardRef.current.querySelectorAll('img'))
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
        }),
      )
      return await renderCardPng(cardRef.current)
    } finally {
      setExporting(false)
    }
  }, [])

  const onDownload = async () => {
    try {
      const dataUrl = await runExport()
      if (!dataUrl) return
      downloadDataUrl(dataUrl, filename)
      setStatus('Downloaded PNG (1080×1350).')
    } catch (err) {
      console.error(err)
      setStatus('Export failed. Try again or use another browser.')
    }
  }

  const onShare = async () => {
    try {
      const dataUrl = await runExport()
      if (!dataUrl) return
      const file = await dataUrlToFile(dataUrl, filename)
      const title = `My Vibe Builders ${dayCfg.pickerLabel} card — ${uni.name}`
      const shared = await shareCardFile(file, title)
      if (shared) {
        setStatus('Shared!')
      } else {
        downloadDataUrl(dataUrl, filename)
        setStatus('Share not available — downloaded instead.')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus(null)
        return
      }
      console.error(err)
      setStatus('Share failed. Try downloading instead.')
    }
  }

  const onSocialShare = async (platform: SocialPlatform) => {
    try {
      setStatus(modalCopy.preparing)
      const dataUrl = await runExport()
      if (!dataUrl) {
        setStatus(null)
        setToast(modalCopy.prepareError)
        return
      }
      setStatus(null)
      setShareSheet({ platform, imageDataUrl: dataUrl })
    } catch (err) {
      console.error(err)
      setStatus(null)
      setToast(modalCopy.prepareError)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <img
          className="app__brand"
          src={cardLayout.logos.ideeza}
          alt="IDEEZA"
        />
        <div>
          <h1>Vibe Builders National Tour</h1>
          <p>
            {uni.name} · {uni.dates} · share cards
          </p>
        </div>
      </header>

      <section className="app__days" aria-label="Choose your day">
        {DAY_ORDER.map((id) => {
          const d = cardLayout.days[id]
          return (
            <button
              key={id}
              type="button"
              className={`app__day${day === id ? ' is-active' : ''}`}
              onClick={() => onDayChange(id)}
            >
              <span className="app__day-label">{d.pickerLabel}</span>
              <span className="app__day-hint">{d.pickerHint}</span>
            </button>
          )
        })}
      </section>

      <div className="app__layout">
        <form
          className="app__form"
          onSubmit={(e) => {
            e.preventDefault()
            void onDownload()
          }}
        >
          <label className="field">
            <span>Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hana Tadesse"
              autoComplete="name"
              maxLength={48}
            />
          </label>

          <label className="field">
            <span>
              Project name
              {!dayCfg.projectRequired ? ' (optional)' : ''}
            </span>
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="SoilSense"
              maxLength={64}
            />
          </label>

          <label className="field">
            <span>
              One-line pitch
              {!dayCfg.projectRequired ? ' (optional)' : ''}
            </span>
            <input
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Moisture intel for small farms"
              maxLength={100}
            />
          </label>

          <label className="field">
            <span>Your photo (optional)</span>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                void onPhotoChange(e.target.files?.[0] ?? null)
              }}
            />
          </label>

          {photoUrl && (
            <fieldset className="field field--adjust">
              <legend>Adjust photo</legend>
              <label>
                Zoom
                <input
                  type="range"
                  min={PHOTO_ZOOM_MIN}
                  max={PHOTO_ZOOM_MAX}
                  step={0.01}
                  value={photoTransform.zoom}
                  onChange={(e) =>
                    setPhotoTransform((t) => ({
                      ...t,
                      zoom: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Move left / right
                <input
                  type="range"
                  min={PHOTO_PAN_MIN}
                  max={PHOTO_PAN_MAX}
                  step={1}
                  value={photoTransform.x}
                  onChange={(e) =>
                    setPhotoTransform((t) => ({
                      ...t,
                      x: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Move up / down
                <input
                  type="range"
                  min={PHOTO_PAN_MIN}
                  max={PHOTO_PAN_MAX}
                  step={1}
                  value={photoTransform.y}
                  onChange={(e) =>
                    setPhotoTransform((t) => ({
                      ...t,
                      y: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPhotoTransform(defaultPhotoTransform())}
              >
                Reset crop
              </button>
            </fieldset>
          )}

          <div className="app__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={exporting || !fontsReady}
            >
              {exporting ? 'Rendering…' : 'Download PNG'}
            </button>
            <button
              type="button"
              className="btn btn--linkedin"
              disabled={exporting || !fontsReady}
              onClick={() => void onSocialShare('linkedin')}
            >
              <LinkedInIcon />
              <span>Share on LinkedIn</span>
            </button>
            <button
              type="button"
              className="btn btn--x"
              disabled={exporting || !fontsReady}
              onClick={() => void onSocialShare('x')}
            >
              <XIcon />
              <span>Share on X</span>
            </button>
            {shareSupported && (
              <button
                type="button"
                className="btn btn--secondary"
                disabled={exporting || !fontsReady}
                onClick={() => void onShare()}
              >
                Share
              </button>
            )}
          </div>

          {status && <p className="app__status">{status}</p>}
          <p className="app__hint">
            Nothing is uploaded or stored — everything stays on your device.
            Export is a crisp 1080×1350 PNG. LinkedIn / X open a share sheet with
            your card image and ready-made post text.
          </p>
        </form>

        <div className="app__preview">
          <div className="app__preview-label">Live preview</div>
          <div
            className="app__preview-viewport"
            ref={previewViewportRef}
            style={{
              height: cardLayout.height * previewScale,
            }}
          >
            <div
              className="app__preview-scale"
              style={{
                width: cardLayout.width,
                height: cardLayout.height,
                transform: `scale(${previewScale})`,
              }}
            >
              <ShareCard state={state} cardRef={cardRef} />
            </div>
          </div>
        </div>
      </div>

      <footer className="app__footer">
        <span>IDEEZA</span>
        <span aria-hidden>·</span>
        <span>Cheche Impact</span>
        <span aria-hidden>·</span>
        <span>Zemenay Tech</span>
        <span aria-hidden>·</span>
        <span>INSA</span>
      </footer>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {shareSheet && (
        <ShareSheet
          platform={shareSheet.platform}
          fields={{
            day,
            name,
            project,
            pitch,
          }}
          imageDataUrl={shareSheet.imageDataUrl}
          filename={filename}
          onClose={() => setShareSheet(null)}
        />
      )}
    </div>
  )
}
