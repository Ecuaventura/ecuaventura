// Piezas DOM del mundo abierto (Mundo 3 · Puerto y Mundo 4 · Construcción) — diseños: diseño/4_mundo3_puerto/301
// (mapa M con misiones), 302 (HUD con objetos), 304 (objeto encontrado) y 306 (lugar bloqueado); en la obra,
// diseño/5_mundo4_construccion/401–404 y 409.
// Cada misión es un nivel (mundos.json → puestos); algunas necesitan un objeto (requiere) que se
// encuentra en el mapa o lo regala la misión anterior (mundos.json → objetos).

import { rutaImagen, escaparHtml } from '../scenes/ui.js';
import NIVELES from '../data/niveles.json';

const numero = (idNivel) => NIVELES.niveles.find((n) => n.id === idNivel).numero;
const estrella = (on, ancho = 18) => `<img src="${rutaImagen(on ? 'estrella' : 'estrella_off')}" alt="" style="width:${ancho}px;image-rendering:pixelated">`;
const candado = (ancho = 22) => `<img src="${rutaImagen('candado')}" alt="" style="width:${ancho}px;image-rendering:pixelated">`;

export function objetoDe(mundo, clave) {
  return (mundo.objetos || []).find((o) => o.clave === clave) || null;
}

// Primera misión sin completar (la que se muestra en el HUD)
export function misionActual(mundo, estado) {
  return mundo.puestos.find((p) => estado(p).tipo !== 'completado') || null;
}

// «Misión 12: busca el remo de Don Pancho»
export function textoMision(mundo, estado) {
  const p = misionActual(mundo, estado);
  if (!p) return (mundo.textosZona && mundo.textosZona.misionesCumplidas) || '¡Misiones cumplidas!';
  const e = estado(p);
  const texto = e.falta ? p.buscar : p.objetivo;
  return `Misión ${numero(p.nivel)}: ${texto}`;
}

// Casillas de objetos del HUD (diseño 302): brillan los que ya tienes
export function htmlObjetos(mundo, objetos) {
  return (mundo.objetos || []).map((o) => {
    const tiene = objetos.has(o.clave);
    return `<span class="slot-objeto ${tiene ? 'tiene' : ''}" title="${o.nombre}"><img src="${rutaImagen(o.imagen)}" alt="${tiene ? o.nombre : ''}"></span>`;
  }).join('');
}

// HUD de la zona del mundo abierto
export function htmlHudAbierto({ mundo, titulo, chip, estrellas, maximo, mision, objetos }) {
  return `<div class="hud">${chip}
<div style="display:flex;flex-direction:column;gap:6px;min-width:330px"><span class="px hud-titulo" style="font-size:15px;color:#f2b632;white-space:nowrap">${titulo}</span><span class="hud-mision" style="font-size:16px;font-weight:800;color:#ffe9b8;white-space:nowrap">${mision}</span></div>
<div style="display:flex;flex-direction:column;gap:3px"><span style="font-size:13px;font-weight:900;color:#ffe9b8">OBJETOS</span><div class="hud-objetos" style="display:flex;gap:6px">${htmlObjetos(mundo, objetos)}</div></div>
<div style="margin-left:auto;display:flex;gap:10px;align-items:center"><div class="stat"><b>ESTRELLAS</b><span style="color:#f2b632">${estrellas} / ${maximo}</span></div>
<button type="button" class="boton btn" data-accion="mapa">MAPA <span style="font-family:Nunito;font-size:13px;margin-left:6px">(M)</span></button><button type="button" class="boton btn" style="width:48px;padding:0" data-accion="ayuda" aria-label="Instrucciones">?</button><button type="button" class="boton btn" data-accion="salir">SALIR</button></div></div>`;
}

// Insignia de una misión (en el mundo y en el mapa M, diseño 301)
export function htmlInsigniaMision(puesto, e, actual, estilo = '') {
  const n = numero(puesto.nivel);
  if (e.tipo === 'completado') {
    return `<div class="badge" style="${estilo};background:#157a4f;color:#fff"><span class="n">${n}</span>${[1, 2, 3].map((k) => estrella(k <= e.estrellas, 20)).join('')}<span>${puesto.etiqueta}</span></div>`;
  }
  if (e.tipo === 'disponible' && actual) {
    return `<div class="badge" style="${estilo};background:#f2b632;color:#1b1430;box-shadow:0 0 0 4px #fff,0 5px 0 4px #1b1430"><span class="n" style="color:#7a1f3d">${n}</span><span class="n" style="color:#7a1f3d">!</span><span>${puesto.etiqueta}</span></div>`;
  }
  return `<div class="badge" style="${estilo};background:#4e1027;color:#ffe9b8"><span class="n" style="color:#fff">${n}</span>${candado()}<span>${puesto.etiqueta}</span></div>`;
}

// Estado de una misión en la tarjeta del mapa M
function textoTarjeta(mundo, puesto, e) {
  if (e.tipo === 'completado') return `Completada · ${e.estrellas} ★`;
  if (e.falta) {
    const o = objetoDe(mundo, e.falta);
    return o.pos ? `Busca el ${o.nombre}` : `Falta ${o.nombre}`;
  }
  if (e.tipo === 'disponible') return '¡Disponible!';
  return 'Bloqueada';
}

// Mapa completo con «Tú», misiones y la barra de MISIONES abajo (diseño 301)
export function htmlMapaAbierto({ mundo, estado, actual, tu, objetoSuelto }) {
  const cfg = mundo.mapaCompleto;
  const T = 16; // px del mapa completo por cuadro
  const etiquetas = cfg.etiquetas.map(([t, c, r]) => `<span class="etiqueta-mapa" style="left:${c * T}px;top:${r * T}px">${t}</span>`).join('');
  const insignias = mundo.puestos.map((p) => htmlInsigniaMision(p, estado(p), p === actual,
    `left:${p.enMapa[0] * T}px;top:${p.enMapa[1] * T - 30}px;transform:translateX(-50%);font-size:15px`)).join('');
  const suelto = objetoSuelto
    ? `<span class="brillo-mapa" style="left:${(objetoSuelto.pos[0] + 0.5) * T}px;top:${(objetoSuelto.pos[1] + 0.5) * T}px"><img src="${rutaImagen(objetoSuelto.imagen)}" alt=""></span>`
    : '';
  const tarjetas = mundo.puestos.map((p) => {
    const e = estado(p);
    const o = p.requiere ? objetoDe(mundo, p.requiere) : null;
    const color = e.tipo === 'completado' ? '#157a4f' : e.tipo === 'disponible' && p === actual ? '#f2b632' : '#9a8aa8';
    return `<div class="tarjeta-mision" style="border-left-color:${color}"><span class="px" style="font-size:14px">${numero(p.nivel)}</span>
${o ? `<img src="${rutaImagen(o.imagen)}" alt="" style="width:40px;image-rendering:pixelated;${e.falta ? 'opacity:.45' : ''}">` : '<span style="width:40px"></span>'}
<span style="display:flex;flex-direction:column;gap:3px"><b>${p.mision}</b><span style="font-size:14px;font-weight:800;color:#7a1f3d">${textoTarjeta(mundo, p, e)}</span></span></div>`;
  }).join('');
  return `<div class="capa-mapa">
<div class="mapa-cabecera"><span class="px" style="font-size:18px;color:#f2b632">${cfg.titulo}</span><span style="font-size:16px;font-weight:800;color:#fff">${cfg.subtitulo}</span>
<button type="button" class="boton btn" data-m="mundos" style="margin-left:auto">OTRO MUNDO</button><button type="button" class="boton btn" data-m="cerrar">CERRAR <span style="font-family:Nunito;font-size:13px;margin-left:6px">(M)</span></button></div>
<div class="mapa-abierto"><img src="${rutaImagen(cfg.imagen)}" alt="${cfg.titulo}" style="width:1280px;image-rendering:pixelated">
${etiquetas}${suelto}
<span class="tag yo" style="left:${(tu[0] + 0.5) * T}px;top:${(tu[1] + 1) * T + 2}px;font-size:15px">Tú</span>
${insignias}</div>
<div class="barra-misiones"><span class="px titulo-misiones">MISIONES</span>${tarjetas}</div></div>`;
}

// Chip del diálogo de bloqueo: «Falta la FICHA» con el objeto (diseño 509) o «🔒 Misión N bloqueada»
export function htmlChipBloqueo(mundo, falta, textoCandado) {
  const o = falta && objetoDe(mundo, falta);
  const plantilla = mundo.textosZona && mundo.textosZona.chipFalta;
  if (o && plantilla) {
    return `<img src="${rutaImagen(o.imagen)}" alt="" style="width:28px;image-rendering:pixelated">${plantilla.replace('{objeto}', o.articulo || o.nombre)}`;
  }
  return `${candado(24)}${textoCandado}`;
}

// Título del HUD según la parte del mapa donde está el jugador (mundos.json → areas; diseños 502 y 506)
export function tituloArea(mundo, c, r) {
  const a = (mundo.areas || []).find(({ rect: [c0, r0, c1, r1] }) => c >= c0 && c <= c1 && r >= r0 && r <= r1);
  return a ? a.titulo : mundo.titulo;
}

// Ventana «¡ENCONTRASTE UN OBJETO!» (diseño 304)
export function htmlObjetoEncontrado(objeto, nivelDesbloqueado) {
  const chip = nivelDesbloqueado ? `<span class="chip-guardado">Misión ${numero(nivelDesbloqueado)} desbloqueada · Guardado</span>` : '<span class="chip-guardado">Guardado</span>';
  return `<div class="capa-objeto"><div class="dim"></div><section class="ventana-objeto">
<h1 class="px">¡ENCONTRASTE UN OBJETO!</h1>
<div class="marco-objeto"><img src="${rutaImagen(objeto.imagen)}" alt=""></div>
<span class="px" style="font-size:20px">${escaparHtml(objeto.nombre)}</span>
<p>${objeto.texto}</p>${chip}
<button type="button" class="boton btn oro" data-objeto="cerrar" style="width:260px;height:58px;font-size:15px">CONTINUAR ▶</button></section></div>`;
}
