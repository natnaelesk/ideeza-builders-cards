import { useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react'
import QRCode from 'qrcode'
import { hackathonLayout } from '../config/hackathonLayout'
import { fitFontSize } from '../lib/fitText'
import type { PhotoTransform } from '../types'
import { ArrowIcon } from './icons'
import './HackathonCard.css'

export interface HackathonCardState {
  name: string
  project: string
  photoUrl: string | null
  photoTransform: PhotoTransform
  projectImageUrl: string | null
  projectImageTransform: PhotoTransform
}

export interface HackathonCardProps {
  state: HackathonCardState
  cardRef?: Ref<HTMLDivElement>
  className?: string
}

function HackathonPhotoSilhouette() {
  return (
    <svg className="hk-card__sil" viewBox="0 0 380 420" aria-hidden>
      <defs>
        <linearGradient id="hk-sil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2d4ff" />
          <stop offset="1" stopColor="#9c7ae8" />
        </linearGradient>
      </defs>
      <circle cx="190" cy="130" r="72" fill="url(#hk-sil)" opacity=".85" />
      <path
        d="M28 420 C 28 280, 100 240, 190 240 C 280 240, 352 280, 352 420 Z"
        fill="url(#hk-sil)"
        opacity=".85"
      />
    </svg>
  )
}

function ProjectPlaceholderIcon() {
  return (
    <svg className="hk-card__proj-icon" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <linearGradient id="hk-proj" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2d4ff" />
          <stop offset="1" stopColor="#9c7ae8" />
        </linearGradient>
      </defs>
      <rect
        x="18"
        y="28"
        width="84"
        height="64"
        rx="12"
        fill="none"
        stroke="url(#hk-proj)"
        strokeWidth="4"
        opacity=".9"
      />
      <circle cx="44" cy="52" r="10" fill="url(#hk-proj)" opacity=".85" />
      <path
        d="M26 80 L48 62 L62 72 L78 54 L102 80 Z"
        fill="url(#hk-proj)"
        opacity=".75"
      />
    </svg>
  )
}

function coverStyle(t: PhotoTransform) {
  const posX = 50 + t.x
  const posY = 50 - t.y
  return {
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${t.zoom})`,
    transformOrigin: `${posX}% ${posY}%`,
  } as const
}

export function HackathonCard({ state, cardRef, className }: HackathonCardProps) {
  const { copy, logos, siteUrl } = hackathonLayout
  const [qrDataUrl, setQrDataUrl] = useState('')

  const nameEntered = state.name.trim()
  const projectEntered = state.project.trim()
  const name = nameEntered || copy.defaultName
  const project = projectEntered || copy.defaultProject
  const hasPhoto = Boolean(state.photoUrl)
  const hasProjectImage = Boolean(state.projectImageUrl)

  const nameRef = useRef<HTMLDivElement>(null)
  const projectRef = useRef<HTMLDivElement>(null)
  const [nameSize, setNameSize] = useState(40)
  const [projectSize, setProjectSize] = useState(20)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(siteUrl, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1c0f45', light: '#ffffff' },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [siteUrl])

  useLayoutEffect(() => {
    setNameSize(fitFontSize(nameRef.current, 40, 18))
  }, [name])

  useLayoutEffect(() => {
    setProjectSize(fitFontSize(projectRef.current, 20, 13))
  }, [project])

  return (
    <div
      ref={cardRef}
      className={`hk-card${className ? ` ${className}` : ''}`}
      style={{
        width: hackathonLayout.width,
        height: hackathonLayout.height,
      }}
    >
      <div className="hk-card__bg" aria-hidden>
        <div className="hk-card__grid" />
        <div className="hk-card__sphere hk-card__sphere--glass hk-card__sphere--s1" />
        <div className="hk-card__sphere hk-card__sphere--s2" />
        <div className="hk-card__sphere hk-card__sphere--glass hk-card__sphere--s3" />
        <div className="hk-card__sphere hk-card__sphere--s4" />
      </div>

      <div className="hk-card__logo">
        <img src={logos.ideezaWhite} alt="IDEEZA" draggable={false} />
      </div>

      <div className="hk-card__pill">
        <span className="hk-card__pill-dot" />
        <span>{copy.pill}</span>
      </div>

      <div className="hk-card__hero">
        <div className="hk-card__eyebrow">
          <span className="hk-card__sq" />
          {copy.prizesLabel}
        </div>
        <div className="hk-card__prize">{copy.prizesAmount}</div>
        <div className="hk-card__prize-sub">{copy.prizesSub}</div>
      </div>

      <div className="hk-card__headline">
        <div className="hk-card__h-thin">{copy.headlineThin}</div>
        <div className="hk-card__h-heavy">{copy.headlineHeavy}</div>
        <div className="hk-card__h-sub">{copy.headlineSub}</div>
      </div>

      <div className="hk-card__body">
        <div className="hk-card__portraits">
          <div className={`hk-card__frame${hasPhoto ? ' has-media' : ''}`}>
            <span className="hk-card__frame-tag">ME</span>
            {hasPhoto ? (
              <img
                className="hk-card__frame-img"
                src={state.photoUrl!}
                alt=""
                draggable={false}
                style={coverStyle(state.photoTransform)}
              />
            ) : (
              <div className="hk-card__frame-ph">
                <HackathonPhotoSilhouette />
              </div>
            )}
          </div>

          <div className={`hk-card__frame${hasProjectImage ? ' has-media' : ''}`}>
            <span className="hk-card__frame-tag">MY PROJECT</span>
            {hasProjectImage ? (
              <img
                className="hk-card__frame-img"
                src={state.projectImageUrl!}
                alt=""
                draggable={false}
                style={coverStyle(state.projectImageTransform)}
              />
            ) : (
              <div className="hk-card__frame-ph hk-card__frame-ph--project">
                <ProjectPlaceholderIcon />
                <div className="hk-card__frame-ph-lbl">Your project</div>
              </div>
            )}
          </div>
        </div>

        <div className="hk-card__meta">
          <div
            ref={nameRef}
            className={`hk-card__name${nameEntered ? '' : ' is-placeholder'}`}
            style={{ fontSize: nameSize }}
          >
            {name}
          </div>
          <div
            ref={projectRef}
            className={`hk-card__proj${projectEntered ? '' : ' is-placeholder'}`}
            style={{ fontSize: projectSize }}
          >
            {project}
          </div>
          <div className="hk-card__chips">
            <div className="hk-card__chip">{copy.voteChip}</div>
          </div>
        </div>

        <div className="hk-card__info-qr">
          <div className="hk-card__qr-wrap">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="" width={104} height={104} draggable={false} />
            ) : (
              <div className="hk-card__qr-ph" />
            )}
          </div>
          <div className="hk-card__urls">
            <b>www.ideeza.com</b>
            <span>{hackathonLayout.telegramHandle}</span>
          </div>
        </div>
      </div>

      <div className="hk-card__footer">
        <div className="hk-card__cta">
          {copy.cta}
          <span className="hk-card__cta-arr">
            <ArrowIcon />
          </span>
        </div>
        <div className="hk-card__foot-note">{copy.footNote}</div>
      </div>
    </div>
  )
}
