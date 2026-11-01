import Phaser from 'phaser';
import { crearPantalla, conectarBotones, confirmar, escribirTexto, rellenar, rutaImagen, escaparHtml } from './ui.js';
import { MapaRPG, Personaje, ControlMovimiento, pasoJugador, estaJunto, crearJugador, CUADRO } from '../mundo/mapaRPG.js';
import { crearElemento, colocarEnMundo, colocarAviso, mostrar, htmlChip, htmlDialogo, cuadroJunto } from '../mundo/interfazRPG.js';
import * as almacen from '../db/almacen.js';
import MUNDOS from '../data/mundos.json';
import NIVELES from '../data/niveles.json';
import PERSONAJES from '../data/personajes.json';
import DIALOGOS from '../data/dialogos.json';

// Zona del mundo (hub) — diseños: diseño/2_mundo1_mercado/11, 11b, 19, 20 y diseño/3_mundo2_terminal/21
// Cada puesto (o bus) es un nivel; la salida (arco con el cóndor) es el reto del mundo.
// En el Mercado el mapa es grande (48×28): la cámara sigue al jugador y la tecla M muestra el mapa completo.
export default class Zona extends Phaser.Scene {
  constructor() {
    super('Zona');
  }

  init(data) {
    this.datos = data || {};
  }

  create() {
    this.estudiante = this.registry.get('estudiante');
    if (!this.estudiante) {
      this.scene.start('Jugador');
      return;
    }
    this.mundo = MUNDOS.mundos.find((m) => m.id === (this.datos.mundo || 1));
    this.mapa = new MapaRPG(this, this.mundo.mapa, this.mundo.bloqueos);
    this.estado = 'explorar';
    this.dialogo = null;

    this.crearDom();
    this.crearPersonajes();
    this.dibujarInsignias();

    this.control = new ControlMovimiento(this);
    this.input.keyboard.on('keydown-SPACE', () => this.accion());
    this.input.keyboard.on('keydown-ENTER', () => this.accion());
    this.input.keyboard.on('keydown-ESC', () => this.cancelar());
    this.input.keyboard.on('keydown-M', () => this.alternarMapa());
    const alReanudar = () => { this.estado = 'explorar'; };
    this.events.on('resume', alReanudar);
    this.events.once('shutdown', () => this.events.off('resume', alReanudar));
  }

  // ------------------------------------------------------------------ DOM
  crearDom() {
    const estrellas = almacen.estrellasDeNiveles(this.estudiante.id, this.nivelesMundo().map((n) => n.id));
    const maximo = this.nivelesMundo().length * 3;
    const botonMapa = this.mundo.mapaCompleto
      ? '<button type="button" class="boton btn" data-accion="mapa">MAPA <span style="font-family:Nunito;font-size:13px;margin-left:6px">(M)</span></button>'
      : '<button type="button" class="boton btn" data-accion="niveles">NIVELES</button>';
    this.raiz = crearPantalla(this, `
<div class="capa-insignias"></div>
<div class="capa-etiquetas"></div>
<div class="hud">${htmlChip(this.estudiante.nombre, `${this.estudiante.personaje || 'p1'}_sprite`)}
<div style="display:flex;flex-direction:column;gap:6px"><span class="px" style="font-size:15px;color:#f2b632">${this.mundo.titulo}</span><span style="font-size:16px;font-weight:800;color:#ffe9b8">${this.mundo.subtitulo}</span></div>
<div style="margin-left:auto;display:flex;gap:10px;align-items:center"><div class="stat"><b>ESTRELLAS</b><span style="color:#f2b632">${estrellas} / ${maximo}</span></div>
${botonMapa}<button type="button" class="boton btn" style="width:48px;padding:0" data-accion="ayuda" aria-label="Instrucciones">?</button><button type="button" class="boton btn" data-accion="salir">SALIR</button></div></div>
<div class="hint">${this.mundo.ayudaZona}</div>
<div class="capa-dialogo"></div>`, { clase: 'rpg' });

    conectarBotones(this.raiz, {
      niveles: () => this.elegirMundo(),
      mapa: () => this.alternarMapa(),
      ayuda: () => this.abrirInstrucciones(),
      salir: () => this.salir()
    });

    const etiquetas = this.raiz.querySelector('.capa-etiquetas');
    this.tagJugador = crearElemento(etiquetas, `<div class="tag yo">${escaparHtml(this.estudiante.nombre)}</div>`);
    this.tagVecino = crearElemento(etiquetas, '<div class="tag" style="font-size:16px"></div>');
    this.bang = crearElemento(etiquetas, '<div class="bang">!</div>');
    this.aviso = crearElemento(etiquetas, '<div class="aviso"><span class="key" style="margin-right:8px">ESPACIO</span><span class="accion">Hablar</span></div>');
    this.hint = this.raiz.querySelector('.hint');
  }

  nivelesMundo() {
    return NIVELES.niveles.filter((n) => n.mundo === this.mundo.id);
  }

  estadoNivel(idNivel) {
    const p = almacen.progresoNivel(this.estudiante.id, idNivel);
    if (p.completado) return { tipo: 'completado', estrellas: p.estrellas };
    if (p.desbloqueado) return { tipo: 'disponible' };
    return { tipo: 'bloqueado' };
  }

  // Primer nivel disponible y sin completar: lleva «¡NUEVO NIVEL!» y el «!»
  nivelActual() {
    return this.mundo.puestos.find((p) => this.estadoNivel(p.nivel).tipo === 'disponible') || null;
  }

  nombreAnfitrion(puesto) {
    return puesto && puesto.anfitrion ? PERSONAJES.vecinos[puesto.anfitrion.personaje].nombre : null;
  }

  // HTML de la insignia de un puesto (completado ★, nuevo, candado, reto de salida)
  htmlInsignia(puesto, i, estilo = '') {
    const estrella = (on) => `<img src="${rutaImagen(on ? 'estrella' : 'estrella_off')}" alt="">`;
    const estado = this.estadoNivel(puesto.nivel);
    const numero = NIVELES.niveles.find((n) => n.id === puesto.nivel).numero;
    if (estado.tipo === 'completado') {
      return `<div class="badge" style="${estilo};background:#157a4f"><span class="n">${numero}</span>${[1, 2, 3].map((k) => estrella(k <= estado.estrellas)).join('')}</div>`;
    }
    if (puesto.esSalida) {
      const disponible = estado.tipo === 'disponible';
      const fondo = disponible ? 'background:#f2b632;color:#1b1430;box-shadow:0 0 0 4px #fff,0 5px 0 4px #1b1430' : 'background:#4e1027;color:#ffe9b8';
      if (this.mundo.insigniasEnMundo) {
        return `<div class="badge" style="${estilo};${fondo}">${disponible ? '' : `<img src="${rutaImagen('candado')}" alt="">`}<span class="n" style="color:${disponible ? '#7a1f3d' : '#fff'}">${numero}</span><span style="font-size:16px">${this.mundo.insignias.salida}</span></div>`;
      }
      return `<div class="badge" style="${estilo};${fondo};flex-direction:column;align-items:flex-start;gap:4px"><span style="display:flex;gap:8px;align-items:center">${disponible ? '' : `<img src="${rutaImagen('candado')}" alt="">`}<span class="n" style="color:${disponible ? '#7a1f3d' : '#f2b632'}">${numero} RETO</span></span><span style="font-size:16px">${this.mundo.insignias.salida}</span></div>`;
    }
    if (estado.tipo === 'disponible' && puesto === this.nivelActual()) {
      return `<div class="badge" style="${estilo};background:#f2b632;color:#1b1430;box-shadow:0 0 0 4px #fff,0 5px 0 4px #1b1430"><span class="n">${numero}</span>${this.mundo.insignias.nuevo}</div>`;
    }
    const anterior = this.nombreAnfitrion(this.mundo.puestos[i - 1]) || `los vecinos del nivel ${numero - 1}`;
    const texto = this.mundo.insignias.textoBloqueo ? `<span style="font-size:16px">Primero ayuda a ${anterior}</span>` : '';
    return `<div class="badge" style="${estilo};background:#4e1027;color:#ffe9b8"><img src="${rutaImagen('candado')}" alt=""><span class="n" style="color:#fff">${numero}</span>${texto}</div>`;
  }

  dibujarInsignias() {
    const capa = this.raiz.querySelector('.capa-insignias');
    if (this.mundo.insigniasEnMundo) {
      // sobre cada puesto, en coordenadas del mundo (se mueven con la cámara)
      capa.innerHTML = this.mundo.puestos.map((p, i) => this.htmlInsignia(p, i, 'transform:translateX(-50%)')).join('');
      this.insignias = [...capa.children].map((el, i) => ({ el, pos: this.mundo.puestos[i].insignia }));
      return;
    }
    capa.innerHTML = this.mundo.puestos.map((p, i) => this.htmlInsignia(p, i, `left:${p.insignia[0]}px;top:${p.insignia[1]}px`)).join('');
    this.insignias = [];
  }

  // ------------------------------------------------------------------ personajes
  // px: posición exacta del dibujo (en cuadros, como en mapa_mercado.json)
  crearVecino(personaje, pos, px) {
    const def = PERSONAJES.vecinos[personaje];
    const p = this.mapa.agregar(new Personaje(this, def.sprite, pos[0], pos[1]));
    if (px) p.colocarEn(px[0] * CUADRO + CUADRO / 2, px[1] * CUADRO + CUADRO);
    p.def = def;
    return p;
  }

  crearPersonajes() {
    this.vecinos = [];
    const etiquetas = this.raiz.querySelector('.capa-etiquetas');
    for (const puesto of this.mundo.puestos) {
      if (!puesto.anfitrion) continue;
      const p = this.crearVecino(puesto.anfitrion.personaje, puesto.anfitrion.pos, puesto.anfitrion.px);
      p.puesto = puesto;
      this.vecinos.push(p);
    }
    for (const amb of this.mundo.ambientales || []) {
      const p = this.crearVecino(amb.personaje, amb.pos, amb.px);
      p.dialogo = amb.dialogo;
      // consejeros: «?» azul (diseño 20)
      if (amb.consejo) p.pregunta = crearElemento(etiquetas, '<div class="bang consejo">?</div>');
      this.vecinos.push(p);
    }
    if (this.mundo.condor) {
      const [cx, cy] = this.mundo.condorPos || [1221, 196];
      this.add.image(cx, cy, 'condor_posado').setOrigin(0, 0).setDisplaySize(88, 64).setDepth(300);
    }

    const regreso = this.mundo.puestos.find((p) => p.nivel === this.datos.regresoNivel);
    const [c, r] = regreso ? regreso.regreso : this.mundo.inicio;
    this.jugador = this.mapa.agregar(crearJugador(this, c, r));
    const [ec, er] = regreso ? cuadroJunto(this.mapa, c, r) : this.mundo.ecu;
    this.ecu = this.mapa.agregar(new Personaje(this, 'sprite_ecu', ec, er, { bloquea: false, pies: 0.92 }));
    this.mapa.seguir(this.jugador);
  }

  // ------------------------------------------------------------------ ciclo
  update() {
    if (!this.jugador) return;
    if (this.estado === 'explorar') {
      const dir = this.control.direccion();
      if (dir) pasoJugador(this.mapa, this.jugador, this.ecu, dir);
    }
    this.actualizarEtiquetas();
  }

  actualizarEtiquetas() {
    const j = this.jugador;
    const m = this.mapa;
    colocarEnMundo(m, this.tagJugador, j.x, j.yCabeza - 38);
    for (const { el, pos } of this.insignias) colocarEnMundo(m, el, pos[0], pos[1]);
    for (const v of this.vecinos) if (v.pregunta) colocarEnMundo(m, v.pregunta, v.x, v.yCabeza - 40);

    const actual = this.nivelActual();
    const anfitrion = actual && this.vecinos.find((v) => v.puesto === actual);
    mostrar(this.bang, !!anfitrion);
    mostrar(this.tagVecino, !!anfitrion);
    if (anfitrion) {
      colocarEnMundo(m, this.bang, anfitrion.x, anfitrion.yCabeza - 40);
      this.tagVecino.textContent = anfitrion.def.etiqueta || anfitrion.def.nombre;
      colocarEnMundo(m, this.tagVecino, anfitrion.x, anfitrion.yPiesActual + 6);
    }

    const objetivo = this.estado === 'explorar' && !j.moviendo ? this.buscarObjetivo() : null;
    mostrar(this.aviso, !!objetivo);
    if (objetivo) {
      this.aviso.querySelector('.accion').textContent = objetivo.vecino ? 'Hablar' : 'Mirar';
      colocarAviso(this.aviso, j, m);
    }
  }

  // Vecino (que hable) o puesto junto al jugador
  buscarObjetivo() {
    const j = this.jugador;
    const vecino = this.vecinos.find((v) => (v.puesto || v.dialogo) && estaJunto(j, v.c, v.r));
    if (vecino) return { vecino, puesto: vecino.puesto };
    const puesto = this.mundo.puestos.find((p) => p.zona.some(([c, r]) => estaJunto(j, c, r)));
    return puesto ? { puesto } : null;
  }

  // ------------------------------------------------------------------ interacción
  accion() {
    if (this.estado === 'mapa') return;
    if (this.estado === 'dialogo') {
      if (!this.dialogo.escritura.terminado) {
        this.dialogo.escritura.terminar();
        return;
      }
      const alAceptar = this.dialogo.alAceptar;
      this.cerrarDialogo();
      if (alAceptar) alAceptar();
      return;
    }
    if (this.estado !== 'explorar' || this.jugador.moviendo) return;
    const objetivo = this.buscarObjetivo();
    if (!objetivo) return;
    const nombre = this.estudiante.nombre;

    if (objetivo.vecino && !objetivo.puesto) {
      const v = objetivo.vecino;
      this.abrirDialogo(v.def.retrato, v.def.placa || v.def.nombre, rellenar(v.dialogo, { nombre }));
      return;
    }

    const puesto = objetivo.puesto;
    const nivel = NIVELES.niveles.find((n) => n.id === puesto.nivel);
    const estado = this.estadoNivel(nivel.id);
    const hablante = objetivo.vecino ? objetivo.vecino.def : (puesto.anfitrion ? PERSONAJES.vecinos[puesto.anfitrion.personaje] : PERSONAJES.ecu);
    const empezar = () => this.empezarNivel(nivel.id);

    if (estado.tipo === 'bloqueado') {
      // diseño 19: Ecu explica qué falta, con el chip «Nivel N bloqueado»
      const i = this.mundo.puestos.indexOf(puesto);
      const previo = this.mundo.puestos[i - 1];
      const anterior = this.nombreAnfitrion(previo) || (previo && previo.quien) || `los vecinos del nivel ${nivel.numero - 1}`;
      const textos = { ...DIALOGOS.zona, ...(this.mundo.textosZona || {}) };
      const texto = puesto.esSalida
        ? rellenar(DIALOGOS.zona.bloqueadoSalida, { nombre })
        : rellenar(previo && previo.color ? textos.bloqueadoDetalle : textos.bloqueado, { nombre, anterior, color: previo && previo.color, n: nivel.numero, previo: nivel.numero - 1 });
      this.abrirDialogo(PERSONAJES.ecu.retrato, 'ECU', texto, null, `<img src="${rutaImagen('candado')}" alt="" style="width:24px;image-rendering:pixelated">Nivel ${nivel.numero} bloqueado`);
    } else if (estado.tipo === 'completado') {
      this.abrirDialogo(hablante.retrato, hablante.placa || hablante.nombre, rellenar(DIALOGOS.zona.repetir, { nombre, n: nivel.numero }), empezar);
    } else {
      this.abrirDialogo(hablante.retrato, hablante.placa || hablante.nombre, rellenar(puesto.invitacion, { nombre }), empezar);
    }
  }

  abrirDialogo(retrato, nombre, html, alAceptar = null, bloqueo = null) {
    this.estado = 'dialogo';
    mostrar(this.hint, false);
    const capa = this.raiz.querySelector('.capa-dialogo');
    let lateral = `<span class="px seguir">${DIALOGOS.zona.continuar}</span>`;
    if (alAceptar) lateral = `<span class="px seguir">${DIALOGOS.zona.empezar}</span><span class="px seguir" style="color:#4e1027">${DIALOGOS.zona.cancelar}</span>`;
    if (bloqueo) lateral = `<span class="chip-bloqueo">${bloqueo}</span><span class="px seguir" style="align-self:flex-end">ESPACIO ▼</span>`;
    const caja = crearElemento(capa, htmlDialogo({ retrato, nombre, lateral }));
    if (bloqueo) caja.querySelector('.resp').classList.add('resp-bloqueo');
    caja.addEventListener('click', () => this.accion());
    const parrafos = html.split('<br><br>').map((p) => `<span>${p}</span>`).join('');
    const escritura = escribirTexto(this, caja.querySelector('.txt'), parrafos);
    this.dialogo = { caja, escritura, alAceptar };
  }

  cerrarDialogo() {
    if (!this.dialogo) return;
    this.dialogo.escritura.terminar();
    this.dialogo.caja.remove();
    this.dialogo = null;
    this.estado = 'explorar';
    mostrar(this.hint, true);
  }

  cancelar() {
    if (this.estado === 'dialogo') this.cerrarDialogo();
    else if (this.estado === 'mapa') this.alternarMapa();
  }

  empezarNivel(idNivel) {
    almacen.marcarJuego(this.estudiante.id);
    this.scene.start('Nivel', { nivel: idNivel });
  }

  // ------------------------------------------------------------------ mapa completo (tecla M, diseño 11b)
  alternarMapa() {
    const cfg = this.mundo.mapaCompleto;
    if (!cfg) return;
    if (this.estado === 'mapa') {
      this.capaMapa.remove();
      this.capaMapa = null;
      this.estado = 'explorar';
      return;
    }
    if (this.estado !== 'explorar') return;
    this.estado = 'mapa';
    const s = 1186 / this.mapa.ancho;          // escala del mapa en pantalla
    const X = (c) => c * CUADRO * s;
    const sprite = (clave, cx, piesY) => `<img src="${rutaImagen(clave)}" alt="" style="position:absolute;left:${X(cx) - 32 * s}px;top:${piesY * CUADRO * s - 88 * s}px;width:${64 * s}px;image-rendering:pixelated">`;
    const personas = this.vecinos.map((v) => sprite(v.def.sprite, v.x / CUADRO, v.yPiesActual / CUADRO)).join('');
    const j = this.jugador;
    const etiquetas = cfg.etiquetas.map(([t, c, r]) => `<span class="etiqueta-mapa" style="left:${X(c)}px;top:${X(r)}px">${t}</span>`).join('');
    const insignias = this.mundo.puestos.map((p, i) => this.htmlInsignia(p, i, `left:${p.insignia[0] * s}px;top:${p.insignia[1] * s - 6}px;transform:translateX(-50%) scale(.82);transform-origin:top center`)).join('');
    const cartel = cfg.cartel ? `<span class="cartel-mapa px" style="left:${X(cfg.cartel[1])}px;top:${X(cfg.cartel[2])}px">${cfg.cartel[0]}</span>` : '';
    this.capaMapa = crearElemento(this.raiz, `<div class="capa-mapa">
<div class="mapa-cabecera"><span class="px" style="font-size:18px;color:#f2b632">${cfg.titulo}</span><span style="font-size:16px;font-weight:800;color:#fff">${cfg.subtitulo}</span>
<button type="button" class="boton btn" data-m="mundos" style="margin-left:auto">OTRO MUNDO</button><button type="button" class="boton btn" data-m="cerrar">CERRAR <span style="font-family:Nunito;font-size:13px;margin-left:6px">(M)</span></button></div>
<div class="mapa-marco"><img src="${rutaImagen(this.mapa.imagen.texture.key)}" alt="${cfg.titulo}" style="width:1186px;image-rendering:pixelated">
${cartel}
${personas}${sprite(`${this.estudiante.personaje || 'p1'}_sprite`, j.x / CUADRO, j.yPiesActual / CUADRO)}
<span class="tag yo" style="left:${X(j.x / CUADRO)}px;top:${j.yPiesActual * s + 4}px;font-size:15px">Tú</span>
${etiquetas}${insignias}</div></div>`);
    this.capaMapa.querySelector('[data-m="cerrar"]').addEventListener('click', () => this.alternarMapa());
    this.capaMapa.querySelector('[data-m="mundos"]').addEventListener('click', () => { this.alternarMapa(); this.elegirMundo(); });
  }

  // Elegir mundo. Un mundo se abre cuando su primer nivel está desbloqueado.
  elegirMundo() {
    if (this.estado !== 'explorar') return;
    this.estado = 'pausa';
    const capa = document.createElement('div');
    capa.style.cssText = 'position:absolute;inset:0;z-index:50;pointer-events:auto';
    const filas = MUNDOS.mundos.map((m) => {
      const ids = NIVELES.niveles.filter((n) => n.mundo === m.id).map((n) => n.id);
      const abierto = ids.length && almacen.progresoNivel(this.estudiante.id, ids[0]).desbloqueado;
      const estrellas = almacen.estrellasDeNiveles(this.estudiante.id, ids);
      const actual = m.id === this.mundo.id;
      return `<button type="button" class="boton btn ${actual ? 'oro' : ''}" data-mundo="${m.id}" ${abierto ? '' : 'disabled'} style="height:64px;justify-content:space-between;font-size:14px;padding:0 20px">
<span>${abierto ? '' : `<img src="${rutaImagen('candado')}" alt="" style="width:22px;vertical-align:middle;margin-right:8px;image-rendering:pixelated">`}${m.titulo}</span><span>★ ${estrellas} / ${ids.length * 3}</span></button>`;
    }).join('');
    capa.innerHTML = `<div style="position:absolute;inset:0;background:rgba(27,20,48,.72)"></div>
<section style="position:absolute;left:333px;top:150px;width:700px;padding:30px 36px;display:flex;flex-direction:column;gap:16px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0 0 6px;text-align:center;font-size:22px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¿A QUÉ MUNDO VAMOS?</h1>
${filas}
<button type="button" class="boton btn" data-mundo="cerrar" style="height:52px;background:#4e1027;margin-top:6px">CANCELAR</button></section>`;
    this.raiz.appendChild(capa);
    const cerrar = () => {
      document.removeEventListener('keydown', teclas, true);
      capa.remove();
      this.estado = 'explorar';
    };
    const teclas = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cerrar(); } };
    document.addEventListener('keydown', teclas, true);
    capa.addEventListener('click', (e) => {
      const boton = e.target.closest('[data-mundo]');
      if (!boton || boton.disabled) return;
      if (boton.dataset.mundo === 'cerrar') return cerrar();
      const id = Number(boton.dataset.mundo);
      cerrar();
      if (id !== this.mundo.id) this.scene.start('Zona', { mundo: id });
    });
  }

  abrirInstrucciones() {
    if (this.estado !== 'explorar') return;
    this.estado = 'pausa';
    this.scene.launch('Instrucciones', { superpuesta: true, desde: this.scene.key });
    this.scene.pause();
  }

  async salir() {
    if (this.estado !== 'explorar') return;
    this.estado = 'pausa';
    const si = await confirmar(this.raiz, {
      titulo: `¿SALIR DEL ${this.mundo.nombreCorto.toUpperCase()}?`.replace('DEL TERMINAL', 'DE LA TERMINAL'),
      texto: 'Tu avance ya está guardado. Volverás al menú principal y podrás continuar cuando quieras.',
      si: 'SÍ, SALIR'
    });
    if (si) {
      almacen.marcarJuego(this.estudiante.id);
      this.scene.start('Inicio');
    } else {
      this.estado = 'explorar';
    }
  }
}
