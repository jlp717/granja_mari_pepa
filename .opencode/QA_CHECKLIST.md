# QA_CHECKLIST.md — Granja Mari Pepa

> Checklist QA final. Cualquier feature debe pasar todos los aplicables antes de mergear `redesign-2026 → main`. Acompaña a [DESIGN.md](DESIGN.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

---

## 1. Viewports

Probar **manualmente** y con visual regression (Playwright) en:

- [ ] **360 px** (móvil pequeño — Galaxy S antiguo)
- [ ] **390 px** (iPhone 14/15 estándar)
- [ ] **430 px** (iPhone 15 Pro Max)
- [ ] **768 px** (tablet vertical — iPad mini)
- [ ] **1024 px** (tablet horizontal / laptop pequeña)
- [ ] **1280 px** (desktop estándar)
- [ ] **1440 px** (desktop grande)

> Opcional: 1920 (full-HD) y 2560 (4K monitor de oficina), sobre todo para el footer compositivo.

En **cada viewport**, recorrer:

- [ ] Cero overflow horizontal (la barra de scroll horizontal **no aparece**).
- [ ] Cero solapamiento de chrome fijo con CTAs / contenido principal.
- [ ] Tap targets ≥ 44 px en mobile.
- [ ] Texto legible (≥ 16 px en body, ≥ 14 px en labels).
- [ ] Imágenes no estiradas / aplastadas.
- [ ] Layout coherente con `--grid-cols-*` (12 desktop, 8 tablet, 4 mobile).

---

## 2. Estados interactivos

Para cada componente con interacción:

- [ ] **Hover** (solo `hover: hover` — no en touch).
  - Cards: translateY(-4px) + sombra `--shadow-lg`.
  - CTAs: texto duplicado deslizando.
  - Links: subrayado animado.
- [ ] **Focus visible**.
  - `outline: 2px solid var(--color-brand-paprika); outline-offset: 3px`.
  - Visible en todo elemento interactivo.
- [ ] **Active** (mientras se pulsa).
  - `transform: scale(0.98)` o feedback equivalente.
- [ ] **Disabled**.
  - `opacity: 0.45; pointer-events: none`.
  - Cursor `not-allowed`.

---

## 3. Header sticky

- [ ] En home `variant='home'`: bg transparente al scroll 0, opaque + blur al pasar 80 px.
- [ ] En subpágina `variant='page'`: opaque desde 0.
- [ ] Logo siempre clicable (vuelve a `/`).
- [ ] Breadcrumb mono "Capítulo 0X — Nombre" visible al entrar a subpágina.
- [ ] CTA "Soy cliente" cambia a "Salir" en `/area-clientes/*`.
- [ ] Cero salto / flash al cambiar de transparente a opaque.

---

## 4. Mobile menu

- [ ] Hamburger 44×44 px tappable.
- [ ] Click abre overlay terracota full-bleed.
- [ ] Body queda con `overflow: hidden` mientras open.
- [ ] Foco trap dentro del menú.
- [ ] Esc cierra.
- [ ] Click en link cierra y navega.
- [ ] Click en × cierra.
- [ ] Foco vuelve al hamburger al cerrar.
- [ ] Hamburger morfa visualmente (cross-fade entre dos iconos).
- [ ] Stagger 60 ms en links al abrir.
- [ ] `prefers-reduced-motion: reduce` desactiva stagger y morph.

---

## 5. Footer

- [ ] Composición noche → curva → terracota → crema renderiza bien en retina.
- [ ] SVG de la curva sin pixelado.
- [ ] Direcciones de ambas delegaciones visibles (si validadas con cliente).
- [ ] Newsletter con `<label for>` y placeholder válido.
- [ ] Newsletter con `aria-describedby` apuntando a la política.
- [ ] Switcher de idioma con `aria-label` por opción.
- [ ] Links legales activos: Privacidad, Términos, Cookies.

---

## 6. Formularios

### `/contacto`

- [ ] Campos: nombre, empresa, email, teléfono, mensaje, checkbox.
- [ ] Validación cliente: required, email format, teléfono numérico, longitud mínima mensaje.
- [ ] Mensajes de error en `role="alert"` con texto humano (ver [COPYWRITING.md §5.2](COPYWRITING.md)).
- [ ] Submit en curso: botón disabled + texto "Enviando…".
- [ ] OK: toast / mensaje "Recibido. Te llamamos hoy o mañana antes de las 12."
- [ ] Error backend: toast / mensaje + opción de reintentar.
- [ ] Backend `submitContactForm` recibe el payload con la shape esperada (CONTEXT.md).
- [ ] e2e Playwright cubre el envío.

### `/area-clientes` login

- [ ] Campos: `codigoCliente` (text), `password`. **Names sin cambiar** (CONTEXT.md backend contracts).
- [ ] Validación cliente: ambos required.
- [ ] Login OK: redirección al dashboard preservada.
- [ ] Login fail: mensaje "Código de cliente o contraseña incorrectos." en `role="alert"`.
- [ ] Lockout (si lo hay): mensaje + tiempo restante o teléfono.
- [ ] e2e Playwright cubre login OK + login fail.

---

## 7. Accesibilidad

### Automatizada

- [ ] **Lighthouse a11y ≥ 95** en cada ruta principal.
- [ ] **axe-core sin errores** en home, `/acerca`, `/contacto`, `/lorca`, `/productos`, `/area-clientes`.
- [ ] **HTML semántico**: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<aside>`.
- [ ] **Heading order** correcto: un solo `<h1>` por página, jerarquía sin saltos.

### Manual

- [ ] **Navegación por teclado completa**:
  - Tab visita header → main → footer en orden lógico.
  - Shift+Tab vuelve al revés.
  - Enter / Space activan botones.
  - Esc cierra dialogs.
  - Cero "trampas" de foco fuera de `<dialog>`.
- [ ] **Skip link** "Saltar al contenido" visible al primer Tab.
- [ ] **Screen reader** (NVDA en Windows, VoiceOver en macOS):
  - Titulares anunciados como heading correctamente.
  - Imágenes con `alt` descriptivo (decorativas con `alt=""`).
  - Iconos solo-decorativos con `aria-hidden`.
  - Form errors anunciados al fallar validación.
  - Mobile menu anuncia abierto/cerrado.
- [ ] **Contraste**:
  - AA mínimo en todo texto.
  - AAA en cuerpos largos (≥ 7:1).
  - `--color-ink-primary` sobre `--color-bg-page` ≥ 17:1 (verificado: 17.1:1).
  - `--color-brand-paprika` sobre `--color-bg-page` ≥ 4.5:1 (verificado: 5.2:1).
- [ ] **Touch targets** ≥ 44 px en mobile.
- [ ] **Lang attribute** en `<html>` correcto por locale.

---

## 8. `prefers-reduced-motion: reduce`

Activar OS reduced-motion y verificar:

- [ ] Lenis no se inicializa (scroll nativo).
- [ ] `<HeroPinned>` sin sticky; las 3 frases apiladas debajo del h1.
- [ ] Stagger por palabra deshabilitado.
- [ ] Reveal por scroll: contenido visible directo sin transition.
- [ ] Cross-fade tabs: cambio instantáneo.
- [ ] Counter `MetricGrid`: número final directo.
- [ ] CTA texto duplicado: clon oculto, sin slide.
- [ ] Hamburger: cross-fade en lugar de morph.
- [ ] Cookie pill: aparece sin slide-up.
- [ ] Toast: aparece sin slide.
- [ ] La interfaz **mantiene la misma información** que con motion activo.

---

## 9. Performance

### Métricas Core Web Vitals

Throttle: **Slow 4G + CPU 4×** (Chrome DevTools).

- [ ] **LCP < 2.5 s** en home, `/productos`, `/lorca`.
- [ ] **CLS < 0.05** en todas las rutas.
- [ ] **INP < 200 ms** en interacciones (clicks de tabs, hover, hamburger).
- [ ] **TBT < 200 ms** (Total Blocking Time).

### Bundle

- [ ] **JS first-load home < 200 KB gzipped**.
- [ ] **Cero R3F / Three.js en home, `/contacto`, `/area-clientes`, `/lorca`**. Verificar con bundle analyzer.
- [ ] **Cero GSAP en home** (a menos que se justifique).
- [ ] Lenis ≈ 5 KB gzipped — OK.

### Imágenes

- [ ] **AVIF + WebP fallback** vía `next/image`.
- [ ] **`sizes` correcto** (no servir 1440 px en mobile).
- [ ] **`priority` solo** en LCP image (hero).
- [ ] **`loading="lazy"`** en imágenes below-the-fold.
- [ ] **Cero CLS** por imagen sin dimensiones.

### Fuentes

- [ ] `next/font` con subset `latin` y `display: swap`.
- [ ] Preload manual del peso crítico (Fraunces 600).
- [ ] Cero FOIT excesivo (> 200 ms).

---

## 10. SEO

### Por página

- [ ] `<title>` único y descriptivo (≤ 60 chars).
- [ ] `<meta name="description">` único (140–160 chars).
- [ ] `<meta property="og:*">` para Facebook/LinkedIn.
- [ ] `<meta name="twitter:*">` para X.
- [ ] OG image presente y bien dimensionada (1200×630).
- [ ] `<link rel="canonical">` apuntando a la URL definitiva.
- [ ] `<html lang="...">` por locale.
- [ ] `<link rel="alternate" hreflang="...">` entre locales.

### Sitio

- [ ] `sitemap.xml` regenerado con todas las rutas activas.
- [ ] `robots.txt` correcto (no bloquea rutas indexables).
- [ ] **Redirects 301 configurados** para:
  - [ ] `/experience` → `/calidad-y-frio`
  - [ ] `/technology` → `/calidad-y-frio`
  - [ ] `/company` → `/acerca`
  - [ ] `/sostenibilidad` → `/calidad-y-frio#energia-verde`
  - [ ] `/noticias` → `/diario`
  - [ ] `/trabajo` → `/contacto` (o `/equipo` cuando exista)
- [ ] **Search Console** verificado y enviando sitemap.
- [ ] **Schema.org** apropiado:
  - LocalBusiness en home y `/contacto` con dirección, teléfono, horario.
  - BreadcrumbList en subpáginas.
  - Product en fichas de catálogo.

---

## 11. i18n

- [ ] **Cero claves crudas** en producción. Verificar con: `grep -r "\\.[a-z]\+" frontend/.next/server | grep -E "footer\\.|header\\.|nav\\."`.
- [ ] **ES y EN completas** mínimo en lanzamiento.
- [ ] DE / IT / ZH: si no se traducen ahora, **redirigir a EN**, no dejar fallback ES con copy ES.
- [ ] **Plurales** correctos (1 producto vs N productos).
- [ ] **Formatos** locales: fechas, números, moneda.
- [ ] Switcher de idioma navega manteniendo la ruta y query params.

---

## 12. Cross-browser

Probar en última versión estable:

- [ ] **Chrome** (Windows + macOS).
- [ ] **Safari** (macOS + iOS).
- [ ] **Firefox** (Windows + macOS).
- [ ] **Edge** (Windows).
- [ ] **Samsung Internet** (Android, último modelo soportado).

Verificar:
- [ ] Sticky position OK (Safari iOS tiende a problemas con sticky bajo Lenis).
- [ ] Backdrop-filter del header (Safari añade fallback).
- [ ] CSS Grid en footer.
- [ ] `next/image` con AVIF.
- [ ] Form RHF + Zod sin warnings.

---

## 13. Console y errores

- [ ] **Cero `console.error`** en home, `/acerca`, `/contacto`, `/lorca`, `/area-clientes`, `/productos`.
- [ ] **Cero warnings críticos** de React (key duplicate, hydration mismatch).
- [ ] **Cero 404** en network panel (assets faltantes).
- [ ] **Cero requests bloqueados** por CORS o CSP.
- [ ] **Logs informativos eliminados** del bundle de producción.

---

## 14. Coherencia visual

- [ ] **Misma paleta** de utility bar a footer (cero saltos a azul/morado).
- [ ] **Misma tipografía** display Fraunces en h1, h2, mobile menu.
- [ ] **Misma escala** de spacing en todas las páginas (`--space-*` exclusivamente).
- [ ] **Cero `font-weight: 900`** en CSS de componentes.
- [ ] **Cero `uppercase`** en headings (solo en mono labels).
- [ ] **Cero gradientes blue→purple→pink**.
- [ ] **Cero glow shadows** (`box-shadow` con color saturado).
- [ ] **Cero pildoras** "✨ ⚡ 👑" con sparkles.
- [ ] **Cero `box-shadow: 0 0 X colorY`** (glow neon).

---

## 15. Diferenciación (test del competidor)

Comparar Mari Pepa rediseñada con 5 webs de competidores HORECA tomadas al azar:

- [ ] Mari Pepa **identificable a primera vista** por paleta + tipografía sin ver el logo.
- [ ] Cero frase de copy intercambiable con un competidor genérico.
- [ ] Cero patrón visual de los 10 listados en DESIGN.md §7.5 ("AI loop").

---

## 16. Documentación

- [ ] **`.opencode/` actualizado** y coherente entre sí: DESIGN, COMPONENTS, MOTION_GUIDELINES, COPYWRITING, STYLES_MIGRATION, IMPLEMENTATION_PLAN, QA_CHECKLIST.
- [ ] **`page_map.json` y `component_map.json`** reflejan el repo actual.
- [ ] **`CLAUDE.md`, `CONTEXT.md`, `AGENTS.md`** actualizados (ver DESIGN.md §17).
- [ ] **Capturas screenshot** archivadas por sección y página (para referencia futura).
- [ ] **Decisiones pendientes** marcadas explícitamente en COPYWRITING.md §8.

---

## 17. Aprobación humana

- [ ] **Tech Lead** aprueba arquitectura, code quality, tests verdes.
- [ ] **Designer** aprueba captura por sección antes de pasar a la siguiente.
- [ ] **Cliente / negocio** aprueba copy real (cifras, claims, quotes), fotos.
- [ ] **QA** confirma checklist completo.

---

## 18. Smoke test post-deploy

Tras deploy a producción:

- [ ] URLs públicas responden 200: `/`, `/acerca`, `/contacto`, `/lorca`, `/productos`, `/area-clientes`, `/legal/{privacidad,terminos}`.
- [ ] Redirects 301 funcionan desde rutas eliminadas.
- [ ] Login real con credenciales de cliente test funciona.
- [ ] Form de `/contacto` envía un email de prueba que llega.
- [ ] Lighthouse en producción ≥ 90 perf y ≥ 95 a11y en home.
- [ ] Search Console no reporta nuevos errores graves en 48 h.
