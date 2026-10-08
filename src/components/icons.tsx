import type { PanelIcon } from '../config/cardLayout'

const stroke = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function PanelIconSvg({ type }: { type: PanelIcon }) {
  if (type === 'wrench') {
    return (
      <svg viewBox="0 0 24 24" {...stroke} stroke="#fff" strokeWidth="2">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
      </svg>
    )
  }
  if (type === 'person') {
    return (
      <svg viewBox="0 0 24 24" {...stroke} stroke="#fff" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" {...stroke} stroke="#fff" strokeWidth="2">
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />
    </svg>
  )
}

export function ChipIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} stroke="#5a1fe0" strokeWidth="2.2">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  )
}

export function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} stroke="#5a1fe0" strokeWidth="2.2">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      {...stroke}
      stroke="#5a1fe0"
      strokeWidth="3"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/** Default project badge (drone on blueprint) when builder has no upload */
export function DefaultProjectBadge() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="g2" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="#ffffff" strokeOpacity=".14" />
        </pattern>
        <radialGradient id="bgD" cx=".5" cy=".4">
          <stop offset="0" stopColor="#5b28d6" />
          <stop offset="1" stopColor="#230d66" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#bgD)" />
      <rect width="200" height="200" fill="url(#g2)" />
      <g transform="translate(14,8) scale(.86)">
        <g stroke="#e9ddff" strokeWidth="5" strokeLinecap="round">
          <path d="M100 100L52 58M100 100L148 58M100 100L52 142M100 100L148 142" />
        </g>
        <g fill="none" stroke="#c6a8ff" strokeWidth="3">
          <ellipse cx="52" cy="58" rx="30" ry="9" />
          <ellipse cx="148" cy="58" rx="30" ry="9" />
          <ellipse cx="52" cy="142" rx="30" ry="9" />
          <ellipse cx="148" cy="142" rx="30" ry="9" />
        </g>
        <g fill="#ffffff">
          <circle cx="52" cy="58" r="6" />
          <circle cx="148" cy="58" r="6" />
          <circle cx="52" cy="142" r="6" />
          <circle cx="148" cy="142" r="6" />
        </g>
        <rect x="78" y="84" width="44" height="32" rx="9" fill="#ffffff" />
        <rect x="88" y="92" width="24" height="16" rx="3" fill="#7b3bff" />
        <circle cx="100" cy="100" r="4" fill="#b9ff6a" />
      </g>
    </svg>
  )
}

/** Default company badge when mentor/judge has no logo upload */
export function DefaultCompanyBadge() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f1ff" />
          <stop offset="1" stopColor="#e2d4ff" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#og)" />
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="#9c7ae8"
        strokeWidth="3"
        strokeDasharray="7 7"
      />
      <g
        fill="none"
        stroke="#6a2ff0"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M66 132V70l34-16 34 16v62" />
        <path d="M58 132h84" />
        <path d="M84 84h8M108 84h8M84 102h8M108 102h8M96 132v-14h8v14" />
      </g>
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fontFamily="Poppins, sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#5a1fe0"
        letterSpacing="2"
      >
        LOGO
      </text>
    </svg>
  )
}

export function PhotoPlaceholderSilhouette() {
  return (
    <svg viewBox="0 0 380 300" style={{ width: '70%', height: 'auto' }}>
      <defs>
        <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a98bf0" />
          <stop offset="1" stopColor="#8460e0" />
        </linearGradient>
      </defs>
      <circle cx="190" cy="110" r="66" fill="url(#sil)" opacity=".75" />
      <path
        d="M40 300 C 40 215, 110 185, 190 185 C 270 185, 340 215, 340 300 Z"
        fill="url(#sil)"
        opacity=".75"
      />
    </svg>
  )
}
