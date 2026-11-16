import { useEffect, useId, useRef, useState } from 'react'
import {
  formatIdeezaLinksBlock,
  modalCopy,
  type ShareFields,
} from '../config/shareText'
import { copyText } from '../lib/clipboard'
import {
  buildPostText,
  canNativeShareImage,
  getOpenUrl,
  saveCardImage,
  shareImageToApp,
  type SocialPlatform,
} from '../lib/socialShare'
import { LinkedInIcon, XIcon } from './BrandIcons'
import './ShareSheet.css'

export interface ShareSheetProps {
  platform: SocialPlatform
  fields: ShareFields
  imageDataUrl: string
  filename: string
  onClose: () => void
}

export function ShareSheet({
  platform,
  fields,
  imageDataUrl,
  filename,
  onClose,
}: ShareSheetProps) {
  const titleId = useId()
  const stepsId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const [copiedPost, setCopiedPost] = useState(false)
  const [copiedLinks, setCopiedLinks] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [nativeShare, setNativeShare] = useState(false)

  const postText = buildPostText(platform, fields)
  const linksBlock = formatIdeezaLinksBlock()
  const copy = modalCopy
  const title = copy.titles[platform]
  const steps = copy.steps[platform]
  const openLabel = platform === 'linkedin' ? copy.openLinkedIn : copy.openX
  const showLinksSection = platform === 'x'

  useEffect(() => {
    setNativeShare(canNativeShareImage())
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const flashCopied = (which: 'post' | 'links') => {
    if (which === 'post') {
      setCopiedPost(true)
      window.setTimeout(() => setCopiedPost(false), 2000)
    } else {
      setCopiedLinks(true)
      window.setTimeout(() => setCopiedLinks(false), 2000)
    }
  }

  const onCopyPost = async () => {
    const ok = await copyText(postText)
    if (ok) flashCopied('post')
    else setHint('Couldn’t copy — select the text and copy manually.')
  }

  const onCopyLinks = async () => {
    const ok = await copyText(linksBlock)
    if (ok) flashCopied('links')
    else setHint('Couldn’t copy — select the links and copy manually.')
  }

  const onSaveImage = async () => {
    setBusy(true)
    setHint(null)
    try {
      const result = await saveCardImage({
        dataUrl: imageDataUrl,
        filename,
        preferNativeShare: nativeShare,
      })
      if (result === 'downloaded') setHint(copy.savedDownload)
    } finally {
      setBusy(false)
    }
  }

  const onShareToApp = async () => {
    setBusy(true)
    setHint(null)
    try {
      await copyText(postText)
      flashCopied('post')
      const result = await shareImageToApp({
        dataUrl: imageDataUrl,
        filename,
        text: postText,
      })
      if (result === 'shared') setHint(copy.shareImageHint)
      else if (result === 'unavailable') {
        await saveCardImage({
          dataUrl: imageDataUrl,
          filename,
          preferNativeShare: false,
        })
        setHint(copy.savedDownload)
      }
    } finally {
      setBusy(false)
    }
  }

  const onOpenPlatform = async () => {
    await copyText(postText)
    flashCopied('post')
    const url = getOpenUrl(platform, postText)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="share-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={stepsId}
    >
      <button
        type="button"
        className="share-sheet__backdrop"
        aria-label="Dismiss share sheet"
        onClick={onClose}
      />
      <div className="share-sheet__panel">
        <header className="share-sheet__header">
          <div className="share-sheet__title-row">
            {platform === 'linkedin' ? <LinkedInIcon /> : <XIcon />}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="share-sheet__x"
            onClick={onClose}
            aria-label={copy.close}
          >
            ×
          </button>
        </header>

        <p id={stepsId} className="share-sheet__steps">
          {steps}
        </p>

        <div className="share-sheet__body">
          <figure className="share-sheet__figure">
            <img
              className="share-sheet__img"
              src={imageDataUrl}
              alt={copy.imageAlt}
              width={1080}
              height={1350}
              draggable
            />
            <figcaption className="share-sheet__img-hint">
              {copy.longPressHint}
            </figcaption>
          </figure>

          <div className="share-sheet__image-actions">
            <button
              type="button"
              className="btn btn--primary share-sheet__btn"
              disabled={busy}
              onClick={() => void onSaveImage()}
            >
              {copy.saveImage}
            </button>
            {nativeShare && (
              <button
                type="button"
                className="btn btn--secondary share-sheet__btn"
                disabled={busy}
                onClick={() => void onShareToApp()}
              >
                {copy.shareImageToApp}
              </button>
            )}
          </div>

          <label className="share-sheet__text-label" htmlFor={`${titleId}-text`}>
            Post text
          </label>
          <textarea
            id={`${titleId}-text`}
            className="share-sheet__textarea"
            readOnly
            value={postText}
            rows={showLinksSection ? 6 : 8}
          />
          <button
            type="button"
            className="btn btn--secondary share-sheet__btn"
            onClick={() => void onCopyPost()}
          >
            {copiedPost ? copy.copied : copy.copyText}
          </button>

          {showLinksSection && (
            <>
              <label
                className="share-sheet__text-label"
                htmlFor={`${titleId}-links`}
              >
                {copy.ideezaLinksLabel}
              </label>
              <p className="share-sheet__links-hint">{copy.ideezaLinksHint}</p>
              <textarea
                id={`${titleId}-links`}
                className="share-sheet__textarea share-sheet__textarea--links"
                readOnly
                value={linksBlock}
                rows={8}
              />
              <button
                type="button"
                className="btn btn--secondary share-sheet__btn"
                onClick={() => void onCopyLinks()}
              >
                {copiedLinks ? copy.copied : copy.copyLinks}
              </button>
            </>
          )}

          <button
            type="button"
            className={`btn share-sheet__btn share-sheet__open ${
              platform === 'linkedin' ? 'btn--linkedin' : 'btn--x'
            }`}
            onClick={() => void onOpenPlatform()}
          >
            {platform === 'linkedin' ? <LinkedInIcon /> : <XIcon />}
            <span>{openLabel}</span>
          </button>

          {hint && <p className="share-sheet__hint">{hint}</p>}
        </div>
      </div>
    </div>
  )
}
