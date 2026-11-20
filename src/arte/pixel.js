// Primitivas de pixel art sobre un canvas 2D (equivalentes a las de Pillow usadas
// en herramientas/gen_mundo1.py). Coordenadas inclusivas, como ImageDraw.

export const K = '#1b1430';

export function color(c) {
  return c.startsWith('#') || c.startsWith('rgb') ? c : `#${c}`;
}

// Generador pseudoaleatorio con semilla (para que el mapa sea siempre igual)
export function aleatorio(semilla) {
  let s = semilla >>> 0;
  const siguiente = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    siguiente,
    elegir: (lista) => lista[Math.floor(siguiente() * lista.length)],
    entero: (n) => Math.floor(siguiente() * n)
  };
}

export class Lienzo {
  constructor(ctx) {
    this.ctx = ctx;
  }

  rect(x0, y0, x1, y1, relleno, borde) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    if (x1 < x0 || y1 < y0) return;
    const ctx = this.ctx;
    if (borde) {
      ctx.fillStyle = color(borde);
      ctx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      if (relleno && x1 - x0 >= 2 && y1 - y0 >= 2) {
        ctx.fillStyle = color(relleno);
        ctx.fillRect(x0 + 1, y0 + 1, x1 - x0 - 1, y1 - y0 - 1);
      }
      return;
    }
    ctx.fillStyle = color(relleno);
    ctx.fillRect(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }

  punto(x, y, c) {
    this.rect(x, y, x, y, c);
  }

  // Línea de Bresenham; con ancho > 1 dibuja una franja vertical centrada
  linea(x0, y0, x1, y1, c, ancho = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const mitad = Math.floor(ancho / 2);
    for (;;) {
      if (ancho > 1) this.rect(x0, y0 - mitad, x0, y0 - mitad + ancho - 1, c);
      else this.punto(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  dentroElipse(x0, y0, x1, y1, px, py) {
    const rx = (x1 - x0 + 1) / 2, ry = (y1 - y0 + 1) / 2;
    const cx = x0 + rx, cy = y0 + ry;
    const nx = (px + 0.5 - cx) / rx, ny = (py + 0.5 - cy) / ry;
    return nx * nx + ny * ny <= 1;
  }

  elipse(x0, y0, x1, y1, relleno, borde, soloMitadInferior = false) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const cy = (y0 + y1 + 1) / 2;
    const dentro = (px, py) => this.dentroElipse(x0, y0, x1, y1, px, py) && (!soloMitadInferior || py + 0.5 >= cy);
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        if (!dentro(px, py)) continue;
        const esBorde = borde && (!dentro(px + 1, py) || !dentro(px - 1, py) || !dentro(px, py + 1) || !dentro(px, py - 1));
        this.punto(px, py, esBorde ? borde : relleno);
      }
    }
  }
}

// Contorno de 1 px color K alrededor de todo lo no transparente (como outline() en Python)
export function contorno(canvas) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(img.data);
  const alfa = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? src[(y * w + x) * 4 + 3] : 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] === 0 && (alfa(x + 1, y) || alfa(x - 1, y) || alfa(x, y + 1) || alfa(x, y - 1))) {
        img.data[i] = 27; img.data[i + 1] = 20; img.data[i + 2] = 48; img.data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function crearCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return canvas;
}
