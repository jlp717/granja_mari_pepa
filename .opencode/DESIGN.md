# DESIGN.md — Granja Mari Pepa

> Especificación de rediseño completo. Documento principal autocontenido.
> Acompañan: [COMPONENTS.md](COMPONENTS.md) · [MOTION_GUIDELINES.md](MOTION_GUIDELINES.md) · [COPYWRITING.md](COPYWRITING.md) · [STYLES_MIGRATION.md](STYLES_MIGRATION.md) · [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) · [QA_CHECKLIST.md](QA_CHECKLIST.md) · [page_map.json](page_map.json) · [component_map.json](component_map.json).

---

## 0. Sobre este documento

Este `DESIGN.md` **sustituye por completo** al anterior. El anterior partía de un diagnóstico erróneo: caracterizaba Joby Aviation como _"dark aerospace premium"_ con paleta dorada `#C8A96E` sobre fondo `#000000`. La inspección directa del CSSOM de Joby (variables `:root`, computed styles, capturas en 1440 y 390) demuestra que **Joby es una web editorial cálida** con fondo crema `#f5f4df`, near-black `#0e1620`, y bloques de color (azul `#007ae5`, naranja `#eb6110`, taupe, rosa) que cambian por página. Esta nota se vuelve a documentar por escrito en §4 con la evidencia.

Sobre esa base se rehace la dirección visual de Mari Pepa.

**Principio rector**: Mari Pepa **no debe parecerse a Joby**. Debe parecer una marca local mediterránea profesional con la misma **madurez de diseño** que Joby — composición editorial, ritmo de bloques de color, tipografía display que respira, fotografía real, motion contenido — aplicada al territorio Levante, al cliente B2B HORECA y a los 60 años de oficio de Mari Pepa.

---

## 1. Resumen ejecutivo

### 1.1. La marca real (verificada en producción)

- **Razón social**: Granja Maripepa, S.L.
- **Actividad**: distribución HORECA — congelados, refrigerados, helados, temperatura ambiente — para hostelería y restauración.
- **Fundación**: Lorca (Murcia), **1966**. (`acerca` y home dicen "55 años" y "+55 Años de Experiencia"; 2026 − 1966 = **60 años**. Math error que debe corregirse).
- **Cobertura**: dos delegaciones — **Lorca/Murcia** y **Almería**.
- **Sede de Lorca**: Polígono Industrial **Saprelorca** (verificado en `<title>` de `/es/lorca`).
- **Posicionamiento**: Distribuidor Oficial Nestlé. Marcas distribuidas: Nestlé, Grupo Topgel, Panamar, entre otros.
- **Cliente B2B**: chef, jefe de compras, restaurador, panadero, heladero. Tiene "Área Clientes" con login por código de cliente + password.
- **Sellos**: ISO 9001, Energía 100% Verde.
- **Idiomas activos**: ES/EN/DE/IT/ZH (multimercado real).
- **Contacto**: 968 46 75 14 / 639 77 86 55 · pedidos@granjamaripepa.com · L–V 08:00–13:00 / 16:00–19:00.

### 1.2. El problema actual

1. **Identidad fracturada**. El hero es un bloque cinematográfico oscuro con vídeo de aurora azul; el resto del sitio es claro `#F6F7F8`. La marca cambia tres veces en un viewport.
2. **Estética IA-template** en todas las páginas: Inter Black 900 + uppercase + degradado azul→morado→rosa + pildoras "✨ CATÁLOGO PREMIUM ⚡" + glow. Es el cliché visual de página generada por LLM.
3. **`/productos` está como "Próximamente"** — el catálogo es la primera promesa de la home y entra a una pantalla con icono candado. Bloqueante de conversión.
4. **Páginas existen en disco pero devuelven 404** en producción: `/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo`. Restos de un intento previo de imitar Joby por nombres de ruta.
5. **Chrome triple en mobile** (locale + promo + header) come el 18% del viewport.
6. **i18n a medias**: footer renderiza claves crudas `footer.schedule`, `es Lorca, Murcia`.
7. **Math inconsistente**: "55 años" en `/acerca` y `/lorca` vs. fundación 1966 = 60 años.
8. **Copy genérico**: "selección premium cuidadosamente elegidos para satisfacer los más altos estándares" / "Nuestro equipo de expertos está disponible para resolver tus dudas, personalizar soluciones y acompañarte en cada paso hacia el éxito" — frases reciclables al 100%.
9. **`/productos/` carpeta** contiene 7 archivos `.bak` / `_old` / `_broken` / `_with_errors` — historia abandonada.
10. **Globe 3D en `/contacto`** (heading "Globo Interactivo 3D"): R3F cargado para una página de teléfono y formulario. Coste de bundle sin retorno funcional.

### 1.3. La oportunidad

Mari Pepa tiene **material narrativo de primera** que el diseño actual desperdicia:
- Una historia (Lorca, 1966; tres generaciones, si se confirman; Levante mediterráneo).
- Un cliente concreto (hostelería profesional).
- Catálogo con marcas reconocibles (Nestlé, Topgel, Panamar) que prestan autoridad.
- Producto fotogénico (mar, carne, repostería, helado).
- Territorio (Murcia, Almería, Lorca, Saprelorca) — geografía gastronómica reconocible.
- 1.500+ referencias declaradas (verificable con cliente).

### 1.4. Dirección recomendada (diferencia clave)

| Eje | Actual (mari-pepa.com) | Nuevo |
|---|---|---|
| Mood | "Cinematic dark tech" | Editorial mediterráneo profesional |
| Body bg | `#F6F7F8` (slate frío) | Crema cálida `#F4EFE6` |
| Display type | Inter Black 900 uppercase | Fraunces 600/700 caja baja, _opsz_ variable |
| Accent | Azul `#0B64F4` + degradados | Paprika `#C24A1F` + oliva `#5C6238` + cielo Lorca `#9CB4C2` |
| Hero | Bloque negro cinematográfico estático | Hero pinned con foto real + subtítulos rotantes (Joby pattern) |
| Sección | "Hero + cards + cards + cards" | Capítulos editoriales con bloque de color por página |
| Copy | "Selección premium / máxima calidad" | "Pedidos antes de las 12 h se entregan al día siguiente" |
| Motion | autoplay vídeo + nada más | Lenis + IntersectionObserver + stagger en titulares |
| Chrome mobile | 152 px (3 barras) | ≤ 64 px (1 barra) |

### 1.5. Resultado esperado

Ver §16 para criterios de aceptación globales. Resumen:
- LCP < 2.5 s, CLS < 0.05, INP < 200 ms (Slow 4G).
- Lighthouse a11y ≥ 95.
- Cero overflow horizontal en 360–2560 px.
- `prefers-reduced-motion: reduce` deshabilita Lenis, stagger y reveal.
- Comparado con 5 webs de competidores HORECA tomadas al azar, Mari Pepa es identificable a primera vista por paleta + tipografía sin ver el logo.

---

## 2. Evidencia de exploración

### 2.1. Herramientas usadas

- **Playwright MCP** — navegación, snapshot DOM, screenshots, `page.evaluate` para extraer estilos computados, redimensionar viewports.
- Lectura directa de archivos del repo: `.opencode/CLAUDE.md`, `CONTEXT.md`, `AGENTS.md`, `DESIGN.md` previo, `frontend/app/globals.css` (1.157 líneas), `frontend/tailwind.config.js`, listado de rutas en `frontend/app/[locale]/`, listado de componentes en `frontend/components/`.
- **Sin acceso**: a la consola DevTools embebida del navegador, a Lighthouse remoto, a métricas de analítica del cliente, ni al Figma. Cualquier afirmación que requiera esos datos se marca explícitamente como **[INFERENCIA]**.

### 2.2. Roles cubiertos (subagentes simulados)

Trabajé los bloques en este orden mental, separando responsabilidad:

1. **Auditor (read-only)** — extracción de tokens y computed styles de Joby y Mari Pepa.
2. **UX/UI** — comparativa de jerarquía, ritmo, composición.
3. **Frontend** — inventario de librerías reales en cada sitio, mapeo de componentes en repo.
4. **Motion** — patrones de scroll, sticky hero, fade de subtítulos, reveals.
5. **Copy/storytelling** — análisis de claims, detección de "AI loop", redacción nueva.
6. **Arquitectura de información** — estructura de páginas, mapeo Joby ↔ Mari Pepa.
7. **Documentación técnica** — split en 9 archivos en `.opencode/`.
8. **QA** — checklist, criterios, riesgos.

### 2.3. Páginas Joby exploradas

| URL | Viewport | Snapshot | Pattern hero | Color identidad |
|---|---|---|---|---|
| `/` | 1440, 390 | Sí, multi-scroll (0/1500/3500/6000/9500/13000/16000/footer) | Pinned media + cross-fade subtítulos | Azul `#007ae5` + crema |
| `/` | 390 + menu open | Sí | Hamburger → tipografía display sobre azul | Azul `#007ae5` saturado |
| `/experience` | 1440 | Sí (0/5000/12000/20000) | Idéntico al home — `SectionHeroMedia` reutilizado | Azul + media |
| `/technology` | 1440 | Sí (fold + 8000) | Fullbleed media con caption | Taupe / arena |
| `/company` | 1440 | Sí (fold) | Tipográfico solo, h1 oversized en color contraste | Azul → naranja |
| `/news` | 1440 | Sí (fold + 1000) | Archivo editorial, h1 _Newsroom_ + sidebar filtros | Crema `#f5f4df` |
| `/careers` | 1440 | Sí (fold) | Tipográfico + foto del equipo | **Naranja** `#eb6110` |

> No se exploró `/electric-skies`, `/news/[slug]`, `/privacy-policy`, `/terms-of-use`. Patrón inferido como reutilización del template editorial.

### 2.4. Páginas Mari Pepa exploradas

| URL | Estado | Viewport | Snapshot | Hallazgos clave |
|---|---|---|---|---|
| `/es` | OK | 1440, 390 | Sí (full scroll + mobile fold) | Hero cinematográfico oscuro + 4 secciones genéricas |
| `/es/productos` | **"Próximamente"** | 1440 | Sí | Pantalla candado purple — bloquea conversión |
| `/es/acerca` | OK | 1440 | Sí | Real story con milestones; cada h3 duplicado en DOM |
| `/es/contacto` | OK | 1440 | Sí | Form completo + "Globo Interactivo 3D" injustificado |
| `/es/lorca` | OK | 1440 | Sí | SEO landing con dato concreto (Polígono Saprelorca) |
| `/es/area-clientes` | OK | 1440 | Sí | Login funcional, página menos imitativa |
| `/es/experience` | **404** | — | — | En disco pero no deployed |
| `/es/technology` | **404** | — | — | En disco pero no deployed |
| `/es/company` | **404** | — | — | En disco pero no deployed |
| `/es/sostenibilidad` | **404** | — | — | En disco pero no deployed |
| `/es/noticias` | **404** | — | — | En disco pero no deployed |
| `/es/trabajo` | **404** | — | — | No verificado en navegador, asumido por patrón |
| `/es/checkout` | No probado | — | — | En disco. Asociado a futura UX de pedidos B2B |
| `/es/legal/{privacidad,terminos}` | No probado | — | — | Probable estándar legal |

### 2.5. Viewports probados

| Sitio | 360 | 390 | 430 | 768 | 1024 | 1280 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|
| Joby home | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Joby otras | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Mari Pepa home | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Mari Pepa otras | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

> **Limitación**: 360, 430, 768, 1024, 1280, 1920 no probados. Los breakpoints intermedios se especifican en §10 como **diseño objetivo**, no como observación. [QA_CHECKLIST.md](QA_CHECKLIST.md) exige reproducir la prueba en los tamaños faltantes antes de marcar rediseño como completo.

### 2.6. Tokens reales de Joby (extraídos del CSSOM `:root`)

```
--color-white:        #f5f4df    (crema cálida — body bg)
--color-black:        #0e1620    (warm near-black con tinte azul)
--color-blue:         #007ae5
--color-dark-blue:    #1c3f99
--color-dark-blue-ui: #083e6f
--color-orange:       #eb6110
--color-grey:         #c7c6b6
--color-pink:         #ffd9c9
--color-lightest-red: #fb9da6
--color-light-blue:   #7cc3ff

--base-padding:        4rem      (64px)
--base-font-size:      10px
--design-width:        1600
--grid-columns:        16
--grid-columns-mobile: 6
--gutter-width:        1.6rem    (16px)
--gutter-width-mobile: .8rem     ( 8px)

--ease-power4-out: cubic-bezier(.165,.84,.44,1)
--ease-snappy:    cubic-bezier(.2,.21,0,1)
--title-stagger:  83ms
--title-duration: .667s
--text-stagger:   83ms
--text-duration:  .5s
--line-duration:  .833s

Fonts: jobyDisplay (550 weight), jobyText (400)
H1 desktop home: 80 px / 80 px / -2.4 px ls / fw 550
H1 mobile (390): 49.92 px / 47.4 px / -1.5 px ls
Buttons: border-radius 120 px (pill)
Stack: Next.js + React + Lenis (no GSAP, no Three.js detectados en window)
HTML class: "lenis"
```

### 2.7. Tokens actuales de Mari Pepa (extraídos del CSSOM)

```
body bg:  #F6F7F8 (slate frío)
body fg:  #1D212B
fonts:    Inter (única familia tipográfica)
H1 desktop home: 128 px / 128 px / fw 900 / uppercase
H1 mobile (390): 60 px / 75 px / fw 900 / uppercase
Buttons:  border-radius 9999 px (pill — coincide con Joby)
Stack en disco (CLAUDE.md / AGENTS.md):
  Next.js 14 App Router, Tailwind, GSAP, Framer Motion, Lenis, R3F, RHF, Zod
Stack detectado en runtime al cargar la home:
  ningún global de gsap, R3F, Lenis o Framer expuesto en window (carga lazy)
htmlClass: "scroll-smooth fast-connection"
```

Globals.css del repo (1.157 líneas, `frontend/app/globals.css`) define un sistema HSL shadcn-style con:
- `--background: 220 14% 97%` (slate frío) y `--foreground: 220 20% 14%`
- `--primary: 217 91% 50%` (azul saturado)
- `--accent: 190 95% 40%` (cyan)
- `--purple: 280 75% 55%`
- `--success: 160 84% 35%` (esmeralda)
- `--warning: 38 92% 50%` (ámbar)
- `--shadow-glow-blue`, `--shadow-glow-green`, `--shadow-glow-purple` — sombras "neon"
- Comentarios de cabecera: `🎨 PREMIUM DESIGN SYSTEM - LINEAR/ARC INSPIRED` — **tercera referencia distinta** (CLAUDE.md → Joby; DESIGN.md viejo → Joby; globals.css → Linear/Arc). Las tres apuntan a estéticas distintas y ninguna a comida HORECA.

### 2.8. Inferencias (no verificadas en navegador)

Marcadas como **[INFERENCIA]** en el resto del doc:
- Las páginas internas de Joby `/electric-skies`, `/news/[slug]`, etc., aplican el mismo lenguaje editorial.
- Los breakpoints exactos de Joby — solo se confirmaron 1440 y 390.
- El bundle JS real de Mari Pepa carga GSAP/Framer/Lenis/R3F al pasar a `/contacto` (donde aparece el "Globo 3D"); no se midió tamaño.
- Las páginas en disco `/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo` que devuelven 404 podrían estar deshabilitadas vía `next.config` o `middleware`, no comprobado.
- El listado de rutas en `.opencode/CONTEXT.md` (`/area-clientes/dashboard`, `/area-clientes/facturas`, `/productos/[categoria]`, `/catalogos`, `/panamar`) **no coincide** con lo que existe hoy en `frontend/app/[locale]/`. Ese listado debe ser revisado y actualizado por el equipo (ver §17 y `.opencode/CONTEXT.md`).

---

## 3. Auditoría del DESIGN.md, CLAUDE.md y globals.css anteriores

### 3.1. Errores fundamentales del `DESIGN.md` previo

1. **Diagnóstico de Joby completamente equivocado.**
   - El doc anterior define la dirección como _"dark aerospace premium"_, _"night, metal, precision"_, fondo `#000000`, acento dorado `#C8A96E`, mood _"slow luxury"_.
   - Joby real: fondo crema `#f5f4df`, near-black con tinte azul `#0e1620`, paleta brand **azul saturado + naranja + rosa + crema**, sin dorado, sin "metal precision".
2. **Brand mismatch con Mari Pepa.**
   - "Premium food distribution that feels like a luxury aerospace brand" no es Mari Pepa. Es un distribuidor HORECA de Lorca. La pretensión "luxury aerospace" desconecta del cliente real.
3. **Specs que ignoran el negocio.**
   - 3D scene en hero (R3F + Bloom + IcosahedronGeometry dorada) no aporta nada al chef que busca catálogo, precio o teléfono.
4. **Reglas dogmáticas contraproducentes.**
   - "DO NOT USE box-shadow" — prohíbe una herramienta CSS estándar.
   - "DO NOT USE border-radius above 2px" — contradice la propia spec de pills 999 px.

### 3.2. Errores en `CLAUDE.md`

- Línea 7: _"Goal: complete frontend rebuild to match jobyaviation.com quality level (dark, cinematic, 3D, rich animations, micro-interactions)"_. **Joby no es dark ni cinematic**. La descripción es factualmente incorrecta y contamina cualquier futura sesión que lea ese archivo.
- Reglas 5–11 (`Never use box-shadow`, `All scroll animations: GSAP only`, `All 3D: R3F`, `Custom cursor: always active`, `Disable WebGL <768px`) son **dogmáticas** y prescriben tecnología antes que problema. La nueva dirección no usa cursor custom ni WebGL.
- Regla 12 (`After every page: stop and wait for human approval`) es razonable, se conserva.

Acción: ver §17 y la sección de cambios propuestos a `.opencode/CLAUDE.md`.

### 3.3. Errores en `globals.css`

- Cabecera proclama _"LINEAR/ARC INSPIRED"_ — **otra referencia más** que difiere de CLAUDE.md y de la web pública.
- Paleta entera es shadcn defaults reskin (azul 217 / cyan 190 / purple 280 / amber 38 / emerald 160) — la paleta SaaS-template estándar, sin ninguna conexión con producto alimentario.
- `--shadow-glow-blue`, `--shadow-glow-green`, `--shadow-glow-purple` son los `glow` que aparecen como pildoras "PREMIUM ⚡" en el DOM y refuerzan la sensación de "AI template".
- Falta tipografía display. Solo Inter está cargado.

Acción: reescritura completa documentada en [STYLES_MIGRATION.md](STYLES_MIGRATION.md).

### 3.4. Lo que sí se conserva del sistema anterior

- Espaciado en múltiplos de 8 px → conservado.
- Border-radius pill (999 px / 9999 px) en CTAs → conservado.
- Inter como sans body → conservado, **se añade Fraunces como display serif**.
- Estructura `:root` con CSS custom properties → conservada (formato cambia a hex/rgb directos en lugar de HSL Tailwind, ver §10).
- Modo dark como variante futura → conservado pero **se desprioriza** (no es objetivo del rediseño).

---

## 4. Auditoría profunda de mari-pepa.com (todas las páginas verificadas)

> Severidad: **P0** = bloquea conversión / accesibilidad. **P1** = daña percepción. **P2** = mejora.

### 4.1. Hallazgos transversales (afectan a todas las páginas)

| # | Sev | Hallazgo |
|---|---|---|
| T-1 | P0 | **Triple chrome fijo** (locale bar + promo banner + header) ocupa ~152 px en mobile. |
| T-2 | P0 | **i18n a medias**: footer renderiza claves crudas `footer.schedule`, `es Lorca, Murcia`. |
| T-3 | P0 | **Math erróneo**: "55 años" / "+55 Años" en `/acerca` y `/lorca`. 1966 → 2026 = 60 años. |
| T-4 | P0 | **`/productos`** (link del CTA principal del sitio) es "Próximamente". |
| T-5 | P1 | **Botón flotante de chatbot** (verde teal) compite visualmente con cada CTA. |
| T-6 | P1 | **Carrusel promo** desincronizado: desktop muestra "Marzo 2026", mobile "Febrero 2026". |
| T-7 | P1 | **2 errors en consola** en cada página visitada — no investigados. |
| T-8 | P1 | **Estética IA-template**: gradientes blue→purple→pink en h1, pildoras "✨ ⚡", Inter Black uppercase 96–128 px. |
| T-9 | P2 | **Aria-labels** ausentes en switcher de idioma (`🇪🇸ES` mezcla emoji + texto). |

### 4.2. Hallazgos por página

#### 4.2.1. `/` (Home) — auditoría completa

| # | Sev | Hallazgo | Quick win |
|---|---|---|---|
| H-1 | P0 | Hero cinematográfico oscuro vs. cuerpo claro = dos marcas | Sustituir por hero pinned con foto real |
| H-2 | P0 | H1 "GRANJAMARI PEPA" en Inter Black uppercase 128 px | Reescribir con Fraunces y mensaje completo |
| H-3 | P0 | Tagline "Congelados, refrigerados y helados para HORECA" plano | Usar narrativa rotante (ver [COPYWRITING.md](COPYWRITING.md)) |
| H-4 | P0 | CTA principal "Ver Catálogo Grupo Topgel" lleva a tercero, no al propio catálogo | Cambiar a "Ver catálogo" interno + "Soy cliente" |
| H-5 | P1 | Sección "Nuestros Productos" es 4 cards genéricas | Sustituir por capítulo editorial con foto grande + thumbnails |
| H-6 | P1 | "✨ CATÁLOGO PREMIUM ⚡" pildora con sparkles | Eliminar |
| H-7 | P1 | Sección "MARCAS QUE DISTRIBUIMOS" copy "líderes del sector alimentario" | Reescribir, listar con peso editorial |
| H-8 | P1 | Indicador mouse scroll solapa con CTAs | Eliminar mouse, basta con la altura |

#### 4.2.2. `/productos` — **bloqueante**

| # | Sev | Hallazgo |
|---|---|---|
| P-1 | **P0** | Página entera = pantalla "Próximamente" con icono candado púrpura |
| P-2 | P0 | CTA principal "Volver al inicio" + "Área de clientes" — _dead end_ de conversión |
| P-3 | P0 | El link "Productos" del header lleva aquí. Toda la estructura de información está rota. |
| P-4 | P1 | Carpeta de disco contiene 7 archivos `.bak` / `_old` / `_broken` / `_with_errors` / `_disabled_id`: indica ciclos abandonados de implementación |

**Decisión**: implementar versión funcional minimal en Fase 1, con 4 categorías y listado de marca, aún sin ficha de producto si no está lista.

#### 4.2.3. `/acerca`

| # | Sev | Hallazgo |
|---|---|---|
| A-1 | P0 | Math erróneo "55 años" |
| A-2 | P0 | H1 con gradiente blue→purple→pink (estética IA) |
| A-3 | P1 | Cada h3 (Fundación / Consolidación / ISO 9001 / Energía Verde / 1.500 referencias) **duplicado en el DOM** — bug de render |
| A-4 | P1 | Hero photo (depot de camiones) demasiado oscuro por overlay; pierde el activo visual |
| A-5 | OK | Buena estructura narrativa: Fundación → Consolidación → Certificaciones → Cifras → Delegaciones |

**Decisión**: conservar la **estructura narrativa**, rediseñar visualmente, corregir math, des-duplicar headings, sustituir gradiente por color sólido.

#### 4.2.4. `/contacto`

| # | Sev | Hallazgo |
|---|---|---|
| C-1 | P0 | H1 "Hablemos" con gradiente IA |
| C-2 | P0 | Subtítulo "Estamos aquí para escucharte y ayudarte" + body "Nuestro equipo de expertos... acompañarte en cada paso hacia el éxito" — copy reciclable al 100% |
| C-3 | P1 | "Globo Interactivo 3D" — feature R3F costoso para una página de teléfono y formulario |
| C-4 | OK | Form con fields correctos: nombre, empresa, email, teléfono, mensaje, checkbox |
| C-5 | OK | Headings reales: Delegación Murcia, Delegación Almería, Email, Horarios |

**Decisión**: conservar estructura del form (matchea backend `submitContactForm`), eliminar globo 3D, reescribir copy entero.

#### 4.2.5. `/lorca` (SEO landing)

| # | Sev | Hallazgo |
|---|---|---|
| L-1 | P0 | Math erróneo "+55 Años de Experiencia" |
| L-2 | P1 | Hero pattern dark cinematográfico genérico |
| L-3 | OK | Copy específico: "Polígono Industrial Saprelorca", "Entrega en 24-48h", "Murcia y Almería" |
| L-4 | OK | Cadenas de prueba: ISO 9001, +55 años (corregir), 24-48h |

**Decisión**: conservar estructura SEO local, rediseñar hero, corregir math, ampliar a páginas hermanas para Almería y otras zonas si conviene SEO.

#### 4.2.6. `/area-clientes`

| # | Sev | Hallazgo |
|---|---|---|
| AC-1 | OK | Es la **mejor página actual** — fondo claro coherente, login funcional, feature list clara |
| AC-2 | P1 | H1 "Bienvenido a tu Área Personal" con gradiente blue→purple en "Área Personal" |
| AC-3 | P1 | Pildora "👑 Área Exclusiva para Clientes ✨" innecesaria |
| AC-4 | OK | Inputs con `name="codigoCliente"` + `password` — matchea contrato backend `login` |
| AC-5 | OK | Form bien construido (un solo column, focus state correcto) |

**Decisión**: conservar funcionalidad, simplificar visualmente. **No introducir cambios al endpoint** (CONTEXT.md backend contracts son sagrados).

### 4.3. Quick wins consolidados (Fase 0 — sin rediseño)

1. Resolver claves i18n del footer (`footer.schedule`, `es Lorca, Murcia`).
2. Corregir "55 años" → "60 años" o, mejor, "Desde 1966" (no envejece).
3. Sincronizar carrusel promo (desktop vs. mobile).
4. Aria-labels en switcher de idioma.
5. Eliminar mouse scroll indicator del hero (resuelve solapamiento con CTAs).
6. Investigar los 2 errores de consola.
7. Cambiar CTA principal de la home de "Ver Catálogo Grupo Topgel" → "Ver catálogo" interno (aunque temporalmente lleve a `/productos` "Próximamente", al menos es propio).
8. Des-duplicar h3 en `/acerca`.

---

## 5. Auditoría profunda de joby-aviation.com (todas las páginas verificadas)

### 5.1. Lo que define a Joby como editorial

#### 5.1.1. Identidad coherente página a página

Cada página tiene **un color identidad** dominante en hero/header. El resto del sitio comparte el mismo lenguaje (typography, grid, footer) pero el **color block journalism** crea memoria:

| Página Joby | Color identidad hero | Tipo de hero |
|---|---|---|
| `/` | Azul `#007ae5` con foto pasajero | Pinned media + cross-fade subtítulos |
| `/experience` | Azul `#007ae5` | Pinned media (mismo template) |
| `/technology` | Taupe / arena cálida | Fullbleed media + h1 cream "Cruise, controlled." |
| `/company` | Azul `#007ae5` con h1 dark blue | Tipográfico oversized (cero foto) |
| `/news` | Crema `#f5f4df` | Archivo: h1 "Newsroom" + sidebar filtros |
| `/careers` | Naranja `#eb6110` | Tipográfico + foto del equipo |

**Decisión adaptada a Mari Pepa** (§9, §10): cada página tendrá su _color de capítulo_, todas viviendo dentro de la misma paleta.

#### 5.1.2. Templates reutilizados

Visibles en class-names CSS-modules:
- `SectionHeroMedia` (pinned hero con cross-fade subtítulos)
- `SectionScrollyText` (FitText reveals con `previousBackground` para transiciones)
- `SectionApp` (sección con media izq + texto der, ratio 60/40)
- `SectionWrapper` (contenedor de página con padding controlado)
- `Navigation` (header sticky transparente → opaco al scroll)
- `Typography` (sistema de variantes: `titlePage`, `body3`, `captionSmall`)

Joby tiene **sistema de design tokens + sistema de plantillas de sección**. Las páginas son combinaciones declarativas, no maquetadas a mano cada una.

#### 5.1.3. Detalles de motion

Tokens encontrados en `:root`:
```
--title-stagger: 83ms     --title-duration: .667s
--text-stagger:  83ms     --text-duration:  .5s
--line-duration: .833s    --round-duration: .5s
--stack-delay:   .333s    --line-delay:     83ms
```

Variables semánticas para easing (`--ease-power4-out`, `--ease-snappy`) — replicables.

#### 5.1.4. Detalles visuales

- Botones-pill `border-radius: 120 px` con padding generoso, color paleta.
- H1 80 px desktop / 49.92 px mobile en serif custom, `font-weight: 550` (peso medio inusual).
- Footer azul saturado con curva diagonal SVG revelando rosa+naranja debajo.
- Cookie banner como pill flotante inferior, `border-radius 120 px`, bg crema.

### 5.2. Lo que rechazamos para Mari Pepa

| Patrón Joby | Por qué no copiar |
|---|---|
| Hero pinned 9000+ px | B2B donde el cliente quiere catálogo: demasiado scroll antes de lo útil |
| Densidad textual baja | Mari Pepa vende producto, necesita más densidad informativa |
| Display weight 550 (delgado) | Lectura en B2B: 600–700 lee mejor con menos riesgo |
| Banner cookies persistente | Tapa CTAs durante toda la navegación |
| Paleta azul saturado / naranja / rosa | No mediterránea, no alimentaria, no Lorca |

---

## 6. Mapeo Joby → Mari Pepa

> Mapeo página a página y patrón a patrón. Tabla principal solicitada por el brief.

### 6.1. Mapeo de páginas

| Página / patrón Joby | Qué hace bien | Equivalente Mari Pepa | Qué debe cambiar | Componentes necesarios | Motion / interacciones | Prioridad |
|---|---|---|---|---|---|---|
| **`/`** (home pinned media + cross-fade) | Una escena, varios mensajes, sticky | **`/`** (home) | Sustituir hero cinematográfico oscuro por foto real (cocina cliente / depot) + 3 subtítulos rotantes | `HeroPinned`, `ChapterIntro`, `CategoryEditorial`, `BrandsEditorial`, `HistoryStory`, `CoverageMap`, `CTABand`, `FooterEditorial` | Lenis global, IntersectionObserver para subtítulos, stagger 60 ms en h2 | **P0** |
| **`/experience`** (pinned + ScrollyText) | Una promesa de uso, narrativa secuencial | **`/lorca`** y futuras landings locales (`/almeria`, `/murcia-capital`, `/cartagena`, `/aguilas`) | Reusar template para mostrar "qué entregamos en cada zona": foto camión / depot + cross-fade de promesas (24-48h, frío garantizado, marcas) | `HeroPinned`, `FitTextScrolly`, `CoverageMap` | Pinned hero ~1.5 viewport, FitText reveal por scroll | **P1** |
| **`/technology`** (fullbleed media + h1 caption) | Una capacidad como protagonista visual | **`/calidad-y-frio`** (nuevo) | Página dedicada a la cadena de frío + ISO 9001 + Energía Verde. Foto cámara frigorífica como protagonista | `HeroFullBleed`, `MetricGrid`, `BadgeRow` | Reveal de número grande, hover en badges con detalle | **P1** |
| **`/company`** (tipográfico oversized) | h1 enorme sin imagen, declaración de visión | **`/acerca`** | Sustituir hero gradient IA por declaración tipográfica grande sobre crema o terracota | `TypographicHero`, `Timeline`, `LeadershipGrid`, `LocationCards` | Reveal de palabra a palabra en h1, scroll-pin de timeline | **P0** |
| **`/news`** (archivo editorial cream + sidebar) | Listado limpio, jerarquía clara | **`/noticias`** o **`/blog`** (nuevo) | Implementar como archivo editorial: h1 "Diario", sidebar (Todas / Marcas / Recetas / Avisos), lista con foto + fecha + extracto | `ArchiveHeader`, `FilterSidebar`, `ArticleCard`, `Pagination` | Filter activa con underline, hover en card translateY | **P2** |
| **`/careers`** (tipográfico naranja + foto equipo) | Color block fuerte, foto humana | **`/trabajo`** o **`/equipo`** (nuevo, opcional) | Tipográfico paprika + foto del equipo en almacén / ruta | `ColorBlockHero`, `RoleList`, `TeamGrid` | Hover scrollable en lista de roles abiertos | **P3** |
| **Sticky header transparent → opaque** | Identidad sin estorbar el hero | **`<HeaderEditorial>`** | Sustituir header denso (3 barras) por una sola con `backdrop-filter` al scroll | `HeaderEditorial`, `MobileMenu` | Cambia bg a `rgba(244,239,230,.85)` + blur(20px) al pasar 80 px de scroll | **P0** |
| **Mobile menu pantalla completa** | Tipografía display gigante, color block | **`<MobileMenu>`** | Sustituir hamburger square azul + dropdown comprimido por overlay terracota con Fraunces 56–72 px | `MobileMenu` | hamburger morfa a línea única, fade-in 220 ms, stagger en links 60 ms | **P0** |
| **Pinned hero + cross-fade subtítulos** | Una escena, varios mensajes | **`<HeroPinned>`** (componente) | Aplicar a `/`, `/lorca`, futuras landings locales | `HeroPinned` | Sticky 1.5 viewport, cross-fade 280 ms entre 3 subtítulos | **P0** |
| **Asimetría editorial (foto principal + thumbs corner)** | Rompe la rejilla | **`<EditorialMosaic>`** (componente) | Usar en `/acerca` (depot + retratos del equipo), `/calidad-y-frio` (cámara + producto) | `EditorialMosaic` | Hover: clip-path reveal en thumbs, parallax suave en foto principal | **P1** |
| **Color block journalism (footer azul → curva → naranja)** | Cierre con personalidad | **`<FooterEditorial>`** | Sustituir footer dark genérico por composición noche-oliva → curva → terracota → crema | `FooterEditorial` | SVG curve, sin animación; el color cierra | **P1** |
| **Pill button radius 120 px con texto duplicado deslizante** | CTA reconocible | **`<CTAPrimary>`** | Usar 999 px (ya en uso), texto duplicado oculto deslizando en hover desktop | `CTAPrimary`, `CTASecondary`, `CTAGhost` | translateY del clon en hover, no en `prefers-reduced-motion` | **P0** |
| **Lenis smooth scroll global** | Sensación premium en una propiedad | Mismo, ya en disco como dependencia | Activar global, deshabilitar bajo `prefers-reduced-motion: reduce` | `LenisProvider` | `lerp: .08`, `duration: 1.2` | **P0** |
| **Stagger por palabra en titulares** | Detalle premium en hero/secciones clave | **`<DisplayHeading>`** | Aplicar solo a h1/h2 de capítulo, no a todo | `DisplayHeading` con prop `stagger` | 60 ms stagger, 600 ms duración, `--ease-power4-out` | **P1** |
| **Breadcrumb minimal en header al entrar a subpágina** ("Experience", "Technology") | Orientación silenciosa | Header al entrar en subpágina muestra el nombre del capítulo en mono | `HeaderEditorial` con prop `chapter` | Aparece a 220 ms tras navegación | **P2** |
| **Cookie banner como pill flotante** | Menos invasivo que banner border-to-border | **`<CookiePill>`** | Sustituir cookie banner si existe; respetar AA contraste | `CookiePill` | fade-in al cargar, slide-down al aceptar | **P2** |

### 6.2. Patrones Joby que **no** se trasladan

| Patrón | Razón |
|---|---|
| Hero pinned > 9.000 px de scroll | B2B necesita acceso rápido a catálogo |
| Densidad textual de "una frase por viewport" | HORECA necesita más datos por pantalla |
| Paleta exacta `#007ae5` / `#eb6110` / `#ffd9c9` | No mediterránea, no alimentaria |
| Display weight 550 | Demasiado fino para legibilidad B2B; vamos a 600–700 |
| Sin proceso de pedido visible en home | Mari Pepa debe poder convertir al chef en visita |
| Tres CTAs apilados con texto duplicado en cada hover | Suficiente con 1–2 CTAs |

### 6.3. Páginas Mari Pepa que se proponen **nuevas**

| Ruta | Objetivo | Pattern Joby de referencia |
|---|---|---|
| `/calidad-y-frio` | Mostrar la cadena de frío, ISO 9001, Energía Verde como historia, no badge | `/technology` |
| `/marcas` (índice) y `/marcas/[marca]` | Página dedicada a Nestlé, Topgel, Panamar — mostrar relación, catálogos asociados | _Sin equivalente directo_ — patrón editorial con foto + claim + grid de productos |
| `/casos` o `/clientes` | Testimonios y casos de cliente: chef, panadería, hotel, evento | `/experience` (foto + frase + secuencia) |
| `/recetas` (opcional, fase 3+) | SEO + valor añadido para chefs | `/news` (archivo) |
| `/almeria`, `/murcia-capital`, `/cartagena`, `/aguilas` | SEO landings locales hermanas de `/lorca` | `/lorca` + patrón pinned |
| `/diario` o `/blog` | Reemplaza `/noticias` 404; archivo editorial | `/news` |

### 6.4. Páginas Mari Pepa que se proponen **fusionar / eliminar**

| Acción | Página(s) | Razón |
|---|---|---|
| **Eliminar (404 + en disco)** | `/experience`, `/technology`, `/company` | Imitación literal de Joby por nombre. Reemplazar por contenido propio: `/acerca`, `/calidad-y-frio`, `/equipo` |
| **Eliminar (en disco, 404)** | `/sostenibilidad`, `/noticias`, `/trabajo` | Como tales no se han desarrollado; reemplazar por `/diario` y `/equipo` (opcional) |
| **Conservar** | `/`, `/acerca`, `/contacto`, `/lorca`, `/area-clientes`, `/legal/privacidad`, `/legal/terminos`, `/checkout`, `/offline` | Existen, funcionan o son legales requeridos |
| **Reconstruir** | `/productos`, `/productos/[categoria]`, `/productos/[categoria]/[producto]` | Hoy `/productos` está "Próximamente". Las rutas de detalle existen en `CONTEXT.md` pero no se han verificado deployadas. Reconstruir con fichas reales |
| **Limpiar repo** | `/productos/_disabled_id`, `page-original-completo.tsx.bak`, `page.tsx.backup`, `page.tsx.full-backup`, `page_broken.tsx`, `page_new.tsx`, `page_old.tsx`, `page_with_errors.tsx.bak` | Tech debt visible. Eliminar antes de Fase 1 |

### 6.5. Componentes globales que deben rediseñarse

| Componente actual | Acción |
|---|---|
| `Header.tsx` | **Rediseño completo**: 1 sola barra con backdrop-filter, breadcrumb mono al entrar en capítulo |
| `Footer.tsx` | **Rediseño completo**: composición de color (noche oliva → curva → terracota → crema) |
| `cinematic-hero.tsx`, `hero-section.tsx` | **Eliminar** ambos, sustituir por `HeroPinned` + `TypographicHero` + `ColorBlockHero` |
| `delegations-section.tsx` | **Conservar** estructura de datos, **rediseñar** visual como `<CoverageMap>` |
| `distributors-section.tsx` | **Rediseño**: pasar de cards-with-glow a `<BrandsEditorial>` con peso editorial |
| `product-categories.tsx` | **Rediseño** como `<CategoryEditorial>` con foto grande + thumbnails |
| `product-card.tsx` | **Rediseño**: bg crema o paper, sin glow, foto cuadrada, código de cliente y referencia visibles |
| `sections/company`, `sections/experience`, `sections/news`, `sections/technology` | **Eliminar** (corresponden a páginas 404 imitativas) o **mover** su contenido reciclable |

Mapeo completo: ver [component_map.json](component_map.json).

---

## 7. Revisión de estilos frontend actuales

> Sección solicitada por el brief. Análisis del CSS y componentes en `frontend/`. Evidencia: lectura directa de `globals.css` (1.157 líneas), `tailwind.config.js`, listado de componentes.

Resumen — el plan completo de migración está en [STYLES_MIGRATION.md](STYLES_MIGRATION.md). Aquí va lo crítico para tomar decisiones.

### 7.1. Qué debe **eliminarse**

| Bloque | Ubicación | Razón |
|---|---|---|
| Cabecera "LINEAR/ARC INSPIRED" | `globals.css` líneas 5–7 | Referencia equivocada. Reemplazar por documentación coherente con DESIGN.md |
| Tokens HSL shadcn defaults (azul 217, cyan 190, purple 280, amber 38) | `globals.css` líneas 39–138 | Paleta SaaS-template, sin conexión con HORECA. Sustituir por paleta cálida mediterránea |
| `--shadow-glow-blue`, `--shadow-glow-green`, `--shadow-glow-purple` | `globals.css` líneas 29–31 | Sombras "neon" que generan la estética IA-template. Eliminar |
| `--glass-bg`, `--glass-border`, `--glass-highlight` | `globals.css` líneas 34–36 | Glassmorphism agresivo, no encaja con editorial cálido |
| Modo dark | `globals.css` líneas 141–~250 | No es objetivo del rediseño; mantener fuera del MVP, reactivar después si se valida con cliente |
| `cinematic-hero.tsx` | `frontend/components/home/` | Reemplazado por `HeroPinned` + `TypographicHero` |
| `hero-section.tsx` | `frontend/components/home/` | Idem |
| Carpeta `sections/company`, `sections/experience`, `sections/technology`, `sections/news` | `frontend/components/sections/` | Imitación literal Joby, eliminar y reconstruir |
| 7 archivos `.bak` / `_old` / `_broken` / `_with_errors` en `productos/` | `frontend/app/[locale]/productos/` | Tech debt. Borrar antes de Fase 1 |
| Globo 3D R3F en `/contacto` | Pendiente localizar componente | Coste de bundle sin retorno funcional |

### 7.2. Qué puede **conservarse parcialmente**

| Bloque | Conservar | Cambiar |
|---|---|---|
| Sistema 8px spacing | Escala numérica | Reordenar tokens con nombres semánticos |
| Border radius pill 9999 px | El radius en sí | Documentarlo en tokens.css con nombre `--radius-pill` |
| Font stack Inter | Inter como sans body | **Añadir Fraunces** como display |
| Backend contracts (CONTEXT.md) | **Todo intocable** | — |
| `/area-clientes` form layout | Estructura del form | Visual: quitar gradiente, simplificar |
| `/contacto` form fields | Estructura (nombre, empresa, email, teléfono, mensaje, checkbox) | Visual y copy |
| `/acerca` narrativa (Fundación → Consolidación → ISO → Energía → 1.500 refs → Delegaciones) | Estructura | Visual: corregir math, quitar gradiente, des-duplicar h3 |
| `/lorca` claims locales (Saprelorca, 24-48h, Murcia y Almería) | Copy específico | Visual y math |

### 7.3. Qué debe **sustituirse por completo**

| Bloque | Reemplazo |
|---|---|
| Paleta entera (HSL shadcn) | Nueva paleta hex (§10.1) cálida mediterránea |
| Sistema de sombras | Una escala simple sm/md/lg sin glows (§10.5) |
| Tipografía display | Inter Black uppercase → Fraunces 600/700 caja baja |
| Hero cinematográfico oscuro | `HeroPinned` + `TypographicHero` + `ColorBlockHero` |
| Header con triple chrome | `HeaderEditorial` de una sola barra |
| Footer dark genérico | `FooterEditorial` compositivo |
| Cards con glow azul | Cards crema/paper con `--shadow-md` neutra |
| Pildoras "✨ ⚡" | Pildoras mono con `Capítulo 0X — Nombre` |
| Mouse scroll indicator | Eliminar |

### 7.4. Componentes actuales — destino

Ver tabla completa en §6.5 y mapeo en [component_map.json](component_map.json).

### 7.5. Patrones visuales actuales que hacen que la web parezca genérica

1. **Gradientes blue→purple→pink** en h1 (`/acerca`, `/contacto`, `/area-clientes`, home).
2. **Pildoras con sparkles** "✨ CATÁLOGO PREMIUM ⚡", "📞 Contacto Directo", "👑 Área Exclusiva ✨", "📍 Polígono Industrial Saprelorca".
3. **Inter Black 900 uppercase 96–128 px** como única estética display.
4. **Glow azules** en headings, cards, CTAs.
5. **Background dark cinematográfico** con vídeo de aurora azul (no relacionado con producto).
6. **Mouse scroll indicator animado** debajo del hero.
7. **Botón flotante teal de chatbot** que compite con CTAs reales.
8. **Carrusel promocional** en chrome superior.
9. **Tres barras fijas** en mobile.
10. **Iconos genéricos `lucide`** decorativos sin función (sparkles, ⚡, 👑).

Cada uno de estos patrones aparece en al menos 2 webs IA-template típicas. Eliminar todos.

### 7.6. Deuda visual / técnica detectada

| Tipo | Detalle |
|---|---|
| Visual | 3 referencias estéticas distintas en la documentación: CLAUDE.md ("dark cinematic Joby"), DESIGN.md viejo ("aerospace luxury"), globals.css ("LINEAR/ARC inspired") |
| Visual | Paleta aplicada no coincide con ninguna de las 3 referencias documentadas |
| Visual | i18n incompleta (claves crudas en footer) |
| Visual | Math erróneo en claims de años de actividad |
| Visual | `/productos` "Próximamente" como CTA principal |
| Técnica | 7 archivos backup en `/productos/` (probablemente git-ignorados, pero presentes en disco) |
| Técnica | Página `/contacto` carga R3F para "Globo Interactivo 3D" sin retorno funcional |
| Técnica | 6 rutas en disco (`/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo`) que devuelven 404 — código muerto desplegado |
| Técnica | CONTEXT.md describe rutas que **no existen** en el repo actual (ver §17) |
| Técnica | 2 errores de consola en cada página visitada — no investigados |

### 7.7. Riesgos al sustituir estilos

| Riesgo | Mitigación |
|---|---|
| Romper backend contracts (login, getDashboard, etc.) | El rediseño solo toca capa de presentación; no se modifican `name` de inputs ni endpoints |
| Romper rutas que tengan tráfico SEO (`/lorca`) | Mantener URL y `<title>`. Solo cambia el render. Configurar `noindex` en rutas 404 antes de borrarlas, **no** redirigir 404 a algo que perjudique posicionamiento sin medir antes |
| CSS Modules existentes (Header.tsx, Footer.tsx) | Reescribir CSS Modules entero por componente, no parchear |
| Tailwind config con shadcn HSL tokens | Migrar a hex con `theme.extend.colors` referenciando CSS custom properties (ver [STYLES_MIGRATION.md](STYLES_MIGRATION.md)) |
| Componentes actuales con dependencia de glow shadows | Eliminar dependencia explícita, no es feature |
| Globo 3D R3F en `/contacto` | Eliminar import y carpeta. Verificar que no se importa desde otro sitio |

### 7.8. Enfoque recomendado

**Sustitución global del sistema visual** (no refactor progresivo). Razones:

- La paleta entera cambia.
- La tipografía display se añade (no había display antes).
- 6 rutas a borrar y 3+ a crear.
- 9 patrones visuales a eliminar (§7.5) que están entrelazados.
- El sistema de tokens (`globals.css`) tiene 1.157 líneas con dependencias internas — refactor parcial dejaría inconsistencias.

Estrategia concreta:
1. **Fase 0**: branch `redesign-2026`. Quick wins (i18n, math, chrome triple) en main.
2. **Fase 1**: en `redesign-2026`, sustituir `globals.css` y `tailwind.config.js` con la nueva spec. Borrar páginas 404. Eliminar componentes obsoletos (cinematic-hero, hero-section, sections/{company,experience,news,technology}).
3. **Fase 2**: rediseñar Home + Header + Footer + Mobile menu + ChapterIntro.
4. **Fase 3**: rediseñar resto de páginas (`/acerca`, `/contacto`, `/lorca`, `/area-clientes`).
5. **Fase 4**: implementar páginas nuevas (`/calidad-y-frio`, `/marcas`, `/casos`, futuras `/almeria`).
6. **Fase 5**: motion + microinteracciones.
7. **Fase 6**: QA + perf + a11y + SEO.

Detalle día a día en [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

---

## 8. Nueva dirección visual y narrativa

### 8.1. Personalidad visual

**Levante mediterráneo profesional.**

- **Cromática**: tierra cocida, oliva, crema, paprika seca, cielo despejado de Lorca al atardecer.
- **Materia**: papel grueso, carta de menú, cuaderno de pedidos, etiqueta de caja Topgel, cinta de embalaje.
- **Velocidad**: pausada. La marca lleva 60 años, no necesita correr.
- **Densidad**: editorial — cuando hay texto, hay párrafo entero, no microcopy aislado.

### 8.2. Tono de comunicación

Detalle en [COPYWRITING.md](COPYWRITING.md). Resumen:

- **Concreto**: "Desde 1966 en Lorca" mejor que "amplia trayectoria en el sector".
- **Profesional sin ser frío**: "Lo que pides hoy antes de las 12, llega mañana a primera hora" mejor que "logística eficiente".
- **Directo al cliente B2B real**: chef, jefe de compras, gestor de cadena, panadero, heladero. No al consumidor final.
- **Castellano natural, no traducido**: nada de "soluciones integrales", "experiencias premium" o "alimentación que enamora".

### 8.3. Sensación al recorrer

| Momento | Sensación |
|---|---|
| Hero | "Esto sabe a Levante". Reconocimiento inmediato de territorio. |
| Catálogo | "Distribuyen estas marcas — entonces sí me sirven". |
| `/acerca` | "Llevan 60 años. Han visto pasar tres ciclos. Saben". |
| `/calidad-y-frio` | "Reparten en mi zona. Tienen frío garantizado". |
| `/area-clientes` | "Ya soy cliente; aquí pido directamente, sin llamadas". |
| `/contacto` | "Sé exactamente a quién llamar y a qué hora". |

### 8.4. Primera pantalla (objetivo)

En menos de 5 segundos, la home debe transmitir:

1. **Quién**: Granja Mari Pepa.
2. **Qué hace**: distribución HORECA de congelados, refrigerados, helado y temperatura ambiente.
3. **Dónde**: Murcia y Almería.
4. **Desde cuándo**: 1966.
5. **Para quién**: hostelería profesional.
6. **Cómo seguir**: dos CTAs claros (Ver catálogo · Soy cliente).

---

## 9. Nueva arquitectura de la web

### 9.1. Mapa de páginas propuesto

```
/                                  Home
├── /productos                     Catálogo (índice de familias)
│   ├── /productos/mar
│   ├── /productos/carnes
│   ├── /productos/precocinados
│   ├── /productos/reposteria
│   ├── /productos/helado
│   └── /productos/[categoria]/[producto]   Ficha (B2B)
├── /marcas                        Marcas distribuidas (índice)
│   └── /marcas/[marca]            Página de marca (Nestlé, Topgel, Panamar…)
├── /acerca                        Historia 1966 → hoy (renombre opcional /la-empresa)
├── /calidad-y-frio                Cadena de frío + ISO 9001 + Energía Verde
├── /casos                         Casos / sectores (restaurantes, panadería, eventos)
├── /diario                        Archivo de noticias / recetas / avisos (sustituye /noticias)
├── /lorca                         SEO landing local — conservar
├── /almeria                       SEO landing local — nueva
├── /equipo                        Equipo + cultura (opcional, F3)
├── /contacto                      Form + delegaciones + mapa
├── /area-clientes                 Login B2B (existente)
├── /area-clientes/* (subrutas)    Dashboard, facturas, pedidos, etc. — verificar inventario real
├── /checkout                      Existente, no auditado
├── /legal/privacidad
├── /legal/terminos
├── /offline                       PWA fallback (existente)
└── /404
```

### 9.2. Mapa con el actual (delta)

Detalle en [page_map.json](page_map.json). Resumen:

| Acción | Páginas |
|---|---|
| **Conservar URL + reconstruir visual** | `/`, `/acerca`, `/contacto`, `/lorca`, `/area-clientes`, `/checkout`, `/offline`, `/legal/*` |
| **Conservar URL + implementar contenido** | `/productos`, `/productos/[categoria]`, `/productos/[categoria]/[producto]` |
| **Eliminar (404 + en disco)** | `/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo` |
| **Crear nuevas** | `/marcas`, `/marcas/[marca]`, `/calidad-y-frio`, `/casos`, `/diario`, `/almeria`, `/equipo` (F3) |

### 9.3. Home — secciones (en orden)

| # | Sección | Componente | Color identidad | Ver |
|---|---|---|---|---|
| 1 | Header + utility | `HeaderEditorial` + `UtilityBar` | crema | [COMPONENTS.md](COMPONENTS.md#header-utility) |
| 2 | Hero pinned | `HeroPinned` | crema + paprika acento | [COMPONENTS.md](COMPONENTS.md#hero-pinned) |
| 3 | Capítulo "Qué distribuimos" | `CategoryEditorial` | crema | [COMPONENTS.md](COMPONENTS.md#category-editorial) |
| 4 | Capítulo "Marcas" | `BrandsEditorial` | terracota | [COMPONENTS.md](COMPONENTS.md#brands-editorial) |
| 5 | Capítulo "1966" | `HistoryStory` | crema con acento oliva | [COMPONENTS.md](COMPONENTS.md#history-story) |
| 6 | Capítulo "Cobertura" | `CoverageMap` | noche oliva | [COMPONENTS.md](COMPONENTS.md#coverage-map) |
| 7 | Capítulo "Quién nos pide" | `TestimonialEditorial` | crema con foto cliente | [COMPONENTS.md](COMPONENTS.md#testimonial-editorial) |
| 8 | CTA band | `CTABand` | paprika | [COMPONENTS.md](COMPONENTS.md#cta-band) |
| 9 | Footer | `FooterEditorial` | noche oliva → curva → terracota | [COMPONENTS.md](COMPONENTS.md#footer) |

### 9.4. Color identidad por página

| Página | Color hero | Color secciones | Footer |
|---|---|---|---|
| `/` | crema + paprika | mosaico (crema, terracota, noche) | noche → curva |
| `/productos` | crema | terracota acento por familia | noche → curva |
| `/productos/[categoria]` | color de familia (mar=cielo, carnes=paprika, precocinados=crema, repostería=rosa polvoriento, helado=oliva claro) | el mismo + crema | noche → curva |
| `/acerca` | terracota tipográfico | crema + acentos | noche → curva |
| `/calidad-y-frio` | noche oliva con foto cámara | noche + crema | noche → curva |
| `/marcas` | crema editorial | crema | noche → curva |
| `/marcas/[marca]` | bg de la marca (controlado) | crema | noche → curva |
| `/casos` | crema con foto cliente | crema | noche → curva |
| `/diario` | crema (archivo) | crema | noche → curva |
| `/lorca`, `/almeria` | crema con foto local | crema + paprika | noche → curva |
| `/contacto` | crema + acento sky (cielo Lorca) | crema | noche → curva |
| `/area-clientes` (login) | crema + paper | crema | (footer reducido) |

### 9.5. Criterios de aceptación por página

Detallado en [QA_CHECKLIST.md](QA_CHECKLIST.md). Resumen home:
- Cumple los 6 puntos de §8.4 en above-the-fold.
- 1440: 0 scroll para entender qué/dónde/cuándo. 390: máximo 1 scroll para llegar al primer CTA.
- LCP < 2.5 s en throttle Slow 4G.
- Sin overflow horizontal en 360–2560 px.

---

## 10. Sistema visual recomendado

### 10.1. Paleta — `tokens.css`

```css
:root {
  /* Surfaces */
  --color-bg-page:        #F4EFE6;   /* crema cálida — el "white" del sitio */
  --color-bg-paper:       #FBF7EE;   /* tarjetas, paneles claros */
  --color-bg-night:       #1F2418;   /* oliva profundo — secciones de contraste */
  --color-bg-terracotta:  #A0382A;   /* terracota mate — capítulos cálidos */

  /* Ink */
  --color-ink-primary:    #1B1A17;
  --color-ink-secondary:  #4A453E;
  --color-ink-muted:      #8A8275;
  --color-ink-on-night:   #F4EFE6;
  --color-ink-on-night-muted: #C9C2B0;

  /* Brand */
  --color-brand-paprika:  #C24A1F;   /* acento principal — CTAs, números grandes */
  --color-brand-olive:    #5C6238;   /* acento secundario — badges */
  --color-brand-sky:      #9CB4C2;   /* acento terciario — cielo Lorca */

  /* Family-specific (chapter colors for /productos/[categoria]) */
  --family-mar:           #6E8DA1;   /* azul-gris mar Cabo de Palos */
  --family-carnes:        #8E2A1D;   /* paprika oscuro */
  --family-precocinados:  #C8A36B;   /* trigo / dorado */
  --family-reposteria:    #D6A89C;   /* rosa polvoriento */
  --family-helado:        #C8D1B8;   /* oliva claro */

  /* Functional */
  --color-success:        #4F6B3F;
  --color-warning:        #C28A1F;
  --color-danger:         #8B2A1A;

  /* Lines */
  --color-line-hair:      rgba(27,26,23,0.08);
  --color-line-soft:      rgba(27,26,23,0.18);
  --color-line-strong:    rgba(27,26,23,0.40);
  --color-line-on-night:  rgba(244,239,230,0.16);
}
```

**Reglas de uso** y contrastes verificados: ver §10.1 anterior + [STYLES_MIGRATION.md](STYLES_MIGRATION.md).

### 10.2. Tipografía

```css
--font-display: "Fraunces", "Söhne Buch", Georgia, serif;
--font-body:    "Inter", system-ui, sans-serif;
--font-mono:    "IBM Plex Mono", ui-monospace, monospace;
```

Carga vía `next/font` con `font-display: swap`. Fraunces es variable, opsz dinámico para mejor lectura en h1 grandes. Pesos:
- Fraunces: 400, 600, 700 (más opsz auto)
- Inter: 400, 500, 600
- IBM Plex Mono: 400, 500

**Escala:**

| Token | Clamp | Uso |
|---|---|---|
| `--fs-display-xl` | `clamp(3rem, 6vw + 1rem, 7.5rem)` | Hero h1 |
| `--fs-display-lg` | `clamp(2.25rem, 4vw + 1rem, 5.25rem)` | h2 capítulo |
| `--fs-display-md` | `clamp(1.75rem, 2vw + 1rem, 3.25rem)` | h3 sección |
| `--fs-lead` | `clamp(1.125rem, .5vw + 1rem, 1.5rem)` | bajada / intro |
| `--fs-body-lg` | `1.125rem` | párrafo destacado |
| `--fs-body` | `1rem` | párrafo |
| `--fs-body-sm` | `0.875rem` | secundario |
| `--fs-label` | `0.75rem` | utility, mono labels |
| `--fs-micro` | `0.6875rem` | legales |

**Reglas:**
- `--font-display` weight **600–700**, **nunca uppercase**.
- `--font-body` weight **400 / 500 / 600**. **Cero `font-weight: 900`**.
- `--font-mono` para utility bar, labels de capítulo (`Capítulo 02 — Catálogo`), códigos de producto, horarios.

### 10.3. Espaciado, layout, breakpoints

```css
--space-1:  4px;   --space-2:  8px;   --space-3:  12px;
--space-4:  16px;  --space-5:  24px;  --space-6:  32px;
--space-7:  48px;  --space-8:  64px;  --space-9:  96px;
--space-10: 128px; --space-11: 160px;

--container-max:    1320px;
--container-pad-x:  clamp(1rem, 4vw, 4rem);
--section-pad-y:    clamp(4rem, 8vw, 9rem);

--grid-cols-desktop: 12;
--grid-cols-tablet:  8;
--grid-cols-mobile:  4;
--grid-gutter:       clamp(.75rem, 1vw, 1.25rem);
```

| Breakpoint | Min-width | Notas |
|---|---|---|
| `xs` | 360 | Móvil pequeño. Chrome fijo ≤ 12 % del viewport. |
| `sm` | 430 | Móvil grande. |
| `md` | 768 | Tablet vertical. |
| `lg` | 1024 | Tablet horizontal / laptop pequeña. Cambia 8 → 12 cols. |
| `xl` | 1280 | Desktop estándar. |
| `2xl` | 1440 | Desktop grande. Container alcanza `1320px`. |

### 10.4. Border radius

```css
--radius-xs:  4px;   --radius-sm:  8px;
--radius-md:  16px;  --radius-lg:  24px;
--radius-pill: 999px;
```

### 10.5. Sombras

Una sola escala neutra. **Sin glows neon**.

```css
--shadow-sm: 0 1px 2px rgba(27,26,23,.06), 0 1px 1px rgba(27,26,23,.04);
--shadow-md: 0 4px 12px rgba(27,26,23,.08), 0 2px 4px rgba(27,26,23,.04);
--shadow-lg: 0 12px 32px rgba(27,26,23,.10), 0 4px 12px rgba(27,26,23,.06);
```

### 10.6. Imágenes / vídeo / iconos / estados

Detalle en [COMPONENTS.md](COMPONENTS.md). Resumen:
- Fotografía real propia — encargo de mínimo 30 fotos para lanzamiento.
- AVIF + WebP fallback con `next/image`.
- Iconografía: Lucide o Phosphor regular, stroke 1.5 px, color `currentColor`.
- Estados hover (solo `hover:hover`): translateY(-2px) + transition 220 ms.
- Focus visible: outline 2px paprika, offset 3px.
- Active: scale(0.98).
- Disabled: opacity 0.45 + pointer-events: none.

---

## 11. Sistema de motion e interacción

Detalle en [MOTION_GUIDELINES.md](MOTION_GUIDELINES.md). Resumen:

- **Smooth scroll**: Lenis 1.x global, `lerp: 0.08`, `duration: 1.2`. **Saltado** bajo `prefers-reduced-motion: reduce`.
- **Stagger por palabra** en h1/h2 de capítulo (no en todos los textos).
- **Reveal de sección**: `IntersectionObserver` simple. opacity 0 → 1 + translateY 16 → 0 px. 600 ms.
- **Hero pinned**: media sticky ~1.5–1.8 viewports. Tres subtítulos cambian con cross-fade 280 ms.
- **Hover de cards**: translateY(-4 px) + `--shadow-lg`. **Sin tilt 3D**.
- **CTAs**: texto duplicado deslizando (text-mask). Solo desktop hover.
- **Hamburger morfa a línea única**.
- **Mobile menu**: pantalla completa terracota con Fraunces 56–72 px y stagger 60 ms.

---

## 12. Componentes frontend

Inventario completo en [COMPONENTS.md](COMPONENTS.md) y [component_map.json](component_map.json). Categorías:

- **Layout & navegación**: `HeaderEditorial`, `MobileMenu`, `UtilityBar`, `PromoStrip`, `FooterEditorial`.
- **Hero**: `HeroPinned`, `TypographicHero`, `ColorBlockHero`, `HeroFullBleed`.
- **Editorial**: `ChapterIntro`, `CategoryEditorial`, `BrandsEditorial`, `HistoryStory`, `Timeline`, `EditorialMosaic`, `TestimonialEditorial`, `CoverageMap`, `MetricGrid`, `BadgeRow`.
- **CTA**: `CTAPrimary`, `CTASecondary`, `CTAGhost`, `CTABand`.
- **Producto**: `ProductCard`, `ProductHero`, `ProductFamilyGrid`, `ProductSpecsTable`.
- **Forms**: `Field`, `Textarea`, `Select`, `Checkbox`, `FormContact`, `FormLogin`.
- **Cookies & UI**: `CookiePill`, `LanguageMenu`, `Toast`, `EmptyState`, `Loading`.
- **Archivo**: `ArchiveHeader`, `FilterSidebar`, `ArticleCard`, `Pagination`.
- **Providers**: `LenisProvider`, `MotionPreferenceProvider`, `LocaleProvider`.

---

## 13. Copywriting y storytelling

Detalle en [COPYWRITING.md](COPYWRITING.md). Resumen:

- **Frases vetadas**: "selección premium", "máxima calidad", "líderes del sector", "soluciones integrales", "experiencias gastronómicas", "comprometidos con la excelencia", "pasión por…", "lo mejor de…", "calidad superior", cualquier "✨" o "⚡" en copy.
- **Frases tipo del sistema**:
  - Hero h1: **"Distribución HORECA en el Levante. Desde 1966."**
  - Hero subtítulos rotantes:
    1. "Trabajamos para hostelería en Murcia y Almería."
    2. "Distribuidor Oficial Nestlé · Grupo Topgel · Panamar."
    3. "Frío garantizado. Pedido hoy, entregado mañana."
  - CTA primario: "Ver catálogo". Secundario: "Soy cliente".
  - `/acerca`: "Empezamos en Lorca en 1966. Tres generaciones después, repartimos a más de N restaurantes en Murcia y Almería." [N a validar].
  - Microcopy operativo: "Pedidos antes de las 12 h se entregan al día siguiente. Para fin de semana, llama el viernes antes de las 11 h."

---

## 14. Plan de implementación

Detalle en [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Fases:

0. **Quick wins** (1–2 d) — bug fixes en main sin rediseño.
1. **Sistema visual** (3–5 d) — `tokens.css`, fuentes, primitivos.
2. **Home + Header + Footer + MobileMenu** (1–2 sem).
3. **Páginas existentes** (1–2 sem) — `/acerca`, `/contacto`, `/lorca`, `/area-clientes`.
4. **Páginas nuevas + Catálogo** (1–2 sem) — `/productos`, `/marcas`, `/calidad-y-frio`, `/casos`.
5. **Motion + microinteracciones** (3–5 d).
6. **QA + perf + a11y + SEO** (3–5 d).

---

## 15. Checklist QA

Detalle en [QA_CHECKLIST.md](QA_CHECKLIST.md). Cobertura mínima:

- 7 viewports (1440, 1280, 1024, 768, 430, 390, 360).
- Estados hover / focus / active / disabled.
- Header sticky, mobile menu, footer.
- Formularios contacto + login.
- `prefers-reduced-motion` reduce.
- Navegación por teclado completa (Tab, Shift+Tab, Enter, Space, Esc).
- Contraste AA mínimo, AAA en cuerpos largos.
- LCP < 2.5 s, CLS < 0.05, INP < 200 ms (Slow 4G).
- Errores `0` en consola.
- i18n ES/EN como mínimo en lanzamiento; **todas las claves resuelven**.
- Lighthouse a11y ≥ 95, perf ≥ 90.

---

## 16. Criterios de aceptación globales

| Dimensión | Criterio |
|---|---|
| **UX** | Un usuario no familiarizado entiende qué hace Mari Pepa, dónde y para quién en ≤ 8 s. |
| **UI** | Sistema visual reconocible como mediterráneo profesional, no SaaS template. |
| **Responsive** | Chrome fijo en mobile ≤ 64 px. Tap targets ≥ 44 px. Cero overflow horizontal. |
| **A11y** | Lighthouse a11y ≥ 95. axe-core sin errores. Texto AA mínimo. |
| **Perf** | LCP < 2.5 s, CLS < 0.05, INP < 200 ms. JS first-load < 200 KB gzipped en home. |
| **Coherencia** | Cero saltos de marca. Misma paleta y tipografía de utility bar a footer. |
| **Contenido** | Cero frase intercambiable con un competidor genérico. |
| **Motion** | Cero animación > 1 s. `prefers-reduced-motion: reduce` desactiva todo. |
| **Diferenciación** | Comparado con 5 webs HORECA al azar, identificable por paleta + tipografía. |
| **Documentación** | `.opencode/` es lo único que un nuevo dev necesita. |

---

## 17. Cambios pendientes en otros archivos `.opencode/`

> Resumen. Los archivos se actualizan en este mismo PR; cualquier divergencia futura debe corregirse aquí también.

### 17.1. `.opencode/CLAUDE.md`

- Línea 7: cambiar _"dark, cinematic, 3D, rich animations, micro-interactions"_ → caracterización correcta de Joby (editorial cálido) y de Mari Pepa (editorial mediterráneo profesional).
- Eliminar regla 5 ("Never use box-shadow"). Sustituir por: "Use `--shadow-sm/md/lg`. Avoid colored glow shadows."
- Reformular regla 6: "All scroll-triggered animations: `IntersectionObserver` + CSS, GSAP solo si la animación lo requiere de verdad. Bajo `prefers-reduced-motion: reduce`, deshabilitar."
- Eliminar regla 8 ("All 3D scenes: R3F"). Sustituir por: "3D solo si aporta valor narrativo verificable. La home y secundarias no llevan 3D en esta dirección."
- Eliminar regla 9 ("Custom cursor: always active"). El cursor custom no es objetivo del rediseño.
- Eliminar regla 10 ("Disable WebGL <768"). No procede sin WebGL.
- Conservar reglas 1–4, 7, 11, 12.
- Añadir regla nueva: "Trust `.opencode/CONTEXT.md` backend contracts. The frontend can be wholly rewritten; never modify input names or endpoint shapes."
- Añadir referencia a este DESIGN.md como fuente única.

### 17.2. `.opencode/CONTEXT.md`

- Las rutas listadas (`/area-clientes/dashboard`, `/area-clientes/facturas`, `/productos/[categoria]/[producto]`, `/catalogos`, `/panamar`) **no coinciden** con las rutas existentes en `frontend/app/[locale]/` hoy. Probable que corresponda a `src/app/` no migrado o a un plan no ejecutado.
- Acción requerida: **regenerar la sección "ALL ROUTES/PAGES" desde el filesystem real**.
- Añadir las rutas nuevas propuestas en §9.1 (`/calidad-y-frio`, `/marcas`, `/casos`, `/diario`, `/almeria`, `/equipo`).
- Mantener intactos los **BACKEND CONTRACTS** (líneas 51–110). Son sagrados.

### 17.3. `.opencode/AGENTS.md`

- Marcar `[x] S2: Site audit` (este documento es el output de S2).
- Apuntar S2 outputs a: `.opencode/page_map.json` y `.opencode/component_map.json` (ya existentes).
- Para S3 (Design system), apuntar como fuente única este DESIGN.md + STYLES_MIGRATION.md (no DESIGN.md anterior).
- Eliminar referencias a `cursor.tsx`, `preloader.tsx`, `page-transition.tsx` como outputs obligatorios. No están en la dirección actual.

### 17.4. `.opencode/DESIGN.md` (este archivo)

- Sustituye al anterior en su totalidad.

---

## 18. Decisiones tomadas

### 18.1. Tomado de Joby (adaptado, no copiado)

- Lectura editorial del scroll con bloques de color por capítulo.
- Hero pinned con subtítulos rotantes (`HeroPinned` en home, `/lorca`, futuras landings locales).
- Pareja "display serif (Fraunces) + sans body (Inter)".
- Botones-pill 999 px con texto duplicado en hover.
- Mobile menu pantalla completa con tipografía display.
- Footer compositivo (no banda funcional).
- Lenis para smooth scroll global.
- Variables CSS de easing reutilizables.
- Stagger de palabra en titulares clave.
- Color identidad por página/capítulo.

### 18.2. Descartado de Joby

- Paleta exacta (azul `#007ae5` + naranja `#eb6110` + rosa `#ffd9c9`).
- Hero pinned 9.000+ px (B2B necesita acceso rápido).
- Display weight 550 (vamos a 600–700).
- Densidad textual de "una frase por viewport".
- Cookie banner persistente que tapa CTAs.
- Custom font propietaria (jobyDisplay) — usaremos Fraunces, gratis.

### 18.3. Creado desde cero para Mari Pepa

- Paleta entera (crema, terracota, noche oliva, paprika, oliva, sky Lorca + 5 colores de familia).
- Sistema de capítulos con color por familia de producto.
- `<CoverageMap>` Murcia + Almería (no existe en Joby).
- Sección "1966" con dato dimensional ("60 años").
- Utility bar con teléfono, email, horario visible (B2B real).

### 18.4. Conservado del diseño actual

- Border radius pill 9999 px en CTAs.
- Multi-idioma ES/EN/DE/IT/ZH.
- Form de `/contacto` (campos), form de `/area-clientes/login` (códigoCliente + password).
- Estructura narrativa de `/acerca` (Fundación → Consolidación → ISO → Energía → Cifras → Delegaciones).
- Estructura SEO de `/lorca` (Saprelorca, 24-48h, Murcia y Almería).
- Toda la capa de datos / backend contracts.

### 18.5. Eliminado del diseño actual

- Hero cinematográfico oscuro con vídeo de aurora azul.
- H1 Inter Black 900 uppercase 96–128 px.
- Pildoras "✨ ⚡ 👑 📞 📍".
- Triple barra fija de chrome.
- Copy "selección premium / máxima calidad / líderes del sector / experiencias / éxito / soluciones".
- Botón "Ver Catálogo Grupo Topgel" como CTA principal de productos (Topgel es proveedor).
- Glow azul/morado/verde en headings.
- Botón flotante teal de chatbot (rediseñar como CTA persistente "Pedir / Soy cliente").
- Mouse scroll indicator.
- Globo Interactivo 3D en `/contacto`.
- Páginas 404 imitativas (`/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo`).
- 7 archivos `.bak` / `_old` / `_broken` en `frontend/app/[locale]/productos/`.

### 18.6. Pendiente de validación con negocio

- Cifras (tres generaciones, número exacto de restaurantes servidos, SKUs activos, número de clientes).
- Inventario fotográfico (encargo o existencias).
- Lista exacta de marcas distribuidas (más allá de Nestlé/Topgel/Panamar visibles).
- Mantener carrusel del banner promo "Revista TopGel" o sustituirlo.
- Implementación real de `/productos/[categoria]/[producto]` (datos disponibles desde backend).
- Rutas reales del portal `/area-clientes/*` (CONTEXT.md y disco no coinciden — auditar y reconciliar).
- ¿`/casos` con nombres reales o anónimos?
- ¿Quién firma copy del `/acerca`? — Necesario el nombre del fundador, hijo, nieto si aplica.

---

## 19. Notas finales

- Este documento es la fuente única. Si otro `.opencode/*.md` lo contradice, este manda y el otro se actualiza.
- Cualquier nueva sesión Claude/dev humano debe leer en este orden: `CLAUDE.md` (rules) → `DESIGN.md` (este) → `CONTEXT.md` (backend) → `STYLES_MIGRATION.md` → `COMPONENTS.md` cuando vaya a tocar UI → `MOTION_GUIDELINES.md` cuando vaya a tocar animación → `COPYWRITING.md` cuando vaya a tocar texto.
- Cualquier afirmación marcada **[INFERENCIA]** requiere verificación antes de tomarse como hecho técnico.
- Para QA, el flujo es: implementar → screenshot → checklist → criterios de aceptación → human approval (regla 12 conservada).
