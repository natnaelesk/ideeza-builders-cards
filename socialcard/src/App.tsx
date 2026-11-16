import { useCallback, useEffect, useRef, useState } from 'react'
import { LinkedInIcon, XIcon } from './components/BrandIcons'
import { ShareCard } from './components/ShareCard'
import { ShareSheet } from './components/ShareSheet'
import { Toast } from './components/Toast'
import { CARD_HEIGHT, CARD_WIDTH, EVENT_DATES, UNIVERSITY } from './config/event'
import { modalCopy } from './config/shareText'
import {
  canShareFiles,
  dataUrlToFile,
  downloadDataUrl,
  renderCardPng,
  shareCardFile,
} from './lib/exportCard'
import { focusTransformForPhoto } from './lib/faceFocus'
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
  const [name, setName] = useState('')
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
  const [vvBottom, setVvBottom] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    waitForFonts().then(() => setFontsReady(true))
  }, [])

  // Track visual viewport so the iOS keyboard shrinks the preview, not covers it
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setVvBottom(inset)
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [])

  // Scale preview to fill available space above the sheet
  useEffect(() => {
    const el = previewViewportRef.current
    const sheet = sheetRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      const scale = Math.min(w / CARD_WIDTH, h / CARD_HEIGHT)
      setPreviewScale(Math.max(0.2, Math.min(1, scale)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    if (sheet) ro.observe(sheet)
    return () => ro.disconnect()
  }, [vvBottom])

  const onPhotoChange = async (file: File | null) => {
    if (!file) {
      setPhotoUrl(null)
      setPhotoTransform(defaultPhotoTransform())
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setPhotoUrl(dataUrl)
    const focus = await focusTransformForPhoto(dataUrl)
    setPhotoTransform(focus)
  }

  const state: CardFormState = {
    name,
    photoUrl,
    photoTransform,
  }

  const filename = `vibe-builders-badge-${(name || 'card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)}.png`

  const runExport = useCallback(async () => {
    if (!canvasRef.current) return null
    setExporting(true)
    setStatus('Rendering card…')
    try {
      await waitForFonts()
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      return await renderCardPng(canvasRef.current)
    } finally {
      setExporting(false)
    }
  }, [])

  const onDownload = async () => {
    try {
      const dataUrl = await runExport()
      if (!dataUrl) return
      downloadDataUrl(dataUrl, filename)
      setStatus('Downloaded PNG (1080×1440).')
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
      const shared = await shareCardFile(
        file,
        `My Vibe Builders badge — ${UNIVERSITY}`,
      )
      if (shared) setStatus('Shared!')
      else {
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

  const busy = exporting

  return (
    <div
      className="app"
      style={{ ['--vv-bottom' as string]: `${vvBottom}px` }}
    >
      <header className="app__header">
        <img className="app__brand" src="/logos/logo_ideeza.png" alt="IDEEZA" />
        <div>
          <h1>Vibe Builders National Tour</h1>
          <p>
            {UNIVERSITY} · {EVENT_DATES} · Builder ID badge
          </p>
        </div>
      </header>

      <div className="app__layout">
        <div className="app__preview">
          <div className="app__preview-label">Live preview</div>
          <div className="app__preview-viewport" ref={previewViewportRef}>
            <div
              className="app__preview-scale"
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                ['--preview-scale' as string]: String(previewScale),
              }}
            >
              <ShareCard state={state} canvasRef={canvasRef} />
            </div>
          </div>
        </div>

        <div className="app__sheet" ref={sheetRef}>
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
                enterKeyHint="done"
              />
            </label>

            <input
              ref={fileInputRef}
              className="app__file-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                void onPhotoChange(e.target.files?.[0] ?? null)
              }}
            />

            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoUrl ? 'Change photo' : 'Pick photo'}
            </button>

            {/* Desktop-only crop adjust — kept off the compact mobile sheet */}
            {photoUrl && (
              <fieldset className="field field--adjust app__adjust-desktop">
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
                disabled={busy || !fontsReady}
              >
                {exporting ? 'Rendering…' : 'Download PNG'}
              </button>
              <button
                type="button"
                className="btn btn--linkedin"
                disabled={busy || !fontsReady}
                onClick={() => void onSocialShare('linkedin')}
              >
                <LinkedInIcon />
                <span>Share</span>
              </button>
              <button
                type="button"
                className="btn btn--x"
                disabled={busy || !fontsReady}
                onClick={() => void onSocialShare('x')}
              >
                <XIcon />
                <span>X</span>
              </button>
              {shareSupported && (
                <button
                  type="button"
                  className="btn btn--ghost app__share-native"
                  disabled={busy || !fontsReady}
                  onClick={() => void onShare()}
                >
                  Share…
                </button>
              )}
            </div>

            {status && <p className="app__status">{status}</p>}
          </form>
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
          fields={{ name }}
          imageDataUrl={shareSheet.imageDataUrl}
          filename={filename}
          onClose={() => setShareSheet(null)}
        />
      )}
    </div>
  )
}
