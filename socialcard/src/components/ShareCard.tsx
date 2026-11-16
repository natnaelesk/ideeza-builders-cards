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

function PanelIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <rect x="4" y="6" width="28" height="24" rx="6" fill="#6a2ff0" />
      <path
        d="M12 18h12M12 23h8"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="13" r="2.5" fill="#b9ff6a" />
    </svg>
  )
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

  const showProject = Boolean(projectEntered)
  const showPitch = Boolean(pitchEntered)
  const project =
    projectEntered || (day.projectRequired ? day.defaultProject : '')
  const pitch = pitchEntered || (day.projectRequired ? day.defaultPitch : '')
  const projectIsPlaceholder = day.projectRequired && !projectEntered
  const pitchIsPlaceholder = day.projectRequired && !pitchEntered
  // Day 1 empty (and any empty state): keep frosted panel full with day context
  const showFallbackSub =
    !showProject && !showPitch && !day.projectRequired
  const showRequiredPlaceholders =
    day.projectRequired && !projectEntered && !pitchEntered

  const hasPhoto = Boolean(state.photoUrl)
  const t = state.photoTransform
  const posX = 50 + t.x
  const posY = 50 - t.y

  const h1Ref = useRef<HTMLDivElement>(null)
  const h2Ref = useRef<HTMLDivElement>(null)
  const [h1Size, setH1Size] = useState(slots.headline.h1.fontSize)
  const [h2Size, setH2Size] = useState(slots.headline.h2.fontSize)

  useLayoutEffect(() => {
    setH1Size(fitFontSize(h1Ref.current, slots.headline.h1.fontSize, 34))
    if (day.headline2.includes('\n')) {
      setH2Size(slots.headline.h2.fontSize)
    } else {
      setH2Size(fitFontSize(h2Ref.current, slots.headline.h2.fontSize, 30))
    }
  }, [day.headline1, day.headline2, slots.headline.h1.fontSize, slots.headline.h2.fontSize])

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
        <svg
          className="share-card__swoosh-bg"
          viewBox="0 0 1080 1350"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sw1" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0" stopColor="#c9a8ff" stopOpacity="0" />
              <stop offset="0.3" stopColor="#9a64ff" stopOpacity="0.5" />
              <stop offset="0.7" stopColor="#d4b8ff" stopOpacity="0.38" />
              <stop offset="1" stopColor="#7a3cf5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sw2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e0c4ff" stopOpacity="0" />
              <stop offset="0.35" stopColor="#b07bff" stopOpacity="0.42" />
              <stop offset="1" stopColor="#8b45ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sw3" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#a878ff" stopOpacity="0" />
              <stop offset="0.4" stopColor="#8b45ff" stopOpacity="0.55" />
              <stop offset="0.75" stopColor="#d4b8ff" stopOpacity="0.4" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-40 140 C 200 40, 420 240, 640 120 S 980 20, 1120 100"
            fill="none"
            stroke="url(#sw1)"
            strokeWidth="110"
            strokeLinecap="round"
          />
          <path
            d="M-60 780 C 180 700, 420 860, 680 760 S 980 680, 1140 760"
            fill="none"
            stroke="url(#sw3)"
            strokeWidth="90"
            strokeLinecap="round"
          />
          <path
            d="M-40 1180 C 220 1060, 480 1280, 720 1140 S 1020 1040, 1140 1180"
            fill="none"
            stroke="url(#sw2)"
            strokeWidth="130"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Top logos */}
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

      {/* Tour pill */}
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

      {/* Headline block */}
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
            fontFamily: slots.headline.h1.fontFamily,
            fontSize: h1Size,
            fontWeight: slots.headline.h1.fontWeight,
            fontStyle: slots.headline.h1.fontStyle,
            color: slots.headline.h1.color,
            letterSpacing: slots.headline.h1.letterSpacing,
            lineHeight: slots.headline.h1.lineHeight,
            textTransform: slots.headline.h1.textTransform,
          }}
        >
          {day.headline1}
        </div>
        <div
          ref={h2Ref}
          className="share-card__h2"
          style={{
            fontFamily: slots.headline.h2.fontFamily,
            fontSize: h2Size,
            fontWeight: slots.headline.h2.fontWeight,
            fontStyle: slots.headline.h2.fontStyle,
            letterSpacing: slots.headline.h2.letterSpacing,
            lineHeight: slots.headline.h2.lineHeight,
            textTransform: slots.headline.h2.textTransform,
            backgroundImage: slots.headline.h2.gradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {day.headline2}
        </div>

        <div className="share-card__uni-block">
          <div
            className="share-card__uni1"
            style={{
              fontFamily: slots.headline.uni1.fontFamily,
              fontSize: slots.headline.uni1.fontSize,
              fontWeight: slots.headline.uni1.fontWeight,
              fontStyle: slots.headline.uni1.fontStyle,
              color: slots.headline.uni1.color,
              letterSpacing: slots.headline.uni1.letterSpacing,
              lineHeight: slots.headline.uni1.lineHeight,
              textTransform: slots.headline.uni1.textTransform,
            }}
          >
            {uni.nameLines[0]}
          </div>
          <div
            className="share-card__uni2"
            style={{
              fontFamily: slots.headline.uni2.fontFamily,
              fontSize: slots.headline.uni2.fontSize,
              fontWeight: slots.headline.uni2.fontWeight,
              fontStyle: slots.headline.uni2.fontStyle,
              letterSpacing: slots.headline.uni2.letterSpacing,
              lineHeight: slots.headline.uni2.lineHeight,
              textTransform: slots.headline.uni2.textTransform,
              backgroundImage: slots.headline.uni2.gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {uni.nameLines[1]}
          </div>
        </div>

        <div
          className="share-card__tagline"
          style={{
            fontFamily: slots.headline.tagline.fontFamily,
            fontSize: slots.headline.tagline.fontSize,
            fontWeight: slots.headline.tagline.fontWeight,
            fontStyle: slots.headline.tagline.fontStyle,
            color: slots.headline.tagline.color,
          }}
        >
          {layout.tagline}
        </div>
        <div
          className="share-card__kicker"
          style={{
            fontSize: slots.headline.kicker.fontSize,
            fontWeight: slots.headline.kicker.fontWeight,
            color: slots.headline.kicker.color,
          }}
        >
          {day.kicker}
        </div>
      </div>

      {/* Campus gate — blended, no hard box */}
      <div className="share-card__gate" style={abs(slots.gate)}>
        <img
          className="share-card__gate-img"
          src={uni.gatePhoto}
          alt=""
          draggable={false}
        />
        <div className="share-card__gate-fade" aria-hidden />
        <svg
          className="share-card__gate-swoosh"
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="gs" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#a878ff" stopOpacity="0" />
              <stop offset="0.35" stopColor="#8b45ff" stopOpacity="0.55" />
              <stop offset="0.7" stopColor="#d4b8ff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 80 C 220 20, 420 110, 620 50 S 860 10, 1000 60"
            fill="none"
            stroke="url(#gs)"
            strokeWidth="48"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Person photo — white + purple ring */}
      <div
        className="share-card__photo"
        style={{
          ...abs(slots.photo),
          borderWidth: slots.photo.borderWidth,
          boxShadow: `0 0 0 ${slots.photo.ringWidth}px rgba(106, 47, 240, 0.55), 0 14px 32px rgba(60, 20, 140, 0.3)`,
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

      {/* Dates + prize (poster stack) */}
      <div
        className="share-card__dates-prize"
        style={{
          left: slots.datesPrize.x,
          top: slots.datesPrize.y,
          width: slots.datesPrize.w,
        }}
      >
        <div
          className="share-card__dates"
          style={{
            fontFamily: slots.datesPrize.dates.fontFamily,
            fontSize: slots.datesPrize.dates.fontSize,
            fontWeight: slots.datesPrize.dates.fontWeight,
            color: slots.datesPrize.dates.color,
            letterSpacing: slots.datesPrize.dates.letterSpacing,
          }}
        >
          {uni.datesShort}
        </div>
        <div
          className="share-card__prize"
          style={{
            fontFamily: slots.datesPrize.prize.fontFamily,
            fontSize: slots.datesPrize.prize.fontSize,
            fontWeight: slots.datesPrize.prize.fontWeight,
            fontStyle: slots.datesPrize.prize.fontStyle,
            color: slots.datesPrize.prize.color,
            letterSpacing: slots.datesPrize.prize.letterSpacing,
          }}
        >
          {layout.prizeHeadline}
        </div>
      </div>

      {/* Frosted name / project panel */}
      <div
        className="share-card__name-panel"
        style={{
          ...abs(slots.namePanel),
          height: slots.namePanel.h,
        }}
      >
        <div
          className="share-card__panel-icon"
          style={{
            width: slots.namePanel.iconSize,
            height: slots.namePanel.iconSize,
          }}
        >
          <PanelIcon />
        </div>
        <div className="share-card__panel-txt">
          <div
            className={`share-card__name${nameIsPlaceholder ? ' is-placeholder' : ''}`}
            style={{
              fontSize: slots.namePanel.name.fontSize,
              fontWeight: slots.namePanel.name.fontWeight,
              color: nameIsPlaceholder
                ? 'rgba(18, 5, 46, 0.38)'
                : slots.namePanel.name.color,
              letterSpacing: slots.namePanel.name.letterSpacing,
              lineHeight: slots.namePanel.name.lineHeight,
            }}
          >
            {name}
          </div>
          {(showProject || showRequiredPlaceholders) && project ? (
            <div
              className={`share-card__project${projectIsPlaceholder ? ' is-placeholder' : ''}`}
              style={{
                fontSize: slots.namePanel.project.fontSize,
                fontWeight: slots.namePanel.project.fontWeight,
                color: projectIsPlaceholder
                  ? 'rgba(90, 31, 224, 0.4)'
                  : slots.namePanel.project.color,
                letterSpacing: slots.namePanel.project.letterSpacing,
                lineHeight: slots.namePanel.project.lineHeight,
              }}
            >
              {project}
            </div>
          ) : null}
          {(showPitch || (showRequiredPlaceholders && pitch)) && pitch ? (
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
          {showFallbackSub ? (
            <div
              className="share-card__pitch"
              style={{
                fontSize: slots.namePanel.pitch.fontSize,
                fontWeight: 600,
                color: slots.namePanel.pitch.color,
                lineHeight: slots.namePanel.pitch.lineHeight,
              }}
            >
              {day.emptyPanelSub}
            </div>
          ) : null}
        </div>
      </div>

      {/* Partner logos — no panel, sit on card */}
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
