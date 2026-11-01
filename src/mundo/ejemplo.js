// Botón «VER EJEMPLO» y panel de ejemplo paso a paso — diseño: diseño/8_cambios_entrevista/07_m1_reto_con_ejemplo.png
// Un ejemplo por tema (src/data/ejemplos.json), con otros números. NO resta puntos y no toca el reto.

import { crearElemento, mostrar } from './interfazRPG.js';
import EJEMPLOS from '../data/ejemplos.json';

export function ejemploDeMundo(idMundo) {
  return EJEMPLOS[idMundo] || null;
}

// Clave del ejemplo para que el generador nunca dé la misma ecuación
export function claveEjemplo(idMundo) {
  const e = ejemploDeMundo(idMundo);
  return e ? e.ecuacion.replace(/\s+/g, '') : null;
}

// HTML del botón (va dentro del panel del reto, arriba a la derecha)
export const BOTON_EJEMPLO = '<button type="button" class="boton btn azul ver-ejemplo" data-r="ejemplo"><span class="libro">📖</span> VER EJEMPLO</button>';

export class PanelEjemplo {
  constructor(capa, panelReto, idMundo) {
    this.ejemplo = ejemploDeMundo(idMundo);
    this.panelReto = panelReto;
    this.capa = capa;
    this.el = null;
    this.mostrados = 1;
  }

  get abierto() {
    return !!this.el;
  }

  alternar() {
    if (this.abierto) this.cerrar();
    else this.abrir();
  }

  abrir() {
    if (!this.ejemplo || this.el) return;
    this.mostrados = 1;
    this.panelReto.classList.add('con-ejemplo');
    this.el = crearElemento(this.capa, `<section class="panel-ejemplo">
<div class="ej-cabecera"><span class="ej-chip"><span class="libro">📖</span> EJEMPLO</span><span class="ej-nota">Otros números · no resta puntos</span><button type="button" class="boton ej-cerrar" aria-label="Cerrar ejemplo">✕</button></div>
<div class="ej-ecuacion">${this.ejemplo.ecuacion}</div>
<div class="ej-pasos"></div>
<div class="ej-pie"><span class="px ej-contador"></span><span class="ej-cuadros"></span><button type="button" class="boton btn azul ej-siguiente">SIGUIENTE PASO ▶</button></div>
</section>`);
    this.el.querySelector('.ej-cerrar').addEventListener('click', (e) => { e.currentTarget.blur(); this.cerrar(); });
    this.el.querySelector('.ej-siguiente').addEventListener('click', (e) => { e.currentTarget.blur(); this.siguiente(); });
    this.dibujar();
  }

  cerrar() {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    this.panelReto.classList.remove('con-ejemplo');
  }

  siguiente() {
    const total = this.ejemplo.pasos.length;
    this.mostrados = this.mostrados >= total ? 1 : this.mostrados + 1;
    this.dibujar();
  }

  dibujar() {
    const pasos = this.ejemplo.pasos;
    const total = pasos.length;
    this.el.querySelector('.ej-pasos').innerHTML = pasos.map((p, i) => {
      if (i >= this.mostrados) return `<div class="ej-paso oculto"><b>${i + 1}</b> ???</div>`;
      const [texto, ...resto] = p.split(':');
      const calculo = resto.join(':').trim();
      const ultimo = i === total - 1;
      return `<div class="ej-paso ${ultimo ? 'final' : ''}"><span class="ej-texto"><b>${i + 1}</b> ${texto.trim()}</span><span class="ej-calculo">${calculo || texto}</span></div>`;
    }).join('');
    this.el.querySelector('.ej-contador').textContent = `PASO ${this.mostrados} DE ${total}`;
    this.el.querySelector('.ej-cuadros').innerHTML = pasos.map((_, i) => `<i class="${i < this.mostrados ? 'lleno' : ''}"></i>`).join('');
    const boton = this.el.querySelector('.ej-siguiente');
    boton.textContent = this.mostrados >= total ? 'VER DE NUEVO ↺' : 'SIGUIENTE PASO ▶';
    mostrar(boton, true);
  }
}
