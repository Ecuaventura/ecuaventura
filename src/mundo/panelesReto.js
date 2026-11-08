// Panel superior del reto (diseños 13–16 y 23–26). Cada mundo elige su visual en
// mundos.json → retoVisual: "balanza" (Mundo 1) o "bus" (Mundo 2). Los problemas de
// la vida real usan panelVidaReal en todos los mundos.

import { rellenar, rutaImagen } from '../scenes/ui.js';
import { dibujarBalanza } from '../arte/mercado.js';
import { evaluarIzquierda, textoEcuacion, textoComprobacion, formatoNumero } from '../logic/generadorEcuaciones.js';
import { fichas, juntarX } from '../logic/terminos.js';
import { fichasParentesis, pasoMultiplicar, adentro, valorParentesis } from '../logic/parentesis.js';
import { fichasAmbos, comprobacionAmbos, textoLado } from '../logic/ambosLados.js';
import { ladosVisibles as ladosFracciones, comprobacionFracciones, pasosFracciones } from '../logic/fracciones.js';
import { pasosFraccionFraccion, cuentasLados } from '../logic/fraccionFraccion.js';
import DIALOGOS from '../data/dialogos.json';

const AZUL = '#2c6fb5';
const GUINDA = '#4e1027';
const n = formatoNumero;

// Texto del recuadro de la ecuación según el estado
function textoEq(ec, modo, valor) {
  if (modo === 'ok') return `${textoComprobacion(ec, valor)} ✔`;
  if (modo === 'mal') return `${textoComprobacion(ec, valor)} ≠ ${n(ec.d)}`;
  return textoEcuacion(ec);
}

// ---------------------------------------------------------------- balanza (Mundo 1)
export function panelBalanza(panel, { ec, modo, valor, valores }) {
  const fuente = DIALOGOS.retos[ec.tipo];
  const lado = valor === null ? null : evaluarIzquierda(ec, valor);
  const inclinacion = modo === 'mal' ? (lado < ec.d ? 6 : -6) : 0;
  const { canvas, anclas } = dibujarBalanza({
    sacos: ec.tipo === 'ax=b' ? ec.a : 1,
    pesaIzquierda: ec.tipo === 'x+a=b',
    inclinacion
  });
  canvas.style.cssText = 'position:absolute;left:100px;top:46px;width:600px;height:288px;image-rendering:pixelated';
  const aPanel = ([bx, by]) => [100 + bx * 4, 46 + by * 4];
  const etiqueta = (pos, texto, clase = '', extra = '') => {
    const [x, y] = aPanel(pos);
    return `<span class="k ${clase}" style="left:${x}px;top:${y}px;${extra}">${texto}</span>`;
  };
  const textoSaco = valor === null ? 'x' : n(valor);
  let html = `<span class="ptitle">${rellenar(fuente.titulo, valores)}</span>`;
  html += anclas.sacos.map((p) => etiqueta(p, textoSaco, '', ec.tipo === 'ax=b' && ec.a > 3 ? 'font-size:16px;min-width:30px;padding:2px 5px' : '')).join('');
  html += etiqueta(anclas.derecha, `${n(ec.d)} kg`, '', 'font-size:19px');
  if (anclas.pesaIzquierda) html += etiqueta(anclas.pesaIzquierda, `${n(ec.a)} kg`, '', 'font-size:19px');
  if (ec.tipo === 'x-a=b') {
    const [x, y] = aPanel(anclas.sobreSaco);
    html += `<span class="k resta" style="left:${x}px;top:${y - 26}px;font-size:19px">− ${n(ec.a)} kg</span>`;
  }
  html += `<div class="eq ${modo || ''}" style="right:22px;top:22px">${textoEq(ec, modo, valor)}</div>`;
  if (!modo) html += `<span style="position:absolute;left:24px;bottom:22px;font-size:17px;font-weight:800;color:#4e1027">${rellenar(fuente.nota, valores)}</span>`;
  panel.innerHTML = html;
  panel.insertBefore(canvas, panel.children[1] || null);
}

// ---------------------------------------------------------------- vida real (todos los mundos)
export function panelVidaReal(panel, { ec, modo, valor, plantilla, puerta, total }) {
  const vis = plantilla.visual;
  const val = { a: n(ec.a), b: n(ec.b), c: n(ec.c ?? ec.d), d: n(ec.d) };
  const colorX = modo === 'ok' ? '#157a4f' : modo === 'mal' ? '#b8401a' : '#7a1f3d';
  const textoX = valor === null ? vis.x : rellenar(vis.valorX, { v: n(valor) });
  const chip = (texto, color = '#7a1f3d', tam = 24) => `<span class="k" style="position:static;transform:none;font-size:${tam}px;color:${color};border-color:${color === '#7a1f3d' ? '#1b1430' : color}">${texto}</span>`;
  const pie = (texto) => (texto ? `<span style="font-size:18px;font-weight:800;color:#4e1027">${texto}</span>` : '');
  const caja = (texto, pieTexto, color = '') => `<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><div style="padding:10px 16px;background:#fff;border:4px solid ${color || '#1b1430'};font-size:34px;font-weight:900;color:${color || '#1b1430'};white-space:nowrap">${texto}</div>${pie(pieTexto) || '<span style="font-size:18px">&nbsp;</span>'}</div>`;
  const icono = (clave, ancho, texto, color, tam) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><img src="${rutaImagen(clave)}" alt="" style="width:${ancho}px;image-rendering:pixelated">${chip(texto, color, tam)}</div>`;
  const op = (simbolo) => `<span style="font-size:52px;font-weight:900">${simbolo}</span>`;
  const verde = '#157a4f';
  const derecha = caja(rellenar(vis.d ?? vis.b, val), vis.pieD ?? vis.pieB, verde);

  let fila;
  if (vis.repetir) {
    // ax ± b = c: el ícono de x se repite a veces (diseño 26)
    const xs = Array.from({ length: ec.a }, () => icono(vis.icono, 96, textoX, colorX, 20)).join('');
    const terminoB = vis.iconoB ? icono(vis.iconoB, 80, rellenar(vis.b, val), '#7a1f3d', 20) : caja(rellenar(vis.b, val), vis.pieB);
    fila = [`<div style="display:flex;gap:8px">${xs}</div>`, op(ec.tipo === 'ax-b=c' ? '−' : '+'), terminoB, op('='), caja(rellenar(vis.d, val), vis.pieD, verde)];
  } else {
    const incognita = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><img src="${rutaImagen(vis.icono)}" alt="" style="width:${vis.icono === 'monedero' ? 150 : 110}px;image-rendering:pixelated">${chip(textoX, colorX)}${pie(vis.pieX)}</div>`;
    const cajaA = caja(rellenar(vis.a, val), vis.pieA);
    if (ec.tipo === 'ax=b') fila = [cajaA, op('×'), incognita, op('='), derecha];
    else if (ec.tipo === 'x/a=b') fila = [incognita, op('÷'), cajaA, op('='), derecha];
    else fila = [incognita, op(ec.tipo === 'x+a=b' ? '+' : '−'), cajaA, op('='), derecha];
  }

  let textoPie = plantilla.significado;
  if (modo === 'ok') textoPie = `<span class="c-verde">${textoComprobacion(ec, valor)} ✔</span>`;
  if (modo === 'mal') textoPie = `<span style="color:#b8401a">${textoComprobacion(ec, valor)} ≠ ${val.d}</span>`;
  panel.innerHTML = `<span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>
<div style="position:absolute;left:24px;top:70px;right:24px;display:flex;align-items:center;justify-content:center;gap:14px">${fila.join('')}</div>
<div style="position:absolute;left:30px;bottom:22px;right:30px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:18px;font-weight:800;color:#4e1027">${textoPie}</span>
<span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">PUERTA ${puerta} DE ${total}</span></div>`;
}

// ---------------------------------------------------------------- términos semejantes (Mundo 1 v2)
// Diseño: diseño/8_cambios_entrevista/01_m1_reto_terminos.png
// Fichas azules = términos con x, amarillas = números; etiqueta del grado y 3 chips de PASOS.
export function panelTerminos(panel, { ec, modo, valor, vidaReal = false, mundo = {} }) {
  const fichasHtml = fichas(ec).map((f) => (f.clase === 'op'
    ? `<span class="ficha-op">${f.texto}</span>`
    : `<span class="ficha ficha-${f.clase}">${f.texto}</span>`)).join('');
  const pasos = vidaReal
    ? ['1. Plantea la ecuación', '2. Resuélvela', '3. Escribe solo el número']
    : ec.forma === 'n1'
      ? [`1. Junta las x: ${juntarX(ec)}`, '2. Divide entre las x', '3. Escribe el valor']
      : [`1. Junta las x: ${juntarX(ec)}`, '2. Junta los números', '3. Despeja x'];
  const titulo = vidaReal ? '<span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>' : `<span class="ptitle">${mundo.tituloReto || 'RETO'}</span>`;
  let resultado = '';
  if (modo) resultado = `<div class="eq ${modo}" style="position:static;font-size:30px;margin-top:18px">x = ${n(valor)} → ${textoEq(ec, modo, valor)}</div>`;
  panel.innerHTML = `${titulo}
<span class="grado-reto">${mundo.etiquetaGrado || ''}</span>
<div style="position:absolute;left:0;right:0;top:${modo ? 104 : 138}px;display:flex;flex-direction:column;align-items:center">
<div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:0 20px">${fichasHtml}</div>${resultado}</div>
<div style="position:absolute;left:24px;bottom:22px;right:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="px" style="font-size:11px;color:#7a1f3d">PASOS</span>${pasos.map((p) => `<span class="paso-chip">${p}</span>`).join('')}</div>`;
}

// ---------------------------------------------------------------- paréntesis (Mundo 2 v2)
// Diseño: diseño/8_cambios_entrevista/02_m2_reto_parentesis.png (+ los buses de 23–25):
// paréntesis grandes, x en fichas azules, números en amarillas, «2.° SEC», PASOS,
// y debajo «a» buses iguales con la etiqueta (x + b) y el total a la derecha.
export function panelParentesis(panel, { ec, modo, valor, vidaReal = false, mundo = {} }) {
  const fichasHtml = fichasParentesis(ec).map((f) => {
    if (f.clase === 'paren') return `<span class="ficha-paren">${f.texto}</span>`;
    if (f.clase === 'op') return `<span class="ficha-op">${f.texto}</span>`;
    return `<span class="ficha ficha-${f.clase}">${f.texto}</span>`;
  }).join('');
  const pasos = vidaReal
    ? ['1. Plantea la ecuación', '2. Resuélvela', '3. Escribe solo el número']
    : [pasoMultiplicar(ec), '2. Pasa el número', '3. Despeja x'];
  // cada bus lleva (kx + b); con el número del alumno se ve si llenan justo, sobran o faltan
  const lado = valor === null ? null : valorParentesis(ec, valor);
  const imagen = modo === 'ok' ? 'bus_lleno' : modo === 'mal' && lado > ec.d ? 'bus_sobran' : 'bus_reto';
  const etiqueta = valor === null ? adentro(ec) : adentro(ec).replace('x', ec.k === 1 ? n(valor) : `·${n(valor)}`);
  const buses = Array.from({ length: ec.a }, () => `<div class="bus-par"><img src="${rutaImagen(imagen)}" alt=""><span class="k etiqueta-bus">(${etiqueta})</span></div>`).join('');
  const fuera = ec.c ? `<span class="ficha-op op-chica">${ec.c < 0 ? '−' : '+'}</span><span class="ficha ficha-n ficha-chica">${Math.abs(ec.c)}</span>` : '';
  const total = `<span class="ficha-op op-chica">=</span><span class="ficha ficha-n ficha-chica">${ec.d}</span>`;
  const titulo = vidaReal ? '<span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>' : `<span class="ptitle">${mundo.tituloReto || 'RETO'}</span>`;
  const resultado = modo ? `<div class="eq ${modo}" style="left:50%;transform:translateX(-50%);top:236px;font-size:26px;padding:4px 14px">x = ${n(valor)} → ${textoEq(ec, modo, valor)}</div>` : '';
  panel.innerHTML = `${titulo}
<span class="grado-reto">${mundo.etiquetaGrado || ''}</span>
<div style="position:absolute;left:0;right:0;top:64px;display:flex;align-items:center;justify-content:center;gap:6px">${fichasHtml}</div>
<div class="fila-buses" style="top:${modo ? 146 : 160}px">${buses}${fuera}${total}</div>${resultado}
<div style="position:absolute;left:24px;bottom:22px;right:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="px" style="font-size:11px;color:#7a1f3d">PASOS</span>${pasos.map((p) => `<span class="paso-chip">${p}</span>`).join('')}</div>`;
}

// ---------------------------------------------------------------- paréntesis en ambos lados (Mundo 3)
// Diseño: diseño/8_cambios_entrevista/03_m3_reto_parentesis_dos_lados.png
// Paréntesis grandes, x en fichas azules, números en amarillas, «3.° SEC» y 3 chips de PASOS.
// Vida real (diseño 313): una tarjeta por persona con su lado de la ecuación.
export function panelAmbos(panel, { ec, modo, valor, vidaReal = false, mundo = {}, reto = {} }) {
  const resultado = modo
    ? `<div class="eq ${modo}" style="position:static;font-size:24px;margin-top:16px;padding:6px 14px;white-space:nowrap">x = ${n(valor)} → ${(modo === 'ok' ? comprobacionAmbos(ec, valor, n) : comprobacionAmbos(ec, valor, n).replace(' y ', ' ≠ '))}${modo === 'ok' ? ' ✔' : ''}</div>`
    : '';
  const pasosHtml = (pasos) => `<div style="position:absolute;left:24px;bottom:22px;right:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="px" style="font-size:11px;color:#7a1f3d">PASOS</span>${pasos.map((p) => `<span class="paso-chip">${p}</span>`).join('')}</div>`;

  if (vidaReal && reto.personas) {
    const lados = [ec.izq, ec.der];
    const tarjetas = reto.personas.map((p, i) => `<div class="tarjeta-lado"><img src="${rutaImagen(p.sprite)}" alt=""><span>${p.nombre}</span><b>${textoLado(lados[i])}</b></div>`).join('<span class="ficha-op">=</span>');
    panel.innerHTML = `<span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>
<span class="grado-reto">${mundo.etiquetaGrado || ''}</span>
<div style="position:absolute;left:0;right:0;top:${modo ? 58 : 66}px;display:flex;flex-direction:column;align-items:center">
<div style="display:flex;align-items:center;justify-content:center;gap:14px">${tarjetas}</div>${resultado}
${modo || !reto.significado ? '' : `<span class="significado-x">${reto.significado}</span>`}</div>
${pasosHtml(['1. Plantea la ecuación', '2. Resuélvela', '3. Escribe solo el número'])}`;
    return;
  }

  const fichasHtml = fichasAmbos(ec).map((f) => {
    if (f.clase === 'paren') return `<span class="ficha-paren ambos">${f.texto}</span>`;
    if (f.clase === 'op') return `<span class="ficha-op ambos">${f.texto}</span>`;
    return `<span class="ficha ficha-${f.clase} ficha-ambos">${f.texto}</span>`;
  }).join('');
  panel.innerHTML = `<span class="ptitle">${mundo.tituloReto || 'RETO'}</span>
<span class="grado-reto">${mundo.etiquetaGrado || ''}</span>
<div style="position:absolute;left:0;right:0;top:${modo ? 100 : 128}px;display:flex;flex-direction:column;align-items:center">
<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:0 16px">${fichasHtml}</div>${resultado}</div>
${pasosHtml(['1. Quita los paréntesis', '2. Las x a un lado', '3. Los números al otro'])}`;
}

// ---------------------------------------------------------------- fracciones y paréntesis (Mundo 4)
// Diseño: diseño/8_cambios_entrevista/04_m4_reto_fracciones.png
// Fracciones de verdad (numerador arriba, raya, denominador abajo), x en fichas azules, números en
// amarillas, «4.° SEC» y 3 chips de PASOS. Desafío final (nivel 20, diseño 411): mismo panel con el
// título del desafío y lo que significa x.
function htmlFraccion(t) {
  const ficha = (texto, clase) => `<span class="ficha ficha-${clase} ficha-frac">${texto}</span>`;
  const numerador = [
    t.a === 1 ? '' : ficha(t.a, 'n'),
    '<span class="ficha-paren frac-p">(</span>', ficha('x', 'x'),
    `<span class="ficha-op frac-o">${t.b < 0 ? '−' : '+'}</span>`, ficha(Math.abs(t.b), 'n'),
    '<span class="ficha-paren frac-p">)</span>'
  ].join('');
  return `<span class="frac"><span class="frac-num">${numerador}</span><span class="frac-den">${ficha(t.den, 'n')}</span></span>`;
}

function htmlLadoFracciones(lado) {
  return lado.map((t, i) => {
    const negativo = t.t !== 'f' && t.c < 0;
    const op = i === 0 ? (negativo ? '<span class="ficha-op">−</span>' : '') : `<span class="ficha-op">${negativo ? '−' : '+'}</span>`;
    if (t.t === 'f') return op + htmlFraccion(t);
    const texto = t.t === 'x' ? (Math.abs(t.c) === 1 ? 'x' : `${Math.abs(t.c)}x`) : Math.abs(t.c);
    return `${op}<span class="ficha ficha-${t.t === 'x' ? 'x' : 'n'} ficha-ambos">${texto}</span>`;
  }).join('');
}

export function panelFracciones(panel, { ec, modo, valor, vidaReal = false, mundo = {}, reto = {} }) {
  const [a, b] = ladosFracciones(ec);
  const resultado = modo
    ? `<div class="eq ${modo}" style="position:static;font-size:24px;margin-top:14px;padding:6px 14px;white-space:nowrap">x = ${n(valor)} → ${comprobacionFracciones(ec, valor, n, modo)}${modo === 'ok' ? ' ✔' : ''}</div>`
    : '';
  const ecuacion = `<div class="ecuacion-frac">${htmlLadoFracciones(a)}<span class="ficha-op igual-frac">=</span>${htmlLadoFracciones(b)}</div>`;
  const pie = vidaReal
    ? `<div style="position:absolute;left:28px;bottom:24px;right:24px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:18px;font-weight:800;color:#4e1027">${reto.significado || ''}</span><span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">DESAFIO DEL MUNDO ${mundo.id}</span></div>`
    : `<div style="position:absolute;left:24px;bottom:22px;right:20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="px" style="font-size:11px;color:#7a1f3d">PASOS</span>${pasosFracciones(ec).map((p) => `<span class="paso-chip">${p}</span>`).join('')}</div>`;
  const titulo = vidaReal
    ? `<span class="ptitle" style="background:#b5482f">${mundo.tituloDesafio || 'RETO DE LA VIDA REAL'}</span>`
    : `<span class="ptitle">${mundo.tituloReto || 'RETO'}</span>`;
  panel.innerHTML = `${titulo}
<span class="grado-reto">${mundo.etiquetaGrado || ''}</span>
<div style="position:absolute;left:0;right:0;top:${modo ? 62 : 84}px;display:flex;flex-direction:column;align-items:center">${ecuacion}${resultado}</div>
${pie}`;
}

// ---------------------------------------------------------------- fracción sobre fracción (Mundo 5)
// Diseños: diseño/9_mundo5_feria/503 (pregunta), 504 (correcto), 505 (error), 508, 511 y 512, y
// diseño/8_cambios_entrevista/05. La fracción grande lleva otra fracción arriba y/o abajo (raya doble en
// las chicas, raya gruesa en la grande); nunca «/» ni «÷» en una línea. x en fichas azules, números en
// amarillas. Al responder, la x muestra el número del alumno, el «=» pasa a «≠» si no da, y los chips
// de COMPRUEBA hacen las cuentas de cada lado. Nivel 25 (reto final): título naranja y «NIVEL 25 DE 25».
const ffFicha = (texto, clase) => `<span class="ff-ficha ff-${clase}">${texto}</span>`;
const ffOp = (s) => `<span class="ff-op">${s}</span>`;
const ffPar = (dentro) => `<span class="ff-paren">(</span>${dentro}<span class="ff-paren">)</span>`;
const ffFrac = (arriba, abajo, tipo) => `<span class="ff-frac ff-${tipo}"><span class="ff-arriba">${arriba}</span><span class="ff-abajo">${abajo}</span></span>`;

// [lado izquierdo, lado derecho] en HTML; X = ficha de la x (o del número del alumno)
function ladosFraccionFraccion(ec, X) {
  const { a, b, c, d, e, f } = ec.p;
  const N = (k) => ffFicha(k, 'n');
  switch (ec.forma) {
    case 'sobreNumero': return [ffFrac(`${ffFrac(X, N(a), 'chica')}${ffOp('+')}${N(b)}`, ffFrac(N(c), N(d), 'chica'), 'grande'), N(e)];
    case 'sobreParen': return [ffFrac(ffPar(`${X}${ffOp('−')}${N(a)}`), ffFrac(N(1), N(b), 'chica'), 'grande'), `${N(c)}${ffPar(`${X}${ffOp('−')}${N(d)}`)}`];
    case 'sobreFrac': return [ffFrac(ffFrac(X, N(a), 'chica'), ffFrac(N(b), N(c), 'chica'), 'grande'), ffFrac(ffPar(`${X}${ffOp('+')}${N(d)}`), N(e), 'media')];
    case 'simplifica': return [ffFrac(ffFrac(`${N(b)}${ffPar(`${X}${ffOp('+')}${N(a)}`)}`, N(c), 'chica'), ffFrac(N(1), N(c), 'chica'), 'grande'), `${X}${ffOp('+')}${N(d)}`];
    case 'final': return [ffFrac(`${ffFrac(ffPar(`${X}${ffOp('+')}${N(a)}`), N(b), 'chica')}${ffOp('−')}${N(c)}`, ffFrac(N(1), N(d), 'chica'), 'grande'), `${N(e)}${ffPar(`${X}${ffOp('−')}${N(f)}`)}`];
    default: return ['', ''];
  }
}

export function panelFraccionFraccion(panel, { ec, modo, valor, mundo = {}, nivel = {} }) {
  const X = modo ? ffFicha(n(valor), 'n') : ffFicha('x', 'x');
  const [izq, der] = ladosFraccionFraccion(ec, X);
  const signo = modo === 'mal' ? '<span class="ff-igual mal">≠</span>' : `<span class="ff-igual ${modo === 'ok' ? 'ok' : ''}">=</span>`;
  const marca = modo === 'ok' ? '<span class="ff-marca">✔</span>' : '';
  const ecuacion = `<div class="ff-ecuacion">${izq}${signo}<span class="ff-medio">${der}</span>${marca}</div>`;
  const chips = modo
    ? ['<span class="px" style="font-size:11px;color:#7a1f3d">COMPRUEBA</span>', ...[modo === 'ok' ? `x = ${n(valor)}` : `Probaste x = ${n(valor)}`, ...cuentasLados(ec, valor, n)].map((t) => `<span class="paso-chip ff-chip">${t}</span>`)]
    : ['<span class="px" style="font-size:11px;color:#7a1f3d">PASOS</span>', ...pasosFraccionFraccion(ec).map((t) => `<span class="paso-chip ff-chip">${t}</span>`)];
  const final = !!nivel.retoFinal;
  const titulo = `<span class="ptitle"${final ? ' style="background:#b5482f"' : ''}>${nivel.tituloReto || mundo.tituloReto || 'RETO'}</span>`;
  panel.innerHTML = `${titulo}
<span class="grado-reto">${nivel.etiquetaGrado || mundo.etiquetaGrado || ''}</span>
<div class="ff-zona">${ecuacion}</div>
<div class="ff-pie">${chips.join('')}</div>`;
}

export const PANELES = { balanza: panelBalanza, terminos: panelTerminos, parentesis: panelParentesis, ambos: panelAmbos, fracciones: panelFracciones, fraccionFraccion: panelFraccionFraccion };
