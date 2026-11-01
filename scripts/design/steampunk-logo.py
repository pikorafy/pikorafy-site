"""Web versions of the Steampunk logo (design/steampunk-logo.png → public/themes/steampunk/).

  logo-banner.webp   the full logo, 1440 px wide (home page banner, shown up to ~720 px)
  logo-footer.webp   the full logo, 640 px wide (footer)
  logo-emblem.webp   just the "P" in its gear, 96 px tall (header, shown at 40-48 px)

Regenerate after replacing the source:  python3 scripts/design/steampunk-logo.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "design/steampunk-logo.png"
OUT = ROOT / "public/themes/steampunk"

logo = Image.open(SRC).convert("RGBA")
logo = logo.crop(logo.getchannel("A").getbbox())

def save(im: Image.Image, name: str, width: int | None = None, height: int | None = None):
    if width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    if height: im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    im.save(OUT / name, "WEBP", quality=80, method=6)
    print(f"{name:18} {im.width}x{im.height}  {(OUT / name).stat().st_size // 1024} KB")

save(logo, "logo-banner.webp", width=1440)
save(logo, "logo-footer.webp", width=640)

# The "P" in its gear: crop it from the source and clear the "i" under the P's bowl.
src = Image.open(SRC).convert("RGBA")
ImageDraw.Draw(src).rectangle((798, 735, 1130, 1100), fill=(0, 0, 0, 0))
emblem = src.crop((430, 200, 1130, 1080))
emblem = emblem.crop(emblem.getchannel("A").getbbox())
save(emblem, "logo-emblem.webp", height=96)
