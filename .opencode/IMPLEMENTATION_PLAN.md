# IMPLEMENTATION_PLAN.md — Granja Mari Pepa

> Plan de implementación por fases. Acompaña a [DESIGN.md](DESIGN.md), [STYLES_MIGRATION.md](STYLES_MIGRATION.md), [QA_CHECKLIST.md](QA_CHECKLIST.md).

---

## Estimaciones globales

| Fase | Duración | Dedicación | Output |
|---|---|---|---|
| Fase 0 — Quick wins | 1–2 días | 1 dev | Bug fixes en `main` sin rediseño |
| Fase 1 — Sistema visual | 3–5 días | 1 dev + 1 designer | tokens, fuentes, Tailwind, primitivos |
| Fase 2 — Home + Header + Footer + MobileMenu | 1–2 sem | 1 dev + 1 designer | Home con nuevo lenguaje completo |
| Fase 3 — Páginas existentes | 1–2 sem | 1 dev | `/acerca`, `/contacto`, `/lorca`, `/area-clientes` rediseñadas |
| Fase 4 — Páginas nuevas + catálogo | 1–2 sem | 1 dev + 1 designer | `/productos`, `/marcas`, `/calidad-y-frio`, `/casos`, `/almeria` |
| Fase 5 — Motion + microinteracciones | 3–5 días | 1 dev | Lenis, stagger, reveal, hover, mobile menu motion |
| Fase 6 — QA + perf + a11y + SEO | 3–5 días | 1 dev + QA | Lighthouse, axe, e2e Playwright, redirects 301 |

**Total**: 5–8 semanas trabajando con foco. Asume disponibilidad de fotografía real al inicio de Fase 2.

---

## Fase 0 — Quick wins (1–2 días)

Branch: directo a `main`. Estos son P0 verificados y no dependen del rediseño.

### Tareas

| # | Tarea | Archivo / lugar |
|---|---|---|
| 0.1 | Resolver claves i18n del footer (`footer.schedule`, `es Lorca, Murcia`) | `frontend/messages/{es,en,de,it,zh}.json` + `Footer.tsx` |
| 0.2 | Corregir math: "55 años" / "+55 Años" → "Desde 1966" o cálculo dinámico | `/acerca`, `/lorca` (buscar literal "55") |
| 0.3 | Sincronizar carrusel promo entre desktop y mobile (mismo mes) | `PromoStrip` o equivalente actual |
| 0.4 | `aria-label` separado en switcher de idioma (no mezclar emoji+texto) | Componente del topbar |
| 0.5 | Eliminar mouse scroll indicator del hero (resuelve solapamiento con CTAs) | `cinematic-hero.tsx` o donde lo renderice |
| 0.6 | Investigar y silenciar los 2 errores de consola (mínimo: convertir error→warn donde aplique) | Buscar primero en `app/[locale]/page.tsx` |
| 0.7 | Cambiar CTA principal home de "Ver Catálogo Grupo Topgel" → "Ver catálogo" interno (apuntar a `/productos`) | Home page |
| 0.8 | Des-duplicar h3 en `/acerca` (cada milestone aparece dos veces en el DOM) | `/acerca/page.tsx` |
| 0.9 | Bajar peso del botón flotante chatbot teal (no urgente: en F2 desaparece) | Componente del FAB |
| 0.10 | `git rm` de los logs de dev y archivos `.bak`/`_old` en `productos/` | Repo |

### Criterios de cierre Fase 0

- [ ] Cero claves i18n crudas en producción.
- [ ] Cero "55" en el copy.
- [ ] Banner promo coherente entre 1440 y 390.
- [ ] Switcher idioma con `aria-label` correcto.
- [ ] Cero solapamiento CTAs/scroll indicator.
- [ ] Cero archivos `.bak` en `frontend/app/[locale]/productos/`.

---

## Fase 1 — Sistema visual (3–5 días)

Branch: `redesign-2026`. **No tocar páginas existentes en esta fase.** Sólo infraestructura.

### Día 1 — Borrado y tokens

- [ ] Borrar carpetas / archivos de §7 en STYLES_MIGRATION.md.
- [ ] Configurar redirects 301 en `next.config.js` para `/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo`.
- [ ] Crear `frontend/app/styles/tokens.css` (copiar de STYLES_MIGRATION.md §3).
- [ ] Reescribir `frontend/app/globals.css` (STYLES_MIGRATION.md §4).
- [ ] Reescribir `frontend/tailwind.config.js` (STYLES_MIGRATION.md §5).
- [ ] Verificar `npm run build` y `npm run dev`. La home actual debe pintar **sin gradientes**, con bg crema, fuente Inter (Fraunces no aplica todavía si no se cargó). El "feo" temporal es esperado.

### Día 2 — Fuentes y primitivos

- [ ] Cargar fuentes via `next/font` en `frontend/app/layout.tsx` (STYLES_MIGRATION.md §6).
- [ ] Crear primitivos en `frontend/components/ui/`:
  - `Container.tsx` (wrapper `--container-max` + `--container-pad-x`).
  - `Section.tsx` (`--section-pad-y`).
  - `DisplayHeading.tsx` (split por palabras + prop `stagger`).
  - `Button.tsx` (variantes `primary` / `secondary` / `ghost`).
  - `Field.tsx`, `Textarea.tsx`, `Select.tsx`, `Checkbox.tsx`.
- [ ] Crear `frontend/components/providers/LenisProvider.tsx` y `MotionPreferenceProvider.tsx`.

### Día 3 — Migración de Tailwind classes

- [ ] Buscar y migrar todas las ocurrencias de:
  - `bg-background` → `bg-page`
  - `text-foreground` → `text-ink`
  - `bg-card` → `bg-paper`
  - `bg-primary` → `bg-paprika` (revisar contexto)
  - `shadow-glow-*` → eliminar
  - `font-black` → `font-display` weight 600 (mover a Fraunces)
  - `uppercase` en headings → eliminar
  - Gradientes blue→purple/pink → eliminar
- [ ] Compilar, ejecutar, navegar manualmente cada página: home / `/acerca` / `/contacto` / `/lorca` / `/area-clientes` / `/productos`.
- [ ] El visual será inconsistente (algunas zonas sin estilizar). Es esperado. Documentar capturas.

### Día 4 — Inventario de componentes obsoletos

- [ ] Auditar `frontend/components/pds/` y `frontend/components/port-design-system/`. Ver cuál es residual y borrar.
- [ ] Borrar `frontend/components/sections/{company,experience,news,technology}/`.
- [ ] Borrar `frontend/components/home/cinematic-hero.tsx` y `hero-section.tsx`. La home temporalmente romperá su hero — aceptable porque Fase 2 lo rehace.
- [ ] Borrar el "Globo Interactivo 3D" de `/contacto` (R3F + carga lazy).

### Día 5 — Cierre Fase 1

- [ ] Build limpio.
- [ ] Lint, typecheck, test unit verdes.
- [ ] PR a `main` desde `redesign-2026` **bloqueado** hasta cerrar Fase 6.
- [ ] Documentar capturas del estado intermedio (sin componentes nuevos, solo tokens).

### Criterios de cierre Fase 1

- [ ] `tokens.css` único origen de verdad.
- [ ] Cero `--shadow-glow-*` en código.
- [ ] Cero `font-weight: 900` en CSS de componentes.
- [ ] Cero archivos en carpetas borradas.
- [ ] Cero compilación rota.

---

## Fase 2 — Home + Header + Footer + MobileMenu (1–2 semanas)

### Sem 1 — Componentes globales y hero

- [ ] `HeaderEditorial.tsx` — sticky transparent → opaque, breadcrumb mono.
- [ ] `MobileMenu.tsx` — overlay terracota, Fraunces 56–72 px, stagger.
- [ ] `UtilityBar.tsx` — opcional; aparece en home y `/contacto`.
- [ ] `PromoStrip.tsx` — dismissible con localStorage 7 días.
- [ ] `FooterEditorial.tsx` — composición noche → curva → terracota → crema.
- [ ] `HeroPinned.tsx` — sticky media + cross-fade subtítulos.
- [ ] Home: integrar `<HeaderEditorial>`, `<HeroPinned>` con foto temporal de stock (placeholder hasta sesión de fotos), `<FooterEditorial>`.

### Sem 2 — Capítulos de home

- [ ] `ChapterIntro.tsx`.
- [ ] `CategoryEditorial.tsx` con tabs Mar/Carnes/Precocinados/Repostería/Helado y fotos placeholder.
- [ ] `BrandsEditorial.tsx` con highlight Nestlé + grid de Topgel/Panamar.
- [ ] `HistoryStory.tsx` con número grande "60" y CTA a `/acerca`.
- [ ] `CoverageMap.tsx` con SVG estilizado de Murcia + Almería y datos de delegaciones.
- [ ] `TestimonialEditorial.tsx` con quote placeholder.
- [ ] `CTABand.tsx` antes del footer.
- [ ] Cookie pill (`CookiePill.tsx`).

### Criterios de cierre Fase 2

- [ ] Home en 1440 y 390 cumple los 6 puntos de DESIGN.md §8.4.
- [ ] Header sticky comportamiento OK al scroll.
- [ ] Mobile menu abre/cierra con animación correcta + keyboard accesible.
- [ ] Cero overflow horizontal en 360–1440.
- [ ] Lighthouse a11y ≥ 90 en home (sin contenido real perfecto, baseline aceptable).
- [ ] Screenshot tomado y aprobado por humano (regla 12 del CLAUDE.md previo).

---

## Fase 3 — Páginas existentes (1–2 semanas)

Orden recomendado: empezar por la más simple (`/area-clientes`) y subir.

### Sprint 3.1 — `/area-clientes` (login)

- [ ] `TypographicHero` con eyebrow "Área de cliente".
- [ ] `FormLogin` con `Field` (codigoCliente + password). **No tocar `name` de inputs** (CONTEXT.md backend contracts).
- [ ] Lista de funcionalidades (cards Pedidos / Facturas / Catálogo / Compartir).
- [ ] Footer reducido (sin newsletter en login).
- [ ] Verificar e2e: login OK con credenciales de test, redirección al dashboard preservada.

### Sprint 3.2 — `/contacto`

- [ ] `TypographicHero` con eyebrow "Capítulo — Contacto".
- [ ] Bloque de contacto (delegaciones + email + horario).
- [ ] `FormContact` con `Field`, `Textarea`, `Checkbox`. **No tocar `name`** del form.
- [ ] Eliminar Globo 3D R3F.
- [ ] Mapa SVG estilizado (no Google Maps embed).
- [ ] Verificar e2e: envío del form llega al backend `submitContactForm`.

### Sprint 3.3 — `/acerca`

- [ ] `TypographicHero` con h1 "Sesenta años desde Lorca."
- [ ] `Timeline` con hitos validados (corrigiendo math).
- [ ] `EditorialMosaic` con foto del depot + retratos del equipo (placeholder hasta tener fotos reales).
- [ ] `MetricGrid` (60 / 1.500+ / 2 / 100%).
- [ ] CTA al final hacia `/contacto`.

### Sprint 3.4 — `/lorca`

- [ ] `HeroPinned` con foto de Saprelorca + 3 subtítulos rotantes.
- [ ] Sección "Por qué Mari Pepa en Lorca" con `MetricGrid` + `BadgeRow`.
- [ ] CTA al final.
- [ ] Mantener `<title>` SEO actual.

### Criterios de cierre Fase 3

- [ ] Las 4 páginas existentes funcionan con nuevo lenguaje.
- [ ] e2e Playwright para login + envío de form contacto verde.
- [ ] Backend contracts intactos (test e2e los cubre).
- [ ] Lighthouse a11y ≥ 95 en cada una.

---

## Fase 4 — Páginas nuevas + catálogo (1–2 semanas)

### Sprint 4.1 — `/productos` y `/productos/[categoria]`

Con datos del backend (`getProducts`, `getProductCategories`).

- [ ] `/productos` (índice): hero + `CategoryEditorial` extendido + CTA al área de cliente.
- [ ] `/productos/[categoria]`: hero color de familia + `ProductFamilyGrid` con filtros (marca, formato, conservación).
- [ ] `/productos/[categoria]/[producto]`: `ProductHero` + `ProductSpecsTable` + "Pedir como cliente".
- [ ] Empty state si la familia no tiene aún productos.

### Sprint 4.2 — `/marcas` y `/marcas/[marca]`

- [ ] Índice: hero + `BrandsEditorial` extendido (Nestlé highlight + grid otras).
- [ ] `[marca]`: hero color de marca + claim + grid de productos asociados (cross-link al catálogo).

### Sprint 4.3 — `/calidad-y-frio`

- [ ] `HeroFullBleed` con foto cámara frigorífica.
- [ ] Secciones: cadena de frío / ISO 9001 / energía verde / trazabilidad.
- [ ] `MetricGrid` y `BadgeRow`.

### Sprint 4.4 — `/casos`

- [ ] Hero editorial.
- [ ] Lista de `TestimonialEditorial` (3–6 casos placeholder hasta tener autorización de clientes).
- [ ] CTA al final.

### Sprint 4.5 — `/almeria`

- [ ] Hermana de `/lorca` con `HeroPinned` y datos locales.

### Sprint 4.6 — `/diario` (si tiempo)

- [ ] `ArchiveHeader` + `FilterSidebar` + grid `ArticleCard`.
- [ ] Datos mock o desde un CMS si ya está integrado (en caso contrario, dejar empty state).

### Criterios de cierre Fase 4

- [ ] `/productos` ya **no es "Próximamente"**.
- [ ] El chef puede ir de home → familia → ficha en ≤ 3 clics.
- [ ] Lighthouse a11y ≥ 95 en cada página nueva.
- [ ] Sin errores de consola.

---

## Fase 5 — Motion + microinteracciones (3–5 días)

### Día 1 — Lenis

- [ ] Activar `LenisProvider` con detección `prefers-reduced-motion`.
- [ ] QA: scroll en desktop suave, mobile nativo, anchors funcionan, `position: sticky` no roto.

### Día 2 — Reveals e IntersectionObserver

- [ ] Helper `useIntersectionOnce` (o `useReveal`).
- [ ] Aplicar `.reveal` a secciones de home, `/acerca`, `/calidad-y-frio`, `/casos`.
- [ ] QA: reveals una sola vez, no se repiten al subir.

### Día 3 — Stagger + cross-fade

- [ ] `DisplayHeading` con prop `stagger`. Aplicar en h1 hero y h2 capítulo (no en h3).
- [ ] `HeroPinned` cross-fade entre 3 subtítulos vinculados a scroll progress.
- [ ] `MobileMenu` stagger 60 ms en links.
- [ ] QA: `prefers-reduced-motion: reduce` apila las 3 frases del hero, sin sticky, sin stagger.

### Día 4 — Microinteracciones

- [ ] Hover translateY(-4px) + sombra `--shadow-lg` en cards.
- [ ] CTA con texto duplicado deslizando.
- [ ] Hamburger morph (cross-fade entre dos iconos).
- [ ] Counter en `MetricGrid`.

### Día 5 — Cierre Fase 5

- [ ] QA en 7 viewports.
- [ ] Test reduced-motion.
- [ ] Profile DevTools — confirmar 60fps en hover y scroll.

### Criterios de cierre Fase 5

- [ ] Cero animación > 1 s.
- [ ] `prefers-reduced-motion: reduce` desactiva todo.
- [ ] LCP < 2.5 s en home (con throttle).
- [ ] Cero jank visible en mobile mid-tier (test Chrome DevTools throttle CPU 4×).

---

## Fase 6 — QA + perf + a11y + SEO (3–5 días)

### Día 1 — Performance

- [ ] Lighthouse perf ≥ 90 móvil en home, `/productos`, `/contacto`, `/area-clientes`.
- [ ] Bundle analyzer: JS first-load home < 200 KB gzipped.
- [ ] Imágenes con `next/image`, formatos AVIF + WebP, `sizes` correctos.
- [ ] Fuentes preload manual del peso crítico (`Fraunces 600`).

### Día 2 — Accesibilidad

- [ ] Lighthouse a11y ≥ 95.
- [ ] axe-core sin errores en cada ruta.
- [ ] Test manual con teclado: Tab, Shift+Tab, Enter, Space, Esc.
- [ ] Test con NVDA o VoiceOver: header, mobile menu, hero, form contacto, login.
- [ ] Skip link visible al focus.
- [ ] Focus trap en mobile menu.

### Día 3 — Visual y responsive

- [ ] QA en 7 viewports (360 / 390 / 430 / 768 / 1024 / 1280 / 1440).
- [ ] Visual regression Playwright comparada con baseline F1.
- [ ] Cero overflow horizontal.
- [ ] Tap targets ≥ 44 px.

### Día 4 — SEO + i18n

- [ ] Meta tags por página (`<title>`, `<meta name="description">`, OG, Twitter).
- [ ] Sitemap.xml regenerado con nuevas rutas y sin las 404 borradas.
- [ ] `robots.txt` actualizado.
- [ ] i18n: ES + EN como mínimo lanzamiento; resto opcional con copy validado por nativo.
- [ ] `hreflang` correcto.
- [ ] Verificar redirects 301 desde rutas borradas.

### Día 5 — Cierre

- [ ] Test e2e Playwright completo: home → catálogo → ficha → área cliente login → dashboard → logout → contacto envío.
- [ ] Test en navegadores: Chrome, Safari, Firefox, Edge actualizados.
- [ ] Test mobile real: iPhone (Safari) y Android (Chrome) modernos.
- [ ] PR `redesign-2026 → main`. Code review.
- [ ] Merge.
- [ ] Deploy staging + smoke test.
- [ ] Deploy producción.

---

## Dependencias y bloqueos

| Bloqueo | Cómo resolver |
|---|---|
| Sin fotografía real | Encargar sesión de fotos al inicio de Fase 2. Mientras, usar placeholders ilustrativos (no stock genérico). |
| Datos de catálogo no auditados | Verificar shape JSON real de `getProducts` y `getProductCategories` con backend. Si difiere de CONTEXT.md, actualizar tipados antes de F4 sprint 4.1. |
| Cifras ("1.500+ refs", "tres generaciones") sin validación | Validar con cliente al inicio de F2. Si no se valida, dejar **"Desde 1966"** y "Distribuidor Oficial Nestlé" como únicos claims dimensionales. |
| Direcciones físicas exactas de delegaciones | Validar con cliente. Si no, ocultar bloque 2 del footer. |
| Quotes reales de clientes | Validar autorización. Si no hay, sustituir `TestimonialEditorial` por un capítulo más editorial con datos sectoriales. |
| Modo dark | **No bloqueante**. Fuera de MVP. |

---

## Roles y responsabilidad

| Rol | Responsable de |
|---|---|
| Tech Lead | Aprobar tokens, arquitectura, plan de fases, code review |
| Designer | Aprobar capturas screenshot por sección antes de pasar a la siguiente |
| Frontend dev | Implementar componentes + páginas + motion |
| QA | Lighthouse, axe, Playwright e2e, test manual cross-browser |
| Cliente (negocio) | Validar copy, fotos, cifras, autorizaciones |

---

## Reglas operativas (heredadas)

- Después de cada sección visualmente significativa: screenshot Playwright.
- Después de cada página: stop y esperar aprobación humana (regla 12 CLAUDE.md original).
- Cero merges directos a `main` desde `redesign-2026` hasta cierre de Fase 6.
- PRs por sprint, no PRs gigantes.

---

## Hitos visibles para negocio

| Hito | Cuándo | Demo |
|---|---|---|
| Quick wins live | Final F0 | i18n footer resuelto, math correcto en `/acerca` |
| Token system listo | Final F1 | Home con bg crema y Fraunces visible aunque sin componentes nuevos |
| Home rediseñada | Final F2 | Captura completa de la nueva home con fotos placeholder |
| Páginas existentes rediseñadas | Final F3 | Walkthrough de `/acerca`, `/contacto`, `/lorca`, `/area-clientes` |
| Catálogo funcional | Final F4 | Demo de chef navegando home → familia → producto |
| Motion + microinteracciones | Final F5 | Vídeo de scroll de la home con Lenis y cross-fade |
| Producción | Final F6 | URL pública con todas las métricas verdes |
