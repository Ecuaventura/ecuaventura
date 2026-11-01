"""Plantillas del Mundo 4 (Construcción) en mapa abierto + desafío final + final de la aventura."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
D = sys.argv[1]
src3 = open(os.path.join(here, 'build_html3.py')).read()
ns = {'__file__': os.path.join(here, 'build_html3.py')}
sys.argv = ['x', os.path.join(D, '_tmp3')]
exec(src3[:src3.index('# ---------------------------------------------------------------- 31 mapa')], ns)
import shutil; shutil.rmtree(os.path.join(D, '_tmp3'), ignore_errors=True)
HT = os.path.join(D, 'diseno', 'html', 'mundo4'); os.makedirs(HT, exist_ok=True)
IMG = '../../../public/assets/img/mundo4/'; IMG0 = ns['IMG0']; R = '../../../public/assets/img/'
ns['IMG'] = IMG; ns['OBJ'] = ['casco', 'plano', 'martillo', 'llave_grua']
page, dialog, resp, mark, row, hudreto0 = ns['page'], ns['dialog'], ns['resp'], ns['mark'], ns['row'], ns['hudreto']
X2, Y2 = ns['X2'], ns['Y2']
def hud(m, tengo, nuevo=None):
    return ns['hud'](m, tengo, nuevo).replace('MUNDO 3 · PUERTO', 'MUNDO 4 · CONSTRUCCIÓN').replace('2 / 15', '9 / 15')
hudreto = lambda n, sub, **k: hudreto0(n, sub, **k)
out = {}

# ---------------------------------------------------------------- 41 mapa
m = f"""<img class="mapa" src="{IMG}mapa_obra.png"><div class="dim" style="background:rgba(27,20,48,.25)"></div>
<div class="hud" style="height:64px"><span class="px" style="font-size:16px;color:#f2b632">MAPA DE LA OBRA</span><span style="font-size:17px;font-weight:800;color:#ffe9b8">Último mundo: explora la obra, el taller y el túnel para llegar a la grúa</span>
<span class="btn" style="margin-left:auto">CERRAR (M)</span></div>
{mark(5, 18.6, 16, 'ok', 'Entrada')}{mark(20, 13.0, 17, 'nuevo', 'El muro de ladrillos')}{mark(13.2, 6.4, 18, 'lock', 'Taller de la arquitecta')}
{mark(7.3, 6.4, 19, 'lock', 'Túnel de la cantera')}{mark(36.2, 8.6, 20, 'lock', 'DESAFÍO FINAL · Grúa')}
<div class="tag yo" style="left:{X2(17)+16}px;top:{Y2(17.3)+30}px">Tú</div>
<div style="position:absolute;left:{X2(22.3)}px;top:{Y2(16.4)-6}px;width:44px;height:44px;border:4px dashed #f2b632;border-radius:50%"></div>
<section style="position:absolute;right:14px;bottom:14px;width:400px;padding:12px;display:flex;flex-direction:column;gap:7px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 3px #f2b632,0 6px 0 #1b1430">
<span class="px" style="font-size:13px;color:#f2b632">MISIONES</span>
{row(16, 'Ayuda a Don Julio', 'ok', None, 'Completada · 3 estrellas')}
{row(17, 'Las dos torres', 'nuevo', 'casco', 'Encuentra el CASCO en la obra')}
{row(18, 'Los planos de Sofía', 'lock', 'plano', 'Necesitas el PLANO')}
{row(19, 'El túnel bloqueado', 'lock', 'martillo', 'Necesitas el MARTILLO')}
{row(20, 'DESAFÍO FINAL: la grúa', 'lock', 'llave_grua', 'Necesitas la LLAVE de la grúa')}</section>"""
out['41_m4_mapa_obra'] = ('EcuAventura – Mapa de la obra', m)

# ---------------------------------------------------------------- 42 explorar
X4 = lambda tx: round((tx - 13) * 64 - 21); Y4 = lambda ty: round((ty - 9) * 64)
e = f"""<img class="mapa" src="{IMG}explorar_obra.png">
{hud('Misión 17: sin casco no se entra a la obra', [])}
<div style="position:absolute;left:{X4(22.3)-14}px;top:{Y4(16.4)-14}px;width:76px;height:76px;border-radius:50%;background:radial-gradient(rgba(255,243,160,.8),rgba(255,243,160,0) 70%)"></div>
<div class="bang" style="left:{X4(22.3)+24}px;top:{Y4(16.4)-62}px;color:#c98a14">✦</div>
<div class="tag yo" style="left:{X4(20.6)+32}px;top:{Y4(16.6)-64}px">Ana</div>
<div style="position:absolute;left:{X4(22.3)+70}px;top:{Y4(16.4)+4}px;padding:10px 14px;background:#fff8ec;color:#1b1430;border:4px solid #1b1430;box-shadow:0 5px 0 #1b1430;font-size:19px;font-weight:900"><span class="key" style="margin-right:8px">ESPACIO</span>Recoger casco</div>
<div class="tag" style="left:{X4(20)+32}px;top:{Y4(11.2)+86}px;font-size:16px">Señora Rosa · obrera</div>
<div class="hint"><span><span class="key">FLECHAS</span> moverte</span><span><span class="key">ESPACIO</span> hablar / recoger / entrar</span><span><span class="key">M</span> mapa</span><span>Los objetos brillan <b style="color:#f2b632">✦</b></span></div>"""
out['42_m4_explorar'] = ('EcuAventura – Explorar la obra', e)

# ---------------------------------------------------------------- 43-44 reto de las torres (nivel 17)
def torres_panel(img, lbl_a, lbl_b, extra=''):
    return f"""<div class="panel" style="overflow:hidden"><span class="ptitle">LAS DOS TORRES DE LADRILLO</span>
<img src="{IMG}{img}" style="position:absolute;left:150px;top:30px;width:400px;image-rendering:pixelated">
<span class="k" style="left:228px;top:338px;font-size:18px">{lbl_a}</span><span class="k" style="left:452px;top:338px;font-size:18px">{lbl_b}</span>{extra}</div>"""
julio = f'{IMG}retrato_julio.png'
t43 = """<span><b style="color:#7a1f3d">¡Qué bien, Ana, ya tienes casco!</b> Vamos a poner una viga encima de las dos torres, así que deben quedar <b>de la misma altura</b>.</span>
<span>La torre roja tiene <b>3 filas de (x − 1)</b> ladrillos y la naranja, <b>2 filas de (x + 2)</b>.</span><span style="color:#7a1f3d">¿Cuánto vale x?</span>"""
r = f"""<img class="mapa" src="{IMG}explorar_obra.png"><div class="dim"></div>
{hudreto('NIVEL 17', 'Mundo 4 · Construcción · paréntesis')}
{torres_panel('torres_distintas.png', '3(x − 1)', '2(x + 2)', '<div class="eq" style="font-size:34px;right:18px;top:60px">3(x − 1) = 2(x + 2)</div><span style="position:absolute;right:20px;top:150px;width:210px;font-size:17px;font-weight:800;color:#4e1027;line-height:1.35">Las torres deben medir lo mismo para poner la viga.</span>')}
{dialog(julio, 'DON JULIO', t43, resp())}"""
out['43_m4_reto_torres'] = ('EcuAventura – Reto de las torres', r)

conf = ''.join(f'<span class="conf" style="left:{x}px;top:{y}px;background:{c};transform:rotate({a}deg)"></span>'
               for x, y, c, a in [(300, 120, '#f2b632', 20), (330, 220, '#1fa36b', 45), (1050, 130, '#1fa36b', 30), (1090, 230, '#f2b632', 60), (560, 104, '#d9406a', 40), (930, 430, '#f2b632', 35)])
t44 = """<span><b style="color:#157a4f">¡Perfecto, Ana!</b> Con x = 7: 3 × 6 = <b>18</b> y 2 × 9 = <b>18</b>. ¡Las dos torres miden igual y la viga quedó firme!</span>
<span>Toma este <b>PLANO</b>: llévaselo a la arquitecta Sofía, en el taller.</span>"""
c = f"""<img class="mapa" src="{IMG}explorar_obra.png"><div class="dim"></div>
{hudreto('NIVEL 17', 'Mundo 4 · Construcción · paréntesis', ptos='0100', racha=1)}
{torres_panel('torres_iguales.png', '18', '18', '<div class="eq" style="font-size:34px;right:18px;top:60px;border-color:#157a4f;color:#157a4f">18 = 18 ✔</div>' + f'<img src="{IMG}obj_plano.png" style="position:absolute;right:60px;top:170px;width:110px;image-rendering:pixelated">')}
<div class="banner" style="top:74px;background:#157a4f">¡CORRECTO! LA VIGA QUEDÓ FIRME</div>
<div style="position:absolute;left:330px;top:250px;font-family:'Press Start 2P';font-size:30px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">+100</div>{conf}
{dialog(julio, 'DON JULIO', t44, resp('7', 'ok', boton=False, pista=False))}"""
out['44_m4_correcto'] = ('EcuAventura – ¡Correcto!', c)

# ---------------------------------------------------------------- 45 desafío final (nivel 20)
box = lambda t, s='': f'<div style="padding:8px 14px;background:#fff;border:4px solid #1b1430;font-size:28px;font-weight:900;{s}">{t}</div>'
t45 = """<span><b style="color:#7a1f3d">¡Ana, el desafío final!</b> Compré <b>x bolsas de cemento</b> a <b>S/ 28</b> cada una y pagué <b>S/ 20</b> de transporte. En total gasté <b>la mitad</b> de mis <b>S/ 376</b>.</span>
<span style="color:#7a1f3d">¿Cuántas bolsas de cemento compré?</span>
<span style="display:flex;gap:10px;flex-wrap:wrap;font-size:17px"><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">1. Plantea la ecuación</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">2. Resuélvela</span><span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">3. Escribe solo el número</span></span>"""
w = f"""<img class="mapa" src="{IMG}grua_obra.png"><div class="dim"></div>
{hudreto('NIVEL 20 · DESAFÍO FINAL', 'Mundo 4 · Grúa · todos los tipos', ptos='0300', racha=3)}
<div class="panel"><span class="ptitle" style="background:#b5482f">DESAFÍO FINAL · TODO LO QUE APRENDISTE</span>
<div style="position:absolute;left:24px;right:24px;top:70px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{box('x bolsas × S/ 28')}<span style="font-size:17px;font-weight:800;color:#4e1027">cemento</span></div>
<span style="font-size:44px;font-weight:900">+</span>
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{box('S/ 20')}<span style="font-size:17px;font-weight:800;color:#4e1027">transporte</span></div>
<span style="font-size:44px;font-weight:900">=</span>
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{box('S/ 376 ÷ 2', 'color:#157a4f;border-color:#157a4f')}<span style="font-size:17px;font-weight:800;color:#4e1027">la mitad de su dinero</span></div></div>
<div style="position:absolute;left:30px;bottom:20px;right:30px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:18px;font-weight:800;color:#4e1027">x = número de bolsas de cemento</span>
<span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">NIVEL 20 DE 20</span></div></div>
<div style="position:absolute;left:1098px;top:100px;width:250px;padding:12px;background:#4e1027;border:3px solid #1b1430;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3">
<img src="{IMG}obj_llave_grua.png" style="width:50px;image-rendering:pixelated">La grúa ya funciona con tu llave</div>
{dialog(julio, 'DON JULIO', t45, resp())}"""
out['45_m4_desafio_final'] = ('EcuAventura – Desafío final', w)

# ---------------------------------------------------------------- 46 final de la aventura
amigos = [('mundo1', 'dona_rosa'), ('mundo1', 'don_lucho'), ('mundo2', 'jhon'), ('mundo2', 'teofilo'), ('mundo3', 'pancho'), ('mundo3', 'ernesto'), ('mundo4', 'sofia'), ('mundo4', 'julio')]
fila = ''.join(f'<img src="{R}{w_}/sprite_{k}.png" style="width:64px;image-rendering:pixelated">' for w_, k in amigos[:4])
fila2 = ''.join(f'<img src="{R}{w_}/sprite_{k}.png" style="width:64px;image-rendering:pixelated">' for w_, k in amigos[4:])
def cell(lbl, val, col='#1b1430'):
    return f'<div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span style="font-size:16px;font-weight:800;color:#4e1027">{lbl}</span><span class="px" style="font-size:17px;color:{col}">{val}</span></div>'
f = f"""<img src="{IMG0}fondo_inicio.png" style="position:absolute;left:0;top:0;width:1366px;height:768px;object-fit:cover;image-rendering:pixelated">
<div style="position:absolute;inset:0;background:rgba(27,20,48,.35)"></div>
<img src="{R}mundo1/condor_vuelo.png" style="position:absolute;left:30px;top:20px;width:330px;image-rendering:pixelated;transform:scaleX(-1)">
{''.join(f'<span class="conf" style="left:{x}px;top:{y}px;background:{c};transform:rotate({a}deg)"></span>' for x, y, c, a in [(420, 40, '#f2b632', 20), (980, 60, '#1fa36b', 45), (1200, 140, '#d9406a', 10), (380, 300, '#2c6fb5', 30), (1010, 330, '#f2b632', 60), (1250, 420, '#1fa36b', 15)])}
<section style="position:absolute;left:283px;top:30px;width:800px;padding:24px 30px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:24px;color:#f2b632;text-shadow:3px 3px 0 #1b1430;text-align:center;line-height:1.5">¡FELICIDADES, ANA!<br>TERMINASTE LA AVENTURA</h1>
<span style="font-size:20px;font-weight:800;text-align:center;line-height:1.4">Resolviste las ecuaciones de los <b style="color:#f2b632">20 niveles</b> y ayudaste a todos los vecinos de Abancay.<br>¡Ahora dominas las ecuaciones de primer grado!</span>
<div style="display:flex;align-items:flex-end;gap:16px;padding:12px 18px;background:#fdf3df;border:3px solid #1b1430">{fila}<img src="{R}mundo1/sprite_ana.png" style="width:84px;image-rendering:pixelated"><img src="{IMG0}mascota_feliz.png" style="width:72px;image-rendering:pixelated">{fila2}</div>
<div style="width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
{cell('Niveles', '20 / 20', '#157a4f')}{cell('Estrellas', '48 / 60', '#c98a14')}{cell('Puntaje total', '5 850', '#7a1f3d')}{cell('Tiempo total', '72 min')}</div>
<span style="padding:8px 14px;background:#4e1027;border:3px dashed #f2b632;font-size:18px;font-weight:800">¿Puedes conseguir las <b style="color:#f2b632">60 estrellas</b>? Vuelve a cualquier nivel y supera tu récord.</span>
<div style="width:100%;display:flex;gap:14px;margin-top:4px"><span class="btn" style="flex:1;height:58px;background:#4e1027">SALIR</span><span class="btn" style="flex:1;height:58px;background:#4e1027">VER NIVELES</span><span class="btn oro" style="flex:1.3;height:64px;font-size:14px">JUGAR DE NUEVO ▶</span></div></section>"""
out['46_final_aventura'] = ('EcuAventura – ¡Aventura completada!', f)

for k, (t, b) in out.items():
    open(os.path.join(HT, k + '.html'), 'w').write(page(t, b))
print(list(out))
