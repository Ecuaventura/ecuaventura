// Ecuaciones con paréntesis en ambos lados (Mundo 3 · 3.° de secundaria).
// Cada lado es una lista de términos:
//   { t: 'p', s, a, b }  s·a(x + b)   (s = 1, o −1 para «−(x + b)»; b con signo)
//   { t: 'x', c }        cx
//   { t: 'n', c }        número
// Se elige primero la solución x (entera de 1 a 12) y se construye la ecuación a partir de ella.
// La ecuación es { tipo: 'ambos', forma, x, izq, der, invertida, d } (d = valor de cada lado con la solución).

const azar = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const par = (a, b, s = 1) => ({ t: 'p', s, a, b });
const conX = (c) => ({ t: 'x', c });
const num = (c) => ({ t: 'n', c });

// Formas de cada nivel. Reciben x y devuelven { izq, der } o null si esos números no sirven
// (se vuelve a intentar con otros).
const FORMAS = {
  // Nivel 11: a(x + b) = cx + d          ej. 2(x + 3) = x + 10
  parX: (x) => {
    const a = azar(2, 4);
    const b = azar(1, 8);
    const c = azar(1, a - 1);
    return { izq: [par(a, b)], der: [conX(c), num((a - c) * x + a * b)] };
  },
  // Nivel 12 y 15: a(x − b) = c(x + d)   ej. 3(x − 2) = 2(x + 1)
  dosPar: (x) => {
    const a = azar(3, 6);
    const c = azar(2, a - 1);
    const b = azar(1, Math.max(1, x - 1));
    const resto = (a - c) * x - a * b;
    if (x - b < 1 || resto < c || resto % c) return null;
    const d = resto / c;
    return d <= 12 ? { izq: [par(a, -b)], der: [par(c, d)] } : null;
  },
  // Nivel 15: a(x + b) = c(x + d)        ej. 3(x + 1) = 2(x + 4)
  dosParMas: (x) => {
    const a = azar(3, 6);
    const c = azar(2, a - 1);
    const b = azar(1, 6);
    const resto = (a - c) * x + a * b;
    if (resto % c) return null;
    const d = resto / c;
    return d <= 15 && d !== b ? { izq: [par(a, b)], der: [par(c, d)] } : null;
  },
  // Nivel 13: a(x + b) + e = c(x + d)    ej. 4(x + 1) + 2 = 3(x + 4)
  parE: (x) => {
    const a = azar(3, 6);
    const c = azar(2, a - 1);
    const b = azar(1, 6);
    const e = azar(1, 9);
    const resto = (a - c) * x + a * b + e;
    if (resto % c) return null;
    const d = resto / c;
    return d <= 20 ? { izq: [par(a, b), num(e)], der: [par(c, d)] } : null;
  },
  // Nivel 14: signo menos delante del paréntesis   ej. 5x − (x + 2) = 2(x + 3)
  menos: (x) => {
    const c = azar(2, 4);
    const q = azar(1, 3);           // coeficiente que queda: p − 1 − c
    const p = q + 1 + c;
    const d = azar(1, 9);
    // adentro «x + b» (b = qx − cd) o «x − b» (b = cd − qx)
    const b = q * x - c * d;
    if (b === 0 || Math.abs(b) > 9) return null;
    return { izq: [conX(p), par(1, b, -1)], der: [par(c, d)] };
  }
};

export const FORMAS_AMBOS = Object.keys(FORMAS);

// las formas con resta adentro necesitan x ≥ 2
const MIN_X = { dosPar: 2 };

export function valorLado(lado, v) {
  return lado.reduce((suma, t) => suma + (t.t === 'p' ? t.s * t.a * (v + t.b) : t.t === 'x' ? t.c * v : t.c), 0);
}

export function generarAmbos(forma, rangos = {}) {
  if (!FORMAS[forma]) throw new Error(`Forma desconocida: ${forma}`);
  const [xMin, xMax] = rangos.x || [1, 12];
  for (let intento = 0; intento < 1000; intento++) {
    const x = azar(Math.max(xMin, MIN_X[forma] || 1), xMax);
    const lados = FORMAS[forma](x);
    if (!lados) continue;
    const ec = { tipo: 'ambos', forma, x, ...lados, invertida: Math.random() < 0.25 };
    ec.d = valorLado(ec.der, x);
    return ec;
  }
  throw new Error(`No se pudo generar la forma ${forma}`);
}

// Coeficiente de x y número de un lado ya sin paréntesis: «Ax + B»
export function reducirLado(lado) {
  let A = 0, B = 0;
  for (const t of lado) {
    if (t.t === 'p') { A += t.s * t.a; B += t.s * t.a * t.b; }
    else if (t.t === 'x') A += t.c;
    else B += t.c;
  }
  return { A, B };
}

const signo = (n) => (n < 0 ? '−' : '+');
const xTexto = (c) => (c === 1 ? 'x' : `${c}x`);

// Texto de un término; con 'primero' no lleva el signo + adelante
function textoTermino(t, primero) {
  if (t.t === 'p') {
    const dentro = `(x ${signo(t.b)} ${Math.abs(t.b)})`;
    if (t.s < 0) return `${primero ? '−' : '− '}${t.a === 1 ? '' : t.a}${dentro}`;
    return `${primero ? '' : '+ '}${t.a}${dentro}`;
  }
  const valor = t.t === 'x' ? xTexto(Math.abs(t.c)) : String(Math.abs(t.c));
  if (primero) return t.c < 0 ? `−${valor}` : valor;
  return `${signo(t.c)} ${valor}`;
}

export function textoLado(lado) {
  return lado.map((t, i) => textoTermino(t, i === 0)).join(' ');
}

// Lados en el orden en que se muestran
export function ladosVisibles(ec) {
  return ec.invertida ? [ec.der, ec.izq] : [ec.izq, ec.der];
}

export function textoAmbos(ec) {
  const [a, b] = ladosVisibles(ec);
  return `${textoLado(a)} = ${textoLado(b)}`;
}

export function claveAmbos(ec) {
  return textoAmbos(ec).replace(/\s+/g, '');
}

// Cuenta de un lado con un valor: «3 · (5 − 2)», «5 · 4 − (4 + 2)», luego « = total»
export function cuentaLado(lado, v, formato = String) {
  const fv = formato(v);
  const partes = lado.map((t, i) => {
    let s;
    if (t.t === 'p') {
      const dentro = `(${fv} ${signo(t.b)} ${Math.abs(t.b)})`;
      s = t.a === 1 ? dentro : `${t.a} · ${dentro}`;
      if (t.s < 0) return i === 0 ? `−${s}` : `− ${s}`;
    } else if (t.t === 'x') {
      s = Math.abs(t.c) === 1 ? fv : `${Math.abs(t.c)} · ${fv}`;
      if (t.c < 0) return i === 0 ? `−${s}` : `− ${s}`;
    } else {
      s = String(Math.abs(t.c));
      if (t.c < 0) return i === 0 ? `−${s}` : `− ${s}`;
    }
    return i === 0 ? s : `+ ${s}`;
  });
  return `${partes.join(' ')} = ${formato(valorLado(lado, v))}`;
}

// «3 · (8 − 2) = 18 y 2 · (8 + 1) = 18»
export function comprobacionAmbos(ec, v, formato = String) {
  const [a, b] = ladosVisibles(ec);
  return `${cuentaLado(a, v, formato)} y ${cuentaLado(b, v, formato)}`;
}

// Lado sin paréntesis, término por término: «3x − 6», «5x − x − 2»
export function quitarParentesis(lado) {
  const partes = [];
  for (const t of lado) {
    if (t.t === 'p') partes.push({ t: 'x', c: t.s * t.a }, { t: 'n', c: t.s * t.a * t.b });
    else partes.push(t);
  }
  return textoLado(partes);
}

// Fichas para el panel: números en amarillo, x en azul, paréntesis grandes
export function fichasAmbos(ec) {
  const lado = (terminos) => terminos.flatMap((t, i) => {
    const op = (s) => (i === 0 && s === '+' ? [] : [{ texto: s, clase: 'op' }]);
    if (t.t === 'p') {
      const dentro = [
        { texto: '(', clase: 'paren' },
        { texto: 'x', clase: 'x' },
        { texto: signo(t.b), clase: 'op' },
        { texto: String(Math.abs(t.b)), clase: 'n' },
        { texto: ')', clase: 'paren' }
      ];
      const delante = t.a === 1 ? [] : [{ texto: String(t.a), clase: 'n' }];
      return [...op(t.s < 0 ? '−' : '+'), ...delante, ...dentro];
    }
    const texto = t.t === 'x' ? xTexto(Math.abs(t.c)) : String(Math.abs(t.c));
    return [...op(t.c < 0 ? '−' : '+'), { texto, clase: t.t === 'x' ? 'x' : 'n' }];
  });
  const [a, b] = ladosVisibles(ec);
  return [...lado(a), { texto: '=', clase: 'op' }, ...lado(b)];
}
