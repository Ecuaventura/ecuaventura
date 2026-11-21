import Phaser from 'phaser';
import { crearPantalla, conectarBotones, IMG } from './ui.js';

const TECLA = "height: 40px; display: flex; align-items: center; justify-content: center; background: #ffffff; border: 3px solid #1b1430; box-shadow: inset 0 -4px 0 #c9c2b6; font-family: 'Press Start 2P', monospace; font-size: 13px";
const TARJETA = 'display: flex; gap: 18px; align-items: center; padding: 18px; background: #fff8ec; border: 4px solid #1b1430; color: #1b1430';
const TITULO = "margin: 0; font-family: 'Press Start 2P', monospace; font-size: 15px; color: #7a1f3d";
const TEXTO = 'margin: 0; font-size: 19px; font-weight: 700; line-height: 1.35';
const ETIQUETA = 'padding: 10px 16px; background: #4e1027; border: 3px solid #1b1430; font-size: 18px; font-weight: 800';

// Pantalla de instrucciones — diseño: diseno/html/Instrucciones.html y diseno/pantallas/03_instrucciones.png
const HTML = `
<img src="${IMG}fondo_menu.png" alt="" aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 1366px; height: 768px; object-fit: cover; image-rendering: pixelated">
<div style="position: absolute; left: 0; top: 0; width: 1366px; height: 768px; background: rgba(27, 20, 48, 0.35)"></div>
<section style="position: absolute; left: 90px; top: 40px; width: 1186px; height: 680px; box-sizing: border-box; padding: 30px 36px; display: flex; flex-direction: column; gap: 22px; background: #7a1f3d; border: 4px solid #1b1430; box-shadow: inset 0 0 0 4px #f2b632, 0 8px 0 #1b1430; color: #ffffff">
<h1 style="margin: 0; text-align: center; font-family: 'Press Start 2P', monospace; font-size: 28px; color: #f2b632; text-shadow: 3px 3px 0 #1b1430">¿CÓMO SE JUEGA?</h1>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">
<article style="${TARJETA}">
<div style="display: grid; grid-template-columns: repeat(3, 40px); gap: 4px; flex: none" aria-hidden="true">
<span></span><span style="${TECLA}">↑</span><span></span>
<span style="${TECLA}">←</span><span style="${TECLA}">↓</span><span style="${TECLA}">→</span>
</div>
<div style="display: flex; flex-direction: column; gap: 6px">
<h2 style="${TITULO}">1 · MUÉVETE</h2>
<p style="${TEXTO}">Lleva a Ecu por el laberinto con las flechas del teclado o con las teclas W, A, S y D.</p>
</div>
</article>
<article style="${TARJETA}">
<div aria-hidden="true" style="flex: none; width: 92px; height: 92px; display: flex; align-items: center; justify-content: center; background: #6b3f1d; border: 4px solid #1b1430">
<div style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: #f2b632; border: 4px solid #1b1430; box-shadow: inset -4px -4px 0 #c98a14; font-family: 'Press Start 2P', monospace; font-size: 22px; color: #7a1f3d">x</div>
</div>
<div style="display: flex; flex-direction: column; gap: 6px">
<h2 style="${TITULO}">2 · ABRE LAS PUERTAS</h2>
<p style="${TEXTO}">Cada puerta dorada guarda una ecuación. Escribe el valor de x y pulsa COMPROBAR o la tecla Enter.</p>
</div>
</article>
<article style="${TARJETA}">
<div aria-hidden="true" style="flex: none; width: 92px; height: 92px; display: flex; align-items: center; justify-content: center; background: #2c3e7a; border: 4px solid #1b1430; box-shadow: inset -4px -4px 0 #1d2b58, inset 4px 4px 0 #4a5fa3; font-family: 'Press Start 2P', monospace; font-size: 34px; color: #ffffff">?</div>
<div style="display: flex; flex-direction: column; gap: 6px">
<h2 style="${TITULO}">3 · PIDE UNA PISTA</h2>
<p style="${TEXTO}">¿Te trabaste? Pulsa PISTA: te orienta sin darte la respuesta, pero descuenta puntos. Si fallas 3 veces, Ecu te ofrece una.</p>
</div>
</article>
<article style="${TARJETA}">
<div aria-hidden="true" style="flex: none; width: 92px; display: flex; gap: 2px; justify-content: center">
<img src="${IMG}estrella.png" alt="" style="width: 30px; height: 26px; image-rendering: pixelated">
<img src="${IMG}estrella.png" alt="" style="width: 30px; height: 26px; image-rendering: pixelated">
<img src="${IMG}estrella.png" alt="" style="width: 30px; height: 26px; image-rendering: pixelated">
</div>
<div style="display: flex; flex-direction: column; gap: 6px">
<h2 style="${TITULO}">4 · LLEGA A LA META</h2>
<p style="${TEXTO}">Llega a la bandera para completar el nivel y gana hasta 3 estrellas. ¡Así desbloqueas el siguiente nivel!</p>
</div>
</article>
</div>
<div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap">
<span style="${ETIQUETA}">✔ Acierto: <b style="color: #f2b632">+100</b></span>
<span style="${ETIQUETA}">? Con pista: <b style="color: #f2b632">+50</b></span>
<span style="${ETIQUETA}">20 niveles · 4 mundos</span>
<span style="${ETIQUETA}">Tu avance se guarda solo</span>
</div>
<div style="margin-top: auto; display: flex; justify-content: center; gap: 24px">
<button type="button" class="boton" data-accion="volver" style="display: flex; align-items: center; justify-content: center; width: 240px; height: 56px; background: #4e1027; color: #ffffff; font-family: 'Press Start 2P', monospace; font-size: 15px; border: 4px solid #1b1430; box-shadow: inset -4px -4px 0 #320a19, inset 4px 4px 0 #7a1f3d, 0 6px 0 #1b1430">◀ VOLVER</button>
<button type="button" class="boton" data-accion="jugar" style="display: flex; align-items: center; justify-content: center; width: 280px; height: 56px; background: #f2b632; color: #1b1430; font-family: 'Press Start 2P', monospace; font-size: 15px; border: 4px solid #1b1430; box-shadow: inset -4px -4px 0 #c98a14, inset 4px 4px 0 #ffd877, 0 6px 0 #1b1430">▶ ¡A JUGAR!</button>
</div>
</section>
<img src="${IMG}mascota.png" alt="" aria-hidden="true" style="position: absolute; right: 26px; bottom: 30px; width: 108px; height: 132px; image-rendering: pixelated">
`;

export default class Instrucciones extends Phaser.Scene {
  constructor() {
    super('Instrucciones');
  }

  init(data) {
    // superpuesta: se abrió con «?» desde la zona o un nivel, que quedan en pausa
    this.superpuesta = !!(data && data.superpuesta);
    this.desde = data && data.desde;
  }

  create() {
    // El fondo va en el DOM para que tape la escena en pausa que queda debajo
    const raiz = crearPantalla(this, HTML, { profundidad: this.superpuesta ? 100 : 0 });
    const volver = () => {
      if (this.superpuesta) {
        this.scene.resume(this.desde);
        this.scene.stop();
      } else {
        this.scene.start('Inicio');
      }
    };
    conectarBotones(raiz, {
      volver,
      jugar: () => (this.superpuesta ? volver() : this.scene.start('Jugador'))
    });

    // RF-02: volver con la tecla Esc
    this.input.keyboard.on('keydown-ESC', volver);
  }
}
