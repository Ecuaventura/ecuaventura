// Reglas de puntaje y estrellas (RF-11)

export const PUNTOS = {
  acierto: 100,
  descuentoPista: 50,
  bonoRacha: 50,
  largoRacha: 3,
  erroresParaPista: 3
};

// Puntos de un reto resuelto: +100, o +50 si se usó pista
export function puntosReto(usoPista) {
  return PUNTOS.acierto - (usoPista ? PUNTOS.descuentoPista : 0);
}

// Bono cada vez que la racha de aciertos seguidos llega a 3, 6, 9…
export function bonoRacha(racha) {
  return racha > 0 && racha % PUNTOS.largoRacha === 0 ? PUNTOS.bonoRacha : 0;
}

// 1 estrella: nivel completado.
// 2 estrellas: pocos errores (intentos).
// 3 estrellas: además, sin pistas y en poco tiempo.
export function calcularEstrellas({ errores, pistas, tiempoSeg }, criterios) {
  const dos = errores <= criterios.erroresMax;
  const tres = dos && pistas === 0 && tiempoSeg < criterios.tiempoMax;
  return tres ? 3 : dos ? 2 : 1;
}

// Texto que explica cómo ganar la siguiente estrella
export function consejoEstrella(estrellas, criterios, tiempoSeg = null) {
  if (estrellas >= 3) {
    if (tiempoSeg === null) return '¡Tres estrellas! Lo hiciste perfecto';
    const t = Math.floor(tiempoSeg);
    return `¡3 estrellas! Reto extra: supera tu tiempo de <b class="c-oro">${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</b>`;
  }
  if (estrellas === 2) {
    const t = criterios.tiempoMax;
    const limite = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    return `3.ª estrella: termina en menos de <b class="c-oro">${limite}</b> sin pistas`;
  }
  return `2.ª estrella: comete <b class="c-oro">${criterios.erroresMax} errores</b> o menos`;
}

export function formatoTiempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
