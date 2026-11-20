import Phaser from 'phaser';
import { crearPantalla, conectarBotones, rellenar, rutaImagen } from './ui.js';
import { MapaRPG, Personaje, CUADRO } from '../mundo/mapaRPG.js';
import { consejoEstrella, formatoTiempo } from '../logic/puntaje.js';
import NIVELES from '../data/niveles.json';
import MUNDOS from '../data/mundos.json';
import PERSONAJES from '../data/personajes.json';

// Pantalla de nivel completado — diseños: diseno/html/mundo1/17 y diseno/html/mundo2/27
export default class NivelCompletado extends Phaser.Scene {
  constructor() {
    super('NivelCompletado');
  }

  init(data) {
    this.datos = data;
  }

  create() {
    const { resultado: res, guardado } = this.datos;
    const estudiante = this.registry.get('estudiante');
    const nivel = NIVELES.niveles.find((n) => n.id === this.datos.nivel);
    const mundo = MUNDOS.mundos.find((m) => m.id === nivel.mundo);
    const siguiente = NIVELES.niveles.find((n) => n.id === nivel.id + 1 && n.mundo === nivel.mundo);
    dibujarFondoZona(this, mundo);

    const estrella = (on, ancho) => `<img src="${rutaImagen(on ? 'estrella' : 'estrella_off')}" alt="" style="width:${ancho}px;image-rendering:pixelated">`;
    const dato = (titulo, valor, color) => `<div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px;background:#fff8ec;color:#1b1430;border:3px solid #1b1430"><span style="font-size:16px;font-weight:800;color:#4e1027">${titulo}</span><span class="px" style="font-size:18px;color:${color}">${valor}</span></div>`;
    const retratos = this.datos.ayudados.map((r) => `<img src="${rutaImagen(r)}" alt="" style="width:48px;image-rendering:pixelated;background:#efe4cc;border:3px solid #1b1430">`).join('');

    let record;
    if (guardado.recordAnterior === null) {
      record = `<span class="px" style="font-size:11px;white-space:nowrap">¡PRIMER RÉCORD!</span><span style="white-space:nowrap">${res.puntaje} puntos</span>`;
    } else if (guardado.nuevoRecord) {
      record = `<span class="px" style="font-size:11px;white-space:nowrap">¡NUEVO RÉCORD!</span><span style="white-space:nowrap">${guardado.recordAnterior} → ${res.puntaje}</span>`;
    } else {
      record = `<span class="px" style="font-size:11px;white-space:nowrap">TU RÉCORD</span><span style="white-space:nowrap">${guardado.recordAnterior} puntos</span>`;
    }
    // mundo abierto (Mundo 3): la misión siguiente se abre con un objeto (mundos.json → objetos)
    const abierto = !!mundo.mundoAbierto;
    const objeto = abierto && this.datos.objetoNuevo ? mundo.objetos.find((o) => o.clave === this.datos.objetoNuevo) : null;
    let desbloqueo = siguiente ? `Nivel ${siguiente.numero} desbloqueado · Guardado` : `${mundo.nombre} completado · Guardado`;
    if (abierto && siguiente) desbloqueo = objeto ? `Ganaste: ${objeto.nombre} · Guardado` : `Misión ${nivel.numero} cumplida · Guardado`;
    const adelanto = siguiente
      ? `<img src="${rutaImagen(siguiente.adelanto.retrato)}" alt="" style="width:40px;image-rendering:pixelated"><span>${siguiente.adelanto.texto}</span>`
      : `<img src="${rutaImagen('condor_posado')}" alt="" style="width:56px;image-rendering:pixelated"><span>Próximo: ${mundo.textoViaje.replace('El cóndor te lleva', 'el cóndor te lleva')}</span>`;

    const raiz = crearPantalla(this, `
<div class="dim" style="background:rgba(27,20,48,.6)"></div>
<section style="position:absolute;left:263px;top:24px;width:840px;height:720px;padding:24px 34px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#7a1f3d;border:4px solid #1b1430;box-shadow:inset 0 0 0 4px #f2b632,0 8px 0 #1b1430">
<h1 class="px" style="margin:0;font-size:28px;color:#f2b632;text-shadow:3px 3px 0 #1b1430">¡NIVEL ${nivel.numero} COMPLETADO!</h1>
<div style="display:flex;align-items:center;gap:12px;font-size:20px;font-weight:800;color:#ffe9b8">${rellenar(res.estrellas === 3 ? '¡Perfecto, {nombre}! Ayudaste a' : '¡Bien hecho, {nombre}! Ayudaste a', { nombre: estudiante.nombre })} ${retratos}</div>
<div style="display:flex;align-items:flex-end;gap:26px"><img class="feliz" src="${rutaImagen('mascota_feliz')}" alt="" style="width:110px;image-rendering:pixelated">
<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><div style="display:flex;align-items:flex-end;gap:10px">
${estrella(res.estrellas >= 1, 80)}${estrella(res.estrellas >= 2, 100)}${estrella(res.estrellas >= 3, 80)}</div>
<span style="padding:6px 12px;background:#4e1027;border:3px solid #1b1430;font-size:17px;font-weight:800">${consejoEstrella(res.estrellas, nivel.estrellas, res.tiempoSeg)}</span></div></div>
<div style="width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
${dato('Puntaje', res.puntaje, '#7a1f3d')}${dato('Aciertos', res.aciertos, '#157a4f')}${dato('Errores', res.errores, '#b8401a')}
${dato('Pistas usadas', res.pistasUsadas, '#1b1430')}${dato('Mejor racha', `x${res.mejorRacha}${res.bonoRacha ? ` +${res.bonoRacha}` : ''}`, '#e8572a')}${dato('Tiempo', formatoTiempo(res.tiempoSeg), '#1b1430')}</div>
<div style="width:100%;display:flex;gap:10px"><div style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f2b632;color:#1b1430;border:3px solid #1b1430;font-size:18px;font-weight:900">${record}</div>
<div style="flex:1;display:flex;align-items:center;gap:10px;padding:10px 14px;background:#157a4f;border:3px solid #1b1430;font-size:18px;font-weight:900;white-space:nowrap"><img src="${rutaImagen('estrella')}" alt="" style="width:24px;image-rendering:pixelated">${desbloqueo}</div></div>
<div style="width:100%;display:flex;align-items:center;gap:12px;padding:8px 14px;background:#4e1027;border:3px dashed #f2b632;font-size:18px;font-weight:800">${adelanto}</div>
<div style="margin-top:auto;width:100%;display:flex;gap:14px;align-items:center"><button type="button" class="boton btn" data-accion="reintentar" style="flex:1;height:58px;background:#4e1027">REINTENTAR</button><button type="button" class="boton btn" data-accion="zona" style="flex:1;height:58px;background:#4e1027">${mundo.nombreCorto.toUpperCase()}</button><button type="button" class="boton btn oro" data-accion="siguiente" style="flex:1.4;height:64px;font-size:15px">${siguiente && !abierto ? 'SIGUIENTE NIVEL' : 'CONTINUAR'} ▶</button></div>
</section>`, { clase: 'rpg' });

    const irSiguiente = () => {
      // en el mundo abierto se vuelve a caminar: el objeto se muestra en la zona
      if (abierto && siguiente) this.scene.start('Zona', { mundo: mundo.id, regresoNivel: nivel.id, objetoNuevo: this.datos.objetoNuevo });
      else if (siguiente) this.scene.start('Nivel', { nivel: siguiente.id });
      else this.scene.start('MundoCompletado', { mundo: mundo.id });
    };
    conectarBotones(raiz, {
      reintentar: () => this.scene.start('Nivel', { nivel: nivel.id }),
      zona: () => this.scene.start('Zona', { mundo: mundo.id, regresoNivel: nivel.id, objetoNuevo: this.datos.objetoNuevo }),
      siguiente: irSiguiente
    });
    this.input.keyboard.on('keydown-ENTER', irSiguiente);
  }
}

// Fondo con la zona del mundo y sus vecinos (sin el jugador).
// Solo los que están afuera (los de las casas y cuevas del Puerto no) y cada anfitrión una vez.
export function dibujarFondoZona(escena, mundo) {
  const mapa = new MapaRPG(escena, mundo.mapa, mundo.bloqueos);
  const dibujados = new Set();
  for (const puesto of mundo.puestos) {
    if ((puesto.lugar || 'puerto') !== 'puerto' || !puesto.anfitrion || dibujados.has(puesto.anfitrion.personaje)) continue;
    dibujados.add(puesto.anfitrion.personaje);
    const [c, r] = puesto.anfitrion.pos;
    const p = mapa.agregar(new Personaje(escena, PERSONAJES.vecinos[puesto.anfitrion.personaje].sprite, c, r));
    if (puesto.anfitrion.px) p.colocarEn(puesto.anfitrion.px[0] * CUADRO + CUADRO / 2, puesto.anfitrion.px[1] * CUADRO + CUADRO);
  }
  for (const amb of mundo.ambientales || []) {
    if ((amb.lugar || 'puerto') !== 'puerto') continue;
    const p = mapa.agregar(new Personaje(escena, PERSONAJES.vecinos[amb.personaje].sprite, amb.pos[0], amb.pos[1]));
    if (amb.px) p.colocarEn(amb.px[0] * CUADRO + CUADRO / 2, amb.px[1] * CUADRO + CUADRO);
  }
  // mapa grande: se ve la parte central de la zona (diseño 17)
  if (mapa.grande) escena.cameras.main.centerOn(...(mundo.centroFondo || [mapa.ancho / 2, 760]));
  const [cx, cy] = mundo.condorPos || [1221, 196];
  if (mundo.condor) escena.add.image(cx, cy, 'condor_posado').setOrigin(0, 0).setDisplaySize(88, 64).setDepth(300);
  return mapa;
}
