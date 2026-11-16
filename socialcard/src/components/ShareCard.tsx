import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import { cardLayout } from '../config/cardLayout'
import { fitNameFontSize } from '../lib/fitText'
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

function PhotoPlaceholder() {
  return (
    <svg
      className="share-card__photo-silhouette"
      viewBox="0 0 200 200"
      aria-hidden
    >
      <defs>
        <linearGradient id="phg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8c8ff" />
          <stop offset="1" stopColor="#b89cff" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#phg)" />
      <circle cx="100" cy="78" r="36" fill="#6a2ff0" opacity="0.55" />
      <path
        d="M36 178c10-42 40-62 64-62s54 20 64 62"
        fill="#6a2ff0"
        opacity="0.55"
      />
    </svg>
  )
}

export function ShareCard({ state, cardRef, className }: ShareCardProps) {
  const layout = cardLayout
  const uni = layout.university
  const { slots, colors, logos } = layout

  const nameEntered = state.name.trim()
  const name = nameEntered || 'Your Name'
  const nameIsPlaceholder = !nameEntered

  const hasPhoto = Boolean(state.photoUrl)
  const t = state.photoTransform
  const posX = 50 + t.x
  const posY = 50 - t.y

  const nameRef = useRef<HTMLDivElement>(null)
  const [nameSize, setNameSize] = useState(slots.name.fontSize)
  const [nameMultiline, setNameMultiline] = useState(false)

  const eventPillText = `${layout.eventName} · ${uni.name} · ${uni.dates}`

  useLayoutEffect(() => {
    const { size, multiline } = fitNameFontSize(
      nameRef.current,
      slots.name.fontSize,
      36,
    )
    setNameSize(size)
    setNameMultiline(multiline)
  }, [name, slots.name.fontSize])

  return (
    <div
      ref={cardRef}
      className={`share-card${className ? ` ${className}` : ''}`}
      style={{
        width: layout.width,
        height: layout.height,
        fontFamily: layout.fontFamily,
        color: colors.navy,
      }}
    >
      <div className="share-card__bg" aria-hidden>
        <svg
          className="share-card__swoosh-bg"
          viewBox="0 0 1080 1350"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sw1" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0" stopColor="#c9a8ff" stopOpacity="0" />
              <stop offset="0.3" stopColor="#9a64ff" stopOpacity="0.48" />
              <stop offset="0.7" stopColor="#d4b8ff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#7a3cf5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sw2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e0c4ff" stopOpacity="0" />
              <stop offset="0.35" stopColor="#b07bff" stopOpacity="0.4" />
              <stop offset="1" stopColor="#8b45ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sw3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#a878ff" stopOpacity="0" />
              <stop offset="0.35" stopColor="#8b45ff" stopOpacity="0.58" />
              <stop offset="0.7" stopColor="#d4b8ff" stopOpacity="0.42" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-40 120 C 200 30, 420 220, 640 100 S 980 10, 1120 90"
            fill="none"
            stroke="url(#sw1)"
            strokeWidth="110"
            strokeLinecap="round"
          />
          <path
            d="M-60 820 C 200 740, 420 900, 680 800 S 980 720, 1140 800"
            fill="none"
            stroke="url(#sw3)"
            strokeWidth="100"
            strokeLinecap="round"
          />
          <path
            d="M-40 1200 C 220 1080, 480 1300, 720 1160 S 1020 1060, 1140 1200"
            fill="none"
            stroke="url(#sw2)"
            strokeWidth="130"
            strokeLinecap="round"
          />
        </svg>
      </div>

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

      <div
        className="share-card__tour-pill"
        style={{
          ...abs(slots.tourPill),
          fontSize: slots.tourPill.fontSize,
          letterSpacing: slots.tourPill.letterSpacing,
          padding: `${slots.tourPill.paddingY}px ${slots.tourPill.paddingX}px`,
          fontFamily: layout.displayFontFamily,
        }}
      >
        <span className="share-card__slashes" aria-hidden>
          //
        </span>
        <span>{layout.tourLabel}</span>
      </div>

      {/* Soft campus gate backdrop */}
      <div className="share-card__gate" style={abs(slots.gate)}>
        <img
          className="share-card__gate-img"
          src={uni.gatePhoto}
          alt=""
          draggable={false}
        />
        <div className="share-card__gate-wash" aria-hidden />
      </div>

      {/* Hero portrait */}
      <div
        className="share-card__photo"
        style={{
          ...abs(slots.photo),
          borderWidth: slots.photo.borderWidth,
          boxShadow: `0 0 0 ${slots.photo.ringWidth}px #fff, 0 18px 48px rgba(60, 20, 140, 0.28)`,
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
          <PhotoPlaceholder />
        )}
      </div>

      {/* Swooshes crossing below the portrait */}
      <svg
        className="share-card__portrait-swoosh"
        viewBox="0 0 1080 160"
        preserveAspectRatio="none"
        aria-hidden
        style={{ top: slots.photo.y + slots.photo.h - 90 }}
      >
        <defs>
          <linearGradient id="ps" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#a878ff" stopOpacity="0" />
            <stop offset="0.3" stopColor="#8b45ff" stopOpacity="0.55" />
            <stop offset="0.65" stopColor="#c9a8ff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 100 C 220 30, 420 140, 640 70 S 900 20, 1080 90"
          fill="none"
          stroke="url(#ps)"
          strokeWidth="56"
          strokeLinecap="round"
        />
        <path
          d="M0 120 C 260 60, 480 150, 720 90 S 940 50, 1080 110"
          fill="none"
          stroke="url(#ps)"
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      <div
        ref={nameRef}
        className={`share-card__name${nameIsPlaceholder ? ' is-placeholder' : ''}${nameMultiline ? ' is-multiline' : ''}`}
        style={{
          ...abs(slots.name),
          fontFamily: slots.name.fontFamily,
          fontSize: nameSize,
          fontWeight: slots.name.fontWeight,
          fontStyle: slots.name.fontStyle,
          color: nameIsPlaceholder
            ? 'rgba(18, 5, 46, 0.38)'
            : slots.name.color,
          letterSpacing: slots.name.letterSpacing,
          lineHeight: slots.name.lineHeight,
          textTransform: slots.name.textTransform,
        }}
      >
        {name}
      </div>

      <div
        className="share-card__identity"
        style={{
          ...abs(slots.identity),
          fontFamily: slots.identity.fontFamily,
          fontSize: slots.identity.fontSize,
          fontWeight: slots.identity.fontWeight,
          color: slots.identity.color,
          letterSpacing: slots.identity.letterSpacing,
        }}
      >
        {layout.identityLine}
      </div>

      <div
        className="share-card__event-pill"
        style={{
          ...abs(slots.eventPill),
          fontSize: slots.eventPill.fontSize,
          fontWeight: slots.eventPill.fontWeight,
          color: slots.eventPill.color,
          padding: `${slots.eventPill.paddingY}px ${slots.eventPill.paddingX}px`,
        }}
      >
        {eventPillText}
      </div>

      <div
        className="share-card__prize"
        style={{
          ...abs(slots.prize),
          fontFamily: slots.prize.fontFamily,
          fontSize: slots.prize.fontSize,
          fontWeight: slots.prize.fontWeight,
          fontStyle: slots.prize.fontStyle,
          color: slots.prize.color,
          letterSpacing: slots.prize.letterSpacing,
        }}
      >
        {layout.prizeHeadline}
      </div>

      <div className="share-card__logos" style={abs(slots.logoStrip)}>
        <div className="share-card__logo-cell">
          <img
            src={logos.cheche}
            alt="Cheche Impact"
            style={{ height: slots.logoStrip.heights.cheche }}
            draggable={false}
          />
        </div>
        <div className="share-card__logo-cell">
          <img
            src={logos.zemenay}
            alt="Zemenay Tech"
            style={{ height: slots.logoStrip.heights.zemenay }}
            draggable={false}
          />
        </div>
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
