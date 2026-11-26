/**
 * IDEEZA Virtual Hackathon share-card layout (1080×1350).
 * "Option 5 — holo ticket" design: violet ballot ticket with ME + MY PROJECT
 * frames and a vertical tear-off stub (vote CTA + QR).
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
    pill: 'Virtual Hackathon',
    headlineThin: "I'm",
    headlineHeavy: 'BUILDING.',
    ballotLabel: 'Official ballot',
    ballotNo: 'Nº 0001',
    prizesLabel: 'Total prizes',
    prizesAmount: '160,000',
    prizesBreakdown: ['1st 100K', '2nd 40K', '3rd 20K'],
    grandPrize: 'Grand prize over $1,000',
    voteStub: 'Vote for my project.',
    voteChip: 'Public vote decides',
    cta: 'Join at ideeza.com',
    siteLabel: 'www.ideeza.com',
    defaultName: 'Your Name',
    defaultProject: 'Project name — one-line pitch',
  },
} as const
