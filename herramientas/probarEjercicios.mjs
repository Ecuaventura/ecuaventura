// npm run probar-ejercicios
// Genera 1000 ecuaciones por nivel y comprueba que todas tengan solución entera correcta,
// que la solución esté en su rango, que no coincidan con el «Ver ejemplo» y que haya muchas distintas.

import { readFileSync } from 'node:fs';
import { generarEcuacion, evaluarIzquierda, claveEcuacion, textoEcuacion, TIPOS_CON_FORMA } from '../src/logic/generadorEcuaciones.js';
import { fraccionesExactas } from '../src/logic/fracciones.js';
import { divisionesExactas, unaSolucion } from '../src/logic/fraccionFraccion.js';

const leer = (nombre) => JSON.parse(readFileSync(new URL(`../src/data/${nombre}.json`, import.meta.url), 'utf8'));
const NIVELES = leer('niveles').niveles;
const PLANTILLAS = leer('plantillas').plantillas;
const EJEMPLOS = leer('ejemplos');
const N = 1000;
let fallas = 0;

function probar(nivel, tipo, rangos) {
  const distintas = new Set();
  const ejemplo = EJEMPLOS[nivel.mundo] ? EJEMPLOS[nivel.mundo].ecuacion.replace(/\s+/g, '') : null;
  const problemas = [];
  const [xMin, xMax] = rangos.x || [1, 1e9];
  for (let i = 0; i < N; i++) {
    const ec = generarEcuacion(tipo, rangos);
    const clave = claveEcuacion(ec);
    distintas.add(clave);
    if (!Number.isInteger(ec.x) || ec.x < 1) problemas.push(`solución no entera positiva: ${textoEcuacion(ec)} (x = ${ec.x})`);
    else if (Math.abs(evaluarIzquierda(ec, ec.x) - ec.d) > 1e-9) problemas.push(`x = ${ec.x} no cumple ${textoEcuacion(ec)}`);
    else if (TIPOS_CON_FORMA.includes(tipo) && (ec.x < xMin || ec.x > xMax)) problemas.push(`x = ${ec.x} fuera de ${xMin}–${xMax}`);
    else if (tipo === 'fracciones' && !fraccionesExactas(ec)) problemas.push(`división no exacta o entre 0/1: ${textoEcuacion(ec)}`);
    else if (tipo === 'fraccionFraccion' && (!divisionesExactas(ec) || !unaSolucion(ec))) problemas.push(`división no exacta, entre 0 o más de una solución: ${textoEcuacion(ec)}`);
    else if (tipo === 'terminos' && ec.a === 0) problemas.push(`sin x (división entre cero): ${textoEcuacion(ec)}`);
    if (ejemplo && clave === ejemplo) problemas.push(`igual al ejemplo: ${textoEcuacion(ec)} (el juego la descarta y genera otra)`);
  }
  return { distintas: distintas.size, problemas };
}

console.log(`Prueba de ejercicios — ${N} ecuaciones por nivel\n`);
for (const nivel of NIVELES) {
  const casos = [];
  if (TIPOS_CON_FORMA.includes(nivel.tipo)) (nivel.formas || [nivel.forma]).forEach((forma) => casos.push([nivel.tipo, { ...nivel.rangos, forma }, forma]));
  else if (nivel.tipo === 'mezcla') nivel.tipos.forEach((t) => casos.push([t, nivel.rangos[t] || nivel.rangos, t]));
  else if (nivel.tipo === 'vida-real') nivel.vecinos.forEach((v) => { const p = PLANTILLAS[v.plantilla]; casos.push([p.tipo, p.rangos, v.plantilla]); });
  else casos.push([nivel.tipo, nivel.rangos, nivel.tipo]);
  for (const [tipo, rangos, nombre] of casos) {
    const { distintas, problemas } = probar(nivel, tipo, rangos);
    // los «iguales al ejemplo» se descartan al jugar; el resto son errores
    const errores = problemas.filter((p) => !p.startsWith('igual al ejemplo'));
    const pocas = distintas < 30;
    if (errores.length || pocas) fallas++;
    const estado = errores.length ? `✗ ${errores.length} con error (p. ej. ${errores[0]})` : pocas ? '✗ muy pocas distintas' : '✓';
    console.log(`Nivel ${String(nivel.id).padStart(2)} · ${nombre.padEnd(16)} ${String(distintas).padStart(4)} distintas de ${N}  ${estado}`);
  }
}
console.log(fallas ? `\n✗ ${fallas} caso(s) con problemas` : '\n✓ Todas las ecuaciones tienen solución entera correcta y hay mucha variedad');
process.exit(fallas ? 1 : 0);
