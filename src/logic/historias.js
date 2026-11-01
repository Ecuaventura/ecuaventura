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

// tema: clave de historias.json → temas; final: saludo del último reto del mundo
export function armarHistoria(ec, tema, nombre, { final = false } = {}) {
  if (ec.tipo === 'parentesis') return armarHistoriaParentesis(ec, tema, nombre, final);
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
