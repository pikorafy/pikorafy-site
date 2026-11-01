"""Pixel-art pieces for the Steampunk theme (public/themes/steampunk/).

Drawn at 1x on one palette and shown at 3x with `image-rendering: pixelated`, so every
piece shares the same pixel size. Regenerate with:  python3 scripts/design/steampunk-assets.py
An artist's files can replace any of these at the same size and name.
"""
import math, random
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "public/themes/steampunk"
OUT.mkdir(parents=True, exist_ok=True)
random.seed(7)

def hx(c, a=255):
    c = c.lstrip("#"); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)

IRON = [hx(c) for c in ["#0f0d0c", "#181514", "#1f1b19", "#27221f", "#302a26", "#3c342e", "#4a4038"]]
RUST = [hx(c) for c in ["#3b2418", "#56321f", "#744327", "#91552e"]]
COPPER = [hx(c) for c in ["#3a1c10", "#66331a", "#934a25", "#ba6634", "#d98a50", "#f0b47c"]]
BRASS = [hx(c) for c in ["#3d2f10", "#6b5420", "#9a7a2c", "#c49e3c", "#e3c46a", "#fbe7a8"]]
CREAM = [hx(c) for c in ["#b8a576", "#d9c896", "#efe2bd", "#fbf3dc"]]
GREEN = [hx(c) for c in ["#1d5a2e", "#2f9a4a", "#5ee07a", "#b6f7c2"]]
TEAL = [hx(c) for c in ["#145a52", "#1f8a7e", "#35c2b0", "#a8f0e6"]]
RED = hx("#d0402c")
CLEAR = (0, 0, 0, 0)

def img(w, h, fill=CLEAR):
    return Image.new("RGBA", (w, h), fill)

def put(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), c)

def rivet(im, x, y, pal=BRASS):
    # 3x3 domed rivet: dark rim, lit top-left
    for dx, dy, c in [(-1, -1, pal[4]), (0, -1, pal[4]), (1, -1, pal[2]), (-1, 0, pal[4]), (0, 0, pal[5]),
                      (1, 0, pal[2]), (-1, 1, pal[2]), (0, 1, pal[1]), (1, 1, pal[0])]:
        put(im, x + dx, y + dy, c)

def save(im, name):
    im.save(OUT / name)
    print(f"{name:18} {im.width}x{im.height}")

# ── 1. Iron plate background tile (64x64, seamless) ───────────────────────────
N = 64
im = img(N, N, IRON[3])
for y in range(N):
    for x in range(N):
        r = random.random()
        if r < 0.12: put(im, x, y, IRON[4])
        elif r < 0.20: put(im, x, y, IRON[2])
for _ in range(7):                                    # faint rust specks, scattered
    cx, cy = random.randrange(6, N - 6), random.randrange(6, N - 6)
    for _ in range(random.randrange(2, 5)):
        put(im, cx + random.randrange(-2, 3), cy + random.randrange(-2, 3), random.choice(RUST[:2]))
for i in range(N):                                     # plate seams
    put(im, i, 0, IRON[0]); put(im, 0, i, IRON[0])
    put(im, i, 1, IRON[5]); put(im, 1, i, IRON[5])
    put(im, i, N - 1, IRON[1]); put(im, N - 1, i, IRON[1])
for x, y in [(5, 5), (N - 6, 5), (5, N - 6), (N - 6, N - 6)]:
    rivet(im, x, y, [IRON[0], IRON[2], IRON[3], IRON[4], IRON[5], IRON[6]])
save(im, "iron.png")

# ── 2. Copper panel frame, 9-slice (24x24, slice 8) ───────────────────────────
def frame(pal, name, fill):
    S, B = 24, 8
    im = img(S, S, fill)
    for y in range(S):
        for x in range(S):
            d = min(x, y, S - 1 - x, S - 1 - y)        # distance from the outside
            if d >= B: continue
            top_left = (x <= y and x < S - 1 - y) or (y < x and y < S - 1 - x)
            if d == 0: c = IRON[0]
            elif d == 1: c = pal[4] if top_left else pal[1]
            elif d in (2, 3, 4): c = pal[3] if top_left else pal[2]
            elif d == 5: c = pal[2] if top_left else pal[1]
            elif d == 6: c = pal[1]
            else: c = IRON[0]
            put(im, x, y, c)
    for x, y in [(3, 3), (S - 4, 3), (3, S - 4), (S - 4, S - 4)]:
        rivet(im, x, y, BRASS)
    save(im, name)

frame(COPPER, "frame.png", hx("#1d1917"))
frame(BRASS, "frame-brass.png", hx("#211c16"))

# ── 3. Title plate (brass bar for headings), 9-slice (16x16, slice 5) ─────────
im = img(16, 16, BRASS[3])
for y in range(16):
    for x in range(16):
        d = min(x, y, 15 - x, 15 - y)
        if d == 0: put(im, x, y, IRON[0])
        elif d == 1: put(im, x, y, BRASS[5] if (y == 1 or x == 1) else BRASS[1])
for x, y in [(3, 3), (12, 3), (3, 12), (12, 12)]:
    rivet(im, x, y, COPPER)
save(im, "plate.png")

# ── 4. Gears (brass 32, copper 20) ────────────────────────────────────────────
def gear(size, teeth, pal, name):
    im = img(size, size)
    c = (size - 1) / 2
    r_out, r_root, r_hub, r_hole = size / 2 - 0.5, size / 2 - 3.5, size / 5, size / 10
    for y in range(size):
        for x in range(size):
            dx, dy = x - c, y - c
            r = math.hypot(dx, dy); a = math.atan2(dy, dx)
            tooth = (math.cos(a * teeth) > 0.15)
            edge = r_out if tooth else r_root
            if r > edge or r < r_hole: continue
            light = (-dx - dy) / (abs(dx) + abs(dy) + 1e-6)   # lit from top-left
            if r > edge - 1.2: col = pal[1]
            elif abs(r - r_hub) < 0.8: col = pal[1]
            elif r < r_hub: col = pal[4] if light > 0 else pal[2]
            else: col = pal[4] if light > 0.4 else pal[3] if light > -0.4 else pal[2]
            # spokes cut-outs between hub and rim
            if r_hub + 1.5 < r < r_root - 2 and math.cos(a * 5) < -0.55: continue
            put(im, x, y, col)
    save(im, name)

gear(32, 10, BRASS, "gear.png")
gear(20, 8, COPPER, "gear-small.png")

# ── 5. Gauge (24x24): brass ring, cream face, ticks, red needle ───────────────
im = img(24, 24)
c = 11.5
for y in range(24):
    for x in range(24):
        r = math.hypot(x - c, y - c)
        if r > 11.6: continue
        if r > 10: put(im, x, y, BRASS[4] if (x + y) < 23 else BRASS[2])
        elif r > 9: put(im, x, y, IRON[0])
        else: put(im, x, y, CREAM[2] if r < 6 else CREAM[1])
for i in range(9):
    a = math.radians(135 + i * 33.75)
    put(im, round(c + math.cos(a) * 7.5), round(c + math.sin(a) * 7.5), IRON[1])
for t in range(1, 8):
    a = math.radians(-50)
    put(im, round(c + math.cos(a) * t), round(c + math.sin(a) * t), RED)
put(im, 11, 11, IRON[0]); put(im, 12, 12, IRON[0]); put(im, 12, 11, BRASS[3])
save(im, "gauge.png")

# ── 6. Pipes: vertical and horizontal tiles, flange ───────────────────────────
def pipe_col(i, n):          # copper shading across the pipe
    return [COPPER[1], COPPER[3], COPPER[4], COPPER[5], COPPER[4], COPPER[3], COPPER[3], COPPER[2], COPPER[1], IRON[0]][i * 10 // n]
im = img(10, 8)
for y in range(8):
    for x in range(10): put(im, x, y, pipe_col(x, 10))
save(im, "pipe-v.png")
im = img(8, 10)
for y in range(10):
    for x in range(8): put(im, x, y, pipe_col(y, 10))
save(im, "pipe-h.png")
im = img(14, 6)
for y in range(6):
    for x in range(14):
        put(im, x, y, BRASS[4] if y == 0 else BRASS[1] if y == 5 else BRASS[3])
for x in (2, 11): rivet(im, x, 3, BRASS)
save(im, "flange.png")

# ── 7. Glass tubes (12x48): brass caps, green or teal liquid ──────────────────
def tube(liquid, name):
    im = img(12, 48)
    for y in range(48):
        for x in range(12):
            if y < 5 or y > 42:
                put(im, x, y, BRASS[4] if y in (0, 43) else BRASS[3] if x < 6 else BRASS[2]); continue
            if x in (1, 10): put(im, x, y, hx("#7fb8b0", 200)); continue
            if x < 1 or x > 10: continue
            if y > 18:
                col = liquid[2] if x in (3, 4) else liquid[1]
                if random.random() < 0.05: col = liquid[3]
                put(im, x, y, col)
            else:
                put(im, x, y, hx("#9fd8d0", 70) if x not in (3,) else hx("#e8fffb", 150))
    save(im, name)

tube(GREEN, "tube-green.png")
tube(TEAL, "tube-teal.png")

# ── 8. Grille tile (8x8) for the footer machinery ─────────────────────────────
im = img(8, 8, IRON[1])
for y in range(8):
    for x in range(8):
        if x in (2, 3): put(im, x, y, IRON[0])
        elif x == 4: put(im, x, y, IRON[4])
        elif x == 1: put(im, x, y, IRON[3])
save(im, "grille.png")
