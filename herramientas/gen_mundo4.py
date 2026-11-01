"""Mundo 4 (Construcción) en mapa abierto. Reutiliza gen_mundo3.py (que reutiliza gen_mundo1.py)."""
import sys, os, random, shutil
from PIL import Image, ImageDraw
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
tmp = os.path.join(OUT, '_tmp'); g = {'__name__': 'g3', '__file__': os.path.join(here, 'gen_mundo3.py')}
sys.argv = ['x', tmp]; exec(open(os.path.join(here, 'gen_mundo3.py')).read(), g); shutil.rmtree(tmp)
T, K, hx, person, outline, ECU, ANA = g['T'], g['K'], g['hx'], g['person'], g['outline'], g['ECU'], g['ANA']
rnd = random.Random(11)

NPC = {'julio': dict(hair='2b1a12', style='short', shirt='e8572a', lower='2c3e7a', cap='f2b632', apron='f28c28'),
       'sofia': dict(hair='4a2a1a', style='long', shirt='fff8ec', lower='2c3e7a', skirt=True, shirt2='2c6fb5', cap='fff8ec'),
       'tomas': dict(hair='5a3a22', style='bald', shirt='8d93a3', lower='4a4f5c', cap='f2b632', apron='5d6475'),
       'rosa_m': dict(hair='2b1a12', style='braids', shirt='1fa36b', lower='d9406a', skirt=True, shirt2='f2b632')}
sp = {k: person(**v) for k, v in NPC.items()}
sp['ana'] = person(**ANA); sp['ana_arriba'] = person(**dict(ANA, facing='up'))
for k in NPC:
    sp[k].resize((128, 176), Image.NEAREST).save(f"{OUT}/retrato_{k}.png"); sp[k].resize((64, 88), Image.NEAREST).save(f"{OUT}/sprite_{k}.png")
sp['ana'].resize((64, 88), Image.NEAREST).save(f"{OUT}/sprite_ana.png")

def icon(fn, name):
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im); fn(d); outline(im)
    im.resize((96, 96), Image.NEAREST).save(f"{OUT}/obj_{name}.png"); return im
def casco(d): d.pieslice([2, 4, 13, 16], 180, 360, fill=hx('f2b632')); d.rectangle([1, 9, 14, 11], fill=hx('c98a14')); d.line([(7, 4), (7, 9)], fill=hx('c98a14'))
def plano(d): d.rectangle([2, 3, 13, 13], fill=hx('2c6fb5')); [d.line([(3, y), (12, y)], fill=hx('8cc8ff')) for y in (6, 9)]; d.rectangle([5, 5, 9, 11], outline=(255, 255, 255))
def martillo(d): d.line([(4, 14), (10, 6)], fill=hx('8a5a2b'), width=2); d.rectangle([7, 2, 14, 6], fill=hx('8d93a3'))
def llave_grua(d): d.ellipse([2, 2, 9, 9], fill=hx('8d93a3')); d.ellipse([4, 4, 7, 7], fill=(0, 0, 0, 0)); d.line([(8, 8), (14, 14)], fill=hx('8d93a3'), width=3)
ICONS = {'casco': icon(casco, 'casco'), 'plano': icon(plano, 'plano'), 'martillo': icon(martillo, 'martillo'), 'llave_grua': icon(llave_grua, 'llave_grua')}

def dirt(d, x, y, r):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('d8a868'))
    for _ in range(6): d.point((x + r.randrange(16), y + r.randrange(16)), fill=hx(r.choice(['b8874d', 'c8955a', 'e6bd80'])))
def gravel(d, x, y, r):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('a8a296'))
    for _ in range(8): d.point((x + r.randrange(16), y + r.randrange(16)), fill=hx(r.choice(['8a8478', 'c4c0b6'])))
TILE = {'d': dirt, '.': gravel, 'r': g['rock'], 'C': g['cave'], 'g': lambda d, x, y, r: g['g']['grass'](d, x, y, r), 'f': lambda d, x, y, r: g['g']['flowers'](d, x, y, r)}
W, H = 44, 24
grid = [['d'] * W for _ in range(H)]
def fill(c, x0, y0, x1, y1):
    for yy in range(y0, y1 + 1):
        for xx in range(x0, x1 + 1): grid[yy][xx] = c
fill('r', 0, 0, 10, 6); grid[6][7] = 'C'; fill('g', 0, 7, 3, 23); fill('g', 0, 22, W - 1, 23); fill('g', 40, 0, W - 1, 23)
fill('.', 4, 18, 36, 18); fill('.', 7, 7, 7, 18); fill('.', 13, 7, 13, 18); fill('.', 20, 10, 20, 18); fill('.', 13, 10, 36, 10); fill('.', 36, 9, 36, 18); fill('.', 4, 18, 4, 21)
for _ in range(14):
    xx, yy = rnd.randrange(0, 4), rnd.randrange(7, 22); grid[yy][xx] = 'f'

def fence(d, x0, y, x1):
    for x in range(x0, x1, 6): d.rectangle([x, y, x + 1, y + 10], fill=hx('f2b632'))
    d.line([(x0, y + 3), (x1, y + 3)], fill=hx('e8572a'), width=2); d.line([(x0, y + 8), (x1, y + 8)], fill=hx('e8572a'), width=2)
def bricks(d, x, y, n=3):
    for row in range(n):
        for i in range(4 - row % 2):
            bx = x + i * 8 + (row % 2) * 4; d.rectangle([bx, y - row * 4, bx + 7, y - row * 4 + 3], fill=hx('b5482f'), outline=hx('7a2f1f'))
def bags(d, x, y):
    for i in range(3): d.rectangle([x + i * 7, y + (i % 2) * 3, x + i * 7 + 8, y + (i % 2) * 3 + 10], fill=hx('e6dccb'), outline=hx('8d93a3'))
def cone(d, x, y):
    d.polygon([(x + 5, y + 13), (x + 8, y + 4), (x + 11, y + 13)], fill=hx('f28c28')); d.line([(x + 6, y + 9), (x + 10, y + 9)], fill=(255, 255, 255))
def building(d, x, y, w=9, h=7):
    """edificio a medio construir con andamios."""
    X1, Y1 = x + w * T, y + h * T
    d.rectangle([x, y + T, X1, Y1], fill=hx('c4c0b6'), outline=K)
    for yy in range(y + T + 8, Y1, 22):
        for xx in range(x + 8, X1 - 8, 22): d.rectangle([xx, yy, xx + 11, yy + 11], fill=hx('5d6475'))
    d.rectangle([x, y + T - 4, X1, y + T], fill=hx('8d93a3'))
    for xx in range(x - 4, X1 + 6, 18): d.line([(xx, y + 6), (xx, Y1)], fill=hx('8a5a2b'), width=2)
    for yy in range(y + 10, Y1, 20): d.line([(x - 4, yy), (X1 + 4, yy)], fill=hx('8a5a2b'), width=2)
def crane(d, x, y):
    for yy in range(y + 10, y + 130, 8):
        d.rectangle([x, yy, x + 8, yy + 7], outline=hx('f2b632')); d.line([(x, yy), (x + 8, yy + 7)], fill=hx('f2b632'))
    d.rectangle([x - 60, y + 4, x + 30, y + 10], fill=hx('f2b632'), outline=K); d.rectangle([x - 2, y - 4, x + 12, y + 10], fill=hx('7a1f3d'), outline=K)
    d.line([(x - 48, y + 10), (x - 48, y + 46)], fill=K); d.rectangle([x - 54, y + 46, x - 42, y + 52], fill=hx('5d6475'))
    d.rectangle([x - 6, y + 130, x + 14, y + 138], fill=hx('5d6475'))
def mixer(d, x, y):
    d.ellipse([x, y + 2, x + 18, y + 16], fill=hx('e8572a'), outline=K); d.rectangle([x + 2, y + 14, x + 16, y + 18], fill=hx('5d6475')); d.ellipse([x + 3, y + 17, x + 8, y + 22], fill=K); d.ellipse([x + 11, y + 17, x + 16, y + 22], fill=K)

im = Image.new('RGBA', (W * T, H * T)); d = ImageDraw.Draw(im)
for yy in range(H):
    for xx in range(W): TILE[grid[yy][xx]](d, xx * T, yy * T, rnd)
g['house'](d, 11 * T, 3 * T, '2c6fb5')
building(d, 23 * T, 1 * T); crane(d, 36 * T + 2, 0)
fence(d, 4 * T, 20 * T + 6, 36 * T); fence(d, 15 * T, 15 * T, 24 * T)
for (bx, by) in ((17 * T, 13 * T), (21 * T, 14 * T + 4), (28 * T, 13 * T), (9 * T, 12 * T)): bricks(d, bx, by)
for (bx, by) in ((24 * T, 11 * T + 6), (31 * T, 15 * T), (5 * T, 9 * T)): bags(d, bx, by)
for (cx, cy) in ((14, 16), (19, 9), (26, 17), (33, 12), (8, 19)): cone(d, cx * T, cy * T)
mixer(d, 30 * T, 11 * T + 6)
for (tx, ty) in ((1, 8), (40, 3), (41, 12), (1, 16), (40, 19)): g['g']['tree'](d, tx * T, ty * T)
BASE = im.copy()

def with_people(people, items):
    m = BASE.copy()
    for (k, tx, ty) in items: m.alpha_composite(ICONS[k].resize((12, 12), Image.NEAREST), (int(tx * T + 2), int(ty * T + 2)))
    for (k, tx, ty) in sorted(people, key=lambda p: p[2]):
        spr = ECU if k == 'ecu' else sp[k]; ox, oy = (2, 1) if k == 'ecu' else (0, -6)
        m.alpha_composite(spr, (int(tx * T + ox), int(ty * T + oy)))
    return m
PEOPLE = [('julio', 5, 19.2), ('sofia', 13, 7.2), ('tomas', 8, 7.4), ('rosa_m', 20, 11.2)]
full = with_people(PEOPLE + [('ana', 17.0, 17.3), ('ecu', 16.1, 17.8)], [('casco', 22.3, 16.4)])
full.resize((W * T * 2, H * T * 2), Image.NEAREST).convert('RGB').save(f"{OUT}/mapa_obra.png")
ex = with_people(PEOPLE + [('ana', 20.6, 16.6), ('ecu', 19.7, 17.0)], [('casco', 22.3, 16.4)])
ex.crop((13 * T, 9 * T, 13 * T + 352, 9 * T + 192)).resize((1408, 768), Image.NEAREST).convert('RGB').save(f"{OUT}/explorar_obra.png")
cr = with_people([('julio', 35, 9.3), ('ana_arriba', 36, 11.3), ('ecu', 35, 11.6)], [])
cr.crop((22 * T, 0, 22 * T + 352, 192)).resize((1408, 768), Image.NEAREST).convert('RGB').save(f"{OUT}/grua_obra.png")

# ------------------------------------------------------------------ torres de ladrillos (reto 17)
def torres(a, b, name, puente):
    Wt, Ht = 120, 92
    t = Image.new('RGBA', (Wt, Ht), (0, 0, 0, 0)); d = ImageDraw.Draw(t)
    d.rectangle([0, Ht - 4, Wt - 1, Ht - 1], fill=hx('8a8478'))
    def tower(x0, n, col):
        for i in range(n):
            y = Ht - 4 - (i + 1) * 4; off = (i % 2) * 4
            for j in range(3): d.rectangle([x0 + off + j * 8 - 4, y, x0 + off + j * 8 + 3, y + 3], fill=hx(col), outline=hx('7a2f1f'))
    tower(14, a, 'b5482f'); tower(82, b, 'c0603a')
    if puente:
        top = Ht - 4 - a * 4 - 3; d.rectangle([12, top, 110, top + 2], fill=hx('8a5a2b'), outline=K)
    outline(t); t.resize((Wt * 4, Ht * 4), Image.NEAREST).save(f"{OUT}/{name}.png")
torres(18, 18, 'torres_iguales', True)     # x = 7: 3(7-1)=18, 2(7+2)=18
torres(12, 14, 'torres_distintas', False)  # x = 5: 3(5-1)=12, 2(5+2)=14
print(sorted(os.listdir(OUT)))
