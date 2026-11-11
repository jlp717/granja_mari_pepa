# 01 · Metodología del vídeo y cómo se aplica aquí

## Ficha del vídeo

- **Título:** «Diseña webs con Claude que NO parezcan hechas con IA» (en inglés en los metadatos: «Design websites with Claude that DON'T look like they were made with AI»)
- **Canal:** OscarRGB · **Publicado:** 14 jul 2026
- **URL:** https://www.youtube.com/watch?v=VcFzrbJy9FI
- **Tesis (según la descripción del autor):** las webs con IA «en dos prompts» son un mito. El autor lleva más de cuatro meses haciendo webs con IA para clientes reales y muestra el proceso completo. La IA acelera lo que ya sabes hacer; si no pones tú el criterio, devuelve la media de internet, que por definición es genérica y se nota a distancia.

## Estado de verificación (léelo antes de fiarte de este documento)

| Parte | Estado |
|---|---|
| Título, canal, fecha, descripción y capítulos con marcas de tiempo | **Verificado** (metadatos del vídeo) |
| Herramientas y servicios nombrados en la descripción | **Verificado** (lista abajo) |
| Transcripción completa, nombres concretos de sitios de referencia (5:19–8:17), de componentes animados listos para copiar (7:31) y detalle de cada plantilla de documento | **NO verificado**: YouTube bloqueó el acceso automático al contenido. No se ha inventado nada de esas partes |

**Acción de Fase 0 (paso 6):** intenta obtener la transcripción y completa los huecos marcados con ⟦pendiente-transcripción⟧. Si no es posible, el protocolo `02` ya cubre esas capas con captura en vivo, así que no se bloquea nada.

## Capítulos verificados (marcas de tiempo del autor)

0:00 mito de las «webs en dos prompts» · 1:14 por qué una web «huele a IA» · 1:52 la idea clave: el criterio lo pones tú · 2:01 los documentos que se preparan antes del primer prompt · 3:00 referencias bien citadas + HTML/CSS reales · 3:44 el documento de secciones (ahorra tokens) · 4:01 los dos documentos profesionales: cómo hacer un brief y el prompt maestro · 5:19 dónde conseguir referencias reales · 6:06 microinteracciones y animaciones · 6:37 Mobbin y Refero: flujos de apps · 7:31 componentes animados listos para copiar · 8:17 extraer estilos: CSS Peeper y html.to.design · 9:25 carpeta propia de assets (80 % del resultado) · 9:49 generación de assets: Higgsfield, Spline, Recraft y más · 11:13 skills y plugins para pulir (útiles, no mágicos) · 11:50 lo que de verdad importa: estrategia antes que diseño · 12:35 gestionar la IA: iterar y corregir · 12:57 resultado final

## Herramientas nombradas en la descripción (verificado)

CSS Peeper · html.to.design · Mobbin · Refero · Higgsfield (vía MCP para Claude) · Unicorn Studio · Spline · Recraft · Magnific · Lottie · comunidad Repeat (donde el autor organiza sus plantillas de contexto; no son públicas, por eso este pack las reconstruye a partir de lo que el vídeo describe).

## Los principios y su traducción operativa

| # | Principio del vídeo | Qué significa en este rediseño | Artefacto que lo prueba |
|---|---|---|---|
| 1 | El criterio lo pones tú; sin criterio, media genérica | El criterio vive en documentos, no en la cabeza del modelo: brief, secciones, DESIGN.md con fuentes | `03-BRIEF-Y-SECCIONES.md`, `DESIGN.md` |
| 2 | Documentos de contexto **antes** del primer prompt: contenido, brief, referencias, secciones, cómo hacer un brief, prompt maestro | Fase 0–2 producen esos documentos antes de tocar código de UI | `CONTENIDO.md`, brief, `REFERENCIAS.md`, secciones, `00-PROMPT-MAESTRO.md` |
| 3 | Referencias bien citadas, con el **HTML y CSS reales**: la IA no tiene ojos y, sin código, adivina | Cada referencia se captura en vivo con `scripts/capture-reference.mjs` (DOM renderizado, CSS original, valores medidos) | `references/<id>/…` |
| 4 | El documento de secciones ahorra tokens | Cada página se describe una vez (objetivo, orden de secciones, datos, referencia primaria) y los subagentes lo leen en vez de re-derivarlo | Parte C de `03` |
| 5 | Referencias reales para cabeceras, footers, heros, CTAs, microinteracciones y animaciones en código copiable | Capas obligatorias de la Fase 2; hover medido y `@keyframes` extraídos | `interactions.json`, `animations.json` |
| 6 | Herramientas para extraer estilos y assets (CSS Peeper, html.to.design) | El script hace la extracción automatizable y medible; CSS Peeper / html.to.design quedan como apoyo manual si una web bloquea al navegador automatizado | `02` §4 |
| 7 | La carpeta propia de assets da el carácter (80 % del resultado) | Fase 4 dedicada, con manifiesto y reglas | `04-ASSETS.md` |
| 8 | Generar assets con Higgsfield, Unicorn Studio, Spline, Recraft, Magnific, Lottie | Se usan según disponibilidad de cuentas y siempre bajo la regla de imagen de producto veraz | `04` |
| 9 | Skills y plugins para SEO, microcopy y QA: útiles, no mágicos | Se instalan y se usan en la Fase 6, subordinados al criterio de DESIGN.md | `00` §5 |
| 10 | Estrategia antes que diseño: una web bonita que no vende no sirve | Fase 1 obliga a responder quién compra, qué necesita hacer y qué pruebas reales existen **antes** de elegir estética | Partes A y B de `03` |
| 11 | Gestionar la IA: iterar y corregir | Cada paquete de la Fase 5 cierra con captura, comparación con la referencia y auditoría; los fallos vuelven al agente con la evidencia | `COBERTURA.md`, `DECISIONES.md` |

## Lo que NO se importa del vídeo

El vídeo trata sobre diseñadores que trabajan para clientes. Aquí la parte de estrategia se limita a lo que se puede sostener con evidencia del propio proyecto (repo, BD, web corporativa pública). No se hace «investigación de usuarios» simulada ni se rellenan pain points por intuición.
