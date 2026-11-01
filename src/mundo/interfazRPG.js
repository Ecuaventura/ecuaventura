// Piezas DOM de las pantallas RPG (diseno/html/mundo1): etiquetas sobre los personajes,
// cuadro de diálogo con retrato y aviso «ESPACIO Hablar».

import { escaparHtml, rutaImagen, activarClics } from '../scenes/ui.js';

export function crearElemento(padre, html) {
  const plantilla = document.createElement('template');
  plantilla.innerHTML = html.trim();
  const el = plantilla.content.firstElementChild;
  padre.appendChild(el);
  activarClics(el);
  return el;
}

export function colocar(el, x, y) {
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
}

// Coloca un elemento DOM sobre un punto del mundo (considera la cámara en mapas grandes)
export function colocarEnMundo(mapa, el, x, y) {
  const [sx, sy] = mapa ? mapa.aPantalla(x, y) : [x, y];
  colocar(el, sx, sy);
}

// Aviso «ESPACIO Hablar» a la derecha del jugador, o a la izquierda si no entra en pantalla
export function colocarAviso(aviso, jugador, mapa = null) {
  const ancho = aviso.offsetWidth || 160;
  const [jx, jy] = mapa ? mapa.aPantalla(jugador.x, jugador.yPiesActual) : [jugador.x, jugador.yPiesActual];
  const derecha = jx + 78;
  const x = derecha + ancho > 1356 ? jx - 78 - ancho : derecha;
  colocar(aviso, x, jy - 86);
}

export function mostrar(el, visible) {
  el.style.display = visible ? '' : 'none';
}

// Chip con el sprite y el nombre del jugador (barra superior)
export function htmlChip(nombre, sprite = 'p1_sprite') {
  return `<div class="chip"><img src="${rutaImagen(sprite)}" alt="">${escaparHtml(nombre)}</div>`;
}

// Cuadro de diálogo inferior: retrato + texto + columna derecha opcional
export function htmlDialogo({ retrato, nombre, lateral = '' }) {
  return `<div class="dlg">
<div class="ret"><div class="fr"><img src="${rutaImagen(retrato)}" alt=""></div><span class="nm">${nombre.toUpperCase()}</span></div>
<div class="txt"></div>
${lateral ? `<div class="resp">${lateral}</div>` : ''}
</div>`;
}

// Elige un cuadro libre junto a (c, r) para poner a Ecu
export function cuadroJunto(mapa, c, r) {
  for (const [dc, dr] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
    if (mapa.libre(c + dc, r + dr)) return [c + dc, r + dr];
  }
  return [c, r];
}
