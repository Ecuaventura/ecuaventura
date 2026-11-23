import Phaser from 'phaser';
import { crearPantalla, conectarBotones, confirmar, escribirTexto, rellenar, rutaImagen, escaparHtml } from './ui.js';
import { MapaRPG, Personaje, ControlMovimiento, pasoJugador, estaJunto, crearJugador, CUADRO, centroX } from '../mundo/mapaRPG.js';
import { crearElemento, colocarEnMundo, colocarAviso, mostrar, htmlChip, htmlDialogo, cuadroJunto, apartarAyuda } from '../mundo/interfazRPG.js';
import { htmlHudAbierto, htmlObjetos, htmlInsigniaMision, htmlMapaAbierto, htmlObjetoEncontrado, htmlChipBloqueo, tituloArea, textoMision, objetoDe } from '../mundo/mundoAbierto.js';
import * as almacen from '../db/almacen.js';
import MUNDOS from '../data/mundos.json';
import NIVELES from '../data/niveles.json';
import PERSONAJES from '../data/personajes.json';
import DIALOGOS from '../data/dialogos.json';

// Zona del mundo (hub) — diseños: diseño/2_mundo1_mercado/11, 11b, 19, 20 y diseño/3_mundo2_terminal/21
// Cada puesto (o bus) es un nivel; la salida (arco con el cóndor) es el reto del mundo.
// En el Mercado el mapa es grande (48×28): la cámara sigue al jugador y la tecla M muestra el mapa completo.
// Mundo abierto (Puerto y Construcción, mundos.json → mundoAbierto; diseños diseño/4_mundo3_puerto/301–307
// y diseño/5_mundo4_construccion/401–410): el mapa (80×48) tiene lugares (cueva, almacén, taller, túnel) a
// los que se entra por puertas, objetos que abren misiones y un inventario en el HUD. Cada misión es un
// nivel; su anfitrión puede estar adentro de un lugar.
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
    this.abierto = !!this.mundo.mundoAbierto;
    // lugar: 'puerto' (el mapa del mundo) o uno de mundos.json → lugares (cueva, almacén)
    const regreso = this.mundo.puestos.find((p) => p.nivel === this.datos.regresoNivel);
    this.lugar = this.datos.lugar || (regreso && regreso.lugar) || 'puerto';
    this.defLugar = this.lugar === 'puerto' ? null : this.mundo.lugares[this.lugar];
    this.objetos = this.abierto ? almacen.objetosEstudiante(this.estudiante.id) : new Set();
    this.mapa = this.defLugar ? new MapaRPG(this, this.defLugar.mapa) : new MapaRPG(this, this.mundo.mapa, this.mundo.bloqueos);
    this.estado = 'explorar';
    this.dialogo = null;

    this.crearDom();
    this.crearPersonajes();
    this.crearObjetoSuelto();
    this.dibujarInsignias();

    this.control = new ControlMovimiento(this);
    this.input.keyboard.on('keydown-SPACE', () => this.accion());
    this.input.keyboard.on('keydown-ENTER', () => this.accion());
    this.input.keyboard.on('keydown-ESC', () => this.cancelar());
    this.input.keyboard.on('keydown-M', () => this.alternarMapa());
    const alReanudar = () => { this.estado = 'explorar'; };
    this.events.on('resume', alReanudar);
    this.events.once('shutdown', () => this.events.off('resume', alReanudar));
    // volviendo de una misión que regaló un objeto (diseño 304)
    const nuevo = this.abierto && this.datos.objetoNuevo && objetoDe(this.mundo, this.datos.objetoNuevo);
    if (nuevo) this.time.delayedCall(200, () => this.mostrarObjeto(nuevo));
    // desde el final del juego (botón NIVELES): se abre el selector de mundos
    if (this.datos.elegirMundo) this.time.delayedCall(100, () => this.elegirMundo());
  }

  // ------------------------------------------------------------------ DOM
  crearDom() {
    const estrellas = almacen.estrellasDeNiveles(this.estudiante.id, this.nivelesMundo().map((n) => n.id));
    const maximo = this.nivelesMundo().length * 3;
    const botonMapa = this.mundo.mapaCompleto
      ? '<button type="button" class="boton btn" data-accion="mapa">MAPA <span style="font-family:Nunito;font-size:13px;margin-left:6px">(M)</span></button>'
      : '<button type="button" class="boton btn" data-accion="niveles">NIVELES</button>';
    const chip = htmlChip(this.estudiante.nombre, `${this.estudiante.personaje || 'p1'}_sprite`);
    const hud = this.abierto
      ? htmlHudAbierto({ mundo: this.mundo, titulo: this.defLugar ? this.defLugar.titulo : this.mundo.titulo, chip, estrellas, maximo, mision: textoMision(this.mundo, (p) => this.estadoNivel(p.nivel)), objetos: this.objetos })
      : `<div class="hud">${chip}
<div style="display:flex;flex-direction:column;gap:6px"><span class="px" style="font-size:15px;color:#f2b632">${this.mundo.titulo}</span><span style="font-size:16px;font-weight:800;color:#ffe9b8">${this.mundo.subtitulo}</span></div>
<div style="margin-left:auto;display:flex;gap:10px;align-items:center"><div class="stat"><b>ESTRELLAS</b><span style="color:#f2b632">${estrellas} / ${maximo}</span></div>
${botonMapa}<button type="button" class="boton btn" style="width:48px;padding:0" data-accion="ayuda" aria-label="Instrucciones">?</button><button type="button" class="boton btn" data-accion="salir">SALIR</button></div></div>`;
    // cueva oscura: con la linterna se ve alrededor del jugador (diseño 309)
    const oscuridad = this.defLugar && this.defLugar.oscuro ? '<div class="oscuridad"></div>' : '';
    this.raiz = crearPantalla(this, `${oscuridad}
<div class="capa-insignias"></div>
<div class="capa-etiquetas"></div>
${hud}
<div class="hint">${this.defLugar ? this.defLugar.ayuda : this.mundo.ayudaZona}</div>
<div class="capa-dialogo"></div>`, { clase: 'rpg' });
    this.oscuridad = this.raiz.querySelector('.oscuridad');
    if (this.oscuridad) this.dibujarContornos();

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

  // Lugar oscuro (cueva): un contorno claro marca el borde de cada pared o roca que choca, para
  // que se distinga aunque la oscuridad no deje ver el dibujo. Va encima de la capa oscura.
  dibujarContornos() {
    const m = this.mapa;
    const lineas = [];
    for (let r = 0; r < m.filas; r++) {
      for (let c = 0; c < m.columnas; c++) {
        if (m.esSolido(c, r)) continue;
        const [x, y] = m.aPantalla(c * CUADRO + m.desfaseX, r * CUADRO);
        const borde = (dc, dr, x1, y1, x2, y2) => {
          if (m.esSolido(c + dc, r + dr)) lineas.push(`M${x + x1} ${y + y1}L${x + x2} ${y + y2}`);
        };
        borde(0, -1, 0, 0, CUADRO, 0);
        borde(0, 1, 0, CUADRO, CUADRO, CUADRO);
        borde(-1, 0, 0, 0, 0, CUADRO);
        borde(1, 0, CUADRO, 0, CUADRO, CUADRO);
      }
    }
    const svg = `<svg class="contornos" width="1366" height="768" viewBox="0 0 1366 768" style="position:absolute;left:0;top:0;pointer-events:none">
<path d="${lineas.join('')}" fill="none" stroke="#1b1430" stroke-width="5" stroke-linecap="square" opacity=".55"/>
<path d="${lineas.join('')}" fill="none" stroke="#ffe2a8" stroke-width="2" stroke-linecap="square" opacity=".7"/></svg>`;
    this.oscuridad.insertAdjacentHTML('afterend', svg);
  }

  nivelesMundo() {
    return NIVELES.niveles.filter((n) => n.mundo === this.mundo.id);
  }

  estadoNivel(idNivel) {
    const p = almacen.progresoNivel(this.estudiante.id, idNivel);
    if (p.completado) return { tipo: 'completado', estrellas: p.estrellas };
    // mundo abierto: además hace falta el objeto que pide la misión
    const puesto = this.mundo.puestos.find((x) => x.nivel === idNivel);
    const falta = puesto && puesto.requiere && !this.objetos.has(puesto.requiere) ? puesto.requiere : null;
    if (p.desbloqueado && !falta) return { tipo: 'disponible' };
    return { tipo: 'bloqueado', falta };
  }

  // Misiones (puestos) que están en el lugar actual
  puestosLugar() {
    return this.mundo.puestos.filter((p) => (p.lugar || 'puerto') === this.lugar);
  }

  // Un mismo anfitrión puede tener varias misiones (Don Pancho: muelle oeste y muelle este):
  // aparece en la primera que le falta, o en la última si ya cumplió todas
  esPuestoActivo(puesto) {
    const suyos = this.mundo.puestos.filter((p) => p.anfitrion && p.anfitrion.personaje === puesto.anfitrion.personaje);
    if (suyos.length === 1) return true;
    return (suyos.find((p) => this.estadoNivel(p.nivel).tipo !== 'completado') || suyos[suyos.length - 1]) === puesto;
  }

  actualizarHudAbierto() {
    if (!this.abierto) return;
    this.raiz.querySelector('.hud-mision').textContent = textoMision(this.mundo, (p) => this.estadoNivel(p.nivel));
    this.raiz.querySelector('.hud-objetos').innerHTML = htmlObjetos(this.mundo, this.objetos);
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
    if (this.abierto) {
      const actual = this.nivelActual();
      const puestos = this.puestosLugar().filter((p) => p.insignia);
      capa.innerHTML = puestos.map((p) => htmlInsigniaMision(p, this.estadoNivel(p.nivel), p === actual, 'transform:translateX(-50%)')).join('');
      this.insignias = [...capa.children].map((el, i) => ({ el, pos: puestos[i].insignia }));
      return;
    }
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
    if (px) p.colocarEn(px[0] * CUADRO + CUADRO / 2 + this.mapa.desfaseX, px[1] * CUADRO + CUADRO);
    // el cofre de la cueva ya está pintado en el fondo: solo cuenta su cuadro
    if (def.invisible) p.sprite.setVisible(false);
    p.def = def;
    return p;
  }

  crearPersonajes() {
    this.vecinos = [];
    const etiquetas = this.raiz.querySelector('.capa-etiquetas');
    for (const puesto of this.puestosLugar()) {
      if (!puesto.anfitrion || !this.esPuestoActivo(puesto)) continue;
      const p = this.crearVecino(puesto.anfitrion.personaje, puesto.anfitrion.pos, puesto.anfitrion.px);
      p.puesto = puesto;
      this.vecinos.push(p);
    }
    for (const amb of this.mundo.ambientales || []) {
      if ((amb.lugar || 'puerto') !== this.lugar) continue;
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

    // de dónde llega: de un nivel (su cuadro de regreso), saliendo de un lugar (frente a su puerta),
    // entrando a un lugar (su inicio) o al mundo (inicio del mundo)
    const regreso = this.puestosLugar().find((p) => p.nivel === this.datos.regresoNivel);
    const desde = this.datos.desde && this.mundo.lugares[this.datos.desde];
    let inicio = this.mundo.inicio, ecu = this.mundo.ecu;
    if (regreso) [inicio, ecu] = [regreso.regreso, null];
    else if (desde && !this.defLugar) [inicio, ecu] = [desde.volverA, null];
    else if (this.defLugar) [inicio, ecu] = [this.defLugar.inicio, this.defLugar.ecu];
    const [c, r] = inicio;
    this.jugador = this.mapa.agregar(crearJugador(this, c, r));
    if (desde && !this.defLugar) this.jugador.mirar('abajo');
    else if (this.defLugar && !regreso) this.jugador.mirar('arriba');
    const [ec, er] = ecu || cuadroJunto(this.mapa, c, r);
    this.ecu = this.mapa.agregar(new Personaje(this, 'sprite_ecu', ec, er, { bloquea: false, pies: 0.92 }));
    this.mapa.seguir(this.jugador);
  }

  // Objeto que brilla en el suelo (el remo aparece en la playa después de la misión 11)
  crearObjetoSuelto() {
    this.objetoSuelto = null;
    if (!this.abierto || this.defLugar) return;
    const o = (this.mundo.objetos || []).find((x) => x.pos && !this.objetos.has(x.clave) &&
      (!x.apareceTras || this.estadoNivel(x.apareceTras).tipo === 'completado'));
    if (!o) return;
    const [c, r] = o.pos;
    const y = (r + 0.5) * CUADRO;
    const brillo = this.add.circle(centroX(c), y, 30, 0xf2b632, 0.35).setDepth(y - 1);
    const img = this.add.image(centroX(c), y, o.imagen).setDisplaySize(60, 60).setDepth(y);
    this.tweens.add({ targets: brillo, scale: 1.5, alpha: 0.05, duration: 700, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: img, y: y - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.objetoSuelto = { ...o, img, brillo };
  }

  recogerObjeto() {
    const o = this.objetoSuelto;
    if (!o) return;
    this.objetoSuelto = null;
    o.img.destroy();
    o.brillo.destroy();
    almacen.agregarObjeto(this.estudiante.id, o.clave);
    this.objetos.add(o.clave);
    this.mostrarObjeto(o);
  }

  // Ventana «¡ENCONTRASTE UN OBJETO!» (diseño 304); al cerrarla se actualizan HUD e insignias
  mostrarObjeto(objeto) {
    this.estado = 'objeto';
    mostrar(this.hint, false);
    this.actualizarHudAbierto();
    this.dibujarInsignias();
    this.capaObjeto = crearElemento(this.raiz, htmlObjetoEncontrado(objeto, objeto.desbloquea));
    this.capaObjeto.querySelector('[data-objeto="cerrar"]').addEventListener('click', () => this.cerrarObjeto());
  }

  cerrarObjeto() {
    if (!this.capaObjeto) return;
    this.capaObjeto.remove();
    this.capaObjeto = null;
    this.estado = 'explorar';
    mostrar(this.hint, true);
  }

  // Al pisar un cuadro: salir de un lugar o recoger un objeto
  alPisar(c, r) {
    if (this.defLugar && this.defLugar.salidas.some(([x, y]) => x === c && y === r)) {
      this.estado = 'pausa';
      this.scene.start('Zona', { mundo: this.mundo.id, lugar: 'puerto', desde: this.lugar });
      return;
    }
    const o = this.objetoSuelto;
    if (o && o.pos[0] === c && o.pos[1] === r) this.recogerObjeto();
  }

  // ------------------------------------------------------------------ ciclo
  update() {
    if (!this.jugador) return;
    if (this.estado === 'explorar') {
      const dir = this.control.direccion();
      if (dir) pasoJugador(this.mapa, this.jugador, this.ecu, dir, (c, r) => this.alPisar(c, r));
    }
    this.mapa.ordenarProfundidad();
    this.actualizarEtiquetas();
    apartarAyuda(this.hint, this.mapa, this.mapa.personajes);
    this.actualizarTituloArea();
    if (this.oscuridad) {
      const [x, y] = this.mapa.aPantalla(this.jugador.x, this.jugador.yPiesActual - 40);
      this.oscuridad.style.background = `radial-gradient(circle at ${Math.round(x)}px ${Math.round(y)}px, rgba(10,6,20,0) 0, rgba(10,6,20,0) 190px, rgba(10,6,20,.66) 360px)`;
    }
  }

  actualizarTituloArea() {
    if (!this.abierto || this.defLugar || !this.mundo.areas) return;
    const titulo = tituloArea(this.mundo, this.jugador.c, this.jugador.r);
    if (titulo === this.tituloActual) return;
    this.tituloActual = titulo;
    this.raiz.querySelector('.hud-titulo').textContent = titulo;
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
      const texto = objetivo.vecino ? 'Hablar' : objetivo.puerta ? objetivo.puerta.accion || 'Entrar' : objetivo.objeto ? 'Recoger' : 'Mirar';
      this.aviso.querySelector('.accion').textContent = texto;
      colocarAviso(this.aviso, j, m);
    }
  }

  // Vecino (que hable) o puesto junto al jugador
  buscarObjetivo() {
    const j = this.jugador;
    const vecino = this.vecinos.find((v) => (v.puesto || v.dialogo) && estaJunto(j, v.c, v.r));
    if (vecino) return { vecino, puesto: vecino.puesto };
    if (this.objetoSuelto && estaJunto(j, ...this.objetoSuelto.pos)) return { objeto: this.objetoSuelto };
    if (!this.defLugar) {
      const puerta = (this.mundo.puertas || []).find((p) => estaJunto(j, ...p.pos));
      if (puerta) return { puerta };
    }
    const puesto = this.puestosLugar().find((p) => p.zona.some(([c, r]) => estaJunto(j, c, r)));
    return puesto ? { puesto } : null;
  }

  // Puerta de una casa o cueva: entrar, o Ecu explica qué falta (diseño 306)
  usarPuerta(puerta) {
    const nombre = this.estudiante.nombre;
    if (!puerta.lugar) {
      this.abrirDialogo(PERSONAJES.ecu.retrato, 'ECU', rellenar(puerta.texto, { nombre }));
      return;
    }
    if (puerta.requiere && !this.objetos.has(puerta.requiere)) {
      // habla Ecu, o el personaje que cuida la puerta (Don Tomás en el túnel, diseño 409)
      const quien = puerta.habla ? PERSONAJES.vecinos[puerta.habla] : null;
      this.abrirDialogo(quien ? quien.retrato : PERSONAJES.ecu.retrato, quien ? quien.placa : 'ECU', rellenar(puerta.bloqueo, { nombre }), null,
        htmlChipBloqueo(this.mundo, puerta.requiere, 'Bloqueado'));
      return;
    }
    almacen.marcarJuego(this.estudiante.id);
    this.estado = 'pausa';
    this.scene.start('Zona', { mundo: this.mundo.id, lugar: puerta.lugar });
  }

  // ------------------------------------------------------------------ interacción
  accion() {
    if (this.estado === 'mapa') return;
    if (this.estado === 'objeto') {
      this.cerrarObjeto();
      return;
    }
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
    if (objetivo.objeto) {
      this.recogerObjeto();
      return;
    }
    if (objetivo.puerta) {
      this.usarPuerta(objetivo.puerta);
      return;
    }

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

    if (estado.tipo === 'bloqueado' && this.abierto) {
      // mundo abierto (diseño 306): falta el objeto de la misión o la misión anterior
      const texto = estado.falta ? puesto.bloqueo : this.mundo.textosZona.bloqueadoMision;
      this.abrirDialogo(PERSONAJES.ecu.retrato, 'ECU', rellenar(texto, { nombre, previo: nivel.numero - 1 }), null,
        htmlChipBloqueo(this.mundo, estado.falta, `Misión ${nivel.numero} bloqueada`));
    } else if (estado.tipo === 'bloqueado') {
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
    if (this.estado === 'objeto') this.cerrarObjeto();
    else if (this.estado === 'dialogo') this.cerrarDialogo();
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
    if (this.abierto) {
      this.abrirMapaAbierto();
      return;
    }
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

  // Mapa del mundo abierto con las misiones y su estado (diseño 301). Dentro de un lugar, «Tú» va en su puerta.
  abrirMapaAbierto() {
    const j = this.jugador;
    const tu = this.defLugar ? [this.defLugar.volverA[0], this.defLugar.volverA[1] - 1] : [j.c, j.r];
    const objetoSuelto = this.objetoSuelto || (this.mundo.objetos || []).find((x) => x.pos && !this.objetos.has(x.clave) &&
      (!x.apareceTras || this.estadoNivel(x.apareceTras).tipo === 'completado'));
    this.capaMapa = crearElemento(this.raiz, htmlMapaAbierto({
      mundo: this.mundo, estado: (p) => this.estadoNivel(p.nivel), actual: this.nivelActual(), tu, objetoSuelto
    }));
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
      titulo: this.mundo.tituloSalir || `¿SALIR DEL ${this.mundo.nombreCorto.toUpperCase()}?`.replace('DEL TERMINAL', 'DE LA TERMINAL'),
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
