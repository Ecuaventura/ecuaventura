// Genera retos de ecuaciones de primer grado: primero se elige la solución x
// y a partir de ella se construye la ecuación (RF-04).
//
// Versión 2.0: los 5 mundos usan PLANTILLAS ALGEBRAICAS (src/data/plantillas.json → algebraicas,
// motor en plantillas.js y algebra.js). Cada mundo tiene su tipo:
//   terminos (Mundo 1) · parentesis (Mundo 2) · ambos (Mundo 3) · fracciones (Mundo 4) · fraccionFraccion (Mundo 5)
// y cada reto sale de una plantilla: { tipo, mundo, plantilla, x, p: { a, b, … }, d } (d = valor de cada lado).
// Los tipos sencillos 'x+a=b', 'x-a=b' y 'ax=b' se mantienen para los problemas de la vida real antiguos
// (plantillas.json → plantillas): { tipo, x, a, b, d }.

import {
  generarDesdePlantilla, elegirPlantillas, mundoDelTipo, clavePlantilla, textoEcuacionPlantilla,
  valoresLados, comprobacionPlantilla
} from './plantillas.js';
import { aNumero } from './algebra.js';

export function enteroAlAzar(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const rango = (r, porDefecto) => r || porDefecto;

// Tipos de ecuación disponibles
export const TIPOS = ['x+a=b', 'x-a=b', 'ax=b', 'terminos', 'parentesis', 'ambos', 'fracciones', 'fraccionFraccion'];

// Tipos que se generan con plantillas algebraicas y llevan historia armada con sus números
export const TIPOS_CON_PLANTILLA = ['terminos', 'parentesis', 'ambos', 'fracciones', 'fraccionFraccion'];
// nombre anterior (versión 1.x)
export const TIPOS_CON_FORMA = TIPOS_CON_PLANTILLA;

const conPlantilla = (ec) => !!ec.plantilla;

// rangos: { plantilla: 'm1_ambos_lados' } o { nivel: 1..5 } (se elige una plantilla del nivel al azar)
export function generarEcuacion(tipo, rangos = {}) {
  if (TIPOS_CON_PLANTILLA.includes(tipo)) {
    const id = rangos.plantilla || elegirPlantillas(mundoDelTipo(tipo), rangos.nivel || 5, 1)[0];
    return generarDesdePlantilla(id, rangos.x ? { x: rangos.x } : {});
  }
  const [xMin, xMax] = rango(rangos.x, [1, 10]);
  const [aMin, aMax] = rango(rangos.a, [2, 5]);

  if (tipo === 'x+a=b') {
    const x = enteroAlAzar(xMin, xMax);
    const a = enteroAlAzar(aMin, aMax);
    return { tipo, x, a, b: x + a, d: x + a };
  }
  if (tipo === 'x-a=b') {
    // x - a debe dar al menos 1, así que x > a
    const x = enteroAlAzar(Math.max(xMin, aMin + 1), xMax);
    const a = enteroAlAzar(aMin, Math.min(aMax, x - 1));
    return { tipo, x, a, b: x - a, d: x - a };
  }
  if (tipo === 'ax=b') {
    const x = enteroAlAzar(xMin, xMax);
    const a = enteroAlAzar(Math.max(2, aMin), aMax);
    return { tipo, x, a, b: a * x, d: a * x };
  }
  throw new Error(`Tipo de ecuación desconocido: ${tipo}`);
}

// Clave para comparar ecuaciones (no repetir): el texto sin espacios
export function claveEcuacion(ec) {
  if (conPlantilla(ec)) return clavePlantilla(ec);
  return `${ec.tipo}|${ec.a}|${ec.b}|${ec.d}`;
}

// Genera varias ecuaciones distintas entre sí y que no estén en 'evitar'
// (las ya mostradas al estudiante y las del «Ver ejemplo»)
export function generarVarias(tipos, rangos, evitar = new Set()) {
  const usadas = new Set(evitar);
  return tipos.map((tipo, i) => {
    const rangosTipo = Array.isArray(rangos) ? rangos[i] : (rangos[tipo] || rangos);
    let ecuacion;
    for (let intento = 0; intento < 200; intento++) {
      ecuacion = generarEcuacion(tipo, rangosTipo);
      const clave = claveEcuacion(ecuacion);
      if (!usadas.has(clave)) {
        usadas.add(clave);
        break;
      }
    }
    return ecuacion;
  });
}

// Lado izquierdo de la ecuación evaluado con un valor de x
export function evaluarIzquierda(ecuacion, valor) {
  const { tipo, a } = ecuacion;
  if (conPlantilla(ecuacion)) {
    const [L] = valoresLados(ecuacion, valor);
    return L === null ? NaN : aNumero(L);
  }
  if (tipo === 'x+a=b') return valor + a;
  if (tipo === 'x-a=b') return valor - a;
  if (tipo === 'ax=b') return a * valor;
  throw new Error(`Tipo de ecuación desconocido: ${tipo}`);
}

// Formato de número para la interfaz (Perú: coma decimal)
export function formatoNumero(n) {
  const redondeado = Math.round(n * 1000) / 1000;
  return String(redondeado).replace('.', ',').replace('-', '−');
}

// Texto de la ecuación: "x + 5 = 12", "3x + 2 = x + 10", "(x + 1)/2 = (x + 4)/3"
export function textoEcuacion(ec) {
  if (conPlantilla(ec)) return textoEcuacionPlantilla(ec);
  const { tipo, a, d } = ec;
  if (tipo === 'x+a=b') return `x + ${a} = ${d}`;
  if (tipo === 'x-a=b') return `x − ${a} = ${d}`;
  return `${a}x = ${d}`;
}

// Cuenta con un valor de x: "3 × 4 = 12", "2 · 4 + 3 = 11 y 4 + 7 = 11"
export function textoComprobacion(ecuacion, valor) {
  if (conPlantilla(ecuacion)) return comprobacionPlantilla(ecuacion, valor, formatoNumero);
  const { tipo, a } = ecuacion;
  const v = formatoNumero(valor);
  const lado = formatoNumero(evaluarIzquierda(ecuacion, valor));
  if (tipo === 'x+a=b') return `${v} + ${a} = ${lado}`;
  if (tipo === 'x-a=b') return `${v} − ${a} = ${lado}`;
  return `${a} × ${v} = ${lado}`;
}
