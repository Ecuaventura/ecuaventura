// Ecuaciones con términos semejantes (Mundo 1 · 1.° de secundaria).
// Cada ecuación tiene un "lado de las x" y un "otro lado" (solo números).
// Un término es { c, x } → c·x si x = true, o el número c. c puede ser negativo (resta).
// Se elige primero la solución x (entera de 1 a 12) y se construye la ecuación a partir de ella.

const azar = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Ordena al azar, sin empezar con una resta (no se escribe "− 1 + x…")
function ordenar(terminos) {
  for (let i = 0; i < 20; i++) {
    const t = mezclar(terminos);
    if (t[0].c > 0) return t;
  }
  return [...terminos].sort((a, b) => b.c - a.c);
}

// Parte un número total en dos sumandos positivos
function partir(total) {
  const a = azar(1, total - 1);
  return [{ c: a, x: false }, { c: total - a, x: false }];
}

// Formas de cada nivel. Devuelven { ladoX, otro } con la solución x ya elegida.
const FORMAS = {
  // Nivel 1: x + 2x = 9 (solo términos con x)
  n1(x) {
    const cuantos = azar(2, 3);
    const coefs = Array.from({ length: cuantos }, (_, i) => azar(1, i === 0 ? 3 : 5));
    const ladoX = coefs.map((c) => ({ c, x: true }));
    const total = coefs.reduce((s, c) => s + c, 0);
    return { ladoX: ordenar(ladoX), otro: [{ c: total * x, x: false }] };
  },
  // Nivel 2: x + 3x + 2 = 14 (x + número)
  n2(x) {
    const ladoX = [{ c: azar(1, 3), x: true }, { c: azar(1, 5), x: true }, { c: azar(1, 15), x: false }];
    return { ladoX: ordenar(ladoX), otro: [{ c: valor(ladoX, x), x: false }] };
  },
  // Nivel 3 y 5: 3 + x + 4x − 1 = 2 + 10 (números en ambos lados)
  n3(x) {
    const n1 = azar(2, 9);
    const ladoX = [{ c: n1, x: false }, { c: 1, x: true }, { c: azar(2, 5), x: true }, { c: -azar(1, n1 - 1), x: false }];
    return { ladoX: ordenar(ladoX), otro: partir(valor(ladoX, x)) };
  },
  // Nivel 4: 5x − 2x + 4 = 19 (resta de términos con x)
  n4(x) {
    const a = azar(3, 8);
    // quedan al menos 2x, para que despejar no sea trivial
    const ladoX = [{ c: a, x: true }, { c: -azar(1, a - 2), x: true }, { c: azar(1, 15), x: false }];
    return { ladoX: ordenar(ladoX), otro: [{ c: valor(ladoX, x), x: false }] };
  }
};

export const FORMAS_TERMINOS = Object.keys(FORMAS);

// Valor de una lista de términos con x = v
export function valor(terminos, v) {
  return terminos.reduce((s, t) => s + (t.x ? t.c * v : t.c), 0);
}

export function coefTotal(terminos) {
  return terminos.filter((t) => t.x).reduce((s, t) => s + t.c, 0);
}

// Construye la ecuación. invertida = el lado de las x se escribe a la derecha.
export function generarTerminos(forma, rangos = {}) {
  const [xMin, xMax] = rangos.x || [1, 12];
  const x = azar(xMin, xMax);
  const { ladoX, otro } = FORMAS[forma](x);
  // en los niveles 1, 2 y 4 a veces los números van a la izquierda: 9 = x + 2x
  const invertida = forma !== 'n3' && Math.random() < 0.3;
  const d = valor(otro, 0);
  return { tipo: 'terminos', forma, x, ladoX, otro, invertida, d, a: coefTotal(ladoX), b: valor(ladoX, 0) };
}

// "4x", "x", "−2x", "3"
function textoTermino(t, primero) {
  const abs = Math.abs(t.c);
  const cuerpo = t.x ? (abs === 1 ? 'x' : `${abs}x`) : String(abs);
  if (primero) return t.c < 0 ? `−${cuerpo}` : cuerpo;
  return `${t.c < 0 ? '−' : '+'} ${cuerpo}`;
}

export function textoLado(terminos) {
  return terminos.map((t, i) => textoTermino(t, i === 0)).join(' ');
}

export function textoTerminos(ec) {
  const izq = textoLado(ec.ladoX);
  const der = textoLado(ec.otro);
  return ec.invertida ? `${der} = ${izq}` : `${izq} = ${der}`;
}

// Lado de las x con un valor: "3 + 5 + 4 · 5 − 1 = 27"
export function comprobacionTerminos(ec, v, formato = String) {
  const partes = ec.ladoX.map((t, i) => {
    const abs = Math.abs(t.c);
    const cuerpo = t.x ? (abs === 1 ? formato(v) : `${abs} · ${formato(v)}`) : String(abs);
    if (i === 0) return t.c < 0 ? `−${cuerpo}` : cuerpo;
    return `${t.c < 0 ? '−' : '+'} ${cuerpo}`;
  });
  return `${partes.join(' ')} = ${formato(valor(ec.ladoX, v))}`;
}

// Clave para no repetir ecuaciones (mismo texto = misma ecuación)
export function claveTerminos(ec) {
  return textoTerminos(ec).replace(/\s+/g, '');
}

// "x + 4x = 5x" (primer paso: juntar las x)
export function juntarX(ec) {
  const xs = ec.ladoX.filter((t) => t.x);
  const total = coefTotal(ec.ladoX);
  return `${textoLado(xs)} = ${total === 1 ? 'x' : `${total}x`}`;
}

// Fichas para el panel: [{ texto, clase: 'x' | 'n' | 'op' }]
export function fichas(ec) {
  const lado = (terminos) => terminos.flatMap((t, i) => {
    const abs = Math.abs(t.c);
    const ficha = { texto: t.x ? (abs === 1 ? 'x' : `${abs}x`) : String(abs), clase: t.x ? 'x' : 'n' };
    if (i === 0) return t.c < 0 ? [{ texto: '−', clase: 'op' }, ficha] : [ficha];
    return [{ texto: t.c < 0 ? '−' : '+', clase: 'op' }, ficha];
  });
  const [a, b] = ec.invertida ? [ec.otro, ec.ladoX] : [ec.ladoX, ec.otro];
  return [...lado(a), { texto: '=', clase: 'op' }, ...lado(b)];
}
