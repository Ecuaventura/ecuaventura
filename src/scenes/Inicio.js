import Phaser from 'phaser';
import { crearPantalla, conectarBotones, confirmar, rutaImagen } from './ui.js';
import * as almacen from '../db/almacen.js';
import MUNDOS from '../data/mundos.json';
import NIVELES from '../data/niveles.json';
import RECURSOS from '../data/recursos.json';

// Pantalla de inicio — diseño: diseño/8_cambios_entrevista/00_inicio_nuevo.png
const BOTON = 'display:flex;align-items:center;justify-content:center;border:4px solid #1b1430;font-family:\'Press Start 2P\',monospace;box-sizing:border-box';

// ¿Algún estudiante de esta PC ya abrió este mundo? (el Mundo 1 siempre está abierto)
function mundoAbierto(mundo) {
  const ids = NIVELES.niveles.filter((n) => n.mundo === mundo.id).map((n) => n.id);
  if (!ids.length) return false;
  if (mundo.id === 1) return true;
  return almacen.listarEstudiantes().some((e) => almacen.progresoNivel(e.id, ids[0]).desbloqueado);
}

function htmlTarjeta(mundo, i, total) {
  const abierto = mundoAbierto(mundo);
  const colorTexto = mundo.colorGrado === '#f2b632' ? '#1b1430' : '#fff';
  const flecha = i < total - 1 ? '<span class="flecha-mundo"></span>' : '';
  return `<div class="tarjeta-mundo ${abierto ? '' : 'cerrada'}">
<div class="tm-imagen"><img src="${rutaImagen(`mini_mundo${mundo.id}`)}" alt="">
<span class="tm-grado" style="background:${mundo.colorGrado};color:${colorTexto}">${mundo.etiquetaGrado}</span>
${abierto ? '' : `<img class="tm-candado" src="${rutaImagen('candado')}" alt="Bloqueado">`}</div>
<div class="tm-texto"><span class="px" style="font-size:11px;color:#7a1f3d">MUNDO ${mundo.id}</span><span class="px" style="font-size:15px;color:#1b1430">${mundo.nombreCorto.toUpperCase().replace('Ó', 'O')}</span><span style="font-size:16px;font-weight:800;color:#4e1027">${mundo.tema}</span></div>
</div>${flecha}`;
}

export default class Inicio extends Phaser.Scene {
  constructor() {
    super('Inicio');
  }

  create() {
    // Fondo (1368×768 centrado) en el canvas
    this.add.image(683, 384, 'fondo_inicio');

    const personajes = RECURSOS.personajes.map((p, i) => `<img class="pj-inicio" src="${rutaImagen(`${p}_sprite`)}" alt="Personaje ${i + 1}" style="left:${783 + i * 120}px;animation-delay:${i * 0.18}s">`).join('');
    const raiz = crearPantalla(this, `
<img src="${rutaImagen('condor')}" alt="" aria-hidden="true" class="condor-inicio" style="position:absolute;left:1086px;top:44px;width:138px;image-rendering:pixelated">
<h1 style="position:absolute;left:0;top:20px;width:1366px;margin:0;text-align:center;font-family:'Press Start 2P',monospace;font-size:64px;line-height:1;letter-spacing:2px;color:#f2b632;text-shadow:4px 4px 0 #7a1f3d,8px 8px 0 #1b1430">ECUAVENTURA</h1>
<div style="position:absolute;left:243px;top:101px;width:361px;height:38px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 3px #f2b632;font-family:'Press Start 2P',monospace;font-size:13px;color:#fff;white-space:nowrap">EL LABERINTO MATEMATICO</div>
<div style="position:absolute;left:617px;top:96px;height:49px;padding:0 16px;display:flex;align-items:center;background:#fff8ec;border:4px solid #1b1430;font-size:19px;font-weight:800;color:#1b1430;white-space:nowrap;box-sizing:border-box">Ecuaciones de primer grado · 1.° a 5.° de secundaria</div>

<section style="position:absolute;left:61px;top:177px;width:328px;height:265px;box-sizing:border-box;padding:17px 18px;display:flex;flex-direction:column;gap:12px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<button type="button" class="boton" data-accion="nueva" style="${BOTON};height:56px;background:#f2b632;color:#1b1430;font-size:17px;box-shadow:inset -4px -4px 0 #c98a14,inset 4px 4px 0 #ffd877,0 6px 0 #1b1430">▶ NUEVA PARTIDA</button>
<button type="button" class="boton" data-accion="continuar" style="${BOTON};height:44px;background:#157a4f;color:#fff;font-size:13px;box-shadow:inset -4px -4px 0 #0e5a3a,inset 4px 4px 0 #2ea06c,0 5px 0 #1b1430">CONTINUAR</button>
<button type="button" class="boton" data-accion="instrucciones" style="${BOTON};height:44px;background:#2c6fb5;color:#fff;font-size:13px;box-shadow:inset -4px -4px 0 #1d4f8a,inset 4px 4px 0 #5a95d6,0 5px 0 #1b1430">INSTRUCCIONES</button>
<button type="button" class="boton" data-accion="salir" style="${BOTON};height:44px;background:#4e1027;color:#fff;font-size:13px;box-shadow:inset -4px -4px 0 #320a19,inset 4px 4px 0 #7a1f3d,0 5px 0 #1b1430">SALIR</button>
</section>

<div style="position:absolute;left:890px;top:196px;height:44px;padding:0 14px;display:flex;align-items:center;background:#fff8ec;border:3px solid #1b1430;font-size:17px;font-weight:800;color:#1b1430;white-space:nowrap;box-sizing:border-box">¡Elige tu personaje y salva los 5 mundos!</div>
<div style="position:absolute;left:450px;top:397px;width:880px;height:6px;background:#3f9a48;border-top:2px solid #2f7d3a"></div>
${personajes}
<img class="pj-inicio" src="${rutaImagen('sprite_ecu')}" alt="Ecu" style="left:1257px;top:318px;width:48px;height:68px;animation-delay:.72s">

<div style="position:absolute;left:42px;top:454px;width:1286px;display:flex;align-items:center;gap:12px">
<span class="px" style="font-size:15px;color:#f2b632;text-shadow:2px 2px 0 #1b1430;white-space:nowrap">TU AVENTURA</span>
<span style="flex:1;height:4px;background:#f2b632;box-shadow:0 2px 0 #1b1430"></span>
<span style="font-size:16px;font-weight:800;color:#fff;white-space:nowrap;text-shadow:2px 2px 0 #1b1430">25 niveles · 75 retos</span></div>
<div style="position:absolute;left:40px;top:492px;width:1288px;display:flex;align-items:center;gap:0">${MUNDOS.mundos.map((m, i, l) => htmlTarjeta(m, i, l.length)).join('')}</div>

<div style="position:absolute;left:0;bottom:10px;width:1366px;display:flex;justify-content:center">
<div style="padding:7px 16px;background:rgba(27,20,48,.88);color:#fff;font-size:16px;font-weight:800">I.E. N° 54037 Micaela Bastidas Puyucahua · Tamburco, Abancay</div></div>
<div style="position:absolute;right:18px;bottom:16px;font-family:'Press Start 2P',monospace;font-size:11px;color:#fff">v2.0</div>`, { clase: 'inicio' });

    conectarBotones(raiz, {
      nueva: () => this.scene.start('Jugador'),
      // RF-01: «Continuar» muestra la lista de estudiantes guardados en esta PC
      continuar: () => this.scene.start('Jugador'),
      instrucciones: () => this.scene.start('Instrucciones'),
      salir: async () => {
        const si = await confirmar(raiz, {
          titulo: '¿SALIR DEL JUEGO?',
          texto: 'Tu avance ya está guardado. La próxima vez podrás continuar donde te quedaste.',
          si: 'SÍ, SALIR'
        });
        // En la versión de escritorio (Electron) esto cierra la ventana
        if (si) window.close();
      }
    });
    raiz.querySelector('[data-accion="continuar"]').disabled = !almacen.hayProgreso();

    // RNF-07: aviso si hubo que restaurar datos dañados
    if (almacen.hayAvisoDatosDanados()) {
      const aviso = document.createElement('div');
      aviso.style.cssText = 'position: absolute; left: 50%; top: 150px; transform: translateX(-50%); padding: 8px 16px; background: #b8401a; color: #ffffff; border: 4px solid #1b1430; font-size: 17px; font-weight: 800; white-space: nowrap';
      aviso.textContent = 'Los datos guardados estaban dañados: se restauró un estado seguro.';
      raiz.appendChild(aviso);
    }
  }
}
