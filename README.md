# IDEEZA Builders' Lab 2.0 — Share Cards

Mobile-first share-card generator for **Builders' Lab 2.0 Pitch Day**  
(Sat, Oct 10, 2026 · IDEEZA × Women Techmakers Ethiopia × FCA Creators Hub · 6 Kilo, Addis Ababa).

Pick a role (Builder / Mentor / Judge), upload a photo, enter your name + subtitle, optionally add a project image or company logo, preview live, then download a crisp **1080×1350 PNG**. On phones that support it, you can also share the file via the Web Share API.

Staff and custom roles use an unlisted **`/team`** route (e.g. `/team?role=Organizer`) — type your own role label; the pill and headline update live. The main page does not link to it.

**Virtual Hackathon** cards live at **`/hackathon`** — "Option 5 holo ticket" design (violet ballot ticket, ME + MY PROJECT uploads, vote stub with QR to `www.ideeza.com`), full-glyph Poppins + Anton self-hosted as woff2. Same form → live preview → Download PNG / LinkedIn / X UX.

Everything runs client-side. Nothing is uploaded or stored.

Vercel serves SPA routes via `vercel.json` rewrites so `/team` and `/hackathon` work on direct load and refresh.

## Quick start

```bash
npm install
npm run dev
```

Production build (static site for Vercel):

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder as a static site on Vercel (Vite is auto-detected).

## How to swap the frame (designers)

The current look is a **placeholder**. When the final artwork is ready:

1. Drop full-bleed **1080×1350** PNG or SVG frames into `public/frames/`  
   (e.g. `builder.png`, `mentor.png`, `judge.png`).
2. Open **`src/config/cardLayout.ts`** — this is the only layout file.
3. Set each role’s `frameSrc`:

   ```ts
   roles: {
     builder: { frameSrc: '/frames/builder.png', /* … */ },
     mentor:  { frameSrc: '/frames/mentor.png',  /* … */ },
     judge:   { frameSrc: '/frames/judge.png',   /* … */ },
   }
   ```

   Use `frameSrc: null` to keep the built-in lavender gradient + glassy spheres.
4. Nudge slot coordinates, fonts, and colors in the same file (`slots.*`, `colors`, per-role text).  
   All positions are in the native **1080×1350** space.
5. No React component changes are required.

See also `public/frames/README.md`.

## How to replace logos

All partner logos live in **`public/logos/`**:

| File | Brand |
|------|--------|
| `logo_ideeza.png` | IDEEZA |
| `logo_wtm.png` | Women Techmakers |
| `logo_fca.png` | FCA Creators Hub |

Replace the files (same names). Paths are wired in `cardLayout.logos`. Prefer higher-resolution crops when available — the current files are low-res reference crops from `reference/assets/`.

## Waitlist QR

The card QR encodes `https://www.ideeza.com/waitlist` (plain URL, no referral tracking). It is generated client-side with the `qrcode` library.

## Reference

`reference/` holds the original HTML/CSS template (`card.html`), logo crops, and sample PNG renders used as the visual starting point.

## Stack

- Vite + React + TypeScript + React Router
- Poppins (Google Fonts)
- `html-to-image` for PNG export
- `qrcode` for the waitlist QR
