import { useEffect, useId } from 'react'
import './SaveImageOverlay.css'

export interface SaveImageOverlayProps {
  /** Object URL or data URL of the PNG */
  imageUrl: string
  filename: string
  onClose: () => void
}

export function SaveImageOverlay({
  imageUrl,
  filename,
  onClose,
}: SaveImageOverlayProps) {
  const titleId = useId()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="save-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="save-overlay__panel">
        <header className="save-overlay__header">
          <h2 id={titleId}>Save your badge</h2>
          <button
            type="button"
            className="save-overlay__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <p className="save-overlay__hint">
          Long-press the image and tap <strong>Save Image</strong> (or Add to
          Photos).
        </p>
        <img
          className="save-overlay__img"
          src={imageUrl}
          alt={filename}
          width={1080}
          height={1440}
          draggable
        />
      </div>
    </div>
  )
}
