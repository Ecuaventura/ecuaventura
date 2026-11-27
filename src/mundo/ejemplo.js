// Botón «VER EJEMPLO» y panel de ejemplo paso a paso — diseño: diseño/8_cambios_entrevista/07_m1_reto_con_ejemplo.png
// Versión 2.0: un ejemplo por PLANTILLA (src/data/ejemplos.json, clave = id de la plantilla), así el ejemplo
// siempre es del mismo tipo que el reto, con otros números. NO resta puntos y no toca el reto.

import { crearElemento, mostrar } from './interfazRPG.js';
import { ajustarAncho } from './panelesReto.js';
import { ecuacionConValores, clavePlantilla, plantillasDelMundo, arbolDe } from '../logic/plantillas.js';
import EJEMPLOS from '../data/ejemplos.json';

export function ejemploDePlantilla(idPlantilla) {
  const e = EJEMPLOS[idPlantilla];
  return e && e.valores ? { ...e, ec: ecuacionConValores(idPlantilla, e.valores) } : null;
}

// Claves de los ejemplos de un mundo, para que el generador nunca dé la misma ecuación
export function clavesEjemplos(idMundo) {
  return plantillasDelMundo(idMundo).map((t) => ejemploDePlantilla(t.id)).filter(Boolean).map((e) => clavePlantilla(e.ec));
}

// Ecuación en una línea con las fracciones apiladas (numerador, raya, denominador);
// la división entre una fracción se dibuja como fracción grande (sin «÷»), igual que en el panel del reto.
const sinGrupo = (n) => (n.k === 'g' ? sinGrupo(n.e) : n);
const apilar = (arriba, abajo, grande = false) => `<span class="frac-t${grande ? ' frac-grande' : ''}"><span>${arriba}</span><span>${abajo}</span></span>`;
function htmlTexto(nodo, P) {
  const w = (m) => htmlTexto(m, P);
  switch (nodo.k) {
    case 'n': return String(nodo.v);
    case 'p': return String(P[nodo.id]);
    case 'x': return 'x';
    case 'g': return nodo.c === '[' ? `[${w(nodo.e)}]` : `(${w(nodo.e)})`;
    case 's': return nodo.t.map((t, i) => (i === 0 ? (t.neg ? '−' : '') : ` ${t.neg ? '−' : '+'} `) + w(t.e)).join('');
    case 'm': {
      if (nodo.a.k === 'n' || nodo.a.k === 'p') {
        const k = nodo.a.k === 'n' ? nodo.a.v : P[nodo.a.id];
        return k === 1 ? w(nodo.b) : `${k}${w(nodo.b)}`;
      }
      return `${w(nodo.a)}·${w(nodo.b)}`;
    }
    case 'f': return apilar(w(nodo.a), w(nodo.b));
    case 'e': return apilar(w(sinGrupo(nodo.a)), w(sinGrupo(nodo.b)), true);
    default: return '';
  }
}

export function ecuacionApilada(ec) {
  const arbol = arbolDe(ec.plantilla);
  return `${htmlTexto(arbol.izq, ec.p)} = ${htmlTexto(arbol.der, ec.p)}`;
}

// HTML del botón (va dentro del panel del reto, arriba a la derecha)
export const BOTON_EJEMPLO = '<button type="button" class="boton btn azul ver-ejemplo" data-r="ejemplo"><span class="libro">📖</span> VER EJEMPLO</button>';

// el panel empieza en y = 76 y debe terminar antes del diálogo (y = 460)
const ALTO_MAXIMO = 380;

export class PanelEjemplo {
  constructor(capa, panelReto, idPlantilla) {
    this.ejemplo = idPlantilla ? ejemploDePlantilla(idPlantilla) : null;
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
<div class="ej-ecuacion"><span class="ej-linea" style="display:inline-block;white-space:nowrap">${ecuacionApilada(this.ejemplo.ec)}</span></div>
<div class="ej-pasos"></div>
<div class="ej-pie"><span class="px ej-contador"></span><span class="ej-cuadros"></span><button type="button" class="boton btn azul ej-siguiente">SIGUIENTE PASO ▶</button></div>
</section>`);
    this.el.querySelector('.ej-cerrar').addEventListener('click', (e) => { e.currentTarget.blur(); this.cerrar(); });
    this.el.querySelector('.ej-siguiente').addEventListener('click', (e) => { e.currentTarget.blur(); this.siguiente(); });
    ajustarAncho(this.el.querySelector('.ej-linea'));
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
    // con 4 pasos el panel se compacta; si aún no entra sobre el diálogo (y = 460), se achica
    this.el.classList.toggle('ej-cuatro', total > 3);
    this.el.style.zoom = '1';
    const alto = this.el.offsetHeight;
    if (alto > ALTO_MAXIMO) this.el.style.zoom = (ALTO_MAXIMO / alto).toFixed(3);
  }
}
