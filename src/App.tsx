import { useCallback, useEffect, useRef, useState } from 'react'
import { ShareCard } from './components/ShareCard'
import { cardLayout, ROLE_ORDER, type RoleId } from './config/cardLayout'
import {
  canShareFiles,
  dataUrlToFile,
  downloadDataUrl,
  renderCardPng,
  shareCardFile,
} from './lib/exportCard'
import { waitForFonts } from './lib/fonts'
import {
  defaultPhotoTransform,
  type CardFormState,
  type PhotoTransform,
} from './types'
import './App.css'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const SAMPLE: Record<
  RoleId,
  { name: string; sub: string }
> = {
  builder: {
    name: 'Hana Tadesse',
    sub: 'SoilSense — moisture intel for small farms',
  },
  mentor: {
    name: 'Sara Bekele',
    sub: 'Hardware Lead, Acme Labs',
  },
  judge: {
    name: 'Meron Alemu',
    sub: 'Partner, Addis Ventures',
  },
}

export default function App() {
  const [role, setRole] = useState<RoleId>('builder')
  const roleCfg = cardLayout.roles[role]

  const [name, setName] = useState(SAMPLE.builder.name)
  const [sub, setSub] = useState(SAMPLE.builder.sub)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [badgeUrl, setBadgeUrl] = useState<string | null>(null)
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>(
    defaultPhotoTransform,
  )
  const [fontsReady, setFontsReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState(0.32)
  const [shareSupported, setShareSupported] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const previewWrapRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const badgeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    waitForFonts().then(() => setFontsReady(true))
    setShareSupported(canShareFiles())
  }, [])

  useEffect(() => {
    const el = previewWrapRef.current
    if (!el) return
    const update = () => {
      const pad = 24
      const w = el.clientWidth - pad
      const scale = Math.min(1, Math.max(0.22, w / cardLayout.width))
      setPreviewScale(scale)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onRoleChange = (next: RoleId) => {
    setRole(next)
    setName(SAMPLE[next].name)
    setSub(SAMPLE[next].sub)
    setBadgeUrl(null)
    if (badgeInputRef.current) badgeInputRef.current.value = ''
  }

  const onPhotoChange = async (file: File | null) => {
    if (!file) {
      setPhotoUrl(null)
      return
    }
    // Data URL so html-to-image embeds the photo reliably
    const dataUrl = await readFileAsDataUrl(file)
    setPhotoUrl(dataUrl)
    setPhotoTransform(defaultPhotoTransform())
  }

  const onBadgeChange = async (file: File | null) => {
    if (!file) {
      setBadgeUrl(null)
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setBadgeUrl(dataUrl)
  }

  const state: CardFormState = {
    role,
    name,
    sub,
    photoUrl,
    photoTransform,
    badgeUrl,
  }

  const filename = `ideeza-${role}-${(name || 'card')
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
      // Ensure images inside the card are decoded before capture
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
      const title = `My IDEEZA Builders' Lab 2.0 ${role} card`
      const shared = await shareCardFile(file, title)
      if (shared) {
        setStatus('Shared!')
      } else {
        downloadDataUrl(dataUrl, filename)
        setStatus('Share not available — downloaded instead.')
      }
    } catch (err) {
      // User cancelled share sheet — not an error
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus(null)
        return
      }
      console.error(err)
      setStatus('Share failed. Try downloading instead.')
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <img
          className="app__brand"
          src={cardLayout.logos.ideaza}
          alt="IDEEZA"
        />
        <div>
          <h1>Builders&apos; Lab 2.0</h1>
          <p>Pitch Day share cards · Sat, Oct 10 · 6 Kilo, Addis Ababa</p>
        </div>
      </header>

      <section className="app__roles" aria-label="Choose your role">
        {ROLE_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`app__role${role === id ? ' is-active' : ''}`}
            onClick={() => onRoleChange(id)}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
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
            <span>{roleCfg.nameLabel}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={roleCfg.namePlaceholder}
              autoComplete="name"
              maxLength={48}
            />
          </label>

          <label className="field">
            <span>{roleCfg.subLabel}</span>
            <input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder={roleCfg.subPlaceholder}
              maxLength={80}
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
            <fieldset className="field field--adjust">
              <legend>Adjust photo</legend>
              <label>
                Zoom
                <input
                  type="range"
                  min={1}
                  max={2.5}
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
                  min={-40}
                  max={40}
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
                  min={-40}
                  max={40}
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

          <label className="field">
            <span>{roleCfg.badgeUploadLabel}</span>
            <input
              ref={badgeInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                void onBadgeChange(e.target.files?.[0] ?? null)
              }}
            />
          </label>

          <div className="app__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={exporting || !fontsReady}
            >
              {exporting ? 'Rendering…' : 'Download PNG'}
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
            Export is a crisp 1080×1350 PNG.
          </p>
        </form>

        <div className="app__preview" ref={previewWrapRef}>
          <div className="app__preview-label">Live preview</div>
          <div
            className="app__preview-stage"
            style={{
              width: cardLayout.width * previewScale,
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
        <span>Women Techmakers Ethiopia</span>
        <span aria-hidden>·</span>
        <span>FCA Creators Hub</span>
      </footer>
    </div>
  )
}
