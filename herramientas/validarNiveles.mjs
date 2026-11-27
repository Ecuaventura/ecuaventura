// npm run validar-niveles
// Simula cada nivel de src/data/niveles.json con las MISMAS reglas que el juego
// (src/mundo/reglasMapa.js) y comprueba las reglas de los mapas de CLAUDE.md.
// Sale con código 1 si algún nivel no se puede completar.

import { readFileSync } from 'node:fs';
import { crearCuadricula, calcularRetirada, alcanzables, caminoHasta, cuadrosJunto } from '../src/mundo/reglasMapa.js';
import { generarEcuacion, evaluarIzquierda, textoEcuacion, TIPOS_CON_PLANTILLA } from '../src/logic/generadorEcuaciones.js';
import { plantillasDelNivel, nivelEnMundo, revisarEcuacion, datosAlgebra, generarDesdePlantilla } from '../src/logic/plantillas.js';

const leer = (nombre) => JSON.parse(readFileSync(new URL(`../src/data/${nombre}.json`, import.meta.url), 'utf8'));
const NIVELES = leer('niveles').niveles;
const MUNDOS = leer('mundos').mundos;
const MAPAS = leer('mapas');
const PERSONAJES = leer('personajes').vecinos;
const DIALOGOS = leer('dialogos');
const PLANTILLAS = leer('plantillas').plantillas;
const PISTAS = leer('pistas');
const HISTORIAS = leer('historias');
const EJEMPLOS = leer('ejemplos');
const IMAGENES = new Set(Object.values(leer('recursos').imagenes).flat());

// Genera muchas ecuaciones y revisa que la solución sea entera y positiva y que cumpla la ecuación
// (tipos sencillos de los problemas de vida real antiguos)
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

// Versión 2.0: cada plantilla del nivel genera 300 ecuaciones y todas deben pasar revisarEcuacion
// (solución entera positiva que cumple, divisiones exactas, solución única, texto bien escrito);
// además deben existir su pista (estrategia), su ejemplo y su título.
function validarPlantillas(nivel, mundo) {
  const errores = [];
  const lista = plantillasDelNivel(nivel.mundo, nivelEnMundo(nivel));
  if (!lista.length) errores.push(`no hay plantillas para el nivel ${nivelEnMundo(nivel)} del mundo ${nivel.mundo}`);
  const cantidad = nivel.mision ? (nivel.retos || 3) : nivel.vecinos.length;
  if (lista.length < Math.min(3, cantidad) && nivelEnMundo(nivel) > 2) errores.push(`solo ${lista.length} plantillas: los ${cantidad} retos no pueden tener estructuras distintas`);
  for (const t of lista) {
    if (!EJEMPLOS[t.id]) errores.push(`la plantilla ${t.id} no tiene ejemplo en ejemplos.json (npm run generar-ejemplos)`);
    if (!t.titulo) errores.push(`la plantilla ${t.id} no tiene título`);
    for (let i = 0; i < 300; i++) {
      let ec;
      try { ec = generarDesdePlantilla(t.id); } catch (e) { errores.push(`${t.id}: ${e.message}`); break; }
      const problemas = revisarEcuacion(ec);
      if (problemas.length) { errores.push(`${t.id}: ${textoEcuacion(ec)} → ${problemas[0]}`); break; }
      if (i === 0) {
        const estrategia = datosAlgebra(ec).estrategia;
        if (!PISTAS.plantillas?.estrategias?.[estrategia]) errores.push(`${t.id}: falta la pista de la estrategia «${estrategia}» en pistas.json → plantillas`);
      }
    }
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
  for (const [nombre, pos] of [['inicio', nivel.inicio], ['ecu', nivel.ecu], ['meta', nivel.meta]].filter(([, p]) => p)) {
    if (!caminable(pos)) errores.push(`${nombre} ${txt(pos)} no es un cuadro caminable`);
  }
  const vecinos = nivel.vecinos.map((cfg, i) => ({ ...cfg, i, c: cfg.pos[0], r: cfg.pos[1], nombre: PERSONAJES[cfg.personaje]?.nombre }));
  const mundo = MUNDOS.find((m) => m.id === nivel.mundo);
  for (const v of vecinos) {
    if (!v.nombre) { errores.push(`personaje desconocido "${v.personaje}"`); continue; }
    if (!nivel.mision && !caminable(v.pos)) errores.push(`${v.nombre} está sobre un cuadro no caminable ${txt(v.pos)}`);
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
      if (TIPOS_CON_PLANTILLA.includes(tipo)) {
        // historias por mundo (historias.json → mundos): cada tema del vecino debe existir
        const temas = HISTORIAS.mundos?.[nivel.mundo]?.temas || {};
        for (const v of vecinos) {
          for (const tema of PERSONAJES[v.personaje].temas || []) {
            if (!temas[tema]) errores.push(`el tema ${tema} de ${v.nombre} no está en historias.json → mundos.${nivel.mundo}`);
          }
          if (!PERSONAJES[v.personaje].temas) errores.push(`${v.nombre} no tiene temas de historia (personajes.json)`);
          for (const otro of PERSONAJES[v.personaje].otros || []) if (!PERSONAJES[otro]) errores.push(`${v.nombre}: el personaje "${otro}" de 'otros' no existe`);
        }
        errores.push(...validarPlantillas(nivel, mundo));
      } else {
        if (!DIALOGOS.retos[tipo]) errores.push(`faltan textos del tipo ${tipo} en dialogos.json`);
        errores.push(...validarGenerador(tipo, nivel.rangos[tipo] || nivel.rangos, mundo, `nivel ${nivel.id}`));
      }
    }
  }
  if (errores.length) return { errores, pasos };

  // --- misión (mundo abierto): un anfitrión da los retos seguidos; no hay meta ni retirada
  if (nivel.mision) {
    if (nivel.vecinos.length !== 1) errores.push('una misión tiene un solo anfitrión');
    if (nivel.otorga && !(mundo.objetos || []).some((o) => o.clave === nivel.otorga)) errores.push(`el objeto "${nivel.otorga}" no está en mundos.json → objetos`);
    const v = vecinos[0];
    const alcance = alcanzables(g, nivel.inicio, new Set([k(v.c, v.r)]));
    const junto = cuadrosJunto(g, v.c, v.r).filter(([c, r]) => alcance.has(k(c, r)));
    if (!junto.length) errores.push(`no se puede llegar junto a ${v.nombre} ${txt(v.pos)} desde ${txt(nivel.inicio)}`);
    else pasos.push(`Misión: ${nivel.retos || 3} retos de ${v.nombre} ${txt(v.pos)}; el jugador empieza en ${txt(nivel.inicio)} y llega por ${txt(junto[0])}`);
    return { errores, pasos };
  }

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

// Zona del mundo. En el mundo abierto se revisa cada lugar (el mapa del mundo, la cueva, el almacén, el taller, el túnel)
// con sus puertas, salidas y objetos.
function validarZona(mundo) {
  const errores = [];
  const lugares = [['puerto', { mapa: mundo.mapa, inicio: mundo.inicio, bloqueos: mundo.bloqueos }], ...Object.entries(mundo.lugares || {})];
  const objetos = new Map((mundo.objetos || []).map((o) => [o.clave, o]));
  for (const o of objetos.values()) if (!IMAGENES.has(o.imagen)) errores.push(`la imagen ${o.imagen} no está en recursos.json`);
  for (const [lugar, def] of lugares) errores.push(...validarLugar(mundo, lugar, def, objetos));
  return errores;
}

function validarLugar(mundo, lugar, def, objetos) {
  const errores = [];
  const donde = lugar === 'puerto' ? '' : ` (${lugar})`;
  if (!MAPAS[def.mapa]) return [`no existe el mapa "${def.mapa}"`];
  const g = crearCuadricula(MAPAS[def.mapa], def.bloqueos || []);
  const caminable = ([c, r]) => !g.esSolido(c, r);
  const puestos = mundo.puestos.filter((p) => (p.lugar || 'puerto') === lugar);
  const ambientales = (mundo.ambientales || []).filter((a) => (a.lugar || 'puerto') === lugar);
  const bloqueados = new Set(puestos.filter((p) => p.anfitrion).map((p) => k(...p.anfitrion.pos)));
  for (const a of ambientales) {
    bloqueados.add(k(...a.pos));
    if (mundo.mundoAbierto && !caminable(a.pos)) errores.push(`${a.personaje}${donde} está sobre un cuadro no caminable ${txt(a.pos)}`);
  }
  if (!caminable(def.inicio)) errores.push(`el inicio${donde} ${txt(def.inicio)} no es caminable`);
  const alcance = alcanzables(g, def.inicio, bloqueados);
  const llegaJunto = (pos) => cuadrosJunto(g, ...pos).some(([x, y]) => alcance.has(k(x, y)));
  for (const s of def.salidas || []) if (!alcance.has(k(...s))) errores.push(`la salida${donde} ${txt(s)} no es alcanzable`);
  if (lugar === 'puerto') {
    for (const p of mundo.puertas || []) {
      if (!llegaJunto(p.pos)) errores.push(`no se puede llegar a la puerta ${txt(p.pos)}`);
      if (p.lugar && !mundo.lugares[p.lugar]) errores.push(`la puerta ${txt(p.pos)} lleva a un lugar que no existe (${p.lugar})`);
      if (p.requiere && !objetos.has(p.requiere)) errores.push(`la puerta ${txt(p.pos)} pide un objeto que no existe (${p.requiere})`);
      if (p.habla && !PERSONAJES[p.habla]) errores.push(`la puerta ${txt(p.pos)} la cuida un personaje que no existe (${p.habla})`);
    }
    for (const [nombre, l] of Object.entries(mundo.lugares || {})) {
      if (!alcance.has(k(...l.volverA))) errores.push(`al salir de ${nombre} se aparece en ${txt(l.volverA)}, que no es alcanzable`);
    }
    for (const o of objetos.values()) {
      if (o.pos && !alcance.has(k(...o.pos))) errores.push(`no se puede llegar al objeto ${o.clave} en ${txt(o.pos)}`);
    }
  }
  for (const p of puestos) {
    if (p.requiere && !objetos.has(p.requiere)) errores.push(`la misión ${p.nivel} pide un objeto que no existe (${p.requiere})`);
    const llega = p.zona.some(([c, r]) => cuadrosJunto(g, c, r).some(([x, y]) => alcance.has(k(x, y)))) ||
      (p.anfitrion && cuadrosJunto(g, ...p.anfitrion.pos).some(([x, y]) => alcance.has(k(x, y))));
    if (!llega) errores.push(`no se puede llegar al puesto del nivel ${p.nivel}${donde}`);
    if (!alcance.has(k(...p.regreso))) errores.push(`el cuadro de regreso del nivel ${p.nivel} ${txt(p.regreso)} no es alcanzable${donde}`);
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
