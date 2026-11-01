// Genera retos de ecuaciones de primer grado: primero se elige la solución x
// y a partir de ella se construye la ecuación (RF-04).
// Cada ecuación es { tipo, x, a, b, c?, d } donde d es el lado derecho.
// El tipo 'terminos' (Mundo 1) vive en terminos.js: lado de las x + otro lado con números.
// El tipo 'parentesis' (Mundo 2) vive en parentesis.js: a(kx + b) + c = d.

import { generarTerminos, valor as valorTerminos, textoTerminos, comprobacionTerminos, claveTerminos } from './terminos.js';
import { generarParentesis, valorParentesis, textoParentesis, comprobacionParentesis, claveParentesis } from './parentesis.js';

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
export const TIPOS = ['x+a=b', 'x-a=b', 'ax=b', 'terminos', 'parentesis'];

export function generarEcuacion(tipo, rangos) {
  if (tipo === 'terminos') return generarTerminos(rangos.forma, rangos);
  if (tipo === 'parentesis') return generarParentesis(rangos.forma, rangos);
  const [xMin, xMax] = rango(rangos.x, [1, 10]);
  const [aMin, aMax] = rango(rangos.a, [2, 5]);
  const [bMin, bMax] = rango(rangos.b, [1, 10]);

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

// Clave para comparar ecuaciones (no repetir)
export function claveEcuacion(ec) {
  if (ec.tipo === 'parentesis') return claveParentesis(ec);
  return ec.tipo === 'terminos' ? claveTerminos(ec) : `${ec.tipo}|${ec.a}|${ec.b}|${ec.d}`;
}

// Genera varias ecuaciones distintas entre sí y que no estén en 'evitar'
// (las ya mostradas al estudiante y la del «Ver ejemplo»)
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
  const { tipo, a, b } = ecuacion;
  if (tipo === 'terminos') return valorTerminos(ecuacion.ladoX, valor);
  if (tipo === 'parentesis') return valorParentesis(ecuacion, valor);
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

// Texto de la ecuación: "x + 5 = 12", "3x = 12", "x/3 = 4", "2x + 3 = 11"
export function textoEcuacion(ec) {
  const { tipo, a, b, d } = ec;
  if (tipo === 'terminos') return textoTerminos(ec);
  if (tipo === 'parentesis') return textoParentesis(ec);
  if (tipo === 'x+a=b') return `x + ${a} = ${d}`;
  if (tipo === 'x-a=b') return `x − ${a} = ${d}`;
  return `${a}x = ${d}`;
}

// Cuenta con un valor de x: "3 × 4 = 12", "2 × 4 + 3 = 11"
export function textoComprobacion(ecuacion, valor) {
  const { tipo, a, b } = ecuacion;
  if (tipo === 'terminos') return comprobacionTerminos(ecuacion, valor, formatoNumero);
  if (tipo === 'parentesis') return comprobacionParentesis(ecuacion, valor, formatoNumero);
  const v = formatoNumero(valor);
  const lado = formatoNumero(evaluarIzquierda(ecuacion, valor));
  if (tipo === 'x+a=b') return `${v} + ${a} = ${lado}`;
  if (tipo === 'x-a=b') return `${v} − ${a} = ${lado}`;
  return `${a} × ${v} = ${lado}`;
}
