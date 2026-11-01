"""Genera tilesets (64 px por tile) y sprites del laberinto para Phaser, reutilizando gen_assets.py."""
import sys, os, json, random
from PIL import Image, ImageDraw
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
tmp = os.path.join(OUT, '_tmp'); 
ns = {'__name__': 'gen'}
sys.argv = ['gen_assets.py', tmp]
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen_assets.py')).read(), ns)
import shutil; shutil.rmtree(tmp)
T, S = 16, 4
# orden de tiles en cada tileset (índice = posición):
ORDER = ['suelo', 'suelo_sombra', 'muro', 'puerta_cerrada', 'puerta_activa', 'puerta_abierta', 'meta', 'cono']
for theme in ns['MAZES']:
    rnd = random.Random(7)
    im = Image.new('RGBA', (len(ORDER) * T, T), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for i, name in enumerate(ORDER):
        x = i * T
        if name == 'suelo': ns['tile_floor'](d, x, 0, theme, rnd)
        elif name == 'suelo_sombra':
            ns['tile_floor'](d, x, 0, theme, rnd)
            px = im.getpixel((x + 4, 6)); d.rectangle([x, 0, x + 15, 2], fill=tuple(int(c * .72) for c in px[:3]))
        elif name == 'muro': ns['tile_wall'](d, x, 0, theme, rnd)
        elif name == 'puerta_cerrada': ns['tile_door'](d, x, 0, theme, rnd)
        elif name == 'puerta_activa':
            ns['tile_door'](d, x, 0, theme, rnd); d.rectangle([x, 0, x + 15, 15], outline=(255, 255, 255))
        elif name == 'puerta_abierta': ns['tile_door'](d, x, 0, theme, rnd, opened=True)
        elif name == 'meta': ns['tile_goal'](d, x, 0, theme, rnd)
        elif name == 'cono':
            ns['tile_floor'](d, x, 0, theme, rnd); ns['tile_cone'](d, x, 0)
    im.resize((im.width * S, T * S), Image.NEAREST).save(f"{OUT}/tiles_{theme}.png")
# personaje dentro del laberinto (14x18 px -> x4)
spr = ns['sprite'](ns['MASCOT']).resize((14, 18), Image.NEAREST)
spr.resize((14 * S, 18 * S), Image.NEAREST).save(f"{OUT}/ecu_laberinto.png")
# laberintos de ejemplo (los mismos de los diseños) como referencia
json.dump({'leyenda': {'W': 'muro', '.': 'suelo', 'P': 'inicio del personaje', 'D': 'puerta (reto)', 'A': 'puerta activa',
           'O': 'puerta abierta', 'G': 'meta/bandera', 'C': 'cono (decoración, se puede pisar)'},
           'tile_px': T * S, 'orden_tiles': ORDER, 'mapas': ns['MAZES']},
          open(f"{OUT}/laberintos_diseno.json", 'w'), ensure_ascii=False, indent=1)
print(sorted(os.listdir(OUT)))
