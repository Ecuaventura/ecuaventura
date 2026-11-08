// Reglas de la cuadrícula de los mapas RPG (sin dibujo ni Phaser).
// Las usan el juego (Nivel, Zona) y herramientas/validarNiveles.mjs, para que
// el validador compruebe exactamente lo mismo que pasa en pantalla.

export const T = 16; // cuadro base en píxeles

// R techo, w W D paredes, # muro de la fila (cajones o buses), g f pasto,
// n banca, p macetero, m maletas (estilo terminal)
const SOLIDOS = 'RwWD#gfnpm';
const DIRECCIONES = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const clave = (c, r) => `${c},${r}`;

// Objetos sobre los que puede quedar un vecino ya ayudado (no son camino)
const OBJETOS_PUESTO = ['puesto', 'boleteria', 'equipaje', 'banca'];

// Estilo terminal: cada tramo de '#' de una fila se arma con buses de 4 cuadros
// (desde la izquierda) y los cuadros que sobran son maletas, o maceteros en los bordes.
// Devuelve un arreglo por columna: 'bus' | 'maleta' | 'macetero' | null.
export function tramosTerminal(fila) {
  const tipos = new Array(fila.length).fill(null);
  let c = 0;
  while (c < fila.length) {
    if (fila[c] !== '#') { c++; continue; }
    let largo = 0;
    while (c + largo < fila.length && fila[c + largo] === '#') largo++;
    let k = 0;
    while (k < largo) {
      if (largo - k >= 4) {
        for (let j = 0; j < 4; j++) tipos[c + k + j] = 'bus';
        k += 4;
      } else {
        const col = c + k;
        tipos[col] = col === 0 || col === fila.length - 1 ? 'macetero' : 'maleta';
        k++;
      }
    }
    c += largo;
  }
  return tipos;
}

// Cuadros que ocupa cada objeto del mapa (no se puede caminar sobre ellos)
export function cuadrosObjeto(o) {
  const c = (px) => Math.floor(px / T);
  const lista = [];
  const area = (x0, y0, x1, y1) => {
    for (let r = c(y0); r <= c(y1); r++) for (let col = c(x0); col <= c(x1); col++) lista.push([col, r]);
  };
  if (o.tipo === 'puesto') area(o.x, o.y, o.x + o.ancho * T - 1, o.y + 31);
  if (o.tipo === 'fuente') area(o.x + 1, o.y + 3, o.x + 46, o.y + 46);
  if (o.tipo === 'sacos') area(o.x, o.y, o.x + 15, o.y + 15);
  if (o.tipo === 'arbol') area(o.x + 4, o.y + 12, o.x + 28, o.y + 31);
  if (o.tipo === 'busParado') area(o.x, o.y, o.x + 31, o.y + 47);
  if (o.tipo === 'boleteria') area(o.x, o.y + 4, o.x + 47, o.y + 31);
  if (['letrero', 'farol', 'banca', 'equipaje'].includes(o.tipo)) area(o.x, o.y, o.x + 15, o.y + 15);
  if (o.tipo === 'arco') {
    // pilares a los lados, viga arriba y un solo pasillo en el medio
    const izq = c(o.x), fila = c(o.y);
    for (let r = fila; r < fila + 4; r++) lista.push([izq, r], [izq + 2, r], [izq + 3, r]);
    lista.push([izq + 1, fila]);
  }
  return lista;
}

// Cuadrícula lógica de un mapa de mapas.json.
// solidos: no se camina. puestos: subconjunto de sólidos que son cajones o
// puestos de venta (allí se puede parar un vecino ya ayudado).
// letrasSolidas: letras de 'filas' que no se caminan (si el mapa trae su propia leyenda,
// como la zona del Puerto: S w ~ r M K C F). objetosCuadros: objetos en cuadros ({ tipo, x, y },
// como en mapa_puerto.json) que tapan los cuadros de su huella: huellas[tipo] = [dc0, dr0, dc1, dr1].
export function crearCuadricula(def, bloqueosExtra = []) {
  const filas = def.filas.length;
  const columnas = def.filas[0].length;
  const solidos = new Set();
  const puestos = new Set();
  // terminal: estilo antiguo o laberintos con muros de buses (Mundo 2 v2)
  const terminal = def.estilo === 'terminal' || def.muros === 'buses';
  const letrasSolidas = def.letrasSolidas ?? SOLIDOS;
  def.filas.forEach((fila, r) => {
    const tramos = terminal ? tramosTerminal(fila) : null;
    [...fila].forEach((ch, c) => {
      if (letrasSolidas.includes(ch)) solidos.add(clave(c, r));
      // mercado: toda la fila de cajones es puesto; terminal: las maletas y maceteros
      // junto a los buses (sobre un bus no se para nadie), y las bancas
      const esPuesto = terminal ? (ch === '#' && tramos[c] !== 'bus') || 'npm'.includes(ch) : ch === '#';
      if (esPuesto) puestos.add(clave(c, r));
    });
  });
  for (const o of def.objetos || []) {
    for (const [c, r] of cuadrosObjeto(o)) {
      solidos.add(clave(c, r));
      if (OBJETOS_PUESTO.includes(o.tipo)) puestos.add(clave(c, r));
    }
  }
  // Mapas de imagen (zona del Mercado v2): rectángulos [c0, r0, c1, r1] en cuadros
  const rect = ([c0, r0, c1, r1], ...conjuntos) => {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) conjuntos.forEach((s) => s.add(clave(c, r)));
  };
  for (const rc of def.solidos || []) rect(rc, solidos);
  for (const o of def.objetosCuadros || []) {
    const h = huellaObjeto(def, o);
    if (!h) continue;
    const [x, y] = cuadroObjeto(def, o);
    rect([x + h[0], y + h[1], x + h[2], y + h[3]], solidos);
  }
  for (const rc of def.puestos || []) rect(rc, solidos, puestos);
  for (const [c, r] of bloqueosExtra) solidos.add(clave(c, r));

  const dentro = (c, r) => c >= 0 && r >= 0 && c < columnas && r < filas;
  return {
    columnas,
    filas,
    esSolido: (c, r) => !dentro(c, r) || solidos.has(clave(c, r)),
    esPuesto: (c, r) => dentro(c, r) && puestos.has(clave(c, r))
  };
}

// Huella de un objeto de objetosCuadros: la suya propia (o.huella) o la de su tipo.
// La huella es solo la BASE del objeto (lo que toca el suelo): la parte alta se camina por detrás.
function huellaObjeto(def, o) {
  return o.huella || (def.huellas || {})[o.tipo] || null;
}

// Cuadro desde el que se cuenta la huella. redondear: tipos dibujados a media fila o columna
// (carros, barreras…) cuyo dibujo cae en el cuadro redondeado y no en el de abajo-izquierda.
function cuadroObjeto(def, o) {
  const f = (def.redondear || []).includes(o.tipo) ? Math.round : Math.floor;
  return [f(o.x), f(o.y)];
}

// Partes altas de los objetos (copa de un árbol, techo, farol, toldo…) que tapan a quien camina
// detrás. El juego copia ese trozo del fondo y lo dibuja con profundidad = borde inferior de la
// base, así el personaje queda detrás si sus pies están más arriba y delante si están más abajo.
// altos[tipo] (u o.alto) = cuántos cuadros sube el dibujo sobre la huella; en los rectángulos
// [c0, r0, c1, r1, alto] de solidos/puestos es el quinto número.
// Devuelve [{ c0, c1, arriba, desde, base }] en cuadros (arriba puede ser fraccionario).
export function relievesMapa(def) {
  const lista = [];
  for (const o of def.objetosCuadros || []) {
    const h = huellaObjeto(def, o);
    const alto = o.alto ?? (def.altos || {})[o.tipo];
    if (!h || !alto) continue;
    const [x, y] = cuadroObjeto(def, o);
    lista.push({ c0: x + h[0], c1: x + h[2], arriba: y + h[1] - alto, desde: y + h[1], base: y + h[3] + 1 });
  }
  for (const rc of [...(def.solidos || []), ...(def.puestos || [])]) {
    if (!rc[4]) continue;
    lista.push({ c0: rc[0], c1: rc[2], arriba: rc[1] - rc[4], desde: rc[1], base: rc[3] + 1 });
  }
  return lista;
}

const signo = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// Retirada de un vecino ya ayudado (regla definitiva para todos los mundos):
// 1) da UN paso hacia atrás, hacia su puesto (cajones o puesto de venta, nunca pasillo);
// 2) si no hay puesto junto a él, camina unos pasos alejándose y se desvanece.
// Devuelve { camino: [[c, r], …], desvanecer }.
export function calcularRetirada(cuadricula, vecino, jugador, pasosFuga = 3) {
  const haciaJugador = [signo(jugador.c - vecino.c), signo(jugador.r - vecino.r)];
  const atras = [-haciaJugador[0], -haciaJugador[1]];
  const lados = haciaJugador[0] === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  const orden = [atras, ...lados, ...DIRECCIONES];

  for (const [dc, dr] of orden) {
    if (cuadricula.esPuesto(vecino.c + dc, vecino.r + dr)) {
      return { camino: [[vecino.c + dc, vecino.r + dr]], desvanecer: false };
    }
  }

  // Sin puesto: se aleja del jugador por cuadros caminables y luego desaparece
  const camino = [];
  const visitados = new Set([clave(vecino.c, vecino.r), clave(jugador.c, jugador.r)]);
  let c = vecino.c, r = vecino.r;
  for (let i = 0; i < pasosFuga; i++) {
    const paso = [atras, ...lados].find(([dc, dr]) => !cuadricula.esSolido(c + dc, r + dr) && !visitados.has(clave(c + dc, r + dr)));
    if (!paso) break;
    c += paso[0];
    r += paso[1];
    visitados.add(clave(c, r));
    camino.push([c, r]);
  }
  return { camino, desvanecer: true };
}

// Cuadros caminables alcanzables desde 'desde'. bloqueados: Set de "c,r" ocupados por vecinos.
export function alcanzables(cuadricula, desde, bloqueados = new Set()) {
  const vistos = new Map([[clave(desde[0], desde[1]), null]]);
  const cola = [desde];
  while (cola.length) {
    const [c, r] = cola.shift();
    for (const [dc, dr] of DIRECCIONES) {
      const n = [c + dc, r + dr];
      const k = clave(n[0], n[1]);
      if (vistos.has(k) || cuadricula.esSolido(n[0], n[1]) || bloqueados.has(k)) continue;
      vistos.set(k, clave(c, r));
      cola.push(n);
    }
  }
  return vistos; // Map cuadro -> cuadro anterior (para reconstruir caminos)
}

// Camino más corto (lista de cuadros, sin incluir el inicio) o null
export function caminoHasta(cuadricula, desde, hasta, bloqueados = new Set()) {
  const vistos = alcanzables(cuadricula, desde, bloqueados);
  let k = clave(hasta[0], hasta[1]);
  if (!vistos.has(k)) return null;
  const camino = [];
  while (k !== clave(desde[0], desde[1])) {
    camino.unshift(k.split(',').map(Number));
    k = vistos.get(k);
  }
  return camino;
}

// Cuadros caminables junto a (c, r), en orden: abajo, izquierda, derecha, arriba
export function cuadrosJunto(cuadricula, c, r) {
  return [[0, 1], [-1, 0], [1, 0], [0, -1]]
    .map(([dc, dr]) => [c + dc, r + dr])
    .filter(([x, y]) => !cuadricula.esSolido(x, y));
}
