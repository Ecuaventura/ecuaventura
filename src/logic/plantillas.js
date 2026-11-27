// Generador por plantillas algebraicas (versión 2.0).
// Las estructuras de cada mundo están en src/data/plantillas.json → algebraicas (datos, no código):
// para agregar una estructura nueva basta con agregar una plantilla ahí.
//
// Cómo se genera un reto:
//   1. Se eligen las plantillas permitidas para el nivel (nivelMinimo ≤ nivel dentro del mundo).
//   2. Se elige primero la solución x (entera, 1 a 20) y los parámetros al azar dentro de sus rangos.
//   3. El parámetro de «calcula» se despeja para que x sea la solución (debe salir entero y en su rango).
//      Con «calcula: "e/f"» el lado derecho es la fracción e/f: se toma el valor del lado izquierdo.
//   4. Se revisa la ecuación (revisarEcuacion): divisiones exactas, solución única, sin coeficientes 0,
//      sin «1x» ni «+ −». Si algo falla se prueba con otros números.
// La ecuación es { tipo, mundo, plantilla, x, p: { a, b, … }, d } (d = valor de cada lado con la solución).

import DATOS from '../data/plantillas.json' with { type: 'json' };
import {
  leerForma, parametros, tieneX, evaluar, recorrer, escribir, expandir, reducir, textoTerminos, textoLineal,
  fr, por, entre, resta, igual, esCero, esEntero, aNumero, aFraccion, textoFr, mcd, mcm
} from './algebra.js';

const azar = ([min, max]) => min + Math.floor(Math.random() * (max - min + 1));
const RANGO_X = [1, 20];
const RANGO_PARAMETRO = [1, 9];

export const PLANTILLAS_ALGEBRAICAS = DATOS.algebraicas;
const POR_ID = Object.fromEntries(PLANTILLAS_ALGEBRAICAS.map((t) => [t.id, t]));
const ARBOLES = {};

export function plantilla(id) {
  const t = POR_ID[id];
  if (!t) throw new Error(`Plantilla desconocida: ${id}`);
  return t;
}

export function arbolDe(id) {
  if (!ARBOLES[id]) ARBOLES[id] = leerForma(plantilla(id).forma);
  return ARBOLES[id];
}

// ------------------------------------------------------------------ qué plantillas usa cada nivel
// Nivel dentro del mundo (1 a 5) a partir del número del nivel (1 a 25)
export const nivelEnMundo = (nivel) => nivel.numero - 5 * (nivel.mundo - 1);

export function plantillasDelNivel(mundo, nivelMundo) {
  return PLANTILLAS_ALGEBRAICAS.filter((t) => t.mundo === mundo && t.nivelMinimo <= nivelMundo);
}

export function plantillasDelMundo(mundo) {
  return PLANTILLAS_ALGEBRAICAS.filter((t) => t.mundo === mundo);
}

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Plantillas para los retos de un nivel: distintas entre sí mientras alcancen
// (con 2 plantillas y 3 retos, salen las dos y una se repite)
export function elegirPlantillas(mundo, nivelMundo, cantidad) {
  const disponibles = plantillasDelNivel(mundo, nivelMundo).map((t) => t.id);
  if (!disponibles.length) throw new Error(`El mundo ${mundo} no tiene plantillas para el nivel ${nivelMundo}`);
  const elegidas = [];
  while (elegidas.length < cantidad) elegidas.push(...mezclar(disponibles));
  return elegidas.slice(0, cantidad);
}

// ------------------------------------------------------------------ generación
const rangoDe = (t, id) => (t.rangos && t.rangos[id]) || RANGO_PARAMETRO;
const enRango = (v, [min, max]) => Number.isInteger(v) && v >= min && v <= max;

function crearEcuacion(t, x, p) {
  const arbol = arbolDe(t.id);
  const ec = { tipo: tipoDelMundo(t.mundo), mundo: t.mundo, plantilla: t.id, x, p };
  ec.d = aNumero(evaluar(arbol.der, fr(x), p));
  return ec;
}

const TIPOS_POR_MUNDO = { 1: 'terminos', 2: 'parentesis', 3: 'ambos', 4: 'fracciones', 5: 'fraccionFraccion' };
export const tipoDelMundo = (mundo) => TIPOS_POR_MUNDO[mundo];
export const mundoDelTipo = (tipo) => Number(Object.keys(TIPOS_POR_MUNDO).find((m) => TIPOS_POR_MUNDO[m] === tipo));

// Despeja el parámetro 'id' para que x sea la solución (la ecuación es lineal en ese parámetro)
function despejarParametro(arbol, id, x, p) {
  const g = (v) => {
    const q = { ...p, [id]: v };
    return resta(evaluar(arbol.izq, fr(x), q), evaluar(arbol.der, fr(x), q));
  };
  const g0 = g(0);
  const g1 = g(1);
  const paso = resta(g1, g0);
  if (esCero(paso) || !igual(resta(g(2), g1), paso)) return null;
  const v = entre(fr(-g0.n, g0.d), paso);
  return esEntero(v) ? v.n : null;
}

export function generarDesdePlantilla(id, rangosExtra = {}) {
  const t = plantilla(id);
  const arbol = arbolDe(id);
  const libres = [...parametros(arbol.izq), ...parametros(arbol.der)].filter((v, i, l) => l.indexOf(v) === i);
  const calcula = t.calcula.split('/');
  const rangoX = rangosExtra.x || (t.rangos && t.rangos.x) || RANGO_X;
  for (let intento = 0; intento < 20000; intento++) {
    const x = azar(rangoX);
    const p = {};
    for (const v of libres) if (!calcula.includes(v)) p[v] = azar(rangoDe(t, v));
    try {
      if (calcula.length === 2) {
        // lado derecho = fracción e/f: se toma el valor exacto del lado izquierdo
        const valor = evaluar(arbol.izq, fr(x), p);
        if (valor.n < 1) continue;
        [p[calcula[0]], p[calcula[1]]] = [valor.n, valor.d];
      } else {
        const v = despejarParametro(arbol, calcula[0], x, p);
        if (v === null) continue;
        p[calcula[0]] = v;
      }
    } catch {
      continue;
    }
    if (!calcula.every((v) => enRango(p[v], rangoDe(t, v)))) continue;
    const ec = crearEcuacion(t, x, p);
    if (!revisarEcuacion(ec).length) return ec;
  }
  throw new Error(`No se pudo generar la plantilla ${id}`);
}

// Ecuación de la plantilla con valores fijos (los del «Ver ejemplo»); x se despeja
export function ecuacionConValores(id, valores) {
  const t = plantilla(id);
  const arbol = arbolDe(id);
  const { izq, der } = ecuacionLineal(arbol, valores);
  const L = reducir(izq);
  const R = reducir(der);
  const x = entre(resta(R.B, L.B), resta(L.A, R.A));
  return crearEcuacion(t, aNumero(x), { ...valores });
}

// ------------------------------------------------------------------ revisión (juego, validador y pruebas)
const sinGrupo = (n) => (n.k === 'g' ? sinGrupo(n.e) : n);

// Problemas de una ecuación generada; lista vacía = está bien
export function revisarEcuacion(ec) {
  const problemas = [];
  const t = plantilla(ec.plantilla);
  const arbol = arbolDe(ec.plantilla);
  const X = fr(ec.x);
  const [xMin, xMax] = t.rangos?.x || RANGO_X;
  if (!Number.isInteger(ec.x) || ec.x < 1) problemas.push(`la solución no es entera positiva (x = ${ec.x})`);
  else if (ec.x < xMin || ec.x > xMax) problemas.push(`x = ${ec.x} fuera de ${xMin}–${xMax}`);
  for (const [id, v] of Object.entries(ec.p)) if (!Number.isInteger(v) || v < 1) problemas.push(`el parámetro ${id} = ${v} no es entero positivo`);
  if (problemas.length) return problemas;
  for (const [a, b] of t.distintos || []) if (ec.p[a] === ec.p[b]) problemas.push(`${a} y ${b} deben ser distintos`);
  for (const [a, b] of t.coprimos || []) if (mcd(ec.p[a], ec.p[b]) !== 1) problemas.push(`${a}/${b} se puede simplificar`);

  let L, R;
  try {
    L = evaluar(arbol.izq, X, ec.p);
    R = evaluar(arbol.der, X, ec.p);
  } catch {
    return [...problemas, 'divide entre cero con la solución'];
  }
  if (!igual(L, R)) problemas.push(`x = ${ec.x} no cumple la ecuación`);

  // divisiones: con x arriba dan exacto; las fracciones fijas (3/4) están simplificadas; nunca entre 0 ni entre 1
  const revisar = (nodo) => {
    if (nodo.k === 'f') {
      const den = evaluar(nodo.b, X, ec.p);
      if (!esEntero(den) || den.n < 2) problemas.push(`denominador ${textoFr(den)} (debe ser entero ≥ 2)`);
      else if (tieneX(nodo.a)) {
        if (!esEntero(evaluar(nodo.a, X, ec.p)) || !esEntero(evaluar(nodo, X, ec.p))) problemas.push(`la fracción ${escribir(nodo, ec.p)} no da exacto con la solución`);
      } else {
        const num = evaluar(nodo.a, X, ec.p);
        if (!esEntero(num) || mcd(num.n, den.n) !== 1) problemas.push(`la fracción ${escribir(nodo, ec.p)} no está simplificada`);
      }
    }
    if (nodo.k === 'e' && esCero(evaluar(nodo.b, X, ec.p))) problemas.push('divide entre cero');
    if (nodo.k === 'g' && t.gruposPositivos && evaluar(nodo.e, X, ec.p).n < 1) problemas.push(`(${escribir(nodo.e, ec.p)}) no da positivo con la solución`);
  };
  try {
    recorrer(arbol.izq, revisar);
    recorrer(arbol.der, revisar);
  } catch {
    problemas.push('divide entre cero');
  }

  // solución única: al despejar, el coeficiente de x no es 0, y con otros números ya no se cumple
  try {
    const { izq, der } = ecuacionLineal(arbol, ec.p);
    const coef = resta(reducir(izq).A, reducir(der).A);
    if (esCero(coef)) problemas.push('las x se cancelan (no tiene solución única)');
  } catch (e) {
    problemas.push(`no es de primer grado (${e.message})`);
  }
  for (const otro of [ec.x - 1, ec.x + 1, ec.x + 2]) {
    try {
      if (igual(evaluar(arbol.izq, fr(otro), ec.p), evaluar(arbol.der, fr(otro), ec.p))) problemas.push(`x = ${otro} también cumple`);
    } catch { /* con ese número se divide entre 0: no es solución */ }
  }
  problemas.push(...revisarTexto(textoEcuacionPlantilla(ec)));
  return problemas;
}

// Texto bien escrito: sin «0x», «1x», «1(», números 0, ni signos seguidos («+ −»)
export function revisarTexto(texto) {
  const problemas = [];
  if (/(^|[^\d])0x/.test(texto)) problemas.push(`aparece «0x»: ${texto}`);
  if (/(^|[^\d])1x/.test(texto)) problemas.push(`aparece «1x»: ${texto}`);
  if (/(^|[^\d/])1[([]/.test(texto)) problemas.push(`aparece «1(»: ${texto}`);
  if (/(^|[^\d])0(?![\d])/.test(texto)) problemas.push(`aparece un 0: ${texto}`);
  if (/[+−-]\s*[+−-]/.test(texto)) problemas.push(`signos seguidos: ${texto}`);
  if (/\/1(?!\d)/.test(texto)) problemas.push(`división entre 1: ${texto}`);
  return problemas;
}

// ------------------------------------------------------------------ textos
export function textoEcuacionPlantilla(ec) {
  const arbol = arbolDe(ec.plantilla);
  return `${escribir(arbol.izq, ec.p)} = ${escribir(arbol.der, ec.p)}`;
}

export const ladosTexto = (ec) => {
  const arbol = arbolDe(ec.plantilla);
  return [escribir(arbol.izq, ec.p), escribir(arbol.der, ec.p)];
};

export const clavePlantilla = (ec) => textoEcuacionPlantilla(ec).replace(/\s+/g, '');

export function valoresLados(ec, v) {
  const arbol = arbolDe(ec.plantilla);
  const X = aFraccion(v);
  const lado = (n) => { try { return evaluar(n, X, ec.p); } catch { return null; } };
  return [lado(arbol.izq), lado(arbol.der)];
}

// Cuenta de un lado con el número del alumno: «3 · 5 + 2 = 17»; un lado sin x queda como número
export function cuentaLado(ec, cual, v, formato) {
  const arbol = arbolDe(ec.plantilla);
  const nodo = cual === 'izq' ? arbol.izq : arbol.der;
  const valor = valoresLados(ec, v)[cual === 'izq' ? 0 : 1];
  const fmt = (q) => (formato ? formato(aNumero(q)) : textoFr(q));
  // los resultados se escriben exactos (8/3, no 2,667); el número del alumno, como lo escribió
  const fmtValor = (q) => (q === null ? '¿?' : textoFr(q));
  if (!tieneX(nodo)) return fmtValor(valor);
  const cuenta = escribir(nodo, ec.p, { X: aFraccion(v), formato: fmt });
  return cuenta === fmtValor(valor) ? cuenta : `${cuenta} = ${fmtValor(valor)}`;
}

// «3 · 5 + 2 = 17 y 5 + 12 = 17» o, si un lado no tiene x, «3 · 5 + 2 = 17»
// modo 'mal': «3 · 4 + 2 = 14 ≠ 4 + 12 = 16»
export function comprobacionPlantilla(ec, v, formato = null, modo = null) {
  const arbol = arbolDe(ec.plantilla);
  const izq = cuentaLado(ec, 'izq', v, formato);
  const der = cuentaLado(ec, 'der', v, formato);
  if (!tieneX(arbol.der)) return modo === 'mal' ? `${izq} ≠ ${der}` : izq;
  if (!tieneX(arbol.izq)) return modo === 'mal' ? `${der} ≠ ${izq}` : der;
  return `${izq}${modo === 'mal' ? ' ≠ ' : ' y '}${der}`;
}

// ------------------------------------------------------------------ forma lineal, pistas y pasos
// Lleva la ecuación a dos listas de términos sin paréntesis. Si un lado es «N ÷ D» con x en D,
// primero pasa D multiplicando: N = R · D.
export function ecuacionLineal(arbol, P) {
  const lados = [arbol.izq, arbol.der];
  const conXabajo = lados.findIndex((n) => sinGrupo(n).k === 'e' && tieneX(sinGrupo(n).b));
  if (conXabajo < 0) return { izq: expandir(arbol.izq, P), der: expandir(arbol.der, P), cruzada: false };
  const division = sinGrupo(lados[conXabajo]);
  const otro = lados[1 - conXabajo];
  if (tieneX(otro)) throw new Error('x en los dos denominadores');
  const k = evaluar(otro, fr(0), P);
  const derecha = expandir(division.b, P).map((t) => ({ c: por(t.c, k), x: t.x }));
  return { izq: expandir(division.a, P), der: derecha, cruzada: true };
}

const xTexto = (n) => (n === 1 ? 'x' : `${n}x`);
const numTexto = (n) => String(n).replace('-', '−');

// Todo lo que usan la pista de Ecu, los chips de PASOS y los pasos del «Ver ejemplo» (nunca da x salvo
// en los pasos resueltos del ejemplo, que usan otros números).
export function datosAlgebra(ec) {
  const t = plantilla(ec.plantilla);
  const arbol = arbolDe(ec.plantilla);
  const P = ec.p;
  const { izq, der, cruzada } = ecuacionLineal(arbol, P);
  const expandida = `${textoTerminos(izq)} = ${textoTerminos(der)}`;
  const dens = [...new Set([...izq, ...der].map((u) => u.c.d).filter((d) => d > 1))].sort((a, b) => a - b);
  const M = dens.reduce((m, d) => mcm(m, d), 1);
  const porM = (lista) => lista.map((u) => ({ c: por(u.c, fr(M)), x: u.x }));
  const sinFracciones = `${textoTerminos(porM(izq))} = ${textoTerminos(porM(der))}`;
  const a = reducir(porM(izq));
  const b = reducir(porM(der));
  const reducida = `${textoLineal(a)} = ${textoLineal(b)}`;
  // las x al lado que tiene más (así el coeficiente queda positivo) y los números al otro
  const [conX, sinX, lado] = aNumero(a.A) > aNumero(b.A) ? [a, b, 'izquierda'] : [b, a, 'derecha'];
  const A1 = conX.A.n, A2 = sinX.A.n, B1 = conX.B.n, B2 = sinX.B.n;
  // si un lado queda sin x (o sin número), no se escribe «0x + x» ni «0 + 4»
  const xs = A2 === 0 ? xTexto(A1) : A1 === 0 ? xTexto(-A2) : `${xTexto(A1)} ${A2 < 0 ? '+' : '−'} ${xTexto(Math.abs(A2))}`;
  const nums = B1 === 0 ? numTexto(B2) : B2 === 0 ? numTexto(-B1) : `${numTexto(B2)} ${B1 < 0 ? '+' : '−'} ${Math.abs(B1)}`;
  const coef = A1 - A2;
  const datos = {
    estrategia: t.estrategia, expandida, sinFracciones, reducida, mcm: M, conMcm: M > 1, sinMcm: M === 1,
    dens: dens.join(', '), lado, xs, nums, coef, coefx: xTexto(coef), N: B2 - B1, x: ec.x,
    mismaReducida: reducida === (M > 1 ? sinFracciones : expandida), cruzada
  };
  datos.distintaReducida = !datos.mismaReducida;
  // división entre una fracción (Mundo 5): la fracción, su inversa y la ecuación ya multiplicada
  for (const [nodo, otro] of [[arbol.izq, arbol.der], [arbol.der, arbol.izq]]) {
    const d = sinGrupo(nodo);
    if (d.k !== 'e') continue;
    const divisor = sinGrupo(d.b);
    datos.div = escribir(divisor, P);
    if (tieneX(divisor)) {
      datos.inv = divisor.k === 'f' ? `${escribir(divisor.b, P)}/${escribir(divisor.a, P)}` : `1/${datos.div}`;
      datos.multiplicada = `${escribir(sinGrupo(d.a), P)} = ${escribir(otro, P)} · ${datos.div}`;
      datos.estrategia = `${t.estrategia}X`;
    } else {
      datos.inv = textoFr(entre(fr(1), evaluar(divisor, fr(0), P)));
      datos.multiplicada = `${escribir(d.a, P)} · ${datos.inv} = ${escribir(otro, P)}`;
    }
    break;
  }
  return datos;
}

// Chips de PASOS del panel (plantillas.json → pasos, con {mcm}, {div}, {inv}, {dens})
export function pasosPlantilla(ec) {
  const t = plantilla(ec.plantilla);
  const datos = datosAlgebra(ec);
  return (t.pasos || []).map((p) => p.replace(/\{(\w+)\}/g, (todo, k) => (k in datos ? String(datos[k]) : todo)));
}

// Pasos resueltos (3 o 4) para el «Ver ejemplo»: «texto: cálculo»
export function pasosResueltos(ec) {
  const d = datosAlgebra(ec);
  const pasos = [];
  if (d.estrategia === 'invertir' || d.estrategia === 'invertirX') {
    pasos.push(d.cruzada
      ? `Paso ${d.div} multiplicando al otro lado: ${d.multiplicada}`
      : `Dividir entre ${d.div} es multiplicar por ${d.inv}: ${d.multiplicada}`);
    pasos.push(d.conMcm ? `Multiplico todo por ${d.mcm}: ${d.sinFracciones}` : `Quito los paréntesis: ${d.expandida}`);
  } else if (d.estrategia === 'mcm') {
    pasos.push(`Multiplico todo por ${d.mcm} (mcm de ${d.dens}): ${d.sinFracciones}`);
  } else if (d.estrategia === 'distributiva' || d.estrategia === 'signos') {
    pasos.push(`${d.estrategia === 'signos' ? 'Quito los paréntesis cuidando los signos' : 'Aplico la distributiva'}: ${d.expandida}`);
  }
  const original = textoEcuacionPlantilla(ec);
  if (!d.mismaReducida || (d.estrategia === 'agrupar' && d.reducida !== original)) pasos.push(`Junto términos semejantes: ${d.reducida}`);
  const despeje = `Las x a la ${d.lado} y los números al otro: ${d.xs} = ${d.nums}`;
  const despejeRepetido = `${d.xs} = ${d.nums}` === d.reducida;
  const final = d.coef === 1 ? `Resultado: x = ${d.x}` : `Divido entre ${d.coef}: x = ${numTexto(d.N)} ÷ ${d.coef} = ${d.x}`;
  if (despejeRepetido) pasos.push(final);
  else if (pasos.length + 2 <= 4) pasos.push(despeje, final);
  else pasos.push(`${despeje.split(':')[0]}: ${d.coefx} = ${numTexto(d.N)} → x = ${d.x}`);
  return pasos;
}

// Líneas de la pista de Ecu (pistas.json → plantillas): según la estrategia de la plantilla y con los
// números del reto; nunca da x. ultima = última respuesta del alumno (o null); formato = cómo se escribe.
export function lineasPistaPlantilla(ec, pistas, ultima = null, formato = String) {
  const datos = datosAlgebra(ec);
  const llenar = (texto, valores) => texto.replace(/\{(\w+)\}/g, (todo, k) => (k in valores ? String(valores[k]) : todo));
  const lineas = [];
  if (ultima !== null) {
    const [L, R] = valoresLados(ec, ultima);
    lineas.push(llenar(pistas.conRespuesta, { r: formato(ultima), L: L === null ? '¿?' : textoFr(L), R: R === null ? '¿?' : textoFr(R) }));
  }
  for (const linea of pistas.estrategias[datos.estrategia] || []) {
    if (typeof linea === 'string') lineas.push(llenar(linea, datos));
    else if (datos[linea.si]) lineas.push(llenar(linea.texto, datos));
  }
  return lineas;
}
