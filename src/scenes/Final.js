import Phaser from 'phaser';
import { crearPantalla, conectarBotones, confirmar, rellenar, rutaImagen, escaparHtml } from './ui.js';
import * as almacen from '../db/almacen.js';
import NIVELES from '../data/niveles.json';

// Final del juego: la inauguración del nuevo local del colegio — diseño: diseño/9_mundo5_feria/515_final_25_niveles.png
// (y diseño/6_final). Se llega desde «¡MUNDO 5 COMPLETADO!» con VER EL FINAL. Fondo: mundo4v2/vista_final_colegio.png.
// Los vecinos de los 5 mundos celebran en la vereda; el jugador corta la cinta con Ecu y el cóndor vuela arriba.

// Vecinos de la fiesta (izquierda y derecha del jugador)
const IZQUIERDA = ['sprite_feliza', 'sprite_carmen', 'sprite_jhon', 'sprite_pancho', 'sprite_julio', 'sprite_nino_globo', 'sprite_sofia'];
const DERECHA = ['sprite_tombolera', 'sprite_elena', 'sprite_teofilo', 'sprite_rosa_m', 'sprite_tomas', 'sprite_aurelio', 'sprite_don_lucho'];

const CONFETI = [
  [86, 140, '#f2b632', 20], [245, 200, '#1fa36b', 45], [305, 330, '#d9406a', 10], [565, 420, '#f2b632', 30],
  [825, 410, '#d9406a', 60], [1005, 160, '#2c6fb5', 15], [1105, 260, '#f2b632', 40], [1205, 360, '#1fa36b', 0],
  [1255, 120, '#d9406a', 25], [155, 380, '#2c6fb5', 50], [660, 140, '#1fa36b', 35], [455, 250, '#f2b632', 70]
];

// 5850 → «5 850»
const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default class Final extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  create() {
    const estudiante = this.registry.get('estudiante');
    if (!estudiante) {
      this.scene.start('Inicio');
      return;
    }
    // el fondo mide 1408×768 y se centra como los mapas (x = -21)
    this.add.image(-21, 0, 'vista_final_colegio').setOrigin(0, 0);

    const r = almacen.resumenFinal(estudiante.id);
    const total = NIVELES.niveles.length;
    const maxEstrellas = total * 3;
    const personaje = estudiante.personaje || 'p1';
    const nombre = escaparHtml(estudiante.nombre);

    const vecinos = (lista, x0) => lista.map((clave, i) => `<img class="pj-final" src="${rutaImagen(clave)}" alt="" style="left:${x0 + i * 68}px;top:${i % 2 ? 462 : 478}px;animation-delay:${(i % 4) * 0.2}s">`).join('');
    const dato = (titulo, valor, color) => `<div class="dato-final"><span>${titulo}</span><b class="px" style="color:${color}">${valor}</b></div>`;
    const cinta = (x, ang) => `<span style="position:absolute;left:${x}px;top:492px;width:128px;height:8px;background:#d9304f;border:2px solid #1b1430;transform:rotate(${ang}deg);transform-origin:${ang > 0 ? 'left' : 'right'} center"></span>`;
    const textoJugar = r.estrellas < maxEstrellas ? `JUGAR DE NUEVO<br>POR ${maxEstrellas} ★` : 'JUGAR DE NUEVO';

    const raiz = crearPantalla(this, `
<div class="px" style="position:absolute;left:50%;top:6px;transform:translateX(-50%);padding:12px 22px;background:#7a1f3d;color:#f2b632;border:4px solid #1b1430;box-shadow:inset 0 0 0 3px #f2b632,0 6px 0 #1b1430;font-size:20px;white-space:nowrap;text-shadow:2px 2px 0 #1b1430">¡INAUGURAMOS EL NUEVO LOCAL!</div>
<div class="px" style="position:absolute;left:498px;top:62px;width:374px;height:46px;display:flex;align-items:center;justify-content:center;color:#7a1f3d;font-size:14px">I.E. MICAELA BASTIDAS</div>
<div class="vuelo-final" style="position:absolute;left:1046px;top:92px;width:282px;height:141px">
<div class="volando" style="position:relative;width:282px;height:141px"><div style="position:absolute;left:0;top:0;width:640px;height:320px;transform:scale(.44);transform-origin:0 0"><img src="${rutaImagen('condor_vuelo')}" alt="El cóndor celebra volando" style="width:640px;image-rendering:pixelated">
${personaje !== 'p1' ? `<img src="${rutaImagen(`${personaje}_sprite`)}" alt="" style="position:absolute;left:288px;top:50px;width:76px;height:105px;image-rendering:pixelated">` : ''}</div></div></div>
${vecinos(IZQUIERDA, 22)}${vecinos(DERECHA, 862)}
${cinta(560, 14)}${cinta(732, -14)}
<img class="pj-final" src="${rutaImagen('sprite_ecu')}" alt="Ecu" style="left:596px;top:452px;width:58px;height:72px;animation-delay:.3s">
<img src="${rutaImagen(`${personaje}_sprite`)}" alt="${nombre}" style="position:absolute;left:662px;top:420px;width:80px;height:110px;image-rendering:pixelated">
<div class="tag yo" style="left:702px;top:388px">${nombre}</div>
${CONFETI.map(([x, y, c, g], i) => `<span class="conf conf-final" style="left:${x}px;top:${y}px;background:${c};transform:rotate(${g}deg);animation-delay:${(i % 6) * 0.35}s"></span>`).join('')}
<section class="panel-final">
<div style="display:flex;align-items:center;gap:22px"><h1 class="px" style="margin:0;font-size:18px;color:#f2b632;white-space:nowrap;text-shadow:2px 2px 0 #1b1430">${rellenar('¡FELICIDADES, {nombre}!', { nombre: estudiante.nombre }).toUpperCase()}</h1>
<span style="font-size:17px;font-weight:800;line-height:1.35">Resolviste los <b style="color:#f2b632">${r.niveles} niveles</b> y ayudaste a terminar el nuevo local de la <b style="color:#f2b632">I.E. N° 54037 Micaela Bastidas Puyucahua</b>. ¡Ahora dominas las ecuaciones de primer grado!</span></div>
<div style="display:flex;align-items:stretch;gap:10px">
${dato('Niveles', `${r.niveles}/${total}`, '#157a4f')}${dato('Estrellas', `${r.estrellas}/${maxEstrellas}`, '#c98a14')}${dato('Puntaje total', miles(r.puntaje), '#7a1f3d')}${dato('Mejor racha', `x${r.mejorRacha}`, '#e8572a')}${dato('Tiempo', `${r.minutos} min`, '#1b1430')}
<button type="button" class="boton btn" data-accion="salir" style="flex:1;background:#4e1027">SALIR</button>
<button type="button" class="boton btn" data-accion="niveles" style="flex:1;background:#4e1027">NIVELES</button>
<button type="button" class="boton btn oro" data-accion="jugar" style="flex:1.3;font-size:13px;line-height:1.5;text-align:center">${textoJugar}</button></div>
</section>`, { clase: 'rpg' });

    conectarBotones(raiz, {
      salir: async () => {
        const si = await confirmar(raiz, {
          titulo: '¿VOLVER AL MENÚ?',
          texto: 'Tu avance ya está guardado. Volverás al menú principal.',
          si: 'SÍ, VOLVER'
        });
        if (si) this.scene.start('Inicio');
      },
      // abre la Feria con el selector de mundos encima
      niveles: () => this.scene.start('Zona', { mundo: 5, elegirMundo: true }),
      // volver a empezar desde el Mercado para mejorar las estrellas (no se borra nada)
      jugar: () => this.scene.start('Zona', { mundo: 1 })
    });

    // El cóndor entra volando desde la derecha
    const vuelo = raiz.querySelector('.vuelo-final');
    const estado = { x: 1400 };
    this.tweens.add({ targets: estado, x: 1046, duration: 1400, ease: 'Sine.easeOut', onUpdate: () => { vuelo.style.left = `${estado.x}px`; } });
  }
}
