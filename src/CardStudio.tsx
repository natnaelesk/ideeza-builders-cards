import { useCallback, useEffect, useRef, useState } from 'react'
import { LinkedInIcon, XIcon } from './components/BrandIcons'
import { ShareCard } from './components/ShareCard'
import { ShareSheet } from './components/ShareSheet'
import { Toast } from './components/Toast'
import { cardLayout, ROLE_ORDER, type RoleId } from './config/cardLayout'
import { modalCopy } from './config/shareText'
import {
  canShareFiles,
  dataUrlToFile,
  downloadDataUrl,
  renderCardPng,
  shareCardFile,
} from './lib/exportCard'
import { waitForFonts } from './lib/fonts'
import {
  resolveRoleConfig,
  roleIdForShare,
  teamRoleTemplate,
  type StudioMode,
} from './lib/roleDisplay'
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

export interface CardStudioProps {
  mode: StudioMode
  /** Prefill for /team?role=Organizer */
  initialCustomRole?: string
}

export function CardStudio({ mode, initialCustomRole = '' }: CardStudioProps) {
  const isTeam = mode === 'team'

  const [role, setRole] = useState<RoleId>('builder')
  const [customRole, setCustomRole] = useState(initialCustomRole)
  const [name, setName] = useState('')
  const [sub, setSub] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [badgeUrl, setBadgeUrl] = useState<string | null>(null)
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
  const badgeInputRef = useRef<HTMLInputElement>(null)

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
    role: isTeam ? 'mentor' : role,
    customRole: isTeam ? customRole : undefined,
    name,
    sub,
    photoUrl,
    photoTransform,
    badgeUrl,
  }

  const roleCfg = isTeam
    ? { ...teamRoleTemplate, ...resolveRoleConfig(state) }
    : cardLayout.roles[role]

  const onRoleChange = (next: RoleId) => {
    setRole(next)
    setBadgeUrl(null)
    if (badgeInputRef.current) badgeInputRef.current.value = ''
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

  const onBadgeChange = async (file: File | null) => {
    if (!file) {
      setBadgeUrl(null)
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setBadgeUrl(dataUrl)
  }

  const shareRole = roleIdForShare(state)
  const filenameBase = isTeam
    ? (customRole.trim() || 'team').toLowerCase()
    : role
  const filename = `ideeza-${filenameBase}-${(name || 'card')
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
      const title = isTeam
        ? `My IDEEZA Builders' Lab 2.0 ${customRole.trim() || 'team'} card`
        : `My IDEEZA Builders' Lab 2.0 ${role} card`
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
          src={cardLayout.logos.ideaza}
          alt="IDEEZA"
        />
        <div>
          <h1>
            {isTeam ? 'Team & staff cards' : "Builders' Lab 2.0"}
          </h1>
          <p>
            {isTeam
              ? 'Custom role share cards · Pitch Day · Sat, Oct 10'
              : 'Pitch Day share cards · Sat, Oct 10 · 6 Kilo, Addis Ababa'}
          </p>
        </div>
      </header>

      {!isTeam && (
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
      )}

      <div className="app__layout">
        <form
          className="app__form"
          onSubmit={(e) => {
            e.preventDefault()
            void onDownload()
          }}
        >
          {isTeam && (
            <label className="field">
              <span>Your role</span>
              <input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Organizer, Volunteer, Speaker…"
                maxLength={32}
                autoComplete="organization-title"
              />
            </label>
          )}

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
        <span>Women Techmakers Ethiopia</span>
        <span aria-hidden>·</span>
        <span>FCA Creators Hub</span>
      </footer>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {shareSheet && (
        <ShareSheet
          platform={shareSheet.platform}
          fields={{
            role: shareRole,
            name,
            sub,
            customRole: isTeam ? customRole : undefined,
          }}
          imageDataUrl={shareSheet.imageDataUrl}
          filename={filename}
          onClose={() => setShareSheet(null)}
        />
      )}
    </div>
  )
}
