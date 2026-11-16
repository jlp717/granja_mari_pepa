# Dirección de arte V3 · Una jornada, cinco umbrales

Fecha: 11 de noviembre de 2026. Director: nodo `art`. Esta dirección pertenece exclusivamente a V3 desde Main. La referencia autorizada es Kage; no se incorpora material de rediseños anteriores. Estado: dirección aprobada para implementar; aceptación visual y funcional pendiente.

## 1. La fuente que manda

Se conserva literalmente el sistema de Kage: mundo Three persistente, cámara continua gobernada por un único scroll nativo, postprocesado, curvas, escalas, composición editorial y relevo del primer plano. La copia inmutable vive en `reference/kage-verbatim/`; las adaptaciones de marca, entorno, contenido, React, rutas, estados y accesibilidad se registran por separado. Fuente: `reference/kage-verbatim/index.html:886` (seis composiciones B activas); `PROMPT.md`; brief vinculante `.codex/graph-runs/gmp-kage-v3-20261111-0920/BRIEF-V3.md` del coordinador.

La observación directa cubrió los cinco capítulos a 1440 × 900 y 390 × 844. Se vieron diez PNG y ocho assets originales, con detalle de composición, luz y alfa. No es una medición de FPS ni la aceptación de GMP. Índice de observación: `C:/Users/Javier/AppData/Local/Temp/gmp-v3-art-wY86X5/capture-manifest.json`. Fuente viva: <https://mengto.github.io/kage/>.

## 2. Identidad, color y tipografía

El acento procede de Main y de la lectura calculada de <https://mari-pepa.com/es>: `hsl(190 95% 40%)`, equivalente redondeado sRGB `#05a7c7`. Fuente: `frontend/app/globals.css:77` de Main. Sustituye los papeles de interfaz vermilion/ember; no cambia la distinción física entre iluminación cálida y fría. El resto de paleta y valores conserva Kage. No se inventan nuevos colores de marca.

La identidad es el logotipo real `frontend/public/images/logo.jpeg` (1076 × 320; SHA256 `e35de5c682a592704771cc5fa2e8a599ee2c423bbbd225d11a7ede95975a491d`). La textura de identidad 3D y el header usan su derivado alfa local conservando los RGB del original, nunca un nombre generado. El píxel modal del fondo del JPEG es `#003a48`; esa medición no sustituye al acento de interfaz. La extracción local y sus límites se documentan en ASSETS.

Kage entrega Wordmark como subconjunto de 22 glifos que no cubre el nombre Mari Pepa. La excepción de marca aprobada usa el logo real y conserva Onest literal para el texto español, incluidos títulos verticales. Onest 300/400/500/700 contiene ÁÉÍÓÚÜÑáéíóúüñ¿¡ según cmap comprobado por Tokens. No se incorpora otra familia. Fuente: `reference/kage-verbatim/secret-pathways-assets/fonts.css` y revisión de Tokens V3. No se conserva japonés como decoración de una empresa española.

## 3. Seis planos, un mundo

| Plano | Papel | Orden y comportamiento | Verificación |
|---|---|---|---|
| P1 Mundo | Arquitectura/terreno ambiental y cámara persistente | Canvas fijo original; misma matemática y scroll. Sin mundo paralelo por página. | Comparación de trayectoria con copia Kage y continuidad al navegar. |
| P2 Atmósfera | Disco-acento, niebla, polvo, luz, bloom | Preserva shaders y post. La iluminación describe la imagen; no demuestra instalaciones, flota o proceso real. | Imágenes asentadas y secuencia de scroll; sin sobreexposición del texto. |
| P3 Lámina | Ambiente o foto real dentro de ventana editorial | Un fondo ambiental por capítulo; fotos de producto sólo del banco Main con procedencia. No sustituye el mundo por un slideshow. | Bitmap decodificado, recorte, resolución y atribución contextual. |
| P4 Lectura | Etiqueta, número, titular, entradilla, apoyos, CTA | Orden semántico estable y composición B elegida por el trabajo de la sección. SSR con todo el contenido legible. | DOM/h1, captura móvil, texto final enlazado a su fuente. |
| P5 Primer plano | Elemento alfa cercano que encuadra | Fijo abajo durante su capítulo, opacidad de arte completa; salida con fade/blur original. Centro de lectura abierto. | Bordes alfa limpios, llegada/permanencia/relevo; teclado sin obstrucción. |
| P6 Control | Header, menú, índice, cursor, formulario, estados | Encima de la escena, foco visible y operaciones reales. Cursor sólo puntero fino. Las pantallas internas no usan WebGL. | Teclado, Escape, foco, tacto, validación y reduced-motion. |

No son seis imágenes obligatorias por sección. Cada fila de COREOGRAFIA registra cuáles de estos planos necesita y qué contenido contiene. Una ruta comercial tiene cinco o más secciones propias, sin repetir el orden de Home por cuota. Contacto y legales priorizan su cometido y la lectura. Fuente: brief V3; `reference/kage-verbatim/index.html:45–56,228–250,639–790`.

## 4. Composición B: contrato concreto

| Patrón | Fuente literal | Aplicación permitida |
|---|---|---|
| Hero B dividido | `index.html:523–560` | Columna izquierda e índice numerado; ventana pequeña a la derecha en escritorio, fuera en móvil. Logo real sustituye identidad parcial. |
| Story B desplegado | `index.html:561–572` | Titular cruza columnas y prosa a la derecha; banda reglada usa sólo hechos verificados o nombres de temas, nunca cifras inventadas. |
| Gallery B mosaico | `index.html:573–586` | Ventana protagonista alta y dos apiladas; móvil conserva 4:5 + 16:10. Fotografías reales si muestra producto. |
| Curriculum B atlas | `index.html:587–606` | Dos paneles y tres debajo; móvil una columna. Paneles pueden explicar preguntas o pasos verdaderos, no inventan tiempos. |
| Closing B galería | `index.html:607–621` | Título vertical a la derecha y relato/CTA a la izquierda; móvil título horizontal. Español completo Onest. |
| Footer B manifiesto | `index.html:622–637` | Declaración real y debajo índice compacto de enlaces existentes; no repite un hero transaccional. |

Los rangos apuntan a la fuente local original; Tokens mantiene los valores completos en DESIGN. El B responsivo de `index.html:808–872` forma parte del contrato, no es opcional. No existe un tamaño universal de título: se conservan las escalas de cada selector original.

## 5. Cinco capítulos de Home y dirección de imagen

| Capítulo | Composición y plano de cámara | Luz/material | Asset ambiental previsto | Límite factual |
|---|---|---|---|---|
| 01 Umbral | Hero B; portón en profundidad, lectura izquierda y horizonte abierto | Alba rasante, hormigón húmedo, sombra fría, luz cálida lejana | `scene/01-umbral.webp` + `foreground/01-umbral.webp` derivado de la misma toma | Es ambiente ilustrativo; no sede real ni horario. |
| 02 Frío | Story B; pasillo frío y encuadre lateral | Acero cepillado, escarcha de borde, punto cálido pequeño al fondo | `scene/02-frio.webp` + `foreground/02-frio.webp` derivado | Sin productos, lectura de temperatura, volumen o certificación. |
| 03 Catálogo | Gallery B; profundidad de estanterías y mosaico de fotos reales Main | Luz fría lateral, ritmo estructural, motas procedurales | `scene/03-catalogo.webp` + `foreground/03-catalogo.webp` derivado | Estanterías vacías; gate del catálogo y datos de producto intactos. |
| 04 Ruta | Curriculum B; horizonte continuo y atlas de consultas reales | Carretera genérica, bruma de distancia y vegetación baja | `scene/04-ruta.webp`; hierba/relieve Kage literal como alfa | Sin geografía, matrículas, clientes o promesas de reparto. Vehículo sólo silueta geométrica genérica. |
| 05 Mesa | Closing B y transición al manifiesto del pie | Cocina vacía, luz práctica cálida, sombras frías y vapor procedural contenido | `scene/05-mesa.webp` + `foreground/05-mesa.webp` derivado | Sin comida generada, personal, logos o local de cliente. |

Cada fondo comparte un mismo lenguaje de exposición y material; el alfa se extrae localmente del propio fondo, conservando continuidad. Mínimo: cinco generaciones para cinco fondos; cuatro derivados alfa locales. No se solicita una novena generación por defecto. Cada fondo sirve también para la alternativa estática. Producción realizada con el generador nativo después del único intento Higgsfield rechazado por requisito de plan. ASSETS registra la autorización, los cinco resultados y los costes nativos no informados.

## 6. Luz, grano y cercanía

El ambiente es fotográfico y material, de bajo brillo plástico. La sombra debe conservar textura; una práctica cálida pequeña crea escala dentro de un campo frío. La paleta de la lámina no se convierte en nuevos colores UI. Kage ya aporta grano global `.055`, repetición `180px`, viñeta y post; no se hornea grano grueso adicional. Fuente: `index.html:49–56`.

El primer plano conserva `saturate(.88) brightness(.86)`, ocupación inferior `min(56svh,680px)` y el comportamiento de entrada/salida fuente; sus límites móviles siguen los anclajes originales. Fuente: `index.html:692–725,793–807`. La extracción no debe dejar halo oscuro, rectángulo opaco ni niebla que tape campos. Todos los textos, formularios y salidas continúan disponibles sin WebGL o script.

## 7. Rutas y aprobación

COREOGRAFIA contiene una fila por header, hijo directo de main y footer; los estados tienen filas propias. `🟡 Diseño aprobado` permite implementar esa intención, nunca significa terminado. `✅ Aceptado` exige captura nativa, secuencia de movimiento, pruebas aplicables y firma independiente de la misma fuente integrada. Las tres rondas son recorridos visuales reales; leer código no consume una ronda.

Las páginas operativas usan una toma tranquila y cámara casi fija; los paneles privados prescinden de WebGL y conservan lenguaje tipográfico/superficies. No se antepone una escena a la tarea, ni se cambia auth, API, cálculos, BD o disponibilidad para hacer más convincente una imagen.

## 8. Estado honesto de esta entrega

Dirección y planes P0 aprobados por Art antes de implementación; texto y hechos finales pertenecen a sus propietarios y se enlazan mediante IDs. Producidos cinco fondos nativos1536×1024 y cuatro derivados alfa locales; cero regeneraciones. El único intento Higgsfield fue rechazado por requisito de plan: saldo10→10 observado, cargo explícito no informado. Los costes de las cinco generaciones nativas no se informaron. Logo alfa local producido y abierto. Umbral fue aceptado como ambiente ilustrativo por Root y por Critic; eso no acepta su integración ni otra ruta. Las láminas, las máscaras y los encuadres están registrados en ASSETS y art/environment-assets-proof.json. Sin aceptación runtime ni afirmación de rendimiento o producción terminada.

## 9. Colocación de las nuevas geometrías y OG

Los alfa bajos usan el slot compartido `gmp-low-left/right` y `.fg-gmp-low`, añadido por Tokens después del CSS literal. Fuente de medidas: `[data-fg=gate] .fg-wall` de Kage: width clamp(430px,47vw,780px), bottom -30px; a1080 clamp(390px,42vw,600px); a820 min(82vw,440px), bottom -22px. La alineación de borde usa left0/right0. La orientación derecha es una adaptación explícita: el negativo de otros slots ocultaría una silueta situada en el extremo derecho del canvas. No altera opacidad, filtro, curvas o relevo fuente. Escenas0/1 usan left;2/4 right;3 reutiliza hierba/relieve literal;5 sólo una plantación baja si encaja. La colocación queda pendiente de captura integrada.

La OG1200×630 es un derivado local: logo real sin reescalar sobre Umbral, con el radial fuente de `index.html:230` adaptado al marco de imagen social. Sin cifras, claims ni texto nuevo. Art la abrió y aprueba como asset estático; el enlace de metadata se verifica después de integrar.
