// npm run validar-niveles
// Simula cada nivel de src/data/niveles.json con las MISMAS reglas que el juego
// (src/mundo/reglasMapa.js) y comprueba las reglas de los mapas de CLAUDE.md.
// Sale con código 1 si algún nivel no se puede completar.

import { readFileSync } from 'node:fs';
import { crearCuadricula, calcularRetirada, alcanzables, caminoHasta, cuadrosJunto } from '../src/mundo/reglasMapa.js';
import { generarEcuacion, evaluarIzquierda } from '../src/logic/generadorEcuaciones.js';

const leer = (nombre) => JSON.parse(readFileSync(new URL(`../src/data/${nombre}.json`, import.meta.url), 'utf8'));
const NIVELES = leer('niveles').niveles;
const MUNDOS = leer('mundos').mundos;
const MAPAS = leer('mapas');
const PERSONAJES = leer('personajes').vecinos;
const DIALOGOS = leer('dialogos');
const PLANTILLAS = leer('plantillas').plantillas;
const PISTAS = leer('pistas');
const HISTORIAS = leer('historias');
const IMAGENES = new Set(Object.values(leer('recursos').imagenes).flat());

// Genera muchas ecuaciones y revisa que la solución sea entera y positiva y que cumpla la ecuación
function validarGenerador(tipo, rangos, mundo, donde) {
  const errores = [];
  if (!PISTAS[tipo]) errores.push(`${donde}: faltan pistas del tipo ${tipo} en pistas.json`);
  for (let i = 0; i < 300; i++) {
    let ec;
    try { ec = generarEcuacion(tipo, rangos); } catch (e) { errores.push(`${donde}: ${e.message}`); break; }
    const problema =
      !Number.isInteger(ec.x) || ec.x <= 0 ? `solución no entera o no positiva (x = ${ec.x})`
        : Math.abs(evaluarIzquierda(ec, ec.x) - ec.d) > 1e-9 ? `x = ${ec.x} no cumple la ecuación`
          : ec.d <= 0 ? `lado derecho no positivo (${ec.d})`
              : null;
    if (problema) { errores.push(`${donde} (${tipo}): ${problema}`); break; }
  }
  return errores;
}

const k = (c, r) => `${c},${r}`;
const txt = ([c, r]) => `(${c},${r})`;
let totalErrores = 0;

function validarNivel(nivel) {
  const errores = [];
  const pasos = [];
  const def = MAPAS[nivel.mapa];
  if (!def) return { errores: [`no existe el mapa "${nivel.mapa}"`], pasos };
  const g = crearCuadricula(def);
  const caminable = ([c, r]) => !g.esSolido(c, r);

  // --- datos
  for (const [nombre, pos] of [['inicio', nivel.inicio], ['ecu', nivel.ecu], ['meta', nivel.meta]]) {
    if (!caminable(pos)) errores.push(`${nombre} ${txt(pos)} no es un cuadro caminable`);
  }
  const vecinos = nivel.vecinos.map((cfg, i) => ({ ...cfg, i, c: cfg.pos[0], r: cfg.pos[1], nombre: PERSONAJES[cfg.personaje]?.nombre }));
  const mundo = MUNDOS.find((m) => m.id === nivel.mundo);
  for (const v of vecinos) {
    if (!v.nombre) { errores.push(`personaje desconocido "${v.personaje}"`); continue; }
    if (!caminable(v.pos)) errores.push(`${v.nombre} está sobre un cuadro no caminable ${txt(v.pos)}`);
    if (!DIALOGOS.ayudados.vecinos[v.personaje]) errores.push(`faltan frases de "ayudados" para ${v.personaje} en dialogos.json`);
    for (const img of [PERSONAJES[v.personaje].sprite, PERSONAJES[v.personaje].retrato]) {
      if (!IMAGENES.has(img)) errores.push(`la imagen ${img} no está en recursos.json`);
    }
    if (v.plantilla) {
      const p = PLANTILLAS[v.plantilla];
      if (!p) errores.push(`plantilla desconocida "${v.plantilla}"`);
      else errores.push(...validarGenerador(p.tipo, p.rangos, { retoVisual: 'vida-real' }, `plantilla ${v.plantilla}`));
    }
  }
  if (nivel.tipo !== 'vida-real') {
    const tipos = nivel.tipo === 'mezcla' ? nivel.tipos : [nivel.tipo];
    for (const tipo of tipos) {
      if (tipo === 'terminos' || tipo === 'parentesis') {
        const temas = tipo === 'parentesis' ? HISTORIAS.parentesis.temas : HISTORIAS.temas;
        for (const v of vecinos) {
          for (const tema of PERSONAJES[v.personaje].temas || []) if (!temas[tema]) errores.push(`el tema ${tema} de ${v.nombre} no está en historias.json`);
          if (!PERSONAJES[v.personaje].temas) errores.push(`${v.nombre} no tiene temas de historia (personajes.json)`);
        }
      } else if (!DIALOGOS.retos[tipo]) errores.push(`faltan textos del tipo ${tipo} en dialogos.json`);
      if (tipo === 'terminos' || tipo === 'parentesis') {
        for (const forma of nivel.formas || [nivel.forma]) errores.push(...validarGenerador(tipo, { ...nivel.rangos, forma }, mundo, `nivel ${nivel.id} (${forma})`));
      } else errores.push(...validarGenerador(tipo, nivel.rangos[tipo] || nivel.rangos, mundo, `nivel ${nivel.id}`));
    }
  }
  if (errores.length) return { errores, pasos };

  // --- los vecinos sin ayudar deben impedir llegar a la meta
  const todos = new Set(vecinos.map((v) => k(v.c, v.r)));
  // en los retos del mundo (orden libre) la meta se abre por lógica: requiereTodos
  if (nivel.orden !== 'libre' && alcanzables(g, nivel.inicio, todos).has(k(...nivel.meta))) {
    errores.push('se puede llegar a la meta sin ayudar a los vecinos (algún vecino no bloquea su pasillo)');
  }

  // --- simulación
  let jugador = nivel.inicio;
  const pendientes = [...vecinos];
  const disponible = (v) => {
    if (v.requiereTodos) return pendientes.every((o) => o === v);
    if (nivel.orden === 'libre') return true;
    return pendientes[0] === v;
  };
  const finales = []; // dónde quedó cada vecino ayudado

  while (pendientes.length) {
    // solo los vecinos sin ayudar tienen colisión
    const bloqueados = new Set(pendientes.map((v) => k(v.c, v.r)));
    const alcance = alcanzables(g, jugador, bloqueados);
    const llegaA = (v) => cuadrosJunto(g, v.c, v.r).filter(([c, r]) => alcance.has(k(c, r)));

    if (nivel.orden !== 'libre') {
      for (const v of pendientes.slice(1)) {
        if (!v.requiereTodos && llegaA(v).length) errores.push(`se puede llegar a ${v.nombre} antes de ayudar a ${pendientes[0].nombre}`);
      }
    }
    const v = pendientes.find((o) => disponible(o) && llegaA(o).length);
    if (!v) {
      errores.push(`no se puede llegar a ${pendientes.filter(disponible).map((o) => o.nombre).join(' ni a ')} desde ${txt(jugador)}`);
      break;
    }
    // el jugador se acerca por el cuadro más cercano
    const junto = llegaA(v).map((p) => ({ p, camino: caminoHasta(g, jugador, p, bloqueados) }))
      .sort((a, b) => a.camino.length - b.camino.length)[0];
    jugador = junto.p;

    const { camino, desvanecer } = calcularRetirada(g, v, { c: jugador[0], r: jugador[1] });
    const final = camino.length ? camino[camino.length - 1] : [v.c, v.r];
    let estado;
    if (desvanecer) {
      estado = camino.length ? `se aleja por ${camino.map(txt).join(' → ')} y se desvanece` : 'se desvanece en su lugar';
    } else if (g.esPuesto(...final) && !caminable(final)) {
      estado = `paso atrás a su puesto ${txt(final)}`;
      finales.push({ v, final });
    } else {
      errores.push(`${v.nombre} quedaría en el cuadro de pasillo ${txt(final)}`);
      estado = `ERROR: queda en pasillo ${txt(final)}`;
    }
    pasos.push(`${v.nombre} ${txt(v.pos)}: el jugador llega por ${txt(jugador)} (${junto.camino.length} pasos) → ${estado}`);
    pendientes.splice(pendientes.indexOf(v), 1);
  }

  // ningún vecino ayudado queda en un cuadro caminable
  for (const { v, final } of finales) {
    if (caminable(final)) errores.push(`${v.nombre} ayudado quedó en un cuadro caminable ${txt(final)}`);
  }

  if (!pendientes.length) {
    const aMeta = caminoHasta(g, jugador, nivel.meta);
    if (!aMeta) errores.push(`después de ayudar a todos no se llega a la meta ${txt(nivel.meta)}`);
    else pasos.push(`Meta ${txt(nivel.meta)}: alcanzable en ${aMeta.length} pasos`);
  }
  return { errores, pasos };
}

function validarZona(mundo) {
  const errores = [];
  const g = crearCuadricula(MAPAS[mundo.mapa], mundo.bloqueos);
  const bloqueados = new Set(mundo.puestos.filter((p) => p.anfitrion).map((p) => k(...p.anfitrion.pos)));
  for (const a of mundo.ambientales || []) bloqueados.add(k(...a.pos));
  const alcance = alcanzables(g, mundo.inicio, bloqueados);
  for (const p of mundo.puestos) {
    const llega = p.zona.some(([c, r]) => cuadrosJunto(g, c, r).some(([x, y]) => alcance.has(k(x, y)))) ||
      (p.anfitrion && cuadrosJunto(g, ...p.anfitrion.pos).some(([x, y]) => alcance.has(k(x, y))));
    if (!llega) errores.push(`no se puede llegar al puesto del nivel ${p.nivel}`);
    if (!alcance.has(k(...p.regreso))) errores.push(`el cuadro de regreso del nivel ${p.nivel} ${txt(p.regreso)} no es alcanzable`);
  }
  return errores;
}

console.log('Validación de niveles — reglas de los mapas (src/mundo/reglasMapa.js)\n');
for (const mundo of MUNDOS.filter((m) => !m.pendiente)) {
  const erroresZona = validarZona(mundo);
  console.log(`MUNDO ${mundo.id} · ${mundo.nombre} — zona: ${erroresZona.length ? 'ERRORES' : 'OK (todos los puestos alcanzables)'}`);
  erroresZona.forEach((e) => console.log(`   ✗ ${e}`));
  totalErrores += erroresZona.length;

  for (const nivel of NIVELES.filter((n) => n.mundo === mundo.id)) {
    const { errores, pasos } = validarNivel(nivel);
    console.log(`\n  Nivel ${nivel.id} (${nivel.etiquetaTipo}, mapa ${nivel.mapa}) — ${errores.length ? 'ERRORES' : 'OK'}`);
    pasos.forEach((p) => console.log(`   · ${p}`));
    errores.forEach((e) => console.log(`   ✗ ${e}`));
    totalErrores += errores.length;
  }
  console.log('');
}
console.log(totalErrores ? `✗ ${totalErrores} error(es)` : '✓ Todos los niveles se pueden completar y cumplen las reglas de los mapas');
process.exit(totalErrores ? 1 : 0);
