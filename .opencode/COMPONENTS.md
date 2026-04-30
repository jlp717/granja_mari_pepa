# COMPONENTS.md — Granja Mari Pepa

> Especificación de componentes del rediseño. Acompaña a [DESIGN.md](DESIGN.md), [MOTION_GUIDELINES.md](MOTION_GUIDELINES.md), [STYLES_MIGRATION.md](STYLES_MIGRATION.md).

---

## 0. Convenciones

- Todos los componentes son **server-first** salvo que requieran estado o efectos. Marcar `'use client'` solo cuando es necesario.
- Tipados con TypeScript estricto. Props bien nombrados, sin `any`.
- Estilos: CSS Modules **o** clases Tailwind sobre tokens de `tokens.css`. **Cero hex inline**.
- Texto siempre vía `next-intl` (o equivalente i18n actual). **Cero literales en JSX** salvo placeholders.
- A11y por defecto: roles, `aria-*`, `lang`, foco visible, navegable por teclado.
- Motion: ver [MOTION_GUIDELINES.md](MOTION_GUIDELINES.md). **Toda animación es opt-out** vía `prefers-reduced-motion: reduce`.

---

## 1. Layout & navegación

### <a id="header-utility"></a>1.1. `HeaderEditorial`

**Propósito.** Barra superior única (sustituye el chrome triple actual). Sticky transparent → opaque al pasar 80 px de scroll. Muestra logo, nav principal, CTA "Soy cliente" y, en subpágina, breadcrumb tipográfico mono ("Capítulo 02 — Catálogo").

**Props.**
```ts
type HeaderEditorialProps = {
  variant?: 'home' | 'page';   // home: full transparent over hero; page: opaque desde 0
  chapter?: { number: string; title: string };  // breadcrumb mono
  locale: 'es' | 'en' | 'de' | 'it' | 'zh';
};
```

**Estructura.**
```
[ Logo Mari Pepa ]   [ Productos · Marcas · 1966 · Cobertura · Diario ]   [ Soy cliente ]
                       [ chapter mono opcional debajo cuando variant='page' ]
```

**Estados.**
- Initial (variant=home, scroll=0): bg `transparent`, texto `--color-ink-on-night` o `--color-ink-primary` según hero.
- Scrolled (>80 px): bg `rgba(244,239,230,0.85)` + `backdrop-filter: blur(20px)`, texto `--color-ink-primary`, borde inferior `1px var(--color-line-hair)`.
- Mobile (≤md): logo izq + hamburger der; nav principal oculto, exposed en `MobileMenu`.

**Responsive.**
- Desktop (≥lg): h 80 px, logo h 32 px, nav uppercase mono `--fs-label`, gap 32 px.
- Tablet (md): h 72 px, nav comprimido a 5 ítems.
- Mobile (<md): h 56 px, hamburger 44×44 px.

**A11y.**
- `<header role="banner">` con `<nav aria-label="Principal">`.
- Hamburger: `<button aria-expanded aria-controls="mobile-menu" aria-label="Abrir menú">`.
- Skip-link `<a href="#main">Saltar al contenido</a>` visible al focus.

**Motion.**
- Transición de bg/blur: 220 ms `--ease-snappy`.
- Hamburger morfa de "≡" a "—" al abrir (path morph SVG de 220 ms).
- Reducir-motion: bg cambia instantáneo; hamburger sin morph (cross-fade de iconos).

**Criterios de aceptación.**
- Cero overflow horizontal en 360 px.
- En `/area-clientes/*` el "Soy cliente" reemplaza por "Salir".
- Tab navigable en orden lógico.
- En reduced-motion no hay efecto de morph.

---

### 1.2. `MobileMenu`

**Propósito.** Overlay full-bleed que sustituye el dropdown comprimido actual.

**Estructura.**
```
[ Logo ]                                                            [ × ]
.
.
Capítulo                                                                      ← mono micro
Catálogo                                                                       ← Fraunces 56–72 px
Marcas
1966
Cobertura
Diario
.
.
Soy cliente                                                                    ← CTA pill paprika
.
es · en · de · it · zh                                                         ← language strip
```

**Props.**
```ts
type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  locale: string;
};
```

**Visual.**
- Bg `--color-bg-terracotta`. Texto `--color-ink-on-night`.
- Tipografía `--font-display` 600, `clamp(2.25rem, 8vw, 4.5rem)`.
- Labels micro `--font-mono` `--fs-label` `--color-ink-on-night-muted`.
- Acento `--color-brand-paprika` reservado para hover focus.

**Estados.**
- closed: `display: none` o `pointer-events: none; opacity: 0`.
- opening: fade-in 240 ms + stagger 60 ms por link (translateY 12 → 0, opacity 0 → 1).
- open: estable.
- closing: fade-out 200 ms (sin stagger).

**A11y.**
- `<dialog role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title">`.
- Focus trap mientras `open`.
- Esc cierra.
- Body `overflow: hidden` mientras `open`.
- Cuando `open`, `<HeaderEditorial>` z-index pasa a `auto` para no flotar encima.

**Motion.**
- `prefers-reduced-motion: reduce`: stagger desactivado, instantáneo.

**Criterios de aceptación.**
- Foco vuelve al hamburger al cerrar.
- Esc cierra.
- Tap fuera del menú no cierra (solo botón × o link clicado).

---

### 1.3. `UtilityBar`

**Propósito.** Barra opcional sobre el header con datos B2B críticos (teléfono, horario, delegaciones). Se incluye solo en `variant='home'` y `/contacto`. Eliminada del resto.

**Estructura.**
```
[ ☎ 968 46 75 14 · L–V 08:00–13:00 / 16:00–19:00 ]   [ pedidos@granjamaripepa.com ]   [ Murcia · Almería ]
```

**Visual.**
- bg `--color-bg-night`, texto `--color-ink-on-night`, h 36 px desktop / 32 px mobile.
- `--font-mono` `--fs-label`, separadores con `·`.

**Responsive.**
- ≥md: 3 columnas alineadas.
- <md: solo teléfono + locale (resto en menú/footer).

**A11y.**
- Teléfono `<a href="tel:+34968467514">`.
- Email `<a href="mailto:pedidos@granjamaripepa.com">`.
- Horario sin link, texto plano.

**Criterios.**
- Cero overflow.
- Tap en teléfono abre dialer en mobile.

---

### 1.4. `PromoStrip`

**Propósito.** Sustituye el carrusel actual "EDICIÓN ESPECIAL Revista TopGel". Se mantiene si negocio lo valida, pero como **strip simple, no carrusel**, y **dismissible con persistencia** en localStorage por 7 días.

**Props.**
```ts
type PromoStripProps = {
  message: string;
  href: string;
  ariaLabel?: string;
  storageKey: string;     // ej. 'promo-revista-topgel-2026-03'
};
```

**Visual.**
- bg `--color-brand-paprika`, texto `--color-ink-on-night`, h 40 px.
- `--font-mono` `--fs-label`. CTA inline subrayado al hover.
- Botón de cierre × top-right, 32×32 px.

**Persistencia.**
- Al cerrar guarda `{ key: storageKey, until: Date.now() + 7*86400000 }`.
- Al cargar, si `until > now`, no renderiza.

**A11y.**
- `<aside role="region" aria-label="Promoción">`.
- Cerrar `<button aria-label="Cerrar promoción">`.

**Criterios.**
- Sincronizado entre desktop y mobile.
- Cerrar persiste 7 días y no aparece en otros viewports al cambiar.
- Si `--reduced-motion`, sin animación de cierre.

---

### 1.5. `FooterEditorial`

**Propósito.** Cierre de página compositivo (sustituye el footer dark genérico actual).

**Estructura.**
```
=== bloque 1: noche oliva (--color-bg-night) ===

GRANJA MARI PEPA
Distribuidor Oficial Nestlé · ISO 9001 · Energía 100% Verde

[ Producto ]      [ Empresa ]      [ Contacto ]                  [ Newsletter ]
Catálogo          1966             968 46 75 14                  Email →
Mar               Equipo           639 77 86 55
Carnes            Cobertura        pedidos@granjamaripepa.com
Precocinados      Diario           L–V 08:00-13:00 / 16:00-19:00
Repostería
Helado

=== curva SVG ===

=== bloque 2: terracota ===

[ Lorca (Murcia) ]                   [ Almería ]
Polígono Saprelorca, c/...           c/...
Tlf 968 46 75 14                     Tlf 639 77 86 55

=== bloque 3: crema ===

© Granja Maripepa S.L. · Privacidad · Términos · Cookies        es · en · de · it · zh
```

**Visual.**
- Tres bloques de color con curva SVG de transición entre 1 y 2.
- Display "GRANJA MARI PEPA" en Fraunces 600 `clamp(3rem, 8vw, 6.5rem)`.
- Nav columnas en mono uppercase `--fs-label` muted.

**Responsive.**
- ≥lg: 4 columnas (Producto / Empresa / Contacto / Newsletter).
- md: 2×2.
- <md: 1 columna apilada.

**Motion.**
- Sin animación. El color cierra.

**A11y.**
- `<footer role="contentinfo">`.
- Newsletter form con `<label for>` y `aria-describedby` para política.

**Criterios.**
- Curva SVG nítida en retina.
- Direcciones reales (validar con cliente — si no se tiene, ocultar el bloque 2 hasta tener datos).

---

## 2. Hero

### <a id="hero-pinned"></a>2.1. `HeroPinned`

**Propósito.** Hero principal de home y de páginas con foto narrativa. Reemplaza el `cinematic-hero.tsx` actual.

**Patrón.** Inspirado en `SectionHeroMedia` de Joby. Media sticky durante ~1.5–1.8 viewports, mientras el subtítulo cambia en cross-fade entre 3 mensajes.

**Props.**
```ts
type HeroPinnedProps = {
  title: string;                       // "Distribución HORECA en el Levante. Desde 1966."
  subtitleSlides: string[];           // 3 frases rotantes
  media: { src: string; poster?: string; alt: string; type: 'image' | 'video' };
  cta?: { primary: { label: string; href: string }; secondary?: { label: string; href: string } };
  pinDuration?: '1' | '1.5' | '2';     // múltiplo del viewport
};
```

**Estructura.**
```
[ media full-bleed sticky ]
  [ chapter mono micro: "Capítulo 00 — Levante, 1966" ]
  [ h1 Fraunces 600, layered sobre la imagen ]
  [ subtitle slide rotante (Inter 500 lead) ]
  [ CTA primario · CTA secundario ]
```

**Visual.**
- Media: foto 16/9 desktop, 4/5 mobile, `object-fit: cover`. Si `type='video'`, autoplay muted loop, **no en data-saver ni reduced-motion**.
- Overlay degradado de abajo a arriba: `linear-gradient(180deg, rgba(31,36,24,0) 0%, rgba(31,36,24,.55) 100%)`.
- h1: `--font-display` 600 `--fs-display-xl`, color `--color-ink-on-night`.
- Subtítulo: `--font-body` 500 `--fs-lead`, color `--color-ink-on-night-muted`.

**Responsive.**
- ≥lg: pin durante `pinDuration * 100vh`, h1 al 60% de altura, CTA a 80%.
- <md: pin reducido (sin `position: sticky`), h1 al 75%, CTAs apilados full-width.

**A11y.**
- `aria-roledescription="hero"`.
- Las 3 slides expuestas como `<ul>` para screen readers, visualmente solo una visible (uso de `aria-hidden` dinámico).
- Si video, `<track kind="captions">` opcional.

**Motion.**
- Cross-fade entre slides 280 ms `--ease-snappy`.
- Cambio de slide cada 4 s o vinculado a scroll progress (preferido).
- `prefers-reduced-motion: reduce`: las 3 slides se renderizan apiladas debajo del h1, sin sticky, sin cross-fade.

**Criterios.**
- LCP < 2.5 s (poster image preload, video lazy).
- Sin overflow.
- En `/lorca` y futuras landings locales se reusa con `pinDuration='1'`.

---

### 2.2. `TypographicHero`

**Propósito.** Hero solo-tipografía (inspirado en `/company` de Joby). Para `/acerca` y declaraciones de marca.

**Props.**
```ts
type TypographicHeroProps = {
  eyebrow?: string;                  // "Capítulo 03 — La empresa"
  headline: string;                  // "60 años de oficio. Tres generaciones."
  background?: 'cream' | 'terracotta' | 'olive';
  cta?: { primary: { label: string; href: string } };
};
```

**Visual.**
- bg según prop.
- h1 oversized: `--font-display` 600 `clamp(3.5rem, 7vw, 8.5rem)`, color contrastado con bg.
- Eyebrow `--font-mono` `--fs-label` muted.

**Motion.**
- Stagger por palabra al entrar (60 ms).
- `prefers-reduced-motion`: render simultáneo.

**Criterios.**
- Sin imagen requerida; viable para páginas que no tienen foto adecuada.

---

### 2.3. `ColorBlockHero`

**Propósito.** Hero tipográfico + foto inferior (inspirado en `/careers` de Joby). Para `/equipo`, futuras pagi de comunicación.

**Props.**
```ts
type ColorBlockHeroProps = {
  bgColor: 'paprika' | 'olive' | 'sky';
  headline: string;
  cta?: { label: string; href: string };
  image: { src: string; alt: string };
};
```

**Visual.**
- Bloque de color superior 60 vh con h1 alineado izq.
- Foto inferior 40 vh fullbleed.

---

### 2.4. `HeroFullBleed`

**Propósito.** Foto/video fullbleed con caption (inspirado en `/technology` de Joby). Para `/calidad-y-frio` y páginas de marca.

**Props.**
```ts
type HeroFullBleedProps = {
  media: { src: string; alt: string; type: 'image' | 'video' };
  caption: string;                    // h1 cream sobre foto
  position?: 'bottom-left' | 'bottom-center' | 'top-left';
};
```

---

## 3. Editorial

### 3.1. `ChapterIntro`

**Propósito.** Bloque de transición entre capítulos. Marca el cambio de color identidad y el número de capítulo.

**Estructura.**
```
[ "Capítulo 02 — Catálogo" ]               ← mono
[ h2 Fraunces 600 ]
[ párrafo intro Inter 400 ]
[ línea decorativa ]
```

**Props.**
```ts
type ChapterIntroProps = {
  number: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
  surface?: 'cream' | 'terracotta' | 'olive' | 'paper';
};
```

---

### <a id="category-editorial"></a>3.2. `CategoryEditorial`

**Propósito.** Sustituye `product-categories.tsx`. Muestra las 4–5 familias de producto con peso editorial (foto grande + thumbs + claim).

**Estructura.**
```
[ "Catálogo · 5 familias · 1.500+ referencias" ]            ← claim mono
[ tab strip: Mar · Carnes · Precocinados · Repostería · Helado ]
[ foto principal (ratio 4/5)         h3 familia          ]
[ thumb · thumb · thumb              CTA "Ver familia"   ]
```

**Props.**
```ts
type CategoryEditorialProps = {
  families: Array<{
    slug: string;                    // 'mar' | 'carnes' | ...
    title: string;
    claim: string;                   // "De Cabo de Palos a tu cocina"
    color: 'mar' | 'carnes' | 'precocinados' | 'reposteria' | 'helado';
    photoMain: { src: string; alt: string };
    thumbs: Array<{ src: string; alt: string }>;
  }>;
};
```

**Motion.**
- Cambio de tab: cross-fade 240 ms del bloque foto + thumbs + texto.
- Hover en thumb: clip-path inset(2% 2% 2% 2%) → 0% en 220 ms.
- Reduced-motion: cambio instantáneo.

**A11y.**
- Tabs como `<button role="tab" aria-controls aria-selected>`.
- Panel `<div role="tabpanel" aria-labelledby>`.
- Navegación por flechas izq/der.

---

### <a id="brands-editorial"></a>3.3. `BrandsEditorial`

**Propósito.** Sustituye `distributors-section.tsx`. Lista marcas distribuidas con peso editorial.

**Estructura.**
```
[ Capítulo "Marcas" ]
[ Logo Nestlé en grande · "Distribuidor Oficial desde 19XX" · CTA "Ver catálogo Nestlé" ]
[ Topgel · Panamar · ... ]                 ← grid 2-4 columnas con logos
```

**Visual.**
- bg `--color-bg-terracotta` o crema según diseño global.
- Logos en SVG monocromo, `currentColor`.
- Marca destacada arriba con foto de producto.

**Props.**
```ts
type BrandsEditorialProps = {
  highlight: { name: string; logo: string; since?: string; href: string; photo: { src: string; alt: string } };
  others: Array<{ name: string; logo: string; href?: string }>;
};
```

---

### <a id="history-story"></a>3.4. `HistoryStory`

**Propósito.** Capítulo "1966" con número grande + claim + foto.

**Estructura.**
```
1966                    Tres generaciones desde Lorca.
                         Empezamos como freidora local.
                         Hoy repartimos a 1.500+ restaurantes
                         en Murcia y Almería.

                         [ foto histórica · foto actual ]
```

**Visual.**
- Número "1966" o "60" en Fraunces 700 `clamp(8rem, 18vw, 22rem)`, color `--color-brand-paprika`.
- Texto al lado en Inter 400 lead.

---

### 3.5. `Timeline`

**Propósito.** Hitos cronológicos en `/acerca`. Sustituye los 6 h3 duplicados actuales.

**Props.**
```ts
type TimelineProps = {
  items: Array<{
    year: string;
    title: string;
    description: string;
    photo?: { src: string; alt: string };
  }>;
};
```

**Visual.**
- Línea vertical con puntos en `--color-brand-paprika`.
- Año en mono, título en Fraunces 600, descripción en Inter 400.

**Motion.**
- Reveal por scroll, cada item con stagger 120 ms.

---

### 3.6. `EditorialMosaic`

**Propósito.** Asimetría editorial 6:1 (inspirada en sección "Experience Highlights" de Joby).

**Estructura.**
```
[ thumb pequeño   ]
                          [ FOTO PRINCIPAL ]
                                                   [ caption / claim ]
                                                   [ thumb pequeño   ]
```

**Props.**
```ts
type EditorialMosaicProps = {
  main: { src: string; alt: string; ratio: '4/5' | '3/2' | '1/1' };
  thumbs: Array<{ src: string; alt: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }>;
  caption: { eyebrow?: string; title: string; body?: string; cta?: { label: string; href: string } };
};
```

---

### <a id="testimonial-editorial"></a>3.7. `TestimonialEditorial`

**Propósito.** Quote de cliente real con foto.

**Estructura.**
```
"Pedimos a Mari Pepa cada lunes desde 2014. Nunca un fallo de cadena de frío."
— Carlos M. · Restaurante Las Lonjas, Águilas

[ foto del chef o del local ]
```

**Props.**
```ts
type TestimonialEditorialProps = {
  quote: string;
  attribution: { name: string; role: string; location: string };
  photo: { src: string; alt: string };
  variant?: 'photo-left' | 'photo-right' | 'photo-bg';
};
```

**A11y.**
- `<blockquote>` con `<cite>`.
- Si la foto es decorativa, `alt=""`.

---

### <a id="coverage-map"></a>3.8. `CoverageMap`

**Propósito.** Sustituye `delegations-section.tsx`. Mapa Murcia + Almería con datos críticos para B2B.

**Estructura.**
```
[ mapa SVG con dos pins ]   [ Murcia (Lorca, sede) · 968 46 75 14 · Saprelorca ]
                            [ Almería · 639 77 86 55 · ... ]
                            [ Plazos: 24-48 h en zona ]
                            [ Pedidos antes de las 12 h: entrega al día siguiente ]
```

**Visual.**
- SVG o `next/image` de mapa estilizado (no Google Maps embed por peso/perf).
- Pins en `--color-brand-paprika` con `aria-label`.
- Datos en cards `--color-bg-paper` con `--shadow-sm`.

**Props.**
```ts
type CoverageMapProps = {
  delegations: Array<{
    name: string;
    address: string;
    phone: string;
    schedule: string;
    cta?: { label: string; href: string };
  }>;
  notes?: string[];   // ['Pedidos antes de las 12 h se entregan al día siguiente.']
};
```

---

### 3.9. `MetricGrid`

**Propósito.** Cifras de marca (60 años · 1.500+ refs · 2 delegaciones · ISO 9001).

**Visual.**
- 4 columnas desktop, 2 mobile.
- Número en Fraunces 700 `--fs-display-md`, color `--color-brand-paprika`.
- Label en mono `--fs-label`.

**Motion.**
- Counter animado al entrar a viewport, 1.5 s.
- Reduced-motion: número final directo.

---

### 3.10. `BadgeRow`

**Propósito.** Badges institucionales (ISO 9001, Energía Verde, Distribuidor Oficial Nestlé).

**Visual.**
- Pills `--radius-pill`, bg `--color-bg-paper`, borde `--color-line-soft`.
- Icono Lucide + texto mono uppercase `--fs-label`.

---

## 4. CTA

### 4.1. `CTAPrimary`

**Propósito.** Botón principal (paprika sobre crema, crema sobre noche).

**Visual.**
- bg `--color-brand-paprika`, color `--color-ink-on-night`, padding 14 24 px desktop / 12 20 px mobile.
- `--radius-pill`, `--font-body` 600, `--fs-body-sm`, sin uppercase.
- Hover: bg shift -8% luminosidad + texto duplicado deslizando.
- Active: scale(0.98).
- Focus: outline 2 px paprika, offset 3 px.

**Props.**
```ts
type CTAPrimaryProps = {
  label: string;
  href?: string;       // si presente, renderiza <a>
  onClick?: () => void;
  iconAfter?: React.ReactNode;   // Lucide ArrowRight por defecto
  size?: 'md' | 'lg';
  fullWidth?: boolean;
};
```

**Motion.**
- Hover desktop: clon de texto translateY 0 → -100% mientras el original entra desde 100% → 0. Duración 280 ms `--ease-snappy`.
- Reduced-motion: solo cambio de bg.

---

### 4.2. `CTASecondary`

Igual estructura. Visual: `bg transparent`, borde `--color-line-strong`, color `--color-ink-primary`. Hover: bg `rgba(27,26,23,.04)`.

### 4.3. `CTAGhost`

Sin borde. Texto subrayado animado (pseudo-elemento `::after` con `width: 0 → 100%` en 220 ms).

### <a id="cta-band"></a>4.4. `CTABand`

**Propósito.** Banda full-bleed antes del footer con los dos CTAs principales.

**Visual.**
- bg `--color-brand-paprika`, padding vertical `--space-9`.
- h2 Fraunces 600 `--fs-display-md` cream.
- 2 CTAs alineados izq, ghost cream + primary cream-on-paprika invertido.

---

## 5. Producto

### 5.1. `ProductCard`

Sustituye `product-card.tsx` actual.

**Visual.**
- bg `--color-bg-paper`, `--radius-md`, `--shadow-sm` reposo / `--shadow-md` hover.
- Foto 1/1, `next/image`.
- Título Fraunces 600 `--fs-body-lg`.
- Marca en mono uppercase `--fs-label` muted.
- Código de cliente y referencia visibles.
- Sin precio público (B2B, precio detrás de login).

**Props.**
```ts
type ProductCardProps = {
  product: {
    id: string;
    name: string;
    brand: string;
    family: string;
    photo: { src: string; alt: string };
    code: string;
    reference?: string;
    isClientLogged?: boolean;
    price?: number;     // solo visible si isClientLogged
  };
  href: string;
};
```

**A11y.**
- Card es un `<a>` con `<article>` interno.
- Foto `loading="lazy"`.

---

### 5.2. `ProductHero`

Hero de ficha producto. Foto grande + datos (familia, marca, código, referencia, formato, conservación, etc.).

### 5.3. `ProductFamilyGrid`

Grid de productos dentro de una familia. Filtros laterales (marca, formato, conservación).

### 5.4. `ProductSpecsTable`

Tabla técnica para ficha (formato, peso, código EAN, conservación, alergenos).

---

## 6. Forms

Todos los forms usan React Hook Form + Zod (ya en stack).

### 6.1. `Field`

Input con label, helper, error.

**Props.**
```ts
type FieldProps = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  required?: boolean;
  helper?: string;
  error?: string;
  ...HTMLInputAttributes;
};
```

**Visual.**
- Label `--font-mono` `--fs-label` muted, encima del input.
- Input: bg `--color-bg-paper`, borde `--color-line-soft`, `--radius-sm`, padding 12 16 px.
- Focus: borde `--color-brand-paprika`, ring 2 px paprika 20%.
- Error: borde `--color-danger`, helper rojo.

### 6.2. `Textarea` / `Select` / `Checkbox`

Misma lógica visual. Checkbox con check SVG, no nativo styling.

### 6.3. `FormContact`

Estructura del actual `/contacto`. Campos: nombre, empresa, email, teléfono, mensaje, checkbox (acepto privacidad).

**A11y.**
- Cada `Field` con `<label for>`.
- Errores con `aria-describedby` y `role="alert"` al validar.
- Submit con loading state.

### 6.4. `FormLogin`

Estructura del actual `/area-clientes`. Campos: `codigoCliente`, `password`. **No cambiar `name`** (matchea backend `login` contract en CONTEXT.md).

---

## 7. Cookies & UI

### 7.1. `CookiePill`

**Propósito.** Sustituye banner cookies actual. Pill flotante bottom-center.

**Visual.**
- bg `--color-bg-paper`, borde `--color-line-soft`, `--radius-pill`, `--shadow-md`.
- Texto Inter 400 `--fs-body-sm` + 2 botones pill mini ("Aceptar" / "Rechazar").
- Position: `fixed; bottom: 16px; left: 50%; transform: translateX(-50%)`.
- Width: max 480 px desktop, calc(100vw - 32px) mobile.

**A11y.**
- `<aside role="region" aria-label="Cookies">` o `<dialog>` no modal.
- Foco automático al primer botón al aparecer.

---

### 7.2. `LanguageMenu`

**Propósito.** Sustituye los 5 botones de idioma del topbar actual.

**Estructura.**
- Botón "ES" en header con `aria-haspopup`.
- Al click despliega menú con 5 opciones, separa banderas (decorativas, `aria-hidden`) del código (`aria-label="Español"`, etc.).

---

### 7.3. `Toast`

Notificaciones (envío form OK / error).

**Visual.**
- bg `--color-success` (verde) / `--color-danger` (rojo).
- Position: `fixed; top: 80px; right: 16px`.
- Auto-dismiss 4 s.

---

### 7.4. `EmptyState`

Para `/productos` mientras catálogo no esté listo, en lugar de "Próximamente con candado":

**Visual.**
- Imagen ilustrativa pequeña (foto producto en plano cenital).
- h2 "El catálogo está en preparación".
- Body "Mientras tanto, llámanos al 968 46 75 14 o escribe a pedidos@granjamaripepa.com con tu lista. Te respondemos el mismo día."
- 2 CTAs: tel + email.

---

### 7.5. `Loading`

Skeletons. **Sin spinners genéricos.** Usar bloques rectangulares con shimmer suave (degradado mover de izq a der, 1.4 s, lineal).

---

## 8. Archivo (Diario / Recetas / Avisos)

### 8.1. `ArchiveHeader`

h1 "Diario" + intro + sidebar filtros (Todas / Marcas / Recetas / Avisos / Año).

### 8.2. `FilterSidebar`

**Visual.**
- Sticky en `lg+`, accordion en mobile.
- Items: mono `--fs-label`, activo con bullet paprika.

### 8.3. `ArticleCard`

Foto 16/9 + fecha mono + título Fraunces 600 + extracto Inter 400 + tag.

### 8.4. `Pagination`

Numérica simple con ‹ › nav. Nunca infinite-scroll.

---

## 9. Providers

### 9.1. `LenisProvider`

Inicializa Lenis 1.x global. Opciones: `lerp: .08`, `duration: 1.2`. Detecta `prefers-reduced-motion: reduce` y **no inicializa**.

### 9.2. `MotionPreferenceProvider`

Context que expone `prefersReducedMotion: boolean`. Se usa por `HeroPinned`, `MobileMenu`, `CategoryEditorial`, `Timeline`, `MetricGrid` para opt-out.

### 9.3. `LocaleProvider`

Wrap `next-intl`. Carga locale del segmento `[locale]`.

---

## 10. Inventario actual → destino

Mapeo completo en [component_map.json](component_map.json). Resumen:

| Actual | Destino |
|---|---|
| `cinematic-hero.tsx` | **Eliminar**. Reemplaza `HeroPinned` |
| `hero-section.tsx` | **Eliminar**. Reemplaza `HeroPinned` o `TypographicHero` según página |
| `delegations-section.tsx` | **Conservar lógica de datos**, **rediseñar** como `CoverageMap` |
| `distributors-section.tsx` | **Rediseñar** como `BrandsEditorial` |
| `product-categories.tsx` | **Rediseñar** como `CategoryEditorial` |
| `Header.tsx` | **Reescribir** como `HeaderEditorial` (no parchear) |
| `Footer.tsx` | **Reescribir** como `FooterEditorial` |
| `product-card.tsx` | **Reescribir** como nuevo `ProductCard` |
| `sections/company`, `sections/experience`, `sections/news`, `sections/technology` | **Eliminar carpetas enteras** |
| `auth/`, `cart/`, `catalog/`, `customer/`, `panamar/` | Conservar lógica, **rediseñar UI** componente a componente con tokens nuevos |
| `pds/`, `port-design-system/` | Auditar y consolidar — probable descarte |
| `ui/` | Migrar primitivos (Button, Input, etc.) a nueva paleta |
| `home/` | Eliminar archivos no listados arriba; los nuevos son `HeroPinned`, `CategoryEditorial`, `BrandsEditorial`, `HistoryStory`, `CoverageMap`, `TestimonialEditorial`, `CTABand` |

---

## 11. Reglas globales para todos los componentes

1. **Cero hex inline.** Todo color via `var(--color-*)`.
2. **Cero font-weight 900 ni uppercase en display.**
3. **Cero `box-shadow` con glow.** Solo escala neutra `--shadow-sm/md/lg`.
4. **Cero "✨ ⚡ 👑" emoji decorativo en copy.** Solo iconos Lucide o brand SVGs.
5. **Foco visible obligatorio** en todo elemento interactivo.
6. **Tap target ≥ 44 px** en todo `<button>` y `<a>` con icono solo.
7. **`prefers-reduced-motion: reduce` opt-out** para toda animación que dure > 200 ms o transforme posición.
8. **`next/image`** para todo asset raster.
9. **Self-host fonts** vía `next/font`, **subset latin**.
10. **Server Components por defecto.** `'use client'` solo si hay state, effect, o evento.
