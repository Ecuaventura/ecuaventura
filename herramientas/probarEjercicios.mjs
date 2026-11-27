// npm run probar-ejercicios            (agrega --muestras para ver 2 ecuaciones reales por plantilla)
// Versión 2.0 · Prueba las plantillas algebraicas de src/data/plantillas.json → algebraicas:
//   1. Por plantilla: genera 1000 ecuaciones y comprueba solución entera positiva (1–20) que cumple,
//      solución única, divisiones exactas, sin coeficientes 0 y texto sin «0x», «1x», «1(» ni «+ −».
//      También que salgan bastantes ecuaciones distintas.
//   2. Por nivel: cuántas plantillas (estructuras) puede usar (niveles 1–2: 2, nivel 3: 4, niveles 4–5: 6),
//      que los 3 retos tengan estructuras distintas cuando hay al menos 3, y que haya muchas ecuaciones distintas.
//   3. Que ninguna estructura de un mundo se repita en otro mundo.
//   4. Que cada plantilla tenga su «Ver ejemplo» de la misma plantilla, con el último paso «x = solución».

import { readFileSync } from 'node:fs';
import {
  PLANTILLAS_ALGEBRAICAS, generarDesdePlantilla, revisarEcuacion, clavePlantilla, textoEcuacionPlantilla,
  plantillasDelNivel, elegirPlantillas, nivelEnMundo, ecuacionConValores, datosAlgebra
} from '../src/logic/plantillas.js';

const leer = (nombre) => JSON.parse(readFileSync(new URL(`../src/data/${nombre}.json`, import.meta.url), 'utf8'));
const NIVELES = leer('niveles').niveles;
const EJEMPLOS = leer('ejemplos');
const PISTAS = leer('pistas');
const N = 1000;
const MIN_DISTINTAS_PLANTILLA = 30;
const MIN_DISTINTAS_NIVEL = 30;
const ESPERADAS = { 1: 2, 2: 2, 3: 4, 4: 6, 5: 6 };
const muestras = process.argv.includes('--muestras');
let fallas = 0;
const falla = (texto) => { fallas++; console.log(`  ✗ ${texto}`); };

// ------------------------------------------------------------------ 1. cada plantilla
console.log(`1) Plantillas — ${N} ecuaciones por plantilla\n`);
for (const t of PLANTILLAS_ALGEBRAICAS) {
  const distintas = new Set();
  const errores = [];
  for (let i = 0; i < N; i++) {
    let ec;
    try { ec = generarDesdePlantilla(t.id); } catch (e) { errores.push(e.message); break; }
    distintas.add(clavePlantilla(ec));
    const problemas = revisarEcuacion(ec);
    if (problemas.length) errores.push(`${textoEcuacionPlantilla(ec)} → ${problemas.join('; ')}`);
  }
  // pocas ecuaciones distintas: se avisa; es error si además la plantilla no alcanza el mínimo
  const pocas = distintas.size < MIN_DISTINTAS_PLANTILLA;
  const estado = errores.length ? `✗ ${errores.length} con error (p. ej. ${errores[0]})` : pocas ? '✗ muy pocas distintas' : '✓';
  if (errores.length || pocas) fallas++;
  console.log(`  M${t.mundo} · ${t.id.padEnd(24)} ${t.forma.padEnd(36)} ${String(distintas.size).padStart(4)} distintas  ${estado}`);
}

// ------------------------------------------------------------------ 2. cada nivel
console.log('\n2) Niveles — estructuras por nivel y variedad\n');
for (const nivel of NIVELES) {
  const nm = nivelEnMundo(nivel);
  const lista = plantillasDelNivel(nivel.mundo, nm);
  const cantidad = nivel.mision ? (nivel.retos || 3) : nivel.vecinos.length;
  const distintas = new Set();
  let estructurasRepetidas = 0;
  for (let i = 0; i < 400; i++) {
    const ids = elegirPlantillas(nivel.mundo, nm, cantidad);
    if (new Set(ids).size < Math.min(cantidad, lista.length)) estructurasRepetidas++;
    ids.forEach((id) => distintas.add(clavePlantilla(generarDesdePlantilla(id))));
  }
  const problemas = [];
  if (lista.length !== ESPERADAS[nm]) problemas.push(`usa ${lista.length} plantillas y se esperaban ${ESPERADAS[nm]}`);
  if (estructurasRepetidas) problemas.push(`${estructurasRepetidas} veces los retos repitieron estructura habiendo ${lista.length}`);
  if (distintas.size < MIN_DISTINTAS_NIVEL) problemas.push(`solo ${distintas.size} ecuaciones distintas`);
  if (problemas.length) fallas++;
  const nombres = lista.map((t) => t.id.replace(/^m\d_/, '')).join(', ');
  console.log(`  Nivel ${String(nivel.id).padStart(2)} (M${nivel.mundo}·N${nm}) ${String(lista.length)} estructuras · ${String(distintas.size).padStart(4)} ecuaciones distintas  ${problemas.length ? `✗ ${problemas.join('; ')}` : '✓'}  [${nombres}]`);
}

// ------------------------------------------------------------------ 3. estructuras únicas entre mundos
console.log('\n3) Estructuras entre mundos\n');
const estructura = (forma) => forma.replace(/[a-wyz]/g, 'k').replace(/\s+/g, '').replace(/[−–]/g, '-');
const vistas = new Map();
let repetidas = 0;
for (const t of PLANTILLAS_ALGEBRAICAS) {
  const e = estructura(t.forma);
  const otra = vistas.get(e);
  if (otra && otra.mundo !== t.mundo) { falla(`${t.id} (M${t.mundo}) repite la estructura de ${otra.id} (M${otra.mundo}): ${t.forma}`); repetidas++; }
  else if (otra) { falla(`${t.id} repite la estructura de ${otra.id} en el mismo mundo`); repetidas++; }
  vistas.set(e, t);
}
if (!repetidas) console.log(`  ✓ Las ${PLANTILLAS_ALGEBRAICAS.length} estructuras son distintas y ninguna se repite en otro mundo`);

// ------------------------------------------------------------------ 4. «Ver ejemplo» y pistas
console.log('\n4) Ejemplos y pistas\n');
let malos = 0;
for (const t of PLANTILLAS_ALGEBRAICAS) {
  const e = EJEMPLOS[t.id];
  if (!e || !e.valores) { falla(`${t.id}: falta su ejemplo en ejemplos.json (npm run generar-ejemplos)`); malos++; continue; }
  const ec = ecuacionConValores(t.id, e.valores);
  const problemas = revisarEcuacion(ec);
  if (problemas.length) { falla(`${t.id}: el ejemplo ${textoEcuacionPlantilla(ec)} → ${problemas[0]}`); malos++; }
  if (e.pasos.length < 2 || e.pasos.length > 4) { falla(`${t.id}: el ejemplo tiene ${e.pasos.length} pasos (deben ser 3 o 4)`); malos++; }
  if (!new RegExp(`x = (.* = )?${ec.x}$`).test(e.pasos[e.pasos.length - 1])) { falla(`${t.id}: el último paso del ejemplo no termina en «x = ${ec.x}»`); malos++; }
  if (!PISTAS.plantillas.estrategias[datosAlgebra(ec).estrategia]) { falla(`${t.id}: falta la pista «${datosAlgebra(ec).estrategia}»`); malos++; }
}
if (!malos) console.log(`  ✓ Las ${PLANTILLAS_ALGEBRAICAS.length} plantillas tienen su ejemplo (mismo tipo, último paso = solución) y su pista`);

// ------------------------------------------------------------------ muestras para revisar a mano
if (muestras) {
  console.log('\nMuestras — 2 ecuaciones reales por plantilla\n');
  for (const t of PLANTILLAS_ALGEBRAICAS) {
    const a = generarDesdePlantilla(t.id);
    let b = generarDesdePlantilla(t.id);
    for (let i = 0; i < 20 && clavePlantilla(b) === clavePlantilla(a); i++) b = generarDesdePlantilla(t.id);
    console.log(`  M${t.mundo} · ${t.nombre}`);
    for (const ec of [a, b]) console.log(`      ${textoEcuacionPlantilla(ec).padEnd(46)} x = ${ec.x}`);
  }
}

console.log(fallas ? `\n✗ ${fallas} problema(s)` : '\n✓ Todas las plantillas generan ecuaciones correctas, variadas y bien escritas');
process.exit(fallas ? 1 : 0);
