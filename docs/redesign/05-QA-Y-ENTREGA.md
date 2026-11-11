# 05 · QA, evidencias y entrega

Todo lo que aquí se pide se prueba con comandos y deja fichero. «Parece que funciona» no es un resultado.

## 1. Matriz de verificación (por cada ruta P0 y P1)

| Comprobación | Cómo se mide | Evidencia (ruta) | Umbral |
|---|---|---|---|
| Viewports 360 · 390 · 768 · 1024 · 1440 · 1920 | Playwright con `setViewportSize`; captura de pliegue y página completa. El script `capture-reference.mjs` ya cubre 1440 y 390 | `docs/redesign/after/<ruta>/…` | Sin desbordes horizontales; nada cortado ni solapado |
| Estados | Forzar vacío, carga, error y sin permisos (datos simulados o cortes de red con Playwright) | capturas por estado | Los cuatro existen y siguen el sistema de diseño |
| Teclado | Recorrido con Tab/Shift+Tab/Enter/Escape; foco siempre visible | informe corto en `qa/teclado-<ruta>.md` | Sin trampas de foco; orden lógico |
| Contraste y accesibilidad | Lighthouse (accesibilidad) + axe sobre la ruta; contraste de cada par de tokens calculado y anotado en DESIGN.md §10 | `qa/lighthouse-<ruta>.json`, `qa/axe-<ruta>.json` | Accesibilidad ≥ 95; texto normal ≥ 4.5:1 |
| Movimiento reducido | Emular `prefers-reduced-motion: reduce` y repetir el recorrido | captura/nota | Sin movimiento no esencial |
| Rendimiento | Lighthouse móvil y escritorio en home y catálogo (`npx lighthouse <URL> --output=json --output-path=…`) | `qa/lighthouse-*.json` | Móvil ≥ 85; SEO ≥ 95; Prácticas ≥ 95; CLS bajo control |
| Consola y red | Playwright recoge `console.error` y respuestas ≥ 400 durante el recorrido | `qa/consola-<ruta>.txt` | Cero errores propios |
| Enlaces | Rastreo interno de enlaces desde cada ruta | `qa/enlaces.txt` | Cero rotos |
| Paridad de contenido | `node scripts/extract-content.mjs --base <URL> --routes "<lista>" --out docs/redesign/contenido-nuevo` y luego `--compare docs/redesign/contenido-actual docs/redesign/contenido-nuevo --allow docs/redesign/CAMBIOS-DE-TEXTO.md --report docs/redesign/paridad-contenido.md` | `paridad-contenido.md` | Código de salida 0 (solo ausencias registradas) |
| Regresión funcional | Recorridos Playwright: acceso, catálogo, pedido y los que existan | `qa/recorridos.md` + capturas | Todos pasan; auth, RLS y API intactas |
| Navegadores | Chromium siempre; WebKit y Firefox si están instalados en Playwright | `qa/navegadores.md` | Sin diferencias de maquetación relevantes |
| Peso | Tamaño transferido y de imágenes por ruta | `qa/peso.md` | Dentro del presupuesto declarado en DESIGN.md §9 |

Rutas privadas: usa `--storage auth.json` en los scripts (se genera con `npx playwright codegen --save-storage=auth.json <URL>` iniciando sesión una vez con una cuenta de prueba). Nunca guardes ese fichero en git.

## 2. Disciplina de pulido con skills

Orden por ruta, **un comando cada vez, mirando el resultado antes del siguiente** (encadenar comandos sin mirar es el error típico):

1. `/impeccable critique` con el contexto de la ruta (objetivo y acción principal del documento de secciones) → ordena problemas por gravedad para ese objetivo, no por estética.
2. Corrige los más graves → `/impeccable audit`.
3. `/impeccable polish` (espaciados, alineaciones, coherencia con DESIGN.md).
4. Emil Kowalski: `find-animation-opportunities` (dónde ayuda animar y dónde sobra) → `review-animations` → `break-ui` (textos largos, listas vacías, cifras enormes) → `mobile-native`.
5. Taste `redesign-existing-projects`: solo para contrastar la dirección; los diales no se suben al máximo.
6. Vuelve a capturar y compara con la referencia primaria.

Las skills proponen; **decide DESIGN.md con sus fuentes**. Si una skill contradice un token con fuente medida, gana el token y se anota en `DECISIONES.md`.

## 3. Evidencia antes/después

`docs/redesign/COMPARATIVA.md`, una fila por ruta y viewport:

| Ruta | Viewport | Antes (`baseline/…`) | Después (`after/…`) | Referencia primaria usada | Auditoría (resumen medido) |
|---|---|---|---|---|---|

`docs/redesign/DISTINTO-DEL-ANTES.md`:

| Dimensión | Antes (medido, `baseline/<id>/tokens.json#…`) | Después (`DESIGN.md §…`, fuente) | Diferencia verificable |
|---|---|---|---|
| Paleta | | | |
| Tipografía (familias, escala) | | | |
| Rejilla y contenedor | | | |
| Radios y elevación | | | |
| Tratamiento de imagen | | | |
| Lenguaje de movimiento | | | |

## 4. INFORME-DE-TRABAJO.md (hechos verificables, sin inflar)

Objetivo: dejar constancia de lo realmente hecho en el proyecto, comprobable por cualquiera con acceso al repositorio. Construcción:

```bash
git log --date=short --pretty=format:'%h %ad %an %s' > docs/redesign/qa/git-log.txt
git shortlog -sn --no-merges
git log --since="<fecha de inicio del proyecto o de hace 12 meses>" --stat --pretty=format:'%h %ad %s' | head -n 400
```

Estructura del informe:

1. Rango de fechas, nº de commits propios, áreas tocadas (por carpeta) con recuento.
2. Hitos agrupados por tema (funcionalidades, integraciones, correcciones, infraestructura), **cada uno con hashes de commit** que lo respaldan.
3. Estado actual medido (rutas, componentes, tests, cobertura de la matriz).
4. Lo que **no** se puede demostrar desde el repositorio (trabajo fuera de git, otros repos no indicados) en una sección aparte, marcada como declarado y no verificado.

Reglas: no atribuyas al rediseño trabajo anterior ni al revés; no estimes horas; no uses adjetivos que no estén respaldados por un número o un hash. Incluye otros repositorios solo si se te indica su ruta.

## 5. ENTREGA-LUNES.md (una página)

1. **Qué se ve:** 3 capturas antes/después de las rutas más importantes + enlace a `COMPARATIVA.md`.
2. **Cómo se ha hecho:** método reproducible en 5 líneas (documentos de contexto → referencias capturadas con HTML/CSS reales → sistema de diseño con fuentes → implementación orquestada → QA medido) y enlaces a `docs/redesign/`.
3. **Trabajo previo verificable:** resumen de `INFORME-DE-TRABAJO.md`.
4. **Métricas medidas:** Lighthouse antes/después, rutas cubiertas (de COBERTURA.md), paridad de contenido, errores de consola.
5. **Qué queda:** filas con estado ⚠️ y plan, sin maquillar.
6. **Cómo verlo:** comando local, URL de preview si existe, y plan de reversión (rama `rediseno/v2`, cómo volver).

**Guion de demo de 5 minutos** (P0): hogar → catálogo → ficha de producto → acceso → pedido → móvil. Cada paso con la captura de respaldo por si falla la red.

## 6. Cierre

La entrega se da por buena cuando se cumplen G1–G8 de `00-PROMPT-MAESTRO.md` con evidencia, o cuando cada puerta no cumplida figura en `DECISIONES.md` con causa medida y plan.
