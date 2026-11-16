import { useCallback, useEffect, useId, useRef, useState } from 'react'
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
import { waitForFonts } from './lib/fonts'
import { prepareCoverCutout, revokeCutout } from './lib/removeBackground'
import type { SocialPlatform } from './lib/socialShare'
import {
  defaultPhotoTransform,
  PHOTO_PAN_MAX,
  PHOTO_PAN_MIN,
  PHOTO_ZOOM_MAX,
  PHOTO_ZOOM_MIN,
  type CardFormState,
  type CutoutStatus,
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
  const [photoKey, setPhotoKey] = useState<string | null>(null)
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null)
  const [cutoutStatus, setCutoutStatus] = useState<CutoutStatus>('idle')
  const [cutoutProgress, setCutoutProgress] = useState(0)
  const [cutoutProgressLabel, setCutoutProgressLabel] = useState('')
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const cutoutGen = useRef(0)
  const sessionId = useId()

  useEffect(() => {
    waitForFonts().then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    const el = previewViewportRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return
      setPreviewScale(Math.min(1, w / CARD_WIDTH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const runCutout = useCallback(async (dataUrl: string, key: string) => {
    const gen = ++cutoutGen.current
    setCutoutStatus('preparing')
    setCutoutProgress(0.01)
    setCutoutProgressLabel('Preparing cover…')
    setCutoutUrl(null)
    setStatus('Preparing cover…')
    try {
      const result = await prepareCoverCutout(dataUrl, key, (p) => {
        if (cutoutGen.current !== gen) return
        setCutoutProgress(p.ratio)
        setCutoutProgressLabel(p.label)
        setStatus(
          p.ratio < 1
            ? `Preparing cover… ${Math.round(p.ratio * 100)}%`
            : 'Cover ready',
        )
      })
      if (cutoutGen.current !== gen) return
      setCutoutUrl(result.objectUrl)
      setCutoutStatus('ready')
      setCutoutProgress(1)
      setStatus(`Cover ready (${(result.elapsedMs / 1000).toFixed(1)}s)`)
    } catch (err) {
      console.warn('Background removal failed — photo fallback', err)
      if (cutoutGen.current !== gen) return
      setCutoutUrl(null)
      setCutoutStatus('fallback')
      setCutoutProgress(0)
      setStatus('Using photo overlay (cutout unavailable on this device).')
    }
  }, [])

  const onPhotoChange = async (file: File | null) => {
    if (photoKey) revokeCutout(photoKey)
    cutoutGen.current += 1
    if (!file) {
      setPhotoUrl(null)
      setPhotoKey(null)
      setCutoutUrl(null)
      setCutoutStatus('idle')
      setCutoutProgress(0)
      setCutoutProgressLabel('')
      setStatus(null)
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    const key = `${sessionId}:${file.name}:${file.size}:${file.lastModified}`
    setPhotoUrl(dataUrl)
    setPhotoKey(key)
    setPhotoTransform(defaultPhotoTransform())
    void runCutout(dataUrl, key)
  }

  const state: CardFormState = {
    name,
    photoUrl,
    cutoutUrl,
    cutoutStatus,
    cutoutProgress,
    cutoutProgressLabel,
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

  const preparing = cutoutStatus === 'preparing'
  const busy = exporting || preparing

  return (
    <div className="app">
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
            <span>Your photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                void onPhotoChange(e.target.files?.[0] ?? null)
              }}
            />
          </label>

          {preparing && (
            <div className="app__prepare" role="status" aria-live="polite">
              <div className="app__prepare-bar">
                <div
                  className="app__prepare-fill"
                  style={{ width: `${Math.max(4, cutoutProgress * 100)}%` }}
                />
              </div>
              <p>
                {cutoutProgressLabel || 'Preparing cover…'}
                {cutoutProgress > 0 && cutoutProgress < 1
                  ? ` · ${Math.round(cutoutProgress * 100)}%`
                  : ''}
              </p>
              <p className="app__prepare-hint">
                First run downloads the AI model (~188 MB) once, then stays on
                your device. Nothing is uploaded.
              </p>
            </div>
          )}

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
              <span>Share on LinkedIn</span>
            </button>
            <button
              type="button"
              className="btn btn--x"
              disabled={busy || !fontsReady}
              onClick={() => void onSocialShare('x')}
            >
              <XIcon />
              <span>Share on X</span>
            </button>
            {shareSupported && (
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy || !fontsReady}
                onClick={() => void onShare()}
              >
                Share
              </button>
            )}
          </div>

          {status && <p className="app__status">{status}</p>}
          <p className="app__hint">
            Badge is the approved template with on-device background removal
            (full <code>isnet</code>). Export is 1080×1440 PNG.
          </p>
        </form>

        <div className="app__preview">
          <div className="app__preview-label">Live preview</div>
          <div
            className="app__preview-viewport"
            ref={previewViewportRef}
            style={{ height: CARD_HEIGHT * previewScale }}
          >
            <div
              className="app__preview-scale"
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                transform: `scale(${previewScale})`,
              }}
            >
              <ShareCard state={state} canvasRef={canvasRef} />
            </div>
            {preparing && (
              <div className="app__preview-overlay">
                <div className="app__preview-overlay-card">
                  <div className="app__prepare-bar">
                    <div
                      className="app__prepare-fill"
                      style={{ width: `${Math.max(4, cutoutProgress * 100)}%` }}
                    />
                  </div>
                  <strong>Preparing cover…</strong>
                  <span>{cutoutProgressLabel}</span>
                </div>
              </div>
            )}
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
          fields={{ name }}
          imageDataUrl={shareSheet.imageDataUrl}
          filename={filename}
          onClose={() => setShareSheet(null)}
        />
      )}
    </div>
  )
}
