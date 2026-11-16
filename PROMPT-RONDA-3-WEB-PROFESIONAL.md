# MANDATO FINAL — WEB PROFESIONAL (sin prototipos, sin «loop AI»)

> Pega esto entero en Chief. **Sustituye la estructura de fases y la burocracia de los mandatos anteriores.** Se conservan sus reglas de fondo: contenido y funcionalidad existentes intactos, ningún dato de negocio inventado, y no tocar autenticación, RLS, esquemas ni secretos. Si algo contradice a los mandatos anteriores, manda este.

---

## 1. VEREDICTO

El rediseño actual **no es profesional**: se ve como un prototipo básico, con estilos pobres y sin carácter. Es justo lo que el vídeo de OscarRGB llama web «hecha con IA». Quiero una web que parezca de **estudio de diseño con presupuesto de verdad**.

**Referencia de NIVEL (no de estilo):** https://palosecodesign.com. Se ve realmente profesional y muy vistosa. No quiero su estética ni su marca: quiero **su nivel de acabado, personalidad y vida**, con identidad propia de distribuidor HORECA.

Lo que se lee en el HTML de su portada (captúrala y verifícalo tú, no te fíes de esta lista):
- Titular gigante con voz de marca y pictogramas incrustados dentro de la propia frase.
- Etiquetas de cursor («Drag», «Ver Proyecto») que apuntan a un cursor personalizado.
- Textos repetidos que apuntan a marquesinas, en la navegación y en el CTA final; cada enlace de navegación con su propio microtexto.
- Servicios numerados con imagen grande; casos con año, categoría y etiquetas; slider con contador.
- Detalles lúdicos de marca (texto circular, un ojo en el pie, GIF animado) y copy con personalidad.

Lo que **no** se sabe leyendo texto (colores, tipografías, curvas, duraciones, librerías de animación) **se mide** con `scripts/capture-reference.mjs --video`. Cero especulación.

## 2. QUÉ SIGNIFICA «PROFESIONAL» AQUÍ

- **Remodelación completa de estilos.** Se reescribe el sistema visual desde cero (tokens, tipografía, rejilla, componentes). Todo lo antiguo se borra: ni estilos viejos mezclados, ni componentes duplicados, ni «lo dejo por si acaso».
- **Cada página es una composición propia**, no una plantilla: escala tipográfica con contraste fuerte, ritmo entre secciones, imagen protagonista a gran formato, jerarquía clara, contenido centrado o asimetría **intencionada**.
- **Dirección de arte con concepto**: una idea visual reconocible para Granja Mari Pepa (alimentación, frío, producto, hostelería) que recorre toda la web.
- **Firmas de marca memorables (mínimo 4)** que vuelvan en varias páginas: por ejemplo cursor contextual («Ver producto», «Arrastrar»), marquesinas con datos reales, titulares con elementos gráficos incrustados, un sello o elemento lúdico propio, slider arrastrable con contador, navegación con microtexto, cierre con CTA gigante. Elige y adapta según lo que midas en las referencias.
- **Movimiento coreografiado, no decorativo**: entrada del hero, entradas al scroll con escalonado, cabecera que reacciona, hover/foco/pulsación en todo lo interactivo, transiciones entre rutas, skeletons, modales y menús con entrada y salida. Reducido si el usuario lo pide.
- **Imagen real de producto** a gran tamaño (nunca producto «inventado» con IA). Ilustración, texturas y elementos gráficos propios con un único lenguaje visual.
- **Copy con voz** a partir del contenido existente. Se puede reescribir microcopy; se registra en `CAMBIOS-DE-TEXTO.md`. Nunca cifras, clientes, certificaciones ni años que no existan en el repo, la BD o la web corporativa.
- **Funcional y completo**: todas las rutas y todos los estados (vacío, carga, error, 404, formularios, tablas, modales). Nada se rompe.

## 3. SEÑALES DE PLANTILLA DE IA: PROHIBIDAS

Hero centrado con dos botones y debajo tres tarjetas iguales · rejillas de tarjetas con esquinas redondeadas y sombra suave por todas partes · degradados morados/azules y «blobs» · cristal translúcido en todo · tipografía de sistema o la misma familia para todo · iconos genéricos en círculos de color · emojis como iconos · secciones todas con el mismo espaciado y la misma altura · imágenes de stock genéricas o ausentes · textos de relleno · botones y formularios sin diseñar · ausencia total de movimiento o animaciones iguales en todo.

## 4. EL MÉTODO DEL VÍDEO, AL PIE DE LA LETRA

Fuente: `docs/redesign/01-METODOLOGIA-VIDEO.md` y el resto de `.md` de `docs/redesign/`. **Léelos enteros** antes de empezar y **cítalos en cada encargo a un subagente**. Resumen operativo:

1. El criterio lo pones tú: sin documentos de contexto, la IA devuelve la media genérica de internet.
2. Primero los documentos (contenido, brief, referencias, secciones, assets) y después el código.
3. Referencias reales con su **HTML y CSS reales**: la IA no tiene ojos. Se capturan en vivo, no se describen de memoria.
4. Documento de secciones: cada página descrita una vez (objetivo, orden de secciones, datos, referencia primaria).
5. Carpeta propia de assets: es lo que da carácter (el vídeo habla del 80 %).
6. Skills y plugins de pulido (Impeccable, Emil Kowalski, Taste, SEO/microcopy/QA): útiles, **no mágicas**; el criterio manda sobre ellas.
7. Estrategia antes que estética; y gestionar la IA es iterar y corregir.

## 5. ANTES DE ESCRIBIR CÓDIGO (en paralelo, con el equipo)

- **Capturar referencias:** `palosecodesign.com` más 6–8 de calidad comparable (e-commerce y marcas de alimentación, B2B de pedidos, estudios premiados), descubiertas en Mobbin/Refero/galerías y **capturadas con el script** (`--video`). De cada una: qué se aprende y qué valores se miden.
- **Director de arte** (modelo con visión, el más capaz que tengas): escribe `docs/redesign/DIRECCION-DE-ARTE.md` en una página: concepto, voz, tipografías y paleta **con fuente** (captura), las firmas de marca elegidas, qué se elimina del diseño actual.
- **Assets:** plan y producción por sección, con imagen real de producto (`04-ASSETS.md`).
- Instala lo necesario (§ skills del vídeo) y verifica cada origen antes de ejecutar.

## 6. CÓMO SE TRABAJA: ESCUADRÓN EN PARALELO (OBLIGATORIO)

El fallo anterior fue trabajar con **un solo subagente que entregaba y se cerraba**. Esto se hace con el patrón **orchestrator-workers + evaluator-optimizer**:

- **Chief orquesta, reparte y verifica; Chief no programa la web.**
- En la primera tanda lanza **como mínimo 8 subagentes a la vez**, cada uno con su propiedad exclusiva (sin pisarse; ramas o worktrees por paquete):

| Rol | Cuántos | Es dueño de |
|---|---|---|
| Director de arte (con visión) | 1 | La visión; aprueba o rechaza cada entrega con capturas |
| Sistema de diseño y tokens | 1 | Reescritura completa de estilos, tokens y componentes base |
| Ingeniero de movimiento | 1–2 | Primitivas de animación, transiciones de ruta, cursor, marquesinas |
| Productor de assets | 1 | Imagen y piezas gráficas; manifiesto |
| Constructores de páginas | 3–5, por grupos de rutas | Cada página, sección por sección, hasta dejarla impecable |
| Crítico hostil (con visión, **distinto** del director) | 1 | Busca fallos y huele a plantilla; compara con la referencia de nivel |
| QA/auditor | 1 | Playwright, viewports, estados, Lighthouse, paridad de contenido |
| Revisores de código | ≥ 4, por lotes | Revisar **todo** el código sin saltar ficheros y borrar lo antiguo |

- **Un subagente que entrega no ha terminado.** Su entrega pasa por director de arte y crítico; se le **devuelve con correcciones concretas y capturas** y se reutiliza hasta que pase. Mínimo **3 rondas** de crítica-corrección por página. Si tu sistema no mantiene la sesión, relánzalo con el historial de feedback.
- Los subagentes no cierran: cuando uno acaba, Chief le asigna la siguiente sección, otra ruta o la corrección de lo que haya rechazado el crítico.
- Cada encargo lleva: ruta/sección, referencia primaria, secciones de `DESIGN.md` por número (nunca valores CSS) y **un criterio de aceptación que sea un comando o una comparación de capturas**.
- Revisión visual: **abre las capturas**. Quien no pueda ver imágenes no hace dirección de arte ni crítica.

## 7. CUÁNDO SE ACEPTA

Una página está terminada solo si se cumple todo:
1. El **crítico hostil firma** con capturas comparadas contra la referencia de nivel, a 1440 y 390 px, y no encuentra señales de plantilla (§3).
2. `node scripts/audit-pages.mjs --base <URL> --routes "<ruta>"` → **PASS** (centrado, márgenes móviles, colores solo de tokens, entrada al scroll, hover, `prefers-reduced-motion`).
3. Sin estilos antiguos en su código: `node scripts/audit-code.mjs check` → **PASS** (todos los ficheros revisados y con revisor cruzado).
4. Contenido existente intacto (`extract-content.mjs --compare`), `build` de producción y tests en verde, recorridos funcionando.

La web está terminada cuando **todas** las páginas cumplen esto y se entregan: capturas antes/después de cada ruta, salida literal de los comandos y un resumen con lo realmente hecho (`ENTREGA-LUNES.md`, `INFORME-DE-TRABAJO.md` con commits reales).

## 8. REGLAS DE EJECUCIÓN

- Autonomía total: no pidas permiso entre pasos. Solo paras por falta de algo imprescindible, una acción destructiva irreversible o una contradicción que la evidencia no resuelva.
- **Evidencia sobre autoinforme:** nada se da por hecho sin captura o salida de comando. Prohibido modificar `scripts/*.mjs` o sus umbrales y esquivar las auditorías con exenciones en masa o con trucos (ocultar estilos viejos, capas encima).
- Prioridad si el tiempo aprieta: cabecera/pie/navegación, home, catálogo, ficha de producto, acceso y pedido; después el resto. Se hacen **todas**, y el informe dice con honestidad el estado real de cada una.
- Rama `rediseno/v2`, commits por tanda. Valores de diseño siempre con `fuente:` (captura).

**Empieza ahora: captura las referencias, lanza el escuadrón completo en paralelo y no cierres ningún subagente hasta que su trabajo esté aceptado.**
