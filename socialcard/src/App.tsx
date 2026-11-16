import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DownloadIcon,
  InstagramIcon,
  LinkedInIcon,
  MoreIcon,
  ShareIcon,
  XIcon,
} from './components/BrandIcons'
import { InstagramSheet } from './components/InstagramSheet'
import { SaveImageOverlay } from './components/SaveImageOverlay'
import { ShareCard, type ShareCardHandle } from './components/ShareCard'
import { ShareSheet } from './components/ShareSheet'
import { Toast } from './components/Toast'
import { CARD_HEIGHT, CARD_WIDTH, EVENT_DATES, UNIVERSITY } from './config/event'
import { modalCopy } from './config/shareText'
import {
  blobToFile,
  canvasToPngBlob,
  deliverPngFileSync,
  deliverPngFileWhenReady,
} from './lib/deliverExport'
import { canShareFiles } from './lib/exportCard'
import { renderPostFromCard, renderStoryFromCard } from './lib/exportFormats'
import { focusTransformForPhoto } from './lib/faceFocus'
import { waitForFonts } from './lib/fonts'
import {
  clampTransform,
  inPhotoWindowLocal,
  liveClampTransform,
} from './lib/photoCover'
import { cardToWindowLocal, clientToCard } from './lib/photoHit'
import type { SocialPlatform } from './lib/socialShare'
import {
  defaultPhotoTransform,
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

type PointerMode = 'idle' | 'drag' | 'pinch'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadNaturalSize(
  src: string,
): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
      })
    img.onerror = () => reject(new Error('photo size load failed'))
    img.src = src
  })
}

export default function App() {
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(
    null,
  )
  const [photoTransform, setPhotoTransform] = useState<PhotoTransform>(
    defaultPhotoTransform,
  )
  const [fontsReady, setFontsReady] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [shareSheet, setShareSheet] = useState<ShareSheetState | null>(null)
  const [igOpen, setIgOpen] = useState(false)
  const [igHint, setIgHint] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [previewScale, setPreviewScale] = useState(1)
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 })
  const [shareSupported] = useState(() => canShareFiles())
  const [vvBottom, setVvBottom] = useState(0)
  const [vvShrink, setVvShrink] = useState(0)
  const [layoutMode, setLayoutMode] = useState<'mobile' | 'desktop'>('mobile')
  const [saveOverlay, setSaveOverlay] = useState<{
    url: string
    filename: string
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shareCardRef = useRef<ShareCardHandle>(null)
  const previewAreaRef = useRef<HTMLDivElement>(null)
  const previewViewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  /** Pre-rendered PNG Files — ready for sync navigator.share in the click gesture */
  const exportFilesRef = useRef<{
    card: File | null
    story: File | null
    post: File | null
  }>({ card: null, story: null, post: null })
  const exportWarmGenRef = useRef(0)

  const transformRef = useRef(photoTransform)
  const liveTransformRef = useRef(photoTransform)
  const photoSizeRef = useRef(photoSize)
  const previewScaleRef = useRef(previewScale)
  const layoutModeRef = useRef(layoutMode)
  const rafDrawRef = useRef(0)
  const zoomUiRef = useRef<HTMLSpanElement>(null)

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const modeRef = useRef<PointerMode>('idle')
  const dragLastLocalRef = useRef<{ lx: number; ly: number } | null>(null)
  const pinchStartRef = useRef<{
    dist: number
    zoom: number
    midLx: number
    midLy: number
    ox: number
    oy: number
  } | null>(null)

  useEffect(() => {
    transformRef.current = photoTransform
    liveTransformRef.current = photoTransform
  }, [photoTransform])
  useEffect(() => {
    photoSizeRef.current = photoSize
  }, [photoSize])
  useEffect(() => {
    previewScaleRef.current = previewScale
  }, [previewScale])
  useEffect(() => {
    layoutModeRef.current = layoutMode
  }, [layoutMode])

  const scheduleLiveDraw = useCallback(() => {
    if (rafDrawRef.current) return
    rafDrawRef.current = requestAnimationFrame(() => {
      rafDrawRef.current = 0
      shareCardRef.current?.drawLive(liveTransformRef.current)
      if (zoomUiRef.current) {
        zoomUiRef.current.textContent = `${liveTransformRef.current.zoom.toFixed(1)}×`
      }
    })
  }, [])

  const commitLiveTransform = useCallback(() => {
    const size = photoSizeRef.current
    const raw = liveTransformRef.current
    const next = size ? clampTransform(raw, size.w, size.h) : raw
    liveTransformRef.current = next
    transformRef.current = next
    setPhotoTransform(next)
  }, [])

  useEffect(() => {
    waitForFonts().then(() => setFontsReady(true))
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const sync = () => setLayoutMode(mq.matches ? 'desktop' : 'mobile')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moreOpen])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      // Real keyboard: visual viewport shrinks vs layout viewport.
      const shrink = Math.max(0, window.innerHeight - vv.height)
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setVvShrink(shrink)
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

  // Only collapse the sheet when the viewport is actually reduced (real keyboard).
  const keyboardOpen = vvShrink > 120

  useEffect(() => {
    const area = previewAreaRef.current
    const sheet = sheetRef.current
    if (!area) return
    const update = () => {
      // Hint row always reserved (even when invisible) — use min-height
      const hint = area.querySelector('.app__photo-hint') as HTMLElement | null
      const hintH = hint ? Math.max(hint.offsetHeight, 18) + 4 : 0
      // border-box: clientWidth/Height include padding — subtract it.
      const cs = getComputedStyle(area)
      const padX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
      const padY =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
      const availW = Math.max(0, area.clientWidth - padX)
      const availH = Math.max(0, area.clientHeight - padY - hintH)
      if (availW <= 0 || availH <= 0) return
      const scale = Math.max(
        0.12,
        Math.min(1, availW / CARD_WIDTH, availH / CARD_HEIGHT),
      )
      setPreviewScale(scale)
      setFrameSize({
        w: Math.round(CARD_WIDTH * scale),
        h: Math.round(CARD_HEIGHT * scale),
      })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(area)
    if (sheet) ro.observe(sheet)
    return () => ro.disconnect()
  }, [vvBottom, keyboardOpen, photoUrl])

  // Non-passive touchmove lock while dragging on the card
  useEffect(() => {
    const vp = previewViewportRef.current
    if (!vp) return
    const block = (e: TouchEvent) => {
      if (modeRef.current !== 'idle') e.preventDefault()
    }
    vp.addEventListener('touchmove', block, { passive: false })
    return () => vp.removeEventListener('touchmove', block)
  }, [])

  const applyClamped = useCallback(
    (next: PhotoTransform | ((prev: PhotoTransform) => PhotoTransform)) => {
      setPhotoTransform((prev) => {
        const proposed = typeof next === 'function' ? next(prev) : next
        const size = photoSizeRef.current
        if (!size) return proposed
        return clampTransform(proposed, size.w, size.h)
      })
    },
    [],
  )

  // Test/screenshot helpers (used by scripts/screenshots.mjs)
  useEffect(() => {
    const api = {
      getTransform: () => transformRef.current,
      setTransform: (t: PhotoTransform) => applyClamped(t),
      getCardCanvas: () => canvasRef.current,
      getPhotoSize: () => photoSizeRef.current,
      /** Simulate a real keyboard: shrink = innerHeight − visualViewport.height */
      setViewportShrink: (shrinkPx: number) => {
        const shrink = Math.max(0, shrinkPx)
        setVvShrink(shrink)
        setVvBottom(shrink)
      },
    }
    ;(window as unknown as { __badgeDebug?: typeof api }).__badgeDebug = api
    return () => {
      delete (window as unknown as { __badgeDebug?: typeof api }).__badgeDebug
    }
  }, [applyClamped])

  const onPhotoChange = async (file: File | null) => {
    if (!file) {
      setPhotoUrl(null)
      setPhotoSize(null)
      setPhotoTransform(defaultPhotoTransform())
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    const size = await loadNaturalSize(dataUrl)
    setPhotoSize(size)
    setPhotoUrl(dataUrl)
    const focus = await focusTransformForPhoto(dataUrl)
    setPhotoTransform(clampTransform(focus, size.w, size.h))
  }

  const resetPhoto = () => {
    const base = defaultPhotoTransform()
    const size = photoSizeRef.current
    setPhotoTransform(size ? clampTransform(base, size.w, size.h) : base)
  }

  const state: CardFormState = {
    name,
    photoUrl,
    photoTransform,
  }

  const slug = (name || 'card')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const filename = `vibe-builders-badge-${slug}.png`
  const storyFilename = `vibe-builders-story-${slug}.png`
  const postFilename = `vibe-builders-post-${slug}.png`

  const ensureCardReady = useCallback(async () => {
    if (!canvasRef.current) return null
    await waitForFonts()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    return canvasRef.current
  }, [])

  const openSaveOverlay = useCallback((url: string, name: string) => {
    setSaveOverlay((prev) => {
      if (prev?.url.startsWith('blob:')) URL.revokeObjectURL(prev.url)
      return { url, filename: name }
    })
  }, [])

  const closeSaveOverlay = useCallback(() => {
    setSaveOverlay((prev) => {
      if (prev?.url.startsWith('blob:')) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  const buildCardFile = useCallback(async (): Promise<File> => {
    const canvas = await ensureCardReady()
    if (!canvas) throw new Error('canvas not ready')
    const blob = await canvasToPngBlob(canvas)
    return blobToFile(blob, filename)
  }, [ensureCardReady, filename])

  const buildStoryFile = useCallback(async (): Promise<File> => {
    const canvas = await ensureCardReady()
    if (!canvas) throw new Error('canvas not ready')
    const story = renderStoryFromCard(canvas)
    const blob = await canvasToPngBlob(story)
    return blobToFile(blob, storyFilename)
  }, [ensureCardReady, storyFilename])

  const buildPostFile = useCallback(async (): Promise<File> => {
    const canvas = await ensureCardReady()
    if (!canvas) throw new Error('canvas not ready')
    const post = renderPostFromCard(canvas)
    const blob = await canvasToPngBlob(post)
    return blobToFile(blob, postFilename)
  }, [ensureCardReady, postFilename])

  // Pre-render export PNGs whenever the card settles (debounced).
  useEffect(() => {
    if (!fontsReady) return
    const gen = ++exportWarmGenRef.current
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const card = await buildCardFile()
          if (gen !== exportWarmGenRef.current) return
          let story: File | null = null
          let post: File | null = null
          try {
            story = await buildStoryFile()
            post = await buildPostFile()
          } catch {
            /* story/post optional for warm cache */
          }
          if (gen !== exportWarmGenRef.current) return
          exportFilesRef.current = { card, story, post }
        } catch (err) {
          console.warn('export warm failed', err)
        }
      })()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [
    fontsReady,
    name,
    photoUrl,
    photoTransform,
    buildCardFile,
    buildStoryFile,
    buildPostFile,
  ])

  const reportDeliver = (
    result: string,
    okMsg: string,
    failToast = 'Couldn’t save the image. Try again.',
  ) => {
    if (result === 'shared') setStatus(okMsg)
    else if (result === 'downloaded') setStatus(okMsg)
    else if (result === 'overlay' || result === 'popup') {
      setStatus('Long-press the image to save it.')
    } else if (result === 'cancelled') setStatus(null)
    else {
      setToast(failToast)
      setStatus(null)
    }
  }

  /** Download PNG — share sync on iOS when File is pre-warmed. */
  const onDownload = () => {
    const cached = exportFilesRef.current.card
    const title = `My Vibe Builders badge — ${UNIVERSITY}`
    if (cached) {
      const result = deliverPngFileSync({
        file: cached,
        title,
        text: title,
        onOverlay: (url) => openSaveOverlay(url, filename),
      })
      reportDeliver(result, 'PNG ready (1080×1440).')
      return
    }
    setExporting(true)
    setStatus('Rendering card…')
    void deliverPngFileWhenReady({
      getFile: buildCardFile,
      title,
      text: title,
      onOverlay: (url) => openSaveOverlay(url, filename),
    })
      .then((result) => {
        if (result !== 'error') {
          void buildCardFile().then((f) => {
            exportFilesRef.current.card = f
          })
        }
        reportDeliver(result, 'PNG ready (1080×1440).')
      })
      .finally(() => setExporting(false))
  }

  const onNativeShare = () => {
    setMoreOpen(false)
    onDownload()
  }

  const onSocialShare = async (platform: SocialPlatform) => {
    setMoreOpen(false)
    try {
      setStatus(modalCopy.preparing)
      const file = exportFilesRef.current.card ?? (await buildCardFile())
      exportFilesRef.current.card = file
      const dataUrl = URL.createObjectURL(file)
      // ShareSheet still expects a displayable URL — convert via FileReader-ish
      const reader = new FileReader()
      const dataUrlStr = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      URL.revokeObjectURL(dataUrl)
      setStatus(null)
      setShareSheet({ platform, imageDataUrl: dataUrlStr })
    } catch (err) {
      console.error(err)
      setStatus(null)
      setToast(modalCopy.prepareError)
    }
  }

  const onIgStory = () => {
    setIgHint(null)
    const title = `My Vibe Builders Story — ${UNIVERSITY}`
    const cached = exportFilesRef.current.story
    if (cached) {
      const result = deliverPngFileSync({
        file: cached,
        title,
        text: title,
        preferShare: true,
        onOverlay: (url) => openSaveOverlay(url, storyFilename),
      })
      if (result === 'shared') {
        setIgHint('Shared — choose Instagram → Story')
        setStatus('Story ready (1080×1920).')
      } else if (result === 'overlay' || result === 'popup') {
        setIgHint('Long-press the image → Save, then Instagram → Story')
      } else if (result === 'error') {
        setIgHint('Couldn’t prepare Story. Try again.')
        setToast('Couldn’t prepare Story. Try again.')
      }
      return
    }
    setExporting(true)
    void deliverPngFileWhenReady({
      getFile: buildStoryFile,
      title,
      text: title,
      preferShare: true,
      onOverlay: (url) => openSaveOverlay(url, storyFilename),
    })
      .then((result) => {
        if (result === 'shared' || result === 'downloaded') {
          void buildStoryFile().then((f) => {
            exportFilesRef.current.story = f
          })
          setIgHint('Shared — choose Instagram → Story')
          setStatus('Story ready (1080×1920).')
        } else if (result === 'overlay' || result === 'popup') {
          setIgHint('Long-press the image → Save, then Instagram → Story')
        } else if (result === 'error') {
          setIgHint('Couldn’t prepare Story. Try again.')
          setToast('Couldn’t prepare Story. Try again.')
        }
      })
      .finally(() => setExporting(false))
  }

  const onIgPost = () => {
    setIgHint(null)
    const title = `My Vibe Builders badge — ${UNIVERSITY}`
    const cached = exportFilesRef.current.post
    if (cached) {
      const result = deliverPngFileSync({
        file: cached,
        title,
        text: title,
        preferShare: true,
        onOverlay: (url) => openSaveOverlay(url, postFilename),
      })
      if (result === 'shared') {
        setIgHint('Shared — choose Instagram → Post')
        setStatus('Post ready (1080×1440).')
      } else if (result === 'overlay' || result === 'popup') {
        setIgHint('Long-press the image → Save, then Instagram → Post')
      } else if (result === 'error') {
        setIgHint('Couldn’t prepare Post. Try again.')
        setToast('Couldn’t prepare Post. Try again.')
      }
      return
    }
    setExporting(true)
    void deliverPngFileWhenReady({
      getFile: buildPostFile,
      title,
      text: title,
      preferShare: true,
      onOverlay: (url) => openSaveOverlay(url, postFilename),
    })
      .then((result) => {
        if (result === 'shared' || result === 'downloaded') {
          void buildPostFile().then((f) => {
            exportFilesRef.current.post = f
          })
          setIgHint('Shared — choose Instagram → Post')
          setStatus('Post ready (1080×1440).')
        } else if (result === 'overlay' || result === 'popup') {
          setIgHint('Long-press the image → Save, then Instagram → Post')
        } else if (result === 'error') {
          setIgHint('Couldn’t prepare Post. Try again.')
          setToast('Couldn’t prepare Post. Try again.')
        }
      })
      .finally(() => setExporting(false))
  }

  const clientToLocal = (clientX: number, clientY: number) => {
    const vp = previewViewportRef.current
    if (!vp) return null
    const rect = vp.getBoundingClientRect()
    const card = clientToCard(
      clientX,
      clientY,
      rect,
      previewScaleRef.current,
      layoutModeRef.current,
    )
    return cardToWindowLocal(card.x, card.y)
  }

  const onHitPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!photoUrl) return
    const local = clientToLocal(e.clientX, e.clientY)
    if (!local || !inPhotoWindowLocal(local.lx, local.ly, 6)) return

    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    liveTransformRef.current = transformRef.current

    if (pointersRef.current.size === 1) {
      modeRef.current = 'drag'
      dragLastLocalRef.current = local
      pinchStartRef.current = null
    } else if (pointersRef.current.size === 2) {
      modeRef.current = 'pinch'
      const pts = [...pointersRef.current.values()]
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      const dist = Math.hypot(dx, dy) || 1
      const mid = clientToLocal(
        (pts[0].x + pts[1].x) / 2,
        (pts[0].y + pts[1].y) / 2,
      )
      const t = liveTransformRef.current
      pinchStartRef.current = {
        dist,
        zoom: t.zoom,
        midLx: mid?.lx ?? 0,
        midLy: mid?.ly ?? 0,
        ox: t.ox,
        oy: t.oy,
      }
      dragLastLocalRef.current = null
    }
  }

  const onHitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    e.preventDefault()
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const size = photoSizeRef.current

    if (modeRef.current === 'drag' && pointersRef.current.size === 1) {
      const local = clientToLocal(e.clientX, e.clientY)
      const last = dragLastLocalRef.current
      if (!local || !last) return
      const dlx = local.lx - last.lx
      const dly = local.ly - last.ly
      dragLastLocalRef.current = local
      const prev = liveTransformRef.current
      const proposed = { ...prev, ox: prev.ox + dlx, oy: prev.oy + dly }
      liveTransformRef.current = size
        ? liveClampTransform(proposed, size.w, size.h, prev)
        : proposed
      scheduleLiveDraw()
      return
    }

    if (modeRef.current === 'pinch' && pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()]
      const dx = pts[1].x - pts[0].x
      const dy = pts[1].y - pts[0].y
      const dist = Math.hypot(dx, dy) || 1
      const start = pinchStartRef.current
      if (!start) return
      const mid = clientToLocal(
        (pts[0].x + pts[1].x) / 2,
        (pts[0].y + pts[1].y) / 2,
      )
      const ratio = dist / start.dist
      const nextZoom = Math.min(
        PHOTO_ZOOM_MAX,
        Math.max(PHOTO_ZOOM_MIN, start.zoom * ratio),
      )
      const midDx = mid ? mid.lx - start.midLx : 0
      const midDy = mid ? mid.ly - start.midLy : 0
      const prev = liveTransformRef.current
      const proposed = {
        ox: start.ox + midDx,
        oy: start.oy + midDy,
        zoom: nextZoom,
      }
      liveTransformRef.current = size
        ? liveClampTransform(proposed, size.w, size.h, prev)
        : proposed
      scheduleLiveDraw()
    }
  }

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.delete(e.pointerId)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    if (pointersRef.current.size === 0) {
      modeRef.current = 'idle'
      dragLastLocalRef.current = null
      pinchStartRef.current = null
      // Commit once — no snap; soft clamp already kept the window filled
      commitLiveTransform()
    } else if (pointersRef.current.size === 1) {
      modeRef.current = 'drag'
      pinchStartRef.current = null
      const remaining = [...pointersRef.current.values()][0]
      dragLastLocalRef.current = clientToLocal(remaining.x, remaining.y)
    }
  }

  const busy = exporting

  return (
    <div
      className={`app${keyboardOpen ? ' app--keyboard' : ''}`}
      style={{ ['--vv-bottom' as string]: `${keyboardOpen ? vvBottom : 0}px` }}
    >
      <header className="app__header">
        <img className="app__brand" src="/logos/logo_ideeza.png" alt="IDEEZA" />
        <div className="app__header-text">
          <h1>Vibe Builders</h1>
          <p className="app__header-sub">
            {UNIVERSITY} · {EVENT_DATES}
          </p>
        </div>
      </header>

      <div className="app__layout">
        <div className="app__preview" ref={previewAreaRef}>
          <div className="app__preview-label">Live preview</div>
          <div
            className="app__preview-viewport"
            ref={previewViewportRef}
            style={
              frameSize.w > 0
                ? { width: frameSize.w, height: frameSize.h }
                : undefined
            }
          >
            <div
              className="app__preview-scale"
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                ['--preview-scale' as string]: String(previewScale),
              }}
            >
              <ShareCard ref={shareCardRef} state={state} canvasRef={canvasRef} />
            </div>
            <div
              className={`app__photo-hit${photoUrl ? '' : ' is-disabled'}`}
              role="presentation"
              aria-label="Drag to reposition photo"
              onPointerDown={onHitPointerDown}
              onPointerMove={onHitPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
            />
          </div>
          <p
            className={`app__photo-hint${photoUrl ? '' : ' is-placeholder'}`}
            aria-hidden={!photoUrl}
          >
            Drag to move · pinch to zoom
          </p>
        </div>

        <div className="app__sheet" ref={sheetRef}>
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

            <div className="app__photo-row">
              <button
                type="button"
                className="btn btn--glass"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoUrl ? 'Change photo' : 'Pick photo'}
              </button>
              <button
                type="button"
                className={`btn btn--ghost btn--reset${photoUrl ? '' : ' is-placeholder'}`}
                onClick={resetPhoto}
                disabled={!photoUrl}
                aria-hidden={!photoUrl}
              >
                Reset
              </button>
            </div>

            <div className={`app__zoom${photoUrl ? '' : ' is-placeholder'}`}>
              <label className="app__zoom-label">
                <span>Zoom</span>
                <input
                  type="range"
                  min={PHOTO_ZOOM_MIN}
                  max={PHOTO_ZOOM_MAX}
                  step={0.01}
                  value={photoTransform.zoom}
                  disabled={!photoUrl}
                  onInput={(e) => {
                    const zoom = Number((e.target as HTMLInputElement).value)
                    const prev = liveTransformRef.current
                    const size = photoSizeRef.current
                    const proposed = { ...prev, zoom }
                    liveTransformRef.current = size
                      ? liveClampTransform(proposed, size.w, size.h, prev)
                      : proposed
                    scheduleLiveDraw()
                  }}
                  onChange={(e) => {
                    const zoom = Number(e.target.value)
                    const prev = liveTransformRef.current
                    liveTransformRef.current = { ...prev, zoom }
                    commitLiveTransform()
                  }}
                />
                <span className="app__zoom-val" ref={zoomUiRef}>
                  {photoTransform.zoom.toFixed(1)}×
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--download"
              disabled={busy || !fontsReady}
            >
              <DownloadIcon size={18} />
              <span>{exporting ? 'Rendering…' : 'Download PNG'}</span>
            </button>

            <div className="app__share-row">
              <button
                type="button"
                className="btn btn--pill btn--linkedin"
                disabled={busy || !fontsReady}
                onClick={() => void onSocialShare('linkedin')}
                aria-label="Share on LinkedIn"
              >
                <LinkedInIcon size={16} />
                <span>LinkedIn</span>
              </button>
              <button
                type="button"
                className="btn btn--pill btn--ig"
                disabled={busy || !fontsReady}
                onClick={() => {
                  setIgHint(null)
                  setIgOpen(true)
                }}
                aria-label="Share on Instagram"
              >
                <InstagramIcon size={16} />
                <span>Instagram</span>
              </button>
              <button
                type="button"
                className="btn btn--pill btn--x"
                disabled={busy || !fontsReady}
                onClick={() => void onSocialShare('x')}
                aria-label="Share on X"
              >
                <XIcon size={14} />
                <span>X</span>
              </button>
              <div className="app__more" ref={moreRef}>
                <button
                  type="button"
                  className="btn btn--pill btn--more"
                  disabled={busy || !fontsReady}
                  aria-label="More share options"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  <MoreIcon size={16} />
                </button>
                {moreOpen && (
                  <div className="app__more-menu" role="menu">
                    {shareSupported && (
                      <button
                        type="button"
                        role="menuitem"
                        className="app__more-item"
                        onClick={() => onNativeShare()}
                      >
                        <ShareIcon size={16} />
                        <span>Share…</span>
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      className="app__more-item"
                      onClick={() => {
                        setMoreOpen(false)
                        onDownload()
                      }}
                    >
                      <DownloadIcon size={16} />
                      <span>Download again</span>
                    </button>
                  </div>
                )}
              </div>
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

      {igOpen && (
        <InstagramSheet
          busy={busy}
          hint={igHint}
          onClose={() => setIgOpen(false)}
          onStory={() => onIgStory()}
          onPost={() => onIgPost()}
        />
      )}

      {saveOverlay && (
        <SaveImageOverlay
          imageUrl={saveOverlay.url}
          filename={saveOverlay.filename}
          onClose={closeSaveOverlay}
        />
      )}
    </div>
  )
}
