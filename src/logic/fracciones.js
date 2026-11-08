// Ecuaciones con fracciones y paréntesis (Mundo 4 · 4.° de secundaria).
// Cada lado es una lista de términos:
//   { t: 'f', a, b, den }  a(x + b)/den   (a = 1 sin número delante; b con signo; den ≥ 2)
//   { t: 'x', c }          cx
//   { t: 'n', c }          número
// Se elige primero la solución x (entera de 1 a 15) y se construye la ecuación a partir de ella,
// de modo que cada fracción dé exacto con la solución y nunca haya un denominador 0 o 1.
// La ecuación es { tipo: 'fracciones', forma, x, izq, der, invertida, d } (d = valor de cada lado con la solución).

const azar = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));

const frac = (a, b, den) => ({ t: 'f', a, b, den });
const conX = (c) => ({ t: 'x', c });
const num = (c) => ({ t: 'n', c });

// Formas de cada nivel. Reciben x y devuelven { izq, der } o null si esos números no sirven.
const FORMAS = {
  // Nivel 16: (x + a)/b = c                ej. (x + 4)/3 = 5
  simple: (x) => {
    const den = azar(2, 6);
    const b = azar(1, 9);
    if ((x + b) % den) return null;
    return { izq: [frac(1, b, den)], der: [num((x + b) / den)] };
  },
  // Nivel 17: a(x + b)/c = d               ej. 2(x + 1)/3 = 6
  par: (x) => {
    const a = azar(2, 5);
    const den = azar(2, 7);
    const b = azar(1, 9);
    // a y c sin factor común: la fracción no se simplifica sola
    if (mcd(a, den) !== 1 || (x + b) % den) return null;
    return { izq: [frac(a, b, den)], der: [num((a * (x + b)) / den)] };
  },
  // Nivel 18: (x + a)/b = (x + c)/d        ej. (x + 1)/2 = (x + 4)/3
  dosFrac: (x) => {
    const den1 = azar(2, 6);
    const den2 = azar(2, 6);
    const b = azar(1, 9);
    if (den1 === den2 || (x + b) % den1) return null;
    const c = den2 * ((x + b) / den1) - x;
    return c >= 1 && c <= 15 && c !== b ? { izq: [frac(1, b, den1)], der: [frac(1, c, den2)] } : null;
  },
  // Nivel 19: a(x + b)/c = (x + d)/e       ej. 2(x + 1)/3 = (x + 3)/2
  parDos: (x) => {
    const a = azar(2, 4);
    const den1 = azar(2, 7);
    const den2 = azar(2, 6);
    const b = azar(1, 9);
    // a/c ≠ 1/e (si no, habría infinitas soluciones o ninguna)
    if (mcd(a, den1) !== 1 || den1 === den2 || a * den2 === den1 || (x + b) % den1) return null;
    const d = den2 * ((a * (x + b)) / den1) - x;
    return d >= 1 && d <= 20 ? { izq: [frac(a, b, den1)], der: [frac(1, d, den2)] } : null;
  },
  // Nivel 20 (desafío final): a(x + b)/c + d = x − e     ej. 2(x + 3)/5 + 1 = x − 2
  final: (x) => {
    const a = azar(2, 3);
    const den = azar(a + 1, 7);
    const b = azar(1, 9);
    if (mcd(a, den) !== 1 || (x + b) % den) return null;
    const k = (a * (x + b)) / den;
    if (x - k - 1 < 1) return null;
    const e = azar(1, x - k - 1);
    const d = x - e - k;
    return { izq: [frac(a, b, den), num(d)], der: [conX(1), num(-e)] };
  }
};

export const FORMAS_FRACCIONES = Object.keys(FORMAS);

// el desafío final necesita x − e ≥ 1 con algo de margen
const MIN_X = { final: 4 };
// las historias del desafío final se escriben en orden: no se invierten
const SIN_INVERTIR = ['final'];

export function valorLado(lado, v) {
  return lado.reduce((suma, t) => suma + (t.t === 'f' ? (t.a * (v + t.b)) / t.den : t.t === 'x' ? t.c * v : t.c), 0);
}

// ¿Todas las fracciones dan exacto con la solución? (y ningún denominador es 0 o 1)
export function fraccionesExactas(ec) {
  return [...ec.izq, ...ec.der].every((t) => t.t !== 'f' || (t.den >= 2 && (t.a * (ec.x + t.b)) % t.den === 0));
}

export function generarFracciones(forma, rangos = {}) {
  if (!FORMAS[forma]) throw new Error(`Forma desconocida: ${forma}`);
  const [xMin, xMax] = rangos.x || [1, 15];
  for (let intento = 0; intento < 2000; intento++) {
    const x = azar(Math.max(xMin, MIN_X[forma] || 1), xMax);
    const lados = FORMAS[forma](x);
    if (!lados) continue;
    const ec = { tipo: 'fracciones', forma, x, ...lados, invertida: !SIN_INVERTIR.includes(forma) && Math.random() < 0.2 };
    ec.d = valorLado(ec.der, x);
    return ec;
  }
  throw new Error(`No se pudo generar la forma ${forma}`);
}

const signo = (n) => (n < 0 ? '−' : '+');
const xTexto = (c) => (c === 1 ? 'x' : `${c}x`);

// Lados en el orden en que se muestran
export function ladosVisibles(ec) {
  return ec.invertida ? [ec.der, ec.izq] : [ec.izq, ec.der];
}

// Texto en una línea (para comparar ecuaciones y para el «Ver ejemplo»): «2(x + 1)/3 = (x + 3)/2»
function textoTermino(t, primero) {
  if (t.t === 'f') {
    const s = `${t.a === 1 ? '' : t.a}(x ${signo(t.b)} ${Math.abs(t.b)})/${t.den}`;
    return primero ? s : `+ ${s}`;
  }
  const valor = t.t === 'x' ? xTexto(Math.abs(t.c)) : String(Math.abs(t.c));
  if (primero) return t.c < 0 ? `−${valor}` : valor;
  return `${signo(t.c)} ${valor}`;
}

export function textoLado(lado) {
  return lado.map((t, i) => textoTermino(t, i === 0)).join(' ');
}

export function textoFracciones(ec) {
  const [a, b] = ladosVisibles(ec);
  return `${textoLado(a)} = ${textoLado(b)}`;
}

export function claveFracciones(ec) {
  return textoFracciones(ec).replace(/\s+/g, '');
}

const soloNumero = (lado) => lado.length === 1 && lado[0].t === 'n';

// Cuenta de un lado con un valor: «2 · (5 + 1) ÷ 3 + 1 = 5»; un lado que es solo un número queda igual
export function cuentaLado(lado, v, formato = String) {
  if (soloNumero(lado)) return formato(lado[0].c);
  const fv = formato(v);
  const partes = lado.map((t, i) => {
    let s;
    if (t.t === 'f') s = `${t.a === 1 ? '' : `${t.a} · `}(${fv} ${signo(t.b)} ${Math.abs(t.b)}) ÷ ${t.den}`;
    else if (t.t === 'x') s = Math.abs(t.c) === 1 ? fv : `${Math.abs(t.c)} · ${fv}`;
    else s = String(Math.abs(t.c));
    const negativo = t.t !== 'f' && t.c < 0;
    if (i === 0) return negativo ? `−${s}` : s;
    return `${negativo ? '−' : '+'} ${s}`;
  });
  return `${partes.join(' ')} = ${formato(valorLado(lado, v))}`;
}

// «(11 + 4) ÷ 3 = 5» (si un lado es solo un número) o «(5 + 1) ÷ 2 = 3 y (5 + 4) ÷ 3 = 3».
// Con modo 'mal' muestra en qué no coinciden: «(3 + 4) ÷ 3 = 2,333 ≠ 5».
export function comprobacionFracciones(ec, v, formato = String, modo = null) {
  const [a, b] = ladosVisibles(ec);
  const union = modo === 'mal' ? ' ≠ ' : ' y ';
  if (soloNumero(b)) return modo === 'mal' ? `${cuentaLado(a, v, formato)} ≠ ${formato(b[0].c)}` : cuentaLado(a, v, formato);
  if (soloNumero(a)) return modo === 'mal' ? `${cuentaLado(b, v, formato)} ≠ ${formato(a[0].c)}` : cuentaLado(b, v, formato);
  return `${cuentaLado(a, v, formato)}${union}${cuentaLado(b, v, formato)}`;
}

// ------------------------------------------------------------------ pasos y pista
// Numerador corto: «2(x+1)», «(x+3)»; sin paréntesis si va solo: «x+4»
const numeradorCorto = (t, solo = false) => {
  const dentro = `x${signo(t.b)}${Math.abs(t.b)}`;
  if (t.a === 1) return solo ? dentro : `(${dentro})`;
  return `${t.a}(${dentro})`;
};
// «3·5», «2·2(x+1)», «3(x+3)»
const por = (k, texto) => `${k}${texto.startsWith('(') ? '' : '·'}${texto}`;

// Chips de PASOS del panel (diseño 8_cambios_entrevista/04)
export function pasosFracciones(ec) {
  const [A, B] = ladosVisibles(ec);
  const fa = A.find((t) => t.t === 'f');
  const fb = B.find((t) => t.t === 'f');
  let primero;
  if (fa && fb && A.length === 1 && B.length === 1) {
    primero = `1. Multiplica en cruz: ${por(fb.den, numeradorCorto(fa))} = ${por(fa.den, numeradorCorto(fb))}`;
  } else if (ec.forma === 'final') {
    const f = ec.izq[0];
    const d = ec.izq[1].c;
    const e = Math.abs(ec.der[1].c);
    primero = `1. Quita el denominador: ${numeradorCorto(f)} + ${f.den}·${d} = ${f.den}(x−${e})`;
  } else {
    const [conF, n] = fa ? [fa, B[0].c] : [fb, A[0].c];
    const izquierda = numeradorCorto(conF, true);
    primero = fa ? `1. Quita el denominador: ${izquierda} = ${conF.den}·${n}` : `1. Quita el denominador: ${conF.den}·${n} = ${izquierda}`;
  }
  const sinParentesis = ec.forma === 'simple';
  return [primero, sinParentesis ? '2. Pasa el número' : '2. Quita paréntesis', '3. Despeja x'];
}

// Producto de los denominadores (por él se multiplican los dos lados)
function multiplicador(ec) {
  return [...ec.izq, ...ec.der].filter((t) => t.t === 'f').reduce((k, t) => k * t.den, 1);
}

// Lado multiplicado por K, todavía con paréntesis: «3(x + 1)», «2(x + 3) + 5», «x + 4»
function ladoMultiplicado(lado, K) {
  const unico = lado.length === 1;
  return lado.map((t, i) => {
    let s, negativo = false;
    if (t.t === 'f') {
      const coef = (K / t.den) * t.a;
      const dentro = `x ${signo(t.b)} ${Math.abs(t.b)}`;
      s = coef === 1 ? (unico ? dentro : `(${dentro})`) : `${coef}(${dentro})`;
    } else if (t.t === 'x') {
      negativo = t.c < 0;
      s = xTexto(Math.abs(K * t.c));
    } else {
      negativo = t.c < 0;
      s = String(Math.abs(K * t.c));
    }
    if (i === 0) return negativo ? `−${s}` : s;
    return `${negativo ? '−' : '+'} ${s}`;
  }).join(' ');
}

// Coeficiente de x y número del lado multiplicado por K, ya sin paréntesis: «Ax + B»
function reducir(lado, K) {
  let A = 0, B = 0;
  for (const t of lado) {
    if (t.t === 'f') { const m = (K / t.den) * t.a; A += m; B += m * t.b; }
    else if (t.t === 'x') A += K * t.c;
    else B += K * t.c;
  }
  return { A, B };
}

function textoLineal({ A, B }) {
  const partes = [];
  if (A) partes.push(A < 0 ? `−${xTexto(-A)}` : xTexto(A));
  if (B || !A) partes.push(partes.length ? `${signo(B)} ${Math.abs(B)}` : String(B).replace('-', '−'));
  return partes.join(' ');
}

// Datos de la pista de Ecu con los números del reto (nunca da x):
// cruz «3(x + 1) = 2(x + 4)», sinPar «3x + 3 = 2x + 8», lado (izquierda/derecha), xs «3x − 2x»,
// nums «8 − 3», coefx «x»; con una respuesta, L y R = lo que da cada lado.
export function datosPista(ec, ultima = null) {
  const [ladoA, ladoB] = ladosVisibles(ec);
  const K = multiplicador(ec);
  const a = reducir(ladoA, K);
  const b = reducir(ladoB, K);
  const [conX, sinX, lado] = a.A > b.A ? [a, b, 'izquierda'] : [b, a, 'derecha'];
  const xs = sinX.A === 0 ? xTexto(conX.A) : `${xTexto(conX.A)} ${sinX.A < 0 ? '+' : '−'} ${xTexto(Math.abs(sinX.A))}`;
  const nums = conX.B === 0 ? String(sinX.B).replace('-', '−') : `${String(sinX.B).replace('-', '−')} ${conX.B < 0 ? '+' : '−'} ${Math.abs(conX.B)}`;
  const cruz = `${ladoMultiplicado(ladoA, K)} = ${ladoMultiplicado(ladoB, K)}`;
  const sinPar = `${textoLineal(a)} = ${textoLineal(b)}`;
  const datos = { cruz, sinPar, mismo: cruz === sinPar, lado, xs, nums, coefx: xTexto(conX.A - sinX.A) };
  if (ultima !== null) Object.assign(datos, { L: valorLado(ladoA, ultima), R: valorLado(ladoB, ultima) });
  return datos;
}
