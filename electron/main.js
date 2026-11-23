// Proceso principal de Electron: abre el juego (carpeta dist/) en una ventana de escritorio.
// Todo se sirve desde el propio paquete con el protocolo app:// (sin Internet, RNF-01).
import { app, BrowserWindow, Menu, protocol, net, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const ICONO = path.join(DIST, 'icon.png'); // copia de build/icon.png (public/icon.png)
const ANCHO = 1366;
const ALTO = 768;
const TITULO = 'EcuAventura: El Laberinto Matemático';

// Los datos del alumno (progreso y, en la etapa de base de datos, ecuaventura.db) van en la
// carpeta de datos del usuario (%APPDATA%\EcuAventura), nunca en la carpeta del programa.
// Así no se pierden al cerrar, actualizar o desinstalar. Se puede cambiar con la variable de
// entorno ECUAVENTURA_DATOS (por ejemplo, si el laboratorio usa Deep Freeze).
app.setName('EcuAventura');
if (process.env.ECUAVENTURA_DATOS) app.setPath('userData', process.env.ECUAVENTURA_DATOS);

// app:// se comporta como un sitio normal (localStorage, fetch, WASM), pero lee los archivos de dist/.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

// Una sola ventana del juego a la vez.
if (!app.requestSingleInstanceLock()) app.quit();

let ventana = null;

function servirArchivos() {
  protocol.handle('app', (peticion) => {
    const { pathname } = new URL(peticion.url);
    let ruta = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    // No dejar salir de dist/.
    if (!ruta.startsWith(DIST)) return new Response('No encontrado', { status: 404 });
    if (pathname === '/' || pathname === '') ruta = path.join(DIST, 'index.html');
    return net.fetch(pathToFileURL(ruta).toString());
  });
}

function crearVentana() {
  ventana = new BrowserWindow({
    width: ANCHO,
    height: ALTO,
    useContentSize: true,
    minWidth: 683,
    minHeight: 384,
    resizable: true,
    title: TITULO,
    icon: ICONO,
    backgroundColor: '#2a1d33',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });

  // Mantener la proporción 1366:768 del juego al cambiar el tamaño.
  ventana.setAspectRatio(ANCHO / ALTO);
  ventana.setMenuBarVisibility(false);

  // El título de la página no reemplaza al de la ventana.
  ventana.on('page-title-updated', (e) => e.preventDefault());

  // F11 = pantalla completa (Esc queda para el juego).
  ventana.webContents.on('before-input-event', (_e, entrada) => {
    if (entrada.type !== 'keyDown') return;
    if (entrada.key === 'F11') ventana.setFullScreen(!ventana.isFullScreen());
  });

  // Nada de abrir otras páginas dentro del juego.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) e.preventDefault();
  });

  // Diagnóstico: con ECUAVENTURA_DEPURAR=1 se muestran en la terminal los errores de la página.
  if (process.env.ECUAVENTURA_DEPURAR) {
    ventana.webContents.on('console-message', (e) => console.log(`[juego:${e.level}] ${e.message}`));
    ventana.webContents.on('did-fail-load', (_e, codigo, desc, url) => console.log(`[carga] ${codigo} ${desc} ${url}`));
    ventana.webContents.session.webRequest.onCompleted((d) => {
      if (d.statusCode >= 400 || (d.error && d.error !== 'net::OK')) console.log(`[recurso] ${d.statusCode} ${d.error || ''} ${d.url}`);
    });
    ventana.webContents.on('did-finish-load', () => console.log('[carga] lista'));
  }

  ventana.once('ready-to-show', () => ventana.show());
  ventana.on('closed', () => { ventana = null; });
  ventana.loadURL('app://juego/index.html');
}

app.on('second-instance', () => {
  if (!ventana) return;
  if (ventana.isMinimized()) ventana.restore();
  ventana.focus();
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  servirArchivos();
  crearVentana();
});

app.on('window-all-closed', () => app.quit());
