"""Genera los gráficos pixel art de EcuAventura (todo original)."""
import sys, os, random
from PIL import Image, ImageDraw

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
K = (27, 20, 48)

def hexc(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# ------------------------------------------------------------------ sprites
PAL = {'K': K, 'R': hexc('7a1f3d'), 'r': hexc('a8345a'), 'Y': hexc('f2b632'), 'y': hexc('c98a14'),
       'S': hexc('e0a473'), 's': hexc('b8784a'), 'E': K, 'W': (255, 255, 255), 'B': hexc('2c3e7a'),
       'b': hexc('5a3a22'), 'G': hexc('1fa36b'), 'g': hexc('8d93a3'), 'h': hexc('5d6475'), 'o': hexc('e8572a')}

def sprite(rows, outline=False):
    w = max(len(r) for r in rows); rows = [r.ljust(w, '.') for r in rows]; h = len(rows)
    im = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0)); px = im.load()
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            if c != '.':
                px[x + 1, y + 1] = PAL[c] + (255,)
    if outline:
        src = im.copy(); sp = src.load()
        for y in range(h + 2):
            for x in range(w + 2):
                if sp[x, y][3] == 0 and any(0 <= x + dx < w + 2 and 0 <= y + dy < h + 2 and sp[x + dx, y + dy][3] and sp[x + dx, y + dy][:3] != K
                                             for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    px[x, y] = K + (255,)
    return im

MASCOT = [
    "......KKKK......",
    "....KKRRRRKK....",
    "...KRRYRRYRRK...",
    "..KRRRRRRRRRRK..",
    "..KYRYRYRYRYRK..",
    "..KKSSSSSSSSKK..",
    ".KRKSSSSSSSSKRK.",
    ".KRKSEWSSEWSKRK.",
    ".KRKSSSSSSSSKRK.",
    "..KYKSSssSSKYK..",
    "...KKSSSSSSKK...",
    "..KRRRRRRRRRRK..",
    ".KRYRRYRRYRRYRK.",
    ".KSRRRRRRRRRRSK.",
    ".KSKYYYYYYYYKSK.",
    "..KKRRRRRRRRKK..",
    "...KBBBKKBBBK...",
    "...KBBBKKBBBK...",
    "...KbbbK.KbbbK..",
    "...KKKKK.KKKKK..",
]
MASCOT_HAPPY = [
    ".S....KKKK....S.",
    "KSK.KKRRRRKK.KSK",
    "KRRKRRYRRYRRKRRK",
    ".KRRRRRRRRRRRRK.",
    "..KYRYRYRYRYRK..",
    "..KKSSSSSSSSKK..",
    ".KRKSSSSSSSSKRK.",
    ".KRKSKKSSKKSKRK.",
    ".KRKSSSSSSSSKRK.",
    "..KYKSKSSKSKYK..",
    "...KKSSKKSSKK...",
    "..KRRRRRRRRRRK..",
    ".KRYRRYRRYRRYRK.",
    ".KRRRRRRRRRRRRK.",
    "..KKYYYYYYYYKK..",
    "..KKRRRRRRRRKK..",
    "...KBBBKKBBBK...",
    "...KBBBKKBBBK...",
    "...KbbbK.KbbbK..",
    "...KKKKK.KKKKK..",
]
CONDOR = [
    "KK....................KK",
    "KKKK................KKKK",
    ".KKKKK.....WW.....KKKKK.",
    "..KKKKKKKKWWWWKKKKKKKK..",
    "....KKKKKKKrrKKKKKKK....",
    "......KKKKKKKKKKKK......",
    "........KK....KK........",
]
STAR = ["....Y....", "...YYY...", "YYYYYYYYY", ".YYYWYYY.", "..YYYYY..", "..YY.YY..", ".YY...YY."]
STAR_OFF = [r.replace('Y', 'g').replace('W', 'g') for r in STAR]
LOCK = ["..ggg..", ".g...g.", ".g...g.", "YYYYYYY", "YYYKYYY", "YYYKYYY", "YYYYYYY"]


def save_sprite(rows, name, scale, outline=False):
    sprite(rows, outline).resize(((len(max(rows, key=len)) + 2) * scale, (len(rows) + 2) * scale), Image.NEAREST).save(f"{OUT}/{name}.png")


save_sprite(MASCOT, 'mascota', 10)
save_sprite(MASCOT_HAPPY, 'mascota_feliz', 10)
save_sprite(CONDOR, 'condor', 6)
save_sprite(STAR, 'estrella', 8, True)
save_sprite(STAR_OFF, 'estrella_off', 8, True)
save_sprite(LOCK, 'candado', 6, True)

# ------------------------------------------------------------------ scenes (342x192 low-res, x4)
SW, SH = 342, 192

def sky(d, top_bands=('2f5fc4', '3d6fd6', '4f83e6', '6a9cf0', '8ab6f6', 'a9ccfb')):
    band = SH // 2 // len(top_bands) + 6
    for i, c in enumerate(top_bands):
        y0 = i * band
        d.rectangle([0, y0, SW, y0 + band], fill=hexc(c))
        if i:  # dither transition
            for x in range(0, SW, 2):
                d.point((x + (y0 % 2), y0), fill=hexc(top_bands[i - 1]))
                d.point((x + 1, y0 + 1), fill=hexc(top_bands[i - 1]))

def cloud(d, x, y, s=1):
    for (dx, dy, w, h) in [(4, 4, 22, 6), (8, 1, 10, 5), (16, 0, 8, 6), (0, 6, 30, 4)]:
        d.rectangle([x + dx * s, y + dy * s, x + (dx + w) * s, y + (dy + h) * s], fill=(255, 255, 255))
    d.rectangle([x + 2 * s, y + 9 * s, x + 28 * s, y + 10 * s], fill=hexc('cfe2fb'))

def mountains(d, base, peaks, col, shade, snow=True):
    for (px_, ph, half) in peaks:
        d.polygon([(px_ - half, base), (px_, base - ph), (px_ + half, base)], fill=hexc(col))
        d.polygon([(px_, base - ph), (px_ + half, base), (px_ + half // 3, base)], fill=hexc(shade))
        if snow:
            sh = ph // 4
            d.polygon([(px_ - half * sh // ph, base - ph + sh), (px_, base - ph), (px_ + half * sh // ph, base - ph + sh),
                       (px_ + 2, base - ph + sh - 2), (px_ - 3, base - ph + sh + 1)], fill=(244, 248, 255))

def hills(d, base, amp, col, top, period, phase):
    import math
    for x in range(SW):
        y = int(base - amp * (0.5 + 0.5 * math.sin((x + phase) / period)))
        d.line([(x, y), (x, SH)], fill=hexc(col))
        d.point((x, y), fill=hexc(top))

def tree(d, x, y):
    d.rectangle([x + 5, y + 10, x + 7, y + 18], fill=hexc('6b3f1d'))
    for (dx, dy, w, h, c) in [(0, 2, 12, 9, '2e8b3e'), (2, 0, 8, 12, '2e8b3e'), (2, 2, 4, 3, '58b858')]:
        d.rectangle([x + dx, y + dy, x + dx + w, y + dy + h], fill=hexc(c))

def ground(d, y):
    d.rectangle([0, y, SW, SH], fill=hexc('4cae4f'))
    d.rectangle([0, y, SW, y + 1], fill=hexc('7fd36b'))
    rnd = random.Random(3)
    for _ in range(70):
        gx = rnd.randrange(SW); gy = rnd.randrange(y + 3, SH - 8)
        d.line([(gx, gy), (gx, gy - 2)], fill=hexc('2e8b3e')); d.point((gx + 1, gy - 1), fill=hexc('2e8b3e'))
    d.rectangle([0, SH - 6, SW, SH], fill=hexc('8a5a2b'))
    for x in range(0, SW, 6):
        d.point((x, SH - 6), fill=hexc('4cae4f')); d.point((x + 3, SH - 4), fill=hexc('6e4520'))

def base_scene():
    im = Image.new('RGB', (SW, SH)); d = ImageDraw.Draw(im)
    sky(d)
    d.rectangle([0, 120, SW, SH], fill=hexc('5a8667'))
    for (x, y, s) in [(14, 18, 1), (120, 10, 1), (250, 26, 1), (300, 6, 1), (190, 40, 1)]:
        cloud(d, x, y, s)
    mountains(d, 128, [(40, 60, 46), (110, 78, 56), (175, 52, 40), (240, 84, 60), (320, 58, 46)], '7d86c4', '646cab')
    mountains(d, 140, [(80, 40, 50), (205, 46, 56), (295, 36, 44)], '6f9d7c', '5a8667', snow=False)
    hills(d, 160, 14, '3f9a48', '62c25b', 22, 0)
    ground(d, 162)
    for tx in (8, 300):
        tree(d, tx, 144)
    return im, d

def inca_door(d, x, y):
    # puerta trapezoidal de piedra (estilo inca) con placa dorada x = ?
    stones = ['9a958c', '8a857c', 'aaa59c', '7f7a72']
    rnd = random.Random(7)
    for row in range(8):
        yy = y + row * 5
        off = (row % 2) * 4
        for col in range(-1, 7):
            xx = x + col * 8 + off
            d.rectangle([xx, yy, xx + 7, yy + 4], fill=hexc(rnd.choice(stones)), outline=hexc('5f5a52'))
    d.polygon([(x + 16, y + 40), (x + 19, y + 12), (x + 31, y + 12), (x + 34, y + 40)], fill=hexc('2a2236'))
    d.rectangle([x + 13, y + 4, x + 37, y + 10], fill=hexc('f2b632'), outline=K)

im, d = base_scene()
inca_door(d, 262, 122)
im.resize((SW * 4, SH * 4), Image.NEAREST).save(f"{OUT}/fondo_inicio.png")
im, d = base_scene()
# capa suave para menús
im.resize((SW * 4, SH * 4), Image.NEAREST).save(f"{OUT}/fondo_menu.png")

# ------------------------------------------------------------------ mazes (17x8 tiles of 16px)
T = 16

def tile_floor(d, x, y, theme, rnd, shade=False):
    if theme == 'mercado':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('ead7ad'))
        for yy in (0, 8):
            d.line([(x, y + yy), (x + 15, y + yy)], fill=hexc('d2b98a'))
            off = 0 if yy == 0 else 8
            d.line([(x + off, y + yy), (x + off, y + yy + 7)], fill=hexc('d2b98a'))
    elif theme == 'estacion':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('5b606c'))
        for _ in range(6):
            d.point((x + rnd.randrange(16), y + rnd.randrange(16)), fill=hexc('4c515c'))
    elif theme == 'puerto':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('b97f47'))
        for yy in (3, 7, 11, 15):
            d.line([(x, y + yy), (x + 15, y + yy)], fill=hexc('8d5c2f'))
        d.point((x + 2, y + 1), fill=hexc('5a3a22')); d.point((x + 13, y + 9), fill=hexc('5a3a22'))
    elif theme == 'construccion':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('dca865'))
        for _ in range(7):
            d.point((x + rnd.randrange(16), y + rnd.randrange(16)), fill=hexc('b8874d'))
    if shade:
        d.rectangle([x, y, x + 15, y + 2], fill=tuple(int(c * .72) for c in d.im.getpixel((x + 4, y + 6))))

def tile_wall(d, x, y, theme, rnd):
    if theme == 'mercado':
        d.rectangle([x, y + 5, x + 15, y + 15], fill=hexc('9a6232'))
        for yy in (8, 12):
            d.line([(x, y + yy), (x + 15, y + yy)], fill=hexc('734520'))
        d.rectangle([x, y, x + 15, y + 5], fill=hexc('6b3f1d'))
        cols = ['e8572a', 'f2b632', '1fa36b', 'd9324a', 'f28c28']
        for fx in range(1, 15, 4):
            c = hexc(rnd.choice(cols))
            d.rectangle([x + fx, y + 1, x + fx + 2, y + 3], fill=c); d.point((x + fx, y + 1), fill=(255, 240, 200))
    elif theme == 'estacion':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('b9bdc6'))
        d.rectangle([x, y, x + 15, y + 2], fill=hexc('dadde3'))
        d.rectangle([x, y + 13, x + 15, y + 15], fill=hexc('8f95a3'))
        d.rectangle([x, y + 7, x + 15, y + 8], fill=hexc('f2c230'))
        d.point((x + 3, y + 4), fill=hexc('a3a8b3')); d.point((x + 11, y + 10), fill=hexc('a3a8b3'))
    elif theme == 'puerto':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('2f7fd6'))
        for (wx, wy) in ((2, 4), (9, 10), (12, 2), (4, 13)):
            d.line([(x + wx, y + wy), (x + wx + 3, y + wy)], fill=hexc('8cc8ff'))
            d.point((x + wx + 1, y + wy - 1), fill=hexc('cfe9ff'))
        d.rectangle([x, y + 14, x + 15, y + 15], fill=hexc('2565b0'))
    elif theme == 'construccion':
        d.rectangle([x, y, x + 15, y + 15], fill=hexc('e6cfa2'))
        for row in range(4):
            off = 0 if row % 2 == 0 else 4
            for bx in range(-8, 16, 8):
                x0, x1 = max(bx + off, 0), min(bx + off + 6, 15)
                if x1 >= x0:
                    d.rectangle([x + x0, y + row * 4, x + x1, y + row * 4 + 2], fill=hexc('b5482f'))

def tile_door(d, x, y, theme, rnd, opened=False, active=False):
    tile_floor(d, x, y, theme, rnd)
    if opened:
        d.rectangle([x, y, x + 2, y + 15], fill=hexc('7f7a72')); d.rectangle([x + 13, y, x + 15, y + 15], fill=hexc('7f7a72'))
        for i in range(0, 16, 3):
            d.point((x + 7, y + i), fill=hexc('f2b632'))
        return
    d.rectangle([x, y, x + 15, y + 15], fill=hexc('6b3f1d'))
    for bx in (3, 7, 11):
        d.line([(x + bx, y + 1), (x + bx, y + 15)], fill=hexc('4a2a12'))
    d.rectangle([x + 3, y + 3, x + 12, y + 12], fill=hexc('f2b632'), outline=K)
    for (a, b) in ((5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (9, 5), (8, 6), (6, 8), (5, 9)):
        d.point((x + a + 1, y + b), fill=hexc('7a1f3d'))
    if active:
        d.rectangle([x - 1, y - 1, x + 16, y + 16], outline=(255, 255, 255))

def tile_goal(d, x, y, theme, rnd):
    tile_floor(d, x, y, theme, rnd)
    d.line([(x + 4, y + 2), (x + 4, y + 15)], fill=K)
    for yy in range(2, 8):
        for xx in range(5, 13):
            d.point((x + xx, y + yy), fill=(255, 255, 255) if (xx // 2 + yy // 2) % 2 else K)

def tile_cone(d, x, y):
    d.polygon([(x + 5, y + 13), (x + 8, y + 4), (x + 11, y + 13)], fill=hexc('f28c28'))
    d.line([(x + 6, y + 9), (x + 10, y + 9)], fill=(255, 255, 255))
    d.rectangle([x + 4, y + 13, x + 12, y + 14], fill=hexc('c96a1a'))

MAZES = {
    'mercado': ["WWWWWWWWWWWWWWWWW",
                "WP...W.....W....W",
                "W.WW.W.WWW.W.WW.W",
                "W.W..A..W....W..W",
                "W.W.WWWWW.WWWW.WW",
                "W...W.....D.....W",
                "WWW.W.WWWWWWW.W.G",
                "WWWWWWWWWWWWWWWWW"],
    'estacion': ["WWWWWWWWWWWWWWWWW",
                 "W....W...W......W",
                 "W.WW.W.W.W.WWWW.W",
                 "W.W....WPO..W...W",
                 "W.WWWW.WWWW.W.WWW",
                 "W......W....D...W",
                 "WWWWW.WW.WWWWWW.G",
                 "WWWWWWWWWWWWWWWWW"],
    'puerto': ["WWWWWWWWWWWWWWWWW",
               "W......W....W...W",
               "W.WWWW.W.WW.W.W.W",
               "W.W..W...W..PA..W",
               "W.W.WWWWWW.WWWW.W",
               "W.W....D......W.W",
               "W...WW.WWWWWW...G",
               "WWWWWWWWWWWWWWWWW"],
    'construccion': ["WWWWWWWWWWWWWWWWW",
                     "W...C..W.......GW",
                     "W.WWWW.W.WWWWW.DW",
                     "W.W....W.W...W..W",
                     "W.W.WWWW.W.W.WW.W",
                     "W.W......PA.C...W",
                     "W...WWWWWWWWWWW.W",
                     "WWWWWWWWWWWWWWWWW"],
}

for theme, rows in MAZES.items():
    rnd = random.Random(hash(theme) % 1000)
    im = Image.new('RGBA', (17 * T, 8 * T)); d = ImageDraw.Draw(im)
    player = None
    for ty, row in enumerate(rows):
        for tx, c in enumerate(row):
            x, y = tx * T, ty * T
            if c == 'W':
                tile_wall(d, x, y, theme, rnd)
            elif c in 'DA':
                tile_door(d, x, y, theme, rnd, active=(c == 'A'))
            elif c == 'O':
                tile_door(d, x, y, theme, rnd, opened=True)
            elif c == 'G':
                tile_goal(d, x, y, theme, rnd)
            else:
                tile_floor(d, x, y, theme, rnd, shade=(ty > 0 and rows[ty - 1][tx] == 'W'))
                if c == 'C':
                    tile_cone(d, x, y)
                if c == 'P':
                    player = (x, y)
    if player:
        spr = sprite(MASCOT).resize((14, 18), Image.NEAREST)
        im.alpha_composite(spr, (player[0] + 1, player[1] - 3))
    im.convert('RGB').resize((17 * T * 4, 8 * T * 4), Image.NEAREST).save(f"{OUT}/laberinto_{theme}.png")
print(sorted(os.listdir(OUT)))
