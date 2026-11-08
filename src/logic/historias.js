// Arma la historia de un reto de términos semejantes con los números generados.
// Cada término de la ecuación se cuenta con una frase del tema (sacos, bolsas, canastas…).

import HISTORIAS from '../data/historias.json';
import { rellenar } from '../scenes/ui.js';

const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
// con el número 1 se usa la frase en singular si el tema la tiene (num1, restaNum1…)
const frase = (t, clave, n) => (n === 1 && t[`${clave}1`]) || t[clave];

function unir(frases) {
  if (frases.length <= 1) return frases.join('');
  return `${frases.slice(0, -1).join(', ')} y ${frases[frases.length - 1]}`;
}

// {n|singular|plural} → «1 profesor» o «3 profesores» según el número
function plurales(texto, valores) {
  return texto.replace(/\{(\w+)\|([^|}]*)\|([^}]*)\}/g, (_, clave, uno, varios) => {
    const n = valores[clave];
    return `${n} ${Number(n) === 1 ? uno : varios}`;
  });
}

// Historia de un reto con paréntesis a(kx + b) + c = d (Mundo 2)
function armarHistoriaParentesis(ec, tema, nombre, final) {
  const P = HISTORIAS.parentesis;
  const t = P.temas[tema];
  const tipoDentro = ec.k !== 1 ? 'k' : ec.b < 0 ? 'menos' : 'mas';
  const valores = { a: ec.a, k: ec.k, b: Math.abs(ec.b), c: Math.abs(ec.c), d: ec.d };
  const saludo = rellenar(final ? P.saludoFinal : P.saludo, { nombre });
  const dentro = plurales(rellenar(t.dentro[tipoDentro], valores), valores);
  const fuera = ec.c ? plurales(rellenar(t.fuera[ec.c < 0 ? 'menos' : 'mas'], valores), valores) : '';
  const primera = rellenar(t.intro, { ...valores, saludo, dentro, fuera });
  const pregunta = t.pregunta[tipoDentro];
  return {
    historia: `<span>${primera}</span><span>${rellenar(t.total, valores)} <span class="c-guinda">${pregunta}</span></span>`,
    pregunta,
    respuesta: t.respuesta[tipoDentro],
    correcto: P.correcto
  };
}

// Historia de un reto con paréntesis en ambos lados (Mundo 3).
// izq = lo que tiene el vecino, der = lo que tiene 'otro' (nombre de otro personaje)
function armarHistoriaAmbos(ec, tema, nombre, final, otro) {
  const A = HISTORIAS.ambos;
  const t = A.temas[tema];
  const frases = (lado) => {
    const suma = [];
    const resta = [];
    for (const term of lado) {
      if (term.t === 'p') {
        const val = { a: term.a, s: term.b < 0 ? '−' : '+', b: Math.abs(term.b) };
        if (term.s < 0) resta.push(rellenar(t.menos, { par1: rellenar(t.par1, val) }));
        else suma.push(rellenar(t.par, val));
      } else if (term.t === 'x') {
        suma.push(term.c === 1 ? t.x1 : rellenar(t.x, { c: term.c }));
      } else {
        suma.push(term.c === 1 ? t.num1 : rellenar(t.num, { n: term.c }));
      }
    }
    return `${unir(suma)}${resta.length ? `, ${resta.join(', ')}` : ''}`;
  };
  const valores = { izq: frases(ec.izq), der: frases(ec.der), otro: `<b>${otro}</b>` };
  const saludo = final ? rellenar(A.saludoFinal, { nombre }) : rellenar(t.saludo || A.saludo, { nombre });
  const primera = rellenar(elegir(t.intro), { ...valores, saludo });
  const igual = rellenar(elegir(t.igual), valores);
  return {
    historia: `<span>${primera}</span><span>${igual} <span class="c-guinda">${t.pregunta}</span></span>`,
    pregunta: t.pregunta,
    respuesta: t.respuesta,
    correcto: A.correcto,
    significado: t.significado
  };
}

// Historia de un reto con fracciones y paréntesis (Mundo 4), contada por un obrero de la obra.
// Una fracción a(x ± b)/den se cuenta como «corté el doble de (x + 1) metros en 3 partes iguales».
// Formas: fracción = número, fracción = fracción, y el desafío final a(x + b)/c + d = x − e.
function armarHistoriaFracciones(ec, tema, nombre, final) {
  const F = HISTORIAS.fracciones;
  const t = F.temas[tema];
  const datos = (term) => ({ veces: F.veces[term.a] || `${term.a} veces`, s: term.b < 0 ? '−' : '+', b: Math.abs(term.b), den: term.den });
  const fraseFrac = (term) => rellenar(term.a === 1 ? t.frac : t.fracA, datos(term));
  const fraseIgual = (term) => rellenar(term.a === 1 ? t.igualFrac : t.igualFracA, datos(term));
  const [f] = ec.izq;
  let cuerpo;
  if (ec.forma === 'final') {
    const valores = { frac: fraseFrac(f), d: ec.izq[1].c, e: Math.abs(ec.der[1].c) };
    cuerpo = plurales(rellenar(t.final, valores), valores);
  } else if (ec.der[0].t === 'n') {
    const valores = { n: ec.der[0].c };
    cuerpo = `${fraseFrac(f)}, y ${plurales(rellenar(t.igualNum, valores), valores)}`;
  } else {
    cuerpo = `${fraseFrac(f)}, y ${fraseIgual(ec.der[0])}`;
  }
  // primera letra en mayúscula (el cuerpo empieza con un verbo: «corté…» → «Corté…»)
  cuerpo = cuerpo.replace(/^(<[^>]+>)*([a-záéíóúñ])/, (m, etiqueta, letra) => `${etiqueta || ''}${letra.toUpperCase()}`);
  const saludo = rellenar(final ? F.saludoFinal : elegir(F.saludos), { nombre });
  return {
    historia: `<span>${saludo} ${cuerpo}.</span><span class="c-guinda">${t.pregunta}</span>`,
    pregunta: t.pregunta,
    respuesta: t.respuesta,
    correcto: F.correcto,
    significado: t.significado
  };
}

// Historia de un reto de fracción sobre fracción (Mundo 5 · la Feria). Cada tema está escrito para una
// forma (historias.json → fraccionFraccion.temas[tema].forma) y usa los números del reto: {a} {b} {c} {d}
// {e} {f}, {veces} («el doble de»), {partes} («quintos»), {arriba} y {total} (valores con la solución).
function armarHistoriaFraccionFraccion(ec, tema, nombre, final) {
  const H = HISTORIAS.fraccionFraccion;
  const t = H.temas[tema];
  const { a, b, c, d, e, f } = ec.p;
  const x = ec.x;
  const arriba = ec.forma === 'final' ? (x + a) / b - c : ec.forma === 'sobreNumero' ? x / a + b : '';
  const valores = { a, b, c, d, e, f, x, arriba, total: ec.d, veces: H.veces[b] || `${b} veces`, partes: H.partes[c] || `${c} partes` };
  const saludo = rellenar(final ? H.saludoFinal : elegir(H.saludos), { nombre });
  // un párrafo por parte; la pregunta va al final del último
  const parrafos = t.partes.map((p) => plurales(rellenar(p, { ...valores, saludo }), valores));
  parrafos[parrafos.length - 1] += ` <span class="c-guinda">${H.pregunta}</span>`;
  return {
    historia: parrafos.map((p) => `<span>${p}</span>`).join(''),
    pregunta: H.pregunta,
    respuesta: rellenar(t.respuesta, valores),
    correcto: H.correcto,
    bannerError: rellenar(t.bannerError || H.bannerError, valores)
  };
}

// tema: clave de historias.json → temas; final: saludo del último reto del mundo
// otro: nombre de otro personaje (historias del Mundo 3)
export function armarHistoria(ec, tema, nombre, { final = false, otro = 'mi vecino' } = {}) {
  if (ec.tipo === 'parentesis') return armarHistoriaParentesis(ec, tema, nombre, final);
  if (ec.tipo === 'ambos') return armarHistoriaAmbos(ec, tema, nombre, final, otro);
  if (ec.tipo === 'fracciones') return armarHistoriaFracciones(ec, tema, nombre, final);
  if (ec.tipo === 'fraccionFraccion') return armarHistoriaFraccionFraccion(ec, tema, nombre, final);
  const t = HISTORIAS.temas[tema];
  const positivos = [];
  const restas = [];
  let yaHayX = false;
  let yaHayNum = false;
  for (const term of ec.ladoX) {
    const c = Math.abs(term.c);
    if (term.c < 0) {
      restas.push(term.x ? rellenar(c === 1 ? t.restaX1 : t.restaXN, { c }) : rellenar(frase(t, 'restaNum', c), { n: c }));
    } else if (term.x) {
      const clave = yaHayX ? (c === 1 ? 'xMas1' : 'xMasN') : (c === 1 ? 'x1' : 'xN');
      positivos.push(`<b>${rellenar(t[clave], { c })}</b>`);
      yaHayX = true;
    } else {
      positivos.push(`<b>${rellenar(frase(t, yaHayNum ? 'numMas' : 'num', c), { n: c })}</b>`);
      yaHayNum = true;
    }
  }
  const derecha = ec.otro.map((term) => rellenar(t.unidadDer, { n: term.c }));
  const saludo = rellenar(final ? HISTORIAS.saludoFinal : HISTORIAS.saludo, { nombre });
  const primera = rellenar(elegir(t.intro), { saludo, lista: unir(positivos) });
  const igual = ec.otro.length === 1
    ? rellenar(elegir(t.igual1), { der: ec.otro[0].c })
    : rellenar(elegir(t.igualN), { der: unir(derecha) });
  return {
    historia: `<span>${primera}${restas.length ? ` ${restas.join(' ')}` : ''}</span><span>${igual} <span class="c-guinda">${t.pregunta}</span></span>`,
    pregunta: t.pregunta,
    respuesta: t.respuesta,
    correcto: HISTORIAS.correcto
  };
}
