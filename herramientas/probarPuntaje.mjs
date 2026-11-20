// Prueba de caja blanca del módulo de puntaje (src/logic/puntaje.js)
// Uso: npm run probar-puntaje
import { puntosReto, bonoRacha, calcularEstrellas } from '../src/logic/puntaje.js';

const criterios = { erroresMax: 3, tiempoMax: 180 };
let fallos = 0;

function caso(descripcion, obtenido, esperado) {
  const ok = obtenido === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${descripcion} = ${obtenido}${ok ? '' : ` (se esperaba ${esperado})`}`);
}

console.log('puntosReto');
caso('puntosReto(false)', puntosReto(false), 100);
caso('puntosReto(true)', puntosReto(true), 50);

console.log('\nbonoRacha');
for (const [racha, esperado] of [[0, 0], [2, 0], [3, 50], [4, 0], [6, 50]]) {
  caso(`bonoRacha(${racha})`, bonoRacha(racha), esperado);
}

console.log('\ncalcularEstrellas (erroresMax 3, tiempoMax 180)');
for (const [errores, pistas, tiempoSeg, esperado] of [
  [0, 0, 100, 3],
  [3, 0, 100, 3],
  [2, 1, 100, 2],
  [1, 0, 200, 2],
  [4, 0, 100, 1]
]) {
  caso(
    `errores ${errores}, pistas ${pistas}, ${tiempoSeg} s`,
    calcularEstrellas({ errores, pistas, tiempoSeg }, criterios),
    esperado
  );
}

if (fallos > 0) {
  console.log(`\n✗ ${fallos} caso(s) fallaron`);
  process.exit(1);
}
console.log('\n✓ Todos los casos pasaron');
