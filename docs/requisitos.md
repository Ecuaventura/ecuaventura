# Requisitos de la ERS (EcuAventura)

Fuente: ERS_EcuAventura (IEEE 830). Estos son los ÚNICOS requisitos del juego.

## Requisitos funcionales

### RF-01 — Iniciar o continuar el juego
El sistema debe permitir al estudiante iniciar una nueva partida desde la pantalla principal. Al seleccionar la opción «Iniciar juego», el sistema debe cargar el primer nivel disponible o permitir continuar desde el último nivel guardado, según corresponda.

Criterios de aceptación:
- La pantalla principal mostrará las opciones «Iniciar juego», «Continuar» e «Instrucciones».
- Al iniciar una partida nueva, el estudiante escribirá su nombre y el sistema cargará el nivel 1 en menos de 5 segundos.
- La opción «Continuar» estará habilitada solo cuando exista progreso guardado; mostrará la lista de estudiantes registrados en esa computadora y cargará el último nivel, el puntaje y los niveles desbloqueados del estudiante elegido.

### RF-02 — Mostrar instrucciones
El sistema debe mostrar instrucciones visuales y textuales sobre el objetivo del videojuego, la mecánica del laberinto, la resolución de ecuaciones, el sistema de puntaje, las pistas y los controles disponibles.

Criterios de aceptación:
- La opción «Instrucciones» será accesible desde el menú principal.
- Las instrucciones explicarán, con texto e imágenes, el objetivo, los controles (teclado y mouse), la mecánica del laberinto, la forma de responder, el sistema de puntaje y el uso de pistas.
- Desde la pantalla de instrucciones el estudiante podrá regresar al menú principal con un solo clic o con la tecla Esc.

### RF-03 — Seleccionar niveles
El sistema debe permitir al estudiante visualizar y seleccionar los niveles disponibles antes de iniciar una partida. Los niveles no superados deben mostrarse como bloqueados, excepto el primer nivel.

Criterios de aceptación:
- La pantalla de selección mostrará los veinte niveles agrupados en cuatro mundos (Mercado, Estación de buses, Puerto y Construcción) y diferenciará visualmente los disponibles de los bloqueados (por ejemplo, con un candado).
- El nivel 1 estará disponible desde el inicio; los demás se habilitarán según lo indicado en RF-12.
- Si el estudiante intenta elegir un nivel bloqueado, el sistema mostrará un aviso y no permitirá iniciarlo.

### RF-04 — Resolver ecuaciones de primer grado
El sistema debe presentar ecuaciones de primer grado con una incógnita como retos matemáticos dentro de cada nivel del videojuego, para que el estudiante las resuelva.

Criterios de aceptación:
- Cada reto mostrará una ecuación con una sola incógnita (x) y una única solución.
- Las ecuaciones se generarán automáticamente según el tipo de ecuación del nivel: el sistema elige primero la solución y construye la ecuación a partir de ella, garantizando un resultado entero o decimal exacto.
- La ecuación se presentará con tipografía grande y legible en el panel inferior de la pantalla.

### RF-05 — Presentar situaciones de la vida real
El sistema debe presentar situaciones de la vida real que requieran plantear o resolver ecuaciones de primer grado, de acuerdo con la dificultad del nivel seleccionado.

Criterios de aceptación:
- Cada nivel incluirá al menos un problema contextualizado en situaciones cotidianas (compras en el mercado, transporte, viajes, construcción o comercio).
- El enunciado indicará claramente qué representa la incógnita y en qué unidad se espera la respuesta.
- Los problemas se generarán a partir de plantillas de enunciados (con datos numéricos variables) que serán revisadas y validadas por el cliente (Lic. Grimaldo) antes de incluirse en el juego.

### RF-06 — Ingresar y validar respuestas
El sistema debe permitir al estudiante ingresar una respuesta numérica y validar automáticamente si esta satisface la ecuación o situación matemática mostrada.

Criterios de aceptación:
- El estudiante escribirá su respuesta en una caja de texto (x = …) y la enviará con el botón «Comprobar» o con la tecla Enter.
- El sistema rechazará las entradas vacías o no numéricas con el mensaje «Ingrese un número válido», sin contarlas como intento.
- La respuesta se comparará con la solución del reto aceptando formatos equivalentes (por ejemplo, 2,5 y 2.5).

### RF-07 — Mostrar aciertos y errores
El sistema debe mostrar retroalimentación visual, acompañada de un efecto de sonido cuando el audio esté activo, inmediatamente después de validar una respuesta, indicando si el estudiante acertó o cometió un error.

Criterios de aceptación:
- Ante una respuesta correcta se mostrará un mensaje de acierto en color verde.
- Ante una respuesta incorrecta se mostrará un mensaje de error que invite a intentarlo nuevamente, sin revelar la solución.
- La retroalimentación aparecerá en menos de 1 segundo después de pulsar «Comprobar».

### RF-08 — Proporcionar pistas
El sistema debe proporcionar pistas conceptuales o pasos orientativos para resolver el reto matemático cuando el estudiante las solicite o cuando acumule tres respuestas incorrectas consecutivas en el mismo reto.

Criterios de aceptación:
- El botón «Pista» estará disponible en todo reto activo que aún no se haya resuelto.
- Después de tres respuestas incorrectas consecutivas en un mismo reto, el sistema ofrecerá automáticamente una pista.
- Las pistas corresponderán al tipo de ecuación del reto, orientarán el procedimiento sin mostrar el valor final de la incógnita y su uso reducirá el puntaje obtenido en ese reto.

### RF-09 — Aumentar progresivamente la dificultad
El sistema debe aumentar progresivamente la complejidad de las ecuaciones y de las situaciones contextualizadas cuando el estudiante avance a niveles superiores.

Criterios de aceptación:
- El juego tendrá veinte niveles organizados en cuatro mundos de cinco niveles cada uno; dentro de cada mundo los niveles 1 a 4 aumentan gradualmente la dificultad y el nivel 5 es el reto del mundo, con problemas de la vida real.
- Mundo 1, Mercado (niveles 1 a 5): x + a = b, x − a = b y ax = b; Mundo 2, Estación de buses (niveles 6 a 10): x / a = b y ax + b = c; Mundo 3, Puerto (niveles 11 a 15): ecuaciones con números negativos y con la incógnita en ambos miembros (ax + b = cx + d); Mundo 4, Construcción (niveles 16 a 20): ecuaciones con paréntesis y fracciones. El nivel 20 es el desafío final que integra todos los tipos.
- La configuración de cada nivel (mundo, tipo de ecuación, rango de números y cantidad de retos) se definirá en archivos JSON, de modo que la dificultad pueda ajustarse sin modificar la lógica del juego.

### RF-10 — Avanzar por el laberinto al resolver correctamente
El sistema debe permitir el desplazamiento del personaje o la apertura de un pasaje del laberinto únicamente cuando el estudiante resuelva correctamente el reto matemático asociado.

Criterios de aceptación:
- Cada pasaje bloqueado del laberinto estará asociado a un reto matemático.
- Solo una respuesta correcta abrirá el pasaje y permitirá mover al personaje, mostrando la apertura de forma visual.
- Mientras el reto no se resuelva, el pasaje permanecerá cerrado y el estudiante podrá volver a intentarlo o pedir una pista.

### RF-11 — Registrar puntaje y progreso
El sistema debe calcular y registrar el puntaje, los aciertos, los errores, los intentos, las pistas utilizadas, el tiempo empleado y el progreso alcanzado por el estudiante durante cada nivel.

Criterios de aceptación:
- Cada respuesta correcta sumará puntos; el puntaje del reto disminuirá si se usaron pistas o varios intentos.
- El panel superior mostrará en todo momento el puntaje acumulado y el avance del nivel.
- Al finalizar el nivel se calcularán las estrellas obtenidas (de 1 a 3) según los aciertos, los intentos y el tiempo empleado.

### RF-12 — Desbloquear nuevos niveles
El sistema debe desbloquear automáticamente el siguiente nivel cuando el estudiante complete el nivel activo según las condiciones de progreso establecidas.

Criterios de aceptación:
- Un nivel se considerará completado cuando el estudiante resuelva todos sus retos y llegue a la salida del laberinto.
- Al completar el nivel activo, el siguiente nivel se desbloqueará automáticamente y el cambio se guardará de inmediato; al completar el nivel 5 de un mundo se desbloqueará el primer nivel del mundo siguiente.
- Los niveles no completados permanecerán bloqueados en la pantalla de selección.

### RF-13 — Mostrar felicitación al completar cada nivel
El sistema debe mostrar una pantalla de felicitación al completar un nivel, indicando al menos el puntaje obtenido, la cantidad de aciertos, errores o intentos, el tiempo empleado y las estrellas alcanzadas.

Criterios de aceptación:
- La pantalla de felicitación mostrará el puntaje, los aciertos, los errores, los intentos, el tiempo empleado y las estrellas obtenidas (de 1 a 3).
- La pantalla ofrecerá los botones «Siguiente nivel», «Reintentar nivel» y «Menú de niveles».
- Al completar el nivel 20 se mostrará un mensaje especial de finalización de la aventura.

### RF-14 — Guardar y continuar el progreso
El sistema debe guardar localmente el avance del estudiante, los niveles desbloqueados, el puntaje y los récords, permitiendo continuar la partida en una ejecución posterior.

Criterios de aceptación:
- El progreso se guardará automáticamente al resolver cada reto, al completar un nivel y antes de salir del juego.
- Se guardarán el nombre del jugador, el nivel actual, los niveles desbloqueados, el puntaje y los récords (mejor puntaje y estrellas por nivel).
- Al volver a abrir el juego, la opción «Continuar» restaurará el último estado guardado.

### RF-15 — Reiniciar o salir del juego
El sistema debe permitir al estudiante reiniciar el nivel activo o salir del videojuego desde las opciones disponibles, solicitando confirmación antes de ejecutar la acción.

Criterios de aceptación:
- Las opciones «Reiniciar nivel» y «Salir» estarán disponibles durante el juego.
- Antes de reiniciar o salir, el sistema mostrará un mensaje de confirmación con las opciones «Sí» y «Cancelar».
- Al reiniciar solo se perderá el avance del intento actual; al salir, el sistema guardará el progreso antes de cerrar. En ambos casos se conservan los niveles ya completados.

## Requisitos no funcionales

### RNF-01 — Funcionamiento sin conexión a Internet
Dado que el laboratorio de cómputo de la I.E. N° 54037 Micaela Bastidas Puyucahua carece de conectividad estable, el sistema debe funcionar al 100 % de manera local, sin requerir Internet ni red local para la instalación, el juego, la validación de respuestas o el guardado del progreso.

Criterios de aceptación:
- El software se instalará y ejecutará por completo con el adaptador de red desactivado o el cable desconectado.
- El sistema no mostrará errores por falta de conexión ni intentará sincronizarse con servidores externos.
- Todos los recursos (imágenes, sonidos, fuentes y datos de los niveles) se incluirán dentro del instalador.

### RNF-02 — Compatibilidad con Windows 10 y 11
El videojuego debe ejecutarse correctamente en las computadoras de la institución con Windows 10 y Windows 11 de 64 bits, con procesador de doble núcleo, 4 GB de RAM y gráficos integrados.

Criterios de aceptación:
- Se verificará la instalación y ejecución en al menos un equipo con Windows 10 y otro con Windows 11 de 64 bits.
- El uso de memoria RAM durante el juego no superará 1,5 GB.
- La aplicación funcionará bajo cuentas de usuario estándar, sin privilegios de administrador.

### RNF-03 — Instalación sencilla
La instalación debe realizarse mediante un instalador guiado, sin configuraciones técnicas complejas, de modo que el personal del colegio pueda instalar el juego siguiendo una guía rápida.

Criterios de aceptación:
- El instalador (.exe), generado con electron-builder, no superará los 200 MB.
- La instalación se completará en no más de cinco pasos y en menos de tres minutos.
- Al finalizar, se creará un acceso directo en el escritorio y en el menú Inicio, y se entregará una guía rápida de instalación de una página.

### RNF-04 — Interfaz atractiva, intuitiva y fácil de usar
La interfaz debe ser atractiva y comprensible para estudiantes de 12 a 14 años, de modo que puedan usar las funciones principales sin capacitación previa.

Criterios de aceptación:
- Después de leer las instrucciones, un estudiante podrá iniciar una partida y responder su primer reto en menos de 2 minutos sin ayuda.
- Cada opción de menú se identificará con texto e ícono, y el estudiante podrá volver a la pantalla anterior desde cualquier pantalla.
- En las pruebas de aceptación (UAT), al menos el 80 % de los estudiantes calificará la interfaz como fácil de usar.

### RNF-05 — Diseño educativo con color guinda y colores complementarios
El diseño visual debe usar el color guinda institucional de la I.E. como color predominante en menús y paneles, complementado con blanco, dorado (estrellas) y verde esmeralda (aciertos).

Criterios de aceptación:
- Los menús, encabezados y paneles principales usarán el color guinda institucional.
- Los textos sobre fondos de color mantendrán un contraste mínimo de 4,5:1 (WCAG 2.2, nivel AA).
- Los escenarios del laberinto representarán situaciones cotidianas acordes con los problemas de cada mundo (mercado, estación de buses, puerto y construcción).

### RNF-06 — Funcionamiento rápido y estable
El sistema debe responder de inmediato a las acciones del estudiante y mantenerse estable ante entradas inválidas o errores internos, sin cierres inesperados.

Criterios de aceptación:
- El juego abrirá y mostrará el menú principal en menos de 5 segundos.
- La validación de una respuesta y su retroalimentación se mostrarán en menos de 1 segundo; los cambios de pantalla no superarán 2 segundos.
- La animación del laberinto mantendrá al menos 30 FPS.
- Las entradas inválidas (letras, símbolos o campos vacíos) no provocarán cierres ni errores no controlados.

### RNF-07 — Guardado local del progreso
El progreso del estudiante debe guardarse localmente en la computadora, de forma automática y segura frente a cierres inesperados o cortes de energía.

Criterios de aceptación:
- El progreso se guardará en la base de datos local SQLite (archivo ecuaventura.db) inmediatamente después de cada reto resuelto.
- El archivo de la base de datos se ubicará en una carpeta configurable, de modo que, si el laboratorio usa congeladores de disco (Deep Freeze), pueda guardarse en una partición no congelada.
- Tras un cierre inesperado, al volver a abrir el juego se recuperará el último estado guardado sin datos corruptos.
- Si los datos guardados están dañados, el sistema restaurará un estado seguro y lo informará al estudiante, sin bloquear la aplicación.

### RNF-08 — Compatibilidad con teclado y mouse
El juego debe poder utilizarse completamente con un teclado y un mouse estándar.

Criterios de aceptación:
- El personaje se moverá con las flechas del teclado o con las teclas W, A, S y D.
- Las respuestas se escribirán con el teclado y se enviarán con Enter o con el botón «Comprobar».
- Todos los botones y menús podrán usarse con clic del mouse.

### RNF-09 — Resolución mínima de 1366 × 768
La interfaz debe visualizarse correctamente desde una resolución de 1366 × 768 píxeles.

Criterios de aceptación:
- A 1366 × 768, el laberinto, la ecuación, la caja de respuesta y los botones serán visibles sin necesidad de desplazamiento.
- En resoluciones mayores, la interfaz se adaptará manteniendo sus proporciones.
- No se recortarán textos ni botones en ninguna pantalla.

### RNF-10 — Textos y botones claros y legibles
Los textos de los problemas, las ecuaciones y los botones deben ser de tamaño grande, claros y fáciles de leer para estudiantes de secundaria.

Criterios de aceptación:
- El texto general tendrá un tamaño mínimo de 16 px y las ecuaciones de 24 px.
- Los botones tendrán un área mínima de 44 × 44 px y etiquetas de texto claras.
- Se utilizará una tipografía sin serifas de alta legibilidad.

### RNF-11 — Fácil mantenimiento y posibilidad de agregar nuevos niveles
El videojuego debe tener una estructura modular que permita incorporar nuevos niveles, ecuaciones y pistas sin alterar la lógica principal, acompañada de documentación técnica para su mantenimiento.

Criterios de aceptación:
- La configuración de mundos y niveles, las plantillas de problemas y las pistas se mantendrán en archivos JSON separados de la lógica del juego.
- Agregar un nivel o un mundo nuevo no requerirá modificar el código, solo añadir su configuración JSON y sus recursos gráficos.
- Se contará con documentación técnica que explique el procedimiento para agregar nuevos contenidos matemáticos.
