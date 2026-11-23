// Guardado del progreso. ETAPA TEMPORAL: usa localStorage del navegador.
// En la etapa de base de datos esta misma interfaz se implementará con sql.js (ecuaventura.db).
// Además de estudiantes, progreso, intentos y ecuaciones mostradas guarda los objetos del
// inventario de los mundos abiertos (d.objetos[idEstudiante] = ['remo', …]).

import NIVELES from '../data/niveles.json';

const CLAVE = 'ecuaventura.datos.v1';

let datos = null;
let avisoDanado = false;

function estadoVacio() {
  return { version: 1, estudiantes: [], progreso: {}, intentos: [], siguienteId: 1 };
}

function esValido(d) {
  return d && typeof d === 'object' && Array.isArray(d.estudiantes) &&
    d.progreso && typeof d.progreso === 'object' && Array.isArray(d.intentos);
}

function cargar() {
  if (datos) return datos;
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto === null) {
      datos = estadoVacio();
    } else {
      const leido = JSON.parse(texto);
      if (!esValido(leido)) throw new Error('estructura inválida');
      datos = leido;
    }
  } catch (error) {
    // RNF-07: si los datos están dañados se restaura un estado seguro y se avisa
    try {
      localStorage.setItem(`${CLAVE}.danado`, localStorage.getItem(CLAVE) ?? '');
    } catch { /* sin acceso a localStorage */ }
    datos = estadoVacio();
    avisoDanado = true;
  }
  return datos;
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // Sin localStorage (modo privado): el juego sigue funcionando en memoria
  }
}

// Devuelve true una sola vez si hubo que restaurar datos dañados
export function hayAvisoDatosDanados() {
  cargar();
  const aviso = avisoDanado;
  avisoDanado = false;
  return aviso;
}

export function listarEstudiantes() {
  return [...cargar().estudiantes].sort((a, b) => (b.ultimoJuego || '').localeCompare(a.ultimoJuego || ''));
}

export function hayProgreso() {
  return cargar().estudiantes.length > 0;
}

export function buscarPorNombre(nombre) {
  const clave = nombre.trim().toLocaleLowerCase('es');
  return cargar().estudiantes.find((e) => e.nombre.toLocaleLowerCase('es') === clave) || null;
}

// personaje: p1 a p4 (el que camina en todos los mundos)
export function crearEstudiante(nombre, personaje = 'p1') {
  const d = cargar();
  const ahora = new Date().toISOString();
  const estudiante = { id: d.siguienteId++, nombre: nombre.trim(), fechaRegistro: ahora, ultimoJuego: ahora, nivelActual: 1, personaje };
  d.estudiantes.push(estudiante);
  // El nivel 1 está disponible desde el inicio (RF-03)
  d.progreso[estudiante.id] = { 1: nuevoProgreso(true) };
  guardar();
  return estudiante;
}

export function obtenerEstudiante(id) {
  return cargar().estudiantes.find((e) => e.id === id) || null;
}

export function marcarJuego(id) {
  const e = obtenerEstudiante(id);
  if (!e) return;
  e.ultimoJuego = new Date().toISOString();
  guardar();
}

function nuevoProgreso(desbloqueado) {
  return { desbloqueado: desbloqueado ? 1 : 0, completado: 0, mejorPuntaje: 0, estrellas: 0 };
}

export function progresoNivel(idEstudiante, idNivel) {
  const p = cargar().progreso[idEstudiante] || {};
  return p[idNivel] || nuevoProgreso(idNivel === 1);
}

// Se llama después de cada reto resuelto (RNF-07)
export function registrarReto(idEstudiante, idNivel) {
  const e = obtenerEstudiante(idEstudiante);
  if (!e) return;
  e.nivelActual = idNivel;
  e.ultimoJuego = new Date().toISOString();
  guardar();
}

// Guarda el resultado del nivel y desbloquea el siguiente (RF-12, RF-14)
export function registrarNivelCompletado(idEstudiante, idNivel, resultado) {
  const d = cargar();
  if (!d.progreso[idEstudiante]) d.progreso[idEstudiante] = {};
  const progreso = d.progreso[idEstudiante];
  const actual = progreso[idNivel] || nuevoProgreso(true);
  const recordAnterior = actual.completado ? actual.mejorPuntaje : null;

  progreso[idNivel] = {
    desbloqueado: 1,
    completado: 1,
    mejorPuntaje: Math.max(actual.mejorPuntaje, resultado.puntaje),
    estrellas: Math.max(actual.estrellas, resultado.estrellas)
  };

  const siguiente = NIVELES.niveles.find((n) => n.id === idNivel + 1);
  if (siguiente) {
    const p = progreso[siguiente.id] || nuevoProgreso(false);
    p.desbloqueado = 1;
    progreso[siguiente.id] = p;
  }

  d.intentos.push({
    idIntento: d.intentos.length + 1,
    idEstudiante,
    idNivel,
    ...resultado,
    fecha: new Date().toISOString()
  });

  const e = obtenerEstudiante(idEstudiante);
  if (e) {
    e.nivelActual = siguiente ? siguiente.id : idNivel;
    e.ultimoJuego = new Date().toISOString();
  }
  guardar();

  return {
    recordAnterior,
    nuevoRecord: recordAnterior === null || resultado.puntaje > recordAnterior,
    siguienteDesbloqueado: siguiente ? siguiente.id : null
  };
}

export function cambiarPersonaje(idEstudiante, personaje) {
  const e = obtenerEstudiante(idEstudiante);
  if (!e) return;
  e.personaje = personaje;
  guardar();
}

// Ecuaciones ya mostradas al estudiante en un nivel (para no repetirlas)
export function ecuacionesMostradas(idEstudiante, idNivel) {
  const d = cargar();
  return new Set(((d.mostradas || {})[idEstudiante] || {})[idNivel] || []);
}

export function registrarEcuaciones(idEstudiante, idNivel, claves) {
  const d = cargar();
  d.mostradas = d.mostradas || {};
  const porNivel = (d.mostradas[idEstudiante] = d.mostradas[idEstudiante] || {});
  const lista = new Set(porNivel[idNivel] || []);
  claves.forEach((k) => lista.add(k));
  // se guardan las últimas 300 por nivel; si se agotan las combinaciones, se vuelve a empezar
  porNivel[idNivel] = [...lista].slice(-300);
  guardar();
}

// Objetos encontrados en los mundos abiertos (Mundo 3: remo, linterna, llave, mapa)
export function objetosEstudiante(idEstudiante) {
  return new Set(((cargar().objetos || {})[idEstudiante]) || []);
}

export function agregarObjeto(idEstudiante, clave) {
  const d = cargar();
  d.objetos = d.objetos || {};
  const lista = new Set(d.objetos[idEstudiante] || []);
  lista.add(clave);
  d.objetos[idEstudiante] = [...lista];
  guardar();
}

export function estrellasTotales(idEstudiante) {
  const p = cargar().progreso[idEstudiante] || {};
  return Object.values(p).reduce((suma, n) => suma + (n.estrellas || 0), 0);
}

// Estrellas sumadas de una lista de niveles (por ejemplo, los de un mundo)
export function estrellasDeNiveles(idEstudiante, idsNiveles) {
  return idsNiveles.reduce((suma, id) => suma + (progresoNivel(idEstudiante, id).estrellas || 0), 0);
}

// Para la lista «Continuar partida»: mundo y nivel actual
export function resumenEstudiante(estudiante) {
  const nivel = NIVELES.niveles.find((n) => n.id === estudiante.nivelActual) || NIVELES.niveles[0];
  return { mundo: nivel.mundo, nivel: nivel.id, estrellas: estrellasTotales(estudiante.id) };
}

// Resumen del final del juego (diseño 515): niveles completados, estrellas, puntaje total (suma de los
// mejores puntajes), mejor racha de todos los intentos y minutos jugados (suma de los intentos completados)
export function resumenFinal(idEstudiante) {
  const d = cargar();
  const progreso = Object.values(d.progreso[idEstudiante] || {});
  const intentos = d.intentos.filter((i) => i.idEstudiante === idEstudiante);
  return {
    niveles: progreso.filter((p) => p.completado).length,
    estrellas: progreso.reduce((s, p) => s + (p.estrellas || 0), 0),
    puntaje: progreso.reduce((s, p) => s + (p.mejorPuntaje || 0), 0),
    mejorRacha: intentos.reduce((m, i) => Math.max(m, i.mejorRacha || 0), 0),
    minutos: Math.round(intentos.reduce((s, i) => s + (i.tiempoSeg || 0), 0) / 60)
  };
}
