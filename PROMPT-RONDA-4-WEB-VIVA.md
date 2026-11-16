# MANDATO MAESTRO — WEB VIVA, COMPLETA Y PROFESIONAL (todas las páginas, todas las secciones)

> **Antes de pegar:** copia a `scripts/` los dos ficheros nuevos: `audit-pages.mjs` (**sustituye** al anterior) y `list-routes.mjs`. `audit-code.mjs`, `capture-reference.mjs` y `extract-content.mjs` no cambian. Pega todo lo que hay debajo de la línea en Chief.
> Este mandato **complementa** al anterior (equipo en paralelo, referencia de nivel palosecodesign.com, método del vídeo) y **manda** donde se contradigan. Se mantienen: contenido y funcionalidad intactos, ningún dato de negocio inventado, y no tocar autenticación, RLS, esquemas ni secretos.

---

## 0. VEREDICTO

La home ha mejorado, pero **la web sigue sintiéndose estática y como un prototipo**: casi no hay animaciones, transiciones, efectos ni microinteracciones. Y la home no es la web: **hay que dejar igual de viva TODAS las páginas y subpáginas, sección por sección, sin saltarse ninguna.**

En las webs de referencia que hemos analizado la sensación de producto profesional aparece **mientras se explora**: al hacer scroll, al pasar el ratón, al pulsar, al navegar entre subpáginas. Eso es exactamente lo que falta aquí, y es lo que este mandato impone, con comprobación automática.

## 1. LA REGLA DE ORO: UNA WEB VIVA

- **Regla de los tres segundos:** en cualquier momento de la exploración de **cualquier** página, durante cualquier ventana de tres segundos, el usuario ve al menos una respuesta de la interfaz con sentido (entrada de una sección, efecto ligado al scroll, respuesta al hover, cambio de estado, transición).
- **Cada sección tiene coreografía propia**: nada de «fade-in igual para todo». La variedad es obligatoria y se mide.
- **Navegar también es movimiento:** entre subpáginas hay transición; el usuario nunca ve un cambio brusco de pantalla.
- **El movimiento no es adorno:** guía la mirada, confirma acciones, da continuidad y refuerza la marca. Con `prefers-reduced-motion` todo degrada con elegancia.
- Una página está **terminada** cuando es bonita **y** viva **y** funcional, y los auditores lo confirman con salida literal.

## 2. COBERTURA SIN HUECOS (así se garantiza que no se salta nada)

1. **Inventario desde el código:** `node scripts/list-routes.mjs` → `docs/redesign/rutas.json`. Rellena `samples` con **una URL real por cada ruta dinámica** (producto, pedido, blog…). Si hay rutas privadas, usa `--storage auth.json` en los scripts (`npx playwright codegen --save-storage=auth.json <URL>`; nunca a git). Los **ficheros especiales** que lista (`loading`, `error`, `not-found`, layouts, modales interceptados) también se diseñan y se revisan a mano con captura.
2. **Rastreo de enlaces:** la auditoría falla si existe una página alcanzable por enlaces que no está en `rutas.json`, si una ruta dinámica no tiene muestra o si una URL inexistente no devuelve un **404 diseñado**.
3. **`docs/redesign/COREOGRAFIA.md`: la especificación por sección.** Una tabla por ruta (incluidas subpáginas y estados), **una fila por cada sección** en orden (cabecera → … → pie), con estas columnas:

| Sección | Composición (jerarquía, rejilla, imagen/asset) | Entrada (id de catálogo) | Efecto de scroll (id) | Hover / foco / pulsación | Microinteracciones y estados | Referencia primaria + `fuente:` | Estado |
|---|---|---|---|---|---|---|---|

   El director de arte la aprueba **antes** de implementar cada ruta. Una sección sin fila no existe y una fila sin implementar es un `⬜`.
4. **`data-fx` en el DOM:** cada bloque de primer nivel (`<header>`, cada hijo directo de `<main>`, `<footer>`) declara su coreografía con los ids del catálogo, p. ej. `data-fx="text-lines reveal-stagger"`. La auditoría **verifica** lo declarado (§3). Una sección sin `data-fx` falla.
5. **Orden de trabajo:** cabecera, pie y navegación global; home; catálogo; ficha de producto; acceso y pedido; resto de rutas; estados y especiales. **Se hacen todas.** El estado real de cada fila se reporta con honestidad.

## 3. CATÁLOGO DE MOVIMIENTO (vocabulario de `data-fx`)

Duraciones, curvas y distancias salen de `DESIGN.md §6` (medidas en referencias); nunca valores a ojo. Para un efecto propio, usa el prefijo `x-` (p. ej. `x-sello-giratorio`) y descríbelo en `COREOGRAFIA.md`.

| Familia | ids | Para qué | Lo verifica el script |
|---|---|---|---|
| Entrada | `reveal-up` `reveal-stagger` `text-lines` `text-chars` `mask-image` `clip-wipe` `scale-in` `blur-in` | Entrada de secciones, titulares línea a línea, imágenes con máscara, rejillas con escalonado | Entrada al scroll medida en ≥ 70 % de las secciones bajo el pliegue |
| Ligados al scroll | `parallax` `pin-story` `h-scroll` `scroll-progress` `scale-scroll` | Profundidad, narración fijada, recorridos horizontales de familias de producto, barra de progreso | **Sí**: se mide movimiento continuo ligado al scroll dentro de esa sección |
| Continuos | `marquee` `badge-rotate` `float` `counter` | Marquesinas de familias de producto o servicios, sello giratorio, cifras que cuentan (**solo datos reales**) | `marquee`: movimiento continuo medido |
| Interacción | `magnetic` `cursor-label` `hover-image` `tilt` `card-lift` `underline-draw` `fill-slide` `accordion` `drag-slider` | Botones magnéticos, cursor con etiqueta («Ver producto», «Arrastrar»), imagen que sigue al hover, tarjetas que responden, subrayados que se dibujan | Hover medido en ≥ 80 % de los elementos interactivos |
| Navegación | `page-transition` `shared-element` `route-loader` | Transición entre rutas, elemento compartido (tarjeta → ficha), barra de carga de ruta | **Sí**: se mide la transición al navegar desde la cabecera |
| Estados | `skeleton` `toast` `form-feedback` `modal-motion` | Cargas con esqueleto y brillo, avisos, validación y envío de formularios, modales y cajones con entrada y salida | Foco de campos medido (≥ 80 %) |
| Estructura | `header-shrink` `footer-reveal` `sticky-stack` | Cabecera que cambia al hacer scroll, pie con entrada, apilado pegajoso de secciones | Cabecera reactiva (aviso) |

**Reglas de composición (medidas):** en páginas con ≥ 5 secciones hay **≥ 3 efectos distintos**, **ninguno en > 60 %** de las secciones y **al menos un elemento con movimiento ligado al scroll**. Cada página tiene una **entrada de hero coreografiada**, ritmo de entrada (no todo a la vez) y un **momento memorable** (una sección que sorprenda y encaje con la marca).

## 4. NAVEGACIÓN ENTRE SUBPÁGINAS (obligatoria y global)

Implementada una sola vez en el layout/plantilla y válida para todas las rutas:
- **Transición entre rutas** (View Transitions API o la técnica que respalden las referencias primarias): salida y entrada coordinadas, sin parpadeos; con alternativa sin movimiento.
- **Elemento compartido** cuando una tarjeta lleva a su ficha (la imagen se transforma en la cabecera de la ficha), siempre que la referencia lo justifique.
- **Barra o indicador de carga de ruta**; restauración correcta del scroll al volver atrás; **precarga** de las rutas probables.
- **Indicador animado de la página activa** en la navegación; menú móvil diseñado con entrada y salida y escalonado de sus elementos.
- **Gestión del foco** al cambiar de ruta (accesibilidad) y respeto de `prefers-reduced-motion`.

## 5. PLAYBOOKS POR TIPO DE SECCIÓN (aplícalos a TODAS las secciones del inventario)

Cada playbook fija un mínimo de **composición**, **movimiento**, **microinteracciones** y **estados**. Una sección que no encaje en ninguno recibe una ficha con el mismo formato en `COREOGRAFIA.md`. Todo contenido es el existente o el que haya en datos reales; nunca cifras, clientes ni certificaciones inventados.

- **Cabecera y navegación.** Composición: logotipo, enlaces con jerarquía clara, CTA visible. Movimiento: reacciona al scroll (tamaño, fondo o sombra), enlaces con subrayado que se dibuja o microtexto, indicador activo animado. Micro: menú desplegable con entrada y salida, buscador con transición. Móvil: panel a pantalla completa o cajón con escalonado; botón con estado abierto/cerrado animado.
- **Hero.** Composición: titular de gran escala con voz de marca, imagen o vídeo protagonista, CTA principal y secundario con jerarquía. Movimiento: coreografía de entrada (texto por líneas, imagen con máscara, CTA el último) y un efecto de scroll de salida (parallax o escala). Micro: CTA magnético o con relleno animado; cursor con etiqueta si encaja.
- **Banda de confianza / marquesina.** Composición: familias de producto o servicios reales como texto grande. Movimiento: marquesina continua con pausa al hover y cambio de dirección con el scroll si encaja.
- **Familias y categorías.** Composición: bloques numerados con imagen grande y etiquetas. Movimiento: entrada escalonada; hover con imagen que se desplaza o revela. Micro: cursor con «Ver».
- **Rejilla de producto, filtros, búsqueda, orden y paginación.** Composición: densidad cuidada, relación de imagen uniforme, nombre/formato/precio con jerarquía. Movimiento: entrada escalonada por filas, reordenación animada al filtrar o ordenar, skeletons al cargar. Micro: tarjeta que responde al hover (elevación o desplazamiento de imagen), botón «añadir» con confirmación animada, chips de filtro con transición, contador de resultados que cambia con suavidad. Estados: vacío con ilustración y llamada a la acción, error con reintento.
- **Ficha de producto.** Composición: galería grande, información en jerarquía, bloque de compra fijado al hacer scroll. Movimiento: transición de elemento compartido desde la tarjeta, zoom o desplazamiento en la galería, entrada de las secciones de detalle. Micro: selector de formato/cantidad animado, botón de pedido con estados (normal, cargando, añadido), relacionados en slider arrastrable.
- **Carrito, pedido y checkout.** Composición: pasos claros, resumen que se queda fijo. Movimiento: transición entre pasos, líneas que entran y salen con animación al añadir o quitar, totales que cambian con suavidad. Micro: validación en línea con feedback, botón de confirmar con estados y confirmación final con celebración sobria.
- **Acceso, registro y recuperación.** Composición: formulario centrado con un panel de marca. Movimiento: entrada coordinada. Micro: foco de campos con transición, errores que aparecen con suavidad, botón con estado de carga, mostrar/ocultar contraseña animado.
- **Panel de cliente, pedidos, historial y tablas.** Composición: tablas diseñadas (cabecera fija, filas con densidad cómoda, estados con color de tokens). Movimiento: filas con entrada escalonada, expansión de fila con animación, ordenar y filtrar con transición. Micro: acciones por fila que aparecen al hover, selección con feedback, toasts para confirmaciones. Estados: vacío, carga (skeleton), error.
- **Formularios (alta profesional, contacto).** Composición: agrupación clara, ayuda contextual. Micro: etiquetas flotantes o movimiento de etiqueta, validación animada, progreso de pasos, envío con estados y pantalla de éxito animada.
- **Modales, cajones, desplegables, tooltips y toasts.** Movimiento: entrada y salida con curva de tokens, fondo con transición, cierre con Escape y foco gestionado. Toasts que entran, esperan y salen con barra de tiempo.
- **Páginas de contenido (empresa, reparto, calidad, preguntas frecuentes, contacto).** Composición: editorial, con titulares grandes, imagen real, bloques de datos. Movimiento: narración al scroll (`pin-story` o `parallax` donde encaje), acordeones animados en preguntas frecuentes, mapa o bloque de datos con entrada. Solo datos confirmados.
- **Páginas legales.** Composición: lectura cómoda, índice lateral que sigue al scroll con indicador de sección activa, entrada sobria.
- **Pie.** Composición: organización clara, CTA final grande. Movimiento: entrada del pie, enlaces con microinteracción, CTA final con efecto propio (marquesina o titular gigante).
- **Estados globales.** Vacío, carga, error, 404 y 500: ilustración o gráfico propio, mensaje con la voz de marca, camino claro de salida, movimiento sutil. Son páginas de primera clase, no un añadido.

## 6. CALIDAD DE EJECUCIÓN

- Anima sobre todo `transform` y `opacity`; duraciones y curvas **solo de los tokens**; nada de saltos de maquetación; 60 fps en el pliegue.
- El contenido **nunca queda oculto si falla el script**; el movimiento se aplica como mejora progresiva. **`prefers-reduced-motion` respetado en todo**, con alternativas que conserven el significado.
- **Un solo motor de scroll** (nada de dos librerías peleando). Usa la que el proyecto ya tenga o la que respalden las referencias primarias (`animations.json`); instala lo mínimo y regístralo.
- Rendimiento dentro de los umbrales de Lighthouse del mandato anterior; el movimiento no justifica una web pesada. Imágenes optimizadas y vídeo con póster.
- Accesibilidad intacta: foco visible, orden de tabulación, contraste, nombres accesibles, sin trampas de teclado en modales y cajones.

## 7. EQUIPO EN PARALELO (sin cerrar subagentes tras la primera entrega)

- **Chief orquesta y verifica; no programa la web.** Lanza como mínimo **8 subagentes a la vez**, con propiedades exclusivas y ramas o worktrees por paquete.
- **Roles:** director de arte (con visión), sistema de diseño y tokens, **ingeniero de movimiento (≥ 2)** dueños de las primitivas y de la navegación entre páginas, productor de assets, **un escuadrón de páginas por grupo de rutas**, crítico hostil distinto del director (con visión), QA/auditor y revisores de código por lotes.
- **Una entrega no es el final:** pasa por director y crítico, vuelve al subagente con correcciones concretas y se reutiliza hasta que pase. **Mínimo 3 rondas de crítica-corrección por ruta.** Cuando un subagente termina, Chief le asigna la siguiente ruta o la corrección de lo rechazado.
- **Revisión del movimiento con ojos:** graba cada ruta con `node scripts/capture-reference.mjs --url <ruta> --id mp-despues-<ruta> --out docs/redesign/after --video`, extrae fotogramas (`ffmpeg -i scroll-desktop.webm -vf fps=2 frames/%03d.png` si hay ffmpeg), abre las capturas y compáralas con las de la referencia de nivel; contrasta también `animations.json` e `interactions.json`. Quien no pueda ver imágenes no hace dirección de arte ni crítica.
- Cada encargo incluye: la ruta y sus filas de `COREOGRAFIA.md`, las secciones de `DESIGN.md` por número (nunca valores CSS) y un criterio de aceptación que sea un comando o una comparación de capturas.

## 8. ACEPTACIÓN MECÁNICA

Mientras iteras una ruta: `node scripts/audit-pages.mjs --base <URL> --routes "<ruta>"`. Para dar por buena la web, **todo en PASS y con la salida literal pegada en `docs/redesign/RONDA4-RESULTADO.md`**:

1. `node scripts/list-routes.mjs` y `node scripts/audit-pages.mjs --base <URL> --routesFile docs/redesign/rutas.json` (**sin flags de umbral**) → **PASS**. Comprueba, por sección y a 390/768/1440 px: centrado y márgenes móviles, colores solo de tokens, entrada al scroll (≥ 70 %), hover (≥ 80 %), `data-fx` declarado y variedad, efectos declarados verificados, movimiento ligado al scroll, foco de campos (≥ 80 %), **transición entre páginas**, `prefers-reduced-motion`, cobertura de rutas, 404 diseñado.
2. `node scripts/audit-code.mjs check` → **PASS** (todo el código revisado con revisor cruzado y sin estilos antiguos).
3. `node scripts/extract-content.mjs --compare …` → código 0 (contenido intacto), `build` de producción y tests en verde, recorridos funcionales con Playwright, Lighthouse según el mandato anterior.
4. **Firma del crítico hostil** por ruta con capturas y fotogramas a 1440 y 390 px, comparadas con la referencia de nivel, sin señales de plantilla y sin ninguna sección que se sienta estática.

**Anti-trampas (prohibido):** modificar `scripts/*.mjs` o usar flags para bajar umbrales · declarar en `data-fx` efectos que no existen (el script los mide) · exenciones `data-asym` o `data-motion="none"` en masa (máx. 25 %) · marcar filas `✅` sin captura y sin PASS · ocultar contenido o estilos antiguos con trucos · resumir o saltar secciones del inventario · declarar «hecho» sin pegar la salida del comando.

## 9. EJECUCIÓN

- Autonomía total: no pidas permiso entre pasos. Solo paras por falta de algo imprescindible, una acción destructiva irreversible o una contradicción que la evidencia no resuelva.
- Informa al cerrar cada tanda: `qué rutas/secciones ✅ | salida de los comandos | pendiente exacto (rutas, secciones y fallos)`. Lo que no pase se reporta tal cual, **nunca** se marca como hecho.
- Rama `rediseno/v2`, commits por tanda; valores de diseño siempre con `fuente:`.

**Empieza ahora: `list-routes.mjs`, `COREOGRAFIA.md` de la home y de las rutas P0 revisada por el director de arte, y lanza el escuadrón completo en paralelo. No cierres ningún subagente hasta que su ruta esté aceptada.**
