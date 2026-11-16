# IDEEZA Vibe Builders National Tour — Share Cards

Mobile-first **hero-portrait** share-card generator for the **Vibe Builders National Tour**  
(**Wolkite University · Nov 20–22** · IDEEZA × Cheche Impact × Zemenay Tech × INSA).

Enter your name, upload a photo (optional pan/zoom), preview live, then download a crisp **1080×1350 PNG**. LinkedIn and X open a share sheet with the rendered card and ready-made post text (X posts stay under 280 characters).

Everything runs client-side. Nothing is uploaded or stored.

University name, dates, and gate photo live in `src/config/cardLayout.ts` so a future campus can be a config + asset swap.

Deploy as a **separate Vercel project** with **Root Directory = `socialcard`** (domain: socialcard.natnaelesk.com). This folder is independent of the Builders' Lab cards app at the repo root.

## Quick start

```bash
cd socialcard
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Share-text length tests (X 280-char guard):

```bash
npm run test:share
```

## Card layout (Option A)

Top → bottom:

1. IDEEZA | Cheche Impact logos  
2. `// VIBE BUILDERS NATIONAL TOUR` pill  
3. Soft Wolkite gate backdrop + large circular portrait (~55% width) with purple gradient ring  
4. Name (huge bold italic uppercase)  
5. “I'm a Vibe Builder”  
6. Outlined pill: Vibe Builders Hackathon · Wolkite University · Nov 20–22  
7. **50,000 birr Prize**  
8. Partner logos: Cheche Impact, Zemenay Tech, INSA  

## How to swap artwork (designers)

1. Replace files in `public/campus/` and `public/logos/` (same filenames).
2. Open **`src/config/cardLayout.ts`** — university block + logo paths + slot coordinates.
3. All positions are in the native **1080×1350** space.

Spelling is always **Cheche** (never CheChe).

## Share copy

Post templates live in `src/config/shareText.ts`. Every post mentions Wolkite University, the Vibe Builders Hackathon, IDEEZA and Cheche, the prize, and `https://luma.com/lj4evitk`.

## Stack

- Vite + React + TypeScript
- Montserrat Black/ExtraBold Italic (bundled in `public/fonts/`) + Poppins
- `html-to-image` for PNG export
