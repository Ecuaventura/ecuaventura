// Panel superior del reto. Cada mundo elige su visual en mundos.json → retoVisual.
// Versión 2.0: los 5 mundos (terminos, parentesis, ambos, fracciones, fraccionFraccion) usan
// panelPlantilla, que dibuja CUALQUIER plantilla algebraica con el estilo de su mundo:
//   Mundo 1 y 2: fichas azules (x) y amarillas (números), paréntesis grandes (diseños 8_cambios_entrevista/01 y 02);
//                el Mundo 2 agrega la fila de buses del primer paréntesis (diseños 23–25).
//   Mundo 3: fichas un poco más chicas (diseño 03); vida real: una tarjeta por persona (diseño 313).
//   Mundo 4: fracciones apiladas con numerador, raya y denominador (diseño 04); desafío final (411).
//   Mundo 5: fracción sobre fracción (diseños 503–512 y 05) y chips de COMPRUEBA al responder.
// La ecuación se achica sola (CSS zoom) si no entra en el panel, también con «Ver ejemplo» abierto.
// panelBalanza y panelVidaReal quedan para los problemas de vida real antiguos (plantillas.json → plantillas).

import { rellenar, rutaImagen } from '../scenes/ui.js';
import { dibujarBalanza } from '../arte/mercado.js';
import { evaluarIzquierda, textoEcuacion, textoComprobacion, formatoNumero } from '../logic/generadorEcuaciones.js';
import { arbolDe, plantilla, pasosPlantilla, comprobacionPlantilla, cuentaLado, ladosTexto, valoresLados } from '../logic/plantillas.js';
import { tieneX, escribir, aFraccion, aNumero } from '../logic/algebra.js';
import DIALOGOS from '../data/dialogos.json';

const n = formatoNumero;

// Texto del recuadro de la ecuación según el estado
function textoEq(ec, modo, valor) {
  if (modo === 'ok') return `${textoComprobacion(ec, valor)} ✔`;
  if (modo === 'mal') return `${textoComprobacion(ec, valor)} ≠ ${n(ec.d)}`;
  return textoEcuacion(ec);
}

// ---------------------------------------------------------------- ajuste al panel
// Achica (CSS zoom) lo que no entra: cada .ajusta al ancho de su contenedor y la ecuación (.pl-ec)
// también al alto que queda en la zona. Se mide todo sin zoom y luego se aplica.
export function ajustarAncho(el) {
  if (!el || !el.parentElement) return;
  el.style.zoom = '1';
  const ancho = el.parentElement.clientWidth - 8;
  if (ancho > 0 && el.scrollWidth > ancho) el.style.zoom = (ancho / el.scrollWidth).toFixed(3);
}

export function ajustarPanel(panel) {
  const zona = panel.querySelector('.pl-zona');
  if (zona) {
    const hijos = [...zona.children];
    hijos.forEach((h) => { h.style.zoom = '1'; });
    const W = zona.clientWidth - 8;
    const H = zona.clientHeight;
    const gap = parseFloat(getComputedStyle(zona).rowGap) || 0;
    const ec = zona.querySelector('.pl-ec');
    let alto = gap * (hijos.length - 1);
    const zooms = hijos.map((h) => {
      if (h === ec) return 1;
      const z = Math.min(1, W / Math.max(1, h.scrollWidth));
      alto += h.scrollHeight * z;
      return z;
    });
    if (ec) zooms[hijos.indexOf(ec)] = Math.max(0.35, Math.min(1, W / Math.max(1, ec.scrollWidth), (H - alto) / Math.max(1, ec.scrollHeight)));
    hijos.forEach((h, i) => { if (zooms[i] < 1) h.style.zoom = zooms[i].toFixed(3); });
  }
  panel.querySelectorAll('.pl-pie').forEach((pie) => {
    pie.style.zoom = '1';
    const ancho = pie.parentElement.clientWidth - 44;
    if (pie.scrollWidth > ancho) pie.style.zoom = (ancho / pie.scrollWidth).toFixed(3);
  });
}

// vuelve a ajustar cuando el panel cambia de ancho (al abrir o cerrar «Ver ejemplo»)
function vigilarPanel(panel) {
  if (panel.__ajuste || typeof ResizeObserver === 'undefined') return;
  panel.__ajuste = new ResizeObserver(() => ajustarPanel(panel));
  panel.__ajuste.observe(panel);
}

// ---------------------------------------------------------------- balanza (vida real antigua)
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

// ---------------------------------------------------------------- vida real antigua (plantillas.json → plantillas)
export function panelVidaReal(panel, { ec, modo, valor, plantilla: pl, puerta, total }) {
  const vis = pl.visual;
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

  let textoPie = pl.significado;
  if (modo === 'ok') textoPie = `<span class="c-verde">${textoComprobacion(ec, valor)} ✔</span>`;
  if (modo === 'mal') textoPie = `<span style="color:#b8401a">${textoComprobacion(ec, valor)} ≠ ${val.d}</span>`;
  panel.innerHTML = `<span class="ptitle" style="background:#b5482f">RETO DE LA VIDA REAL</span>
<div style="position:absolute;left:24px;top:70px;right:24px;display:flex;align-items:center;justify-content:center;gap:14px">${fila.join('')}</div>
<div style="position:absolute;left:30px;bottom:22px;right:30px;display:flex;justify-content:space-between;align-items:center">
<span style="font-size:18px;font-weight:800;color:#4e1027">${textoPie}</span>
<span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">PUERTA ${puerta} DE ${total}</span></div>`;
}

// ---------------------------------------------------------------- dibujo de cualquier plantilla
const sinGrupo = (nodo) => (nodo.k === 'g' ? sinGrupo(nodo.e) : nodo);
const esHoja = (nodo) => nodo.k === 'n' || nodo.k === 'p';

// Clases de cada mundo. f(texto, clase) = ficha, o(s) = signo, p(s) = paréntesis,
// frac(arriba, abajo, tipo) = fracción apilada (tipo: 'grande' ÷, 'chica' dentro de ÷, 'media' suelta)
const fichaSimple = (extra = '') => (texto, clase) => `<span class="ficha ficha-${clase}${extra}">${texto}</span>`;
const ESTILOS = {
  fichas: {
    f: fichaSimple(), o: (s) => `<span class="ficha-op">${s}</span>`, p: (s) => `<span class="ficha-paren">${s}</span>`
  },
  ambos: {
    f: fichaSimple(' ficha-ambos'), o: (s) => `<span class="ficha-op ambos">${s}</span>`, p: (s) => `<span class="ficha-paren ambos">${s}</span>`
  },
  frac: {
    f: fichaSimple(' ficha-ambos'), o: (s) => `<span class="ficha-op">${s}</span>`, p: (s) => `<span class="ficha-paren ambos">${s}</span>`,
    // dentro de una fracción las fichas son más chicas
    dentro: { f: fichaSimple(' ficha-frac'), o: (s) => `<span class="ficha-op frac-o">${s}</span>`, p: (s) => `<span class="ficha-paren frac-p">${s}</span>` },
    frac: (arriba, abajo) => `<span class="frac"><span class="frac-num">${arriba}</span><span class="frac-den">${abajo}</span></span>`
  },
  ff: {
    f: (texto, clase) => `<span class="ff-ficha ff-${clase}">${texto}</span>`,
    o: (s) => `<span class="ff-op">${s}</span>`,
    p: (s) => `<span class="ff-paren">${s}</span>`,
    frac: (arriba, abajo, tipo) => `<span class="ff-frac ff-${tipo}"><span class="ff-arriba">${arriba}</span><span class="ff-abajo">${abajo}</span></span>`
  }
};
const ESTILO_MUNDO = { 1: 'fichas', 2: 'fichas', 3: 'ambos', 4: 'frac', 5: 'ff' };

// HTML de un nodo. c = { P, X (html de la x o null), e (estilo), enDivision }
function htmlNodo(nodo, c) {
  const e = c.e;
  switch (nodo.k) {
    case 'n':
    case 'p': return e.f(nodo.k === 'n' ? nodo.v : c.P[nodo.id], 'n');
    case 'x': return c.X || e.f('x', 'x');
    case 'g': return `${e.p(nodo.c)}${htmlNodo(nodo.e, c)}${e.p(nodo.c === '[' ? ']' : ')')}`;
    case 's': return nodo.t.map((t, i) => {
      const signo = i === 0 ? (t.neg ? e.o('−') : '') : e.o(t.neg ? '−' : '+');
      return signo + htmlNodo(t.e, c);
    }).join('');
    case 'm': {
      if (esHoja(nodo.a)) {
        const k = nodo.a.k === 'n' ? nodo.a.v : c.P[nodo.a.id];
        // «3x» en una sola ficha azul; con el número del alumno: «3 · 5»
        if (nodo.b.k === 'x') return c.X ? (k === 1 ? c.X : `${e.f(k, 'n')}${e.o('·')}${c.X}`) : e.f(k === 1 ? 'x' : `${k}x`, 'x');
        return `${k === 1 ? '' : e.f(k, 'n')}${htmlNodo(nodo.b, c)}`;
      }
      return `${htmlNodo(nodo.a, c)}${e.o('·')}${htmlNodo(nodo.b, c)}`;
    }
    case 'f': {
      const d = { ...c, e: e.dentro || e };
      const tipo = c.enDivision ? 'chica' : 'media';
      return (e.frac || ESTILOS.frac.frac)(htmlNodo(nodo.a, d), htmlNodo(nodo.b, d), tipo);
    }
    case 'e': {
      // fracción sobre fracción: la raya grande reemplaza al «÷» y a los paréntesis de afuera
      const d = { ...c, enDivision: true };
      return (e.frac || ESTILOS.frac.frac)(htmlNodo(sinGrupo(nodo.a), d), htmlNodo(sinGrupo(nodo.b), d), 'grande');
    }
    default: return '';
  }
}

const tieneDivision = (nodo) => {
  let hay = false;
  const ver = (m) => {
    if (m.k === 'e') hay = true;
    if (m.k === 's') m.t.forEach((t) => ver(t.e));
    if (m.k === 'g') ver(m.e);
    if (m.a) ver(m.a);
    if (m.b) ver(m.b);
  };
  ver(nodo);
  return hay;
};

// Ecuación completa en HTML. En el Mundo 5, al responder, la x muestra el número del alumno y el «=» pasa a «≠».
export function htmlEcuacion(ec, { modo = null, valor = null } = {}) {
  const arbol = arbolDe(ec.plantilla);
  const nombre = ESTILO_MUNDO[ec.mundo] || 'fichas';
  const e = ESTILOS[nombre];
  if (nombre === 'ff') {
    const X = modo ? e.f(n(valor), 'n') : null;
    const lado = (nodo) => (tieneDivision(nodo) ? htmlNodo(nodo, { P: ec.p, X, e }) : `<span class="ff-medio">${htmlNodo(nodo, { P: ec.p, X, e })}</span>`);
    const igual = modo === 'mal' ? '<span class="ff-igual mal">≠</span>' : `<span class="ff-igual ${modo === 'ok' ? 'ok' : ''}">=</span>`;
    const marca = modo === 'ok' ? '<span class="ff-marca">✔</span>' : '';
    return `<div class="ff-ecuacion pl-ec">${lado(arbol.izq)}${igual}${lado(arbol.der)}${marca}</div>`;
  }
  const igual = nombre === 'frac' ? '<span class="ficha-op igual-frac">=</span>' : e.o('=');
  const clase = nombre === 'frac' ? 'ecuacion-frac pl-ec' : 'pl-ec';
  return `<div class="${clase}">${htmlNodo(arbol.izq, { P: ec.p, e })}${igual}${htmlNodo(arbol.der, { P: ec.p, e })}</div>`;
}

// Fila de buses del Mundo 2: el primer «k(x ± b)» de la ecuación son k buses con (x ± b) pasajeros
function busesMundo2(ec, modo, valor) {
  const arbol = arbolDe(ec.plantilla);
  let grupo = null;
  const buscar = (nodo) => {
    if (grupo) return;
    if (nodo.k === 'm' && esHoja(nodo.a) && nodo.b.k === 'g' && tieneX(nodo.b)) grupo = nodo;
    else if (nodo.k === 's') nodo.t.forEach((t) => buscar(t.e));
  };
  buscar(arbol.izq);
  buscar(arbol.der);
  if (!grupo) return '';
  const k = grupo.a.k === 'n' ? grupo.a.v : ec.p[grupo.a.id];
  if (k < 2 || k > 6) return '';
  const [L, R] = valor === null ? [null, null] : valoresLados(ec, valor);
  const imagen = modo === 'ok' ? 'bus_lleno' : modo === 'mal' && L && R && aNumero(L) > aNumero(R) ? 'bus_sobran' : 'bus_reto';
  const etiqueta = escribir(grupo.b, ec.p, valor === null ? {} : { X: aFraccion(valor), formato: (q) => n(aNumero(q)) });
  const bus = `<div class="bus-par"><img src="${rutaImagen(imagen)}" alt=""><span class="k etiqueta-bus">${etiqueta}</span></div>`;
  return `<div class="fila-buses pl-buses">${bus.repeat(k)}</div>`;
}

const chips = (titulo, lista, clase = '') => `<div class="pl-pie"><span class="px" style="font-size:11px;color:#7a1f3d">${titulo}</span>${lista.map((p) => `<span class="paso-chip ${clase}">${p}</span>`).join('')}</div>`;

export function panelPlantilla(panel, { ec, modo, valor, vidaReal = false, mundo = {}, nivel = {}, reto = {} }) {
  const t = plantilla(ec.plantilla);
  const final = !!nivel.retoFinal;
  let titulo;
  if (final) titulo = `<span class="ptitle" style="background:#b5482f">${nivel.tituloReto || 'RETO FINAL'}</span>`;
  else if (vidaReal) titulo = `<span class="ptitle" style="background:#b5482f">${mundo.tituloDesafio || 'RETO DE LA VIDA REAL'}</span>`;
  else titulo = `<span class="ptitle">${t.titulo || mundo.tituloReto || 'RETO'}</span>`;
  const grado = `<span class="grado-reto">${nivel.etiquetaGrado || mundo.etiquetaGrado || ''}</span>`;
  const resultado = modo && ec.mundo !== 5
    ? `<div class="eq ${modo} pl-res">x = ${n(valor)} → ${comprobacionPlantilla(ec, valor, n, modo === 'mal' ? 'mal' : null)}${modo === 'ok' ? ' ✔' : ''}</div>`
    : '';

  let centro;
  if (vidaReal && reto.personas) {
    // Mundo 3 (diseño 313): una tarjeta por persona con su lado de la ecuación
    const lados = ladosTexto(ec);
    const tarjetas = reto.personas.map((p, i) => `<div class="tarjeta-lado"><img src="${rutaImagen(p.sprite)}" alt=""><span>${p.nombre}</span><b>${lados[i]}</b></div>`).join('<span class="ficha-op">=</span>');
    centro = `<div class="pl-ec" style="gap:14px">${tarjetas}</div>${resultado}${modo || !reto.significado ? '' : `<span class="significado-x">${reto.significado}</span>`}`;
  } else {
    centro = `${htmlEcuacion(ec, { modo, valor })}${ec.mundo === 2 ? busesMundo2(ec, modo, valor) : ''}${resultado}`;
  }

  let pie;
  if (vidaReal && ec.mundo === 4) {
    pie = `<div class="pl-pie" style="justify-content:space-between"><span style="font-size:18px;font-weight:800;color:#4e1027">${reto.significado || ''}</span><span style="padding:8px 12px;background:#1b1430;color:#f2b632;font-family:'Press Start 2P';font-size:11px">DESAFIO DEL MUNDO ${mundo.id}</span></div>`;
  } else if (modo && ec.mundo === 5) {
    // diseños 504 y 505: las cuentas de cada lado con el número del alumno
    const cuentas = [cuentaLado(ec, 'izq', valor, n), cuentaLado(ec, 'der', valor, n)];
    pie = chips('COMPRUEBA', [modo === 'ok' ? `x = ${n(valor)}` : `Probaste x = ${n(valor)}`, ...cuentas], 'ff-chip');
  } else {
    pie = chips('PASOS', pasosPlantilla(ec), ec.mundo === 5 ? 'ff-chip' : '');
  }

  panel.innerHTML = `${titulo}
${grado}
<div class="pl-zona">${centro}</div>
${pie}`;
  ajustarPanel(panel);
  vigilarPanel(panel);
}

export const PANELES = {
  balanza: panelBalanza,
  terminos: panelPlantilla,
  parentesis: panelPlantilla,
  ambos: panelPlantilla,
  fracciones: panelPlantilla,
  fraccionFraccion: panelPlantilla
};
