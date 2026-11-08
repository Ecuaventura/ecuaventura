import Phaser from 'phaser';
import { crearPantalla, conectarBotones, rellenar, rutaImagen, escaparHtml } from './ui.js';
import * as almacen from '../db/almacen.js';
import NIVELES from '../data/niveles.json';
import MUNDOS from '../data/mundos.json';

// Mundo completado: el cóndor vuela con el jugador y Ecu — diseños: diseno/html/mundo1/18 y mundo2/28.
// El último mundo (mundos.json → final, diseño 9_mundo5_feria/514) cambia SIGUIENTE MUNDO por VER EL FINAL.
export default class MundoCompletado extends Phaser.Scene {
  constructor() {
    super('MundoCompletado');
  }

  init(data) {
    this.idMundo = (data && data.mundo) || 1;
  }

  create() {
    const estudiante = this.registry.get('estudiante');
    const mundo = MUNDOS.mundos.find((m) => m.id === this.idMundo);
    const niveles = NIVELES.niveles.filter((n) => n.mundo === mundo.id);
    const siguienteMundo = MUNDOS.mundos.find((m) => m.id === mundo.siguienteMundo && !m.pendiente);
    const final = !!mundo.final;
    const textoBoton = final ? 'VER EL FINAL ▶' : siguienteMundo ? 'SIGUIENTE MUNDO ▶' : 'SIGUIENTE MUNDO · PRONTO';
    const activo = final || !!siguienteMundo;
    this.add.image(683, 384, 'fondo_menu');

    const estrella = (on) => `<img src="${rutaImagen(on ? 'estrella' : 'estrella_off')}" alt="" style="width:22px;image-rendering:pixelated">`;
    let total = 0;
    const tarjetas = niveles.map((n) => {
      const p = almacen.progresoNivel(estudiante.id, n.id);
      total += p.estrellas;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 10px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span class="px" style="font-size:14px">${n.numero}</span><span style="display:flex">${[1, 2, 3].map((k) => estrella(k <= p.estrellas)).join('')}</span></div>`;
    }).join('');

    const raiz = crearPantalla(this, `
<div style="position:absolute;inset:0;background:linear-gradient(rgba(27,20,48,0),rgba(27,20,48,.35))"></div>
<div class="vuelo" style="position:absolute;left:-700px;top:40px;width:640px;height:320px">
<div class="volando" style="position:relative;width:640px;height:320px"><img src="${rutaImagen('condor_vuelo')}" alt="El cóndor vuela con ${escaparHtml(estudiante.nombre)} y Ecu" style="width:640px;image-rendering:pixelated">
${(estudiante.personaje || 'p1') !== 'p1' ? `<img src="${rutaImagen(`${estudiante.personaje}_sprite`)}" alt="" style="position:absolute;left:288px;top:50px;width:76px;height:105px;image-rendering:pixelated">` : ''}
<div class="tag yo" style="left:379px;top:12px">${escaparHtml(estudiante.nombre)}</div></div></div>
<section style="position:absolute;left:213px;top:392px;width:940px;padding:22px 30px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:26px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡MUNDO ${mundo.id} COMPLETADO!</h1>
<span style="font-size:21px;font-weight:800;text-align:center;line-height:1.4">${rellenar('¡Gracias, {nombre}!', { nombre: estudiante.nombre })} ${mundo.textoCompletado}<br>${mundo.textoViaje}</span>
<div style="display:flex;gap:10px;align-items:center">${tarjetas}<div style="padding:10px 14px;background:#f2b632;color:#1b1430;border:3px solid #1b1430;font-family:'Press Start 2P';font-size:13px">★ ${total} / ${niveles.length * 3}</div></div>
<div style="width:100%;display:flex;gap:14px;margin-top:4px;align-items:center"><button type="button" class="boton btn" data-accion="zona" style="flex:1;height:58px;background:#4e1027">${mundo.textoVolver}</button><button type="button" class="boton btn oro" data-accion="siguiente" style="flex:1.5;height:64px;font-size:15px${activo ? '' : ';opacity:.55;cursor:default'}"${activo ? '' : ' disabled'}>${textoBoton}</button></div></section>`, { clase: 'rpg' });

    conectarBotones(raiz, {
      zona: () => this.scene.start('Zona', { mundo: mundo.id, regresoNivel: niveles[niveles.length - 1].id }),
      // el cóndor lleva al jugador al mundo siguiente (si ya existe en mundos.json)
      siguiente: final ? () => this.scene.start('Final') : siguienteMundo ? () => this.scene.start('Zona', { mundo: siguienteMundo.id }) : null
    });

    // El cóndor entra volando desde la izquierda hasta su lugar del diseño (left: 363px)
    const vuelo = raiz.querySelector('.vuelo');
    const estado = { x: -700 };
    this.tweens.add({
      targets: estado,
      x: 363,
      duration: 1600,
      ease: 'Sine.easeOut',
      onUpdate: () => { vuelo.style.left = `${estado.x}px`; }
    });
  }
}
