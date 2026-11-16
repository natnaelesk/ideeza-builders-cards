#!/usr/bin/env python3
"""
Build socialcard/public/template/badge-template.png from the approved
final-badge-v2 source (1080×1440).

Removes:
  (a) the sample person inside the rounded photo window (keeps light backdrop
      + white rounded border)
  (b) the name "HANA TADESSE"
  (c) the event line text "Wolkite University · Nov 20–22"
      (calendar icon kept; university+date re-rendered by the app)

Everything else stays pixel-identical. Reproducible — run:

  python3 scripts/make-template.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC_CANDIDATES = [
    ROOT / "public" / "template" / "final-badge-v2-source.png",
    Path("/home/ubuntu/.cursor/projects/workspace/uploads/final-badge-v2_c831.png"),
    Path("/workspace/pulse/socialcard/final-badge-v2.png"),
]
OUT = ROOT / "public" / "template" / "badge-template.png"
META = ROOT / "public" / "template" / "badge-geometry.json"


def find_source() -> Path:
    for p in SRC_CANDIDATES:
        if p.is_file():
            return p
    raise SystemExit("final-badge-v2 source PNG not found")


def order_corners(box: np.ndarray) -> np.ndarray:
    """Return corners as TL, TR, BR, BL."""
    c = box.astype(np.float64)
    s = c.sum(axis=1)
    diff = np.diff(c, axis=1).ravel()
    tl = c[np.argmin(s)]
    br = c[np.argmax(s)]
    tr = c[np.argmin(diff)]
    bl = c[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float64)


def detect_photo_window(gray: np.ndarray) -> tuple[np.ndarray, float, tuple[float, float]]:
    """Detect the light photo-window interior via bright pixels; return corners, tilt_deg, center."""
    h, w = gray.shape
    roi = gray[240:800, 160:920]
    mask = (roi > 200).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    for c in cnts:
        area = cv2.contourArea(c)
        if area < 40_000:
            continue
        rect = cv2.minAreaRect(c)
        if best is None or area > best[0]:
            best = (area, rect)
    if best is None:
        raise RuntimeError("photo window not found")
    area, rect = best
    box = cv2.boxPoints(rect)
    box[:, 0] += 160
    box[:, 1] += 240
    corners = order_corners(box)
    # Top-edge angle: degrees clockwise from +x (positive = clockwise)
    tl, tr, br, bl = corners
    tilt = math.degrees(math.atan2(tr[1] - tl[1], tr[0] - tl[0]))
    center = (float(rect[0][0] + 160), float(rect[0][1] + 240))
    return corners, float(tilt), center


def inset_quad(corners: np.ndarray, px: float) -> np.ndarray:
    """Shrink quad toward centroid by ~px pixels along each edge normal."""
    c = corners.mean(axis=0)
    out = []
    for p in corners:
        v = p - c
        n = np.linalg.norm(v)
        if n < 1e-6:
            out.append(p)
        else:
            out.append(p - v / n * px)
    return np.array(out, dtype=np.float64)


def sample_backdrop(bgr: np.ndarray, corners: np.ndarray) -> tuple[int, int, int]:
    """Sample light backdrop color from near the top-inner corners of the photo."""
    inset = inset_quad(corners, 28)
    samples = []
    for p in inset[:2]:  # TL, TR
        x, y = int(p[0]), int(p[1])
        patch = bgr[max(0, y - 4) : y + 8, max(0, x - 4) : x + 8]
        if patch.size:
            samples.append(patch.reshape(-1, 3).mean(axis=0))
    # Also mid-top
    mid = (inset[0] + inset[1]) / 2
    x, y = int(mid[0]), int(mid[1]) + 20
    patch = bgr[y : y + 12, x - 20 : x + 20]
    if patch.size:
        samples.append(patch.reshape(-1, 3).mean(axis=0))
    mean = np.mean(samples, axis=0)
    # Bias slightly toward soft lavender-gray
    mean = mean * 0.85 + np.array([235, 230, 242]) * 0.15
    return tuple(int(np.clip(v, 0, 255)) for v in mean)


def clear_photo_window(bgr: np.ndarray, corners: np.ndarray) -> np.ndarray:
    """Fill photo interior with seamless light backdrop; keep white border."""
    out = bgr.copy()
    # Inset so the white rounded border remains untouched
    inner = inset_quad(corners, 12)
    # Prefer light pixels near top of window (backdrop), not face/clothes
    probe = np.zeros(bgr.shape[:2], np.uint8)
    cv2.fillConvexPoly(probe, inset_quad(corners, 40).astype(np.int32), 255)
    ys, xs = np.where(probe > 0)
    if len(xs):
        # Top 20% of window pixels that are bright
        y_cut = np.percentile(ys, 25)
        top = (ys <= y_cut) & (probe[ys, xs] > 0)
        vals = bgr[ys[top], xs[top]]
        # Keep only bright-ish samples
        lum = vals.mean(axis=1)
        bright = vals[lum > np.percentile(lum, 60)]
        if len(bright):
            color = tuple(int(v) for v in bright.mean(axis=0))
        else:
            color = sample_backdrop(bgr, corners)
    else:
        color = sample_backdrop(bgr, corners)
    # Soft lavender-gray fallback if still too dark
    if np.mean(color) < 160:
        color = (228, 222, 232)
    overlay = out.copy()
    cv2.fillConvexPoly(overlay, inner.astype(np.int32), color)
    mask = np.zeros(bgr.shape[:2], np.uint8)
    cv2.fillConvexPoly(mask, inner.astype(np.int32), 255)
    mask = cv2.GaussianBlur(mask, (0, 0), 2.2)
    m = (mask.astype(np.float32) / 255.0)[..., None]
    out = (overlay * m + out * (1 - m)).astype(np.uint8)
    return out


def rotated_band_mask(
    shape: tuple[int, int],
    center: tuple[float, float],
    width: float,
    height: float,
    tilt_deg: float,
    dilate: int = 6,
) -> np.ndarray:
    """Axis-aligned rect in badge space → screen mask at tilt."""
    cx, cy = center
    hw, hh = width / 2, height / 2
    local = np.array(
        [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], dtype=np.float64
    )
    # Badge content is tilted clockwise on screen → use clockwise rotation
    rad = math.radians(tilt_deg)
    c, s = math.cos(rad), math.sin(rad)
    R = np.array([[c, s], [-s, c]])  # clockwise
    pts = (local @ R.T) + np.array([cx, cy])
    mask = np.zeros(shape, np.uint8)
    cv2.fillConvexPoly(mask, pts.astype(np.int32), 255)
    if dilate > 0:
        mask = cv2.dilate(mask, np.ones((dilate, dilate), np.uint8), iterations=1)
    return mask


def heal_region(bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Fill text region by lerping left/right holographic flanks (no Telea letter revive)."""
    if mask.max() == 0:
        return bgr
    out = bgr.copy()
    core = cv2.dilate(mask, np.ones((11, 11), np.uint8), iterations=2)
    h, w = core.shape
    ys, xs = np.where(core > 0)
    if len(xs) == 0:
        return out
    y0, y1 = int(ys.min()), int(ys.max())
    rng = np.random.default_rng(42)

    def sample(y: int, x: int) -> np.ndarray:
        yy0, yy1 = max(0, y - 2), min(h, y + 3)
        xx0, xx1 = max(0, x - 2), min(w, x + 3)
        patch = out[yy0:yy1, xx0:xx1]
        return patch.reshape(-1, 3).mean(axis=0)

    for y in range(y0, y1 + 1):
        cols = np.where(core[y] > 0)[0]
        if len(cols) == 0:
            continue
        L, R = int(cols[0]), int(cols[-1])
        lx = L - 1
        while lx > 0 and core[y, lx] > 0:
            lx -= 1
        rx = R + 1
        while rx < w - 1 and core[y, rx] > 0:
            rx += 1
        left_c = sample(y, max(0, lx - 10))
        right_c = sample(y, min(w - 1, rx + 10))
        for x in cols:
            t = 0.0 if R == L else (x - L) / (R - L)
            col = left_c * (1 - t) + right_c * t
            noise = rng.normal(0, 2.2, 3)
            out[y, x] = np.clip(col + noise, 0, 255)

    feather = cv2.GaussianBlur(core, (0, 0), 2.5)
    blur = cv2.GaussianBlur(out, (0, 0), 1.6)
    m = (feather.astype(np.float32) / 255.0)[..., None]
    out = (blur * m + out * (1 - m)).astype(np.uint8)
    return out


def main() -> None:
    src = find_source()
    print("source:", src)
    bgr = cv2.imread(str(src), cv2.IMREAD_COLOR)
    if bgr is None:
        raise SystemExit(f"failed to read {src}")
    h, w = bgr.shape[:2]
    assert (w, h) == (1080, 1440), f"expected 1080x1440, got {w}x{h}"

    # Cache source next to output for reproducibility
    cached = ROOT / "public" / "template" / "final-badge-v2-source.png"
    cached.parent.mkdir(parents=True, exist_ok=True)
    if src.resolve() != cached.resolve():
        cached.write_bytes(src.read_bytes())

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    corners, tilt_deg, center = detect_photo_window(gray)
    print(f"photo tilt: {tilt_deg:.3f}° clockwise")
    print("photo corners TL,TR,BR,BL:\n", corners)

    # 1) Clear sample person
    out = clear_photo_window(bgr, corners)

    # 2) Heal name — band between photo bottom and VIBE BUILDER (incl. glow)
    photo_mask = np.zeros_like(gray)
    cv2.fillConvexPoly(photo_mask, inset_quad(corners, 4).astype(np.int32), 255)
    role_protect = rotated_band_mask(
        gray.shape, center=(540, 820), width=420, height=36, tilt_deg=tilt_deg, dilate=2
    )
    name_mask = rotated_band_mask(
        gray.shape, center=(540, 752), width=600, height=100, tilt_deg=tilt_deg, dilate=10
    )
    name_mask = cv2.bitwise_and(name_mask, cv2.bitwise_not(photo_mask))
    name_mask = cv2.bitwise_and(name_mask, cv2.bitwise_not(role_protect))
    print("name mask px", int(name_mask.sum() / 255))
    out = heal_region(out, name_mask)

    # 3) Heal full event line text (university + date). Keep calendar icon.
    uni_mask = rotated_band_mask(
        gray.shape, center=(575, 890), width=540, height=48, tilt_deg=tilt_deg, dilate=8
    )
    icon_protect = rotated_band_mask(
        gray.shape, center=(300, 878), width=70, height=44, tilt_deg=tilt_deg, dilate=2
    )
    uni_mask = cv2.bitwise_and(uni_mask, cv2.bitwise_not(icon_protect))
    print("uni/date mask px", int(uni_mask.sum() / 255))
    out = heal_region(out, uni_mask)

    cv2.imwrite(str(OUT), out, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    print("wrote", OUT)

    # Geometry for the canvas app (photo window in template space)
    tl, tr, br, bl = corners.tolist()
    # Inner clip rect in unrotated badge-local coords: width/height along edges
    width = float(np.linalg.norm(np.array(tr) - np.array(tl)))
    height = float(np.linalg.norm(np.array(bl) - np.array(tl)))
    meta = {
        "canvas": {"width": 1080, "height": 1440},
        "tiltDegClockwise": round(tilt_deg, 4),
        "photoWindow": {
            "center": [round(center[0], 2), round(center[1], 2)],
            "width": round(width, 2),
            "height": round(height, 2),
            "corners": {
                "tl": [round(tl[0], 2), round(tl[1], 2)],
                "tr": [round(tr[0], 2), round(tr[1], 2)],
                "br": [round(br[0], 2), round(br[1], 2)],
                "bl": [round(bl[0], 2), round(bl[1], 2)],
            },
            # Soft light fill used when clearing the sample photo
            "backdropRgb": list(sample_backdrop(bgr, corners)),
        },
        # Name baseline center (approx where HANA TADESSE sat)
        "name": {
            "center": [540, 760],
            "maxWidth": 520,
            "fontSize": 64,
        },
        # Event line (university · dates) — to the right of calendar icon
        "eventLine": {
            "center": [560, 888],
            "maxWidth": 480,
            "fontSize": 22,
        },
        "dates": "Nov 20–22",
    }
    META.write_text(json.dumps(meta, indent=2) + "\n")
    print("wrote", META)


if __name__ == "__main__":
    main()
