// Mapa con vista desde arriba: cuadrícula de 64 px, colisiones y personajes que
// caminan cuadro por cuadro (estilo RPG de Game Boy/GBA).

import { T, ESCALA } from '../arte/mercado.js';
import { dibujarMapa } from '../arte/mapas.js';
import MAPAS from '../data/mapas.json';

export const CUADRO = T * ESCALA;  // 64 px en pantalla
const PIES = 0.72;                 // altura de los pies dentro del cuadro
const DURACION_PASO = 150;

// Los mapas de 22 columnas (1408 px) se corren 21 px para centrarse en 1366 (como en las
// plantillas). Los mapas grandes (zona con cámara) empiezan en 0.
let desfaseX = -21;

export class MapaRPG {
  constructor(escena, idMapa, bloqueosExtra = []) {
    this.escena = escena;
    const def = MAPAS[idMapa];
    if (!def) throw new Error(`No existe el mapa ${idMapa}`);
    const clave = def.fondo || `mapa_${idMapa}`;
    const dibujo = dibujarMapa(def, bloqueosExtra, escena);
    if (dibujo.canvas && !escena.textures.exists(clave)) escena.textures.addCanvas(clave, dibujo.canvas);
    // Misma cuadrícula que usa herramientas/validarNiveles.mjs (src/mundo/reglasMapa.js)
    this.cuadricula = dibujo.cuadricula;
    this.columnas = dibujo.cuadricula.columnas;
    this.filas = dibujo.cuadricula.filas;
    this.ancho = this.columnas * CUADRO;
    this.alto = this.filas * CUADRO;
    this.grande = this.ancho > 1408 || this.alto > 768;
    desfaseX = this.grande ? 0 : -21;
    this.desfaseX = desfaseX;
    this.imagen = escena.add.image(desfaseX, 0, clave).setOrigin(0, 0).setScale(dibujo.escala ?? ESCALA).setDepth(-1000);
    this.personajes = [];
  }

  // Mapas grandes: la cámara sigue al jugador sin salirse del mapa
  seguir(personaje) {
    if (!this.grande) return;
    const cam = this.escena.cameras.main;
    cam.setBounds(0, 0, this.ancho, this.alto);
    cam.startFollow(personaje.sprite, true, 0.18, 0.18);
    cam.setFollowOffset(0, -20);
    cam.setRoundPixels(true);
  }

  // Posición en pantalla de un punto del mundo (para las etiquetas DOM)
  aPantalla(x, y) {
    const cam = this.escena.cameras.main;
    return [x - cam.scrollX, y - cam.scrollY];
  }

  esSolido(c, r) {
    return this.cuadricula.esSolido(c, r);
  }

  ocupadoPor(c, r, excepto = null) {
    return this.personajes.find((p) => p !== excepto && p.bloquea && p.c === c && p.r === r) || null;
  }

  libre(c, r, excepto = null) {
    return !this.esSolido(c, r) && !this.ocupadoPor(c, r, excepto);
  }

  agregar(personaje) {
    this.personajes.push(personaje);
    return personaje;
  }
}

export function centroX(c) {
  return c * CUADRO + CUADRO / 2 + desfaseX;
}
export function piesY(r) {
  return (r + PIES) * CUADRO;
}

const FILA_HOJA = { abajo: 0, izquierda: 1, derecha: 2, arriba: 3 };

// Personaje sobre la cuadrícula. bloquea = otros no pueden pisar su cuadro.
// hoja: hoja de animación (p1_hoja…) con las 4 direcciones; si no, imagen fija.
export class Personaje {
  constructor(escena, textura, c, r, { bloquea = true, texturaArriba = null, pies = PIES, hoja = null } = {}) {
    this.escena = escena;
    this.c = c;
    this.r = r;
    this.bloquea = bloquea;
    this.texturaAbajo = textura;
    this.texturaArriba = texturaArriba;
    this.hoja = hoja;
    this.pies = pies;
    this.moviendo = false;
    this.direccion = 'abajo';
    this.sprite = hoja
      ? escena.add.sprite(centroX(c), this.yPies(r), hoja, 0).setOrigin(0.5, 1)
      : escena.add.image(centroX(c), this.yPies(r), textura).setOrigin(0.5, 1);
    this.actualizarProfundidad();
  }

  // Un vecino ayudado pierde la colisión para siempre (nadie puede volver a activarla)
  get bloquea() { return this._bloquea && !this.ayudado; }
  set bloquea(valor) { this._bloquea = valor; }

  marcarAyudado() {
    this.ayudado = true;
  }

  // Dibujo en una posición exacta (en px) sin cambiar su cuadro lógico
  colocarEn(x, piesY) {
    this.sprite.setPosition(x, piesY);
    this.actualizarProfundidad();
  }

  desvanecer(duracion = 400) {
    return new Promise((resolver) => {
      this.escena.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: duracion,
        onComplete: () => {
          this.sprite.setVisible(false);
          this.desvanecido = true;
          resolver();
        }
      });
    });
  }

  yPies(r) {
    return (r + this.pies) * CUADRO;
  }

  get x() { return this.sprite.x; }
  get yPiesActual() { return this.sprite.y; }
  get yCabeza() { return this.sprite.y - this.sprite.displayHeight; }

  mirar(direccion) {
    this.direccion = direccion;
    if (this.hoja) {
      if (!this.moviendo) this.sprite.setFrame(FILA_HOJA[direccion] * 3);
      return;
    }
    if (!this.texturaArriba) return;
    this.sprite.setTexture(direccion === 'arriba' ? this.texturaArriba : this.texturaAbajo);
  }

  actualizarProfundidad() {
    this.sprite.setDepth(this.sprite.y);
  }

  // Camina al cuadro (c, r) con una animación corta; devuelve una promesa
  caminarA(c, r, duracion = DURACION_PASO) {
    const dir = c > this.c ? 'derecha' : c < this.c ? 'izquierda' : r < this.r ? 'arriba' : 'abajo';
    this.c = c;
    this.r = r;
    this.moviendo = true;
    if (this.hoja) {
      this.direccion = dir;
      this.sprite.play(`${this.hoja}_${dir}`, true);
    }
    return new Promise((resolver) => {
      this.escena.tweens.add({
        targets: this.sprite,
        x: centroX(c),
        y: this.yPies(r),
        duration: duracion,
        onUpdate: () => this.actualizarProfundidad(),
        onComplete: () => {
          this.moviendo = false;
          this.actualizarProfundidad();
          // si no sigue caminando en el próximo cuadro, se queda quieto mirando a ese lado
          this.escena.time.delayedCall(40, () => {
            if (!this.moviendo && this.hoja) {
              this.sprite.stop();
              this.sprite.setFrame(FILA_HOJA[this.direccion] * 3);
            }
          });
          resolver();
        }
      });
      if (!this.hoja) {
        // pequeño rebote al caminar (los sprites fijos no tienen animación)
        this.escena.tweens.add({ targets: this.sprite, scaleY: 0.94, duration: duracion / 2, yoyo: true });
      }
    });
  }

  async recorrer(camino, duracion = 220) {
    for (const [c, r] of camino) await this.caminarA(c, r, duracion);
  }
}

// El protagonista: el personaje que eligió el alumno (p1 a p4)
export function crearJugador(escena, c, r) {
  const estudiante = escena.registry.get('estudiante') || {};
  const p = estudiante.personaje || 'p1';
  return new Personaje(escena, `${p}_sprite`, c, r, { hoja: `${p}_hoja` });
}

const DIRECCIONES = {
  arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0]
};

// Lee flechas / WASD sin capturar las teclas (para no bloquear las cajas de texto)
export class ControlMovimiento {
  constructor(escena) {
    const k = escena.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D', false);
    this.teclas = k;
  }

  direccion() {
    const k = this.teclas;
    if (k.UP.isDown || k.W.isDown) return 'arriba';
    if (k.DOWN.isDown || k.S.isDown) return 'abajo';
    if (k.LEFT.isDown || k.A.isDown) return 'izquierda';
    if (k.RIGHT.isDown || k.D.isDown) return 'derecha';
    return null;
  }
}

export function vecino(c, r, direccion) {
  const [dc, dr] = DIRECCIONES[direccion];
  return [c + dc, r + dr];
}

// Mueve al jugador un cuadro si se puede; Ecu lo sigue al cuadro que dejó
export function pasoJugador(mapa, jugador, seguidor, direccion, alPisar) {
  if (jugador.moviendo) return;
  jugador.mirar(direccion);
  const [c, r] = vecino(jugador.c, jugador.r, direccion);
  if (!mapa.libre(c, r, jugador)) return;
  const anterior = [jugador.c, jugador.r];
  jugador.caminarA(c, r).then(() => alPisar && alPisar(c, r));
  if (seguidor && (seguidor.c !== anterior[0] || seguidor.r !== anterior[1])) {
    seguidor.caminarA(anterior[0], anterior[1]);
  }
}

// ¿El jugador está junto a (c, r)? (arriba, abajo, izquierda o derecha)
export function estaJunto(jugador, c, r) {
  return Math.abs(jugador.c - c) + Math.abs(jugador.r - r) === 1;
}
