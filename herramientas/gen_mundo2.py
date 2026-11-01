"""Pixel art del Mundo 2 (Estación de buses). Reutiliza las funciones de gen_mundo1.py."""
import sys, os, random, shutil
from PIL import Image, ImageDraw
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
tmp = os.path.join(OUT, '_tmp'); ns = {'__name__': 'gen1'}
sys.argv = ['gen_mundo1.py', tmp]
exec(open(os.path.join(here, 'gen_mundo1.py')).read(), ns); shutil.rmtree(tmp)
g = ns; T, S, K, hx = g['T'], g['S'], g['K'], g['hx']
person, outline, ECU, ANA = g['person'], g['outline'], g['ECU'], g['ANA']

# ------------------------------------------------------------------ personajes del mundo 2
NPC = {
    'jhon': dict(hair='2b1a12', style='short', shirt='f2b632', lower='2c3e7a', cap='2c3e7a', apron='e8572a'),        # cobrador
    'marina': dict(hair='2b1a12', style='braids', shirt='1fa36b', lower='7a1f3d', skirt=True, shirt2='f2b632', apron='fff8ec'),  # emoliente
    'julia': dict(hair='4a2a1a', style='long', shirt='2c6fb5', lower='4a4f5c', skirt=True, shirt2='fff8ec'),          # boletera
    'teofilo': dict(hair='8d93a3', style='bald', shirt='fff8ec', lower='2c3e7a', cap='1b1430', apron='2c3e7a'),        # chofer
}
sp = {k: person(**v) for k, v in NPC.items()}
sp['ana'] = person(**ANA); sp['ana_arriba'] = person(**dict(ANA, facing='up'))
for k in NPC:
    sp[k].resize((16 * 8, 22 * 8), Image.NEAREST).save(f"{OUT}/retrato_{k}.png")
    sp[k].resize((16 * S, 22 * S), Image.NEAREST).save(f"{OUT}/sprite_{k}.png")

# ------------------------------------------------------------------ tiles de la estación
def asphalt(d, x, y, rnd):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('5b606c'))
    for _ in range(6):
        d.point((x + rnd.randrange(16), y + rnd.randrange(16)), fill=hx(rnd.choice(['4c515c', '6a707c'])))
def lane(d, x, y, rnd):
    asphalt(d, x, y, rnd); d.rectangle([x + 2, y + 7, x + 9, y + 8], fill=hx('f2c230'))
def walk(d, x, y, rnd):
    d.rectangle([x, y, x + 15, y + 15], fill=hx('c4c8d2'))
    d.line([(x, y + 15), (x + 15, y + 15)], fill=hx('a3a8b3')); d.line([(x + 15, y), (x + 15, y + 15)], fill=hx('a3a8b3'))
    d.line([(x, y + 7), (x + 15, y + 7)], fill=hx('b4b8c2'))
def curb(d, x, y, rnd):
    walk(d, x, y, rnd); d.rectangle([x, y + 13, x + 15, y + 15], fill=hx('f2c230'))
    for i in range(0, 16, 4): d.rectangle([x + i, y + 13, x + i + 1, y + 15], fill=hx('1b1430'))
def bench(d, x, y, rnd):
    walk(d, x, y, rnd)
    d.rectangle([x + 1, y + 4, x + 14, y + 11], fill=hx('8a5a2b')); d.line([(x + 1, y + 7), (x + 14, y + 7)], fill=hx('6b3f1d'))
    d.rectangle([x + 2, y + 12, x + 3, y + 14], fill=hx('3a3f4c')); d.rectangle([x + 12, y + 12, x + 13, y + 14], fill=hx('3a3f4c'))
def planter(d, x, y, rnd):
    walk(d, x, y, rnd); d.rectangle([x + 2, y + 2, x + 13, y + 14], fill=hx('7f7a72'))
    d.ellipse([x + 3, y + 1, x + 12, y + 10], fill=hx('3f9a48')); d.point((x + 6, y + 4), fill=hx('62c25b')); d.point((x + 9, y + 6), fill=hx('f2b632'))
def luggage(d, x, y, rnd):
    asphalt(d, x, y, rnd)
    d.rectangle([x + 1, y + 6, x + 7, y + 14], fill=hx(rnd.choice(['d9324a', '2c6fb5', '1fa36b'])), outline=K)
    d.rectangle([x + 8, y + 3, x + 14, y + 14], fill=hx(rnd.choice(['f2b632', '7a1f3d', 'c26aa8'])), outline=K)
    d.line([(x + 10, y + 1), (x + 12, y + 1)], fill=K); d.line([(x + 10, y + 1), (x + 10, y + 3)], fill=K); d.line([(x + 12, y + 1), (x + 12, y + 3)], fill=K)
BUSC = [('2c6fb5', 'fff8ec'), ('e8572a', 'fff8ec'), ('1fa36b', 'f2b632'), ('7a1f3d', 'f2b632'), ('f2b632', '7a1f3d')]
def bus_h(d, x, y, col):
    """bus visto desde arriba, horizontal: 4 tiles x 1 tile (64x16)."""
    a, b = hx(col[0]), hx(col[1])
    d.rectangle([x, y + 1, x + 63, y + 14], fill=a, outline=K)
    d.rectangle([x + 2, y + 3, x + 61, y + 12], fill=tuple(min(255, c + 30) for c in a))
    d.rectangle([x + 2, y + 7, x + 61, y + 8], fill=b)
    d.rectangle([x + 24, y + 4, x + 37, y + 11], fill=hx('c4c8d2'), outline=hx('8a8f9c'))
    d.rectangle([x + 59, y + 2, x + 62, y + 13], fill=hx('8cc8ff'))
def bus_v(d, x, y, col, rnd):
    """bus estacionado, vertical: 2 tiles x 3 tiles (32x48), frente hacia abajo."""
    a, b = hx(col[0]), hx(col[1])
    d.rectangle([x + 2, y, x + 29, y + 47], fill=a, outline=K)
    d.rectangle([x + 4, y + 2, x + 27, y + 41], fill=tuple(min(255, c + 30) for c in a))
    d.rectangle([x + 14, y + 2, x + 17, y + 41], fill=b)
    d.rectangle([x + 9, y + 12, x + 22, y + 24], fill=hx('c4c8d2'), outline=hx('8a8f9c'))
    d.rectangle([x + 4, y + 42, x + 27, y + 46], fill=hx('8cc8ff')); d.line([(x + 4, y + 44), (x + 27, y + 44)], fill=hx('5d9ad6'))
    d.rectangle([x + 3, y + 45, x + 5, y + 47], fill=hx('fff3a0')); d.rectangle([x + 26, y + 45, x + 28, y + 47], fill=hx('fff3a0'))
def booth(d, x, y):
    """boletería 3 tiles x 2 tiles."""
    d.rectangle([x, y + 4, x + 47, y + 31], fill=hx('f1e6cf'), outline=K)
    d.rectangle([x - 2, y, x + 49, y + 6], fill=hx('7a1f3d'), outline=K); d.rectangle([x + 10, y + 1, x + 37, y + 4], fill=hx('f2b632'))
    for i in range(3):
        d.rectangle([x + 4 + i * 15, y + 10, x + 14 + i * 15, y + 22], fill=hx('8cc8ff'), outline=hx('2c6fb5'))
    d.rectangle([x + 2, y + 24, x + 45, y + 27], fill=hx('8a5a2b'))
def sign(d, x, y):
    d.rectangle([x + 7, y + 6, x + 8, y + 15], fill=hx('3a3f4c'))
    d.ellipse([x + 3, y, x + 12, y + 9], fill=hx('2c6fb5'), outline=K); d.rectangle([x + 6, y + 3, x + 9, y + 6], fill=(255, 255, 255))
def lamp(d, x, y):
    d.rectangle([x + 7, y + 2, x + 8, y + 15], fill=hx('3a3f4c')); d.rectangle([x + 5, y, x + 10, y + 3], fill=hx('fff3a0'), outline=K)

TILE = {'a': asphalt, 'l': lane, 'v': walk, 'c': curb, 'n': bench, 'p': planter, 'm': luggage,
        'R': lambda d, x, y, r: g['roof'](d, x, y, r), 'g': lambda d, x, y, r: g['grass'](d, x, y, r),
        'f': lambda d, x, y, r: g['flowers'](d, x, y, r)}
WALLS = {'w': 'plain', 'W': 'window', 'D': 'door'}

def render(grid, objects, people, name):
    rows, cols = len(grid), len(grid[0])
    im = Image.new('RGBA', (cols * T, rows * T)); d = ImageDraw.Draw(im); rnd = random.Random(5)
    bus_runs = []
    for ty, row in enumerate(grid):
        tx = 0
        while tx < cols:
            c = row[tx]; x, y = tx * T, ty * T
            if c == '#':   # tramo de muro: buses de 4 y bancas
                run = 0
                while tx + run < cols and row[tx + run] == '#': run += 1
                k = 0
                while k < run:
                    if run - k >= 4:
                        for j in range(4): asphalt(d, (tx + k + j) * T, y, rnd)
                        bus_runs.append(((tx + k) * T, y)); k += 4
                    else:
                        (planter if (tx + k) in (0, cols - 1) else luggage)(d, (tx + k) * T, y, rnd); k += 1
                tx += run; continue
            if c in WALLS: g['wall'](d, x, y, rnd, WALLS[c])
            elif c == 'B': asphalt(d, x, y, rnd); g['flag'](d, x, y)
            elif c == 'o': asphalt(d, x, y, rnd)
            else: TILE.get(c, asphalt)(d, x, y, rnd)
            tx += 1
    for i, (bx, by) in enumerate(bus_runs):
        bus_h(d, bx, by, BUSC[(bx // 64 + by // 16) % len(BUSC)])
    for fn, args in objects: fn(d, *args)
    for (key, tx, ty) in sorted(people, key=lambda p: p[2]):
        spr = ECU if key == 'ecu' else sp[key]
        ox, oy = (2, 1) if key == 'ecu' else (0, -6)
        im.alpha_composite(spr, (int(tx * T + ox), int(ty * T + oy)))
    im.resize((cols * T * S, rows * T * S), Image.NEAREST).convert('RGB').save(f"{OUT}/{name}.png")

# ---- zona de la estación (hub)
HUB = [
    "RRRRRRRRRRRRRRRRRRRRRR",
    "wWwDwWwwWwDwWwwWwDwWwW",
    "vvvvvvvvvvvvvvvvvvvvvv",
    "cccccccccccccccccccvvv",
    "aaaaaaaaaaaaaaaaaaavvv",
    "aaaaaaaaaaaaaaaaaaavvv",
    "aaaaaaaaaaaaaaaaaaavvv",
    "lllllllllllllllllllvvv",
    "aaaaaaaaaaaaaaaaaaavvv",
    "aaaaaaaaaaaaaaaaaaavvv",
    "vvvvvvvvvvvvvvvvvvvvvv",
    "gfggggfgggggffggggfggg",
]
rr = random.Random(2)
hub_obj = [(bus_v, (2 * T, 4 * T, BUSC[0], rr)), (bus_v, (6 * T, 4 * T, BUSC[1], rr)), (bus_v, (10 * T, 4 * T, BUSC[2], rr)),
           (bus_v, (14 * T, 4 * T, BUSC[3], rr)), (booth, (8 * T, 1 * T + 4)),
           (lambda d, x, y: bench(d, x, y, rr), (4 * T, 10 * T)), (lambda d, x, y: bench(d, x, y, rr), (12 * T, 10 * T)),
           (sign, (5 * T, 2 * T)), (sign, (13 * T, 2 * T)), (lamp, (1 * T, 2 * T)), (lamp, (17 * T, 2 * T)),
           (g['arch'], (18 * T + 6, 4 * T)), (lambda d, x, y: luggage(d, x, y, rr), (12 * T, 9 * T))]
hub_people = [('jhon', 7.0, 8.2), ('ana', 9.0, 8.4), ('ecu', 8.2, 8.9), ('marina', 3.2, 2.0), ('julia', 9.5, 2.3), ('teofilo', 16.0, 8.4)]
render(HUB, hub_obj, hub_people, 'zona_estacion')
render(HUB, hub_obj, [p for p in hub_people if p[0] not in ('ana', 'ecu', 'teofilo')] + [('teofilo', 19.4, 6.3), ('ana_arriba', 19.4, 7.75), ('ecu', 18.4, 8.0)], 'zona_estacion_fin')

# ---- nivel 7: andenes con buses estacionados
LAB = [
    "RRRRRRRRRRRRRRRRRRRRRR",
    "#....B...............#",
    "######o###############",
    "#....................#",
    "#.nnnn......nnnn.....#",
    "#....................#",
    "###############o######",
    "#....................#",
    "#####o################",
    "#....................#",
    "#..nnnn.......nnnn...#",
    "######################",
]
lab_people = [('julia', 6, 1.6), ('marina', 15, 5.6), ('jhon', 5, 7.6), ('ana_arriba', 5, 8.75), ('ecu', 4, 9.0)]
render(LAB, [], lab_people, 'nivel_estacion')

# ------------------------------------------------------------------ bus de costado para el reto (11 asientos)
def bus_side(filled, standing, name, moving=False):
    W, H = 170, 66
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    body, dark = hx('2c6fb5'), hx('1d4f8a')
    d.rounded_rectangle([4, 6, 160, 52], radius=6, fill=body, outline=K)
    d.rectangle([6, 40, 158, 44], fill=hx('fff8ec')); d.rectangle([6, 45, 158, 47], fill=hx('7a1f3d'))
    d.rectangle([150, 12, 159, 34], fill=hx('8cc8ff'), outline=K)          # parabrisas
    d.rectangle([8, 12, 12, 36], fill=dark)                                 # puerta trasera
    rnd = random.Random(4)
    for i in range(11):
        wx = 15 + i * 12; d.rectangle([wx, 12, wx + 10, 30], fill=hx('cfe9ff'), outline=K)
        if i < filled:
            hc = hx(rnd.choice(['2b1a12', '4a2a1a', '5a2a1a', '8d93a3']))
            sh = hx(rnd.choice(['d9324a', 'f2b632', '1fa36b', 'e8572a', '7a1f3d']))
            d.rectangle([wx + 2, 24, wx + 8, 30], fill=sh)
            d.ellipse([wx + 2, 15, wx + 8, 23], fill=hx('e0a473')); d.rectangle([wx + 2, 14, wx + 8, 17], fill=hc)
    for cx in (34, 130):
        d.ellipse([cx - 9, 44, cx + 9, 62], fill=hx('1b1430')); d.ellipse([cx - 4, 49, cx + 4, 57], fill=hx('8a8f9c'))
    d.rectangle([156, 38, 160, 42], fill=hx('fff3a0'))
    for i in range(standing):   # pasajeros que no alcanzan asiento, de pie afuera
        px = 164 - 0 + 0
    if moving:
        for yy in (16, 26, 36): d.line([(0, yy), (-0, yy)], fill=K)
    im = outline(im)
    if standing:
        big = Image.new('RGBA', (W + 24, H), (0, 0, 0, 0)); big.alpha_composite(im, (0, 0))
        for i in range(standing):
            p = person(hair=['2b1a12', '5a2a1a'][i], style='short', shirt=['d9324a', 'f2b632'][i], lower='4a4f5c').resize((11, 15), Image.NEAREST)
            big.alpha_composite(p, (W - 6 + i * 11, H - 18))
        im = big
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(f"{OUT}/{name}.png")
bus_side(3, 0, 'bus_reto')        # solo los 3 pasajeros sueltos
bus_side(11, 0, 'bus_lleno')      # 2x4 + 3 = 11: lleno exacto
bus_side(11, 2, 'bus_sobran')     # 2x5 + 3 = 13: no entran 2

# ------------------------------------------------------------------ boleto y maleta (reto nivel 10)
def boleto():
    im = Image.new('RGBA', (30, 18), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([1, 1, 28, 16], fill=hx('fff8ec'), outline=K); d.rectangle([1, 1, 7, 16], fill=hx('7a1f3d'))
    for yy in (5, 9, 13): d.line([(10, yy), (25, yy)], fill=hx('8d93a3'))
    d.rectangle([20, 3, 26, 7], fill=hx('2c6fb5'))
    outline(im); im.resize((30 * 4, 18 * 4), Image.NEAREST).save(f"{OUT}/boleto.png")
def maleta():
    im = Image.new('RGBA', (24, 24), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([2, 7, 21, 22], fill=hx('e8572a'), outline=K); d.rectangle([8, 2, 15, 7], outline=K)
    d.line([(2, 13), (21, 13)], fill=hx('b8401a')); d.rectangle([10, 11, 13, 15], fill=hx('f2b632'))
    outline(im); im.resize((24 * 4, 24 * 4), Image.NEAREST).save(f"{OUT}/maleta.png")
boleto(); maleta()
print(sorted(os.listdir(OUT)))
