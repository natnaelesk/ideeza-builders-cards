/**
 * IDEEZA Virtual Hackathon share-card layout (1080×1350).
 * Based on approved Option 2 mockup, with portrait photo slot + public-vote chip.
 */

export const HACKATHON_CARD_WIDTH = 1080
export const HACKATHON_CARD_HEIGHT = 1350

export const HACKATHON_SITE_URL = 'https://www.ideeza.com'
export const HACKATHON_TELEGRAM = 't.me/ideeza_chat'
export const HACKATHON_TELEGRAM_URL = 'https://t.me/ideeza_chat'

export const hackathonLayout = {
  width: HACKATHON_CARD_WIDTH,
  height: HACKATHON_CARD_HEIGHT,
  siteUrl: HACKATHON_SITE_URL,
  telegramHandle: HACKATHON_TELEGRAM,
  logos: {
    ideezaWhite: '/logos/logo_ideeza_white.png',
  },
  copy: {
    pill: 'VIRTUAL HACKATHON',
    prizesLabel: 'Total prizes',
    prizesAmount: '160,000',
    prizesSub: '1st 100K · 2nd 40K · 3rd 20K · grand prize over $1,000',
    headlineThin: "I'm",
    headlineHeavy: 'building.',
    headlineSub: 'Vote for my project.',
    voteChip: 'Public vote decides',
    cta: 'Join at ideeza.com',
    footNote: 'Share your link.',
    defaultName: 'Your Name',
    defaultProject: 'Project name — one-line pitch',
  },
} as const
