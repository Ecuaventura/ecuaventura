// Fracción sobre fracción (Mundo 5 · 5.° de secundaria), con todo lo anterior.
// Se elige primero la solución x (entera de 1 a 15) y se construye la ecuación a partir de ella.
// Formas de cada nivel (los números de los comentarios son solo ejemplo):
//   N21 sobreNumero  (x/a + b) ÷ (c/d) = e                 (x/2 + 1) ÷ (3/4) = 4
//   N22 sobreParen   (x − a) ÷ (1/b) = c(x − d)            (x − 1) ÷ (1/2) = 3(x − 3)
//   N23 sobreFrac    (x/a) ÷ (b/c) = (x + d)/e             (x/3) ÷ (1/2) = (x + 2)/2
//   N24 simplifica   [b(x + a)/c] ÷ (1/c) = x + d          [2(x + 3)/5] ÷ (1/5) = x + 9
//   N25 final        [(x + a)/b − c] ÷ (1/d) = e(x − f)    [(x + 1)/2 − 1] ÷ (1/4) = 3(x − 3)
// Todas las divisiones dan exacto con la solución (x/a, la fracción de arriba y el resultado), nunca se
// divide entre 0, los denominadores son ≥ 2 y hay una sola solución.
// La ecuación es { tipo: 'fraccionFraccion', forma, x, p: { a, b, … }, d } (d = valor del lado derecho).
// Las cuentas se hacen con fracciones exactas ({ n, d }) para mostrar «8/3» y no «2,667».

const azar = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));

// ------------------------------------------------------------------ fracciones exactas
export function fr(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = mcd(n, d) || 1;
  return { n: n / g, d: d / g };
}
const suma = (p, q) => fr(p.n * q.d + q.n * p.d, p.d * q.d);
const resta = (p, q) => fr(p.n * q.d - q.n * p.d, p.d * q.d);
const por = (p, q) => fr(p.n * q.n, p.d * q.d);
const entre = (p, q) => fr(p.n * q.d, p.d * q.n);
const igual = (p, q) => p.n * q.d === q.n * p.d;
export const aNumero = (p) => p.n / p.d;

// Un número escrito por el alumno (2,5 → 5/2); se redondea a milésimas como en la validación
export function aFraccion(v) {
  if (Number.isInteger(v)) return fr(v);
  return fr(Math.round(v * 1000), 1000);
}

// «8/3», «−1/2», «4»
export function textoFr(p) {
  const s = p.d === 1 ? String(Math.abs(p.n)) : `${Math.abs(p.n)}/${p.d}`;
  return p.n < 0 ? `−${s}` : s;
}

// ------------------------------------------------------------------ formas
// Reciben x y devuelven los números { a, b, … } o null si esos números no sirven
const FORMAS = {
  sobreNumero: (x) => {
    const a = azar(2, 5);
    if (x % a) return null;
    const b = azar(1, 6);
    const c = azar(1, 5);
    const d = azar(2, 6);
    const arriba = x / a + b;
    // c/d en su forma más simple y distinto de 1; el resultado e = arriba · d/c debe ser entero
    if (mcd(c, d) !== 1 || arriba % c) return null;
    const e = (arriba * d) / c;
    return e <= 40 ? { a, b, c, d, e } : null;
  },
  sobreParen: (x) => {
    if (x < 2) return null;
    const a = azar(1, x - 1);
    const b = azar(2, 5);
    const c = azar(2, 6);
    // b ≠ c: si no, habría infinitas soluciones o ninguna
    if (b === c || (b * (x - a)) % c) return null;
    const d = x - (b * (x - a)) / c;
    return d >= 1 && d < x ? { a, b, c, d } : null;
  },
  sobreFrac: (x) => {
    const a = azar(2, 5);
    if (x % a) return null;
    const b = azar(1, 5);
    const c = azar(2, 6);
    const e = azar(2, 6);
    const q = x / a;
    // b/c simplificada y distinta de 1; el lado izquierdo (q · c/b) entero; c/(ab) ≠ 1/e (una sola solución)
    if (mcd(b, c) !== 1 || q % b || c * e === a * b) return null;
    const valor = (q * c) / b;
    const d = e * valor - x;
    return d >= 1 && d <= 30 ? { a, b, c, d, e } : null;
  },
  simplifica: (x) => {
    const b = azar(2, 4);
    const a = azar(1, 9);
    const c = azar(2, 7);
    // b y c sin factor común: la fracción de arriba da exacto solo si (x + a) se divide entre c
    if (mcd(b, c) !== 1 || (x + a) % c) return null;
    const d = b * (x + a) - x;
    return d >= 1 && d <= 40 ? { a, b, c, d } : null;
  },
  final: (x) => {
    const b = azar(2, 4);
    const a = azar(1, 9);
    if ((x + a) % b) return null;
    const c = azar(1, 5);
    const arriba = (x + a) / b - c;
    if (arriba < 1) return null;
    const d = azar(2, 5);
    const e = azar(2, 6);
    // d/b ≠ e: una sola solución
    if (d === e * b || (arriba * d) % e) return null;
    const f = x - (arriba * d) / e;
    return f >= 1 && f < x ? { a, b, c, d, e, f } : null;
  }
};

export const FORMAS_FRACCION_FRACCION = Object.keys(FORMAS);

// Valor de cada lado con un valor de x (fracción exacta)
function lados(ec, v) {
  const { a, b, c, d, e, f } = ec.p;
  const X = typeof v === 'object' ? v : aFraccion(v);
  switch (ec.forma) {
    case 'sobreNumero': return [entre(suma(entre(X, fr(a)), fr(b)), fr(c, d)), fr(e)];
    case 'sobreParen': return [entre(resta(X, fr(a)), fr(1, b)), por(fr(c), resta(X, fr(d)))];
    case 'sobreFrac': return [entre(entre(X, fr(a)), fr(b, c)), entre(suma(X, fr(d)), fr(e))];
    case 'simplifica': return [entre(entre(por(fr(b), suma(X, fr(a))), fr(c)), fr(1, c)), suma(X, fr(d))];
    case 'final': return [entre(resta(entre(suma(X, fr(a)), fr(b)), fr(c)), fr(1, d)), por(fr(e), resta(X, fr(f)))];
    default: throw new Error(`Forma desconocida: ${ec.forma}`);
  }
}

export function ladoIzquierdo(ec, v) {
  return aNumero(lados(ec, v)[0]);
}
export function ladoDerecho(ec, v) {
  return aNumero(lados(ec, v)[1]);
}

export function generarFraccionFraccion(forma, rangos = {}) {
  if (!FORMAS[forma]) throw new Error(`Forma desconocida: ${forma}`);
  const [xMin, xMax] = rangos.x || [1, 15];
  for (let intento = 0; intento < 5000; intento++) {
    const x = azar(xMin, xMax);
    const p = FORMAS[forma](x);
    if (!p) continue;
    const ec = { tipo: 'fraccionFraccion', forma, x, p };
    ec.d = ladoDerecho(ec, x);
    return ec;
  }
  throw new Error(`No se pudo generar la forma ${forma}`);
}

// ¿Todas las divisiones dan exacto con la solución, sin dividir entre 0 y con denominadores ≥ 2?
// (lo usan npm run validar-niveles y npm run probar-ejercicios)
export function divisionesExactas(ec) {
  const { a, b, c, d, e, f } = ec.p;
  const x = ec.x;
  const [L, R] = lados(ec, x);
  if (!igual(L, R) || L.d !== 1) return false;
  switch (ec.forma) {
    case 'sobreNumero': return a >= 2 && d >= 2 && c >= 1 && mcd(c, d) === 1 && x % a === 0 && (x / a + b) % c === 0;
    case 'sobreParen': return b >= 2 && c >= 2 && b !== c && (b * (x - a)) % c === 0;
    case 'sobreFrac': return a >= 2 && c >= 2 && b >= 1 && e >= 2 && mcd(b, c) === 1 && x % a === 0 && (x / a) % b === 0 && (x + d) % e === 0;
    case 'simplifica': return b >= 2 && c >= 2 && (b * (x + a)) % c === 0;
    case 'final': return b >= 2 && d >= 2 && e >= 2 && (x + a) % b === 0 && (x + a) / b - c >= 1 && ((((x + a) / b - c) * d) % e) === 0;
    default: return false;
  }
}

// ¿Con otro número los lados ya no coinciden? (una sola solución)
export function unaSolucion(ec) {
  const [L, R] = lados(ec, ec.x + 1);
  return !igual(L, R);
}

// ------------------------------------------------------------------ textos
// Texto en una línea (para comparar ecuaciones y el «Ver ejemplo»): «(x/3 + 1) ÷ (1/2) = 6»
export function textoFraccionFraccion(ec) {
  const { a, b, c, d, e, f } = ec.p;
  switch (ec.forma) {
    case 'sobreNumero': return `(x/${a} + ${b}) ÷ (${c}/${d}) = ${e}`;
    case 'sobreParen': return `(x − ${a}) ÷ (1/${b}) = ${c}(x − ${d})`;
    case 'sobreFrac': return `(x/${a}) ÷ (${b}/${c}) = (x + ${d})/${e}`;
    case 'simplifica': return `[${b}(x + ${a})/${c}] ÷ (1/${c}) = x + ${d}`;
    case 'final': return `[(x + ${a})/${b} − ${c}] ÷ (1/${d}) = ${e}(x − ${f})`;
    default: return '';
  }
}

export function claveFraccionFraccion(ec) {
  return textoFraccionFraccion(ec).replace(/\s+/g, '');
}

// Lados que son solo un número (el «= 4» del nivel 21)
export const derechaEsNumero = (ec) => ec.forma === 'sobreNumero';

// Cuentas de la comprobación con un valor v (diseños 504 y 505): [cuenta de la izquierda, cuenta de la derecha]
// «(4/2 + 1) ÷ 3/4 = 3 · 4/3 = 4» · «c(v − d) = R». formato = cómo se escribe el número del alumno.
export function cuentasLados(ec, v, formato = String) {
  const { a, b, c, d, e, f } = ec.p;
  const fv = formato(v);
  const [L, R] = lados(ec, v);
  const t = textoFr;
  const X = aFraccion(v);
  switch (ec.forma) {
    case 'sobreNumero': {
      const arriba = suma(entre(X, fr(a)), fr(b));
      const inv = c === 1 ? `${d}` : `${d}/${c}`;
      return [`${fv}/${a} + ${b} = ${t(arriba)}`, `${t(arriba)} ÷ ${c}/${d} = ${t(arriba)} · ${inv} = ${t(L)}`];
    }
    case 'sobreParen': return [`(${fv} − ${a}) ÷ 1/${b} = (${fv} − ${a}) · ${b} = ${t(L)}`, `${c}(${fv} − ${d}) = ${t(R)}`];
    case 'sobreFrac': return [`${fv}/${a} ÷ ${b}/${c} = ${t(entre(X, fr(a)))} · ${invertida(b, c)} = ${t(L)}`, `(${fv} + ${d})/${e} = ${t(R)}`];
    case 'simplifica': return [`${b}(${fv} + ${a})/${c} ÷ 1/${c} = ${b}(${fv} + ${a}) = ${t(L)}`, `${fv} + ${d} = ${t(R)}`];
    case 'final': {
      const arriba = resta(entre(suma(X, fr(a)), fr(b)), fr(c));
      return [`(${fv} + ${a})/${b} − ${c} = ${t(arriba)} → ${t(arriba)} · ${d} = ${t(L)}`, `${e}(${fv} − ${f}) = ${t(R)}`];
    }
    default: return ['', ''];
  }
}

// Valores de los lados como texto («8/3») para el panel
export function valoresLados(ec, v) {
  return lados(ec, v).map(textoFr);
}

// «(4/2 + 1) ÷ 3/4 = 4» o «(7 − 1) ÷ 1/2 = 12 y 3(7 − 3) = 12» (texto de «¡Exacto!» y de la pista)
export function comprobacionFraccionFraccion(ec, v, formato = String) {
  const [L, R] = valoresLados(ec, v);
  const fv = formato(v);
  const { a, b, c, d, e, f } = ec.p;
  switch (ec.forma) {
    case 'sobreNumero': return `(${fv}/${a} + ${b}) ÷ ${c}/${d} = ${L}`;
    case 'sobreParen': return `(${fv} − ${a}) ÷ 1/${b} = ${L} y ${c}(${fv} − ${d}) = ${R}`;
    case 'sobreFrac': return `(${fv}/${a}) ÷ ${b}/${c} = ${L} y (${fv} + ${d})/${e} = ${R}`;
    case 'simplifica': return `[${b}(${fv} + ${a})/${c}] ÷ 1/${c} = ${L} y ${fv} + ${d} = ${R}`;
    case 'final': return `[(${fv} + ${a})/${b} − ${c}] ÷ 1/${d} = ${L} y ${e}(${fv} − ${f}) = ${R}`;
    default: return '';
  }
}

// ------------------------------------------------------------------ pasos y pista
const invertida = (c, d) => (c === 1 ? `${d}` : `${d}/${c}`);

// Chips de PASOS del panel (diseños 503, 508, 511 y 512)
export function pasosFraccionFraccion(ec) {
  const { a, b, c, d } = ec.p;
  switch (ec.forma) {
    case 'sobreNumero': return [`1. Dividir entre ${c}/${d} = multiplicar por ${invertida(c, d)}`, '2. Quita la fracción de x', '3. Despeja x'];
    case 'sobreParen': return [`1. Dividir entre 1/${b} = multiplicar por ${b}`, '2. Quita paréntesis', '3. Despeja x'];
    case 'sobreFrac': return [`1. Dividir entre ${b}/${c} = multiplicar por ${invertida(b, c)}`, '2. Quita la fracción de x', '3. Despeja x'];
    case 'simplifica': return [`1. Dividir entre 1/${c} = multiplicar por ${c}`, `2. Simplifica el ${c}`, '3. Despeja x'];
    case 'final': {
      const k = a - b * c;
      const dentro = k === 0 ? 'x' : `(x${k < 0 ? '−' : '+'}${Math.abs(k)})`;
      return [`1. (x+${a})/${b} − ${c} = ${dentro}/${b}`, `2. Multiplica por ${d}`, '3. Despeja x'];
    }
    default: return [];
  }
}

const xTexto = (n) => (n === 1 ? 'x' : `${n}x`);
const conSigno = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);
const lineal = (A, B) => `${xTexto(A)}${B ? ` ${conSigno(B)}` : ''}`;

// Las x al lado que tiene más y los números al otro: { lado, xs, nums, coefx } (como en el Mundo 4)
function juntar(A1, B1, A2, B2) {
  const [conX, sinX, lado] = A1 > A2 ? [[A1, B1], [A2, B2], 'izquierda'] : [[A2, B2], [A1, B1], 'derecha'];
  const xs = `${xTexto(conX[0])} − ${xTexto(sinX[0])}`;
  const nums = conX[1] === 0 ? String(sinX[1]).replace('-', '−') : `${String(sinX[1]).replace('-', '−')} ${conX[1] < 0 ? '+' : '−'} ${Math.abs(conX[1])}`;
  return { lado, xs, nums, coefx: xTexto(conX[0] - sinX[0]) };
}

// Datos de la pista de Ecu con los números del reto (nunca da x). Con una respuesta: L y R.
// Devuelve { clave, …valores }: la clave elige el texto de pistas.json → fraccionFraccion.
export function datosPistaFraccionFraccion(ec, ultima = null) {
  const { a, b, c, d, e, f } = ec.p;
  let datos;
  switch (ec.forma) {
    case 'sobreNumero': {
      const T = (e * c) / d;
      datos = { clave: 'sobreNumero', frac: `${c}/${d}`, inv: invertida(c, d), arriba: `${e} · ${c}/${d} = ${T}`, queda: `x/${a} + ${b} = ${T}`, b, a };
      break;
    }
    case 'sobreParen':
      datos = { clave: 'sobreParen', frac: `1/${b}`, inv: `${b}`, multiplica: `${b}(x − ${a}) = ${c}(x − ${d})`, sinPar: `${lineal(b, -a * b)} = ${lineal(c, -c * d)}`, ...juntar(b, -a * b, c, -c * d) };
      break;
    case 'sobreFrac': {
      const izq = c === 1 ? `x/${a * b}` : `${c}x/${a * b}`;
      datos = { clave: 'sobreFrac', frac: `${b}/${c}`, inv: invertida(b, c), multiplica: `${izq} = (x + ${d})/${e}`, cruz: `${xTexto(e * c)} = ${a * b}(x + ${d})`, ...juntar(e * c, 0, a * b, a * b * d) };
      break;
    }
    case 'simplifica':
      datos = { clave: 'simplifica', frac: `1/${c}`, inv: `${c}`, c, multiplica: `${b}(x + ${a}) = x + ${d}`, sinPar: `${lineal(b, a * b)} = x + ${d}`, ...juntar(b, a * b, 1, d) };
      break;
    case 'final': {
      const k = a - b * c;
      const dentro = k === 0 ? 'x' : `(x ${conSigno(k)})`;
      datos = { clave: 'final', arriba: `(x + ${a})/${b} − ${c} = ${dentro}/${b}`, d, b, multiplica: `${d}${k === 0 ? 'x' : dentro} = ${b * e}(x − ${f})`, ...juntar(d, d * k, b * e, -b * e * f) };
      break;
    }
    default: datos = { clave: ec.forma };
  }
  if (ultima !== null) {
    const [L, R] = valoresLados(ec, ultima);
    Object.assign(datos, { L, R });
  }
  return datos;
}
