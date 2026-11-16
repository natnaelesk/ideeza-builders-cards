# IDEEZA Vibe Builders National Tour — Share Cards

Mobile-first share-card generator for the **Vibe Builders National Tour**  
(**Wolkite University · Nov 20–22** · IDEEZA × Cheche Impact × Zemenay Tech × INSA).

Pick a day (Day 1 Workshop / Day 2 Vibe Inventing Hackathon / Day 3 Code H.E.R Future Hackathon), enter your name, optionally add project + pitch and a photo, preview live, then download a crisp **1080×1350 PNG**. LinkedIn and X open a share sheet with the rendered card and ready-made post text (X posts stay under 280 characters).

Everything runs client-side. Nothing is uploaded or stored.

**v1 is Wolkite-only** — there is no university picker. University name, dates, and gate photo live in `src/config/cardLayout.ts` so a future campus can be a config + asset swap.

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

## Days

| Day | Card headline | Project / pitch |
|-----|---------------|-----------------|
| Day 1 Workshop | I joined the Vibe Builders Workshop | Optional — hidden on the card when empty |
| Day 2 IDEEZA Vibe Inventing Hackathon | I built this | Shown (placeholders until filled) |
| Day 3 Code H.E.R Future Hackathon | She built this | Shown (placeholders until filled) |

Prize line on every card: **50,000 birr Prize** (total pool only).

## How to swap artwork (designers)

1. Replace files in `public/campus/` and `public/logos/` (same filenames), or add a new campus image.
2. Open **`src/config/cardLayout.ts`** — university block + logo paths + slot coordinates.
3. For another university later: copy the `university` config, set `name` / `dates` / `gatePhoto`, and drop the gate PNG into `public/campus/`.
4. All positions are in the native **1080×1350** space. No React changes required for asset swaps.

### Assets

| Path | What |
|------|------|
| `public/campus/wolkite-gate.png` | Wolkite University gate (cropped from the Wolkite poster) |
| `public/logos/logo_ideeza.png` | IDEEZA |
| `public/logos/logo_cheche_impact.png` | Cheche Impact (top bar) |
| `public/logos/logo_cheche.png` | Cheche (partner strip) |
| `public/logos/logo_zemenay.png` | Zemenay Tech |
| `public/logos/logo_insa.png` | INSA |

Spelling is always **Cheche** (never CheChe).

## Share copy

Post templates live in `src/config/shareText.ts`. Every post mentions Wolkite University, the Vibe Builders National Tour, IDEEZA and Cheche, and the registration link `https://luma.com/lj4evitk`. LinkedIn includes `@IDEEZA` / `@Cheche Impact` plus the IDEEZA links block; X uses plain IDEEZA / Cheche with `#VibeBuilders #IDEEZA #Cheche`.

## Stack

- Vite + React + TypeScript
- Poppins (Google Fonts, incl. italic)
- `html-to-image` for PNG export
