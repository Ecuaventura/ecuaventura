import Phaser from 'phaser';
import Boot from './scenes/Boot.js';
import Inicio from './scenes/Inicio.js';
import Jugador from './scenes/Jugador.js';
import Instrucciones from './scenes/Instrucciones.js';
import Zona from './scenes/Zona.js';
import Nivel from './scenes/Nivel.js';
import NivelCompletado from './scenes/NivelCompletado.js';
import MundoCompletado from './scenes/MundoCompletado.js';
import Final from './scenes/Final.js';

// Todas las pantallas se diseñaron a 1366×768; FIT las escala a otras resoluciones
const config = {
  type: Phaser.AUTO,
  width: 1366,
  height: 768,
  parent: 'juego',
  backgroundColor: '#2f5fc4',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // Paneles, textos y botones se construyen con DOM copiando el CSS de diseno/html
  dom: {
    createContainer: true
  },
  scene: [Boot, Inicio, Jugador, Instrucciones, Zona, Nivel, NivelCompletado, MundoCompletado, Final]
};

const juego = new Phaser.Game(config);

// Solo durante npm run dev: permite revisar el juego desde la consola del navegador
if (import.meta.env.DEV) window.__juego = juego;
