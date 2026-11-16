# IDEEZA Vibe Builders National Tour — Builder ID Badge

Mobile-first share-card generator. The approved **final-badge-v2** artwork
(1080×1440) is the template; the app composites the user’s cutout photo, name,
and university line on a `<canvas>` at the measured badge tilt (**5.673°**
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
   - cutout photo clipped to the rounded photo window
   - name (Anton condensed, white + soft shadow)
   - `${UNIVERSITY} · Nov 20–22`
3. Download exports the canvas as PNG 1080×1440.

## Background removal

`@imgly/background-removal` with full-quality **`isnet`** (~176 MB model +
~12 MB WASM on first download from IMG.LY CDN). Lazy-loaded after photo upload,
with progress UI and soft alpha matte. Fallback: original photo in the window.

## Stack

- Vite + React + TypeScript
- Anton + Poppins (bundled)
- `@imgly/background-removal` + `onnxruntime-web`
- Canvas export (no html-to-image)

Spelling is always **Cheche**. Register link: `https://luma.com/lj4evitk`.
