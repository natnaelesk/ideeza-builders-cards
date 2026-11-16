import { useEffect, useId, useRef } from 'react'
import { GridIcon, InstagramIcon, StoryIcon } from './BrandIcons'
import './InstagramSheet.css'

export interface InstagramSheetProps {
  busy: boolean
  onStory: () => void
  onPost: () => void
  onClose: () => void
  hint?: string | null
}

export function InstagramSheet({
  busy,
  onStory,
  onPost,
  onClose,
  hint,
}: InstagramSheetProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
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
      className="ig-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="ig-sheet__backdrop"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div className="ig-sheet__panel">
        <div className="ig-sheet__handle" aria-hidden />
        <header className="ig-sheet__header">
          <div className="ig-sheet__title-row">
            <InstagramIcon size={20} />
            <h2 id={titleId}>Share to Instagram</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ig-sheet__x"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="ig-sheet__choices">
          <button
            type="button"
            className="ig-sheet__choice"
            disabled={busy}
            onClick={onStory}
          >
            <span className="ig-sheet__choice-icon">
              <StoryIcon size={22} />
            </span>
            <span className="ig-sheet__choice-copy">
              <strong>Story</strong>
              <small>1080×1920 · card on lavender backdrop</small>
            </span>
          </button>
          <button
            type="button"
            className="ig-sheet__choice"
            disabled={busy}
            onClick={onPost}
          >
            <span className="ig-sheet__choice-icon">
              <GridIcon size={20} />
            </span>
            <span className="ig-sheet__choice-copy">
              <strong>Post</strong>
              <small>1080×1440 · full badge PNG</small>
            </span>
          </button>
        </div>

        <p className="ig-sheet__tip">
          Tip: Choose <strong>Instagram → Story</strong> (or{' '}
          <strong>→ Post</strong>) in the share sheet.
        </p>
        {hint && <p className="ig-sheet__hint">{hint}</p>}
        {busy && <p className="ig-sheet__busy">Preparing…</p>}
      </div>
    </div>
  )
}
