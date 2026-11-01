import Phaser from 'phaser';
import { crearPantalla, conectarBotones, rutaImagen, escaparHtml } from './ui.js';
import * as almacen from '../db/almacen.js';
import RECURSOS from '../data/recursos.json';

// Pantalla ¿Quién juega? — diseño: diseño/1_flujo_de_menus/02_quien_juega.png
// Nombre + elección de personaje (p1–p4, hojas de diseño/1_flujo_de_menus/02b_personajes.png).
const FILAS_VISIBLES = 5;
const PANEL = 'box-sizing:border-box;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430;color:#fff';
const PERSONAJES = RECURSOS.personajes;

function htmlFila(estudiante, indice, elegida) {
  const resumen = almacen.resumenEstudiante(estudiante);
  const p = estudiante.personaje || 'p1';
  return `<button type="button" class="boton fila-estudiante ${elegida ? 'elegida' : ''}" data-indice="${indice}">
<span class="fe-foto"><img src="${rutaImagen(`${p}_sprite`)}" alt=""></span>
<span style="flex:1;display:flex;flex-direction:column;min-width:0;text-align:left"><span style="font-size:19px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escaparHtml(estudiante.nombre)}</span><span class="fe-detalle">Mundo ${resumen.mundo} · Nivel ${resumen.nivel}</span></span>
<img src="${rutaImagen('estrella')}" alt="" style="width:28px;height:24px;image-rendering:pixelated"><span style="font-family:'Press Start 2P',monospace;font-size:14px;min-width:30px;text-align:right">${resumen.estrellas}</span>
</button>`;
}

const HTML = `
<div style="position:absolute;left:0;top:0;width:1366px;height:768px;background:rgba(27,20,48,.35)"></div>
<button type="button" class="boton" data-accion="volver" style="position:absolute;left:28px;top:24px;display:flex;align-items:center;height:48px;padding:0 18px;background:#7a1f3d;color:#fff;font-family:'Press Start 2P',monospace;font-size:13px;border:4px solid #1b1430;box-shadow:inset -3px -3px 0 #4e1027,inset 3px 3px 0 #a8345a,0 5px 0 #1b1430">◀ VOLVER</button>
<h1 style="position:absolute;left:0;top:32px;width:1366px;margin:0;text-align:center;font-family:'Press Start 2P',monospace;font-size:32px;color:#f2b632;text-shadow:3px 3px 0 #7a1f3d,6px 6px 0 #1b1430">¿QUIEN VA A JUGAR?</h1>

<section class="jg-nueva" style="position:absolute;left:40px;top:104px;width:858px;height:646px;padding:24px 30px;display:flex;flex-direction:column;gap:12px;${PANEL}">
<div style="display:flex;align-items:center;gap:12px"><h2 style="margin:0;flex:1;font-family:'Press Start 2P',monospace;font-size:18px;color:#f2b632">NUEVA PARTIDA</h2>
<img src="${rutaImagen('sprite_ecu')}" alt="" style="width:34px;image-rendering:pixelated"><span style="padding:8px 12px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430;font-size:16px;font-weight:800">¡Hola! Soy Ecu. Te acompañaré en la aventura.</span></div>
<label for="nombre" style="font-size:18px;font-weight:800"><span class="px" style="font-size:13px;color:#f2b632;margin-right:10px">1.</span>Escribe tu nombre</label>
<input id="nombre" type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="Ej.: Ana Quispe" style="height:46px;box-sizing:border-box;padding:0 18px;background:#fff8ec;border:4px solid #1b1430;box-shadow:inset 4px 4px 0 #e6dccb;font-family:'Nunito',sans-serif;font-size:21px;font-weight:800;color:#1b1430">
<span class="mensaje-nombre" style="margin-top:-6px;min-height:0;font-size:16px;font-weight:800;color:#ffd0bd"></span>
<div style="display:flex;align-items:center"><span style="flex:1;font-size:18px;font-weight:800"><span class="px" style="font-size:13px;color:#f2b632;margin-right:10px">2.</span>Elige tu personaje</span>
<span style="font-size:15px;font-weight:800"><span class="key-mini">◀ ▶</span> o clic</span></div>
<div class="jg-personajes"></div>
<div class="jg-vista"><span class="jg-vista-texto">Así te verás en el mapa:</span><img class="jg-vista-ecu" src="${rutaImagen('sprite_ecu')}" alt=""><img class="jg-vista-pj" src="" alt=""><span class="jg-vista-nombre">Tu nombre</span></div>
<button type="button" class="boton" data-accion="empezar" style="display:flex;align-items:center;justify-content:center;height:52px;box-sizing:border-box;background:#f2b632;color:#1b1430;font-family:'Press Start 2P',monospace;font-size:16px;border:4px solid #1b1430;box-shadow:inset -4px -4px 0 #c98a14,inset 4px 4px 0 #ffd877,0 6px 0 #1b1430">▶ EMPEZAR AVENTURA</button>
</section>

<section style="position:absolute;left:928px;top:104px;width:398px;height:646px;padding:22px 20px;display:flex;flex-direction:column;gap:10px;${PANEL}">
<h2 style="margin:0 0 6px;font-family:'Press Start 2P',monospace;font-size:18px;color:#f2b632">CONTINUAR</h2>
<div class="lista-estudiantes" style="display:contents"></div>
<button type="button" class="boton" data-accion="continuar" style="margin-top:auto;display:flex;align-items:center;justify-content:center;height:56px;box-sizing:border-box;background:#157a4f;color:#fff;font-family:'Press Start 2P',monospace;font-size:14px;border:4px solid #1b1430;box-shadow:inset -4px -4px 0 #0e5a3a,inset 4px 4px 0 #2ea06c,0 6px 0 #1b1430;white-space:nowrap;overflow:hidden"></button>
</section>`;

export default class Jugador extends Phaser.Scene {
  constructor() {
    super('Jugador');
  }

  create() {
    this.add.image(683, 384, 'fondo_menu');

    this.raiz = crearPantalla(this, HTML);
    this.estudiantes = almacen.listarEstudiantes();
    this.elegido = 0;
    this.inicioLista = 0;
    this.personaje = 'p1';
    this.dibujarLista();
    this.dibujarPersonajes();

    conectarBotones(this.raiz, {
      volver: () => this.scene.start('Inicio'),
      empezar: () => this.empezar(),
      continuar: () => this.continuar()
    });

    const campo = this.raiz.querySelector('#nombre');
    campo.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') this.empezar();
    });
    campo.addEventListener('input', () => {
      this.raiz.querySelector('.mensaje-nombre').textContent = '';
      this.actualizarVista();
    });

    this.raiz.querySelector('.jg-personajes').addEventListener('click', (evento) => {
      const tarjeta = evento.target.closest('[data-pj]');
      if (tarjeta) {
        tarjeta.blur();
        this.personaje = tarjeta.dataset.pj;
        this.dibujarPersonajes();
      }
    });
    this.raiz.querySelector('.lista-estudiantes').addEventListener('click', (evento) => {
      const fila = evento.target.closest('.fila-estudiante');
      if (fila) {
        this.elegido = Number(fila.dataset.indice);
        this.dibujarLista();
      }
    });
    this.raiz.querySelector('.lista-estudiantes').parentElement.addEventListener('wheel', (evento) => {
      this.desplazar(evento.deltaY > 0 ? 1 : -1);
    });

    // ◀ ▶ cambian de personaje (si no se está escribiendo el nombre)
    const escribiendo = () => document.activeElement && document.activeElement.id === 'nombre';
    this.input.keyboard.on('keydown-LEFT', () => { if (!escribiendo()) this.moverPersonaje(-1); });
    this.input.keyboard.on('keydown-RIGHT', () => { if (!escribiendo()) this.moverPersonaje(1); });
    // Esc vuelve al menú principal, salvo que se esté escribiendo el nombre
    this.input.keyboard.on('keydown-ESC', () => {
      if (escribiendo()) {
        document.activeElement.blur();
        return;
      }
      this.scene.start('Inicio');
    });
  }

  moverPersonaje(paso) {
    const i = PERSONAJES.indexOf(this.personaje);
    this.personaje = PERSONAJES[(i + paso + PERSONAJES.length) % PERSONAJES.length];
    this.dibujarPersonajes();
  }

  dibujarPersonajes() {
    this.raiz.querySelector('.jg-personajes').innerHTML = PERSONAJES.map((p, i) => `<button type="button" class="boton tarjeta-pj ${p === this.personaje ? 'elegido' : ''}" data-pj="${p}" aria-label="Personaje ${i + 1}">
${p === this.personaje ? '<span class="pj-elegido">✓ ELEGIDO</span>' : ''}<img src="${rutaImagen(`${p}_sprite`)}" alt=""><span class="px" style="font-size:13px;color:#1b1430">${i + 1}</span></button>`).join('');
    this.actualizarVista();
  }

  actualizarVista() {
    this.raiz.querySelector('.jg-vista-pj').src = rutaImagen(`${this.personaje}_sprite`);
    const nombre = this.raiz.querySelector('#nombre').value.trim().split(' ')[0];
    this.raiz.querySelector('.jg-vista-nombre').textContent = nombre || 'Tu nombre';
  }

  desplazar(paso) {
    const max = Math.max(0, this.estudiantes.length - FILAS_VISIBLES);
    this.inicioLista = Math.min(max, Math.max(0, this.inicioLista + paso));
    this.dibujarLista();
  }

  dibujarLista() {
    const lista = this.raiz.querySelector('.lista-estudiantes');
    const boton = this.raiz.querySelector('[data-accion="continuar"]');
    if (this.estudiantes.length === 0) {
      lista.innerHTML = '<p style="margin:0;font-size:19px;font-weight:800;line-height:1.4;color:#ffe9b8">Todavía no hay partidas guardadas en esta computadora. ¡Escribe tu nombre, elige tu personaje y empieza la aventura!</p>';
      boton.textContent = 'CONTINUAR';
      boton.disabled = true;
      return;
    }
    // Se muestran 5 filas; la rueda del mouse recorre el resto
    if (this.elegido < this.inicioLista) this.inicioLista = this.elegido;
    if (this.elegido >= this.inicioLista + FILAS_VISIBLES) this.inicioLista = this.elegido - FILAS_VISIBLES + 1;
    lista.innerHTML = this.estudiantes
      .slice(this.inicioLista, this.inicioLista + FILAS_VISIBLES)
      .map((estudiante, i) => htmlFila(estudiante, this.inicioLista + i, this.inicioLista + i === this.elegido))
      .join('');

    const nombreCorto = this.estudiantes[this.elegido].nombre.split(' ')[0].toUpperCase().slice(0, 12);
    boton.textContent = `CONTINUAR CON ${nombreCorto}`;
    boton.disabled = false;
  }

  empezar() {
    const campo = this.raiz.querySelector('#nombre');
    const mensaje = this.raiz.querySelector('.mensaje-nombre');
    const nombre = campo.value.trim().replace(/\s+/g, ' ');
    if (nombre.length < 2) {
      mensaje.textContent = 'Escribe tu nombre (al menos 2 letras).';
      campo.focus();
      return;
    }
    // Si el nombre ya existe en esta PC, se continúa con ese estudiante y su nuevo personaje
    let estudiante = almacen.buscarPorNombre(nombre);
    if (estudiante) almacen.cambiarPersonaje(estudiante.id, this.personaje);
    else estudiante = almacen.crearEstudiante(nombre, this.personaje);
    this.jugarCon(almacen.obtenerEstudiante(estudiante.id));
  }

  continuar() {
    const estudiante = this.estudiantes[this.elegido];
    if (estudiante) this.jugarCon(estudiante);
  }

  jugarCon(estudiante) {
    almacen.marcarJuego(estudiante.id);
    this.registry.set('estudiante', { ...estudiante, personaje: estudiante.personaje || 'p1' });
    // continúa en el mundo del nivel donde se quedó
    this.scene.start('Zona', { mundo: almacen.resumenEstudiante(estudiante).mundo });
  }
}
