import { useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react'
import QRCode from 'qrcode'
import { hackathonLayout } from '../config/hackathonLayout'
import { fitFontSize } from '../lib/fitText'
import type { PhotoTransform } from '../types'
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

/** Name: Anton 100px, shrinks to 56px, then ellipsis. */
const NAME_MAX = 100
const NAME_MIN = 56
/** Project line: Poppins 600 32px, shrinks to 22px, then ellipsis. */
const PROJECT_MAX = 32
const PROJECT_MIN = 22

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
      <rect x="18" y="28" width="84" height="64" rx="12" fill="none" stroke="url(#hk-proj)" strokeWidth="4" opacity=".9" />
      <circle cx="44" cy="52" r="10" fill="url(#hk-proj)" opacity=".85" />
      <path d="M26 80 L48 62 L62 72 L78 54 L102 80 Z" fill="url(#hk-proj)" opacity=".75" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1c0f45" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
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

/** Re-render counter that bumps whenever web fonts finish loading. */
function useFontsVersion() {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return
    let alive = true
    const bump = () => alive && setV((n) => n + 1)
    document.fonts.ready.then(bump)
    document.fonts.addEventListener('loadingdone', bump)
    return () => {
      alive = false
      document.fonts.removeEventListener('loadingdone', bump)
    }
  }, [])
  return v
}

/** IDEEZA Virtual Hackathon share card — "Option 5 holo ticket" (1080×1350). */
export function HackathonCard({ state, cardRef, className }: HackathonCardProps) {
  const { copy, logos, siteUrl, telegramHandle } = hackathonLayout
  const [qrDataUrl, setQrDataUrl] = useState('')
  const fontsVersion = useFontsVersion()

  const nameEntered = state.name.trim()
  const projectEntered = state.project.trim()
  const name = nameEntered || copy.defaultName
  const project = projectEntered || copy.defaultProject
  const hasPhoto = Boolean(state.photoUrl)
  const hasProjectImage = Boolean(state.projectImageUrl)

  const nameRef = useRef<HTMLDivElement>(null)
  const projectRef = useRef<HTMLSpanElement>(null)
  const [nameSize, setNameSize] = useState(NAME_MAX)
  const [projectSize, setProjectSize] = useState(PROJECT_MAX)

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
    setNameSize(fitFontSize(nameRef.current, NAME_MAX, NAME_MIN))
  }, [name, fontsVersion])

  useLayoutEffect(() => {
    setProjectSize(fitFontSize(projectRef.current, PROJECT_MAX, PROJECT_MIN))
  }, [project, fontsVersion])

  return (
    <div
      ref={cardRef}
      className={`hk-card${className ? ` ${className}` : ''}`}
      style={{ width: hackathonLayout.width, height: hackathonLayout.height }}
    >
      <div className="hk-card__bg" aria-hidden />

      <header className="hk-card__top">
        <img className="hk-card__logo" src={logos.ideezaWhite} alt="IDEEZA" draggable={false} />
        <div className="hk-card__tag">
          <span className="hk-card__dot" />
          {copy.pill}
        </div>
      </header>

      <h1 className="hk-card__head">
        <span className="hk-card__im">{copy.headlineThin}</span>
        <span className="hk-card__building hk-anton">{copy.headlineHeavy}</span>
      </h1>

      <div className="hk-card__shadow">
        <div className="hk-card__ticket">
          <div className="hk-card__sheen" aria-hidden />
          <div className="hk-card__inner-border" aria-hidden />
          <div className="hk-card__main">
            <div className="hk-card__row">
              <span className="hk-card__kick">
                <i className="hk-card__sq" />
                {copy.ballotLabel}
              </span>
              <span className="hk-card__no">{copy.ballotNo}</span>
            </div>

            <div className="hk-card__frames">
              <div className={`hk-card__frame hk-card__frame--me${hasPhoto ? ' has-media' : ''}`}>
                {hasPhoto ? (
                  <img className="hk-card__frame-img" src={state.photoUrl!} alt="" draggable={false} style={coverStyle(state.photoTransform)} />
                ) : (
                  <div className="hk-card__frame-ph">
                    <HackathonPhotoSilhouette />
                  </div>
                )}
                <span className="hk-card__frame-tag">ME</span>
              </div>
              <div className={`hk-card__frame hk-card__frame--proj${hasProjectImage ? ' has-media' : ''}`}>
                {hasProjectImage ? (
                  <img className="hk-card__frame-img" src={state.projectImageUrl!} alt="" draggable={false} style={coverStyle(state.projectImageTransform)} />
                ) : (
                  <div className="hk-card__frame-ph hk-card__frame-ph--project">
                    <ProjectPlaceholderIcon />
                    <div className="hk-card__frame-ph-lbl">Your project</div>
                  </div>
                )}
                <span className="hk-card__frame-tag">MY PROJECT</span>
              </div>
            </div>

            <div
              ref={nameRef}
              className={`hk-card__name hk-anton${nameEntered ? '' : ' is-placeholder'}`}
              style={{ fontSize: nameSize }}
            >
              {name}
            </div>
            <div className={`hk-card__proj${projectEntered ? '' : ' is-placeholder'}`}>
              <i className="hk-card__sq hk-card__sq--l" />
              <span ref={projectRef} className="hk-card__proj-text" style={{ fontSize: projectSize }}>
                {project}
              </span>
            </div>

            <div className="hk-card__rule" />

            <div className="hk-card__prize">
              <div>
                <div className="hk-card__kick hk-card__kick--l">{copy.prizesLabel}</div>
                <div className="hk-card__amount hk-anton">{copy.prizesAmount}</div>
              </div>
              <div className="hk-card__places">
                {copy.prizesBreakdown.map((b) => (
                  <span key={b}>{b}</span>
                ))}
              </div>
            </div>
            <div className="hk-card__grand">{copy.grandPrize}</div>
          </div>

          <div className="hk-card__stub">
            <div className="hk-card__check">
              <CheckIcon />
            </div>
            <div className="hk-card__vert hk-anton">{copy.voteStub}</div>
            <div className="hk-card__qr">
              {qrDataUrl ? <img src={qrDataUrl} alt="" draggable={false} /> : <div className="hk-card__qr-ph" />}
            </div>
          </div>
        </div>
      </div>

      <footer className="hk-card__foot">
        <div className="hk-card__pill">
          {copy.cta}
          <span className="hk-card__arrow">
            <ArrowIcon />
          </span>
        </div>
        <div className="hk-card__decides">
          <i className="hk-card__sq" />
          {copy.voteChip}
        </div>
        <div className="hk-card__links">
          <b>{copy.siteLabel}</b>
          <span>{telegramHandle}</span>
        </div>
      </footer>
    </div>
  )
}
