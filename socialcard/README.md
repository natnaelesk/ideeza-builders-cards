# IDEEZA Vibe Builders National Tour — Builder ID Badge

Mobile-first share-card generator. The approved **final-badge-v2** artwork
(1080×1440) is the template; the app composites the user’s photo, name, and
university line on a `<canvas>` at the measured badge tilt (**5.673°**
clockwise).

University is a single switch in `src/config/event.ts`:

```ts
export const UNIVERSITY = 'Wolkite University'
```

## Quick start

```bash
cd socialcard
npm install
python3 scripts/make-template.py
npm run dev
```

```bash
npm run build && npm run preview
npm run test:share
```

## How the card is built

1. `scripts/make-template.py` clears the sample photo, name, and event-line text
   from `public/template/final-badge-v2-source.png` and writes
   `public/template/badge-template.png` + `badge-geometry.json`.
2. The app draws the template, then three tilted layers:
   - uploaded photo clipped to the rounded photo window (`object-fit: cover`,
     FaceDetector centering when available, otherwise a slight upward bias)
   - name (Anton condensed, white + soft glow)
   - `${UNIVERSITY} · Nov 20–22`
3. Download exports the canvas as PNG 1080×1440.

## Mobile layout

On phones the card fills the viewport. Controls live in a compact bottom sheet
(name, Pick photo, Download, Share) so the preview stays visible while typing —
including when the iOS keyboard is open (visualViewport inset).

## Stack

- Vite + React + TypeScript
- Anton + Poppins (bundled)
- Canvas export

Spelling is always **Cheche**. Register link: `https://luma.com/lj4evitk`.
