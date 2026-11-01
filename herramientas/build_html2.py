"""Construye las 8 plantillas HTML del Mundo 2 (Estación de buses). Reutiliza estilos de build_html.py."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'build_html.py')).read()
ns = {}
exec(src[:src.index('out = {}')], ns)          # CSS, page, hud, vecinos, dialog, resp, X, Y
D = sys.argv[1]
HT = os.path.join(D, 'diseno', 'html', 'mundo2'); os.makedirs(HT, exist_ok=True)
IMG = '../../../public/assets/img/mundo2/'; ns['IMG'] = IMG
IMG0 = ns['IMG0']; X, Y = ns['X'], ns['Y']
page, hud0, vecinos, dialog, resp = ns['page'], ns['hud'], ns['vecinos'], ns['dialog'], ns['resp']
hud = lambda *a, sub='Mundo 2 · Terminal de buses · ax + b = c', **k: hud0(*a, sub=sub, **k)

def stars(n, w=26):
    return ''.join(f'<img src="{IMG0}{"estrella" if i < n else "estrella_off"}.png" style="width:{w}px;image-rendering:pixelated">' for i in range(3))
out = {}

# ---------------------------------------------------------------- 1. zona de la terminal
z = f"""<img class="mapa" src="{IMG}zona_estacion.png">
<div class="hud"><div class="chip"><img src="{IMG}sprite_ana.png" style="width:30px;image-rendering:pixelated">Ana</div>
<div style="display:flex;flex-direction:column;gap:6px"><span class="px" style="font-size:15px;color:#f2b632">MUNDO 2 · TERMINAL DE BUSES</span><span style="font-size:16px;font-weight:800;color:#ffe9b8">Ayuda a los pasajeros y choferes para salir al Puerto</span></div>
<div style="margin-left:auto;display:flex;gap:10px;align-items:center"><div class="stat"><b>ESTRELLAS</b><span style="color:#f2b632">3 / 15</span></div>
<span class="btn">NIVELES</span><span class="btn" style="width:48px;padding:0">?</span><span class="btn">SALIR</span></div></div>
<div class="badge" style="left:{X(1.7)}px;top:270px;background:#157a4f"><span class="n">6</span>{stars(3)}</div>
<div class="badge" style="left:{X(5.2)}px;top:270px;background:#f2b632;color:#1b1430;box-shadow:0 0 0 4px #fff,0 5px 0 4px #1b1430"><span class="n">7</span>¡NUEVO!</div>
<div class="badge" style="left:{X(9.7)}px;top:270px;background:#4e1027;color:#ffe9b8"><img src="{IMG0}candado.png" style="width:26px;image-rendering:pixelated"><span class="n" style="color:#fff">8</span></div>
<div class="badge" style="left:{X(13.7)}px;top:270px;background:#4e1027;color:#ffe9b8"><img src="{IMG0}candado.png" style="width:26px;image-rendering:pixelated"><span class="n" style="color:#fff">9</span></div>
<div class="badge" style="left:{X(18.0)}px;top:528px;background:#4e1027;color:#ffe9b8;flex-direction:column;align-items:flex-start;gap:4px"><span style="display:flex;gap:8px;align-items:center"><img src="{IMG0}candado.png" style="width:26px;image-rendering:pixelated"><span class="n" style="color:#f2b632">10 RETO</span></span><span style="font-size:16px">Salida al Puerto</span></div>
<img src="{IMG}condor_posado.png" style="position:absolute;left:{X(19.4)}px;top:{Y(4)-60}px;width:88px;image-rendering:pixelated">
<div class="bang" style="left:{X(7)+32}px;top:{Y(8.2)-84}px">!</div>
<div class="tag" style="left:{X(7)+32}px;top:{Y(8.2)+86}px;font-size:16px">Jhon, el cobrador</div>
<div class="tag yo" style="left:{X(9)+32}px;top:{Y(8.4)-62}px">Ana</div>
<div class="hint"><span><span class="key">FLECHAS</span> o <span class="key">WASD</span> moverte</span><span><span class="key">ESPACIO</span> hablar</span><span>Cada bus es un nivel · el <b style="color:#f2b632">!</b> marca un reto</span></div>"""
out['21_m2_zona_terminal'] = ('EcuAventura – Terminal de buses', z)

# ---------------------------------------------------------------- 2. nivel
n = f"""<img class="mapa" src="{IMG}nivel_estacion.png">
{hud('NIVEL 7', vecinos(0))}
<div class="bang" style="left:{X(5)+32}px;top:{Y(7.6)-62}px">!</div>
<div class="tag" style="left:{X(5)+150}px;top:{Y(7.6)-6}px;font-size:16px">Jhon, el cobrador</div>
<div class="bang" style="left:{X(15)+32}px;top:{Y(5.6)-62}px;color:#8d93a3">…</div>
<div class="tag yo" style="left:{X(5)+32}px;top:{Y(8.75)+70}px">Ana</div>
<div style="position:absolute;left:{X(5)+110}px;top:{Y(8.6)}px;padding:10px 14px;background:#fff8ec;color:#1b1430;border:4px solid #1b1430;box-shadow:0 5px 0 #1b1430;font-size:19px;font-weight:900"><span class="key" style="margin-right:8px">ESPACIO</span>Hablar</div>
<div class="hint"><span>Los buses bloquean los andenes. Ayuda a cada pasajero y llega a la <b style="color:#f2b632">bandera</b>.</span></div>"""
out['22_m2_nivel_andenes'] = ('EcuAventura – Nivel de la terminal', n)

# ---------------------------------------------------------------- 3-5. reto del bus
F, BX, BY = 3.2, 60, 72
def win(i): return BX + (15 + i * 12) * F, BX + (25 + i * 12) * F
def bracket(i0, i1, label, color='#7a1f3d'):
    a, _ = win(i0); _, b = win(i1)
    return (f'<div style="position:absolute;left:{a:.0f}px;top:{BY - 10}px;width:{b - a:.0f}px;height:14px;border:4px solid {color};border-bottom:none"></div>'
            f'<span class="k" style="left:{(a + b) / 2:.0f}px;top:{BY - 22}px;color:{color}">{label}</span>')
def bus_panel(img, wide, g1, g2, s, extra=''):
    w = (194 if wide else 170) * 4 * F / 4
    return f"""<div class="panel"><span class="ptitle">BUS DE JHON · 11 ASIENTOS</span>
<img src="{IMG}{img}" style="position:absolute;left:{BX}px;top:{BY}px;width:{w:.0f}px;image-rendering:pixelated">
{bracket(3, 6, g1, '#2c6fb5')}{bracket(7, 10, g2, '#2c6fb5')}{bracket(0, 2, s, '#4e1027')}{extra}</div>"""
leyenda = '<span style="position:absolute;left:24px;bottom:20px;font-size:17px;font-weight:800;color:#4e1027;line-height:1.35"><b style="color:#2c6fb5">x</b> = chicos en cada grupo<br><b>3</b> = pasajeros sueltos</span>'
jhon = f'{IMG}retrato_jhon.png'
t3 = """<span><b style="color:#7a1f3d">¡Hola, Ana!</b> Subieron <b>2 grupos de escolares</b> con la misma cantidad de chicos, y además <b>3 pasajeros sueltos</b>. ¡Mi bus de <b>11 asientos</b> quedó justo lleno!</span>
<span style="color:#7a1f3d">¿Cuántos chicos tiene cada grupo?</span>"""
r = f"""<img class="mapa" src="{IMG}nivel_estacion.png"><div class="dim"></div>
{hud('NIVEL 7', vecinos(0))}
{bus_panel('bus_reto.png', False, 'x', 'x', '3', leyenda + '<div class="eq" style="font-size:34px;right:18px;bottom:16px">2x + 3 = 11</div>')}
{dialog(jhon, 'JHON', t3, resp())}"""
out['23_m2_reto_bus'] = ('EcuAventura – Reto del bus', r)

conf = ''.join(f'<span class="conf" style="left:{x}px;top:{y}px;background:{c};transform:rotate({a}deg)"></span>'
               for x, y, c, a in [(300, 120, '#f2b632', 20), (330, 220, '#1fa36b', 45), (1050, 130, '#1fa36b', 30), (1090, 230, '#f2b632', 60),
                                  (1060, 330, '#2c6fb5', 15), (560, 104, '#d9406a', 40), (700, 96, '#f2b632', 25), (930, 430, '#f2b632', 35)])
motion = ''.join(f'<span style="position:absolute;left:{18}px;top:{BY + y}px;width:{w}px;height:6px;background:#8d93a3"></span>' for y, w in ((60, 34), (100, 24), (140, 34)))
t4 = """<span><b style="color:#157a4f">¡Exacto, Ana!</b> Cada grupo tiene <b>4 chicos</b>: 2 × 4 + 3 = 11. ¡No sobra ni falta ningún asiento!</span>
<span>¡Ya podemos salir! Te dejo pasar. Doña Marina está más allá con su emoliente.</span>"""
c = f"""<img class="mapa" src="{IMG}nivel_estacion.png"><div class="dim"></div>
{hud('NIVEL 7', vecinos(1), ptos='0100', racha=1)}
{bus_panel('bus_lleno.png', False, '4', '4', '3', motion + '<div class="eq" style="font-size:34px;right:18px;bottom:16px;border-color:#157a4f;color:#157a4f">2 × 4 + 3 = 11 ✔</div>')}
<div class="banner" style="top:74px;background:#157a4f">¡CORRECTO! EL BUS ARRANCA</div>
<div style="position:absolute;left:330px;top:260px;font-family:'Press Start 2P';font-size:30px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">+100</div>
<img src="{IMG0}mascota_feliz.png" style="position:absolute;left:1100px;top:250px;width:90px;image-rendering:pixelated">{conf}
{dialog(jhon, 'JHON', t4, resp('4', 'ok', boton=False, pista=False))}"""
out['24_m2_correcto'] = ('EcuAventura – ¡Correcto!', c)

t5 = """<span class="px" style="font-size:14px;color:#2c3e7a">PISTA DE ECU · -50 PTS</span>
<span>Con 5 en cada grupo: <b>2 × 5 + 3 = 13</b>, ¡pero el bus solo tiene <b>11</b> asientos!</span>
<span>Primero, ¿cuántos asientos quedan para los 2 grupos si los 3 sueltos ya se sentaron? Luego repártelos entre los 2 grupos.</span>"""
e = f"""<img class="mapa" src="{IMG}nivel_estacion.png"><div class="dim"></div>
{hud('NIVEL 7', vecinos(0))}
{bus_panel('bus_sobran.png', True, '5', '5', '3', '<div class="eq" style="font-size:34px;right:18px;bottom:16px;border-color:#e8572a;color:#b8401a">2 × 5 + 3 = 13 ≠ 11</div><span style="position:absolute;left:24px;bottom:22px;padding:6px 10px;background:#fde8df;border:3px solid #e8572a;font-size:18px;font-weight:900;color:#8a2c0e">¡2 pasajeros se quedan de pie!</span>')}
<div class="banner" style="top:74px;background:#b8401a">¡CASI! NO ALCANZAN LOS ASIENTOS</div>
<div style="position:absolute;left:1100px;top:120px;width:220px;padding:12px;background:#4e1027;border:3px solid #1b1430;font-size:17px;font-weight:800;line-height:1.35"><span class="px" style="font-size:11px;color:#f2b632">INTENTOS</span><br>2 en este reto<br>Pediste una pista</div>
{dialog(IMG0 + 'mascota.png', 'ECU', t5, resp('5', 'mal'))}"""
out['25_m2_error_pista'] = ('EcuAventura – Pista de Ecu', e)

# ---------------------------------------------------------------- 6. reto del mundo (nivel 10)
teo = f'{IMG}retrato_teofilo.png'
t6 = """<span><b style="color:#7a1f3d">¡Ana, último reto de la terminal!</b> Compré <b>3 pasajes</b> a Puerto, cada uno a <b>S/ x</b>, y pagué <b>S/ 2</b> por la maleta. En total pagué <b>S/ 20</b>.</span>
<span style="color:#7a1f3d">¿Cuánto cuesta cada pasaje?</span>
<span style="display:flex;gap:10px;flex-wrap:wrap;font-size:17px"><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">1. Plantea la ecuación</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">2. Resuélvela</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">3. Escribe solo el número</span></span>"""
bol = lambda: f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><img src="{IMG}boleto.png" style="width:96px;image-rendering:pixelated"><span class="k" style="position:static;transform:none">S/ x</span></div>'
box = lambda t, s='': f'<div style="padding:10px 16px;background:#fff;border:4px solid #1b1430;font-size:34px;font-weight:900;{s}">{t}</div>'
w6 = f"""<img class="mapa" src="{IMG}zona_estacion_fin.png"><div class="dim"></div>
{hud('NIVEL 10 · RETO', vecinos(2), ptos='0250', tiempo='02:58', racha=2, sub='Mundo 2 · Terminal · vida real')}
<div class="panel"><span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>
<div style="position:absolute;left:24px;top:76px;right:24px;display:flex;align-items:center;justify-content:center;gap:12px">
{bol()}{bol()}{bol()}<span style="font-size:48px;font-weight:900">+</span>
<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><img src="{IMG}maleta.png" style="width:80px;image-rendering:pixelated"><span class="k" style="position:static;transform:none">S/ 2</span></div>
<span style="font-size:48px;font-weight:900">=</span>{box('S/ 20', 'color:#157a4f;border-color:#157a4f')}</div>
<div style="position:absolute;left:30px;bottom:22px;right:30px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:18px;font-weight:800;color:#4e1027">x = precio de cada pasaje</span>
<span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">PUERTA 3 DE 3</span></div></div>
<div style="position:absolute;left:1098px;top:96px;width:250px;padding:12px;background:#4e1027;border:3px solid #1b1430;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3">
<img src="{IMG}condor_posado.png" style="width:70px;image-rendering:pixelated">El cóndor te espera en la salida</div>
{dialog(teo, 'DON TEOFILO', t6, resp())}"""
out['26_m2_reto_mundo'] = ('EcuAventura – Reto del mundo', w6)

# ---------------------------------------------------------------- 7. nivel completado
def cell(lbl, val, col='#1b1430'):
    return f'<div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span style="font-size:16px;font-weight:800;color:#4e1027">{lbl}</span><span class="px" style="font-size:18px;color:{col}">{val}</span></div>'
p3 = ''.join(f'<img src="{IMG}retrato_{k}.png" style="width:48px;image-rendering:pixelated;background:#efe4cc;border:3px solid #1b1430">' for k in ('jhon', 'marina', 'julia'))
f = f"""<img class="mapa" src="{IMG}zona_estacion.png"><div class="dim" style="background:rgba(27,20,48,.6)"></div>
<section style="position:absolute;left:263px;top:24px;width:840px;height:720px;padding:24px 34px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:28px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡NIVEL 7 COMPLETADO!</h1>
<div style="display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;color:#ffe9b8">¡Perfecto, Ana! Ayudaste a {p3}</div>
<div style="display:flex;align-items:flex-end;gap:26px"><img src="{IMG0}mascota_feliz.png" style="width:110px;image-rendering:pixelated">
<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div style="display:flex;align-items:flex-end;gap:10px">
<img src="{IMG0}estrella.png" style="width:80px;image-rendering:pixelated"><img src="{IMG0}estrella.png" style="width:100px;image-rendering:pixelated"><img src="{IMG0}estrella.png" style="width:80px;image-rendering:pixelated"></div>
<span style="padding:6px 12px;background:#4e1027;border:3px solid #1b1430;font-size:17px;font-weight:800">¡3 estrellas! Reto extra: supera tu tiempo de <b style="color:#f2b632">1:52</b></span></div></div>
<div style="width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
{cell('Puntaje', '350', '#7a1f3d')}{cell('Aciertos', '3', '#157a4f')}{cell('Errores', '0', '#b8401a')}
{cell('Pistas usadas', '0')}{cell('Mejor racha', 'x3 +50', '#e8572a')}{cell('Tiempo', '01:52')}</div>
<div style="width:100%;display:flex;gap:10px"><div style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f2b632;color:#1b1430;border:3px solid #1b1430;font-size:18px;font-weight:900">
<span class="px" style="font-size:11px;white-space:nowrap">¡NUEVO RÉCORD!</span><span style="white-space:nowrap">300 → 350</span></div>
<div style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#157a4f;border:3px solid #1b1430;font-size:18px;font-weight:900"><img src="{IMG0}estrella.png" style="width:24px;image-rendering:pixelated">Nivel 8 desbloqueado · Guardado</div></div>
<div style="width:100%;display:flex;align-items:center;gap:12px;padding:8px 14px;background:#4e1027;border:3px dashed #f2b632;font-size:18px;font-weight:800">
<img src="{IMG}retrato_julia.png" style="width:40px;image-rendering:pixelated"><span>Próximo: el <b style="color:#ff9f43">bus naranja</b> tiene un problema con restas…</span></div>
<div style="margin-top:auto;width:100%;display:flex;gap:14px"><span class="btn" style="flex:1;height:58px;background:#4e1027">REINTENTAR</span><span class="btn" style="flex:1;height:58px;background:#4e1027">TERMINAL</span><span class="btn oro" style="flex:1.4;height:64px;font-size:15px">SIGUIENTE NIVEL ▶</span></div>
</section>"""
out['27_m2_nivel_completado'] = ('EcuAventura – Nivel completado', f)

# ---------------------------------------------------------------- 8. mundo completado
med = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 10px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span class="px" style="font-size:14px">{i}</span><span style="display:flex">{stars(st, 22)}</span></div>'
              for i, st in zip(range(6, 11), (3, 3, 2, 3, 2)))
m = f"""<img src="{IMG0}fondo_menu.png" style="position:absolute;left:0;top:0;width:1366px;height:768px;object-fit:cover;image-rendering:pixelated">
<div style="position:absolute;inset:0;background:linear-gradient(rgba(27,20,48,0),rgba(27,20,48,.35))"></div>
<img src="{IMG}condor_vuelo.png" style="position:absolute;left:363px;top:40px;width:640px;image-rendering:pixelated">
<div class="tag yo" style="left:742px;top:52px">Ana</div>
<section style="position:absolute;left:213px;top:392px;width:940px;padding:22px 30px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:26px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡MUNDO 2 COMPLETADO!</h1>
<span style="font-size:21px;font-weight:800;text-align:center;line-height:1.4">¡Gracias, Ana! Todos los buses de la <b style="color:#f2b632">Terminal</b> salieron a tiempo.<br>El cóndor te lleva volando al <b style="color:#8cc8ff">Puerto</b>.</span>
<div style="display:flex;gap:10px;align-items:center">{med}<div style="padding:10px 14px;background:#f2b632;color:#1b1430;border:3px solid #1b1430;font-family:'Press Start 2P';font-size:13px">★ 13 / 15</div></div>
<div style="width:100%;display:flex;gap:14px;margin-top:4px"><span class="btn" style="flex:1;height:58px;background:#4e1027">VOLVER A LA TERMINAL</span><span class="btn oro" style="flex:1.5;height:64px;font-size:15px">SIGUIENTE MUNDO ▶</span></div></section>"""
out['28_m2_mundo_completado'] = ('EcuAventura – Mundo 2 completado', m)

for k, (t, b) in out.items():
    open(os.path.join(HT, k + '.html'), 'w').write(page(t, b))
print(list(out))
