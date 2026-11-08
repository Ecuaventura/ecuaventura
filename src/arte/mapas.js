// Dibuja un mapa de mapas.json según su "estilo" (un archivo de arte por mundo)
import { dibujarMapa as dibujarMapaMercado } from './mercado.js';
import { crearCanvas } from './pixel.js';
import { crearCuadricula, tramosTerminal } from '../mundo/reglasMapa.js';

const CUADRO = 64;

// Estilo "imagen": el fondo ya viene dibujado (mapa_*_fondo_x4.png); solo se arma la cuadrícula.
// parches: [sx, sy, ancho, alto, dx, dy] copian un trozo del mismo fondo encima de otro (en px de
// la imagen); sirven para borrar personajes que vienen pintados en los interiores del Puerto.
function dibujarMapaImagen(def, bloqueosExtra, escena) {
  let canvas = null;
  if (def.parches && escena) {
    const imagen = escena.textures.get(def.fondo).getSourceImage();
    canvas = crearCanvas(imagen.width, imagen.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imagen, 0, 0);
    for (const [sx, sy, w, h, dx, dy] of def.parches) ctx.drawImage(imagen, sx, sy, w, h, dx, dy, w, h);
  }
  return { canvas, cuadricula: crearCuadricula(def, bloqueosExtra), escala: 1 };
}

// Borde inferior del andén (última fila de la terminal): concreto gris y franja de peligro
function bordeAnden(ctx, c, r) {
  const x = c * CUADRO, y = r * CUADRO;
  ctx.fillStyle = '#a3a8b3'; ctx.fillRect(x, y, CUADRO, CUADRO);
  ctx.fillStyle = '#c4c8d2'; ctx.fillRect(x, y, CUADRO, 20);
  ctx.fillStyle = '#1b1430'; ctx.fillRect(x, y + 34, CUADRO, 30);
  ctx.fillStyle = '#f2c230';
  for (let i = -32; i < CUADRO; i += 16) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + 64); ctx.lineTo(x + i + 8, y + 64); ctx.lineTo(x + i + 24, y + 34); ctx.lineTo(x + i + 16, y + 34);
    ctx.closePath(); ctx.fill();
  }
}

// Estilo "tileset": laberintos con un tileset de cuadros de 64 px.
// Mercado (tileset_laberinto_mercado.png): suelo, techo, puestos de colores, canasta n, bandera B.
// Terminal (muros: "buses"): cada tramo de # se arma con buses de 4 cuadros (buses_muro_terminal.png),
// lo que sobra son postes, la última fila es el borde del andén y hay franjas amarillas junto a los buses.
function dibujarMapaTileset(def, bloqueosExtra, escena) {
  const filas = def.filas.length, columnas = def.filas[0].length;
  const canvas = crearCanvas(columnas * CUADRO, filas * CUADRO);
  const ctx = canvas.getContext('2d');
  const imagen = escena.textures.get(def.tileset.imagen).getSourceImage();
  const t = def.tileset.orden;
  const cuadro = (indice, c, r) => ctx.drawImage(imagen, indice * CUADRO, 0, CUADRO, CUADRO, c * CUADRO, r * CUADRO, CUADRO, CUADRO);
  const conBuses = def.muros === 'buses';
  const buses = conBuses ? escena.textures.get(def.tileset.buses.imagen).getSourceImage() : null;
  const esMuro = (c, r) => def.filas[r] && def.filas[r][c] === '#';

  def.filas.forEach((fila, r) => {
    const tramos = conBuses ? tramosTerminal(fila) : null;
    const filaBorde = conBuses && r === filas - 1 && !fila.replace(/#/g, '');
    [...fila].forEach((ch, c) => {
      if (ch === 'R') { cuadro(t.techo, c, r); return; }
      if (ch === '#') {
        if (!conBuses) {
          // los puestos del mercado cambian de color cada 4 cuadros, como en la plantilla 12
          cuadro(t.puestos[(Math.floor(c / 4) + r) % t.puestos.length], c, r);
        } else if (filaBorde) {
          bordeAnden(ctx, c, r);
        } else if (tramos[c] !== 'bus') {
          cuadro(t.suelo, c, r);
          cuadro(t.poste, c, r);
        }
        return;
      }
      cuadro(t.suelo, c, r);
      if (ch === 'n') cuadro(t.canasta, c, r);
      if (ch === 'B') cuadro(t.bandera, c, r);
      // franjas amarillas del andén junto a los buses (arriba y abajo)
      if (conBuses) {
        ctx.fillStyle = '#f2c230';
        if (esMuro(c, r - 1) && r - 1 < filas - 1) ctx.fillRect(c * CUADRO, r * CUADRO, CUADRO, 6);
        if (esMuro(c, r + 1) && r + 1 < filas - 1) ctx.fillRect(c * CUADRO, r * CUADRO + 58, CUADRO, 6);
      }
    });
    // buses de 4 cuadros donde empieza cada grupo
    if (conBuses && !filaBorde) {
      let c = 0;
      while (c < tramos.length) {
        if (tramos[c] === 'bus') {
          const color = (Math.floor(c / 4) + r) % def.tileset.buses.colores;
          cuadro(t.suelo, c, r); cuadro(t.suelo, c + 1, r); cuadro(t.suelo, c + 2, r); cuadro(t.suelo, c + 3, r);
          ctx.drawImage(buses, 0, color * CUADRO, CUADRO * 4, CUADRO, c * CUADRO, r * CUADRO, CUADRO * 4, CUADRO);
          c += 4;
        } else c++;
      }
    }
  });
  return { canvas, cuadricula: crearCuadricula(def, bloqueosExtra), escala: 1 };
}

const ESTILOS = {
  mercado: dibujarMapaMercado,
  imagen: dibujarMapaImagen,
  tileset: dibujarMapaTileset
};

export function dibujarMapa(def, bloqueosExtra = [], escena = null) {
  const dibujar = ESTILOS[def.estilo || 'mercado'];
  if (!dibujar) throw new Error(`Estilo de mapa desconocido: ${def.estilo}`);
  return dibujar(def, bloqueosExtra, escena);
}
