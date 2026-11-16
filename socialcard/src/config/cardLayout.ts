/**
 * =============================================================================
 * IDEEZA Vibe Builders National Tour — Share Card Layout Config (Option A)
 * =============================================================================
 *
 * Hero-portrait layout. Designers: swap logos / campus gate in `public/`,
 * nudge slots below. All coordinates are native 1080×1350 export space.
 * =============================================================================
 */

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  fontStyle?: 'normal' | 'italic'
  color: string
  letterSpacing?: number
  lineHeight?: number
  textTransform?: 'uppercase' | 'none'
}

export interface UniversityConfig {
  id: string
  name: string
  dates: string
  datesShort: string
  gatePhoto: string
}

export interface CardLayoutConfig {
  width: number
  height: number
  registerUrl: string
  registerDisplayUrl: string
  tourLabel: string
  eventName: string
  identityLine: string
  prizeHeadline: string
  fontFamily: string
  displayFontFamily: string
  colors: {
    navy: string
    violet: string
    violetSoft: string
    magenta: string
    lavender: string
    muted: string
    white: string
  }
  logos: {
    ideeza: string
    checheImpact: string
    cheche: string
    zemenay: string
    insa: string
  }
  university: UniversityConfig
  slots: {
    topLogos: Rect & { ideezaHeight: number; checheHeight: number }
    tourPill: Rect & {
      fontSize: number
      letterSpacing: number
      paddingX: number
      paddingY: number
    }
    gate: Rect
    photo: Rect & {
      borderWidth: number
      ringWidth: number
    }
    name: Rect & TextStyle
    identity: Rect & TextStyle
    eventPill: Rect & {
      fontSize: number
      fontWeight: number
      color: string
      paddingX: number
      paddingY: number
    }
    prize: Rect & TextStyle
    logoStrip: Rect & {
      heights: { cheche: number; zemenay: number; insa: number }
    }
  }
}

const DISPLAY = 'Montserrat, Poppins, sans-serif'
const BODY = 'Poppins, sans-serif'

/** ~55% of card width */
const PHOTO_SIZE = 594

export const cardLayout: CardLayoutConfig = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  registerUrl: 'https://luma.com/lj4evitk',
  registerDisplayUrl: 'luma.com/lj4evitk',
  tourLabel: 'VIBE BUILDERS NATIONAL TOUR',
  eventName: 'Vibe Builders Hackathon',
  identityLine: "I'm a Vibe Builder",
  prizeHeadline: '50,000 birr Prize',
  fontFamily: BODY,
  displayFontFamily: DISPLAY,
  colors: {
    navy: '#12052e',
    violet: '#6a2ff0',
    violetSoft: '#8b45ff',
    magenta: '#c43bff',
    lavender: '#f3eeff',
    muted: '#4a3a7a',
    white: '#ffffff',
  },
  logos: {
    ideeza: '/logos/logo_ideeza.png',
    checheImpact: '/logos/logo_cheche_impact.png',
    cheche: '/logos/logo_cheche.png',
    zemenay: '/logos/logo_zemenay.png',
    insa: '/logos/logo_insa.png',
  },
  university: {
    id: 'wolkite',
    name: 'Wolkite University',
    dates: 'Nov 20–22',
    datesShort: 'NOV 20–22',
    gatePhoto: '/campus/wolkite-gate.png',
  },
  slots: {
    topLogos: {
      x: 64,
      y: 36,
      w: 952,
      h: 64,
      ideezaHeight: 52,
      checheHeight: 48,
    },
    tourPill: {
      x: 100,
      y: 112,
      w: 880,
      h: 52,
      fontSize: 20,
      letterSpacing: 2.4,
      paddingX: 26,
      paddingY: 12,
    },
    gate: {
      x: 40,
      y: 170,
      w: 1000,
      h: 520,
    },
    photo: {
      x: Math.round((CARD_WIDTH - PHOTO_SIZE) / 2),
      y: 250,
      w: PHOTO_SIZE,
      h: PHOTO_SIZE,
      borderWidth: 14,
      ringWidth: 6,
    },
    name: {
      x: 48,
      y: 880,
      w: 984,
      h: 110,
      fontFamily: DISPLAY,
      fontSize: 72,
      fontWeight: 900,
      fontStyle: 'italic',
      color: '#12052e',
      letterSpacing: -1.5,
      lineHeight: 0.95,
      textTransform: 'uppercase',
    },
    identity: {
      x: 64,
      y: 990,
      w: 952,
      h: 48,
      fontFamily: BODY,
      fontSize: 32,
      fontWeight: 700,
      color: '#6a2ff0',
      letterSpacing: -0.3,
      lineHeight: 1.2,
    },
    eventPill: {
      x: 90,
      y: 1050,
      w: 900,
      h: 52,
      fontSize: 20,
      fontWeight: 600,
      color: '#3a2a6a',
      paddingX: 28,
      paddingY: 12,
    },
    prize: {
      x: 64,
      y: 1120,
      w: 952,
      h: 56,
      fontFamily: DISPLAY,
      fontSize: 40,
      fontWeight: 900,
      fontStyle: 'italic',
      color: '#6a2ff0',
      letterSpacing: -0.6,
      lineHeight: 1.1,
    },
    logoStrip: {
      x: 48,
      y: 1210,
      w: 984,
      h: 100,
      heights: { cheche: 64, zemenay: 50, insa: 76 },
    },
  },
}
