// Utilidades compartidas por las escenas
import RECURSOS from '../data/recursos.json';

// Rutas de imágenes para usarlas dentro del HTML de las pantallas
export const IMG = 'assets/img/';
export const M1 = 'assets/img/mundo1/';

// Ruta de una imagen registrada en src/data/recursos.json
const CARPETA = {};
for (const [carpeta, claves] of Object.entries(RECURSOS.imagenes)) {
  claves.forEach((clave) => { CARPETA[clave] = carpeta; });
}
export function rutaImagen(clave) {
  const carpeta = CARPETA[clave];
  if (carpeta === undefined) throw new Error(`Imagen no registrada en recursos.json: ${clave}`);
  return `${IMG}${carpeta ? `${carpeta}/` : ''}${clave}.png`;
}

// Crea la capa DOM de 1366×768 encima del canvas con el HTML de la pantalla.
// profundidad: las capas con mayor profundidad quedan encima (zIndex de Phaser).
export function crearPantalla(escena, html, { clase = '', profundidad = 0 } = {}) {
  const raiz = document.createElement('div');
  raiz.className = `pantalla ${clase}`.trim();
  // Las pantallas RPG (diseno/html/mundo1) usan texto blanco por defecto; las de menú, #1b1430
  const colorTexto = clase.includes('rpg') ? '#ffffff' : '#1b1430';
  raiz.style.cssText = `position: relative; width: 1366px; height: 768px; overflow: hidden; font-family: 'Nunito', sans-serif; color: ${colorTexto}; pointer-events: none`;
  raiz.innerHTML = html;
  // setScrollFactor(0): la capa queda fija en la pantalla aunque la cámara siga al jugador
  escena.add.dom(0, 0, raiz).setOrigin(0, 0).setDepth(profundidad).setScrollFactor(0);
  // Solo los botones, campos y paneles reciben clics; el resto deja pasar al canvas
  raiz.querySelectorAll('button, input, label, section, .clic').forEach((el) => { el.style.pointerEvents = 'auto'; });
  return raiz;
}

// Habilita los clics en elementos agregados después de crear la pantalla
export function activarClics(elemento) {
  elemento.querySelectorAll('button, input, label, section, .clic').forEach((el) => { el.style.pointerEvents = 'auto'; });
  if (elemento.matches && elemento.matches('button, input, section, .clic, .dlg, .panel')) elemento.style.pointerEvents = 'auto';
}

// Asocia cada botón con data-accion a su función; los que no tienen función quedan sin acción
export function conectarBotones(raiz, acciones) {
  raiz.querySelectorAll('[data-accion]').forEach((boton) => {
    const accion = acciones[boton.dataset.accion];
    if (accion) {
      boton.addEventListener('click', (evento) => {
        // Quita el foco para que Espacio/Enter no vuelvan a "pulsar" el botón
        boton.blur();
        accion(evento);
      });
    }
  });
}

export function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Reemplaza {clave} por valores; el nombre del jugador siempre se escapa
export function rellenar(plantilla, valores) {
  return String(plantilla).replace(/\{(\w+)\}/g, (todo, clave) => {
    if (!(clave in valores)) return todo;
    const v = valores[clave];
    return clave === 'nombre' ? escaparHtml(v) : String(v);
  });
}

// Escribe un HTML letra por letra dentro de 'contenedor' (cuadro de diálogo estilo RPG)
export function escribirTexto(escena, contenedor, html, { velocidad = 20, alTerminar = null } = {}) {
  contenedor.innerHTML = html;
  const nodos = [];
  const caminante = document.createTreeWalker(contenedor, NodeFilter.SHOW_TEXT);
  while (caminante.nextNode()) {
    nodos.push({ nodo: caminante.currentNode, texto: caminante.currentNode.textContent });
    caminante.currentNode.textContent = '';
  }
  let i = 0;
  let j = 0;
  let terminado = false;
  const terminar = () => {
    if (terminado) return;
    terminado = true;
    evento.remove(false);
    nodos.forEach((n) => { n.nodo.textContent = n.texto; });
    if (alTerminar) alTerminar();
  };
  const evento = escena.time.addEvent({
    delay: velocidad,
    loop: true,
    callback: () => {
      // dos letras por paso para que no se haga lento
      for (let paso = 0; paso < 2; paso++) {
        while (i < nodos.length && j >= nodos[i].texto.length) { i++; j = 0; }
        if (i >= nodos.length) { terminar(); return; }
        j++;
        nodos[i].nodo.textContent = nodos[i].texto.slice(0, j);
      }
    }
  });
  return {
    terminar,
    get terminado() { return terminado; }
  };
}

// Diálogo Sí / Cancelar — diseño: diseno/html/Confirmar.html
export function confirmar(raiz, { titulo, texto, si, nota = '' }) {
  return new Promise((resolver) => {
    const capa = document.createElement('div');
    capa.style.cssText = 'position: absolute; inset: 0; z-index: 50; pointer-events: auto';
    capa.innerHTML = `
<div style="position: absolute; left: 0; top: 0; width: 1366px; height: 768px; background: rgba(27, 20, 48, 0.72)"></div>
<section role="dialog" style="position: absolute; left: 353px; top: 170px; width: 660px; box-sizing: border-box; padding: 34px 40px; display: flex; flex-direction: column; align-items: center; gap: 20px; background: #7a1f3d; border: 4px solid #1b1430; box-shadow: inset 0 0 0 4px #f2b632, 0 8px 0 #1b1430; color: #ffffff; font-family: 'Nunito', sans-serif">
<img src="${IMG}mascota.png" alt="" aria-hidden="true" style="width: 90px; height: 110px; image-rendering: pixelated">
<h1 style="margin: 0; font-family: 'Press Start 2P', monospace; font-size: 24px; color: #f2b632; text-shadow: 3px 3px 0 #1b1430; text-align: center; line-height: 1.3">${titulo}</h1>
<p style="margin: 0; text-align: center; font-size: 21px; font-weight: 800; line-height: 1.4">${texto}</p>
<div style="width: 100%; display: flex; gap: 18px; margin-top: 6px">
<button type="button" class="boton" data-r="no" style="flex: 1; display: flex; align-items: center; justify-content: center; height: 60px; background: #4e1027; color: #ffffff; font-family: 'Press Start 2P', monospace; font-size: 15px; border: 4px solid #1b1430; box-shadow: inset -4px -4px 0 #320a19, inset 4px 4px 0 #a8345a, 0 6px 0 #1b1430; box-sizing: border-box">CANCELAR</button>
<button type="button" class="boton" data-r="si" style="flex: 1; display: flex; align-items: center; justify-content: center; height: 60px; background: #f2b632; color: #1b1430; font-family: 'Press Start 2P', monospace; font-size: 15px; border: 4px solid #1b1430; box-shadow: inset -4px -4px 0 #c98a14, inset 4px 4px 0 #ffd877, 0 6px 0 #1b1430; box-sizing: border-box">${si}</button>
</div>
${nota ? `<p style="margin: 0; text-align: center; font-size: 16px; font-weight: 700; color: #ffe9b8">${nota}</p>` : ''}
</section>`;
    raiz.appendChild(capa);
    const cerrar = (respuesta) => {
      document.removeEventListener('keydown', teclas, true);
      capa.remove();
      resolver(respuesta);
    };
    const teclas = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(false); }
    };
    document.addEventListener('keydown', teclas, true);
    capa.querySelector('[data-r="no"]').addEventListener('click', () => cerrar(false));
    capa.querySelector('[data-r="si"]').addEventListener('click', () => cerrar(true));
  });
}
