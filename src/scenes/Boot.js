import Phaser from 'phaser';
import RECURSOS from '../data/recursos.json';

// Carga imágenes (lista en src/data/recursos.json) y tipografías antes de mostrar el menú
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath('assets/img/');
    for (const [carpeta, claves] of Object.entries(RECURSOS.imagenes)) {
      claves.forEach((clave) => this.load.image(clave, `${carpeta ? `${carpeta}/` : ''}${clave}.png`));
    }
    for (const [carpeta, claves] of Object.entries(RECURSOS.hojas)) {
      claves.forEach((clave) => this.load.spritesheet(clave, `${carpeta}/${clave}.png`, { frameWidth: 64, frameHeight: 88 }));
    }
  }

  create() {
    // Espera a las fuentes para que el texto DOM no aparezca con la tipografía de respaldo
    const fuentes = [
      document.fonts.load('16px "Press Start 2P"'),
      document.fonts.load('800 16px "Nunito"'),
      document.fonts.load('900 16px "Nunito"')
    ];
    // Animaciones de caminar de los personajes (filas: abajo, izquierda, derecha, arriba)
    for (const clave of RECURSOS.hojas.personajes) {
      ['abajo', 'izquierda', 'derecha', 'arriba'].forEach((dir, fila) => {
        this.anims.create({
          key: `${clave}_${dir}`,
          frames: this.anims.generateFrameNumbers(clave, { frames: [fila * 3 + 1, fila * 3, fila * 3 + 2, fila * 3] }),
          frameRate: 10,
          repeat: -1
        });
      });
    }
    Promise.all(fuentes)
      .catch(() => {})
      .then(() => this.scene.start('Inicio'));
  }
}
