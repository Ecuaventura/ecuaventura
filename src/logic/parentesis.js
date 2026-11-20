// Ecuaciones con paréntesis (Mundo 2 · 2.° de secundaria).
// Forma general: a(kx + b) + c = d, con b y c con signo (resta = negativo).
// Se elige primero la solución x (entera de 1 a 12) y se construye la ecuación a partir de ella.

const azar = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Formas de cada nivel. Devuelven { a, k, b, c } con la solución x ya elegida.
const FORMAS = {
  // Nivel 6: a(x + b) = d        ej. 2(x + 3) = 14
  mas: () => ({ a: azar(2, 5), k: 1, b: azar(1, 9), c: 0 }),
  // Nivel 7: a(x − b) = d        ej. 3(x − 2) = 12   (x − b ≥ 1)
  menos: (x) => ({ a: azar(2, 5), k: 1, b: -azar(1, x - 1), c: 0 }),
  // Nivel 8 y 10: a(x + b) + c = d   ej. 2(x + 4) + 3 = 19
  masC: () => ({ a: azar(2, 4), k: 1, b: azar(1, 9), c: azar(1, 12) }),
  // Nivel 9: a(x − b) − c = d    ej. 4(x − 1) − 2 = 18   (el total queda ≥ 1)
  menosC: (x) => {
    const a = azar(2, 4);
    const b = azar(1, x - 1);
    return { a, k: 1, b: -b, c: -azar(1, Math.min(12, a * (x - b) - 1)) };
  },
  // Nivel 9: a(kx + b) = d       ej. 2(3x + 1) = 26
  k: () => ({ a: azar(2, 4), k: azar(2, 4), b: azar(1, 9), c: 0 })
};

export const FORMAS_PARENTESIS = Object.keys(FORMAS);

// las formas con resta adentro necesitan x ≥ 2
const MIN_X = { menos: 2, menosC: 2 };

export function valorParentesis(ec, v) {
  return ec.a * (ec.k * v + ec.b) + ec.c;
}

export function generarParentesis(forma, rangos = {}) {
  const [xMin, xMax] = rangos.x || [1, 12];
  const x = azar(Math.max(xMin, MIN_X[forma] || 1), xMax);
  const { a, k, b, c } = FORMAS[forma](x);
  const ec = { tipo: 'parentesis', forma, x, a, k, b, c, invertida: Math.random() < 0.25 };
  ec.d = valorParentesis(ec, x);
  return ec;
}

const signo = (n) => (n < 0 ? '−' : '+');
const xTexto = (k) => (k === 1 ? 'x' : `${k}x`);

// "x + 3", "3x + 1", "x − 2"
export function adentro(ec) {
  return `${xTexto(ec.k)} ${signo(ec.b)} ${Math.abs(ec.b)}`;
}

// "2(x + 4) + 3"
export function ladoParentesis(ec) {
  const fuera = ec.c ? ` ${signo(ec.c)} ${Math.abs(ec.c)}` : '';
  return `${ec.a}(${adentro(ec)})${fuera}`;
}

export function textoParentesis(ec) {
  return ec.invertida ? `${ec.d} = ${ladoParentesis(ec)}` : `${ladoParentesis(ec)} = ${ec.d}`;
}

// "2 · (5 + 3) + 3 = 19"
export function comprobacionParentesis(ec, v, formato = String) {
  const xv = ec.k === 1 ? formato(v) : `${ec.k} · ${formato(v)}`;
  const fuera = ec.c ? ` ${signo(ec.c)} ${Math.abs(ec.c)}` : '';
  return `${ec.a} · (${xv} ${signo(ec.b)} ${Math.abs(ec.b)})${fuera} = ${formato(valorParentesis(ec, v))}`;
}

export function claveParentesis(ec) {
  return textoParentesis(ec).replace(/\s+/g, '');
}

// "2(x + 3) = 2x + 6"
export function expandir(ec) {
  const ab = ec.a * ec.b;
  return `${ec.a}(${adentro(ec)}) = ${xTexto(ec.a * ec.k)} ${signo(ab)} ${Math.abs(ab)}`;
}

// Chip del paso 1: "1. Multiplica: 2·x + 2·3"
export function pasoMultiplicar(ec) {
  return `1. Multiplica: ${ec.a}·${xTexto(ec.k)} ${signo(ec.b)} ${ec.a}·${Math.abs(ec.b)}`;
}

// Fichas para el panel: número a, paréntesis grandes, x en azul, números en amarillo
export function fichasParentesis(ec) {
  const izq = [
    { texto: String(ec.a), clase: 'n' },
    { texto: '(', clase: 'paren' },
    { texto: xTexto(ec.k), clase: 'x' },
    { texto: signo(ec.b), clase: 'op' },
    { texto: String(Math.abs(ec.b)), clase: 'n' },
    { texto: ')', clase: 'paren' }
  ];
  if (ec.c) izq.push({ texto: signo(ec.c), clase: 'op' }, { texto: String(Math.abs(ec.c)), clase: 'n' });
  const der = [{ texto: String(ec.d), clase: 'n' }];
  return ec.invertida
    ? [...der, { texto: '=', clase: 'op' }, ...izq]
    : [...izq, { texto: '=', clase: 'op' }, ...der];
}
