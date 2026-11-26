import { useCallback, useEffect, useRef, useState } from 'react'
import { LinkedInIcon, XIcon } from './components/BrandIcons'
import { HackathonCard } from './components/HackathonCard'
import { SaveImageOverlay } from './components/SaveImageOverlay'
import { ShareSheet } from './components/ShareSheet'
import { Toast } from './components/Toast'
import { hackathonLayout } from './config/hackathonLayout'
import { buildHackathonPostText } from './config/hackathonShareText'
import { modalCopy } from './config/shareText'
import {
  dataUrlToPngFile,
  deliverPngFileSync,
  deliverPngFileWhenReady,
  type DeliverResult,
} from './lib/deliverExport'
import { canShareFiles, renderCardPng } from './lib/exportCard'
import { waitForFonts } from './lib/fonts'
import type { SocialPlatform } from './lib/socialShare'
import {
  defaultPhotoTransform,
  PHOTO_PAN_MAX,
  PHOTO_PAN_MIN,
  PHOTO_ZOOM_MAX,
  PHOTO_ZOOM_MIN,
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

const META_MARK = 'ideeza-hackathon-meta'

function setOrCreateMeta(
  attr: 'name' | 'property',
  key: string,
  content: string,
) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"][data-ideeza="${META_MARK}"]`,
  )
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.dataset.ideeza = META_MARK
    document.head.appendChild(el)
  }
  el.content = content
  return el
}

function CropControls({
  legend,
  transform,
  onChange,
  onReset,
}: {
  legend: string
  transform: PhotoTransform
  onChange: (next: PhotoTransform) => void
  onReset: () => void
}) {
  return (
    <fieldset className="field field--adjust">
      <legend>{legend}</legend>
      <label>
        Zoom
        <input
          type="range"
          min={PHOTO_ZOOM_MIN}
          max={PHOTO_ZOOM_MAX}
          step={0.01}
          value={transform.zoom}
          onChange={(e) =>
            onChange({ ...transform, zoom: Number(e.target.value) })
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
          value={transform.x}
          onChange={(e) =>
            onChange({ ...transform, x: Number(e.target.value) })
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
          value={transform.y}
          onChange={(e) =>
            onChange({ ...transform, y: Number(e.target.value) })
          }
        />
      </label>
      <button type="button" className="btn btn--ghost" onClick={onReset}>
        Reset crop
      </button>
    </fieldset>
  )
}

/** Virtual Hackathon share-card studio — mirrors Builders' Lab UX. */
export function HackathonStudio() {
  const [name, setName] = useState('')
  const [project, setProject] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>(
    defaultPhotoTransform,
  )
  const [projectImageUrl, setProjectImageUrl] = useState<string | null>(null)
  const [projectImageTransform, setProjectImageTransform] =
    useState<PhotoTransform>(defaultPhotoTransform)
  const [fontsReady, setFontsReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [shareSheet, setShareSheet] = useState<ShareSheetState | null>(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [shareSupported] = useState(() => canShareFiles())
  const [saveOverlay, setSaveOverlay] = useState<{
    url: string
    filename: string
  } | null>(null)
  /** Pre-rendered PNG File for the current inputs (null while stale). */
  const exportFileRef = useRef<File | null>(null)
  /** Serialises html-to-image renders (prewarm + click fallbacks). */
  const renderChainRef = useRef<Promise<unknown>>(Promise.resolve())

  const cardRef = useRef<HTMLDivElement>(null)
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const projectImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    waitForFonts().then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'IDEEZA Virtual Hackathon — Share Card'
    setOrCreateMeta(
      'name',
      'description',
      'Create your IDEEZA Virtual Hackathon share card. 160,000 ETB in prizes — public vote decides. Download a crisp 1080×1350 PNG.',
    )
    setOrCreateMeta(
      'property',
      'og:title',
      'IDEEZA Virtual Hackathon — Share Card',
    )
    setOrCreateMeta(
      'property',
      'og:description',
      "I'm building in the IDEEZA Virtual Hackathon. 160,000 ETB in prizes. Public vote decides. Join at www.ideeza.com",
    )
    setOrCreateMeta('property', 'og:type', 'website')
    setOrCreateMeta('name', 'twitter:card', 'summary_large_image')
    setOrCreateMeta(
      'name',
      'twitter:title',
      'IDEEZA Virtual Hackathon — Share Card',
    )
    setOrCreateMeta(
      'name',
      'twitter:description',
      'Create and download your Virtual Hackathon share card. Nothing uploaded — all client-side.',
    )

    return () => {
      document.title = prevTitle
      document
        .querySelectorAll(`meta[data-ideeza="${META_MARK}"]`)
        .forEach((m) => m.remove())
    }
  }, [])

  useEffect(() => {
    const el = previewViewportRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w <= 0) return
      setPreviewScale(Math.min(1, w / hackathonLayout.width))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onPhotoChange = async (file: File | null) => {
    if (!file) {
      setPhotoUrl(null)
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setPhotoUrl(dataUrl)
    setPhotoTransform(defaultPhotoTransform())
  }

  const onProjectImageChange = async (file: File | null) => {
    if (!file) {
      setProjectImageUrl(null)
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setProjectImageUrl(dataUrl)
    setProjectImageTransform(defaultPhotoTransform())
  }

  const filename = `ideeza-hackathon-${(name || 'card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)}.png`

  /** Render the live card to a PNG data URL (queued behind any in-flight render). */
  const renderNow = useCallback((): Promise<string | null> => {
    const run = async () => {
      if (!cardRef.current) return null
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
    }
    const next = renderChainRef.current.then(run, run)
    renderChainRef.current = next.catch(() => null)
    return next
  }, [])

  const runExport = useCallback(async () => {
    setExporting(true)
    setStatus('Rendering card…')
    try {
      return await renderNow()
    } finally {
      setExporting(false)
    }
  }, [renderNow])

  const buildFile = useCallback(async (): Promise<File> => {
    const dataUrl = await renderNow()
    if (!dataUrl) throw new Error('Card not ready')
    return dataUrlToPngFile(dataUrl, filename)
  }, [renderNow, filename])

  // Pre-render the PNG ~250ms after any change so Download/Share can hand the
  // File to navigator.share synchronously inside the click (iOS requirement).
  useEffect(() => {
    exportFileRef.current = null
    if (!fontsReady) return
    let cancelled = false
    const id = window.setTimeout(() => {
      buildFile()
        .then((file) => {
          if (!cancelled) exportFileRef.current = file
        })
        .catch((err) => console.warn('PNG prewarm failed', err))
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [
    fontsReady,
    buildFile,
    name,
    project,
    photoUrl,
    photoTransform,
    projectImageUrl,
    projectImageTransform,
  ])

  const openSaveOverlay = (url: string) => {
    setSaveOverlay((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { url, filename }
    })
  }

  const onShareError = (err: unknown) => {
    console.error(err)
    setToast('Sharing failed — long-press the image to save it instead.')
  }

  const reportResult = (result: DeliverResult) => {
    if (result === 'shared') setStatus('Card ready — choose Save Image or an app.')
    else if (result === 'downloaded') setStatus('Downloaded PNG (1080×1350).')
    else if (result === 'overlay' || result === 'popup')
      setStatus('Long-press the image and tap Save Image (or Add to Photos).')
    else if (result === 'cancelled') setStatus(null)
    else if (result === 'error') {
      setStatus(null)
      setToast('Export failed. Try again or use another browser.')
    }
  }

  /**
   * Deliver the card PNG. With a pre-rendered File this is fully synchronous
   * (navigator.share is called in the click turn); otherwise renders first.
   */
  const deliver = (preferShare?: boolean) => {
    const title = 'My IDEEZA Virtual Hackathon card'
    const cached = exportFileRef.current
    if (cached) {
      reportResult(
        deliverPngFileSync({
          file: cached,
          title,
          text: title,
          preferShare,
          onOverlay: openSaveOverlay,
          onShareError,
        }),
      )
      return
    }
    setExporting(true)
    setStatus('Rendering card…')
    void deliverPngFileWhenReady({
      getFile: buildFile,
      title,
      text: title,
      preferShare,
      onOverlay: openSaveOverlay,
    })
      .then(reportResult)
      .catch((err) => {
        console.error(err)
        reportResult('error')
      })
      .finally(() => setExporting(false))
  }

  // Touch/iOS → share sheet (Save Image); desktop → <a download>.
  const onDownload = () => deliver()

  const onShare = () => deliver(true)

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

  const sharePostText = shareSheet
    ? buildHackathonPostText(shareSheet.platform, { name, project })
    : ''

  return (
    <div className="app">
      <header className="app__header">
        <img
          className="app__brand"
          src="/logos/logo_ideeza.png"
          alt="IDEEZA"
        />
        <div>
          <h1>Virtual Hackathon</h1>
          <p>Share cards · 160,000 ETB prizes · Public vote decides</p>
        </div>
      </header>

      <div className="app__layout">
        <form
          className="app__form"
          onSubmit={(e) => {
            e.preventDefault()
            onDownload()
          }}
        >
          <label className="field">
            <span>Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              maxLength={48}
            />
          </label>

          <label className="field">
            <span>Project name + one-line pitch</span>
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Project name — one-line pitch"
              maxLength={100}
            />
          </label>

          <label className="field">
            <span>Your photo</span>
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
            <CropControls
              legend="Adjust photo"
              transform={photoTransform}
              onChange={setPhotoTransform}
              onReset={() => setPhotoTransform(defaultPhotoTransform())}
            />
          )}

          <label className="field">
            <span>Project image</span>
            <input
              ref={projectImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                void onProjectImageChange(e.target.files?.[0] ?? null)
              }}
            />
          </label>

          {projectImageUrl && (
            <CropControls
              legend="Adjust project image"
              transform={projectImageTransform}
              onChange={setProjectImageTransform}
              onReset={() => setProjectImageTransform(defaultPhotoTransform())}
            />
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
                onClick={onShare}
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
            className="app__preview-viewport app__preview-viewport--hackathon"
            ref={previewViewportRef}
            style={{
              height: hackathonLayout.height * previewScale,
            }}
          >
            <div
              className="app__preview-scale"
              style={{
                width: hackathonLayout.width,
                height: hackathonLayout.height,
                transform: `scale(${previewScale})`,
              }}
            >
              <HackathonCard
                state={{
                  name,
                  project,
                  photoUrl,
                  photoTransform,
                  projectImageUrl,
                  projectImageTransform,
                }}
                cardRef={cardRef}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="app__footer">
        <span>IDEEZA</span>
        <span aria-hidden>·</span>
        <span>Virtual Hackathon</span>
        <span aria-hidden>·</span>
        <a className="app__footer-link" href="/">
          Builders&apos; Lab cards
        </a>
      </footer>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {saveOverlay && (
        <SaveImageOverlay
          imageUrl={saveOverlay.url}
          filename={saveOverlay.filename}
          onClose={() => {
            URL.revokeObjectURL(saveOverlay.url)
            setSaveOverlay(null)
          }}
        />
      )}

      {shareSheet && (
        <ShareSheet
          platform={shareSheet.platform}
          fields={{ role: 'builder', name, sub: project }}
          postText={sharePostText}
          imageDataUrl={shareSheet.imageDataUrl}
          filename={filename}
          onClose={() => setShareSheet(null)}
        />
      )}
    </div>
  )
}
