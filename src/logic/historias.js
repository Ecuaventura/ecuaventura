// Arma la historia de un reto con la ecuación generada (versión 2.0).
// Cada mundo tiene sus temas en historias.json → mundos[mundo].temas y cada historia cuenta los dos
// lados de la ecuación ({izq}, {der}) o la ecuación completa ({ecuacion}), así sirve para cualquier
// plantilla del mundo. Cada vecino rota entre sus temas (personajes.json → temas).

import HISTORIAS from '../data/historias.json';
import { rellenar } from '../scenes/ui.js';
import { ladosTexto, textoEcuacionPlantilla } from './plantillas.js';

const elegir = (lista) => (Array.isArray(lista) ? lista[Math.floor(Math.random() * lista.length)] : lista);

export function temasDelMundo(mundo) {
  return HISTORIAS.mundos[mundo]?.temas || {};
}

// tema: clave de historias.json → mundos[mundo].temas; final: saludo del último reto del mundo
// otro: nombre de otro personaje (historias del Mundo 3, que comparan lo de dos personas)
export function armarHistoria(ec, tema, nombre, { final = false, otro = 'mi vecino' } = {}) {
  const H = HISTORIAS.mundos[ec.mundo];
  const t = H.temas[tema] || Object.values(H.temas)[0];
  const [izq, der] = ladosTexto(ec);
  const saludo = rellenar(final ? H.saludoFinal : H.saludo, { nombre });
  const valores = { saludo, izq, der, ecuacion: textoEcuacionPlantilla(ec), otro: `<b>${otro}</b>` };
  const primera = rellenar(elegir(t.intro), valores);
  const cierre = rellenar(elegir(t.igual || H.igual), valores);
  return {
    historia: `<span>${primera}</span><span>${cierre} <span class="c-guinda">${H.pregunta}</span></span>`,
    pregunta: H.pregunta,
    respuesta: t.respuesta,
    correcto: H.correcto,
    significado: t.significado,
    bannerError: H.bannerError
  };
}
