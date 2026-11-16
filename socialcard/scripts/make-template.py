#!/usr/bin/env python3
"""
Build socialcard/public/template/badge-template.png from final-badge-v2.

Pipeline:
  1. Measure photo-window tilt; de-rotate so the badge is axis-aligned.
  2. Edit ONLY inside the badge in that upright frame:
       - photo window → light lavender gradient (keep white border)
       - name "HANA TADESSE" → column blend from clean holo above/below
       - event line text (keep calendar icon) → same column blend
  3. Warp edits back; composite with a badge mask so every pixel outside
     the badge is byte-identical to the source.

Run:  python3 scripts/make-template.py
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
DIFF_OUT = Path("/opt/cursor/artifacts/tmpl-diff.png")


def find_source() -> Path:
    for p in SRC_CANDIDATES:
        if p.is_file():
            return p
    raise SystemExit("final-badge-v2 source PNG not found")


def order_corners(box: np.ndarray) -> np.ndarray:
    c = box.astype(np.float64)
    s = c.sum(axis=1)
    d = np.diff(c, axis=1).ravel()
    tl, br = c[np.argmin(s)], c[np.argmax(s)]
    tr, bl = c[np.argmin(d)], c[np.argmax(d)]
    return np.array([tl, tr, br, bl], dtype=np.float64)


def detect_photo_window(gray: np.ndarray) -> tuple[np.ndarray, float]:
    roi = gray[240:800, 160:920]
    mask = (roi > 200).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = max(
        (c for c in cnts if cv2.contourArea(c) > 40_000),
        key=cv2.contourArea,
    )
    rect = cv2.minAreaRect(best)
    box = cv2.boxPoints(rect)
    box[:, 0] += 160
    box[:, 1] += 240
    corners = order_corners(box)
    tl, tr, _, _ = corners
    tilt = math.degrees(math.atan2(tr[1] - tl[1], tr[0] - tl[0]))
    return corners, float(tilt)


def rot_matrix(cx: float, cy: float, deg_ccw: float) -> np.ndarray:
    return cv2.getRotationMatrix2D((cx, cy), deg_ccw, 1.0)


def transform_pts(M: np.ndarray, pts: np.ndarray) -> np.ndarray:
    hom = np.hstack([pts.astype(np.float64), np.ones((len(pts), 1))])
    return (M @ hom.T).T


def _rounded_rect_mask(
    h: int, w: int, x0: int, y0: int, x1: int, y1: int, radius: int
) -> np.ndarray:
    mask = np.zeros((h, w), np.uint8)
    cv2.rectangle(mask, (x0 + radius, y0), (x1 - radius, y1), 255, -1)
    cv2.rectangle(mask, (x0, y0 + radius), (x1, y1 - radius), 255, -1)
    for ccx, ccy in (
        (x0 + radius, y0 + radius),
        (x1 - radius, y0 + radius),
        (x0 + radius, y1 - radius),
        (x1 - radius, y1 - radius),
    ):
        cv2.circle(mask, (ccx, ccy), radius, 255, -1)
    return mask


def column_blend_fill(
    img: np.ndarray,
    mask: np.ndarray,
    sample_pad: int = 14,
    feather_px: int = 14,
    y_forbid: tuple[int, int] | None = None,
) -> np.ndarray:
    """
    Per-column lerp from clean holo above/below the core mask, then feather
    (≥12px) into the surrounding gradient so no rectangular patch is visible.
    Matched noise from local holo residuals.
    y_forbid: optional (y0,y1) band where alpha is forced to 0 (e.g. photo window).
    """
    h, w = mask.shape
    ys, xs = np.where(mask > 0)
    if len(xs) == 0:
        return img.copy()

    core = (mask > 0).astype(np.uint8)
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (feather_px * 2 + 1, feather_px * 2 + 1)
    )
    expanded = cv2.dilate(core, kernel)
    inv = np.where(core > 0, 0, 255).astype(np.uint8)
    dist = cv2.distanceTransform(inv, cv2.DIST_L2, 5)
    alpha = np.clip(1.0 - dist / float(feather_px), 0.0, 1.0)
    alpha = alpha * (expanded > 0)
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), feather_px * 0.4)
    alpha = np.clip(alpha, 0.0, 1.0)
    if y_forbid is not None:
        fy0, fy1 = y_forbid
        alpha[fy0:fy1, :] = 0

    work = img.astype(np.float32).copy()
    src = img.astype(np.float32)
    rng = np.random.default_rng(7)

    x0, x1 = int(xs.min()), int(xs.max())
    y_top_all = int(ys.min())
    # Noise from holo flanks (left of name), not from photo window
    flank_x0 = max(0, x0 - 60)
    flank_x1 = max(flank_x0 + 1, x0 - 8)
    flank_y0 = max(0, y_top_all - 4)
    flank_y1 = min(h, y_top_all + 40)
    strip = src[flank_y0:flank_y1, flank_x0:flank_x1]
    if strip.size == 0:
        strip = src[max(0, y_top_all - 8) : y_top_all, x0 : x1 + 1]
    strip_blur = cv2.GaussianBlur(strip, (0, 0), 2.5)
    residual = strip - strip_blur
    noise_sigma = float(np.std(residual)) if residual.size else 2.0
    noise_sigma = max(1.6, min(5.0, noise_sigma))

    apply_xs = np.where(alpha.max(axis=0) > 0.01)[0]
    for x in range(int(apply_xs.min()), int(apply_xs.max()) + 1):
        cols = np.where(alpha[:, x] > 0.01)[0]
        if len(cols) == 0:
            continue
        core_cols = np.where(core[:, x] > 0)[0]
        if len(core_cols):
            y_top, y_bot = int(core_cols[0]), int(core_cols[-1])
        else:
            y_top, y_bot = int(cols[0]), int(cols[-1])

        ya = max(0, y_top - sample_pad)
        yb = min(h - 1, y_bot + sample_pad)
        if y_forbid is not None:
            ya = max(ya, y_forbid[1])  # stay below forbidden band
        while ya < y_top and (core[ya, x] > 0 or (y_forbid and ya < y_forbid[1])):
            ya += 1
        if ya >= y_top:
            ya = max(0, y_top - 2)
            if y_forbid is not None:
                ya = max(ya, y_forbid[1])
        while yb < h - 1 and core[yb, x] > 0:
            yb += 1

        def samp(y: int) -> np.ndarray:
            yy0, yy1 = max(0, y - 2), min(h, y + 3)
            # Prefer holo flanks if this column's above-sample sits on atypical chrome
            xx0, xx1 = max(0, x - 3), min(w, x + 4)
            return src[yy0:yy1, xx0:xx1].reshape(-1, 3).mean(axis=0)

        # Side-aware above sample: mix column sample with left/right holo at same y
        above_c = samp(ya)
        xl = max(0, x0 - 40)
        xr = min(w - 1, x1 + 40)
        above_l = src[ya, xl : xl + 8].mean(axis=0) if xl + 8 <= x0 else above_c
        above_r = src[ya, xr - 8 : xr].mean(axis=0) if xr - 8 >= x1 else above_c
        above = above_c * 0.5 + above_l * 0.25 + above_r * 0.25
        below = samp(yb)

        span = max(1, y_bot - y_top)
        for y in cols:
            if y <= y_top:
                t = 0.0
            elif y >= y_bot:
                t = 1.0
            else:
                u = (y - y_top) / span
                t = u * u * (3 - 2 * u)
            col = above * (1.0 - t) + below * t
            # Low-frequency holo drift from flanks at this y
            if xl + 8 <= x0:
                side = src[y, xl : xl + 8].mean(axis=0)
                col = col * 0.7 + side * 0.3
            noise = rng.normal(0, noise_sigma, 3)
            filled = np.clip(col + noise, 0, 255)
            a = float(alpha[y, x])
            work[y, x] = filled * a + src[y, x] * (1.0 - a)

    blur = cv2.GaussianBlur(work, (0, 0), 0.85)
    a3 = alpha[..., None]
    strong = np.clip((a3 - 0.25) / 0.75, 0, 1)
    work = blur * strong * 0.55 + work * (1.0 - strong * 0.55)
    out = np.clip(work, 0, 255).astype(np.uint8)
    out[alpha < 0.01] = img[alpha < 0.01]
    return out


def fill_photo_window(
    img: np.ndarray, x0: int, y0: int, x1: int, y1: int, border_keep: int = 4
) -> np.ndarray:
    """
    Fill the ENTIRE photo-window interior with a clean light backdrop.
    Geometric rounded-rect fill (no flood-fill islands), then restore the
    original rounded white border ring from the source.
    """
    out = img.copy()
    h_r, w_r = y1 - y0, x1 - x0

    # Interior: everything inside the white border
    ix0, iy0 = border_keep, border_keep
    ix1, iy1 = w_r - border_keep, h_r - border_keep
    radius = max(12, 22 - border_keep)
    interior = _rounded_rect_mask(h_r, w_r, ix0, iy0, ix1, iy1, radius)

    # #ECE8F2 → #D9D4E3 in BGR (studio backdrop)
    c0 = np.array([0xF2, 0xE8, 0xEC], dtype=np.float32)
    c1 = np.array([0xE3, 0xD4, 0xD9], dtype=np.float32)

    grad = np.zeros((h_r, w_r, 3), np.float32)
    for i in range(h_r):
        t = i / max(1, h_r - 1)
        # Slight top-left bias like the original photo backdrop
        row = c0 * (1 - t * 0.85) + c1 * (t * 0.85)
        grad[i, :] = row
    yy, xx = np.mgrid[0:h_r, 0:w_r]
    nx = (xx / max(1, w_r - 1) - 0.45) * 2
    ny = (yy / max(1, h_r - 1) - 0.4) * 2
    r = np.clip(np.sqrt(nx * nx + ny * ny), 0, 1)[..., None]
    grad = grad * (1 - 0.07 * r) + c1 * (0.07 * r)
    rng = np.random.default_rng(3)
    grad = np.clip(grad + rng.normal(0, 1.4, grad.shape), 0, 255)

    patch = out[y0:y1, x0:x1].copy()
    local = interior > 0
    patch[local] = grad.astype(np.uint8)[local]

    # Restore original white border ring (bright perimeter), never sample face
    gray = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    # Ring = inside outer rounded window, outside interior
    outer = _rounded_rect_mask(h_r, w_r, 1, 1, w_r - 2, h_r - 2, 24)
    ring = (outer > 0) & (interior == 0)
    # Only restore pixels that look like the white chrome border
    bright = gray > 190
    restore = ring & bright
    orig_patch = img[y0:y1, x0:x1]
    patch[restore] = orig_patch[restore]

    out[y0:y1, x0:x1] = patch
    return out


def detect_name_mask(gray: np.ndarray, px0: int, py1: int, px1: int) -> np.ndarray:
    """
    Tight solid rect covering only HANA TADESSE (glyphs + soft shadow).
    Stops well above VIBE BUILDER (~py1+120).
    """
    y0 = py1 + 16
    y1 = py1 + 100  # hard stop before VIBE BUILDER (~py1+120)
    x0 = px0 - 30
    x1 = px1 + 30
    band = gray[y0:y1, x0:x1]

    # Bright glyphs
    bright = (band > 205).astype(np.uint8) * 255
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, np.ones((5, 9), np.uint8))
    bright = cv2.dilate(bright, np.ones((3, 3), np.uint8), iterations=1)

    # Soft purple shadow under/around letters (slightly darker than local holo)
    blur = cv2.GaussianBlur(band, (0, 0), 3.0)
    shadow = ((blur.astype(np.float32) - band.astype(np.float32) > 8) & (band < 170)).astype(
        np.uint8
    ) * 255
    shadow = cv2.morphologyEx(shadow, cv2.MORPH_CLOSE, np.ones((3, 5), np.uint8))

    m = cv2.bitwise_or(bright, shadow)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m)
    cleaned = np.zeros_like(m)
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        bh = stats[i, cv2.CC_STAT_HEIGHT]
        bw = stats[i, cv2.CC_STAT_WIDTH]
        if area >= 30 and bh >= 8 and bw >= 3:
            cleaned[labels == i] = 255

    ys, xs = np.where(cleaned > 0)
    full = np.zeros_like(gray, np.uint8)
    if len(xs) == 0:
        # Fallback fixed slot between photo and vibe
        cv2.rectangle(full, (px0 + 20, py1 + 22), (px1 - 20, py1 + 78), 255, -1)
        return full

    bx0, bx1 = int(xs.min()), int(xs.max())
    by0, by1 = int(ys.min()), int(ys.max())
    # Hard stop well above VIBE BUILDER (~py1+118 / absolute ~830)
    max_by1 = (py1 + 96) - y0
    by1 = min(by1, max_by1)
    pad_x, pad_top, pad_bot = 8, 4, 4
    rect = np.zeros_like(cleaned)
    cv2.rectangle(
        rect,
        (max(0, bx0 - pad_x), max(0, by0 - pad_top)),
        (min(cleaned.shape[1] - 1, bx1 + pad_x), min(cleaned.shape[0] - 1, by1 + pad_bot)),
        255,
        -1,
    )
    full[y0:y1, x0:x1] = rect
    return full


def detect_event_mask(gray: np.ndarray, px0: int, py1: int, px1: int) -> tuple[np.ndarray, dict]:
    """
    Mask the whole 'Wolkite University · Nov 20–22' run.
    Keep calendar icon (left). Returns mask + geometry for re-render.
    """
    # Full text height measured ~py1+191 .. py1+229
    y0 = py1 + 185
    y1 = py1 + 235
    x0 = px0 - 80
    x1 = px1 + 50
    band = gray[y0:y1, x0:x1]

    dark = (band < 100).astype(np.uint8) * 255
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, np.ones((3, 7), np.uint8))
    dark = cv2.dilate(dark, np.ones((3, 3), np.uint8), iterations=1)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(dark)
    full = np.zeros_like(gray, np.uint8)
    geo: dict = {}
    if n <= 1:
        return full, geo

    comps = []
    for i in range(1, n):
        comps.append(
            (
                int(stats[i, cv2.CC_STAT_LEFT]),
                int(stats[i, cv2.CC_STAT_TOP]),
                int(stats[i, cv2.CC_STAT_WIDTH]),
                int(stats[i, cv2.CC_STAT_HEIGHT]),
                int(stats[i, cv2.CC_STAT_AREA]),
                i,
            )
        )
    comps.sort()

    # Calendar icon = leftmost compact blob (taller than wide-ish, small)
    icon = comps[0]
    icon_right = icon[0] + icon[2]

    text_comps = [c for c in comps[1:] if c[0] >= icon_right - 4 and c[4] >= 15]
    if not text_comps:
        text_comps = [c for c in comps if c[0] > icon_right + 4]

    cleaned = np.zeros_like(dark)
    for c in text_comps:
        cleaned[labels == c[5]] = 255

    ys, xs = np.where(cleaned > 0)
    if len(xs) == 0:
        return full, geo

    bx0, bx1 = int(xs.min()), int(xs.max())
    by0, by1 = int(ys.min()), int(ys.max())
    # Start after calendar with a small gap; keep right edge tight to glyphs
    bx0 = max(bx0, icon_right + 4)
    rect = np.zeros_like(cleaned)
    cv2.rectangle(
        rect,
        (max(0, bx0 - 2), max(0, by0 - 3)),
        (min(cleaned.shape[1] - 1, bx1 + 3), min(cleaned.shape[0] - 1, by1 + 3)),
        255,
        -1,
    )
    # Do not cover calendar
    rect[:, : max(0, icon_right + 2)] = 0
    full[y0:y1, x0:x1] = rect

    geo = {
        "uprightCenter": [float(x0 + (bx0 + bx1) / 2), float(y0 + (by0 + by1) / 2)],
        "uprightWidth": float(bx1 - bx0 + 8),
        "uprightHeight": float(by1 - by0 + 6),
        # Cap-height ≈ rendered px; Poppins 600 needs ~0.55–0.6 of bbox height as fontSize? use bbox h
        "fontSize": float(max(22, min(28, by1 - by0 + 2))),
    }
    return full, geo


def badge_mask_upright(h: int, w: int, px0: int, py0: int, px1: int, py1: int):
    """Axis-aligned rounded rect covering the badge body in upright space."""
    bw = px1 - px0
    bh = py1 - py0
    left = int(round(px0 - bw * 0.215))
    right = int(round(px1 + bw * 0.215))
    top = int(round(py0 - bh * 0.42))
    bottom = int(round(py1 + bh * 0.86))
    left, top = max(0, left), max(0, top)
    right, bottom = min(w - 1, right), min(h - 1, bottom)
    mask = np.zeros((h, w), np.uint8)
    radius = 36
    cv2.rectangle(mask, (left + radius, top), (right - radius, bottom), 255, -1)
    cv2.rectangle(mask, (left, top + radius), (right, bottom - radius), 255, -1)
    for cx, cy in (
        (left + radius, top + radius),
        (right - radius, top + radius),
        (left + radius, bottom - radius),
        (right - radius, bottom - radius),
    ):
        cv2.circle(mask, (cx, cy), radius, 255, -1)
    return mask, (left, top, right, bottom)


def main() -> None:
    src_path = find_source()
    print("source:", src_path)
    bgr = cv2.imread(str(src_path), cv2.IMREAD_COLOR)
    assert bgr is not None
    h, w = bgr.shape[:2]
    assert (w, h) == (1080, 1440)

    cached = ROOT / "public" / "template" / "final-badge-v2-source.png"
    cached.parent.mkdir(parents=True, exist_ok=True)
    if src_path.resolve() != cached.resolve():
        cached.write_bytes(src_path.read_bytes())

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    photo_corners, tilt = detect_photo_window(gray)
    print(f"tilt: {tilt:.4f}° clockwise")

    cx, cy = photo_corners.mean(axis=0)
    M_forward = rot_matrix(float(cx), float(cy), tilt)
    M_back = rot_matrix(float(cx), float(cy), -tilt)

    upright = cv2.warpAffine(
        bgr, M_forward, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    ugray = cv2.cvtColor(upright, cv2.COLOR_BGR2GRAY)
    photo_u = transform_pts(M_forward, photo_corners)
    px0 = int(round(min(photo_u[:, 0])))
    px1 = int(round(max(photo_u[:, 0])))
    py0 = int(round(min(photo_u[:, 1])))
    py1 = int(round(max(photo_u[:, 1])))
    print(f"photo upright: ({px0},{py0})-({px1},{py1})")

    badge_mask_u, badge_box = badge_mask_upright(h, w, px0, py0, px1, py1)
    print("badge upright box", badge_box)

    edited = upright.copy()

    # --- Photo window ---
    before_photo = edited.copy()
    edited = fill_photo_window(edited, px0, py0, px1, py1, border_keep=4)
    photo_edit = (
        cv2.absdiff(edited, before_photo).max(axis=2) > 0
    ).astype(np.uint8) * 255

    # --- Name (feathered column blend — no visible rectangle) ---
    name_mask = detect_name_mask(ugray, px0, py1, px1)
    name_mask = cv2.bitwise_and(name_mask, badge_mask_u)
    print("name mask px", int(name_mask.sum() / 255))
    nys, nxs = np.where(name_mask > 0)
    if len(nxs):
        print(
            "name mask bbox",
            int(nxs.min()),
            int(nys.min()),
            int(nxs.max()),
            int(nys.max()),
        )
    before_name = edited.copy()
    edited = column_blend_fill(
        edited,
        name_mask,
        sample_pad=14,
        feather_px=16,
        y_forbid=(0, py1 + 2),  # never feather into the photo window
    )
    name_edit = (
        cv2.absdiff(edited, before_name).max(axis=2) > 0
    ).astype(np.uint8) * 255

    # --- Event line text (keep calendar) ---
    event_mask, event_geo = detect_event_mask(ugray, px0, py1, px1)
    event_mask = cv2.bitwise_and(event_mask, badge_mask_u)
    print("event mask px", int(event_mask.sum() / 255))
    eys, exs = np.where(event_mask > 0)
    if len(exs):
        print(
            "event mask bbox",
            int(exs.min()),
            int(eys.min()),
            int(exs.max()),
            int(eys.max()),
        )
    before_event = edited.copy()
    edited = column_blend_fill(
        edited, event_mask, sample_pad=12, feather_px=10
    )
    event_edit = (
        cv2.absdiff(edited, before_event).max(axis=2) > 0
    ).astype(np.uint8) * 255

    edit_u = cv2.bitwise_or(
        photo_edit, cv2.bitwise_or(name_edit, event_edit)
    )
    edit_u = cv2.bitwise_and(edit_u, badge_mask_u)
    # Tiny dilate for warp interpolation; keep clear of VIBE BUILDER band
    edit_u = cv2.dilate(edit_u, np.ones((2, 2), np.uint8), iterations=1)
    edit_u = cv2.bitwise_and(edit_u, badge_mask_u)
    # Never edit the VIBE BUILDER strip in upright space
    vibe_top = py1 + 105
    vibe_bot = py1 + 175
    edit_u[vibe_top:vibe_bot, :] = 0
    edited[vibe_top:vibe_bot, :] = upright[vibe_top:vibe_bot, :]

    edited_back = cv2.warpAffine(
        edited, M_back, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    edit_mask_orig = cv2.warpAffine(
        edit_u, M_back, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT
    )
    badge_mask_orig = cv2.warpAffine(
        badge_mask_u,
        M_back,
        (w, h),
        flags=cv2.INTER_NEAREST,
        borderMode=cv2.BORDER_CONSTANT,
    )
    apply = (edit_mask_orig > 0) & (badge_mask_orig > 0)

    out = bgr.copy()
    out[apply] = edited_back[apply]

    outside = badge_mask_orig == 0
    diff_outside = np.abs(out.astype(np.int16) - bgr.astype(np.int16))[outside]
    max_out = int(diff_outside.max()) if diff_outside.size else 0
    print(f"outside-badge max abs diff: {max_out}")
    if max_out != 0:
        out[outside] = bgr[outside]
        print("forced outside pixels to source")

    # Hard guarantee
    out[outside] = bgr[outside]

    diff = cv2.absdiff(out, bgr)
    diff_vis = np.clip(diff.sum(axis=2) * 3, 0, 255).astype(np.uint8)
    diff_rgb = cv2.cvtColor(diff_vis, cv2.COLOR_GRAY2BGR)
    diff_rgb[outside] = (0, 0, 0)
    DIFF_OUT.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(DIFF_OUT), diff_rgb)
    cv2.imwrite(str(OUT), out, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    # Also copy template into artifacts
    cv2.imwrite(str(DIFF_OUT.parent / "badge-template.png"), out, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    print("wrote", OUT)
    print("wrote", DIFF_OUT)

    nys, nxs = np.where(name_mask > 0)
    if len(nxs):
        name_u_c = np.array([[nxs.mean(), nys.mean()]], dtype=np.float64)
        name_h = float(nys.max() - nys.min() + 1)
    else:
        name_u_c = np.array([[(px0 + px1) / 2, py1 + 48]], dtype=np.float64)
        name_h = 52.0
    name_c = transform_pts(M_back, name_u_c)[0]

    if event_geo:
        ev_u = np.array([event_geo["uprightCenter"]], dtype=np.float64)
        ev_c = transform_pts(M_back, ev_u)[0]
        ev_w = event_geo["uprightWidth"]
        ev_size = event_geo["fontSize"]
    else:
        ev_c = np.array([560.0, 920.0])
        ev_w = 420.0
        ev_size = 24.0

    tl, tr, br, bl = photo_corners
    pw = float(np.linalg.norm(tr - tl))
    ph = float(np.linalg.norm(bl - tl))
    # Anton ~72 ≈ 62% of badge width for "HANA TADESSE"; taller than prior 63
    name_font = 72
    name_max_w = 480

    # Prefer bbox centers measured on the source (stable vs mask padding)
    gsrc = gray
    nb = gsrc[735:795, 280:800]
    bright = (nb > 215).astype(np.uint8) * 255
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, np.ones((3, 5), np.uint8))
    nys_s, nxs_s = np.where(bright > 0)
    if len(nxs_s):
        name_c = np.array(
            [(nxs_s.min() + nxs_s.max()) / 2 + 280, (nys_s.min() + nys_s.max()) / 2 + 735],
            dtype=np.float64,
        )

    eb = gsrc[900:945, 360:750]
    ed = (eb < 90).astype(np.uint8) * 255
    eys_s, exs_s = np.where(ed > 0)
    if len(exs_s):
        ev_c = np.array(
            [(exs_s.min() + exs_s.max()) / 2 + 360, (eys_s.min() + eys_s.max()) / 2 + 900],
            dtype=np.float64,
        )
        ev_w = float(exs_s.max() - exs_s.min() + 8)
        ev_size = float(max(22, min(28, eys_s.max() - eys_s.min() + 2)))

    meta = {
        "canvas": {"width": 1080, "height": 1440},
        "tiltDegClockwise": round(tilt, 4),
        "photoWindow": {
            "center": [round(float(cx), 2), round(float(cy), 2)],
            "width": round(pw, 2),
            "height": round(ph, 2),
            "corners": {
                "tl": [round(float(tl[0]), 2), round(float(tl[1]), 2)],
                "tr": [round(float(tr[0]), 2), round(float(tr[1]), 2)],
                "br": [round(float(br[0]), 2), round(float(br[1]), 2)],
                "bl": [round(float(bl[0]), 2), round(float(bl[1]), 2)],
            },
            "radius": 26,
        },
        "name": {
            "center": [round(float(name_c[0]), 2), round(float(name_c[1]), 2)],
            "maxWidth": name_max_w,
            "fontSize": name_font,
        },
        "eventLine": {
            "center": [round(float(ev_c[0]), 2), round(float(ev_c[1]), 2)],
            "maxWidth": round(float(ev_w + 40), 1),
            "fontSize": round(float(ev_size), 1),
        },
        "dates": "Nov 20–22",
        "outsideBadgeMaxDiff": 0,
    }
    META.write_text(json.dumps(meta, indent=2) + "\n")
    print("wrote", META)

    assert np.array_equal(out[outside], bgr[outside]), "outside-badge pixels changed!"

    # Residual QA
    og = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
    if len(nxs):
        zone = og[int(nys.min()) : int(nys.max()) + 1, int(nxs.min()) : int(nxs.max()) + 1]
        # Map upright zone roughly via center — use original-space name neighborhood
        ny0o = max(0, int(name_c[1] - 40))
        ny1o = min(h, int(name_c[1] + 40))
        nx0o = max(0, int(name_c[0] - 260))
        nx1o = min(w, int(name_c[0] + 260))
        z = og[ny0o:ny1o, nx0o:nx1o]
        print("residual name >220 in slot:", int((z > 220).sum()))
    if event_geo:
        ey0o = max(0, int(ev_c[1] - 25))
        ey1o = min(h, int(ev_c[1] + 25))
        ex0o = max(0, int(ev_c[0] - 220))
        ex1o = min(w, int(ev_c[0] + 220))
        ez = og[ey0o:ey1o, ex0o:ex1o]
        print("residual event <70 in slot:", int((ez < 70).sum()))


if __name__ == "__main__":
    main()
