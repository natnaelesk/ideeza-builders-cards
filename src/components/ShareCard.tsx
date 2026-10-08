import { useEffect, useState, type Ref } from 'react'
import QRCode from 'qrcode'
import { cardLayout, type RoleId } from '../config/cardLayout'
import type { CardFormState } from '../types'
import {
  ArrowIcon,
  ChipIcon,
  DefaultCompanyBadge,
  DefaultProjectBadge,
  PanelIconSvg,
  PhotoPlaceholderSilhouette,
  TrophyIcon,
} from './icons'
import './ShareCard.css'

export interface ShareCardProps {
  state: CardFormState
  /** Forwarded to the root for export capture */
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
  const role = layout.roles[state.role]
  const { slots, colors, logos } = layout
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(layout.waitlistUrl, {
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
  }, [layout.waitlistUrl])

  const name = state.name.trim() || role.defaultName
  const sub = state.sub.trim() || role.defaultSub
  const hasPhoto = Boolean(state.photoUrl)
  const t = state.photoTransform

  return (
    <div
      ref={cardRef}
      className={`share-card role-${state.role}${className ? ` ${className}` : ''}`}
      style={{
        width: layout.width,
        height: layout.height,
        fontFamily: layout.fontFamily,
        color: colors.navy,
      }}
      data-role={state.role}
    >
      {/* Background: designer frame OR procedural placeholder */}
      {role.frameSrc ? (
        <img
          className="share-card__frame"
          src={role.frameSrc}
          alt=""
          draggable={false}
        />
      ) : (
        <ProceduralBackground />
      )}

      {/* Brand logo */}
      <div className="share-card__slot" style={abs(slots.brandLogo)}>
        <img
          src={logos.ideaza}
          alt="IDEEZA"
          style={{ height: slots.brandLogo.imgHeight, width: 'auto' }}
          draggable={false}
        />
      </div>

      {/* Role pill */}
      <div
        className="share-card__role-pill"
        style={{
          ...abs(slots.rolePill),
          fontSize: slots.rolePill.fontSize,
          letterSpacing: slots.rolePill.letterSpacing,
          padding: `${slots.rolePill.paddingY}px ${slots.rolePill.paddingX}px`,
        }}
      >
        <span className="share-card__role-dot" style={{ background: colors.lime }} />
        <span>{role.pillLabel}</span>
      </div>

      {/* Headline */}
      <div
        className="share-card__headline"
        style={{ left: slots.headline.x, top: slots.headline.y, width: slots.headline.w }}
      >
        <div
          className="share-card__h1"
          style={{
            fontSize: slots.headline.h1.fontSize,
            fontWeight: slots.headline.h1.fontWeight,
            color: slots.headline.h1.color,
            letterSpacing: slots.headline.h1.letterSpacing,
            lineHeight: slots.headline.h1.lineHeight,
          }}
        >
          {role.headline1}
        </div>
        <div
          className="share-card__h2"
          style={{
            fontSize: slots.headline.h2.fontSize,
            fontWeight: slots.headline.h2.fontWeight,
            letterSpacing: slots.headline.h2.letterSpacing,
            lineHeight: slots.headline.h2.lineHeight,
            ...(slots.headline.h2.gradient
              ? {
                  backgroundImage: slots.headline.h2.gradient,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }
              : { color: slots.headline.h2.color }),
          }}
        >
          {role.headline2}
        </div>
        <svg
          className="share-card__swoosh"
          width={slots.headline.swooshWidth}
          height={slots.headline.swooshHeight}
          viewBox={`0 0 ${slots.headline.swooshWidth} ${slots.headline.swooshHeight}`}
        >
          <path
            d={`M4 ${slots.headline.swooshHeight - 4} Q ${slots.headline.swooshWidth / 2} -4 ${slots.headline.swooshWidth - 4} ${slots.headline.swooshHeight - 8}`}
            fill="none"
            stroke={slots.headline.swooshColor}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
        <div
          className="share-card__kicker"
          style={{
            fontSize: slots.headline.kicker.fontSize,
            fontWeight: slots.headline.kicker.fontWeight,
            color: slots.headline.kicker.color,
            lineHeight: slots.headline.kicker.lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: role.kickerHtml }}
        />
      </div>

      {/* Photo */}
      <div
        className="share-card__photo"
        style={{
          ...abs(slots.photo),
          borderRadius: slots.photo.borderRadius,
        }}
      >
        {hasPhoto ? (
          <img
            className="share-card__photo-img"
            src={state.photoUrl!}
            alt=""
            draggable={false}
            style={{
              transform: `translate(${t.x}%, ${t.y}%) scale(${t.zoom})`,
            }}
          />
        ) : (
          <div
            className="share-card__photo-ph"
            style={{
              inset: slots.photo.dashedInset,
              borderRadius: '252px 252px 26px 26px',
            }}
          >
            <div className="share-card__photo-lbl">
              PHOTO SLOT
              <small>Upload your photo here</small>
            </div>
            <PhotoPlaceholderSilhouette />
          </div>
        )}
      </div>

      {/* Blueprint (builder) */}
      {role.showBlueprint && (
        <svg
          className="share-card__blueprint"
          style={abs(slots.blueprint)}
          viewBox="0 0 280 280"
        >
          <defs>
            <pattern
              id={`grid-${state.role}`}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0H0V20"
                fill="none"
                stroke="#7a4cf0"
                strokeOpacity=".35"
                strokeWidth="1"
              />
            </pattern>
            <radialGradient id={`fade-${state.role}`}>
              <stop offset=".55" stopColor="#fff" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id={`m-${state.role}`}>
              <rect width="280" height="280" fill={`url(#fade-${state.role})`} />
            </mask>
          </defs>
          <rect
            width="280"
            height="280"
            fill={`url(#grid-${state.role})`}
            mask={`url(#m-${state.role})`}
          />
          <circle
            cx="140"
            cy="140"
            r="128"
            fill="none"
            stroke="#6a2ff0"
            strokeOpacity=".55"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <path
            d="M140 0V20 M140 260V280 M0 140H20 M260 140H280"
            stroke="#6a2ff0"
            strokeWidth="2"
          />
        </svg>
      )}

      {/* Badge */}
      <div className="share-card__badge" style={abs(slots.badge)}>
        <div className="share-card__badge-in">
          {state.badgeUrl ? (
            <img src={state.badgeUrl} alt="" draggable={false} />
          ) : state.role === 'builder' ? (
            <DefaultProjectBadge />
          ) : (
            <DefaultCompanyBadge />
          )}
        </div>
        <div
          className="share-card__badge-tag"
          style={{ bottom: slots.badge.tagOffsetY }}
        >
          {role.badgeTag}
        </div>
      </div>

      {/* Name panel */}
      <div className="share-card__panel" style={abs(slots.namePanel)}>
        <div
          className="share-card__panel-icon"
          style={{
            width: slots.namePanel.iconSize,
            height: slots.namePanel.iconSize,
          }}
        >
          <PanelIconSvg type={role.panelIcon} />
        </div>
        <div className="share-card__panel-bar" />
        <div className="share-card__panel-txt">
          <div
            className="share-card__panel-name"
            style={{
              fontSize: slots.namePanel.name.fontSize,
              fontWeight: slots.namePanel.name.fontWeight,
              color: slots.namePanel.name.color,
              letterSpacing: slots.namePanel.name.letterSpacing,
              lineHeight: slots.namePanel.name.lineHeight,
            }}
          >
            {name}
          </div>
          <div
            className="share-card__panel-sub"
            style={{
              fontSize: slots.namePanel.sub.fontSize,
              fontWeight: slots.namePanel.sub.fontWeight,
              color: slots.namePanel.sub.color,
              lineHeight: slots.namePanel.sub.lineHeight,
            }}
          >
            {sub}
          </div>
        </div>
      </div>

      {/* Chips */}
      <div
        className="share-card__chips"
        style={{
          left: slots.chips.x,
          top: slots.chips.y,
          width: slots.chips.w,
          gap: slots.chips.gap,
        }}
      >
        {slots.chips.items.map((item) => (
          <div className="share-card__chip" key={item.title}>
            <div className="share-card__chip-icon">
              {item.icon === 'chip' ? <ChipIcon /> : <TrophyIcon />}
            </div>
            <div>
              <b>{item.title}</b>
              <span>{item.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* QR */}
      <div className="share-card__qr" style={abs(slots.qr)}>
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code to ideeza.com/waitlist"
            width={slots.qr.codeSize}
            height={slots.qr.codeSize}
            style={{
              width: slots.qr.codeSize,
              height: slots.qr.codeSize,
              imageRendering: 'pixelated',
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              width: slots.qr.codeSize,
              height: slots.qr.codeSize,
              background: '#f3eeff',
            }}
          />
        )}
        <div
          className="share-card__qr-cap"
          style={{
            fontSize: slots.qr.caption.fontSize,
            fontWeight: slots.qr.caption.fontWeight,
            color: slots.qr.caption.color,
            lineHeight: slots.qr.caption.lineHeight,
          }}
        >
          Scan to join the
          <br />
          IDEEZA waitlist
        </div>
        <div
          className="share-card__qr-url"
          style={{
            fontSize: slots.qr.url.fontSize,
            fontWeight: slots.qr.url.fontWeight,
            color: slots.qr.url.color,
            letterSpacing: slots.qr.url.letterSpacing,
          }}
        >
          {layout.waitlistDisplayUrl}
        </div>
      </div>

      {/* CTA row */}
      <div
        className="share-card__cta-row"
        style={{
          left: slots.ctaRow.x,
          top: slots.ctaRow.y,
          width: slots.ctaRow.w,
        }}
      >
        <div className="share-card__cta">
          {slots.ctaRow.ctaLabel}
          <span className="share-card__cta-arr">
            <ArrowIcon />
          </span>
        </div>
        <div className="share-card__tagline">
          <div
            style={{
              fontSize: slots.ctaRow.tagline.fontSize,
              fontWeight: slots.ctaRow.tagline.fontWeight,
              color: slots.ctaRow.tagline.color,
              letterSpacing: slots.ctaRow.tagline.letterSpacing,
            }}
          >
            {layout.tagline}
          </div>
          <div
            style={{
              fontSize: slots.ctaRow.event.fontSize,
              fontWeight: slots.ctaRow.event.fontWeight,
              color: slots.ctaRow.event.color,
              marginTop: 2,
            }}
          >
            {layout.eventLine}
          </div>
        </div>
      </div>

      {/* Logo strip */}
      <div className="share-card__logos" style={abs(slots.logoStrip)}>
        <div className="share-card__logo-cell">
          <img
            src={logos.ideaza}
            alt="IDEEZA"
            style={{ height: slots.logoStrip.heights.ideaza }}
            draggable={false}
          />
        </div>
        <div className="share-card__logo-sep" />
        <div className="share-card__logo-cell">
          <img
            src={logos.wtm}
            alt="Women Techmakers"
            style={{ height: slots.logoStrip.heights.wtm }}
            draggable={false}
          />
        </div>
        <div className="share-card__logo-sep" />
        <div className="share-card__logo-cell">
          <img
            src={logos.fca}
            alt="FCA Creators Hub"
            style={{ height: slots.logoStrip.heights.fca }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}

function ProceduralBackground() {
  return (
    <div className="share-card__bg" aria-hidden>
      <svg className="share-card__ribbon" viewBox="0 0 820 560">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b48cff" stopOpacity="0" />
            <stop offset=".25" stopColor="#9a64ff" stopOpacity=".55" />
            <stop offset=".6" stopColor="#c7a9ff" stopOpacity=".45" />
            <stop offset="1" stopColor="#7a3cf5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M10 420 C 160 300, 300 520, 470 430 S 760 250, 810 300"
          fill="none"
          stroke="url(#rg)"
          strokeWidth="64"
          strokeLinecap="round"
        />
        <path
          d="M10 420 C 160 300, 300 520, 470 430 S 760 250, 810 300"
          fill="none"
          stroke="url(#rg2)"
          strokeWidth="6"
          strokeLinecap="round"
          transform="translate(0,-22)"
        />
      </svg>
      <div className="share-card__sphere s1" />
      <div className="share-card__sphere glass s2" />
      <div className="share-card__sphere glass s3" />
      <div className="share-card__sphere s4" />
      <div className="share-card__cube">
        <div className="f1" />
        <div className="f2" />
        <div className="f3" />
      </div>
    </div>
  )
}

/** Helper for typing role in data attributes / class names */
export function roleClass(role: RoleId) {
  return `role-${role}`
}
