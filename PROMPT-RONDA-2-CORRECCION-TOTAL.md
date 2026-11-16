# RONDA 2 — CORRECCIÓN TOTAL · mari-pepa.com

> **Antes de pegar (2 minutos):**
> 1. Copia a `scripts/` los dos ficheros nuevos: `audit-pages.mjs` y `audit-code.mjs` (junto a `capture-reference.mjs` y `extract-content.mjs`).
> 2. Pega TODO lo que hay debajo de la línea en Chief. No lo resumas ni lo trocees.
> 3. Ten a mano la URL local, `auth.json` si hay rutas privadas (`npx playwright codegen --save-storage=auth.json <URL>`) y no lo subas a git.
>
> Esta ronda no depende de la buena voluntad del agente: **termina cuando los scripts devuelven código 0**, no cuando el agente lo dice.

---

## 0. VEREDICTO SOBRE EL ESTADO ACTUAL: RECHAZADO

El resultado del primer pase **no es aceptable**. Hechos que he comprobado a ojo y que este mandato obliga a corregir:

- Hay muchas secciones con estilos visuales muy pobres.
- Hay contenido sin centrar.
- Siguen existiendo estilos antiguos mezclados con los nuevos.
- No hay animaciones ni transiciones: la web se siente estática y nada profesional.
- No se ha seguido el mandato anterior ni los documentos de `docs/redesign/`.

**El cambio debe ser total.** Esto no es «retocar»: es dejar **todas y cada una de las páginas, sección por sección, de forma concienzuda**, con un resultado espectacular, completamente profesional, con animaciones, transiciones y microinteracciones reales, y funcional. Mejora en todos los aspectos, sobre todo en lo visual, y **en TODAS las páginas**. Invoca todos los subagentes que necesites.

Todas las marcas ✅ del primer pase en `COBERTURA.md` quedan **anuladas** hasta que pasen las puertas mecánicas de esta ronda.

## 1. FASE R0 — LECTURA OBLIGATORIA Y AUTOPSIA (antes de tocar una sola línea de código)

1. Lee **íntegros**, en este orden: `00-PROMPT-MAESTRO.md`, `docs/redesign/01…05`, `docs/redesign/DESIGN.md`, `REFERENCIAS.md`, `DECISIONES.md`, `COBERTURA.md`, `INVENTARIO.md`, `ANTES.md` y, si existen, `docs/redesign/references/` y `baseline/`.
2. Crea `docs/redesign/LECTURA-RONDA2.md` con:
   - La salida literal de `sha256sum` de cada documento leído y de `scripts/*.mjs` (los scripts no se pueden modificar: ver §8).
   - Por documento, **5 reglas textuales** (cita corta) que afectan a esta ronda.
   - **Autopsia del primer pase**: una fila por cada regla R1–R9 y cada puerta G1–G8 del mandato maestro, con `CUMPLIDA` o `INCUMPLIDA` y la evidencia (comando + salida resumida). No vale «creo que sí».
3. Resetea a `⬜` todas las filas de `COBERTURA.md`.
4. **Regla para subagentes:** cada subagente recibe los documentos que le afectan y **su primer mensaje cita** la sección de `DESIGN.md` y la ficha de página/sección que va a aplicar. Quien no cite, se descarta y se relanza.

**Pasa cuando:** `LECTURA-RONDA2.md` existe, completo, con la autopsia basada en evidencia.

## 2. FASE R1 — PUERTAS MECÁNICAS Y BACKLOG MEDIDO

Herramientas (no se modifican, no se esquivan):

| Script | Qué impone | Falla (código 1) cuando… |
|---|---|---|
| `node scripts/audit-pages.mjs --base <URL> --routes "<TODAS las rutas del inventario>" [--storage auth.json]` | Medición por ruta y **por sección** a 390 / 768 / 1440 px | Desbordamiento horizontal · sección descentrada (±32 px) · texto a menos de 12 px del borde en móvil · colores fuera de los tokens `:root` (> 3 %) · no hay tokens de color · más de 3 familias tipográficas · menos del 70 % de las secciones bajo el pliegue con entrada al scroll · menos del 80 % de elementos interactivos con respuesta al hover · movimiento sin regla `prefers-reduced-motion` · página sin ninguna transición/animación |
| `node scripts/audit-code.mjs init …` / `check` | **Revisión exhaustiva de TODO el código** con libro de registro, revisor cruzado y detección de estilos antiguos | Fichero sin revisar · sin revisor cruzado distinto · «rediseñado» sin cambios reales · colores literales, estilos en línea, `!important`, valores arbitrarios o paleta por defecto de Tailwind · **cualquier resto de la paleta, variables o tipografías ANTIGUAS** medidas en `baseline/` · script de auditoría modificado |
| `node scripts/extract-content.mjs --compare …` | Mismo contenido | Cadenas del «antes» ausentes sin registrar en `CAMBIOS-DE-TEXTO.md` |
| `build` de producción + tests del repo | No se rompe nada | Cualquier error |

Requisitos para que las mediciones tengan sentido:
- Los **tokens de color del sistema de diseño deben estar como variables CSS en `:root`** (nombres que empiezan por `--`). Si no existen, la auditoría falla y el trabajo no vale.
- Si `baseline/` no existe, genera la línea base desde el commit **anterior al rediseño**: `git worktree add ../mp-antes <commit-previo>`, levántalo y ejecuta `capture-reference.mjs --id mp-antes-<ruta> --out docs/redesign/baseline` por ruta.

Haz ahora, en este orden:
1. `node scripts/audit-pages.mjs …` sobre **todas** las rutas. El `AUDITORIA.md` resultante es el **backlog medido**: cada fallo es trabajo pendiente. Guárdalo como `docs/redesign/auditoria/AUDITORIA-INICIAL.md`.
2. `node scripts/audit-code.mjs init --tokens <ficheros donde viven los tokens nuevos> --oldFrom docs/redesign/baseline --shards <N>` con **N ≥ 6** (si hay más de ~150 ficheros, un lote por cada ~25). Genera el manifiesto, el libro `REVISION-CODIGO.md` y `shards/shard-N.txt`.

## 3. FASE R2 — OLA A: REVISIÓN EXHAUSTIVA DEL CÓDIGO CON SUBAGENTES (nada sin revisar)

Lanza **un subagente revisor por lote, en paralelo**, cada uno dueño de su `shards/shard-k.txt`. Por **cada fichero** de su lote:
1. Léelo entero (no por extractos).
2. Elimina todo el legado que detecta `audit-code.mjs` (colores literales, estilos en línea, `!important`, valores arbitrarios, paleta por defecto, rastro de lo antiguo) y migra a tokens y componentes del sistema.
3. Completa todo lo que falte: **estados** (por defecto, hover, foco visible, activo, deshabilitado, carga, vacío, error), responsive y accesibilidad.
4. Elimina **código muerto**: estilos, componentes y utilidades sin uso, duplicados «viejo/nuevo», ficheros `*-old`, `*-v1`. Verifica con `build` y capturas.
5. Anota en `REVISION-CODIGO.md`: estado (`rediseñado` · `sin-cambios` con notas ≥ 25 caracteres · `eliminado` · `logica-sin-impacto-ui`), agente y notas concretas.

Los ficheros de **lógica** (acciones, API, utilidades) los revisa igual el dueño del lote: confirma que no tienen impacto visual y que los datos que llegan a la UI se presentan bien (formatos, valores vacíos, errores). Prohibido tocar autenticación, RLS, esquemas y secretos.

Esta ola también construye la **base compartida** que usarán todas las páginas: tokens, componentes primitivos (botón, input, tarjeta, tabla, modal…) y las **primitivas de movimiento** (§6).

## 4. FASE R3 — BUCLE PÁGINA POR PÁGINA, SECCIÓN POR SECCIÓN (todas, sin saltar ninguna)

Orden por prioridad P0 → P1 → P2 de `COBERTURA.md`, pero **se hacen todas**. Asigna un **responsable por ruta** (varios en paralelo). Cada responsable, para su ruta:

1. Lee la ficha de la página (`03 §C2`) y las secciones de `DESIGN.md` que aplica.
2. Toma la lista de **secciones** de `AUDITORIA-INICIAL.md` (tabla por sección) y crea `docs/redesign/secciones/<ruta>.md` con **una ficha por sección**:
   - Estado actual: captura y métricas.
   - Defectos concretos, expresados de forma medible (p. ej. «contenido pegado a la izquierda, Δ de márgenes = …px», «sin entrada al scroll», «color fuera de tokens: …»).
   - Diseño nuevo: composición, jerarquía, imagen/asset (`04-ASSETS.md`), componentes, **movimiento** (qué se anima y con qué token de §6).
   - Referencia primaria y `fuente:` de cada valor.
3. **Implementa sección por sección.** Tras **cada** sección: `build`, captura de esa sección y **examen de la captura** (si tu modelo no puede ver imágenes, delega la revisión visual en un subagente que sí pueda; si ninguno puede, usa DOM y métricas y dilo en el informe).
4. Al terminar la ruta: `node scripts/audit-pages.mjs --base <URL> --routes "<ruta>"` **hasta PASS**. Cada fallo se corrige y se vuelve a medir.
5. Pulido con las skills, **un comando cada vez** y mirando el resultado entre uno y otro: `/impeccable critique` → corregir → `audit` → `polish`; Emil Kowalski `find-animation-opportunities` → `review-animations` → `break-ui`; `mobile-native`.
6. Solo entonces: `✅` en `COBERTURA.md`, con enlace a la captura «después» y a la salida de la auditoría.

**Nada de esto puede quedar sin diseñar** (el primer pase falló aquí): tablas, formularios, inputs, selects, todas las variantes de botón, modales, drawers, menús desplegables, tabs, acordeones, badges, paginación, migas, tooltips, avisos/toasts, skeletons, spinners, estados vacíos, errores, `loading`, `error` y `not-found`, páginas legales, acceso/registro/recuperación, perfil, pedidos e historial, paneles internos, plantillas de correo HTML si existen en el repo, favicon e imágenes OG.

## 5. ESTÁNDAR VISUAL MÍNIMO (medible o verificable en captura)

- **Un único sistema de contenedor** (ancho máximo y márgenes laterales de los tokens). El contenido está **centrado**; la asimetría es una decisión de composición declarada con `data-asym` y justificada (máx. 25 % de las secciones).
- Cada sección tiene **un punto focal claro**, jerarquía tipográfica de la escala del sistema, **ritmo vertical** consistente de la escala de espaciado y **un elemento visual con carácter** (imagen real, ilustración, textura o gráfico de la carpeta de assets). Nada de muros de texto ni de bloques «vacíos».
- Cero elementos «de fábrica» sin diseñar. Cero mezcla de estilos nuevos y antiguos.
- Máximo 3 familias tipográficas, todas de los tokens; color **solo** de los tokens.
- Responsive impecable de 360 a 1920 px, sin desbordes, con navegación móvil diseñada (no un menú de escritorio comprimido).
- Todo valor de diseño con `fuente:` (R1). Imagen de producto real (R9). Contenido existente intacto (R2).

## 6. SISTEMA DE MOVIMIENTO OBLIGATORIO (la web no puede sentirse estática)

El lenguaje de movimiento sale de `DESIGN.md §6`, con duraciones y curvas **medidas en las referencias** (`animations.json`, `interactions.json`). Si hace falta una librería, usa la que el proyecto ya tiene o la que respalden las referencias primarias, instala solo lo necesario y regístralo en `INSTALADO.md`. Mínimo exigido y **medido por `audit-pages.mjs`**:

- **Entrada al scroll** en todas las secciones bajo el pliegue (con escalonado de sus elementos), y **coreografía de entrada** del hero.
- **Cabecera viva**: reacciona al hacer scroll (tamaño, fondo, sombra o desplazamiento).
- **Hover, foco y pulsación** en todos los elementos interactivos (≥ 80 %), con transición; tarjetas con respuesta (elevación o desplazamiento), botones con feedback de pulsación.
- **Transiciones entre rutas** (View Transitions API o la técnica de la referencia primaria) con alternativa sin movimiento.
- Menús, modales, cajones y desplegables con **entrada y salida** animadas; listas con escalonado; imágenes con aparición al cargar; **skeletons con brillo** en cargas; formularios con validación y estados de envío/éxito animados.
- Contadores o barras de progreso **solo con cifras reales** (R2). Efectos de profundidad o parallax solo donde la referencia primaria lo justifique y sin marear.

Calidad del movimiento: animar preferentemente `transform` y `opacity`; duración y curva siempre de los tokens; el contenido nunca queda oculto si falla el script; **`prefers-reduced-motion` respetado**; sin saltos de maquetación; rendimiento dentro de los umbrales de Lighthouse del mandato maestro. Animar con propósito: guiar la mirada, confirmar acciones, dar continuidad; no animar por animar. Exenciones puntuales con `data-motion="none"` (máx. 25 % de secciones) y justificadas en la ficha de la sección.

## 7. SUBAGENTES (invoca todos los que necesites; mínimo estos roles)

| Rol | Cantidad | Entrega |
|---|---|---|
| Revisores de código por lote | ≥ 6 (según `shards`) | Libro `REVISION-CODIGO.md` rellenado por lote |
| Responsables de ruta | uno por ruta o grupo, en paralelo | Ficha por sección + auditoría PASS + `✅` |
| Ingeniero de movimiento | ≥ 1 | Primitivas de movimiento y su documentación en `DESIGN.md §6` |
| Guardián del sistema de diseño | ≥ 1 | Revisa que no entra ningún valor sin `fuente:` ni legado |
| Revisores cruzados | tantos como lotes | Revisan un lote **ajeno** (rotación k → k+1) y rellenan «revisor cruzado» |
| QA con Playwright | ≥ 1 | Recorridos, viewports, estados, Lighthouse, paridad de contenido |
| Assets | ≥ 1 | Manifiesto `ASSETS.md` y piezas faltantes |

Cada encargo lleva: el paquete de trabajo, las **secciones de `DESIGN.md` por número**, la ruta de la referencia primaria y un **criterio de aceptación que es un comando que debe devolver 0**. Nunca valores CSS en el encargo.

## 8. FASE R4 — OLA B Y CIERRE MECÁNICO

1. **Revisión cruzada:** cada lote lo revisa un agente distinto con `git diff` y capturas; devuelve incumplimientos al dueño; rellena «revisor cruzado».
2. Ejecuta y **pega la salida literal** en `docs/redesign/RONDA2-RESULTADO.md`:
   - `node scripts/audit-code.mjs check` → **PASS**
   - `node scripts/audit-pages.mjs --base <URL> --routes "<TODAS>"` → **PASS**
   - `node scripts/extract-content.mjs --compare docs/redesign/contenido-actual docs/redesign/contenido-nuevo --allow docs/redesign/CAMBIOS-DE-TEXTO.md` → código 0
   - `build` de producción y tests del repo → verdes
   - Lighthouse según G6 del mandato maestro
3. Actualiza `COMPARATIVA.md`, `DISTINTO-DEL-ANTES.md`, `ENTREGA-LUNES.md` e `INFORME-DE-TRABAJO.md` con los resultados de esta ronda.

**Anti-trampas (prohibido, y los scripts lo detectan o dejan rastro):** modificar `scripts/*.mjs` o sus umbrales · añadir exenciones `redesign-allow`, `data-asym` o `data-motion="none"` en masa · marcar `rediseñado` sin cambios reales · marcar ✅ sin captura «después» y sin PASS · ocultar contenido o estilos antiguos con trucos (`display:none`, capas encima) · desactivar reglas · resumir o saltarte documentos · declarar «hecho» sin pegar la salida del comando.

## 9. INFORME Y PARADAS

- Al cerrar cada fase: `FASE Rn ✅/⚠️ | artefactos: <rutas> | verificación: <comando → salida> | pendiente: <filas o fallos concretos>`.
- Si algo no pasa, repórtalo con el fallo exacto y la medida; **nunca** lo marques como hecho. Si el tiempo aprieta, avanza por prioridad P0 → P1 → P2 y di con honestidad el estado real de cada ruta.
- Solo puedes detenerte por B1 (falta algo imprescindible que no puedes obtener), B2 (acción destructiva irreversible) o B3 (contradicción irresoluble con evidencia). Nunca pidas permiso entre pasos.
- Rama `rediseno/v2`, un commit por fase y por ola. No toques producción, secretos, autenticación, RLS ni esquemas.

**Empieza ahora por la Fase R0 y no avances hasta tener `LECTURA-RONDA2.md` completo.**
