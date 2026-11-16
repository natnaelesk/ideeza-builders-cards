#!/usr/bin/env python3
"""
Build compare-original.png: original final-badge-v2 (left) vs our template
recomposited with the original name photo + "HANA TADESSE" + event line (right).

Also writes /tmp/sample-portrait.jpg for app screenshot uploads.
"""

from __future__ import annotations

import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "template" / "final-badge-v2-source.png"
TMPL = ROOT / "public" / "template" / "badge-template.png"
META = ROOT / "public" / "template" / "badge-geometry.json"
OUT = Path("/opt/cursor/artifacts/compare-original.png")
PORTRAIT = Path("/tmp/sample-portrait.jpg")
FONT_CANDIDATES = [
    ROOT / "public" / "fonts" / "Anton-Regular.ttf",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]


def order_corners(box: np.ndarray) -> np.ndarray:
    c = box.astype(np.float64)
    s = c.sum(axis=1)
    d = np.diff(c, axis=1).ravel()
    tl, br = c[np.argmin(s)], c[np.argmax(s)]
    tr, bl = c[np.argmin(d)], c[np.argmax(d)]
    return np.array([tl, tr, br, bl], dtype=np.float64)


def detect_photo(gray: np.ndarray):
    roi = gray[240:800, 160:920]
    mask = (roi > 200).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = max(cnts, key=cv2.contourArea)
    box = cv2.boxPoints(cv2.minAreaRect(best))
    box[:, 0] += 160
    box[:, 1] += 240
    corners = order_corners(box)
    tl, tr, _, _ = corners
    tilt = math.degrees(math.atan2(tr[1] - tl[1], tr[0] - tl[0]))
    return corners, float(tilt)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for p in FONT_CANDIDATES:
        if p.is_file():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def main() -> None:
    import json

    src_bgr = cv2.imread(str(SRC))
    tmpl_bgr = cv2.imread(str(TMPL))
    assert src_bgr is not None and tmpl_bgr is not None
    h, w = src_bgr.shape[:2]
    meta = json.loads(META.read_text())

    gray = cv2.cvtColor(src_bgr, cv2.COLOR_BGR2GRAY)
    corners, tilt = detect_photo(gray)
    cx, cy = corners.mean(axis=0)
    M = cv2.getRotationMatrix2D((float(cx), float(cy)), tilt, 1.0)
    upright = cv2.warpAffine(
        src_bgr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    hom = np.hstack([corners, np.ones((4, 1))])
    pu = (M @ hom.T).T
    px0, px1 = int(round(pu[:, 0].min())), int(round(pu[:, 0].max()))
    py0, py1 = int(round(pu[:, 1].min())), int(round(pu[:, 1].max()))
    # Crop interior (inside white border)
    inset = 6
    portrait = upright[py0 + inset : py1 - inset, px0 + inset : px1 - inset]
    PORTRAIT.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(PORTRAIT), portrait, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print("wrote", PORTRAIT, portrait.shape)

    # Composite: template + original photo warped into window + name + event
    out = tmpl_bgr.copy()
    # Build upright photo paste on template upright, then warp back
    Mb = cv2.getRotationMatrix2D((float(cx), float(cy)), tilt, 1.0)
    Mback = cv2.getRotationMatrix2D((float(cx), float(cy)), -tilt, 1.0)
    tu = cv2.warpAffine(
        out, Mb, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    # Rounded-rect mask for photo
    mask = np.zeros((h, w), np.uint8)
    radius = 18
    ix0, iy0, ix1, iy1 = px0 + inset, py0 + inset, px1 - inset, py1 - inset
    cv2.rectangle(mask, (ix0 + radius, iy0), (ix1 - radius, iy1), 255, -1)
    cv2.rectangle(mask, (ix0, iy0 + radius), (ix1, iy1 - radius), 255, -1)
    for ccx, ccy in (
        (ix0 + radius, iy0 + radius),
        (ix1 - radius, iy0 + radius),
        (ix0 + radius, iy1 - radius),
        (ix1 - radius, iy1 - radius),
    ):
        cv2.circle(mask, (ccx, ccy), radius, 255, -1)
    resized = cv2.resize(portrait, (ix1 - ix0, iy1 - iy0), interpolation=cv2.INTER_AREA)
    tu[iy0:iy1, ix0:ix1][mask[iy0:iy1, ix0:ix1] > 0] = resized[mask[iy0:iy1, ix0:ix1] > 0]
    composited = cv2.warpAffine(
        tu, Mback, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    # Only take photo pixels back
    mask_back = cv2.warpAffine(
        mask, Mback, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT
    )
    out[mask_back > 0] = composited[mask_back > 0]

    # Draw name + event with PIL (RGBA overlay)
    rgba = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    img = Image.fromarray(rgba).convert("RGBA")
    measure = ImageDraw.Draw(Image.new("RGBA", (1, 1)))

    name = meta["name"]
    ncx, ncy = name["center"]
    nsize = int(name["fontSize"])
    font = load_font(nsize)
    label = "HANA TADESSE"
    # Measure and center
    bbox = measure.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # Draw into a temp image, rotate, paste
    pad = 20
    tmp = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    # Soft shadow
    td.text((pad + 2, pad + 3), label, font=font, fill=(40, 10, 80, 90))
    td.text((pad, pad), label, font=font, fill=(255, 255, 255, 255))
    rotated = tmp.rotate(-tilt, resample=Image.BICUBIC, expand=True)
    rx, ry = rotated.size
    img.alpha_composite(
        rotated, dest=(int(ncx - rx / 2), int(ncy - ry / 2))
    )

    ev = meta["eventLine"]
    ecx, ecy = ev["center"]
    esize = int(round(ev["fontSize"]))
    for ep in (
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
    ):
        if ep.is_file():
            efont = ImageFont.truetype(str(ep), esize)
            break
    else:
        efont = load_font(esize)
    etext = "Wolkite University · Nov 20–22"
    eb = ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), etext, font=efont)
    etw, eth = eb[2] - eb[0], eb[3] - eb[1]
    etmp = Image.new("RGBA", (etw + 16, eth + 16), (0, 0, 0, 0))
    ImageDraw.Draw(etmp).text((8, 8), etext, font=efont, fill=(42, 24, 88, 255))
    erot = etmp.rotate(-tilt, resample=Image.BICUBIC, expand=True)
    ex, ey = erot.size
    img.alpha_composite(erot, dest=(int(ecx - ex / 2), int(ecy - ey / 2)))

    ours = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)

    # Side-by-side
    gap = 24
    canvas = np.full((h, w * 2 + gap, 3), 40, np.uint8)
    canvas[:, :w] = src_bgr
    canvas[:, w + gap :] = ours
    # Labels
    pil = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB))
    d = ImageDraw.Draw(pil)
    lab = load_font(28)
    d.text((24, 24), "Original", font=lab, fill=(255, 255, 255))
    d.text((w + gap + 24, 24), "Ours", font=lab, fill=(255, 255, 255))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    pil.save(str(OUT))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
