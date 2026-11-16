/**
 * =============================================================================
 * IDEEZA Vibe Builders National Tour — Share Card Layout Config
 * =============================================================================
 *
 * THIS IS THE ONLY FILE designers need to edit for per-university variants.
 *
 * v1 ships Wolkite University only (no university picker in the UI). To spin up
 * another campus later: copy this file (or the `university` block), swap
 * `gatePhoto` / name / dates, and drop the new gate image into `public/campus/`.
 *
 * How to swap artwork:
 *  1. Replace files in `public/campus/` and `public/logos/` (same filenames).
 *  2. Nudge slot coordinates / fonts / colors below to match new artwork.
 *  3. All coordinates are in the native 1080×1350 export space.
 * =============================================================================
 */

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

export type DayId = 'day1' | 'day2' | 'day3'

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
  gradient?: string
}

export interface DayConfig {
  id: DayId
  /** Short label on the day picker */
  pickerLabel: string
  /** Longer description under the picker button */
  pickerHint: string
  /** Bold italic headline on the card */
  headline: string
  /** Small kicker under the headline */
  kicker: string
  /** Whether project + pitch fields matter most (shown on card when filled) */
  projectRequired: boolean
  defaultName: string
  defaultProject: string
  defaultPitch: string
}

export interface UniversityConfig {
  id: string
  name: string
  /** Display dates, e.g. "Nov 20–22" */
  dates: string
  /** Uppercase short dates for the card, e.g. "NOV 20–22" */
  datesShort: string
  /** Path under `public/` */
  gatePhoto: string
}

export interface CardLayoutConfig {
  width: number
  height: number
  registerUrl: string
  registerDisplayUrl: string
  tourLabel: string
  prizeHeadline: string
  tagline: string
  fontFamily: string
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
  /** Active university for this build (v1 = Wolkite only) */
  university: UniversityConfig
  days: Record<DayId, DayConfig>
  slots: {
    topLogos: Rect & { ideezaHeight: number; checheHeight: number }
    tourPill: Rect & {
      fontSize: number
      letterSpacing: number
      paddingX: number
      paddingY: number
    }
    headline: {
      x: number
      y: number
      w: number
      h1: TextStyle
      uni: TextStyle
      dates: TextStyle
    }
    gate: Rect & { borderRadius: number }
    photo: Rect & { borderRadius: string; borderWidth: number }
    prize: {
      x: number
      y: number
      w: number
      fontSize: number
      fontWeight: number
      color: string
      letterSpacing: number
    }
    namePanel: {
      x: number
      y: number
      w: number
      name: TextStyle
      project: TextStyle
      pitch: TextStyle
    }
    logoStrip: Rect & {
      heights: { cheche: number; zemenay: number; insa: number }
    }
  }
}

export const DAY_ORDER: DayId[] = ['day1', 'day2', 'day3']

export const cardLayout: CardLayoutConfig = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  registerUrl: 'https://luma.com/lj4evitk',
  registerDisplayUrl: 'luma.com/lj4evitk',
  tourLabel: 'VIBE BUILDERS NATIONAL TOUR',
  prizeHeadline: '50,000 birr Prize',
  tagline: 'Turn Your Ideas into Real Hardware',
  fontFamily: 'Poppins, sans-serif',
  colors: {
    navy: '#1a0a3e',
    violet: '#6a2ff0',
    violetSoft: '#8b45ff',
    magenta: '#b01fff',
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
  days: {
    day1: {
      id: 'day1',
      pickerLabel: 'Day 1',
      pickerHint: 'Workshop',
      headline: 'I joined the\nVibe Builders Workshop',
      kicker: 'Day 1 · Workshop',
      projectRequired: false,
      defaultName: 'Your Name',
      defaultProject: '',
      defaultPitch: '',
    },
    day2: {
      id: 'day2',
      pickerLabel: 'Day 2',
      pickerHint: 'Vibe Inventing Hackathon',
      headline: 'I built this',
      kicker: 'Day 2 · IDEEZA Vibe Inventing Hackathon',
      projectRequired: true,
      defaultName: 'Your Name',
      defaultProject: 'Project Name',
      defaultPitch: 'One-line pitch',
    },
    day3: {
      id: 'day3',
      pickerLabel: 'Day 3',
      pickerHint: 'Code H.E.R Future Hackathon',
      headline: 'She built this',
      kicker: 'Day 3 · Code H.E.R Future Hackathon by Cheche Technologies',
      projectRequired: true,
      defaultName: 'Your Name',
      defaultProject: 'Project Name',
      defaultPitch: 'One-line pitch',
    },
  },
  slots: {
    topLogos: {
      x: 64,
      y: 42,
      w: 952,
      h: 72,
      ideezaHeight: 56,
      checheHeight: 52,
    },
    tourPill: {
      x: 120,
      y: 128,
      w: 840,
      h: 56,
      fontSize: 22,
      letterSpacing: 2.2,
      paddingX: 28,
      paddingY: 12,
    },
    headline: {
      x: 64,
      y: 198,
      w: 952,
      h1: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 58,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#1a0a3e',
        letterSpacing: -1.2,
        lineHeight: 1.05,
        gradient: 'linear-gradient(180deg, #b01fff 0%, #4b17c9 100%)',
      },
      uni: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 28,
        fontWeight: 800,
        fontStyle: 'italic',
        color: '#4b17c9',
        letterSpacing: -0.4,
        lineHeight: 1.2,
      },
      dates: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        color: '#1a0a3e',
        letterSpacing: 1.5,
        lineHeight: 1.2,
      },
    },
    gate: {
      x: 64,
      y: 400,
      w: 952,
      h: 360,
      borderRadius: 28,
    },
    photo: {
      x: 96,
      y: 620,
      w: 200,
      h: 200,
      borderRadius: '50%',
      borderWidth: 6,
    },
    prize: {
      x: 64,
      y: 790,
      w: 952,
      fontSize: 56,
      fontWeight: 900,
      color: '#6a2ff0',
      letterSpacing: -1,
    },
    namePanel: {
      x: 64,
      y: 880,
      w: 952,
      name: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 42,
        fontWeight: 800,
        color: '#1a0a3e',
        letterSpacing: -0.5,
        lineHeight: 1.15,
      },
      project: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 28,
        fontWeight: 700,
        color: '#4b17c9',
        letterSpacing: -0.3,
        lineHeight: 1.25,
      },
      pitch: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 22,
        fontWeight: 500,
        color: '#4a3a7a',
        lineHeight: 1.35,
      },
    },
    logoStrip: {
      x: 64,
      y: 1180,
      w: 952,
      h: 120,
      heights: { cheche: 72, zemenay: 56, insa: 88 },
    },
  },
}
