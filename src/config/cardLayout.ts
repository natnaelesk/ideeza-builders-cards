/**
 * =============================================================================
 * IDEEZA Builders' Lab 2.0 — Share Card Layout Config
 * =============================================================================
 *
 * THIS IS THE ONLY FILE designers need to edit when swapping the frame.
 *
 * How to swap the design:
 *  1. Drop full-bleed 1080×1350 PNG/SVG frames into `public/frames/`
 *     (e.g. builder.png, mentor.png, judge.png).
 *  2. Set each role's `frameSrc` below (e.g. '/frames/builder.png').
 *     Set to `null` to keep the built-in lavender placeholder background.
 *  3. Nudge slot coordinates / fonts / colors below to match the new artwork.
 *  4. Replace logos in `public/logos/` (same filenames) — no code changes.
 *
 * All coordinates are in the native 1080×1350 export space.
 * Components read this config; they do not hardcode layout.
 * =============================================================================
 */

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

export type RoleId = 'builder' | 'mentor' | 'judge'
export type PanelIcon = 'wrench' | 'person' | 'star'

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
  color: string
  letterSpacing?: number
  lineHeight?: number
  /** CSS background for gradient text (uses background-clip) */
  gradient?: string
}

export interface RoleConfig {
  /** Shown in the role pill */
  pillLabel: string
  headline1: string
  headline2: string
  /** Small line under the swoosh */
  kickerHtml: string
  defaultName: string
  defaultSub: string
  /** Form labels / placeholders */
  nameLabel: string
  namePlaceholder: string
  subLabel: string
  subPlaceholder: string
  badgeTag: string
  badgeUploadLabel: string
  panelIcon: PanelIcon
  /**
   * Full-bleed designer frame (PNG/SVG) under all slots.
   * Path is relative to `public/`. `null` = procedural placeholder background.
   */
  frameSrc: string | null
  /** Builder-only blueprint crosshair behind the badge */
  showBlueprint: boolean
}

export interface CardLayoutConfig {
  width: number
  height: number
  waitlistUrl: string
  waitlistDisplayUrl: string
  eventLine: string
  tagline: string
  fontFamily: string
  colors: {
    navy: string
    violet: string
    violetSoft: string
    lavender: string
    muted: string
    white: string
    lime: string
  }
  logos: {
    ideaza: string
    wtm: string
    fca: string
  }
  slots: {
    brandLogo: Rect & { imgHeight: number }
    rolePill: Rect & {
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
      swooshWidth: number
      swooshHeight: number
      swooshColor: string
      kicker: TextStyle
    }
    photo: Rect & {
      borderRadius: string
      dashedInset: number
    }
    badge: Rect & {
      tagOffsetY: number
    }
    blueprint: Rect
    namePanel: Rect & {
      iconSize: number
      name: TextStyle
      sub: TextStyle
    }
    chips: {
      x: number
      y: number
      w: number
      gap: number
      items: Array<{ title: string; subtitle: string; icon: 'chip' | 'trophy' }>
    }
    qr: Rect & {
      codeSize: number
      caption: TextStyle
      url: TextStyle
    }
    ctaRow: {
      x: number
      y: number
      w: number
      ctaLabel: string
      tagline: TextStyle
      event: TextStyle
    }
    logoStrip: Rect & {
      heights: { ideaza: number; wtm: number; fca: number }
    }
  }
  roles: Record<RoleId, RoleConfig>
}

export const cardLayout: CardLayoutConfig = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  waitlistUrl: 'https://www.ideeza.com/waitlist',
  waitlistDisplayUrl: 'ideeza.com/waitlist',
  eventLine: 'Pitch Day · Sat, Oct 10 · 6 Kilo, Addis Ababa',
  tagline: "Next time, you're in the room.",
  fontFamily: 'Poppins, sans-serif',
  colors: {
    navy: '#1c0f45',
    violet: '#6a2ff0',
    violetSoft: '#8b45ff',
    lavender: '#efe8ff',
    muted: '#4a3a7a',
    white: '#ffffff',
    lime: '#b9ff6a',
  },
  logos: {
    ideaza: '/logos/logo_ideeza.png',
    wtm: '/logos/logo_wtm.png',
    fca: '/logos/logo_fca.png',
  },
  slots: {
    brandLogo: { x: 64, y: 52, w: 280, h: 84, imgHeight: 72 },
    rolePill: {
      x: 700,
      y: 64,
      w: 316,
      h: 60,
      fontSize: 22,
      letterSpacing: 2.5,
      paddingX: 22,
      paddingY: 12,
    },
    headline: {
      x: 64,
      y: 168,
      w: 952,
      h1: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 104,
        fontWeight: 900,
        color: '#1c0f45',
        letterSpacing: -2.5,
        lineHeight: 1.0,
      },
      h2: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 68,
        fontWeight: 800,
        color: '#5a1fe0',
        letterSpacing: -1.5,
        lineHeight: 1.1,
        gradient: 'linear-gradient(90deg, #5a1fe0 0%, #8b45ff 55%, #b07bff 100%)',
      },
      swooshWidth: 360,
      swooshHeight: 18,
      swooshColor: '#6a2ff0',
      kicker: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 22,
        fontWeight: 500,
        color: '#4a3a7a',
        lineHeight: 1.3,
      },
    },
    photo: {
      x: 64,
      y: 470,
      w: 540,
      h: 520,
      borderRadius: '270px 270px 40px 40px',
      dashedInset: 18,
    },
    badge: {
      x: 470,
      y: 720,
      w: 200,
      h: 200,
      tagOffsetY: -16,
    },
    blueprint: { x: 430, y: 680, w: 280, h: 280 },
    namePanel: {
      x: 40,
      y: 940,
      w: 640,
      h: 140,
      iconSize: 84,
      name: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 40,
        fontWeight: 800,
        color: '#1c0f45',
        letterSpacing: -0.5,
        lineHeight: 1.1,
      },
      sub: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 22,
        fontWeight: 500,
        color: '#4a3a7a',
        lineHeight: 1.3,
      },
    },
    chips: {
      x: 726,
      y: 492,
      w: 290,
      gap: 14,
      items: [
        { title: 'Hardware', subtitle: 'built on IDEEZA', icon: 'chip' },
        { title: '10,000 ETB', subtitle: 'prize pool', icon: 'trophy' },
      ],
    },
    qr: {
      x: 726,
      y: 752,
      w: 290,
      h: 320,
      codeSize: 210,
      caption: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#1c0f45',
        lineHeight: 1.25,
      },
      url: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 16,
        fontWeight: 600,
        color: '#6a2ff0',
        letterSpacing: 0.4,
      },
    },
    ctaRow: {
      x: 64,
      y: 1118,
      w: 952,
      ctaLabel: 'Join the waitlist',
      tagline: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 26,
        fontWeight: 800,
        color: '#1c0f45',
        letterSpacing: -0.3,
      },
      event: {
        fontFamily: 'Poppins, sans-serif',
        fontSize: 18,
        fontWeight: 500,
        color: '#5b4b8a',
      },
    },
    logoStrip: {
      x: 64,
      y: 1210,
      w: 952,
      h: 110,
      heights: { ideaza: 62, wtm: 84, fca: 54 },
    },
  },
  roles: {
    builder: {
      pillLabel: 'BUILDER · PITCHING',
      headline1: 'I built this.',
      headline2: 'In 14 days with IDEEZA',
      kickerHtml:
        "<b>Builders' Lab 2.0</b> · IDEEZA x Women Techmakers x FCA Creators Hub",
      defaultName: 'Your Name',
      defaultSub: 'Project Name — one-line pitch',
      nameLabel: 'Your name',
      namePlaceholder: 'Hana Tadesse',
      subLabel: 'Project name + one-line pitch',
      subPlaceholder: 'SoilSense — soil moisture for small farms',
      badgeTag: 'MY PROJECT',
      badgeUploadLabel: 'Project image (optional)',
      panelIcon: 'wrench',
      // Drop /frames/builder.png and set this path to swap the designer frame.
      frameSrc: null,
      showBlueprint: true,
    },
    mentor: {
      pillLabel: 'MENTOR',
      headline1: 'Mentoring at',
      headline2: "Builders' Lab 2.0",
      kickerHtml:
        '<b>Pitch Day</b> · IDEEZA x Women Techmakers x FCA Creators Hub',
      defaultName: 'Mentor Name',
      defaultSub: 'Title, Company',
      nameLabel: 'Your name',
      namePlaceholder: 'Sara Bekele',
      subLabel: 'Title, company',
      subPlaceholder: 'Hardware Lead, Acme Labs',
      badgeTag: 'COMPANY',
      badgeUploadLabel: 'Company logo (optional)',
      panelIcon: 'person',
      frameSrc: null,
      showBlueprint: false,
    },
    judge: {
      pillLabel: 'JUDGE',
      headline1: 'Judging at',
      headline2: "Builders' Lab 2.0",
      kickerHtml:
        '<b>Pitch Day</b> · IDEEZA x Women Techmakers x FCA Creators Hub',
      defaultName: 'Judge Name',
      defaultSub: 'Title, Company',
      nameLabel: 'Your name',
      namePlaceholder: 'Meron Alemu',
      subLabel: 'Title, company',
      subPlaceholder: 'Partner, Addis Ventures',
      badgeTag: 'COMPANY',
      badgeUploadLabel: 'Company logo (optional)',
      panelIcon: 'star',
      frameSrc: null,
      showBlueprint: false,
    },
  },
}

export const ROLE_ORDER: RoleId[] = ['builder', 'mentor', 'judge']
