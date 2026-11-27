// npm run generar-ejemplos
// Llena src/data/ejemplos.json con un ejemplo resuelto («Ver ejemplo») por cada plantilla de
// plantillas.json → algebraicas que todavía no tenga uno. Elige números pequeños y escribe los pasos
// con el motor algebraico (así nunca tienen errores de cuenta). Los ejemplos que ya existen no se tocan;
// con --rehacer se vuelven a escribir los pasos de todos (con sus mismos valores).
// Después se puede editar el texto de los pasos a mano: npm run probar-ejercicios comprueba que el
// último paso siga diciendo «x = solución».

import { readFileSync, writeFileSync } from 'node:fs';
import { PLANTILLAS_ALGEBRAICAS, generarDesdePlantilla, ecuacionConValores, textoEcuacionPlantilla, pasosResueltos } from '../src/logic/plantillas.js';

const ruta = new URL('../src/data/ejemplos.json', import.meta.url);
const ejemplos = JSON.parse(readFileSync(ruta, 'utf8'));
const rehacer = process.argv.includes('--rehacer');
const salida = { _ayuda: 'Un ejemplo resuelto por plantilla (clave = id de plantillas.json → algebraicas), con otros números. valores: los parámetros; ecuacion y x: solo para leer (se calculan). Cada paso: «texto: cálculo» (3 o 4 pasos). El generador nunca da un reto igual a su ejemplo. «Ver ejemplo» no resta puntos. Para agregar ejemplos de plantillas nuevas: npm run generar-ejemplos.' };

// tamaño de los números: se prefieren ejemplos cortos y con x pequeña
const peso = (ec) => ec.x * 3 + Object.values(ec.p).reduce((s, v) => s + v, 0) + textoEcuacionPlantilla(ec).length;

for (const t of PLANTILLAS_ALGEBRAICAS) {
  const previo = ejemplos[t.id];
  let ec;
  if (previo && previo.valores) ec = ecuacionConValores(t.id, previo.valores);
  else {
    const candidatos = Array.from({ length: 400 }, () => generarDesdePlantilla(t.id)).filter((e) => e.x >= 2 && e.x <= 9);
    ec = candidatos.sort((a, b) => peso(a) - peso(b))[0] || generarDesdePlantilla(t.id);
  }
  const pasos = previo && previo.pasos && !rehacer ? previo.pasos : pasosResueltos(ec);
  salida[t.id] = { tema: t.nombre, ecuacion: textoEcuacionPlantilla(ec), x: ec.x, valores: ec.p, pasos };
  console.log(`${previo ? '·' : '+'} ${t.id.padEnd(24)} ${textoEcuacionPlantilla(ec)}   (x = ${ec.x})`);
}
writeFileSync(ruta, `${JSON.stringify(salida, null, 2)}\n`);
console.log('\nListo: src/data/ejemplos.json');
