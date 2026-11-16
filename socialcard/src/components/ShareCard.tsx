import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import { cardLayout } from '../config/cardLayout'
import { fitFontSize } from '../lib/fitText'
import type { CardFormState } from '../types'
import './ShareCard.css'

export interface ShareCardProps {
  state: CardFormState
  cardRef?: Ref<HTMLDivElement>
  className?: string
}

function abs(slot: { x: number; y: number; w: number; h: number }) {
  return {
    left: slot.x,
    top: slot.y,
    width: slot.w,
    height: slot.h,
  }
}

export function ShareCard({ state, cardRef, className }: ShareCardProps) {
  const layout = cardLayout
  const day = layout.days[state.day]
  const uni = layout.university
  const { slots, colors, logos } = layout

  const nameEntered = state.name.trim()
  const projectEntered = state.project.trim()
  const pitchEntered = state.pitch.trim()
  const name = nameEntered || day.defaultName
  const nameIsPlaceholder = !nameEntered

  const showProject = Boolean(projectEntered) || day.projectRequired
  const showPitch = Boolean(pitchEntered)
  const project = projectEntered || (day.projectRequired ? day.defaultProject : '')
  const pitch = pitchEntered || (day.projectRequired ? day.defaultPitch : '')
  const projectIsPlaceholder = day.projectRequired && !projectEntered
  const pitchIsPlaceholder = day.projectRequired && !pitchEntered

  const hasPhoto = Boolean(state.photoUrl)
  const t = state.photoTransform
  const posX = 50 + t.x
  const posY = 50 - t.y

  const h1Ref = useRef<HTMLDivElement>(null)
  const [h1Size, setH1Size] = useState(slots.headline.h1.fontSize)

  useLayoutEffect(() => {
    // Multi-line headlines (Day 1) skip width-fit; single-line days still shrink to fit.
    const multiline = day.headline.includes('\n')
    if (multiline) {
      setH1Size(slots.headline.h1.fontSize)
      return
    }
    setH1Size(fitFontSize(h1Ref.current, slots.headline.h1.fontSize, 36))
  }, [day.headline, slots.headline.h1.fontSize])

  return (
    <div
      ref={cardRef}
      className={`share-card day-${state.day}${className ? ` ${className}` : ''}`}
      style={{
        width: layout.width,
        height: layout.height,
        fontFamily: layout.fontFamily,
        color: colors.navy,
      }}
      data-day={state.day}
    >
      <div className="share-card__bg" aria-hidden>
        <svg className="share-card__swoosh-bg" viewBox="0 0 1080 1350" preserveAspectRatio="none">
          <defs>
            <linearGradient id="sw1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#c9a8ff" stopOpacity="0" />
              <stop offset="0.35" stopColor="#9a64ff" stopOpacity="0.45" />
              <stop offset="0.7" stopColor="#d4b8ff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#7a3cf5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sw2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e0c4ff" stopOpacity="0" />
              <stop offset="0.4" stopColor="#b07bff" stopOpacity="0.4" />
              <stop offset="1" stopColor="#8b45ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-40 180 C 200 80, 420 280, 640 160 S 980 40, 1120 120"
            fill="none"
            stroke="url(#sw1)"
            strokeWidth="120"
            strokeLinecap="round"
          />
          <path
            d="M-40 1100 C 220 980, 480 1220, 720 1080 S 1020 980, 1140 1120"
            fill="none"
            stroke="url(#sw2)"
            strokeWidth="140"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Top logos: IDEEZA | CHECHE IMPACT */}
      <div className="share-card__top-logos" style={abs(slots.topLogos)}>
        <img
          src={logos.ideeza}
          alt="IDEEZA"
          style={{ height: slots.topLogos.ideezaHeight, width: 'auto' }}
          draggable={false}
        />
        <span className="share-card__logo-pipe" aria-hidden />
        <img
          src={logos.checheImpact}
          alt="Cheche Impact"
          style={{ height: slots.topLogos.checheHeight, width: 'auto' }}
          draggable={false}
        />
      </div>

      {/* Tour pill with // */}
      <div
        className="share-card__tour-pill"
        style={{
          ...abs(slots.tourPill),
          fontSize: slots.tourPill.fontSize,
          letterSpacing: slots.tourPill.letterSpacing,
          padding: `${slots.tourPill.paddingY}px ${slots.tourPill.paddingX}px`,
        }}
      >
        <span className="share-card__slashes" aria-hidden>
          //
        </span>
        <span>{layout.tourLabel}</span>
      </div>

      {/* Headline + university + dates */}
      <div
        className="share-card__headline"
        style={{
          left: slots.headline.x,
          top: slots.headline.y,
          width: slots.headline.w,
        }}
      >
        <div
          ref={h1Ref}
          className="share-card__h1"
          style={{
            fontSize: h1Size,
            fontWeight: slots.headline.h1.fontWeight,
            fontStyle: slots.headline.h1.fontStyle,
            letterSpacing: slots.headline.h1.letterSpacing,
            lineHeight: slots.headline.h1.lineHeight,
            ...(slots.headline.h1.gradient
              ? {
                  backgroundImage: slots.headline.h1.gradient,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }
              : { color: slots.headline.h1.color }),
          }}
        >
          {day.headline}
        </div>
        <div
          className="share-card__uni"
          style={{
            fontSize: slots.headline.uni.fontSize,
            fontWeight: slots.headline.uni.fontWeight,
            fontStyle: slots.headline.uni.fontStyle,
            color: slots.headline.uni.color,
            letterSpacing: slots.headline.uni.letterSpacing,
            lineHeight: slots.headline.uni.lineHeight,
          }}
        >
          {uni.name}
        </div>
        <div
          className="share-card__dates"
          style={{
            fontSize: slots.headline.dates.fontSize,
            fontWeight: slots.headline.dates.fontWeight,
            color: slots.headline.dates.color,
            letterSpacing: slots.headline.dates.letterSpacing,
          }}
        >
          {uni.datesShort}
        </div>
        <div className="share-card__kicker">{day.kicker}</div>
      </div>

      {/* Campus gate */}
      <div
        className="share-card__gate"
        style={{
          ...abs(slots.gate),
          borderRadius: slots.gate.borderRadius,
        }}
      >
        <img
          className="share-card__gate-img"
          src={uni.gatePhoto}
          alt=""
          draggable={false}
        />
      </div>

      {/* Optional builder photo — circular, pan/zoom via object-position */}
      <div
        className="share-card__photo"
        style={{
          ...abs(slots.photo),
          borderRadius: slots.photo.borderRadius,
          borderWidth: slots.photo.borderWidth,
        }}
      >
        {hasPhoto ? (
          <img
            className="share-card__photo-img"
            src={state.photoUrl!}
            alt=""
            draggable={false}
            style={{
              objectPosition: `${posX}% ${posY}%`,
              transform: `scale(${t.zoom})`,
              transformOrigin: `${posX}% ${posY}%`,
            }}
          />
        ) : (
          <div className="share-card__photo-ph">
            <span>PHOTO</span>
          </div>
        )}
      </div>

      {/* Prize */}
      <div
        className="share-card__prize"
        style={{
          left: slots.prize.x,
          top: slots.prize.y,
          width: slots.prize.w,
          fontSize: slots.prize.fontSize,
          fontWeight: slots.prize.fontWeight,
          color: slots.prize.color,
          letterSpacing: slots.prize.letterSpacing,
        }}
      >
        {layout.prizeHeadline}
      </div>

      {/* Name / project / pitch */}
      <div
        className="share-card__name-panel"
        style={{
          left: slots.namePanel.x,
          top: slots.namePanel.y,
          width: slots.namePanel.w,
        }}
      >
        <div
          className={`share-card__name${nameIsPlaceholder ? ' is-placeholder' : ''}`}
          style={{
            fontSize: slots.namePanel.name.fontSize,
            fontWeight: slots.namePanel.name.fontWeight,
            color: nameIsPlaceholder
              ? 'rgba(26, 10, 62, 0.38)'
              : slots.namePanel.name.color,
            letterSpacing: slots.namePanel.name.letterSpacing,
            lineHeight: slots.namePanel.name.lineHeight,
          }}
        >
          {name}
        </div>
        {showProject && project ? (
          <div
            className={`share-card__project${projectIsPlaceholder ? ' is-placeholder' : ''}`}
            style={{
              fontSize: slots.namePanel.project.fontSize,
              fontWeight: slots.namePanel.project.fontWeight,
              color: projectIsPlaceholder
                ? 'rgba(75, 23, 201, 0.4)'
                : slots.namePanel.project.color,
              letterSpacing: slots.namePanel.project.letterSpacing,
              lineHeight: slots.namePanel.project.lineHeight,
            }}
          >
            {project}
          </div>
        ) : null}
        {showPitch && pitch ? (
          <div
            className={`share-card__pitch${pitchIsPlaceholder ? ' is-placeholder' : ''}`}
            style={{
              fontSize: slots.namePanel.pitch.fontSize,
              fontWeight: slots.namePanel.pitch.fontWeight,
              color: pitchIsPlaceholder
                ? 'rgba(74, 58, 122, 0.45)'
                : slots.namePanel.pitch.color,
              lineHeight: slots.namePanel.pitch.lineHeight,
            }}
          >
            {pitch}
          </div>
        ) : null}
      </div>

      {/* Partner logos */}
      <div className="share-card__logos" style={abs(slots.logoStrip)}>
        <div className="share-card__logo-cell">
          <img
            src={logos.cheche}
            alt="Cheche Impact"
            style={{ height: slots.logoStrip.heights.cheche }}
            draggable={false}
          />
        </div>
        <div className="share-card__logo-sep" />
        <div className="share-card__logo-cell">
          <img
            src={logos.zemenay}
            alt="Zemenay Tech"
            style={{ height: slots.logoStrip.heights.zemenay }}
            draggable={false}
          />
        </div>
        <div className="share-card__logo-sep" />
        <div className="share-card__logo-cell">
          <img
            src={logos.insa}
            alt="INSA"
            style={{ height: slots.logoStrip.heights.insa }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
