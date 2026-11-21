# Instalación y despliegue de EcuAventura

Responsable: **Carlos Chipana Ortiz** (Base de datos y despliegue).
Documento completo: `docs/5_Almacenamiento_e_Instalador_Carlos_Chipana.docx`.

## Requisitos del equipo
| | |
|---|---|
| Sistema | Windows 10 u 11 de 64 bits |
| Memoria | 4 GB de RAM |
| Disco | 500 MB libres |
| Internet | No es necesario |

## Descargar
En la sección **Releases** del repositorio (versión `v1.0.1`):

| Archivo | Tamaño | Uso |
|---|---|---|
| `EcuAventura Setup 1.0.1.exe` | 133 MB | Instalador (recomendado) |
| `EcuAventura 1.0.1 portable.exe` | 114 MB | Se abre sin instalar (USB o laboratorios) |

## Instalar
1. Abre `EcuAventura Setup 1.0.1.exe`.
2. Si aparece **“Windows protegió su PC”**, pulsa **Más información → Ejecutar de todas formas**
   (el programa no tiene certificado de firma comercial; el código está en este repositorio).
3. Elige **Solo para mí** (no pide contraseña de administrador) y pulsa **Instalar**.
4. Se crea el acceso directo **EcuAventura** en el escritorio y en el menú Inicio.

> En equipos con **Control inteligente de aplicaciones** de Windows 11 activado, el instalador puede bloquearse. En ese caso usa otra PC o la versión portable.

## Dónde se guarda el progreso
```
C:\Users\<usuario>\AppData\Roaming\EcuAventura
```
- Los datos están fuera de la carpeta del programa: **no se pierden** al cerrar, actualizar o desinstalar.
- **Respaldo:** copia esa carpeta a una USB con el juego cerrado.
- **Laboratorios con Deep Freeze:** define la variable de entorno `ECUAVENTURA_DATOS` con una ruta que conserve los cambios.

## Generar el instalador (desarrolladores)
```bash
npm install        # instala dependencias
npm run dev        # prueba en modo desarrollo
npm run dist       # genera el Setup y la portable en release/
```
> Ejecutar `npm run dist` desde **PowerShell** (en Git Bash el paso de NSIS puede fallar).

## Desinstalar
**Configuración → Aplicaciones → EcuAventura → Desinstalar.** El progreso guardado se conserva.
