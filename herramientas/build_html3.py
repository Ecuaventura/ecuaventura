"""Plantillas del Mundo 3 (Puerto) en mapa abierto."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'build_html.py')).read(); ns = {}
exec(src[:src.index('out = {}')], ns)
D = sys.argv[1]; HT = os.path.join(D, 'diseno', 'html', 'mundo3'); os.makedirs(HT, exist_ok=True)
IMG = '../../../public/assets/img/mundo3/'; ns['IMG'] = IMG; IMG0 = ns['IMG0']
page, vecinos, dialog, resp = ns['page'], ns['vecinos'], ns['dialog'], ns['resp']
OBJ = ['remo', 'linterna', 'llave', 'mapa']

def inv(tengo, nuevo=None):
    cells = ''
    for o in OBJ:
        on = o in tengo
        glow = 'box-shadow:0 0 0 3px #f2b632;' if o == nuevo else ''
        cells += f'<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:{"#fff8ec" if on else "#4e1027"};border:3px solid #1b1430;{glow}"><img src="{IMG}obj_{o}.png" style="width:36px;image-rendering:pixelated;{"" if on else "filter:brightness(0) opacity(.35)"}"></div>'
    return f'<div style="display:flex;flex-direction:column;gap:4px"><span style="font-size:14px;font-weight:800;color:#ffe9b8">OBJETOS</span><div style="display:flex;gap:6px">{cells}</div></div>'

def hud(mision, tengo, nuevo=None, nivel=None):
    sub = f'<span class="px" style="font-size:13px;color:#f2b632">{nivel}</span>' if nivel else ''
    return f"""<div class="hud" style="height:84px">
<div class="chip"><img src="{IMG}sprite_ana.png" style="width:30px;image-rendering:pixelated">Ana</div>
<div style="display:flex;flex-direction:column;gap:6px;max-width:440px"><span class="px" style="font-size:14px;color:#f2b632">MUNDO 3 · PUERTO</span><span style="font-size:17px;font-weight:800;color:#fff">{mision}</span></div>
{inv(tengo, nuevo)}
<div style="margin-left:auto;display:flex;gap:10px;align-items:center">{sub}<div class="stat"><b>ESTRELLAS</b><span style="color:#f2b632">2 / 15</span></div>
<span class="btn">MAPA <span style="font-family:Nunito;font-size:14px;margin-left:6px">(M)</span></span><span class="btn" style="width:48px;padding:0">?</span><span class="btn">SALIR</span></div></div>"""

def hudreto(nivel, sub, ptos='0000', racha=None):
    return ns['hud'](nivel, vecinos(0, 1).replace('Vecinos ayudados', 'Reto'), ptos=ptos, racha=racha, sub=sub)

out = {}
X2 = lambda tx: round(tx * 32 - 21); Y2 = lambda ty: round(ty * 32)
def mark(tx, ty, n, estado, txt):
    col = {'ok': '#157a4f', 'nuevo': '#f2b632', 'lock': '#4e1027'}[estado]
    fg = '#1b1430' if estado == 'nuevo' else '#fff'
    ic = f'<img src="{IMG0}candado.png" style="width:20px;image-rendering:pixelated">' if estado == 'lock' else ('★' if estado == 'ok' else '!')
    return (f'<div style="position:absolute;left:{X2(tx)}px;top:{Y2(ty)}px;transform:translate(-50%,-100%);display:flex;align-items:center;gap:6px;padding:5px 9px;background:{col};color:{fg};'
            f'border:3px solid #1b1430;box-shadow:0 4px 0 #1b1430;font-weight:900;font-size:16px;white-space:nowrap"><span class="px" style="font-size:13px">{n}</span>{ic} {txt}</div>')
def row(n, nombre, estado, obj, nota):
    col = {'ok': '#157a4f', 'nuevo': '#f2b632', 'lock': '#8d93a3'}[estado]
    o = f'<img src="{IMG}obj_{obj}.png" style="width:30px;image-rendering:pixelated;{"" if estado != "lock" else "filter:grayscale(1) opacity(.6)"}">' if obj else '<span style="width:30px"></span>'
    return (f'<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430;border-left:10px solid {col}">'
            f'<span class="px" style="font-size:13px;width:30px">{n}</span>{o}<div style="display:flex;flex-direction:column"><b style="font-size:17px">{nombre}</b><span style="font-size:15px;font-weight:700;color:#4e1027">{nota}</span></div></div>')

# ---------------------------------------------------------------- 31 mapa
m = f"""<img class="mapa" src="{IMG}mapa_puerto.png"><div class="dim" style="background:rgba(27,20,48,.25)"></div>
<div class="hud" style="height:64px"><span class="px" style="font-size:16px;color:#f2b632">MAPA DEL PUERTO</span><span style="font-size:17px;font-weight:800;color:#ffe9b8">Explora libremente: entra a casas y cuevas, busca objetos y habla con los vecinos</span>
<span class="btn" style="margin-left:auto">CERRAR (M)</span></div>
{mark(20, 16.6, 11, 'ok', 'Muelle')}{mark(30.3, 12.8, 12, 'nuevo', 'El bote de Don Pancho')}{mark(6.2, 6.6, 13, 'lock', 'Cueva de la playa')}
{mark(27.5, 10.6, 14, 'lock', 'Almacén de Doña Elena')}{mark(40.2, 4.0, 15, 'lock', 'RETO · Faro')}
<div class="tag yo" style="left:{X2(29.5)+16}px;top:{Y2(13.4)+30}px">Tú</div>
<div style="position:absolute;left:{X2(31.2)}px;top:{Y2(15.4)-6}px;width:44px;height:44px;border:4px dashed #f2b632;border-radius:50%"></div>
<section style="position:absolute;left:14px;bottom:14px;width:390px;padding:12px;display:flex;flex-direction:column;gap:7px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 3px #f2b632,0 6px 0 #1b1430">
<span class="px" style="font-size:13px;color:#f2b632">MISIONES</span>
{row(11, 'Ayuda a Don Pancho', 'ok', None, 'Completada · 2 estrellas')}
{row(12, 'Equilibra el bote', 'nuevo', 'remo', 'Encuentra el REMO en la playa')}
{row(13, 'El cofre de la cueva', 'lock', 'linterna', 'Necesitas una LINTERNA')}
{row(14, 'El almacén cerrado', 'lock', 'llave', 'Necesitas la LLAVE')}
{row(15, 'RETO: El faro', 'lock', 'mapa', 'Necesitas el MAPA del faro')}</section>"""
out['31_m3_mapa_puerto'] = ('EcuAventura – Mapa del Puerto', m)

# ---------------------------------------------------------------- 32 explorar
X4 = lambda tx: round((tx - 19.25) * 64 - 21); Y4 = lambda ty: round((ty - 8) * 64)
e = f"""<img class="mapa" src="{IMG}explorar_puerto.png">
{hud('Misión 12: busca el remo de Don Pancho', [])}
<div style="position:absolute;left:{X4(31.2)-14}px;top:{Y4(15.4)-14}px;width:76px;height:76px;border-radius:50%;background:radial-gradient(rgba(255,243,160,.75),rgba(255,243,160,0) 70%)"></div>
<div class="bang" style="left:{X4(31.2)+24}px;top:{Y4(15.4)-62}px;color:#c98a14">✦</div>
<div class="tag yo" style="left:{X4(30)+32}px;top:{Y4(14.6)-64}px">Ana</div>
<div style="position:absolute;left:{X4(31.2)+70}px;top:{Y4(15.4)+10}px;padding:10px 14px;background:#fff8ec;color:#1b1430;border:4px solid #1b1430;box-shadow:0 5px 0 #1b1430;font-size:19px;font-weight:900"><span class="key" style="margin-right:8px">ESPACIO</span>Recoger</div>
<div class="tag" style="left:{X4(27.5)+32}px;top:{Y4(12.6)+84}px;font-size:16px">Doña Elena</div>
<div class="tag" style="left:{X4(20)+70}px;top:{Y4(16.2)-44}px;font-size:16px">Don Pancho</div>
<div class="hint"><span><span class="key">FLECHAS</span> moverte</span><span><span class="key">ESPACIO</span> hablar / recoger / entrar</span><span><span class="key">M</span> mapa</span><span>Los objetos brillan <b style="color:#f2b632">✦</b></span></div>"""
out['32_m3_explorar'] = ('EcuAventura – Explorar el Puerto', e)

# ---------------------------------------------------------------- 33 objeto encontrado
o = f"""<img class="mapa" src="{IMG}explorar_puerto.png"><div class="dim"></div>
{hud('Misión 12: lleva el remo a Don Pancho', ['remo'], 'remo')}
<section style="position:absolute;left:383px;top:150px;width:600px;padding:26px 30px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<span class="px" style="font-size:20px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡ENCONTRASTE UN OBJETO!</span>
<div style="width:170px;height:170px;display:flex;align-items:center;justify-content:center;background:radial-gradient(#fff3a0,#f2b632 55%,#c98a14);border:4px solid #1b1430"><img src="{IMG}obj_remo.png" style="width:130px;image-rendering:pixelated"></div>
<span class="px" style="font-size:18px">REMO</span>
<span style="font-size:21px;font-weight:800;text-align:center;line-height:1.4">Don Pancho lo perdió en la playa. Llévaselo al <b style="color:#f2b632">muelle</b> para que pueda sacar su bote.</span>
<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:#157a4f;border:3px solid #1b1430;font-size:18px;font-weight:900">Misión 12 desbloqueada · Guardado</div>
<span class="btn oro" style="width:260px;height:56px;font-size:14px">CONTINUAR ▶</span></section>"""
out['33_m3_objeto_encontrado'] = ('EcuAventura – Objeto encontrado', o)

# ---------------------------------------------------------------- 34 cueva: cofre con candado (nivel 13)
cav = f"""<img class="mapa" src="{IMG}cueva_interior.png">
<div style="position:absolute;inset:0;background:radial-gradient(circle at {14*64-21+32}px 260px,rgba(27,20,48,0) 140px,rgba(27,20,48,.92) 420px)"></div>
<div class="dim" style="background:rgba(27,20,48,.35)"></div>
{hudreto('NIVEL 13', 'Mundo 3 · Cueva de la playa · x en ambos lados')}
<div class="panel" style="background:#2e2a38;color:#fff"><span class="ptitle" style="background:#5a3a22">COFRE CON CANDADO</span>
<img src="{IMG}retrato_cofre.png" style="position:absolute;left:40px;top:80px;width:200px;image-rendering:pixelated">
<div style="position:absolute;left:280px;top:70px;display:flex;flex-direction:column;gap:14px">
<span style="font-size:20px;font-weight:800;color:#ffe9b8">Grabado en la tapa del cofre:</span>
<div class="eq" style="position:static;color:#1b1430">3x + 4 = x − 6</div>
<span style="font-size:19px;font-weight:800;line-height:1.4">El número que abre el candado es el valor de <b style="color:#f2b632">x</b>.<br>Ojo: ¡puede ser negativo!</span>
<div style="display:flex;gap:8px">{''.join('<span style="width:52px;height:60px;display:flex;align-items:center;justify-content:center;background:#1b1430;border:3px solid #f2b632;font-family:Press Start 2P;font-size:22px;color:#f2b632">?</span>' for _ in range(2))}</div></div></div>
{dialog(IMG + 'retrato_cofre.png', 'COFRE', '<span><b style="color:#7a1f3d">Ecu:</b> ¡Con la linterna ya se ve todo! Aquí hay un cofre viejo… y en la tapa hay una ecuación.</span><span style="color:#7a1f3d">¿Qué número abre el candado?</span><span style="font-size:18px;color:#4e1027;font-weight:700">Dentro está la LLAVE del almacén de Doña Elena.</span>', resp())}"""
out['34_m3_cueva_cofre'] = ('EcuAventura – Cofre de la cueva', cav)

# ---------------------------------------------------------------- 35 reto del bote (nivel 12)
def bote_panel(img, cx, extra=''):
    k = lambda x, y, t, c='#7a1f3d': f'<span class="k" style="left:{x}px;top:{y}px;color:{c}">{t}</span>'
    return f"""<div class="panel" style="background:#cfe9ff;overflow:hidden"><span class="ptitle">EL BOTE DE DON PANCHO</span>
<img src="{IMG}{img}" style="position:absolute;left:120px;top:30px;width:560px;image-rendering:pixelated">
{k(227, 118, cx[0])}{k(283, 118, cx[1])}{k(350, 112, '3 kg', '#2c3e7a')}{k(470, 118, cx[2])}{k(549, 112, '8 kg', '#5a3a22')}{extra}</div>"""
pancho = f'{IMG}retrato_pancho.png'
leyenda = '<span style="position:absolute;left:20px;bottom:16px;padding:6px 10px;background:#fff8ec;border:3px solid #1b1430;font-size:17px;font-weight:800;color:#4e1027">Cada caja pesa <b>x</b> kg · lado izquierdo = lado derecho</span>'
t35 = """<span><b style="color:#7a1f3d">¡Gracias por el remo, Ana!</b> Para que mi bote no se voltee, los dos lados deben pesar igual.</span>
<span>A la izquierda hay <b>2 cajas y 3 kg de pescado</b>; a la derecha, <b>1 caja y una red de 8 kg</b>.</span><span style="color:#7a1f3d">¿Cuántos kilos pesa cada caja?</span>"""
r = f"""<img class="mapa" src="{IMG}explorar_puerto.png"><div class="dim"></div>
{hudreto('NIVEL 12', 'Mundo 3 · Puerto · x en ambos lados')}
{bote_panel('bote_equilibrado.png', ['x', 'x', 'x'], leyenda + '<div class="eq" style="font-size:36px;right:18px;bottom:14px">2x + 3 = x + 8</div>')}
{dialog(pancho, 'DON PANCHO', t35, resp())}"""
out['35_m3_reto_bote'] = ('EcuAventura – Reto del bote', r)

# ---------------------------------------------------------------- 36 error + pista del bote
t36 = """<span class="px" style="font-size:14px;color:#2c3e7a">PISTA DE ECU · -50 PTS</span>
<span>Con 3: izquierda <b>2 × 3 + 3 = 9</b> kg, derecha <b>3 + 8 = 11</b> kg. ¡El bote se inclina!</span>
<span>Truco: quita <b>1 caja</b> de cada lado (el bote sigue igual). ¿Qué queda a cada lado?</span>"""
er = f"""<img class="mapa" src="{IMG}explorar_puerto.png"><div class="dim"></div>
{hudreto('NIVEL 12', 'Mundo 3 · Puerto · x en ambos lados')}
{bote_panel('bote_inclinado.png', ['3', '3', '3'], '<div class="eq" style="font-size:34px;right:18px;bottom:14px;border-color:#e8572a;color:#b8401a">9 ≠ 11</div>')}
<div class="banner" style="top:88px;background:#b8401a">¡CASI! EL BOTE SE INCLINA</div>
{dialog(IMG0 + 'mascota.png', 'ECU', t36, resp('3', 'mal'))}"""
out['36_m3_error_pista'] = ('EcuAventura – Pista del bote', er)

# ---------------------------------------------------------------- 37 reto del mundo: el faro (nivel 15)
XF = lambda tx: round((tx - 22) * 64 - 21); YF = lambda ty: round(ty * 64)
box = lambda t, s='': f'<div style="padding:8px 14px;background:#fff;border:4px solid #1b1430;font-size:28px;font-weight:900;{s}">{t}</div>'
t37 = """<span><b style="color:#7a1f3d">¡Ana, último reto del Puerto!</b> Yo tengo <b>S/ 20</b> y ahorro <b>S/ 5</b> cada día. Mi nieto Mateo tiene <b>S/ 2</b> y ahorra <b>S/ 8</b> cada día.</span>
<span style="color:#7a1f3d">¿En cuántos días tendremos la misma cantidad?</span>
<span style="display:flex;gap:10px;flex-wrap:wrap;font-size:17px"><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">1. Plantea la ecuación</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">2. Resuélvela</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">3. Escribe solo el número</span></span>"""
w = f"""<img class="mapa" src="{IMG}faro_puerto.png"><div class="dim"></div>
{hudreto('NIVEL 15 · RETO', 'Mundo 3 · Faro · vida real', ptos='0200', racha=2)}
<div class="panel"><span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>
<div style="position:absolute;left:30px;right:30px;top:62px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;background:#fff8ec;border:3px solid #1b1430"><img src="{IMG}sprite_ernesto.png" style="width:48px;image-rendering:pixelated"><b style="font-size:18px">Don Ernesto</b>{box('20 + 5x')}</div>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;background:#fff8ec;border:3px solid #1b1430"><img src="{IMG}sprite_mateo.png" style="width:48px;image-rendering:pixelated"><b style="font-size:18px">Mateo</b>{box('2 + 8x')}</div></div>
<div style="position:absolute;left:30px;bottom:20px;right:30px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:18px;font-weight:800;color:#4e1027">x = número de días</span>
<span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">MISION FINAL</span></div></div>
<div style="position:absolute;left:1098px;top:100px;width:250px;padding:12px;background:#4e1027;border:3px solid #1b1430;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3">
<img src="{IMG}obj_mapa.png" style="width:50px;image-rendering:pixelated">Le entregaste el mapa del faro</div>
{dialog(IMG + 'retrato_ernesto.png', 'DON ERNESTO', t37, resp())}"""
out['37_m3_reto_faro'] = ('EcuAventura – Reto del faro', w)

for k, (t, b) in out.items():
    open(os.path.join(HT, k + '.html'), 'w').write(page(t, b))
print(list(out))
