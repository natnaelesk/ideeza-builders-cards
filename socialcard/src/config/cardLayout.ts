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
  textTransform?: 'uppercase' | 'none'
}

export interface DayConfig {
  id: DayId
  pickerLabel: string
  pickerHint: string
  /** First headline line — black italic uppercase (poster “WOLKITE” style) */
  headline1: string
  /** Second headline line — purple gradient italic uppercase */
  headline2: string
  kicker: string
  /** Frosted-panel fallback line when project/pitch empty (keeps Day 1 full) */
  emptyPanelSub: string
  projectRequired: boolean
  defaultName: string
  defaultProject: string
  defaultPitch: string
}

export interface UniversityConfig {
  id: string
  name: string
  /** Two-line display: ["WOLKITE", "UNIVERSITY"] */
  nameLines: [string, string]
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
  prizeHeadline: string
  tagline: string
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
      h2: TextStyle
      uni1: TextStyle
      uni2: TextStyle
      tagline: TextStyle
      kicker: TextStyle
    }
    gate: Rect
    photo: Rect & { borderWidth: number; ringWidth: number }
    datesPrize: {
      x: number
      y: number
      w: number
      dates: TextStyle
      prize: TextStyle
    }
    namePanel: Rect & {
      iconSize: number
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

const DISPLAY = 'Montserrat, Poppins, sans-serif'
const BODY = 'Poppins, sans-serif'

export const cardLayout: CardLayoutConfig = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  registerUrl: 'https://luma.com/lj4evitk',
  registerDisplayUrl: 'luma.com/lj4evitk',
  tourLabel: 'VIBE BUILDERS NATIONAL TOUR',
  prizeHeadline: '50,000 birr Prize',
  tagline: 'Turn Your Ideas into Real Hardware',
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
    nameLines: ['WOLKITE', 'UNIVERSITY'],
    dates: 'Nov 20–22',
    datesShort: 'NOV 20–22',
    gatePhoto: '/campus/wolkite-gate.png',
  },
  days: {
    day1: {
      id: 'day1',
      pickerLabel: 'Day 1',
      pickerHint: 'Workshop',
      headline1: 'I JOINED THE',
      headline2: 'VIBE BUILDERS\nWORKSHOP',
      kicker: 'Day 1 · Workshop',
      emptyPanelSub: 'Day 1 · Workshop · Built with IDEEZA',
      projectRequired: false,
      defaultName: 'Your Name',
      defaultProject: '',
      defaultPitch: '',
    },
    day2: {
      id: 'day2',
      pickerLabel: 'Day 2',
      pickerHint: 'Vibe Inventing Hackathon',
      headline1: 'I BUILT',
      headline2: 'THIS',
      kicker: 'Day 2 · IDEEZA Vibe Inventing Hackathon',
      emptyPanelSub: 'Day 2 · IDEEZA Vibe Inventing Hackathon',
      projectRequired: true,
      defaultName: 'Your Name',
      defaultProject: 'Project Name',
      defaultPitch: 'One-line pitch',
    },
    day3: {
      id: 'day3',
      pickerLabel: 'Day 3',
      pickerHint: 'Code H.E.R Future Hackathon',
      headline1: 'SHE BUILT',
      headline2: 'THIS',
      kicker: 'Day 3 · Code H.E.R Future Hackathon by Cheche Technologies',
      emptyPanelSub:
        'Day 3 · Code H.E.R Future Hackathon · Built with IDEEZA',
      projectRequired: true,
      defaultName: 'Your Name',
      defaultProject: 'Project Name',
      defaultPitch: 'One-line pitch',
    },
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
    headline: {
      x: 48,
      y: 170,
      w: 984,
      h1: {
        fontFamily: DISPLAY,
        fontSize: 50,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#12052e',
        letterSpacing: -1.2,
        lineHeight: 0.95,
        textTransform: 'uppercase',
      },
      h2: {
        fontFamily: DISPLAY,
        fontSize: 48,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#6a2ff0',
        letterSpacing: -1.2,
        lineHeight: 0.95,
        textTransform: 'uppercase',
        gradient: 'linear-gradient(180deg, #d24bff 0%, #5a1fe0 55%, #3a0f9a 100%)',
      },
      uni1: {
        fontFamily: DISPLAY,
        fontSize: 30,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#12052e',
        letterSpacing: -0.6,
        lineHeight: 0.98,
        textTransform: 'uppercase',
      },
      uni2: {
        fontFamily: DISPLAY,
        fontSize: 30,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#6a2ff0',
        letterSpacing: -0.6,
        lineHeight: 0.98,
        textTransform: 'uppercase',
        gradient: 'linear-gradient(180deg, #c43bff 0%, #5a1fe0 100%)',
      },
      tagline: {
        fontFamily: DISPLAY,
        fontSize: 18,
        fontWeight: 700,
        fontStyle: 'italic',
        color: '#3a2a6a',
        letterSpacing: 0.2,
        lineHeight: 1.2,
      },
      kicker: {
        fontFamily: BODY,
        fontSize: 15,
        fontWeight: 600,
        color: '#5b4b8a',
        lineHeight: 1.25,
      },
    },
    gate: {
      x: 28,
      y: 430,
      w: 1024,
      h: 430,
    },
    photo: {
      x: 68,
      y: 690,
      w: 176,
      h: 176,
      borderWidth: 7,
      ringWidth: 4,
    },
    datesPrize: {
      x: 64,
      y: 870,
      w: 952,
      dates: {
        fontFamily: BODY,
        fontSize: 30,
        fontWeight: 800,
        color: '#12052e',
        letterSpacing: 1.8,
        lineHeight: 1.15,
      },
      prize: {
        fontFamily: DISPLAY,
        fontSize: 48,
        fontWeight: 900,
        fontStyle: 'italic',
        color: '#6a2ff0',
        letterSpacing: -0.8,
        lineHeight: 1.1,
      },
    },
    namePanel: {
      x: 64,
      y: 990,
      w: 952,
      h: 158,
      iconSize: 76,
      name: {
        fontFamily: BODY,
        fontSize: 34,
        fontWeight: 800,
        color: '#12052e',
        letterSpacing: -0.4,
        lineHeight: 1.15,
      },
      project: {
        fontFamily: BODY,
        fontSize: 24,
        fontWeight: 700,
        color: '#5a1fe0',
        letterSpacing: -0.2,
        lineHeight: 1.25,
      },
      pitch: {
        fontFamily: BODY,
        fontSize: 20,
        fontWeight: 500,
        color: '#4a3a7a',
        lineHeight: 1.3,
      },
    },
    logoStrip: {
      x: 48,
      y: 1168,
      w: 984,
      h: 120,
      heights: { cheche: 70, zemenay: 54, insa: 82 },
    },
  },
}
