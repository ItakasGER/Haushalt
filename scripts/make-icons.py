"""Erzeugt die App-Icons in public/icons (Farben wie in der App)."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'public' / 'icons'
PRIMARY, TEAL, GOLD, WHITE = (0, 24, 168), (0, 180, 166), (201, 162, 39), (255, 255, 255)


def draw(size, padding=0.0):
    s = 4 * size  # Supersampling für glatte Kanten
    img = Image.new('RGB', (s, s), PRIMARY)
    d = ImageDraw.Draw(img)
    inner = s * (1 - 2 * padding)
    ox = oy = s * padding
    u = inner / 10
    # Drei Balken (Budget) + Trendlinie (Investments)
    bars = [(2.0, 6.2, TEAL), (4.3, 4.6, GOLD), (6.6, 3.0, WHITE)]
    for x, top, col in bars:
        d.rounded_rectangle([ox + x * u, oy + top * u, ox + (x + 1.5) * u, oy + 8.2 * u], radius=u * 0.25, fill=col)
    pts = [(ox + 1.6 * u, oy + 5.0 * u), (ox + 4.0 * u, oy + 3.4 * u), (ox + 5.6 * u, oy + 4.0 * u), (ox + 8.4 * u, oy + 1.8 * u)]
    d.line(pts, fill=WHITE, width=int(u * 0.45), joint='curve')
    r = u * 0.45
    x, y = pts[-1]
    d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
draw(180).save(OUT / 'apple-touch-icon.png')
draw(192).save(OUT / 'icon-192.png')
draw(512).save(OUT / 'icon-512.png')
draw(512, padding=0.1).save(OUT / 'icon-512-maskable.png')
draw(64).save(OUT / 'favicon.png')
print('Icons geschrieben nach', OUT)
