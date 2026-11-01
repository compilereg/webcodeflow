"""Generate dark-mode contest logos from light assets.

- Near-white background -> transparent
- Near-black ink -> light ink (readable on dark UI)
- Saturated colors (red/yellow/etc.) preserved
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "contests_logos"
COUNTRIES = ("egyptian", "jordan", "qatar", "lebanese")


def is_near_white(r: int, g: int, b: int, a: int) -> bool:
    return a > 10 and r >= 235 and g >= 235 and b >= 235


def is_near_black(r: int, g: int, b: int, a: int) -> bool:
    return a > 10 and r <= 55 and g <= 55 and b <= 55 and max(r, g, b) - min(r, g, b) <= 25


def chroma(r: int, g: int, b: int) -> int:
    return max(r, g, b) - min(r, g, b)


def to_dark_variant(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGBA")
    pixels = list(im.getdata())
    out = []
    for r, g, b, a in pixels:
        if a < 8:
            out.append((r, g, b, 0))
            continue
        if is_near_white(r, g, b, a):
            out.append((255, 255, 255, 0))
            continue
        if is_near_black(r, g, b, a):
            # Keep some softness from original alpha / gray level
            brightness = 255 - int((r + g + b) / 3)
            tone = min(255, 210 + brightness // 8)
            out.append((tone, tone, tone, a))
            continue
        # Soften very dark grays that aren't pure black
        if chroma(r, g, b) < 30 and (r + g + b) / 3 < 90:
            tone = min(255, 200 + int((r + g + b) / 9))
            out.append((tone, tone, tone, a))
            continue
        out.append((r, g, b, a))

    im.putdata(out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, optimize=True)
    print(f"wrote {dest.relative_to(ROOT.parent.parent)}")


def main() -> None:
    for country in COUNTRIES:
        folder = ROOT / country
        for name in ("logo.png", "icon.png"):
            src = folder / name
            if not src.exists():
                print(f"skip missing {src}")
                continue
            stem = name.replace(".png", "")
            to_dark_variant(src, folder / f"{stem}-dark.png")


if __name__ == "__main__":
    main()
