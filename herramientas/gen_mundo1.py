"""Pixel art del Mundo 1 (Mercado) estilo RPG 2D vista desde arriba. Todo original."""
import sys, os, random
from PIL import Image, ImageDraw

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
K = (27, 20, 48)
def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
T = 16      # tile base
S = 4       # escala

def outline(im):
    src = im.copy(); sp = src.load(); px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            if sp[x, y][3] == 0 and any(0 <= x + dx < w and 0 <= y + dy < h and sp[x + dx, y + dy][3]
                                         for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = K + (255,)
    return im

# ------------------------------------------------------------------ personas (16x22)
SKIN = hx('e0a473'); SKIN_D = hx('b8784a')
def person(hair='2b1a12', style='short', shirt='7a1f3d', shirt2=None, lower='6b7080', skirt=False, hat=None,
           skin=SKIN, facing='down', apron=None, cap=None):
    im = Image.new('RGBA', (16, 22), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    H = hx(hair); SH = hx(shirt); LO = hx(lower)
    # piernas / falda
    if skirt:
        d.polygon([(3, 15), (12, 15), (14, 20), (1, 20)], fill=LO)
        d.line([(2, 18), (13, 18)], fill=hx(shirt2 or 'f2b632'))
        d.rectangle([4, 20, 6, 21], fill=K); d.rectangle([9, 20, 11, 21], fill=K)
    else:
        d.rectangle([4, 16, 7, 20], fill=LO); d.rectangle([8, 16, 11, 20], fill=LO)
        d.rectangle([4, 21, 7, 21], fill=K); d.rectangle([8, 21, 11, 21], fill=K)
    # cuerpo
    d.rectangle([3, 11, 12, 15], fill=SH)
    d.rectangle([2, 12, 2, 15], fill=SH); d.rectangle([13, 12, 13, 15], fill=SH)
    d.point((2, 16), fill=skin); d.point((13, 16), fill=skin)
    if shirt2 and not skirt:
        d.rectangle([3, 11, 12, 11], fill=hx(shirt2))
    if apron:
        d.rectangle([5, 12, 10, 16], fill=hx(apron))
    # cabeza
    d.rectangle([4, 3, 11, 10], fill=skin); d.rectangle([3, 4, 12, 9], fill=skin)
    if facing == 'down':
        d.point((6, 7), fill=K); d.point((9, 7), fill=K); d.point((6, 6), fill=K); d.point((9, 6), fill=K)
        d.point((5, 8), fill=hx('e88a8a')); d.point((10, 8), fill=hx('e88a8a'))
        d.line([(7, 9), (8, 9)], fill=SKIN_D)
    # pelo
    if facing == 'up':
        d.rectangle([3, 2, 12, 9], fill=H)
    elif style == 'short':
        d.rectangle([3, 2, 12, 4], fill=H); d.point((3, 5), fill=H); d.point((12, 5), fill=H)
        d.rectangle([4, 1, 11, 1], fill=H)
    elif style == 'long':
        d.rectangle([3, 2, 12, 4], fill=H); d.rectangle([4, 1, 11, 1], fill=H)
        d.rectangle([2, 4, 3, 13], fill=H); d.rectangle([12, 4, 13, 13], fill=H)
    elif style == 'braids':
        d.rectangle([3, 2, 12, 4], fill=H); d.rectangle([4, 1, 11, 1], fill=H)
        d.rectangle([2, 5, 3, 14], fill=H); d.rectangle([12, 5, 13, 14], fill=H)
        d.point((2, 15), fill=hx('d9406a')); d.point((13, 15), fill=hx('d9406a'))
    elif style == 'bald':
        d.rectangle([3, 4, 3, 6], fill=H); d.rectangle([12, 4, 12, 6], fill=H)
    if hat == 'montera':        # sombrero alto andino
        d.rectangle([1, 3, 14, 3], fill=hx('f4efe4')); d.rectangle([4, -1, 11, 2], fill=hx('f4efe4'))
        d.rectangle([4, 2, 11, 2], fill=hx('2b1a12'))
    if cap:
        d.rectangle([3, 1, 12, 3], fill=hx(cap)); d.rectangle([3, 4, 13, 4], fill=hx(cap))
    return outline(im)

ANA = dict(hair='2b1a12', style='long', shirt='7a1f3d', shirt2='fff8ec', lower='6b7080', skirt=True)
ANA['shirt2'] = 'f2b632'
SPRITES = {
    'ana': ANA,
    'ana_arriba': dict(ANA, facing='up'),
    'dona_rosa': dict(hair='2b1a12', style='braids', shirt='e8572a', lower='d9406a', skirt=True, shirt2='f2b632', hat='montera'),
    'don_lucho': dict(hair='4a3a30', style='bald', shirt='2c6fb5', lower='4a4f5c', apron='fff8ec'),
    'carmen': dict(hair='5a2a1a', style='short', shirt='1fa36b', lower='2c3e7a', skirt=True, shirt2='fff8ec', apron='f2b632'),
    'nino': dict(hair='2b1a12', style='short', shirt='f2b632', lower='2c6fb5', cap='d9324a'),
}
MASCOT = [
    "......KKKK......", "....KKRRRRKK....", "...KRRYRRYRRK...", "..KRRRRRRRRRRK..", "..KYRYRYRYRYRK..",
    "..KKSSSSSSSSKK..", ".KRKSSSSSSSSKRK.", ".KRKSEWSSEWSKRK.", ".KRKSSSSSSSSKRK.", "..KYKSSssSSKYK..",
    "...KKSSSSSSKK...", "..KRRRRRRRRRRK..", ".KRYRRYRRYRRYRK.", ".KSRRRRRRRRRRSK.", ".KSKYYYYYYYYKSK.",
    "..KKRRRRRRRRKK..", "...KBBBKKBBBK...", "...KBBBKKBBBK...", "...KbbbK.KbbbK..", "...KKKKK.KKKKK..",
]
PAL = {'K': K, 'R': hx('7a1f3d'), 'Y': hx('f2b632'), 'S': SKIN, 's': SKIN_D, 'E': K, 'W': (255, 255, 255),
       'B': hx('2c3e7a'), 'b': hx('5a3a22')}
def from_rows(rows):
    w = max(len(r) for r in rows); im = Image.new('RGBA', (w, len(rows)), (0, 0, 0, 0)); px = im.load()
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.': px[x, y] = PAL[c] + (255,)
    return im
ECU = from_rows(MASCOT).resize((12, 15), Image.NEAREST)   # Ecu pequeño que acompaña

sprites = {k: person(**v) for k, v in SPRITES.items()}
for k, im in sprites.items():
    im.resize((16 * 8, 22 * 8), Image.NEAREST).save(f"{OUT}/retrato_{k}.png")   # retrato grande para diálogos
    im.resize((16 * S, 22 * S), Image.NEAREST).save(f"{OUT}/sprite_{k}.png")
ECU.resize((12 * S, 15 * S), Image.NEAREST).save(f"{OUT}/sprite_ecu.png")

# ------------------------------------------------------------------ tiles del mercado
def floor(d, x, y, rnd):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('dcc79c'))
    for (sx, sy, w, h) in ((1, 1, 6, 5), (9, 1, 6, 4), (1, 8, 4, 7), (6, 7, 5, 4), (12, 6, 3, 5), (6, 12, 8, 3)):
        c = rnd.choice(['cfb98c', 'd4bf93', 'c9b386'])
        d.rectangle([x + sx, y + sy, x + sx + w - 1, y + sy + h - 1], fill=hx(c))
def plaza(d, x, y, rnd):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('e8dcc0'))
    d.line([(x, y + 15), (x + 15, y + 15)], fill=hx('d6c7a6')); d.line([(x + 15, y), (x + 15, y + 15)], fill=hx('d6c7a6'))
def grass(d, x, y, rnd):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('5fae4f'))
    for _ in range(5):
        gx, gy = x + rnd.randrange(15), y + rnd.randrange(14)
        d.line([(gx, gy), (gx, gy + 1)], fill=hx('3f8f3a'))
def flowers(d, x, y, rnd):
    grass(d, x, y, rnd)
    for _ in range(4):
        fx, fy = x + 2 + rnd.randrange(11), y + 2 + rnd.randrange(11)
        c = hx(rnd.choice(['f2b632', 'd9406a', 'ffffff', 'e8572a']))
        d.point((fx, fy), fill=c); d.point((fx + 1, fy), fill=c); d.point((fx, fy + 1), fill=c); d.point((fx + 1, fy + 1), fill=hx('fff3a0'))
PRODUCE = {'papa': ('a8794a', '7d5530'), 'tomate': ('d9324a', '9e1f30'), 'choclo': ('f2c230', 'c99a14'),
           'naranja': ('f28c28', 'c96a1a'), 'palta': ('3f8f3a', '25632a'), 'cebolla': ('c26aa8', '8d4a7a')}
def crate(d, x, y, rnd, kind=None):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('8a5a2b'))
    d.rectangle([x + 1, y + 1, x + 14, y + 14], fill=hx('6b3f1d'))
    kind = kind or rnd.choice(list(PRODUCE))
    a, b = PRODUCE[kind]
    for yy in range(2, 14, 3):
        for xx in range(2 + (yy // 3) % 2, 14, 3):
            d.rectangle([x + xx, y + yy, x + xx + 1, y + yy + 1], fill=hx(a)); d.point((x + xx + 1, y + yy + 1), fill=hx(b))
    d.line([(x, y + 15), (x + 15, y + 15)], fill=hx('4a2a12'))
def roof(d, x, y, rnd):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('b5482f'))
    for yy in range(0, 16, 4):
        d.line([(x, y + yy + 3), (x + 15, y + yy + 3)], fill=hx('8f3522'))
        for xx in range((yy // 4) % 2 * 2, 16, 4):
            d.point((x + xx, y + yy + 1), fill=hx('d0623f'))
def wall(d, x, y, rnd, kind='plain'):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('f1e6cf'))
    d.line([(x, y + 15), (x + 15, y + 15)], fill=hx('c9b48c'))
    d.rectangle([x, y, x + 15, y + 1], fill=hx('7a4a2a'))
    if kind == 'window':
        d.rectangle([x + 4, y + 4, x + 11, y + 11], fill=hx('2c6fb5')); d.rectangle([x + 5, y + 5, x + 10, y + 10], fill=hx('8cc8ff'))
        d.line([(x + 7, y + 5), (x + 7, y + 10)], fill=hx('2c6fb5')); d.line([(x + 5, y + 7), (x + 10, y + 7)], fill=hx('2c6fb5'))
    if kind == 'door':
        d.rectangle([x + 3, y + 4, x + 12, y + 15], fill=hx('2c6fb5')); d.rectangle([x + 4, y + 5, x + 11, y + 15], fill=hx('2560a0'))
        d.point((x + 10, y + 10), fill=hx('f2b632'))
def tree(d, x, y):
    d.rectangle([x + 13, y + 20, x + 18, y + 31], fill=hx('6b3f1d'))
    d.ellipse([x + 1, y + 1, x + 30, y + 24], fill=hx('2f7d3a'))
    d.ellipse([x + 4, y + 2, x + 26, y + 18], fill=hx('3f9a48'))
    for (a, b) in ((9, 6), (17, 9), (12, 13), (21, 5)):
        d.rectangle([x + a, y + b, x + a + 2, y + b + 1], fill=hx('62c25b'))
def fountain(d, x, y):
    d.ellipse([x + 1, y + 3, x + 46, y + 46], fill=hx('9a958c'))
    d.ellipse([x + 4, y + 6, x + 43, y + 43], fill=hx('b9b4aa'))
    d.ellipse([x + 7, y + 9, x + 40, y + 40], fill=hx('2f7fd6'))
    for (a, b) in ((14, 16), (28, 30), (30, 15), (15, 31)):
        d.line([(x + a, y + b), (x + a + 4, y + b)], fill=hx('8cc8ff'))
    d.rectangle([x + 21, y + 14, x + 26, y + 30], fill=hx('b9b4aa')); d.rectangle([x + 19, y + 12, x + 28, y + 15], fill=hx('d8d3c8'))
    d.rectangle([x + 22, y + 6, x + 25, y + 12], fill=hx('8cc8ff'))
def stall(d, x, y, w, awn=('7a1f3d', 'fff8ec'), goods=('papa', 'tomate', 'choclo'), rnd=None):
    """puesto: w tiles de ancho, 2 tiles de alto (toldo + mostrador)."""
    W = w * T
    d.rectangle([x, y + 3, x + W - 1, y + 13], fill=hx(awn[0]))
    for i in range(0, W, 8):
        d.rectangle([x + i + 4, y + 3, x + i + 7, y + 13], fill=hx(awn[1]))
    for i in range(0, W, 8):
        d.pieslice([x + i, y + 10, x + i + 8, y + 17], 0, 180, fill=hx(awn[0] if (i // 8) % 2 == 0 else awn[1]))
    d.line([(x, y + 3), (x + W - 1, y + 3)], fill=K)
    d.rectangle([x + 1, y + 17, x + 2, y + 22], fill=hx('6b3f1d')); d.rectangle([x + W - 3, y + 17, x + W - 2, y + 22], fill=hx('6b3f1d'))
    d.rectangle([x, y + 22, x + W - 1, y + 31], fill=hx('8a5a2b')); d.rectangle([x, y + 22, x + W - 1, y + 23], fill=hx('a8743c'))
    gx = x + 3
    for g in goods:
        a, b = PRODUCE[g]
        for k in range(3):
            d.ellipse([gx + k * 4, y + 18, gx + k * 4 + 4, y + 22], fill=hx(a), outline=hx(b))
        gx += (W - 6) // len(goods)
def sacks(d, x, y):
    for i, (dx, dy) in enumerate(((0, 2), (7, 0), (4, 6))):
        d.ellipse([x + dx, y + dy, x + dx + 8, y + dy + 9], fill=hx('c9a26b'), outline=hx('8a6a3b'))
        d.line([(x + dx + 2, y + dy + 2), (x + dx + 6, y + dy + 2)], fill=hx('8a6a3b'))
def arch(d, x, y):
    """arco de salida del mercado, 3 tiles de ancho y 4 de alto."""
    d.rectangle([x, y, x + 7, y + 63], fill=hx('9a958c')); d.rectangle([x + 40, y, x + 47, y + 63], fill=hx('9a958c'))
    for yy in range(0, 64, 6):
        d.line([(x, y + yy), (x + 7, y + yy)], fill=hx('7f7a72')); d.line([(x + 40, y + yy), (x + 47, y + yy)], fill=hx('7f7a72'))
    d.rectangle([x - 2, y - 2, x + 49, y + 9], fill=hx('7a1f3d')); d.rectangle([x - 2, y + 9, x + 49, y + 11], fill=hx('4e1027'))
    d.rectangle([x + 10, y + 2, x + 37, y + 7], fill=hx('f2b632'))
def flag(d, x, y):
    d.line([(x + 4, y + 1), (x + 4, y + 15)], fill=K)
    for yy in range(1, 8):
        for xx in range(5, 14):
            d.point((x + xx, y + yy), fill=(255, 255, 255) if (xx // 2 + yy // 2) % 2 else K)

def render(grid, objects, people, name):
    rows = len(grid); cols = len(grid[0])
    im = Image.new('RGBA', (cols * T, rows * T)); d = ImageDraw.Draw(im); rnd = random.Random(3)
    for ty, row in enumerate(grid):
        for tx, c in enumerate(row):
            x, y = tx * T, ty * T
            {'.': floor, ',': plaza, 'g': grass, 'f': flowers, 'R': roof}.get(c, floor)(d, x, y, rnd) if c in '.,gfR' else None
            if c == '#': crate(d, x, y, rnd)
            if c in 'wWD': wall(d, x, y, rnd, {'w': 'plain', 'W': 'window', 'D': 'door'}[c])
            if c == 'B': floor(d, x, y, rnd); flag(d, x, y)
            if c == 'o': floor(d, x, y, rnd)
    for fn, args in objects:
        fn(d, *args)
    for (key, tx, ty) in sorted(people, key=lambda p: p[2]):
        spr = ECU if key == 'ecu' else sprites[key]
        ox = 2 if key == 'ecu' else 0; oy = 1 if key == 'ecu' else -6
        im.alpha_composite(spr, (int(tx * T + ox), int(ty * T + oy)))
    big = im.resize((cols * T * S, rows * T * S), Image.NEAREST)
    big.convert('RGB').save(f"{OUT}/{name}.png")
    return big

# ---- zona del mercado (hub)  22 x 12
HUB = [
    "RRRRRRRRRRRRRRRRRRRRRR",
    "wWwDwWwwWwDwWwwWwDwWwW",
    "gf....................",
    "g.....................",
    "g.....................",
    "f.......,,,,,.........",
    "g.......,,,,,.........",
    "g.......,,,,,.........",
    "g.....................",
    "f.....................",
    "g.....................",
    "ggfggggfgggggffggggfgg",
]
hub_objects = [
    (stall, (1 * T + 8, 2 * T, 4, ('7a1f3d', 'fff8ec'), ('papa', 'choclo', 'papa'), None)),   # N1
    (stall, (1 * T + 8, 7 * T, 4, ('2c6fb5', 'fff8ec'), ('naranja', 'palta'), None)),         # N2
    (stall, (14 * T, 2 * T, 4, ('e8572a', 'f2b632'), ('papa', 'tomate', 'cebolla'), None)),    # N3
    (stall, (14 * T, 7 * T, 4, ('1fa36b', 'fff8ec'), ('tomate', 'palta'), None)),             # N4
    (fountain, (9 * T, 5 * T)),
    (sacks, (6 * T + 4, 3 * T + 6)), (sacks, (12 * T, 9 * T + 4)),
    (arch, (18 * T + 6, 4 * T)),
    (tree, (19 * T + 8, 8 * T + 6)),
]
hub_people = [('dona_rosa', 15.5, 4.2), ('ana', 13.0, 5.4), ('ecu', 12.0, 5.9), ('don_lucho', 2.5, 9.2),
              ('carmen', 3.0, 4.2), ('nino', 7.0, 8.6)]
render(HUB, hub_objects, hub_people, 'zona_mercado')
render(HUB, hub_objects, [p for p in hub_people if p[0] not in ('ana', 'ecu', 'don_lucho')] + [('don_lucho', 19.4, 6.3), ('ana_arriba', 19.4, 7.75), ('ecu', 18.4, 8.0)], 'zona_mercado_fin')

# ---- laberinto del nivel 3: pasillos del mercado con 3 vecinos que bloquean el paso
LAB = [
    "RRRRRRRRRRRRRRRRRRRRRR",
    "#...............B....#",
    "###############o######",
    "#....................#",
    "#..####.......####...#",
    "#....................#",
    "######o###############",
    "#....................#",
    "############o#########",
    "#....................#",
    "#...####.......####..#",
    "######################",
]
lab_people = [('carmen', 15, 1.6), ('don_lucho', 6, 5.6), ('dona_rosa', 12, 7.6), ('ana_arriba', 12, 8.75), ('ecu', 11, 9.0)]
render(LAB, [], lab_people, 'nivel_mercado')

# ------------------------------------------------------------------ balanza
def balanza(tilt, name):
    W, H = 150, 72
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cx = W // 2
    d.rectangle([cx - 18, H - 8, cx + 18, H - 2], fill=hx('7a1f3d')); d.rectangle([cx - 14, H - 10, cx + 14, H - 8], fill=hx('4e1027'))
    d.rectangle([cx - 3, 18, cx + 3, H - 10], fill=hx('8a8f9c')); d.rectangle([cx - 2, 18, cx - 1, H - 10], fill=hx('c4c8d2'))
    dy = tilt  # positivo: lado derecho baja
    L = (cx - 50, 20 - dy); R = (cx + 50, 20 + dy)
    d.line([L, R], fill=hx('5d6475'), width=4)
    d.ellipse([cx - 5, 15, cx + 5, 25], fill=hx('f2b632'), outline=K)
    for (px, py) in (L, R):
        d.line([(px, py), (px - 16, py + 22)], fill=hx('5d6475')); d.line([(px, py), (px + 16, py + 22)], fill=hx('5d6475'))
        d.rectangle([px - 22, py + 22, px + 22, py + 25], fill=hx('c4c8d2')); d.rectangle([px - 22, py + 25, px + 22, py + 26], fill=hx('8a8f9c'))
    # 3 sacos a la izquierda
    for i in range(3):
        sx = L[0] - 19 + i * 13; sy = L[1] + 10
        d.ellipse([sx, sy, sx + 12, sy + 13], fill=hx('c9a26b'), outline=hx('6b4a2b'))
        d.rectangle([sx + 4, sy - 1, sx + 8, sy + 2], fill=hx('8a6a3b'))
    # pesas a la derecha
    for i, (wx, ww, wh) in enumerate(((-18, 14, 10), (-2, 12, 9), (12, 8, 7))):
        bx = R[0] + wx; by = R[1] + 22 - wh
        d.rectangle([bx, by, bx + ww, by + wh], fill=hx('3a3f4c'), outline=K); d.rectangle([bx + ww // 2 - 2, by - 3, bx + ww // 2 + 2, by], fill=hx('3a3f4c'), outline=K)
    outline(im)
    im.resize((W * 5, H * 5), Image.NEAREST).save(f"{OUT}/{name}.png")
balanza(0, 'balanza_equilibrada'); balanza(6, 'balanza_inclinada')   # sacos ligeros: sube la izquierda

# ------------------------------------------------------------------ monedero (reto nivel 5)
def monedas():
    im = Image.new('RGBA', (40, 30), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse([4, 6, 30, 28], fill=hx('7a1f3d')); d.rectangle([12, 2, 22, 8], fill=hx('7a1f3d'))
    d.line([(12, 6), (22, 6)], fill=hx('f2b632'), width=2)
    for (x, y) in ((26, 18), (31, 22), (28, 25)):
        d.ellipse([x, y, x + 7, y + 6], fill=hx('f2b632'), outline=hx('c98a14'))
    outline(im); im.resize((40 * 5, 30 * 5), Image.NEAREST).save(f"{OUT}/monedero.png")
monedas()

# ------------------------------------------------------------------ cóndor grande llevando a Ana y Ecu
def condor_big():
    W, H = 96, 48
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    blk, gr, wh = hx('1d1a24'), hx('3a3644'), (255, 255, 255)
    d.polygon([(48, 22), (2, 6), (6, 12), (0, 14), (8, 18), (4, 22), (14, 24), (30, 30)], fill=blk)
    d.polygon([(48, 22), (94, 6), (90, 12), (96, 14), (88, 18), (92, 22), (82, 24), (66, 30)], fill=blk)
    for i in range(4):
        d.line([(10 + i * 8, 12 + i * 3), (16 + i * 8, 22 + i * 2)], fill=gr)
        d.line([(86 - i * 8, 12 + i * 3), (80 - i * 8, 22 + i * 2)], fill=gr)
    d.polygon([(26, 21), (70, 21), (64, 27), (32, 27)], fill=wh)
    d.ellipse([34, 20, 66, 38], fill=blk)
    d.rectangle([64, 22, 74, 28], fill=hx('e6a7a0')); d.ellipse([70, 17, 82, 28], fill=hx('e6a7a0'))
    d.point((77, 21), fill=K); d.polygon([(81, 22), (86, 24), (81, 26)], fill=hx('d8c06a'))
    d.rectangle([66, 21, 70, 24], fill=wh)
    d.polygon([(34, 30), (24, 36), (36, 34)], fill=blk)
    rider = person(**ANA).resize((11, 15), Image.NEAREST); im.alpha_composite(rider, (44, 8))
    im.alpha_composite(ECU.resize((9, 11), Image.NEAREST), (36, 13))
    outline(im); im.resize((W * 5, H * 5), Image.NEAREST).save(f"{OUT}/condor_vuelo.png")
condor_big()
# cóndor posado sobre el arco (vista pequeña)
def condor_posado():
    im = Image.new('RGBA', (22, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    blk = hx('1d1a24')
    d.ellipse([3, 4, 17, 15], fill=blk); d.polygon([(4, 6), (0, 14), (6, 12)], fill=blk); d.polygon([(16, 6), (21, 14), (14, 12)], fill=blk)
    d.rectangle([7, 4, 13, 6], fill=(255, 255, 255)); d.ellipse([7, 0, 13, 6], fill=hx('e6a7a0')); d.point((11, 2), fill=K)
    d.polygon([(13, 3), (16, 4), (13, 5)], fill=hx('d8c06a'))
    outline(im); im.resize((22 * S, 16 * S), Image.NEAREST).save(f"{OUT}/condor_posado.png")
condor_posado()
print(sorted(os.listdir(OUT)))
