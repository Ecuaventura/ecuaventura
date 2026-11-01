// Pixel art del Mundo 1 (Mercado): misma receta que herramientas/gen_mundo1.py,
// pero dibujado en el navegador para armar cualquier mapa desde src/data/mapas.json.

import { Lienzo, K, aleatorio, contorno, crearCanvas } from './pixel.js';
import { T, crearCuadricula } from '../mundo/reglasMapa.js';

export { T };

export const ESCALA = 4;  // en pantalla cada cuadro mide 64 px

const PRODUCTOS = {
  papa: ['a8794a', '7d5530'], tomate: ['d9324a', '9e1f30'], choclo: ['f2c230', 'c99a14'],
  naranja: ['f28c28', 'c96a1a'], palta: ['3f8f3a', '25632a'], cebolla: ['c26aa8', '8d4a7a']
};

// ---------------------------------------------------------------- cuadros
function suelo(d, x, y, r) {
  d.rect(x, y, x + 15, y + 15, 'dcc79c');
  for (const [sx, sy, w, h] of [[1, 1, 6, 5], [9, 1, 6, 4], [1, 8, 4, 7], [6, 7, 5, 4], [12, 6, 3, 5], [6, 12, 8, 3]]) {
    d.rect(x + sx, y + sy, x + sx + w - 1, y + sy + h - 1, r.elegir(['cfb98c', 'd4bf93', 'c9b386']));
  }
}
function plaza(d, x, y) {
  d.rect(x, y, x + 15, y + 15, 'e8dcc0');
  d.linea(x, y + 15, x + 15, y + 15, 'd6c7a6');
  d.linea(x + 15, y, x + 15, y + 15, 'd6c7a6');
}
export function pasto(d, x, y, r) {
  d.rect(x, y, x + 15, y + 15, '5fae4f');
  for (let i = 0; i < 5; i++) {
    const gx = x + r.entero(15), gy = y + r.entero(14);
    d.linea(gx, gy, gx, gy + 1, '3f8f3a');
  }
}
export function flores(d, x, y, r) {
  pasto(d, x, y, r);
  for (let i = 0; i < 4; i++) {
    const fx = x + 2 + r.entero(11), fy = y + 2 + r.entero(11);
    const c = r.elegir(['f2b632', 'd9406a', 'ffffff', 'e8572a']);
    d.punto(fx, fy, c); d.punto(fx + 1, fy, c); d.punto(fx, fy + 1, c); d.punto(fx + 1, fy + 1, 'fff3a0');
  }
}
function cajon(d, x, y, r) {
  d.rect(x, y, x + 15, y + 15, '8a5a2b');
  d.rect(x + 1, y + 1, x + 14, y + 14, '6b3f1d');
  const [a, b] = PRODUCTOS[r.elegir(Object.keys(PRODUCTOS))];
  for (let yy = 2; yy < 14; yy += 3) {
    for (let xx = 2 + (Math.floor(yy / 3) % 2); xx < 14; xx += 3) {
      d.rect(x + xx, y + yy, x + xx + 1, y + yy + 1, a);
      d.punto(x + xx + 1, y + yy + 1, b);
    }
  }
  d.linea(x, y + 15, x + 15, y + 15, '4a2a12');
}
export function techo(d, x, y) {
  d.rect(x, y, x + 15, y + 15, 'b5482f');
  for (let yy = 0; yy < 16; yy += 4) {
    d.linea(x, y + yy + 3, x + 15, y + yy + 3, '8f3522');
    for (let xx = (Math.floor(yy / 4) % 2) * 2; xx < 16; xx += 4) d.punto(x + xx, y + yy + 1, 'd0623f');
  }
}
export function pared(d, x, y, tipo) {
  d.rect(x, y, x + 15, y + 15, 'f1e6cf');
  d.linea(x, y + 15, x + 15, y + 15, 'c9b48c');
  d.rect(x, y, x + 15, y + 1, '7a4a2a');
  if (tipo === 'W') {
    d.rect(x + 4, y + 4, x + 11, y + 11, '2c6fb5'); d.rect(x + 5, y + 5, x + 10, y + 10, '8cc8ff');
    d.linea(x + 7, y + 5, x + 7, y + 10, '2c6fb5'); d.linea(x + 5, y + 7, x + 10, y + 7, '2c6fb5');
  }
  if (tipo === 'D') {
    d.rect(x + 3, y + 4, x + 12, y + 15, '2c6fb5'); d.rect(x + 4, y + 5, x + 11, y + 15, '2560a0');
    d.punto(x + 10, y + 10, 'f2b632');
  }
}
export function bandera(d, x, y) {
  d.linea(x + 4, y + 1, x + 4, y + 15, K);
  for (let yy = 1; yy < 8; yy++) {
    for (let xx = 5; xx < 14; xx++) {
      d.punto(x + xx, y + yy, (Math.floor(xx / 2) + Math.floor(yy / 2)) % 2 ? 'ffffff' : K);
    }
  }
}

// ---------------------------------------------------------------- objetos
export function arbol(d, { x, y }) {
  d.rect(x + 13, y + 20, x + 18, y + 31, '6b3f1d');
  d.elipse(x + 1, y + 1, x + 30, y + 24, '2f7d3a');
  d.elipse(x + 4, y + 2, x + 26, y + 18, '3f9a48');
  for (const [a, b] of [[9, 6], [17, 9], [12, 13], [21, 5]]) d.rect(x + a, y + b, x + a + 2, y + b + 1, '62c25b');
}
function fuente(d, { x, y }) {
  d.elipse(x + 1, y + 3, x + 46, y + 46, '9a958c');
  d.elipse(x + 4, y + 6, x + 43, y + 43, 'b9b4aa');
  d.elipse(x + 7, y + 9, x + 40, y + 40, '2f7fd6');
  for (const [a, b] of [[14, 16], [28, 30], [30, 15], [15, 31]]) d.linea(x + a, y + b, x + a + 4, y + b, '8cc8ff');
  d.rect(x + 21, y + 14, x + 26, y + 30, 'b9b4aa'); d.rect(x + 19, y + 12, x + 28, y + 15, 'd8d3c8');
  d.rect(x + 22, y + 6, x + 25, y + 12, '8cc8ff');
}
function puesto(d, { x, y, ancho, toldo, productos }) {
  const W = ancho * T;
  const [t0, t1] = toldo;
  d.rect(x, y + 3, x + W - 1, y + 13, t0);
  for (let i = 0; i < W; i += 8) d.rect(x + i + 4, y + 3, x + i + 7, y + 13, t1);
  for (let i = 0; i < W; i += 8) d.elipse(x + i, y + 10, x + i + 8, y + 17, (i / 8) % 2 === 0 ? t0 : t1, null, true);
  d.linea(x, y + 3, x + W - 1, y + 3, K);
  d.rect(x + 1, y + 17, x + 2, y + 22, '6b3f1d'); d.rect(x + W - 3, y + 17, x + W - 2, y + 22, '6b3f1d');
  d.rect(x, y + 22, x + W - 1, y + 31, '8a5a2b'); d.rect(x, y + 22, x + W - 1, y + 23, 'a8743c');
  let gx = x + 3;
  for (const g of productos) {
    const [a, b] = PRODUCTOS[g];
    for (let k = 0; k < 3; k++) d.elipse(gx + k * 4, y + 18, gx + k * 4 + 4, y + 22, a, b);
    gx += Math.floor((W - 6) / productos.length);
  }
}
function sacos(d, { x, y }) {
  for (const [dx, dy] of [[0, 2], [7, 0], [4, 6]]) {
    d.elipse(x + dx, y + dy, x + dx + 8, y + dy + 9, 'c9a26b', '8a6a3b');
    d.linea(x + dx + 2, y + dy + 2, x + dx + 6, y + dy + 2, '8a6a3b');
  }
}
export function arco(d, { x, y }) {
  d.rect(x, y, x + 7, y + 63, '9a958c'); d.rect(x + 40, y, x + 47, y + 63, '9a958c');
  for (let yy = 0; yy < 64; yy += 6) {
    d.linea(x, y + yy, x + 7, y + yy, '7f7a72'); d.linea(x + 40, y + yy, x + 47, y + yy, '7f7a72');
  }
  d.rect(x - 2, y - 2, x + 49, y + 9, '7a1f3d'); d.rect(x - 2, y + 9, x + 49, y + 11, '4e1027');
  d.rect(x + 10, y + 2, x + 37, y + 7, 'f2b632');
}

const OBJETOS = { arbol, fuente, puesto, sacos, arco };

// ---------------------------------------------------------------- mapa completo
// Devuelve { canvas (a 16 px por cuadro), cuadricula } — la cuadrícula viene de reglasMapa.js
export function dibujarMapa(def, bloqueosExtra = []) {
  const filas = def.filas.length, columnas = def.filas[0].length;
  const canvas = crearCanvas(columnas * T, filas * T);
  const d = new Lienzo(canvas.getContext('2d'));
  const r = aleatorio(def.semilla ?? 3);

  def.filas.forEach((fila, ty) => {
    [...fila].forEach((ch, tx) => {
      const x = tx * T, y = ty * T;
      if (ch === ',') plaza(d, x, y);
      else if (ch === 'g') pasto(d, x, y, r);
      else if (ch === 'f') flores(d, x, y, r);
      else if (ch === 'R') techo(d, x, y);
      else if (ch === '#') cajon(d, x, y, r);
      else if ('wWD'.includes(ch)) pared(d, x, y, ch);
      else suelo(d, x, y, r);
      if (ch === 'B') bandera(d, x, y);
    });
  });

  for (const o of def.objetos || []) {
    OBJETOS[o.tipo](d, o);
  }
  return { canvas, cuadricula: crearCuadricula(def, bloqueosExtra) };
}

// ---------------------------------------------------------------- balanza
// Balanza de 150×72 px base (en pantalla x4 = 600×288).
// izquierda: { sacos: n, pesa: bool }   inclinacion: >0 sube la izquierda (lado liviano)
// Devuelve { canvas, anclas } con las posiciones (px base) de las etiquetas.
export function dibujarBalanza({ sacos: nSacos = 3, pesaIzquierda = false, inclinacion = 0 }) {
  const W = 150, H = 72, cx = 75;
  const canvas = crearCanvas(W, H);
  const d = new Lienzo(canvas.getContext('2d'));
  const anclas = { sacos: [], pesaIzquierda: null, derecha: null, sobreSaco: null };

  d.rect(cx - 18, H - 8, cx + 18, H - 2, '7a1f3d'); d.rect(cx - 14, H - 10, cx + 14, H - 8, '4e1027');
  d.rect(cx - 3, 18, cx + 3, H - 10, '8a8f9c'); d.rect(cx - 2, 18, cx - 1, H - 10, 'c4c8d2');
  const dy = inclinacion;
  const L = [cx - 50, 20 - dy], R = [cx + 50, 20 + dy];
  d.linea(L[0], L[1], R[0], R[1], '5d6475', 4);
  d.elipse(cx - 5, 15, cx + 5, 25, 'f2b632', K);
  for (const [px, py] of [L, R]) {
    d.linea(px, py, px - 16, py + 22, '5d6475'); d.linea(px, py, px + 16, py + 22, '5d6475');
    d.rect(px - 22, py + 22, px + 22, py + 25, 'c4c8d2'); d.rect(px - 22, py + 25, px + 22, py + 26, '8a8f9c');
  }

  // sacos a la izquierda: filas de hasta 3, la segunda fila encima
  const saco = (sx, sy) => {
    d.elipse(sx, sy, sx + 12, sy + 13, 'c9a26b', '6b4a2b');
    d.rect(sx + 4, sy - 1, sx + 8, sy + 2, '8a6a3b');
    anclas.sacos.push([sx + 6, sy + 6]);
  };
  const inicioIzq = pesaIzquierda ? L[0] - 19 : null;
  const filas = [];
  for (let i = 0; i < nSacos; i += 3) filas.push(Math.min(3, nSacos - i));
  filas.forEach((cuantos, f) => {
    const ancho = cuantos * 13;
    const x0 = inicioIzq ?? L[0] - Math.floor(ancho / 2);
    for (let i = 0; i < cuantos; i++) saco(x0 + i * 13 + (f ? 6 : 0), L[1] + 10 - f * 12);
  });
  if (anclas.sacos.length) anclas.sobreSaco = [anclas.sacos[0][0], L[1] + 2 - (filas.length - 1) * 12];

  const pesa = (bx, by, ww, wh) => {
    d.rect(bx, by, bx + ww, by + wh, '3a3f4c', K);
    d.rect(bx + Math.floor(ww / 2) - 2, by - 3, bx + Math.floor(ww / 2) + 2, by, '3a3f4c', K);
  };
  if (pesaIzquierda) {
    pesa(L[0] + 2, L[1] + 12, 14, 10);
    anclas.pesaIzquierda = [L[0] + 9, L[1] + 32];
  }
  for (const [wx, ww, wh] of [[-18, 14, 10], [-2, 12, 9], [12, 8, 7]]) pesa(R[0] + wx, R[1] + 22 - wh, ww, wh);
  anclas.derecha = [R[0] + 2, R[1] + 32];

  contorno(canvas);
  return { canvas, anclas };
}
