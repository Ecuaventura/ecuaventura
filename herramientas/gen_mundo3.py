"""Mundo 3 (Puerto) en mapa abierto: mapa grande, cueva, casas, objetos. Reutiliza gen_mundo1.py."""
import sys, os, random, shutil
from PIL import Image, ImageDraw, ImageFilter
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
tmp = os.path.join(OUT, '_tmp'); g = {'__name__': 'g1'}
sys.argv = ['x', tmp]; exec(open(os.path.join(here, 'gen_mundo1.py')).read(), g); shutil.rmtree(tmp)
T, S, K, hx, person, outline, ECU, ANA = g['T'], g['S'], g['K'], g['hx'], g['person'], g['outline'], g['ECU'], g['ANA']

NPC = {'pancho': dict(hair='8d93a3', style='bald', shirt='2c6fb5', lower='5a3a22', cap='f2b632', apron='f2b632'),
       'elena': dict(hair='2b1a12', style='braids', shirt='d9406a', lower='2c3e7a', skirt=True, shirt2='fff8ec'),
       'ernesto': dict(hair='fff8ec', style='bald', shirt='7a1f3d', lower='1b1430', cap='1b1430'),
       'mateo': dict(hair='2b1a12', style='short', shirt='1fa36b', lower='2c6fb5')}
sp = {k: person(**v) for k, v in NPC.items()}
sp['ana'] = person(**ANA); sp['ana_arriba'] = person(**dict(ANA, facing='up'))
for k in NPC:
    sp[k].resize((128, 176), Image.NEAREST).save(f"{OUT}/retrato_{k}.png")
    sp[k].resize((64, 88), Image.NEAREST).save(f"{OUT}/sprite_{k}.png")
sp['ana'].resize((64, 88), Image.NEAREST).save(f"{OUT}/sprite_ana.png")

# ------------------------------------------------------------------ objetos (iconos 16x16)
def icon(fn, name):
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im); fn(d); outline(im)
    im.resize((96, 96), Image.NEAREST).save(f"{OUT}/obj_{name}.png"); return im
def remo(d):
    d.line([(3, 13), (11, 5)], fill=hx('8a5a2b'), width=2); d.polygon([(10, 2), (14, 2), (14, 6), (11, 7), (9, 5)], fill=hx('c98a4a'))
def linterna(d):
    d.rectangle([5, 5, 10, 13], fill=hx('3a3f4c')); d.rectangle([6, 7, 9, 11], fill=hx('fff3a0')); d.rectangle([6, 2, 9, 4], fill=hx('3a3f4c')); d.rectangle([7, 0, 8, 1], fill=hx('3a3f4c'))
def llave(d):
    d.ellipse([2, 2, 8, 8], outline=hx('f2b632'), width=2); d.line([(7, 7), (13, 13)], fill=hx('f2b632'), width=2); d.line([(11, 13), (11, 11)], fill=hx('f2b632'), width=2)
def mapa(d):
    d.polygon([(2, 3), (6, 2), (10, 3), (14, 2), (14, 13), (10, 14), (6, 13), (2, 14)], fill=hx('efe4cc')); d.line([(6, 2), (6, 13)], fill=hx('c9b48c')); d.line([(10, 3), (10, 14)], fill=hx('c9b48c'))
    d.line([(3, 11), (7, 8), (9, 9), (12, 5)], fill=hx('d9324a')); d.point((12, 5), fill=hx('d9324a')); d.rectangle([11, 4, 13, 6], outline=hx('d9324a'))
ICONS = {'remo': icon(remo, 'remo'), 'linterna': icon(linterna, 'linterna'), 'llave': icon(llave, 'llave'), 'mapa': icon(mapa, 'mapa')}

# ------------------------------------------------------------------ tiles
def water(d, x, y, r):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('2f7fd6'))
    for _ in range(2):
        wx, wy = x + r.randrange(11), y + 2 + r.randrange(12); d.line([(wx, wy), (wx + 3, wy)], fill=hx('8cc8ff'))
def shore(d, x, y, r):
    water(d, x, y, r); d.rectangle([x, y, x + 15, y + 3], fill=hx('e8d9a8')); d.line([(x, y + 4), (x + 15, y + 4)], fill=(255, 255, 255))
def sand(d, x, y, r):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('ead9a6'))
    for _ in range(4): d.point((x + r.randrange(16), y + r.randrange(16)), fill=hx('d6c08a'))
def path(d, x, y, r):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('c9a26b'))
    for _ in range(4): d.point((x + r.randrange(16), y + r.randrange(16)), fill=hx('a8834f'))
def dock(d, x, y, r):
    water(d, x, y, r); d.rectangle([x, y, x + 15, y + 15], fill=hx('a8743c'))
    for yy in (3, 7, 11, 15): d.line([(x, y + yy), (x + 15, y + yy)], fill=hx('7a4f22'))
def rock(d, x, y, r):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('8a8478'))
    for (a, b, w) in ((1, 1, 6), (8, 3, 6), (3, 9, 7), (11, 10, 4)):
        d.rectangle([x + a, y + b, x + a + w, y + b + 4], fill=hx(r.choice(['9a958c', '7a7468', 'a8a296'])))
    d.line([(x, y + 15), (x + 15, y + 15)], fill=hx('5f5a52'))
def cave(d, x, y, r):
    rock(d, x, y, r); d.pieslice([x + 1, y + 2, x + 14, y + 26], 180, 360, fill=hx('1b1430')); d.rectangle([x + 1, y + 14, x + 14, y + 15], fill=hx('1b1430'))
TILE = {'~': water, 'w': shore, 's': sand, '.': path, '=': dock, 'r': rock, 'C': cave,
        'g': lambda d, x, y, r: g['grass'](d, x, y, r), 'f': lambda d, x, y, r: g['flowers'](d, x, y, r)}

W, H = 44, 24
grid = [['g'] * W for _ in range(H)]
def fill(c, x0, y0, x1, y1):
    for yy in range(y0, y1 + 1):
        for xx in range(x0, x1 + 1):
            if 0 <= xx < W and 0 <= yy < H: grid[yy][xx] = c
fill('~', 0, 18, W - 1, H - 1); fill('~', 37, 9, W - 1, H - 1)
fill('s', 0, 15, 36, 17); fill('s', 34, 8, 36, 17)
for xx in range(0, 37): grid[18][xx] = 'w'
for yy in range(9, 18): grid[yy][37] = 'w'
fill('r', 0, 0, 10, 6); fill('r', 34, 0, W - 1, 6); grid[6][6] = 'C'
fill('.', 2, 10, 33, 10); fill('.', 6, 7, 6, 10); fill('.', 20, 4, 20, 16); fill('.', 33, 6, 33, 10)
fill('.', 13, 7, 27, 7); fill('.', 13, 6, 13, 7); fill('.', 27, 6, 27, 7)
fill('=', 20, 17, 20, 22); fill('=', 15, 21, 26, 21); fill('.', 33, 6, 40, 6); fill('.', 40, 4, 40, 6)
rnd = random.Random(8)
for _ in range(26):
    xx, yy = rnd.randrange(11, 33), rnd.randrange(1, 15)
    if grid[yy][xx] == 'g': grid[yy][xx] = 'f' if rnd.random() < .35 else 'g'

def house(d, x, y, roofc='b5482f'):
    """casa 4x3 tiles, puerta abajo al centro."""
    for i in range(4):
        g['roof'](d, x + i * T, y, rnd)
        g['wall'](d, x + i * T, y + 2 * T, rnd, 'door' if i == 2 else 'window')
        g['wall'](d, x + i * T, y + T, rnd, 'plain')
    d.rectangle([x, y + T, x + 4 * T - 1, y + T + 5], fill=hx(roofc))
def faro(d, x, y):
    d.polygon([(x + 6, y + 10), (x + 26, y + 10), (x + 22, y + 60), (x + 10, y + 60)], fill=(255, 255, 255), outline=K)
    for yy in (22, 38): d.polygon([(x + 8, y + yy), (x + 24, y + yy), (x + 23, y + yy + 7), (x + 9, y + yy + 7)], fill=hx('d9324a'))
    d.rectangle([x + 9, y + 2, x + 23, y + 10], fill=hx('fff3a0'), outline=K); d.polygon([(x + 7, y + 2), (x + 16, y - 6), (x + 25, y + 2)], fill=hx('7a1f3d'), outline=K)
    d.rectangle([x + 13, y + 50, x + 18, y + 60], fill=hx('2c3e7a'))
def boat(d, x, y, col='d9324a'):
    d.polygon([(x, y + 4), (x + 30, y + 4), (x + 26, y + 12), (x + 4, y + 12)], fill=hx(col), outline=K)
    d.rectangle([x + 3, y + 2, x + 27, y + 5], fill=hx('8a5a2b'))
def palm(d, x, y):
    d.line([(x + 8, y + 30), (x + 11, y + 10)], fill=hx('8a5a2b'), width=3)
    for (a, b) in ((-2, 6), (24, 6), (2, 16), (20, 16), (11, 0)):
        d.line([(x + 11, y + 10), (x + a, y + b)], fill=hx('3f9a48'), width=3)
def stall(d, x, y):
    g['stall'](d, x, y, 4, ('2c6fb5', 'fff8ec'), ('naranja', 'palta'), rnd)
def barrels(d, x, y):
    for i in range(3): d.ellipse([x + i * 6, y, x + i * 6 + 7, y + 9], fill=hx('8a5a2b'), outline=K)

im = Image.new('RGBA', (W * T, H * T)); d = ImageDraw.Draw(im)
for yy in range(H):
    for xx in range(W):
        TILE[grid[yy][xx]](d, xx * T, yy * T, rnd)
house(d, 11 * T, 3 * T); house(d, 25 * T, 3 * T, '2c6fb5')
stall(d, 26 * T, 11 * T)
faro(d, 39 * T, 0)
for (bx, by, c) in ((16 * T, 19 * T + 4, 'd9324a'), (23 * T, 19 * T + 6, '1fa36b'), (22 * T, 22 * T + 2, 'f2b632'), (31 * T, 20 * T, '7a1f3d')):
    boat(d, bx, by, c)
for (tx, ty) in ((12, 1), (30, 1), (2, 12), (15, 12), (31, 13), (11, 8)):
    g['tree'](d, tx * T, ty * T)
for (tx, ty) in ((4, 14), (26, 14), (35, 12)):
    palm(d, tx * T, ty * T)
barrels(d, 22 * T + 2, 16 * T + 4)
BASE = im.copy()

def with_people(base, people, items):
    m = base.copy()
    for (k, tx, ty) in items:
        ic = ICONS[k].resize((12, 12), Image.NEAREST); m.alpha_composite(ic, (int(tx * T + 2), int(ty * T + 2)))
    for (k, tx, ty) in sorted(people, key=lambda p: p[2]):
        spr = ECU if k == 'ecu' else sp[k]; ox, oy = (2, 1) if k == 'ecu' else (0, -6)
        m.alpha_composite(spr, (int(tx * T + ox), int(ty * T + oy)))
    return m
PEOPLE = [('pancho', 20, 16.2), ('elena', 27.5, 12.6), ('ernesto', 38, 6.4), ('mateo', 8, 11.3)]
# mapa general (x2) — con objetos a encontrar
full = with_people(BASE, PEOPLE + [('ana', 29.5, 13.4), ('ecu', 28.6, 13.9)], [('remo', 31.2, 15.4)])
full.resize((W * T * 2, H * T * 2), Image.NEAREST).convert('RGB').save(f"{OUT}/mapa_puerto.png")
# vista de exploración (x4) recortada alrededor del mercado de pescado y la playa
expl = with_people(BASE, PEOPLE + [('ana', 30.0, 14.6), ('ecu', 29.1, 15.0)], [('remo', 31.2, 15.4)])
crop = expl.crop((19 * T + 4, 8 * T, 19 * T + 4 + 352, 8 * T + 192))
crop.resize((1408, 768), Image.NEAREST).convert('RGB').save(f"{OUT}/explorar_puerto.png")
# vista del faro (x4) para el reto del mundo
fv = with_people(BASE, PEOPLE[:-2] + [('ernesto', 40, 4.4), ('ana_arriba', 40, 5.7), ('ecu', 39, 6.0)], [])
fv.crop((22 * T, 0, 22 * T + 352, 192)).resize((1408, 768), Image.NEAREST).convert('RGB').save(f"{OUT}/faro_puerto.png")

# ------------------------------------------------------------------ interior de la cueva (22x12)
cv = Image.new('RGBA', (352, 192)); d = ImageDraw.Draw(cv); r2 = random.Random(3)
CAVE = ["rrrrrrrrrrrrrrrrrrrrrr", "rrrrrrrrrrrrrrrrrrrrrr", "rr..........rrrr....rr", "rr..rr......rr......rr", "rr..rr...........rr.rr",
        "rr.......rrrr......rrr", "rrr......rrrr.......rr", "rr....r.........rr..rr", "rr....rr............rr", "rr...........rr.....rr",
        "rrrrrrrrrr..rrrrrrrrrr", "rrrrrrrrrr..rrrrrrrrrr"]
for yy, row in enumerate(CAVE):
    for xx, c in enumerate(row):
        x, y = xx * T, yy * T
        if c == 'r':
            d.rectangle([x, y, x + 15, y + 15], fill=hx('3a3644'))
            for (a, b, w) in ((1, 2, 6), (8, 6, 6), (3, 10, 8)): d.rectangle([x + a, y + b, x + a + w, y + b + 3], fill=hx(r2.choice(['4a4556', '2e2a38'])))
        else:
            d.rectangle([x, y, x + 15, y + 15], fill=hx('6b6258'))
            for _ in range(4): d.point((x + r2.randrange(16), y + r2.randrange(16)), fill=hx('5a524a'))
def chest(d, x, y):
    d.rectangle([x + 1, y + 5, x + 14, y + 14], fill=hx('8a5a2b'), outline=K); d.rectangle([x + 1, y + 2, x + 14, y + 6], fill=hx('a8743c'), outline=K)
    d.rectangle([x + 6, y + 6, x + 9, y + 10], fill=hx('f2b632'), outline=K)
chest(d, 14 * T, 3 * T)
for (tx, ty) in ((3, 2), (19, 2), (8, 9)):
    d.rectangle([tx * T + 7, ty * T + 4, tx * T + 8, ty * T + 12], fill=hx('8a5a2b')); d.ellipse([tx * T + 5, ty * T, tx * T + 10, ty * T + 6], fill=hx('f28c28'))
for (k, tx, ty) in sorted([('ana_arriba', 14, 4.6), ('ecu', 13, 4.9)], key=lambda p: p[2]):
    spr = ECU if k == 'ecu' else sp[k]; cv.alpha_composite(spr, (int(tx * T + (2 if k == 'ecu' else 0)), int(ty * T + (1 if k == 'ecu' else -6))))
cv.resize((1408, 768), Image.NEAREST).convert('RGB').save(f"{OUT}/cueva_interior.png")
Image.new('RGBA', (16, 16)).save(f"{OUT}/_x.png"); os.remove(f"{OUT}/_x.png")
cimg = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); chest(ImageDraw.Draw(cimg), 0, 0); outline(cimg); cimg.resize((128, 128), Image.NEAREST).save(f"{OUT}/retrato_cofre.png")

# ------------------------------------------------------------------ bote de costado (equilibrio)
def bote(angle, name):
    Wb, Hb = 150, 70
    b = Image.new('RGBA', (Wb, Hb), (0, 0, 0, 0)); d = ImageDraw.Draw(b)
    d.polygon([(4, 34), (146, 34), (130, 58), (20, 58)], fill=hx('d9324a'), outline=K)
    d.rectangle([4, 30, 146, 35], fill=hx('8a5a2b'), outline=K); d.line([(20, 46), (130, 46)], fill=hx('fff8ec'), width=2)
    d.rectangle([74, 4, 76, 30], fill=hx('8a5a2b'))
    def caja(x, y, c='c98a4a'):
        d.rectangle([x, y, x + 15, y + 13], fill=hx(c), outline=K); d.line([(x, y + 6), (x + 15, y + 6)], fill=hx('8a5a2b'))
    for i in range(2): caja(12 + i * 18, 16)           # 2 cajas a la izquierda
    for i in range(3): d.ellipse([50 + i * 6, 22, 57 + i * 6, 29], fill=hx('8cc8ff'), outline=K)   # 3 kg de pescado
    caja(90, 16)                                         # 1 caja a la derecha
    d.rectangle([110, 18, 136, 29], fill=hx('5a3a22'), outline=K)   # red de 8 kg
    for xx in range(112, 136, 4): d.line([(xx, 19), (xx, 28)], fill=hx('8a6a3b'))
    outline(b)
    b = b.rotate(angle, resample=Image.NEAREST, expand=True)
    sea = Image.new('RGBA', (180, 100), (0, 0, 0, 0)); sd = ImageDraw.Draw(sea)
    sd.rectangle([0, 70, 179, 99], fill=hx('2f7fd6'))
    for xx in range(0, 180, 12): sd.line([(xx, 72), (xx + 6, 72)], fill=hx('8cc8ff'))
    sea.alpha_composite(b, ((180 - b.width) // 2, 20 - (b.height - Hb) // 2))
    for xx in range(0, 180, 16): sd.line([(xx + 4, 80), (xx + 10, 80)], fill=hx('8cc8ff'))
    sea.resize((180 * 4, 100 * 4), Image.NEAREST).save(f"{OUT}/{name}.png")
bote(0, 'bote_equilibrado'); bote(-7, 'bote_inclinado')
print(sorted(os.listdir(OUT)))
