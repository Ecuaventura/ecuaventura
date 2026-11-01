"""Construye las 8 plantillas HTML del Mundo 1 (1366x768)."""
import os, sys
D = sys.argv[1]
HT = os.path.join(D, 'diseno', 'html', 'mundo1'); os.makedirs(HT, exist_ok=True)
IMG = '../../../public/assets/img/mundo1/'
IMG0 = '../../../public/assets/img/'
FON = '../../../public/assets/fonts/'
X = lambda tx: round(tx * 64 - 21)   # tile -> px en pantalla (mapa de 1408 px centrado)
Y = lambda ty: round(ty * 64)

CSS = f"""
@font-face{{font-family:'Press Start 2P';src:url('{FON}PressStart2P-Regular.ttf');}}
@font-face{{font-family:'Nunito';src:url('{FON}Nunito-Variable.ttf');font-weight:200 1000;}}
*{{box-sizing:border-box}} body{{margin:0;background:#1b1430}}
.pant{{position:relative;width:1366px;height:768px;overflow:hidden;font-family:'Nunito',sans-serif;color:#fff;background:#2a1d33}}
.mapa{{position:absolute;left:-21px;top:0;width:1408px;height:768px;image-rendering:pixelated}}
.px{{font-family:'Press Start 2P',monospace}}
.dim{{position:absolute;inset:0;background:rgba(27,20,48,.55)}}
.hud{{position:absolute;left:0;top:0;width:1366px;height:72px;padding:0 16px;display:flex;align-items:center;gap:18px;background:#7a1f3d;border-bottom:4px solid #1b1430;box-shadow:inset 0 -4px 0 #f2b632}}
.chip{{display:flex;align-items:center;gap:10px;height:46px;padding:0 14px;background:#fff8ec;color:#1b1430;border:4px solid #1b1430;font-weight:900;font-size:19px}}
.stat{{display:flex;flex-direction:column;align-items:flex-end;gap:5px;padding:5px 12px;background:#4e1027;border:3px solid #1b1430}}
.stat b{{font-size:14px;font-weight:800;color:#ffe9b8}} .stat span{{font-family:'Press Start 2P';font-size:16px}}
.btn{{display:flex;align-items:center;justify-content:center;height:48px;padding:0 14px;background:#7a1f3d;color:#fff;border:4px solid #1b1430;box-shadow:inset -4px -4px 0 #4e1027,inset 4px 4px 0 #a8345a,0 5px 0 #1b1430;font-family:'Press Start 2P';font-size:12px}}
.btn.oro{{background:#f2b632;color:#1b1430;box-shadow:inset -4px -4px 0 #c98a14,inset 4px 4px 0 #ffd877,0 6px 0 #1b1430}}
.btn.verde{{background:#157a4f;box-shadow:inset -4px -4px 0 #0e5a3a,inset 4px 4px 0 #2ea06c,0 6px 0 #1b1430}}
.btn.azul{{background:#2c3e7a;box-shadow:inset -4px -4px 0 #1d2b58,inset 4px 4px 0 #4a5fa3,0 5px 0 #1b1430}}
.tag{{position:absolute;transform:translateX(-50%);padding:4px 10px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430;font-weight:900;font-size:17px;white-space:nowrap}}
.tag.yo{{background:#f2b632}}
.bang{{position:absolute;transform:translateX(-50%);width:40px;height:44px;display:flex;align-items:center;justify-content:center;background:#fff;border:4px solid #1b1430;font-family:'Press Start 2P';font-size:20px;color:#d9324a;box-shadow:0 4px 0 #1b1430}}
.badge{{position:absolute;display:flex;align-items:center;gap:8px;padding:6px 10px;border:4px solid #1b1430;box-shadow:0 5px 0 #1b1430;font-weight:900;font-size:16px}}
.badge .n{{font-family:'Press Start 2P';font-size:16px}}
.dlg{{position:absolute;left:16px;top:470px;width:1334px;height:282px;display:flex;gap:20px;padding:18px 22px;background:#fff8ec;color:#1b1430;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #7a1f3d,inset 0 0 0 8px #fff8ec,inset 0 0 0 11px #f2b632,0 6px 0 #1b1430}}
.ret{{flex:none;width:170px;display:flex;flex-direction:column;align-items:center;gap:8px}}
.ret .fr{{width:150px;height:186px;background:#efe4cc;border:4px solid #1b1430;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}}
.ret .fr img{{width:116px;margin-bottom:4px;image-rendering:pixelated}}
.ret .nm{{padding:5px 10px;background:#7a1f3d;color:#fff;border:3px solid #1b1430;font-family:'Press Start 2P';font-size:11px;white-space:nowrap}}
.txt{{flex:1;display:flex;flex-direction:column;gap:12px;font-size:25px;font-weight:800;line-height:1.38}}
.resp{{flex:none;width:300px;display:flex;flex-direction:column;justify-content:center;gap:14px;padding-left:20px;border-left:4px dashed #d8c9a8}}
.inp{{width:150px;height:72px;text-align:center;background:#fff;border:4px solid #1b1430;box-shadow:inset 4px 4px 0 #e6dccb;font-size:40px;font-weight:900;color:#1b1430;display:flex;align-items:center;justify-content:center}}
.panel{{position:absolute;left:283px;top:92px;width:800px;height:360px;background:#fdf3df;color:#1b1430;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430}}
.ptitle{{position:absolute;left:-4px;top:-4px;padding:8px 14px;background:#7a1f3d;color:#fff;border:4px solid #1b1430;font-family:'Press Start 2P';font-size:12px}}
.eq{{position:absolute;padding:6px 18px;background:#fff;border:4px solid #1b1430;font-size:44px;font-weight:900;letter-spacing:1px}}
.k{{position:absolute;transform:translate(-50%,-50%);min-width:38px;padding:3px 7px;text-align:center;background:#fff8ec;border:3px solid #1b1430;font-size:20px;font-weight:900;color:#7a1f3d}}
.banner{{position:absolute;left:50%;transform:translateX(-50%);padding:10px 20px;border:4px solid #1b1430;box-shadow:0 5px 0 #1b1430;font-family:'Press Start 2P';font-size:16px;white-space:nowrap}}
.conf{{position:absolute;width:12px;height:12px}}
.hint{{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:18px;align-items:center;padding:10px 18px;background:rgba(27,20,48,.88);border:3px solid #f2b632;font-size:18px;font-weight:800;white-space:nowrap}}
.key{{display:inline-block;padding:3px 8px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430;box-shadow:0 3px 0 #1b1430;font-family:'Press Start 2P';font-size:11px}}
"""

def page(title, body):
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{title}</title>
<style>{CSS}</style></head><body><div class="pant">{body}</div></body></html>"""

def hud(nivel, extra, ptos='0000', tiempo='00:42', racha=None, sub='Mundo 1 · Mercado · ax = b'):
    r = f'<div class="stat"><b>RACHA</b><span style="color:#ff9f43">x{racha}</span></div>' if racha else ''
    return f"""<div class="hud">
<div class="chip"><img src="{IMG}sprite_ana.png" style="width:30px;image-rendering:pixelated">Ana</div>
<div style="display:flex;flex-direction:column;gap:6px;white-space:nowrap"><span style="font-size:16px;font-weight:800;color:#ffe9b8">{sub}</span><span class="px" style="font-size:15px;color:#f2b632">{nivel}</span></div>
{extra}
<div style="margin-left:auto;display:flex;gap:10px;align-items:center">{r}
<div class="stat"><b>PUNTAJE</b><span style="color:#f2b632">{ptos}</span></div>
<div class="stat"><b>TIEMPO</b><span>{tiempo}</span></div>
<span class="btn" style="width:48px;padding:0">?</span><span class="btn">REINICIAR</span><span class="btn">SALIR</span></div></div>"""

def vecinos(n, total=3):
    w = int(n / total * 100)
    return f"""<div style="display:flex;flex-direction:column;gap:6px;width:230px;margin-left:10px"><span style="font-size:16px;font-weight:800">Vecinos ayudados {n} de {total}</span>
<div style="height:14px;background:#4e1027;border:3px solid #1b1430"><div style="width:{max(w,3)}%;height:100%;background:#1fa36b"></div></div></div>"""

def dialog(ret, nombre, texto, resp):
    return f"""<div class="dlg"><div class="ret"><div class="fr"><img src="{ret}"></div><span class="nm">{nombre}</span></div>
<div class="txt">{texto}</div>{resp}</div>"""

def resp(val='', estado='', boton=True, pista=True):
    st = {'': '', 'ok': 'background:#e3f6ea;border-color:#157a4f;color:#0e5a3a;box-shadow:0 0 0 4px #1b1430',
          'mal': 'background:#fde8df;border-color:#e8572a;color:#8a2c0e;box-shadow:0 0 0 4px #1b1430'}[estado]
    pb = '<span class="btn azul" style="height:50px;font-size:12px">? PISTA <span style="font-family:Nunito;font-size:15px;font-weight:800;color:#ffe9b8;margin-left:8px">−50 pts</span></span>' if pista else ''
    v = val or '<span style="width:4px;height:44px;background:#1b1430;display:block"></span>'
    b = '<span class="btn verde" style="height:58px;font-size:14px">COMPROBAR ↵</span>' if boton else '<span class="px" style="font-size:12px;color:#7a1f3d">ESPACIO ▼ continuar</span>'
    return f"""<div class="resp"><div style="display:flex;align-items:center;gap:14px"><span class="px" style="font-size:22px">x =</span><div class="inp" style="{st}">{v}</div></div>{b}
{pb}</div>"""

out = {}
# ---------------------------------------------------------------- 1. zona del mercado
def stars(n):
    return ''.join(f'<img src="{IMG0}{"estrella" if i < n else "estrella_off"}.png" style="width:26px;image-rendering:pixelated">' for i in range(3))
z = f"""<img class="mapa" src="{IMG}zona_mercado.png">
<div class="hud" style="height:72px"><div class="chip"><img src="{IMG}sprite_ana.png" style="width:30px;image-rendering:pixelated">Ana</div>
<div style="display:flex;flex-direction:column;gap:6px"><span class="px" style="font-size:15px;color:#f2b632">MUNDO 1 · MERCADO</span><span style="font-size:16px;font-weight:800;color:#ffe9b8">Ayuda a los vecinos para abrir la salida</span></div>
<div style="margin-left:auto;display:flex;gap:10px;align-items:center"><div class="stat"><b>ESTRELLAS</b><span style="color:#f2b632">5 / 15</span></div>
<span class="btn">NIVELES</span><span class="btn" style="width:48px;padding:0">?</span><span class="btn">SALIR</span></div></div>
<div class="badge" style="left:{X(1.6)}px;top:92px;background:#157a4f">
<span class="n">1</span>{stars(3)}</div>
<div class="badge" style="left:{X(1.6)}px;top:412px;background:#157a4f"><span class="n">2</span>{stars(2)}</div>
<div class="badge" style="left:{X(14.2)}px;top:92px;background:#f2b632;color:#1b1430;box-shadow:0 0 0 4px #fff,0 5px 0 4px #1b1430"><span class="n">3</span>¡NUEVO NIVEL!</div>
<div class="badge" style="left:{X(14.2)}px;top:412px;background:#4e1027;color:#ffe9b8"><img src="{IMG0}candado.png" style="width:26px;image-rendering:pixelated"><span class="n" style="color:#fff">4</span><span style="font-size:16px">Primero ayuda a Doña Rosa</span></div>
<div class="badge" style="left:{X(18.1)}px;top:528px;background:#4e1027;color:#ffe9b8;flex-direction:column;align-items:flex-start;gap:4px"><span style="display:flex;gap:8px;align-items:center"><img src="{IMG0}candado.png" style="width:26px;image-rendering:pixelated"><span class="n" style="color:#f2b632">5 RETO</span></span><span style="font-size:16px">Salida del mercado</span></div>
<img src="{IMG}condor_posado.png" style="position:absolute;left:{X(19.4)}px;top:{Y(4)-60}px;width:88px;image-rendering:pixelated">
<div class="bang" style="left:{X(15.5)+32}px;top:{Y(4.2)-84}px">!</div>
<div class="tag yo" style="left:{X(13)+32}px;top:{Y(5.4)-62}px">Ana</div>
<div class="tag" style="left:{X(15.5)+32}px;top:{Y(4.2)+86}px;font-size:16px">Doña Rosa</div>
<div class="hint"><span><span class="key">FLECHAS</span> o <span class="key">WASD</span> moverte</span><span><span class="key">ESPACIO</span> hablar con un vecino</span><span>Los puestos con <b style="color:#f2b632">!</b> tienen un reto</span></div>"""
out['11_m1_zona_mercado'] = ('EcuAventura – Zona del Mercado', z)

# ---------------------------------------------------------------- 2. laberinto del nivel
n = f"""<img class="mapa" src="{IMG}nivel_mercado.png">
{hud('NIVEL 3', vecinos(0))}
<div class="bang" style="left:{X(12)+32}px;top:{Y(7.6)-62}px">!</div>
<div class="tag" style="left:{X(12)-70}px;top:{Y(7.6)+10}px;font-size:16px">Doña Rosa</div>
<div class="bang" style="left:{X(6)+32}px;top:{Y(5.6)-62}px;color:#8d93a3">…</div>
<div class="tag yo" style="left:{X(12)+32}px;top:{Y(8.75)+70}px">Ana</div>
<div style="position:absolute;left:{X(12)+110}px;top:{Y(8.4)}px;padding:10px 14px;background:#fff8ec;color:#1b1430;border:4px solid #1b1430;box-shadow:0 5px 0 #1b1430;font-size:19px;font-weight:900"><span class="key" style="margin-right:8px">ESPACIO</span>Hablar</div>
<div class="hint"><span>Cada vecino bloquea un pasillo. Ayúdalo y te dejará pasar hasta la <b style="color:#f2b632">bandera</b>.</span></div>"""
out['12_m1_nivel_laberinto'] = ('EcuAventura – Nivel del Mercado', n)

# ---------------------------------------------------------------- 3-5. reto de la balanza
def balanza_panel(img, sacos, pesas='12 kg', tilt=0, extra=''):
    # posiciones de etiquetas sobre la balanza (escala 4, origen del panel 100,40)
    bx, by = 100, 46
    ks = ''.join(f'<span class="k" style="left:{bx + cx}px;top:{by + 146 - tilt * 4}px">{sacos}</span>' for cx in (50, 102, 154))
    kp = f'<span class="k" style="left:{bx + 508}px;top:{by + 208 + tilt * 4}px;font-size:19px">{pesas}</span>'
    return f"""<div class="panel"><span class="ptitle">BALANZA DE DOÑA ROSA</span>
<img src="{IMG}{img}" style="position:absolute;left:{bx}px;top:{by}px;width:600px;image-rendering:pixelated">{ks}{kp}{extra}</div>"""

rosa = f'{IMG}retrato_dona_rosa.png'
t3 = """<span><b style="color:#7a1f3d">¡Hola, Ana!</b> Puse <b>3 sacos iguales de papa</b> en mi balanza y entre todos pesan <b>12 kg</b>.</span>
<span style="color:#7a1f3d">¿Cuántos kilos pesa cada saco?</span><span style="font-size:18px;color:#4e1027;font-weight:700">Escribe tu respuesta y presiona Enter o COMPROBAR.</span>"""
r = f"""<img class="mapa" src="{IMG}nivel_mercado.png"><div class="dim"></div>
{hud('NIVEL 3', vecinos(0))}
{balanza_panel('balanza_equilibrada.png', 'x', extra='<div class="eq" style="right:22px;top:22px">3x = 12</div><span style="position:absolute;left:24px;bottom:22px;font-size:17px;font-weight:800;color:#4e1027">Cada saco pesa <b>x</b> kg</span>')}
{dialog(rosa, 'DOÑA ROSA', t3, resp())}"""
out['13_m1_reto_balanza'] = ('EcuAventura – Reto de la balanza', r)

conf = ''.join(f'<span class="conf" style="left:{x}px;top:{y}px;background:{c};transform:rotate({a}deg)"></span>'
               for x, y, c, a in [(300, 120, '#f2b632', 20), (330, 200, '#1fa36b', 45), (270, 300, '#d9406a', 10), (1050, 130, '#1fa36b', 30),
                                  (1090, 230, '#f2b632', 60), (1060, 330, '#2c6fb5', 15), (560, 104, '#d9406a', 40), (820, 110, '#2c6fb5', 0),
                                  (700, 96, '#f2b632', 25), (440, 430, '#1fa36b', 50), (930, 430, '#f2b632', 35)])
t4 = """<span><b style="color:#157a4f">¡Gracias, Ana!</b> Cada saco pesa <b>4 kg</b>: 3 × 4 = 12. ¡La balanza quedó perfecta!</span>
<span>Pasa nomás, te dejo el camino libre. Más allá está <b>Don Lucho</b>, creo que también necesita ayuda.</span>"""
c = f"""<img class="mapa" src="{IMG}nivel_mercado.png"><div class="dim"></div>
{hud('NIVEL 3', vecinos(1), ptos='0100', racha=2)}
{balanza_panel('balanza_equilibrada.png', '4', extra='<div class="eq" style="right:22px;top:22px;border-color:#157a4f;color:#157a4f">3 × 4 = 12 ✔</div>')}
<div class="banner" style="top:74px;background:#157a4f">¡CORRECTO!</div>
<div style="position:absolute;left:400px;top:150px;font-family:'Press Start 2P';font-size:30px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">+100</div>
<img src="{IMG0}mascota_feliz.png" style="position:absolute;left:1100px;top:250px;width:90px;image-rendering:pixelated">
{conf}
{dialog(rosa, 'DOÑA ROSA', t4, resp('4', 'ok', boton=False, pista=False))}"""
out['14_m1_correcto'] = ('EcuAventura – ¡Correcto!', c)

t5 = """<span class="px" style="font-size:14px;color:#2c3e7a">PISTA DE ECU · -50 PTS</span>
<span>Mira la balanza: <b>3 × 3 = 9</b>, y las pesas marcan <b>12</b>. Los sacos quedaron livianos.</span>
<span>Reparte los <b>12 kg</b> entre los <b>3 sacos</b>: ¿cuántos kilos le tocan a cada uno?</span>
<span style="font-size:18px;color:#4e1027;font-weight:700">La pista no te da el resultado: ¡tú puedes!</span>"""
e = f"""<img class="mapa" src="{IMG}nivel_mercado.png"><div class="dim"></div>
{hud('NIVEL 3', vecinos(0))}
{balanza_panel('balanza_inclinada.png', '3', tilt=6, extra='<div class="eq" style="right:22px;top:22px;border-color:#e8572a;color:#b8401a">3 × 3 = 9 ≠ 12</div>')}
<div class="banner" style="top:74px;background:#b8401a">¡CASI! LA BALANZA SE INCLINA</div>
<div style="position:absolute;left:1100px;top:120px;width:220px;padding:12px;background:#4e1027;border:3px solid #1b1430;font-size:17px;font-weight:800;line-height:1.35"><span class="px" style="font-size:11px;color:#f2b632">INTENTOS</span><br>3 en este reto<br>Ecu te ofrece una pista</div>
{dialog(IMG0 + 'mascota.png', 'ECU', t5, resp('3', 'mal'))}"""
out['15_m1_error_pista'] = ('EcuAventura – Pista de Ecu', e)

# ---------------------------------------------------------------- 6. reto del mundo (nivel 5)
lucho = f'{IMG}retrato_don_lucho.png'
t6 = """<span><b style="color:#7a1f3d">¡Ana, último reto del mercado!</b> Hoy salí con <b>x soles</b>. Compré choclos por <b>S/ 15</b> y me quedaron <b>S/ 23</b>.</span>
<span style="color:#7a1f3d">¿Con cuántos soles salí de casa?</span>
<span style="display:flex;gap:10px;flex-wrap:wrap;font-size:17px"><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">1. Plantea la ecuación</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">2. Resuélvela</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">3. Escribe solo el número</span></span>"""
coin = lambda: f'<img src="{IMG}monedero.png" style="width:150px;image-rendering:pixelated">'
box = lambda t, s='': f'<div style="padding:10px 16px;background:#fff;border:4px solid #1b1430;font-size:34px;font-weight:900;{s}">{t}</div>'
w6 = f"""<img class="mapa" src="{IMG}zona_mercado_fin.png"><div class="dim"></div>
{hud('NIVEL 5 · RETO', vecinos(2), ptos='0200', tiempo='03:05', racha=2, sub='Mundo 1 · Mercado · vida real')}
<div class="panel"><span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>
<div style="position:absolute;left:30px;top:70px;right:30px;display:flex;align-items:center;justify-content:center;gap:18px">
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{coin()}<span class="k" style="position:static;transform:none;font-size:24px">x soles</span></div>
<span style="font-size:56px;font-weight:900">−</span>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><img src="{IMG}sprite_carmen.png" style="display:none">{box('S/ 15')}<span style="font-size:18px;font-weight:800;color:#4e1027">choclos</span></div>
<span style="font-size:56px;font-weight:900">=</span>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px">{box('S/ 23', 'color:#157a4f;border-color:#157a4f')}<span style="font-size:18px;font-weight:800;color:#4e1027">le quedó</span></div></div>
<div style="position:absolute;left:30px;bottom:22px;right:30px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:18px;font-weight:800;color:#4e1027">x = soles con los que salió Don Lucho</span>
<span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">PUERTA 3 DE 3</span></div></div>
<div style="position:absolute;left:1098px;top:96px;width:250px;padding:12px;background:#4e1027;border:3px solid #1b1430;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3">
<img src="{IMG}condor_posado.png" style="width:70px;image-rendering:pixelated">El cóndor te espera en la salida</div>
{dialog(lucho, 'DON LUCHO', t6, resp())}"""
out['16_m1_reto_mundo'] = ('EcuAventura – Reto del mundo', w6)

# ---------------------------------------------------------------- 7. nivel completado
def cell(lbl, val, col='#1b1430'):
    return f'<div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span style="font-size:16px;font-weight:800;color:#4e1027">{lbl}</span><span class="px" style="font-size:18px;color:{col}">{val}</span></div>'
p3 = ''.join(f'<img src="{IMG}retrato_{k}.png" style="width:48px;image-rendering:pixelated;background:#efe4cc;border:3px solid #1b1430">' for k in ('dona_rosa', 'don_lucho', 'carmen'))
f = f"""<img class="mapa" src="{IMG}zona_mercado.png"><div class="dim" style="background:rgba(27,20,48,.6)"></div>
<section style="position:absolute;left:263px;top:24px;width:840px;height:720px;padding:24px 34px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:28px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡NIVEL 3 COMPLETADO!</h1>
<div style="display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;color:#ffe9b8">¡Bien hecho, Ana! Ayudaste a {p3}</div>
<div style="display:flex;align-items:flex-end;gap:26px"><img src="{IMG0}mascota_feliz.png" style="width:110px;image-rendering:pixelated">
<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div style="display:flex;align-items:flex-end;gap:10px">
<img src="{IMG0}estrella.png" style="width:80px;image-rendering:pixelated"><img src="{IMG0}estrella.png" style="width:100px;image-rendering:pixelated"><img src="{IMG0}estrella_off.png" style="width:80px;image-rendering:pixelated"></div>
<span style="padding:6px 12px;background:#4e1027;border:3px solid #1b1430;font-size:17px;font-weight:800">3.ª estrella: termina en menos de <b style="color:#f2b632">2:00</b> sin pistas</span></div></div>
<div style="width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
{cell('Puntaje', '250', '#7a1f3d')}{cell('Aciertos', '3', '#157a4f')}{cell('Errores', '3', '#b8401a')}
{cell('Pistas usadas', '1')}{cell('Mejor racha', 'x2', '#e8572a')}{cell('Tiempo', '02:45')}</div>
<div style="width:100%;display:flex;gap:10px"><div style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f2b632;color:#1b1430;border:3px solid #1b1430;font-size:18px;font-weight:900">
<span class="px" style="font-size:11px;white-space:nowrap">¡NUEVO RÉCORD!</span><span style="white-space:nowrap">180 → 250</span></div>
<div style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#157a4f;border:3px solid #1b1430;font-size:18px;font-weight:900"><img src="{IMG0}estrella.png" style="width:24px;image-rendering:pixelated">Nivel 4 desbloqueado · Guardado</div></div>
<div style="width:100%;display:flex;align-items:center;gap:12px;padding:8px 14px;background:#4e1027;border:3px dashed #f2b632;font-size:18px;font-weight:800">
<img src="{IMG}retrato_carmen.png" style="width:40px;image-rendering:pixelated"><span>Próximo: en el <b style="color:#1fa36b">puesto verde</b> te espera un reto con sumas y restas…</span></div>
<div style="margin-top:auto;width:100%;display:flex;gap:14px"><span class="btn" style="flex:1;height:58px;background:#4e1027">REINTENTAR</span><span class="btn" style="flex:1;height:58px;background:#4e1027">MERCADO</span><span class="btn oro" style="flex:1.4;height:64px;font-size:15px">SIGUIENTE NIVEL ▶</span></div>
</section>"""
out['17_m1_nivel_completado'] = ('EcuAventura – Nivel completado', f)

# ---------------------------------------------------------------- 8. mundo completado
med = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 10px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span class="px" style="font-size:14px">{i}</span><span style="display:flex">{stars(st).replace("width:26px", "width:22px")}</span></div>'
              for i, st in zip(range(1, 6), (3, 2, 2, 3, 2)))
m = f"""<img src="{IMG0}fondo_menu.png" style="position:absolute;left:0;top:0;width:1366px;height:768px;object-fit:cover;image-rendering:pixelated">
<div style="position:absolute;inset:0;background:linear-gradient(rgba(27,20,48,0),rgba(27,20,48,.35))"></div>
<img src="{IMG}condor_vuelo.png" style="position:absolute;left:363px;top:40px;width:640px;image-rendering:pixelated">
<div class="tag yo" style="left:742px;top:52px">Ana</div>
<section style="position:absolute;left:213px;top:392px;width:940px;padding:22px 30px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:26px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡MUNDO 1 COMPLETADO!</h1>
<span style="font-size:21px;font-weight:800;text-align:center;line-height:1.4">¡Gracias, Ana! Los vecinos del <b style="color:#f2b632">Mercado</b> ya están felices.<br>El cóndor te lleva volando a la <b style="color:#8cc8ff">Estación de buses</b>.</span>
<div style="display:flex;gap:10px;align-items:center">{med}<div style="padding:10px 14px;background:#f2b632;color:#1b1430;border:3px solid #1b1430;font-family:'Press Start 2P';font-size:13px">★ 12 / 15</div></div>
<div style="width:100%;display:flex;gap:14px;margin-top:4px"><span class="btn" style="flex:1;height:58px;background:#4e1027">VOLVER AL MERCADO</span><span class="btn oro" style="flex:1.5;height:64px;font-size:15px">SIGUIENTE MUNDO ▶</span></div></section>"""
out['18_m1_mundo_completado'] = ('EcuAventura – Mundo 1 completado', m)

for k, (t, b) in out.items():
    open(os.path.join(HT, k + '.html'), 'w').write(page(t, b))
print(list(out))
