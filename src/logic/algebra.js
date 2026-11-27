// Motor algebraico de las plantillas (versión 2.0).
// Lee una forma escrita como texto («ax + b = cx + d», «a(x + b)/c − (x − d)/e = f»,
// «(x/a + b) ÷ (c/d) = e»), la convierte en un árbol y sabe evaluarla con fracciones exactas,
// escribirla, expandirla (propiedad distributiva) y llevarla a la forma «Ax + B = Cx + D».
// No depende de Phaser: lo usan el juego, el validador y npm run probar-ejercicios.
//
// Sintaxis de las formas:
//   x            la incógnita
//   a … w, y, z  parámetros (números enteros positivos que elige el generador)
//   12           números fijos
//   + − -        suma y resta (un «−» al inicio cambia el signo del primer término)
//   ab, a(x + b) multiplicación implícita (también «*» o «·»)
//   /            fracción (se dibuja apilada: numerador, raya, denominador)
//   ÷            división entre una fracción (fracción sobre fracción)
//   ( ) [ ]      agrupación (se respetan al escribir la ecuación)
//
// Nodos del árbol:
//   { k: 'n', v }            número fijo
//   { k: 'p', id }           parámetro
//   { k: 'x' }               incógnita
//   { k: 's', t: [{ neg, e }] } suma de términos (neg = el término va restando)
//   { k: 'm', a, b }         producto
//   { k: 'f', a, b }         fracción a/b
//   { k: 'e', a, b }         división a ÷ b
//   { k: 'g', e, c }         grupo entre ( ) o [ ]

// ------------------------------------------------------------------ fracciones exactas
const mcdN = (a, b) => (b ? mcdN(b, a % b) : Math.abs(a));
export const mcd = mcdN;
export const mcm = (a, b) => Math.abs(a * b) / mcdN(a, b);

export function fr(n, d = 1) {
  if (d === 0) throw new Error('división entre cero');
  if (d < 0) { n = -n; d = -d; }
  const g = mcdN(n, d) || 1;
  return { n: n / g, d: d / g };
}
export const suma = (p, q) => fr(p.n * q.d + q.n * p.d, p.d * q.d);
export const resta = (p, q) => fr(p.n * q.d - q.n * p.d, p.d * q.d);
export const por = (p, q) => fr(p.n * q.n, p.d * q.d);
export const entre = (p, q) => fr(p.n * q.d, p.d * q.n);
export const igual = (p, q) => p.n * q.d === q.n * p.d;
export const esCero = (p) => p.n === 0;
export const esEntero = (p) => p.d === 1;
export const aNumero = (p) => p.n / p.d;

// Un número escrito por el alumno (2,5 → 5/2); se redondea a milésimas como en la validación
export function aFraccion(v) {
  if (typeof v === 'object') return v;
  if (Number.isInteger(v)) return fr(v);
  return fr(Math.round(v * 1000), 1000);
}

// «8/3», «−1/2», «4»
export function textoFr(p) {
  const s = p.d === 1 ? String(Math.abs(p.n)) : `${Math.abs(p.n)}/${p.d}`;
  return p.n < 0 ? `−${s}` : s;
}

// ------------------------------------------------------------------ lectura de la forma
const MENOS = new Set(['-', '−', '–']);

function tokens(texto) {
  const lista = [];
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (/\s/.test(c)) continue;
    if (/\d/.test(c)) {
      let j = i;
      while (j + 1 < texto.length && /\d/.test(texto[j + 1])) j++;
      lista.push({ t: 'n', v: Number(texto.slice(i, j + 1)) });
      i = j;
    } else if (c === 'x') lista.push({ t: 'x' });
    else if (/[a-z]/.test(c)) lista.push({ t: 'p', id: c });
    else if (c === '+') lista.push({ t: '+' });
    else if (MENOS.has(c)) lista.push({ t: '-' });
    else if (c === '*' || c === '·') lista.push({ t: '*' });
    else if (c === '/') lista.push({ t: '/' });
    else if (c === '÷' || c === ':') lista.push({ t: '÷' });
    else if ('()[]='.includes(c)) lista.push({ t: c });
    else throw new Error(`Carácter no válido en la forma: «${c}»`);
  }
  return lista;
}

export function leerForma(texto) {
  const lista = tokens(texto);
  let i = 0;
  const mira = () => lista[i];
  const toma = (t) => {
    if (!lista[i] || lista[i].t !== t) throw new Error(`Se esperaba «${t}» en «${texto}»`);
    return lista[i++];
  };
  const empiezaFactor = (tok) => tok && ['n', 'x', 'p', '(', '['].includes(tok.t);

  function factor() {
    const tok = mira();
    if (!tok) throw new Error(`Forma incompleta: «${texto}»`);
    if (tok.t === 'n') { i++; return { k: 'n', v: tok.v }; }
    if (tok.t === 'x') { i++; return { k: 'x' }; }
    if (tok.t === 'p') { i++; return { k: 'p', id: tok.id }; }
    if (tok.t === '(' || tok.t === '[') {
      i++;
      const e = expresion();
      toma(tok.t === '(' ? ')' : ']');
      return { k: 'g', e, c: tok.t };
    }
    throw new Error(`Algo falta en «${texto}»`);
  }

  function termino() {
    let nodo = factor();
    for (;;) {
      const tok = mira();
      if (tok && tok.t === '/') { i++; nodo = { k: 'f', a: nodo, b: factor() }; }
      else if (tok && tok.t === '÷') { i++; nodo = { k: 'e', a: nodo, b: factor() }; }
      else if (tok && tok.t === '*') { i++; nodo = { k: 'm', a: nodo, b: factor() }; }
      else if (empiezaFactor(tok)) nodo = { k: 'm', a: nodo, b: factor() };
      else return nodo;
    }
  }

  function expresion() {
    const t = [];
    let neg = false;
    if (mira() && (mira().t === '-' || mira().t === '+')) { neg = mira().t === '-'; i++; }
    t.push({ neg, e: termino() });
    while (mira() && (mira().t === '+' || mira().t === '-')) {
      neg = mira().t === '-';
      i++;
      t.push({ neg, e: termino() });
    }
    return t.length === 1 && !t[0].neg ? t[0].e : { k: 's', t };
  }

  const izq = expresion();
  toma('=');
  const der = expresion();
  if (i < lista.length) throw new Error(`Sobra algo al final de «${texto}»`);
  return { izq, der };
}

// Parámetros que aparecen en un árbol (en orden de aparición)
export function parametros(nodo, lista = []) {
  if (!nodo) return lista;
  if (nodo.k === 'p' && !lista.includes(nodo.id)) lista.push(nodo.id);
  if (nodo.k === 's') nodo.t.forEach((t) => parametros(t.e, lista));
  if (nodo.a) parametros(nodo.a, lista);
  if (nodo.b) parametros(nodo.b, lista);
  if (nodo.e) parametros(nodo.e, lista);
  return lista;
}

export function tieneX(nodo) {
  if (nodo.k === 'x') return true;
  if (nodo.k === 'n' || nodo.k === 'p') return false;
  if (nodo.k === 's') return nodo.t.some((t) => tieneX(t.e));
  if (nodo.k === 'g') return tieneX(nodo.e);
  return tieneX(nodo.a) || tieneX(nodo.b);
}

// ------------------------------------------------------------------ evaluación exacta
// X = valor de x (fracción), P = { a: 3, b: 5, … }
export function evaluar(nodo, X, P) {
  switch (nodo.k) {
    case 'n': return fr(nodo.v);
    case 'p': return fr(P[nodo.id]);
    case 'x': return X;
    case 'g': return evaluar(nodo.e, X, P);
    case 's': return nodo.t.reduce((acc, t) => {
      const v = evaluar(t.e, X, P);
      return t.neg ? resta(acc, v) : suma(acc, v);
    }, fr(0));
    case 'm': return por(evaluar(nodo.a, X, P), evaluar(nodo.b, X, P));
    case 'f':
    case 'e': return entre(evaluar(nodo.a, X, P), evaluar(nodo.b, X, P));
    default: throw new Error(`Nodo desconocido: ${nodo.k}`);
  }
}

// Recorre todos los nodos
export function recorrer(nodo, fn) {
  fn(nodo);
  if (nodo.k === 's') nodo.t.forEach((t) => recorrer(t.e, fn));
  if (nodo.k === 'g') recorrer(nodo.e, fn);
  if (nodo.a) recorrer(nodo.a, fn);
  if (nodo.b) recorrer(nodo.b, fn);
}

// ------------------------------------------------------------------ escritura en una línea
const esHoja = (n) => n.k === 'n' || n.k === 'p';
const valorHoja = (n, P) => (n.k === 'n' ? n.v : P[n.id]);

// Número del alumno dentro de una cuenta: los negativos van entre paréntesis
function numeroEnCuenta(X, formato) {
  const t = formato(X);
  return aNumero(X) < 0 ? `(${t})` : t;
}

// Escribe el árbol. Con opciones.X (fracción) reemplaza la x por ese número («3 · 5 + 2»).
// formato: cómo se escribe el número del alumno (por defecto como fracción exacta)
export function escribir(nodo, P, opciones = {}) {
  const { X = null, formato = textoFr } = opciones;
  const w = (n) => escribir(n, P, opciones);
  switch (nodo.k) {
    case 'n':
    case 'p': return String(valorHoja(nodo, P));
    case 'x': return X ? numeroEnCuenta(X, formato) : 'x';
    case 'g': return nodo.c === '[' ? `[${w(nodo.e)}]` : `(${w(nodo.e)})`;
    case 's': return nodo.t.map((t, i) => {
      const cuerpo = w(t.e);
      if (i === 0) return t.neg ? `−${cuerpo}` : cuerpo;
      return `${t.neg ? '−' : '+'} ${cuerpo}`;
    }).join(' ');
    case 'm': {
      if (esHoja(nodo.a)) {
        const k = valorHoja(nodo.a, P);
        const derecha = w(nodo.b);
        if (X) return k === 1 ? derecha : `${k} · ${derecha}`;
        if (k === 1 && (nodo.b.k === 'x' || nodo.b.k === 'g')) return derecha;
        return /^[(\[x]/.test(derecha) ? `${k}${derecha}` : `${k}·${derecha}`;
      }
      return `${w(nodo.a)} · ${w(nodo.b)}`;
    }
    case 'f': return `${w(nodo.a)}/${w(nodo.b)}`;
    case 'e': return `${w(nodo.a)} ÷ ${w(nodo.b)}`;
    default: return '';
  }
}

export function escribirEcuacion(arbol, P) {
  return `${escribir(arbol.izq, P)} = ${escribir(arbol.der, P)}`;
}

// ------------------------------------------------------------------ expansión (distributiva)
// Lista de términos sin paréntesis, término por término y sin juntar: [{ c: fracción, x: bool }]
// «3(x − 2) − (x + 4)» → 3x − 6 − x − 4. Si una división tiene la x abajo, lanza un error.
export function expandir(nodo, P) {
  const escala = (lista, k) => lista.map((t) => ({ c: por(t.c, k), x: t.x }));
  switch (nodo.k) {
    case 'n':
    case 'p': return [{ c: fr(valorHoja(nodo, P)), x: false }];
    case 'x': return [{ c: fr(1), x: true }];
    case 'g': return expandir(nodo.e, P);
    case 's': return nodo.t.flatMap((t) => (t.neg ? escala(expandir(t.e, P), fr(-1)) : expandir(t.e, P)));
    case 'm': {
      if (!tieneX(nodo.a)) return escala(expandir(nodo.b, P), evaluar(nodo.a, fr(0), P));
      if (!tieneX(nodo.b)) return escala(expandir(nodo.a, P), evaluar(nodo.b, fr(0), P));
      throw new Error('x por x: no es de primer grado');
    }
    case 'f':
    case 'e': {
      if (tieneX(nodo.b)) throw new Error('x en el denominador');
      return escala(expandir(nodo.a, P), entre(fr(1), evaluar(nodo.b, fr(0), P)));
    }
    default: return [];
  }
}

// Junta los términos: { A, B } = Ax + B
export function reducir(lista) {
  return lista.reduce((acc, t) => (t.x ? { A: suma(acc.A, t.c), B: acc.B } : { A: acc.A, B: suma(acc.B, t.c) }), { A: fr(0), B: fr(0) });
}

// «3x», «x», «x/3», «2x/3»; «5», «5/2»
function cuerpoTermino(c, x) {
  const n = Math.abs(c.n);
  if (!x) return c.d === 1 ? String(n) : `${n}/${c.d}`;
  const arriba = n === 1 ? 'x' : `${n}x`;
  return c.d === 1 ? arriba : `${arriba}/${c.d}`;
}

// Lista de términos como texto: «3x − 6 − x − 4» (sin términos 0)
export function textoTerminos(lista) {
  const sinCeros = lista.filter((t) => !esCero(t.c));
  if (!sinCeros.length) return '0';
  return sinCeros.map((t, i) => {
    const cuerpo = cuerpoTermino(t.c, t.x);
    if (i === 0) return t.c.n < 0 ? `−${cuerpo}` : cuerpo;
    return `${t.c.n < 0 ? '−' : '+'} ${cuerpo}`;
  }).join(' ');
}

export const textoLineal = ({ A, B }) => textoTerminos([{ c: A, x: true }, { c: B, x: false }]);

// Denominadores de una lista de términos
export const denominadores = (lista) => [...new Set(lista.map((t) => t.c.d).filter((d) => d > 1))];
