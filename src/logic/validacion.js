// Validación de respuestas (RF-06): acepta 2,5 y 2.5, signo menos normal o tipográfico.

const NUMERO = /^[+-]?(\d+([.,]\d+)?|[.,]\d+)$/;

// Devuelve el número escrito o null si la entrada está vacía o no es numérica
export function leerNumero(texto) {
  const limpio = String(texto ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[−–]/g, '-');
  if (!NUMERO.test(limpio)) return null;
  const valor = Number(limpio.replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
}

export function esCorrecta(valor, solucion) {
  return Math.abs(valor - solucion) < 1e-9;
}
