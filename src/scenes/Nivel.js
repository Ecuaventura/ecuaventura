import Phaser from 'phaser';
import { crearPantalla, conectarBotones, confirmar, escribirTexto, rellenar, rutaImagen, escaparHtml } from './ui.js';
import { MapaRPG, Personaje, ControlMovimiento, pasoJugador, estaJunto, crearJugador, CUADRO } from '../mundo/mapaRPG.js';
import { calcularRetirada } from '../mundo/reglasMapa.js';
import { crearElemento, colocar, colocarEnMundo, colocarAviso, mostrar, htmlChip, htmlDialogo, apartarAyuda } from '../mundo/interfazRPG.js';
import { BOTON_EJEMPLO, PanelEjemplo, claveEjemplo } from '../mundo/ejemplo.js';
import { armarHistoria } from '../logic/historias.js';
import { valor as valorTerminos, juntarX as juntarXTexto } from '../logic/terminos.js';
import { expandir } from '../logic/parentesis.js';
import { reducirLado, quitarParentesis, valorLado, ladosVisibles } from '../logic/ambosLados.js';
import { datosPista as datosPistaFracciones } from '../logic/fracciones.js';
import { datosPistaFraccionFraccion } from '../logic/fraccionFraccion.js';
import { PANELES, panelVidaReal } from '../mundo/panelesReto.js';
import { generarEcuacion, generarVarias, mezclar, evaluarIzquierda, textoComprobacion, formatoNumero, claveEcuacion, TIPOS_CON_FORMA } from '../logic/generadorEcuaciones.js';
import { leerNumero, esCorrecta } from '../logic/validacion.js';
import { PUNTOS, puntosReto, bonoRacha, calcularEstrellas, formatoTiempo } from '../logic/puntaje.js';
import * as almacen from '../db/almacen.js';
import NIVELES from '../data/niveles.json';
import MUNDOS from '../data/mundos.json';
import PERSONAJES from '../data/personajes.json';
import DIALOGOS from '../data/dialogos.json';
import PISTAS from '../data/pistas.json';
import PLANTILLAS from '../data/plantillas.json';

const CONFETI = [
  [300, 120, '#f2b632', 20], [330, 200, '#1fa36b', 45], [270, 300, '#d9406a', 10], [1050, 130, '#1fa36b', 30],
  [1090, 230, '#f2b632', 60], [1060, 330, '#2c6fb5', 15], [560, 104, '#d9406a', 40], [820, 110, '#2c6fb5', 0],
  [700, 96, '#f2b632', 25], [440, 430, '#1fa36b', 50], [930, 430, '#f2b632', 35]
];

// Nivel de cualquier mundo — diseños: diseño/2_mundo1_mercado/12–16, diseño/8_cambios_entrevista/01 y 07, diseño/3_mundo2_terminal/22–26
// Misiones del mundo abierto (Mundo 3, nivel.mision): un solo anfitrión da los 3 retos seguidos
// (diseño/4_mundo3_puerto/308–313 con el panel de 8_cambios_entrevista/03); no hay meta: al
// resolver el último reto se completa la misión.
export default class Nivel extends Phaser.Scene {
  constructor() {
    super('Nivel');
  }

  init(data) {
    this.idNivel = data.nivel;
  }

  create() {
    this.estudiante = this.registry.get('estudiante');
    this.nivel = NIVELES.niveles.find((n) => n.id === this.idNivel);
    if (!this.estudiante || !this.nivel) {
      this.scene.start('Inicio');
      return;
    }
    this.mundo = MUNDOS.mundos.find((m) => m.id === this.nivel.mundo);
    // textos comunes, con los propios del mundo encima (dialogos.json → porMundo)
    this.textos = { ...DIALOGOS.comun, ...(DIALOGOS.porMundo[this.mundo.id] || {}) };
    this.mapa = new MapaRPG(this, this.nivel.mapa, this.nivel.bloqueos || []);
    this.estado = 'explorar';
    this.tiempoMs = 0;
    this.stats = { puntaje: 0, aciertos: 0, errores: 0, intentos: 0, pistas: 0, racha: 0, mejorRacha: 0, bono: 0 };

    this.crearDom();
    this.crearPersonajes();
    this.actualizarHud();
    // misión: se acaba de aceptar la invitación del anfitrión, el primer reto se abre solo
    if (this.nivel.mision) this.time.delayedCall(250, () => { if (this.estado === 'explorar') this.abrirReto(this.vecinos[0]); });

    this.control = new ControlMovimiento(this);
    this.input.keyboard.on('keydown-SPACE', () => this.accion());
    this.input.keyboard.on('keydown-ENTER', () => this.accion());
    this.input.keyboard.on('keydown-ESC', () => this.cancelar());
    const alReanudar = () => { this.estado = this.estadoPrevio || 'explorar'; };
    this.events.on('resume', alReanudar);
    this.events.once('shutdown', () => this.events.off('resume', alReanudar));
  }

  // ------------------------------------------------------------------ retos
  crearRetos(vecinos) {
    if (TIPOS_CON_FORMA.includes(this.nivel.tipo)) {
      // nunca la misma ecuación que ya vio este estudiante en el nivel ni la del «Ver ejemplo»
      const evitar = almacen.ecuacionesMostradas(this.estudiante.id, this.nivel.id);
      const ejemplo = claveEjemplo(this.mundo.id);
      if (ejemplo) evitar.add(ejemplo);
      // varias formas en un nivel (p. ej. nivel 9): cada una sale al menos una vez, en orden al azar
      const formas = this.nivel.formas || [this.nivel.forma];
      const porReto = mezclar(vecinos.map((_, i) => formas[i % formas.length]));
      const ecuaciones = generarVarias(vecinos.map(() => this.nivel.tipo), porReto.map((forma) => ({ ...this.nivel.rangos, forma })), evitar);
      almacen.registrarEcuaciones(this.estudiante.id, this.nivel.id, ecuaciones.map(claveEcuacion));
      return ecuaciones.map((ecuacion, i) => {
        const def = PERSONAJES.vecinos[vecinos[i].personaje];
        const temas = def.temas || ['balanza'];
        // en una misión el mismo anfitrión da los 3 retos: los temas rotan sin repetirse seguidos
        const tema = this.nivel.mision ? temas[(i + this.temaInicial(temas)) % temas.length] : temas[Math.floor(Math.random() * temas.length)];
        // Mundo 3: la historia compara lo del vecino con lo de otro personaje (personajes.json → otros)
        const otros = def.otros || [];
        const otro = otros.length ? otros[Math.floor(Math.random() * otros.length)] : null;
        const final = !!vecinos[i].requiereTodos || (!!this.nivel.mision && !!this.nivel.esRetoMundo && i === vecinos.length - 1);
        const texto = armarHistoria(ecuacion, tema, this.estudiante.nombre, { final, otro: otro ? PERSONAJES.vecinos[otro].nombre : undefined });
        const personas = otro ? [{ sprite: def.sprite, nombre: def.nombre }, { sprite: PERSONAJES.vecinos[otro].sprite, nombre: PERSONAJES.vecinos[otro].nombre }] : null;
        return { ecuacion, vidaReal: !!this.nivel.vidaReal, conHistoria: true, tema, personas, ...texto };
      });
    }
    if (this.nivel.tipo === 'vida-real') {
      return vecinos.map((v) => {
        const plantilla = PLANTILLAS.plantillas[v.plantilla];
        return { ecuacion: generarEcuacion(plantilla.tipo, plantilla.rangos), plantilla, vidaReal: true };
      });
    }
    const tipos = this.nivel.tipo === 'mezcla'
      ? mezclar(this.nivel.tipos).slice(0, vecinos.length)
      : vecinos.map(() => this.nivel.tipo);
    return generarVarias(tipos, this.nivel.rangos).map((ecuacion) => ({ ecuacion, vidaReal: false }));
  }

  temaInicial(temas) {
    if (this.primerTema === undefined) this.primerTema = Math.floor(Math.random() * temas.length);
    return this.primerTema;
  }

  // ------------------------------------------------------------------ DOM
  crearDom() {
    const n = this.nivel;
    const titulo = n.tituloHud || (n.esRetoMundo ? `NIVEL ${n.numero} · RETO` : `NIVEL ${n.numero}`);
    this.raiz = crearPantalla(this, `
<div class="capa-etiquetas"></div>
<div class="capa-fondo-reto"></div>
<div class="hud">${htmlChip(this.estudiante.nombre, `${this.estudiante.personaje || 'p1'}_sprite`)}
<div style="display:flex;flex-direction:column;gap:6px;white-space:nowrap"><span style="font-size:16px;font-weight:800;color:#ffe9b8">${n.etiquetaHud || `Mundo ${this.mundo.id} · ${this.mundo.nombre} · ${n.etiquetaTipo}`}</span><span class="px" style="font-size:15px;color:#f2b632">${titulo}</span></div>
<div style="display:flex;flex-direction:column;gap:6px;width:190px;margin-left:6px"><span class="ayudados" style="font-size:15px;font-weight:800;white-space:nowrap"></span>
<div style="height:14px;background:#4e1027;border:3px solid #1b1430"><div class="barra" style="width:3%;height:100%;background:#1fa36b"></div></div></div>
<div style="margin-left:auto;display:flex;gap:10px;align-items:center">
<div class="stat stat-racha" style="display:none"><b>RACHA</b><span class="racha" style="color:#ff9f43">x2</span></div>
<div class="stat"><b>PUNTAJE</b><span class="puntaje" style="color:#f2b632">0000</span></div>
<div class="stat"><b>TIEMPO</b><span class="tiempo">00:00</span></div>
<button type="button" class="boton btn" style="width:48px;padding:0" data-accion="ayuda" aria-label="Instrucciones">?</button><button type="button" class="boton btn" data-accion="reiniciar">REINICIAR</button><button type="button" class="boton btn" data-accion="salir">SALIR</button></div></div>
<div class="hint"><span>${n.ayuda}</span></div>
<div class="capa-reto"></div>
<div class="capa-dialogo"></div>`, { clase: 'rpg' });

    conectarBotones(this.raiz, {
      ayuda: () => this.abrirInstrucciones(),
      reiniciar: () => this.reiniciar(),
      salir: () => this.salir()
    });

    const etiquetas = this.raiz.querySelector('.capa-etiquetas');
    this.tagJugador = crearElemento(etiquetas, `<div class="tag yo">${escaparHtml(this.estudiante.nombre)}</div>`);
    this.tagVecino = crearElemento(etiquetas, '<div class="tag" style="font-size:16px"></div>');
    this.aviso = crearElemento(etiquetas, '<div class="aviso"><span class="key" style="margin-right:8px">ESPACIO</span>Hablar</div>');
    this.hint = this.raiz.querySelector('.hint');
    this.capaReto = this.raiz.querySelector('.capa-reto');
    this.capaFondoReto = this.raiz.querySelector('.capa-fondo-reto');
    this.etiquetas = etiquetas;
  }

  crearPersonajes() {
    if (this.nivel.mision) this.crearMision();
    else this.crearVecinos();
    this.ambientales = (this.nivel.ambientales || []).map((amb) => {
      const def = PERSONAJES.vecinos[amb.personaje];
      const p = this.mapa.agregar(new Personaje(this, def.sprite, amb.pos[0], amb.pos[1]));
      p.def = def;
      p.dialogo = amb.dialogo || '¡Suerte, {nombre}! Los vecinos cuentan contigo.';
      return p;
    });
    if (this.nivel.condor) {
      const [cx, cy] = this.mundo.condorPos || [1221, 196];
      this.condor = this.add.image(cx, cy, 'condor_posado').setOrigin(0, 0).setDisplaySize(88, 64).setDepth(300);
    }
    const [c, r] = this.nivel.inicio;
    this.jugador = this.mapa.agregar(crearJugador(this, c, r));
    this.jugador.mirar(this.nivel.mision ? this.direccionHacia(this.vecinos[0]) : 'arriba');
    this.mapa.seguir(this.jugador);
    const [ec, er] = this.nivel.ecu;
    this.ecu = this.mapa.agregar(new Personaje(this, 'sprite_ecu', ec, er, { bloquea: false, pies: 0.92 }));
  }

  // Dibujo en la posición exacta del mapa (px en cuadros, como en mapa_*.json)
  ponerEnPx(p, px) {
    if (px) p.colocarEn(px[0] * CUADRO + CUADRO / 2 + this.mapa.desfaseX, (px[1] + 1) * CUADRO);
  }

  direccionHacia(v) {
    const [c, r] = this.nivel.inicio;
    if (v.c > c) return 'derecha';
    if (v.c < c) return 'izquierda';
    return v.r < r ? 'arriba' : 'abajo';
  }

  // Misión: un anfitrión con N retos. Cada reto es un objeto que hereda del anfitrión
  // (posición, sprite, def) y guarda su propio reto; en el mapa solo está el anfitrión.
  crearMision() {
    const cfg = this.nivel.vecinos[0];
    const def = PERSONAJES.vecinos[cfg.personaje];
    const anfitrion = this.mapa.agregar(new Personaje(this, def.sprite, cfg.pos[0], cfg.pos[1]));
    this.ponerEnPx(anfitrion, cfg.px);
    if (def.invisible) anfitrion.sprite.setVisible(false);
    const cfgs = Array.from({ length: this.nivel.retos || 3 }, () => cfg);
    const retos = this.crearRetos(cfgs);
    this.vecinos = cfgs.map((_, i) => {
      const p = Object.create(anfitrion);
      Object.assign(p, { def, cfg, indice: i, reto: { ...retos[i], resuelto: false, usoPista: false, erroresSeguidos: 0, intentos: 0, ultima: null } });
      p.bangEl = crearElemento(this.etiquetas, '<div class="bang">!</div>');
      return p;
    });
  }

  crearVecinos() {
    const defs = this.nivel.vecinos;
    const retos = this.crearRetos(defs);
    this.vecinos = defs.map((cfg, i) => {
      const def = PERSONAJES.vecinos[cfg.personaje];
      const p = this.mapa.agregar(new Personaje(this, def.sprite, cfg.pos[0], cfg.pos[1]));
      this.ponerEnPx(p, cfg.px);
      Object.assign(p, { def, cfg, indice: i, reto: { ...retos[i], resuelto: false, usoPista: false, erroresSeguidos: 0, intentos: 0, ultima: null } });
      p.bangEl = crearElemento(this.etiquetas, '<div class="bang">!</div>');
      return p;
    });
  }

  pendientes() {
    return this.vecinos.filter((v) => !v.reto.resuelto);
  }

  // ¿El vecino ya puede dar su reto? (secuencial: solo el primero pendiente)
  disponible(v) {
    if (v.reto.resuelto) return false;
    if (this.nivel.mision) return this.pendientes()[0] === v;
    if (v.cfg.requiereTodos) return this.pendientes().every((o) => o === v);
    if (this.nivel.orden === 'libre') return true;
    return this.pendientes()[0] === v;
  }

  // ------------------------------------------------------------------ ciclo
  update(tiempo, delta) {
    if (!this.jugador) return;
    if (this.estado !== 'fin' && this.estado !== 'pausa') {
      this.tiempoMs += delta;
      const seg = Math.floor(this.tiempoMs / 1000);
      if (seg !== this.ultimoSegundo) {
        this.ultimoSegundo = seg;
        this.raiz.querySelector('.tiempo').textContent = formatoTiempo(seg);
      }
    }
    if (this.estado === 'explorar') {
      const dir = this.control.direccion();
      if (dir) pasoJugador(this.mapa, this.jugador, this.ecu, dir, (c, r) => this.alPisar(c, r));
    }
    this.mapa.ordenarProfundidad();
    this.actualizarEtiquetas();
    apartarAyuda(this.hint, this.mapa, this.mapa.personajes);
  }

  actualizarEtiquetas() {
    const j = this.jugador;
    const algoArriba = this.vecinos.some((v) => !v.desvanecido && v.c === j.c && v.r === j.r - 1);
    colocarEnMundo(this.mapa, this.tagJugador, j.x, algoArriba ? j.yPiesActual + 6 : j.yCabeza - 38);

    let conTag = null;
    for (const v of this.vecinos) {
      // en una misión solo lleva «!» el reto que sigue (todos comparten al anfitrión)
      const visible = !v.reto.resuelto && (!this.nivel.mision || v === this.pendientes()[0]);
      mostrar(v.bangEl, visible);
      if (!visible) continue;
      const listo = this.disponible(v);
      v.bangEl.textContent = listo ? '!' : '…';
      v.bangEl.classList.toggle('espera', !listo);
      colocarEnMundo(this.mapa, v.bangEl, v.x, v.yCabeza - 40);
      if (listo && !conTag) conTag = v;
    }
    mostrar(this.tagVecino, !!conTag);
    if (conTag) {
      this.tagVecino.textContent = conTag.def.etiqueta || conTag.def.nombre;
      const jugadorDebajo = j.c === conTag.c && j.r === conTag.r + 1;
      if (jugadorDebajo) colocarEnMundo(this.mapa, this.tagVecino, conTag.x - 102, conTag.yPiesActual - 62);
      else colocarEnMundo(this.mapa, this.tagVecino, conTag.x, conTag.yPiesActual + 6);
    }

    const objetivo = this.estado === 'explorar' && !j.moviendo ? this.buscarObjetivo() : null;
    mostrar(this.aviso, !!objetivo);
    if (objetivo) colocarAviso(this.aviso, j, this.mapa);
  }

  buscarObjetivo() {
    const j = this.jugador;
    return this.vecinos.find((v) => !v.reto.resuelto && estaJunto(j, v.c, v.r)) ||
      this.vecinos.find((v) => v.ayudado && !v.desvanecido && !v.moviendo && estaJunto(j, v.c, v.r)) ||
      this.ambientales.find((v) => estaJunto(j, v.c, v.r)) || null;
  }

  actualizarHud() {
    const total = this.vecinos.length;
    const hechos = total - this.pendientes().length;
    this.raiz.querySelector('.ayudados').textContent = this.nivel.mision ? `Retos de la misión ${hechos} de ${total}` : `Retos ${hechos} de ${total}`;
    this.raiz.querySelector('.barra').style.width = `${Math.max(3, Math.round((hechos / total) * 100))}%`;
    this.raiz.querySelector('.puntaje').textContent = String(this.stats.puntaje).padStart(4, '0');
    const racha = this.raiz.querySelector('.stat-racha');
    mostrar(racha, this.stats.racha >= 1);
    this.raiz.querySelector('.racha').textContent = `x${this.stats.racha}`;
  }

  // ------------------------------------------------------------------ teclado
  accion() {
    if (this.estado === 'dialogo') {
      if (!this.dialogo.escritura.terminado) this.dialogo.escritura.terminar();
      else this.cerrarDialogo();
      return;
    }
    if (this.estado === 'reto') {
      const r = this.retoAbierto;
      if (document.activeElement === r.campo) return;
      if (r.escritura && !r.escritura.terminado) { r.escritura.terminar(); return; }
      if (r.modo === 'correcto') this.continuarTrasAcierto();
      return;
    }
    if (this.estado !== 'explorar' || this.jugador.moviendo) return;
    const objetivo = this.buscarObjetivo();
    if (!objetivo) return;
    const nombre = this.estudiante.nombre;
    if (!objetivo.reto) {
      this.abrirDialogo(objetivo.def.retrato, objetivo.def.nombre, rellenar(objetivo.dialogo, { nombre }));
      return;
    }
    if (objetivo.reto.resuelto) {
      this.hablarAyudado(objetivo);
      return;
    }
    if (!this.disponible(objetivo)) {
      const faltan = this.pendientes().filter((v) => v !== objetivo).map((v) => v.def.nombre).join(' y a ');
      this.abrirDialogo(objetivo.def.retrato, objetivo.def.nombre, rellenar(this.textos.esperaTodos, { nombre, faltan }));
      return;
    }
    this.abrirReto(objetivo);
  }

  cancelar() {
    if (this.estado === 'dialogo') this.cerrarDialogo();
    else if (this.estado === 'reto' && this.retoAbierto.modo !== 'correcto') this.cerrarReto();
  }

  alPisar(c, r) {
    if (!this.nivel.meta) return;   // misiones: se completan al resolver el último reto
    const [mc, mr] = this.nivel.meta;
    if (c === mc && r === mr && this.pendientes().length === 0) this.completar();
  }

  // ------------------------------------------------------------------ diálogo simple
  abrirDialogo(retrato, nombre, html) {
    this.estado = 'dialogo';
    mostrar(this.hint, false);
    const caja = crearElemento(this.raiz.querySelector('.capa-dialogo'),
      htmlDialogo({ retrato, nombre, lateral: `<span class="px seguir">${DIALOGOS.zona.continuar}</span>` }));
    caja.addEventListener('click', () => this.accion());
    this.dialogo = { caja, escritura: escribirTexto(this, caja.querySelector('.txt'), `<span>${html}</span>`) };
  }

  cerrarDialogo() {
    this.dialogo.escritura.terminar();
    this.dialogo.caja.remove();
    this.dialogo = null;
    this.estado = 'explorar';
    mostrar(this.hint, true);
  }

  // ------------------------------------------------------------------ reto
  valoresTexto(v) {
    const { a, b, c, d, x } = v.reto.ecuacion;
    return {
      nombre: this.estudiante.nombre,
      vecino: v.def.nombre,
      VECINO: v.def.nombre.toUpperCase(),
      producto: v.def.producto,
      a: formatoNumero(a), b: formatoNumero(b), c: formatoNumero(c ?? d), d: formatoNumero(d), x: formatoNumero(x),
      comprobacion: textoComprobacion(v.reto.ecuacion, x)
    };
  }

  abrirReto(v) {
    this.estado = 'reto';
    mostrar(this.hint, false);
    this.capaReto.innerHTML = '';
    // el oscurecido va debajo del HUD, como en la plantilla 13
    this.dim = crearElemento(this.capaFondoReto, '<div class="dim"></div>');
    const r = {
      vecino: v,
      modo: 'pregunta',
      panel: crearElemento(this.capaReto, '<div class="panel"></div>'),
      extras: crearElemento(this.capaReto, '<div style="position:absolute;inset:0;pointer-events:none"></div>'),
      dlg: crearElemento(this.capaReto, htmlDialogo({ retrato: v.def.retrato, nombre: v.def.placa || v.def.nombre, lateral: this.htmlRespuesta() }))
    };
    r.campo = r.dlg.querySelector('.inp');
    r.msg = r.dlg.querySelector('.msg');
    r.ejemplo = new PanelEjemplo(this.capaReto, r.panel, this.mundo.id);
    this.retoAbierto = r;

    r.campo.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') return;
      // que Phaser no reciba lo que se escribe (W A S D, Espacio, Enter…)
      e.stopPropagation();
      if (e.key === 'Enter') this.comprobar();
    });
    r.campo.addEventListener('input', () => {
      r.campo.classList.remove('mal');
      mostrar(r.msg, false);
    });
    r.dlg.querySelector('[data-r="comprobar"]').addEventListener('click', () => this.comprobar());
    r.dlg.querySelector('[data-r="pista"]').addEventListener('click', (e) => { e.currentTarget.blur(); this.pedirPista(); });
    r.dlg.addEventListener('click', (e) => {
      if (r.modo === 'correcto' && !e.target.closest('input')) this.accion();
    });

    this.dibujarPanel();
    this.textoPregunta();
    this.time.delayedCall(30, () => r.campo.focus());
  }

  htmlRespuesta() {
    return `<div style="display:flex;align-items:center;gap:14px"><span class="px" style="font-size:22px">x =</span><input class="inp" type="text" inputmode="decimal" maxlength="8" autocomplete="off" spellcheck="false" aria-label="Valor de x"></div>
<span class="msg" style="display:none"></span>
<button type="button" class="boton btn verde" data-r="comprobar" style="height:58px;font-size:14px">COMPROBAR ↵</button>
<button type="button" class="boton btn azul" data-r="pista" style="height:50px;font-size:12px">? PISTA <span style="font-family:Nunito;font-size:15px;font-weight:800;color:#ffe9b8;margin-left:8px">−${PUNTOS.descuentoPista} pts</span></button>
<span class="px seguir" data-r="seguir" style="display:none">ESPACIO ▼ continuar</span>`;
  }

  // Retrato y nombre del que habla (el vecino o Ecu)
  hablante(def) {
    const r = this.retoAbierto;
    r.dlg.querySelector('.ret img').src = rutaImagen(def.retrato);
    r.dlg.querySelector('.ret .nm').textContent = (def.placa || def.nombre).toUpperCase();
  }

  escribir(html) {
    const r = this.retoAbierto;
    if (r.escritura) r.escritura.terminar();
    r.escritura = escribirTexto(this, r.dlg.querySelector('.txt'), html);
  }

  textoPregunta(error = false) {
    const v = this.retoAbierto.vecino;
    const val = this.valoresTexto(v);
    const reto = v.reto;
    if (reto.conHistoria) {
      // historia armada con los números del reto (historias.json)
      const pasos = reto.vidaReal ? `<span style="display:flex;gap:10px;flex-wrap:wrap;font-size:17px">${this.textos.pasos.map((p) => `<span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">${p}</span>`).join('')}</span>` : '';
      this.hablante(v.def);
      this.escribir(error ? `<span>${this.textos.errorTerminos}</span><span class="c-guinda">${reto.pregunta}</span>` : `${reto.historia}${pasos}`);
      return;
    }
    const fuente = reto.vidaReal ? reto.plantilla : DIALOGOS.retos[reto.ecuacion.tipo];
    const pie = reto.vidaReal
      ? `<span style="display:flex;gap:10px;flex-wrap:wrap;font-size:17px">${this.textos.pasos.map((p) => `<span style="padding:5px 10px;background:#efe4cc;border:3px solid #1b1430">${p}</span>`).join('')}</span>`
      : `<span style="font-size:18px;color:#4e1027;font-weight:700">${this.textos.instruccion}</span>`;
    const primera = error
      ? `<span>${reto.vidaReal ? this.textos.errorVidaReal : this.textos.error}</span>`
      : `<span>${rellenar(fuente.intro, val)}</span>`;
    this.hablante(v.def);
    this.escribir(`${primera}<span class="c-guinda">${fuente.pregunta}</span>${pie}`);
  }

  dibujarPanel(valor = null) {
    const r = this.retoAbierto;
    const v = r.vecino;
    const ec = v.reto.ecuacion;
    const modo = r.modo === 'correcto' ? 'ok' : r.modo === 'error' || (r.modo === 'pista' && valor !== null) ? 'mal' : null;
    if (v.reto.vidaReal && !v.reto.conHistoria) {
      panelVidaReal(r.panel, { ec, modo, valor, plantilla: v.reto.plantilla, puerta: v.indice + 1, total: this.vecinos.length });
      // Tarjeta del cóndor (diseños 16 y 26) mientras no haya errores
      if (this.nivel.condor && v.cfg.requiereTodos && !modo) {
        r.extras.innerHTML = `<div style="position:absolute;left:1098px;top:96px;width:250px;padding:12px;background:#4e1027;border:3px solid #1b1430;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3;color:#fff"><img src="${rutaImagen('condor_posado')}" alt="" style="width:70px;image-rendering:pixelated">El cóndor te espera en la salida</div>`;
      }
      return;
    }
    // balanza (Mundo 1), bus (Mundo 2)… según mundos.json → retoVisual
    PANELES[this.mundo.retoVisual || 'balanza'](r.panel, { ec, modo, valor, valores: this.valoresTexto(v), color: v.indice, vidaReal: v.reto.vidaReal, mundo: this.mundo, nivel: this.nivel, reto: v.reto });
    this.ponerBotonEjemplo(r);
    // desafío final del mundo abierto (diseño 411): tarjeta con el objeto que se usa (niveles.json → tarjeta)
    if (this.nivel.tarjeta && !modo && !r.ejemplo.abierto) {
      const t = this.nivel.tarjeta;
      r.extras.innerHTML = `<div class="tarjeta" style="left:1098px;top:104px;width:250px;padding:12px;background:#4e1027;color:#fff;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3"><img src="${rutaImagen(t.imagen)}" alt="" style="width:60px;image-rendering:pixelated">${t.texto}</div>`;
    }
    if (v.reto.conHistoria && v.reto.vidaReal && this.nivel.condor && v.cfg.requiereTodos && !modo) {
      r.extras.innerHTML = `<div style="position:absolute;left:1098px;top:96px;width:250px;padding:12px;background:#4e1027;border:3px solid #1b1430;display:flex;gap:10px;align-items:center;font-size:17px;font-weight:800;line-height:1.3;color:#fff"><img src="${rutaImagen('condor_posado')}" alt="" style="width:70px;image-rendering:pixelated">El cóndor te espera en la salida</div>`;
    }
  }

  // «VER EJEMPLO» (diseño 07): no resta puntos y no cambia el reto
  ponerBotonEjemplo(r) {
    if (!r.ejemplo.ejemplo) return;
    r.panel.insertAdjacentHTML('beforeend', BOTON_EJEMPLO);
    r.panel.querySelector('[data-r="ejemplo"]').addEventListener('click', (e) => {
      e.currentTarget.blur();
      r.ejemplo.alternar();
      if (r.ejemplo.abierto) r.extras.querySelectorAll('.tarjeta').forEach((el) => el.remove());
      if (!r.campo.disabled) r.campo.focus();
    });
  }

  // ------------------------------------------------------------------ comprobar
  comprobar() {
    const r = this.retoAbierto;
    if (!r || r.modo === 'correcto') return;
    const valor = leerNumero(r.campo.value);
    if (valor === null) {
      // RF-06: no cuenta como intento
      r.msg.textContent = this.textos.invalido;
      mostrar(r.msg, true);
      r.campo.classList.add('mal');
      r.campo.classList.remove('temblor');
      void r.campo.offsetWidth;
      r.campo.classList.add('temblor');
      r.campo.focus();
      return;
    }
    mostrar(r.msg, false);
    const reto = r.vecino.reto;
    reto.intentos++;
    reto.ultima = valor;
    this.stats.intentos++;
    if (esCorrecta(valor, reto.ecuacion.x)) this.acierto(valor);
    else this.error(valor);
  }

  acierto(valor) {
    const r = this.retoAbierto;
    const v = r.vecino;
    const reto = v.reto;
    r.modo = 'correcto';
    reto.resuelto = true;
    // pierde la colisión al instante: el jugador ya puede pasar a través de él
    v.marcarAyudado();
    const s = this.stats;
    s.aciertos++;
    s.racha++;
    s.mejorRacha = Math.max(s.mejorRacha, s.racha);
    const puntos = puntosReto(reto.usoPista);
    const bono = bonoRacha(s.racha);
    s.puntaje += puntos + bono;
    s.bono += bono;
    this.actualizarHud();
    almacen.registrarReto(this.estudiante.id, this.nivel.id);

    r.campo.value = formatoNumero(valor);
    r.campo.className = 'inp ok';
    r.campo.disabled = true;
    r.campo.blur();
    r.dlg.querySelectorAll('[data-r="comprobar"],[data-r="pista"]').forEach((b) => mostrar(b, false));
    mostrar(r.dlg.querySelector('[data-r="seguir"]'), true);

    this.dibujarPanel(valor);
    const fuenteReto = reto.vidaReal ? null : DIALOGOS.retos[reto.ecuacion.tipo];
    const banner = (fuenteReto && fuenteReto.bannerCorrecto) || '¡CORRECTO!';
    const [px, py] = [400, 150];
    r.extras.innerHTML = `<div class="banner anim" style="top:74px;background:#157a4f">${banner}</div>
<div class="puntos-anim" style="position:absolute;left:${px}px;top:${py}px;font-family:'Press Start 2P';font-size:30px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">+${puntos}</div>
${bono ? `<div class="puntos-anim" style="position:absolute;left:${px - 20}px;top:${py + 50}px;font-family:'Press Start 2P';font-size:18px;color:#ff9f43;text-shadow:3px 3px 0 #1b1430;animation-delay:.3s">RACHA x${s.racha} +${bono}</div>` : ''}
<img class="feliz" src="${rutaImagen('mascota_feliz')}" alt="" style="position:absolute;left:1100px;top:250px;width:90px;image-rendering:pixelated">
${CONFETI.map(([x, y, c, g], i) => `<span class="conf anim" style="left:${x}px;top:${y}px;background:${c};transform:rotate(${g}deg);animation-delay:${(i % 4) * 0.12}s"></span>`).join('')}`;

    const val = this.valoresTexto(v);
    val.comprobacion = textoComprobacion(reto.ecuacion, valor);
    this.hablante(v.def);
    if (reto.conHistoria) {
      const respuesta = rellenar(reto.respuesta, { x: formatoNumero(valor) });
      this.escribir(`<span>${rellenar(reto.correcto, { ...val, respuesta })}</span><span>${this.textoSiguiente(v)}</span>`);
      return;
    }
    const fuente = reto.vidaReal ? reto.plantilla : DIALOGOS.retos[reto.ecuacion.tipo];
    this.escribir(`<span>${rellenar(fuente.correcto, val)}</span><span>${this.textoSiguiente(v)}</span>`);
  }

  textoSiguiente(v) {
    const quedan = this.pendientes();
    if (this.nivel.mision) {
      const total = this.vecinos.length;
      // niveles.json → textoFinal: lo que cuenta el anfitrión al terminar (p. ej. dónde está el boleto)
      return quedan.length
        ? rellenar(this.textos.misionSiguiente, { n: total - quedan.length + 1, total })
        : rellenar(this.nivel.textoFinal || this.textos.misionUltimo, { nombre: this.estudiante.nombre });
    }
    if (quedan.length === 0) {
      return this.nivel.condor ? this.textos.ultimoSalida : this.textos.ultimo;
    }
    const siguiente = this.nivel.orden === 'libre' ? quedan.find((o) => this.disponible(o)) || quedan[0] : quedan[0];
    const plantilla = v.indice < siguiente.indice ? this.textos.siguiente : this.textos.otroVecino;
    return rellenar(plantilla, { siguiente: siguiente.def.nombre });
  }

  error(valor) {
    const r = this.retoAbierto;
    const reto = r.vecino.reto;
    r.modo = 'error';
    reto.erroresSeguidos++;
    this.stats.errores++;
    this.stats.racha = 0;
    this.actualizarHud();

    r.campo.classList.add('mal');
    this.dibujarPanel(valor);
    let banner = this.textos.bannerError;
    if (reto.conHistoria) banner = reto.bannerError || this.textos.bannerErrorTerminos;
    else if (reto.vidaReal) banner = this.textos.bannerErrorVidaReal;
    const ofrece = reto.erroresSeguidos >= PUNTOS.erroresParaPista;
    r.extras.innerHTML = `<div class="banner anim" style="top:74px;background:#b8401a;color:#fff">${banner}</div>
<div class="tarjeta"><span class="px" style="font-size:11px;color:#f2b632">INTENTOS</span><br>${reto.intentos} en este reto${ofrece ? '<br>Ecu te ofrece una pista' : ''}</div>`;

    // la tarjeta de intentos no se pone encima del panel de ejemplo
    if (r.ejemplo && r.ejemplo.abierto) r.extras.querySelectorAll('.tarjeta').forEach((el) => el.remove());

    // RF-08: tras 3 errores seguidos, Ecu ofrece la pista
    if (ofrece) this.mostrarPista();
    else this.textoPregunta(true);
    r.campo.focus();
    r.campo.select();
  }

  pedirPista() {
    const r = this.retoAbierto;
    if (!r || r.modo === 'correcto') return;
    this.mostrarPista();
    // diseño 25: la tarjeta de intentos avisa que la pista se pidió con el botón
    const tarjeta = r.extras.querySelector('.tarjeta');
    if (tarjeta && !tarjeta.dataset.pidio) {
      tarjeta.dataset.pidio = '1';
      tarjeta.insertAdjacentHTML('beforeend', '<br>Pediste una pista');
    }
    r.campo.focus();
  }

  mostrarPista() {
    const r = this.retoAbierto;
    const reto = r.vecino.reto;
    if (!reto.usoPista) {
      // la pista descuenta 50 puntos de este reto (se aplica al acertar)
      reto.usoPista = true;
      this.stats.pistas++;
    }
    r.modo = r.modo === 'error' ? 'error' : 'pista';
    this.hablante(PERSONAJES.ecu);
    const lineas = this.lineasPista(r.vecino).map((l) => `<span>${l}</span>`).join('');
    this.escribir(`<span class="px" style="font-size:14px;color:#2c3e7a">PISTA DE ECU · -${PUNTOS.descuentoPista} PTS</span>${lineas}<span style="font-size:18px;color:#4e1027;font-weight:700">${this.textos.pistaCierre}</span>`);
  }

  // RF-08: orienta el procedimiento según el tipo de ecuación, sin dar el valor de x
  lineasPista(v) {
    const reto = v.reto;
    const ec = reto.ecuacion;
    if (reto.conHistoria && ec.tipo === 'ambos') return this.lineasPistaAmbos(reto);
    if (reto.conHistoria && ec.tipo === 'fracciones') return this.lineasPistaFracciones(reto);
    if (reto.conHistoria && ec.tipo === 'fraccionFraccion') return this.lineasPistaFraccionFraccion(reto);
    if (reto.conHistoria) return ec.tipo === 'parentesis' ? this.lineasPistaParentesis(reto) : this.lineasPistaTerminos(reto);
    const base = { a: formatoNumero(ec.a), b: formatoNumero(ec.b), c: formatoNumero(ec.c ?? ec.d), d: formatoNumero(ec.d) };
    if (reto.vidaReal) {
      const [plantea, orienta] = reto.plantilla.pista.map((l) => rellenar(l, base));
      const primera = reto.ultima === null
        ? plantea
        : `Con tu número: <b>${textoComprobacion(ec, reto.ultima)}</b>, pero debe dar <b>${base.d}</b>.`;
      return [primera, orienta];
    }
    const p = PISTAS[ec.tipo];
    if (reto.ultima === null) return [rellenar(p.sinRespuesta, base), rellenar(p.paso, base)];
    const lado = evaluarIzquierda(ec, reto.ultima);
    const estados = PISTAS.estados[lado < ec.d ? 'liviano' : 'pesado'];
    const val = { ...base, ...estados, r: formatoNumero(reto.ultima), lado: formatoNumero(lado) };
    return [rellenar(p.conRespuesta, val), rellenar(p.paso, val)];
  }

  // Pista de paréntesis: con los números del reto del alumno, nunca da x
  lineasPistaParentesis(reto) {
    const ec = reto.ecuacion;
    const p = PISTAS.parentesis;
    const num = ec.a * ec.b + ec.c;   // número que queda junto a las x al quitar el paréntesis
    const coef = ec.a * ec.k;
    const val = {
      expansion: expandir(ec),
      junta: ec.c ? rellenar(p.junta, { ab: ec.a * ec.b, signo: ec.c < 0 ? '−' : '+', c: Math.abs(ec.c), n: num }) : '',
      n: Math.abs(num),
      como: num > 0 ? 'restando' : 'sumando',
      coefx: `${coef}x`,
      coef,
      d: ec.d
    };
    const lineas = [];
    if (reto.ultima !== null) {
      const lado = evaluarIzquierda(ec, reto.ultima);
      lineas.push(rellenar(p.conRespuesta, { r: formatoNumero(reto.ultima), lado: formatoNumero(lado), d: ec.d, estadoNumero: lado < ec.d ? 'pequeño' : 'grande' }));
    }
    lineas.push(rellenar(p.pasos, val));
    return lineas;
  }

  // Pista de paréntesis en ambos lados (Mundo 3): con los números del reto, nunca da x
  lineasPistaAmbos(reto) {
    const ec = reto.ecuacion;
    const p = PISTAS.ambos;
    const [ladoA, ladoB] = ladosVisibles(ec);
    const a = reducirLado(ladoA);
    const b = reducirLado(ladoB);
    // las x van al lado que tiene más x (así el coeficiente queda positivo)
    const [conX, sinX, lado] = a.A > b.A ? [a, b, 'izquierda'] : [b, a, 'derecha'];
    const xs = (n) => (n === 1 ? 'x' : `${n}x`);
    const restaX = sinX.A === 0 ? xs(conX.A) : `${xs(conX.A)} ${sinX.A < 0 ? '+' : '−'} ${xs(Math.abs(sinX.A))}`;
    const nums = `${formatoNumero(sinX.B)} ${conX.B < 0 ? '+' : '−'} ${Math.abs(conX.B)}`;
    const lineas = [];
    if (reto.ultima !== null) {
      lineas.push(rellenar(p.conRespuesta, { r: formatoNumero(reto.ultima), L: formatoNumero(valorLado(ladoA, reto.ultima)), R: formatoNumero(valorLado(ladoB, reto.ultima)) }));
    }
    lineas.push(rellenar(p.quitar, { expansion: `${quitarParentesis(ladoA)} = ${quitarParentesis(ladoB)}` }));
    lineas.push(rellenar(p.juntar, { lado, xs: restaX, nums, coefx: xs(conX.A - sinX.A) }));
    return lineas;
  }

  // Pista de fracciones y paréntesis (Mundo 4): quitar denominadores, quitar paréntesis y juntar,
  // con los números del reto; nunca da x
  lineasPistaFracciones(reto) {
    const p = PISTAS.fracciones;
    const datos = datosPistaFracciones(reto.ecuacion, reto.ultima);
    const lineas = [];
    if (reto.ultima !== null) lineas.push(rellenar(p.conRespuesta, { r: formatoNumero(reto.ultima), L: formatoNumero(datos.L), R: formatoNumero(datos.R) }));
    lineas.push(rellenar(p.quitar, datos));
    lineas.push(`${datos.mismo ? '' : `${rellenar(p.parentesis, datos)} `}${rellenar(p.juntar, datos)}`);
    return lineas;
  }

  // Pista de fracción sobre fracción (Mundo 5, diseño 505): dividir entre una fracción es multiplicar por
  // la invertida; luego quitar la fracción de x y despejar, con los números del reto. Nunca da x.
  lineasPistaFraccionFraccion(reto) {
    const p = PISTAS.fraccionFraccion;
    const datos = datosPistaFraccionFraccion(reto.ecuacion, reto.ultima);
    const lineas = [];
    if (reto.ultima !== null) lineas.push(rellenar(p.conRespuesta, { r: formatoNumero(reto.ultima), L: datos.L, R: datos.R }));
    for (const linea of p.formas[datos.clave]) lineas.push(rellenar(linea, datos));
    return lineas;
  }

  // Pista de términos semejantes: usa los números del reto del alumno, nunca da x
  lineasPistaTerminos(reto) {
    const ec = reto.ecuacion;
    const p = PISTAS.terminos;
    const nums = ec.ladoX.filter((t) => !t.x);
    const val = {
      juntaX: juntarXTexto(ec),
      coef: ec.a === 1 ? 'x' : `${ec.a}x`,
      numsIzq: nums.length ? nums.map((t, i) => (i === 0 ? (t.c < 0 ? '−' : '') : (t.c < 0 ? ' − ' : ' + ')) + Math.abs(t.c)).join('') : '',
      izq: formatoNumero(valorTerminos(nums, 0)),
      numsDer: ec.otro.map((t) => t.c).join(' + '),
      d: formatoNumero(ec.d),
      a: formatoNumero(ec.a)
    };
    const lineas = [];
    if (reto.ultima !== null) {
      const lado = evaluarIzquierda(ec, reto.ultima);
      lineas.push(rellenar(p.conRespuesta, { ...val, r: formatoNumero(reto.ultima), lado: formatoNumero(lado), estadoNumero: lado < ec.d ? 'pequeño' : 'grande' }));
    }
    if (nums.length) lineas.push(rellenar(ec.otro.length > 1 ? p.numerosDosLados : p.numeros, val));
    else lineas.push(rellenar(p.dividir, val));
    return lineas;
  }

  cerrarReto() {
    const r = this.retoAbierto;
    if (r && r.escritura) r.escritura.terminar();
    this.capaReto.innerHTML = '';
    this.capaFondoReto.innerHTML = '';
    this.retoAbierto = null;
    this.estado = 'explorar';
    mostrar(this.hint, true);
  }

  async continuarTrasAcierto() {
    const v = this.retoAbierto.vecino;
    this.cerrarReto();
    if (this.nivel.mision) {
      // el anfitrión se queda en su lugar: sigue el próximo reto o termina la misión
      const siguiente = this.pendientes()[0];
      if (siguiente) this.abrirReto(siguiente);
      else this.completar();
      return;
    }
    this.estado = 'animacion';
    // Regla de los mapas (src/mundo/reglasMapa.js): un paso atrás hacia su puesto,
    // o, si no hay puesto, unos pasos alejándose y se desvanece
    const { camino, desvanecer } = calcularRetirada(this.mapa.cuadricula, v, this.jugador);
    await v.recorrer(camino, 200);
    if (desvanecer) {
      await v.desvanecer();
    } else {
      this.burbujaGracias(v);
    }
    this.estado = 'explorar';
  }

  // «¡Gracias, [nombre]!» sobre el vecino que ya se apartó
  burbujaGracias(v) {
    const texto = rellenar(DIALOGOS.ayudados.burbuja, { nombre: this.estudiante.nombre });
    const burbuja = crearElemento(this.etiquetas, `<div class="tag" style="font-size:16px;background:#e3f6ea;border-color:#157a4f;color:#0e5a3a">${texto}</div>`);
    // que no se salga de la pantalla (la etiqueta está centrada en x)
    const mitad = (burbuja.offsetWidth || 200) / 2;
    const [bx, by] = this.mapa.aPantalla(v.x, v.yCabeza - 40);
    colocar(burbuja, Math.min(1366 - mitad - 6, Math.max(mitad + 6, bx)), by);
    this.time.delayedCall(2200, () => burbuja.remove());
  }

  // Un vecino ya ayudado responde con agradecimiento o un consejo (sin reto ni puntaje)
  hablarAyudado(v) {
    const frases = DIALOGOS.ayudados.vecinos[v.cfg.personaje] || { gracias: [this.textos.yaAyudado], consejos: [] };
    const siguiente = this.pendientes().find((o) => this.disponible(o)) || this.pendientes()[0];
    const lista = siguiente && frases.consejos.length ? frases.consejos : frases.gracias;
    v.fraseAyudado = ((v.fraseAyudado ?? -1) + 1) % lista.length;
    const html = rellenar(lista[v.fraseAyudado], { nombre: this.estudiante.nombre, siguiente: siguiente ? siguiente.def.nombre : '' });
    this.abrirDialogo(v.def.retrato, v.def.placa || v.def.nombre, html);
  }

  // ------------------------------------------------------------------ fin del nivel
  completar() {
    this.estado = 'fin';
    const tiempoSeg = Math.floor(this.tiempoMs / 1000);
    const s = this.stats;
    const estrellas = calcularEstrellas({ errores: s.errores, pistas: s.pistas, tiempoSeg }, this.nivel.estrellas);
    const resultado = {
      puntaje: s.puntaje, aciertos: s.aciertos, errores: s.errores, intentos: s.intentos,
      pistasUsadas: s.pistas, mejorRacha: s.mejorRacha, bonoRacha: s.bono, tiempoSeg, estrellas
    };
    // RF-12: se guarda de inmediato y se desbloquea el siguiente nivel
    const guardado = almacen.registrarNivelCompletado(this.estudiante.id, this.nivel.id, resultado);
    // mundo abierto: la misión regala un objeto que abre la siguiente (mundos.json → objetos)
    let objetoNuevo = null;
    if (this.nivel.otorga && !almacen.objetosEstudiante(this.estudiante.id).has(this.nivel.otorga)) {
      almacen.agregarObjeto(this.estudiante.id, this.nivel.otorga);
      objetoNuevo = this.nivel.otorga;
    }

    crearElemento(this.capaReto, `<div class="banner anim" style="top:300px;background:#157a4f;font-size:22px">${this.nivel.mision ? '¡MISIÓN CUMPLIDA!' : '¡LLEGASTE A LA META!'}</div>`);
    this.tweens.add({ targets: this.ecu.sprite, y: this.ecu.sprite.y - 24, duration: 180, yoyo: true, repeat: 2 });
    if (this.condor) {
      this.tweens.add({ targets: this.condor, x: this.jugador.x - 44, y: this.jugador.yCabeza - 70, duration: 700, ease: 'Sine.easeInOut' });
    }
    this.time.delayedCall(1300, () => {
      this.scene.start('NivelCompletado', {
        nivel: this.nivel.id,
        resultado,
        guardado,
        objetoNuevo,
        ayudados: [...new Set(this.vecinos.map((v) => v.def.retrato))]
      });
    });
  }

  // ------------------------------------------------------------------ botones del HUD
  pausar() {
    if (this.estado === 'fin' || this.estado === 'pausa') return false;
    this.estadoPrevio = this.estado === 'animacion' ? 'explorar' : this.estado;
    this.estado = 'pausa';
    return true;
  }

  abrirInstrucciones() {
    if (!this.pausar()) return;
    this.scene.launch('Instrucciones', { superpuesta: true, desde: this.scene.key });
    this.scene.pause();
  }

  async reiniciar() {
    if (!this.pausar()) return;
    const si = await confirmar(this.raiz, {
      titulo: '¿REINICIAR EL NIVEL?',
      texto: `Empezarás otra vez el Nivel ${this.nivel.numero} con retos nuevos.`,
      si: 'SÍ, REINICIAR',
      nota: 'Solo se pierde el avance de este intento; tus niveles completados se conservan.'
    });
    if (si) this.scene.restart({ nivel: this.nivel.id });
    else this.estado = this.estadoPrevio;
  }

  async salir() {
    if (!this.pausar()) return;
    const si = await confirmar(this.raiz, {
      titulo: '¿SALIR DEL NIVEL?',
      texto: `Tu avance se guardará automáticamente. Volverás ${this.mundo.textoVolver.replace('VOLVER ', '').toLowerCase()} y podrás continuar desde el Nivel ${this.nivel.numero}.`,
      si: 'SÍ, SALIR',
      nota: 'Si eliges REINICIAR, solo se pierde el avance de este intento; tus niveles completados se conservan.'
    });
    if (si) {
      almacen.registrarReto(this.estudiante.id, this.nivel.id);
      this.scene.start('Zona', { mundo: this.mundo.id, regresoNivel: this.nivel.id });
    } else {
      this.estado = this.estadoPrevio;
    }
  }
}
