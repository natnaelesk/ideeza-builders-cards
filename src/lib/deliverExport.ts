/**
 * Ported from the socialcard iOS Download hotfix (74d614a).
 * iOS-safe PNG delivery: pre-rendered File + sync navigator.share in the
 * user gesture; desktop uses <a download>; fallback overlay / popup.
 */

export function isLikelyIosOrMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const touch = navigator.maxTouchPoints > 1
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && touch)
  const android = /Android/i.test(ua)
  const small =
    typeof window !== 'undefined' &&
    Math.min(window.innerWidth, window.innerHeight) < 900
  return iOS || android || (touch && small)
}

export function canShareFile(file: File): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return false
    }
    if (typeof navigator.canShare === 'function') {
      return Boolean(navigator.canShare({ files: [file] }))
    }
    // Older WebKit: share exists, canShare may not — try files anyway on mobile
    return isLikelyIosOrMobile()
  } catch {
    return false
  }
}

/** data: URL (from html-to-image) → PNG File. */
export async function dataUrlToPngFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: 'image/png' })
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: 'image/png' })
}

/** Desktop: <a download> with blob URL (DOM append + delayed revoke). */
export function downloadBlobFile(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  window.setTimeout(() => {
    a.remove()
    URL.revokeObjectURL(url)
  }, 2_000)
}

export type DeliverResult =
  | 'shared'
  | 'downloaded'
  | 'overlay'
  | 'popup'
  | 'cancelled'
  | 'error'

/**
 * Deliver a pre-built PNG File.
 * MUST be called directly from a user gesture when sharing — no await before share.
 */
export function deliverPngFileSync(opts: {
  file: File
  title?: string
  text?: string
  /** Prefer share on mobile even if desktop-sized viewport */
  preferShare?: boolean
  onOverlay: (objectUrl: string) => void
  /** Called when share rejects with a non-abort error (after the overlay opens). */
  onShareError?: (err: unknown) => void
}): DeliverResult {
  const { file, title, text, preferShare, onOverlay, onShareError } = opts
  const wantShare = preferShare ?? isLikelyIosOrMobile()

  if (wantShare && canShareFile(file)) {
    const payload: ShareData = {
      files: [file],
      title: title || file.name,
      text: text || title || file.name,
    }
    try {
      // Fire share in the same turn as the click — do not await before calling.
      const p = navigator.share(payload)
      void p.catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        // Share failed after gesture — overlay fallback
        const url = URL.createObjectURL(file)
        onOverlay(url)
        onShareError?.(err)
      })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // fall through
    }
  }

  if (!wantShare) {
    try {
      downloadBlobFile(file)
      return 'downloaded'
    } catch {
      /* fall through to overlay */
    }
  }

  // Mobile without share, or download failed: try sync popup, else overlay
  let popup: Window | null = null
  try {
    popup = window.open('', '_blank')
  } catch {
    popup = null
  }

  const url = URL.createObjectURL(file)
  if (popup && !popup.closed) {
    try {
      popup.document.write(buildSaveHtml(url, file.name))
      popup.document.close()
      return 'popup'
    } catch {
      try {
        popup.close()
      } catch {
        /* ignore */
      }
    }
  }

  onOverlay(url)
  return 'overlay'
}

function buildSaveHtml(objectUrl: string, name: string): string {
  const safe = name.replace(/[<>&"]/g, '')
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${safe}</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#1a0a3e;color:#fff;display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;min-height:100dvh;box-sizing:border-box}
img{max-width:100%;height:auto;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.35)}
p{margin:0;text-align:center;font-size:15px;line-height:1.4;opacity:.95;max-width:28rem}
</style></head><body>
<p><strong>Long-press the image</strong> and tap <strong>Save Image</strong> (or Add to Photos).</p>
<img src="${objectUrl}" alt="${safe}" width="1080" height="1350"/>
</body></html>`
}

/** Async path when the File is not ready yet — open popup sync first if possible. */
export async function deliverPngFileWhenReady(opts: {
  getFile: () => Promise<File>
  title?: string
  text?: string
  preferShare?: boolean
  onOverlay: (objectUrl: string) => void
}): Promise<DeliverResult> {
  const wantShare = opts.preferShare ?? isLikelyIosOrMobile()
  // Open popup synchronously in case we need it after await
  let popup: Window | null = null
  if (wantShare) {
    try {
      popup = window.open('', '_blank')
    } catch {
      popup = null
    }
  }

  let file: File
  try {
    file = await opts.getFile()
  } catch {
    try {
      popup?.close()
    } catch {
      /* ignore */
    }
    return 'error'
  }

  // Prefer share if still usable (gesture may be gone — share often still works on iOS if called soon)
  if (wantShare && canShareFile(file)) {
    try {
      popup?.close()
    } catch {
      /* ignore */
    }
    try {
      await navigator.share({
        files: [file],
        title: opts.title || file.name,
        text: opts.text || opts.title || file.name,
      })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }

  if (!wantShare) {
    try {
      popup?.close()
    } catch {
      /* ignore */
    }
    downloadBlobFile(file)
    return 'downloaded'
  }

  const url = URL.createObjectURL(file)
  if (popup && !popup.closed) {
    try {
      popup.document.write(buildSaveHtml(url, file.name))
      popup.document.close()
      return 'popup'
    } catch {
      try {
        popup.close()
      } catch {
        /* ignore */
      }
    }
  }

  opts.onOverlay(url)
  return 'overlay'
}
