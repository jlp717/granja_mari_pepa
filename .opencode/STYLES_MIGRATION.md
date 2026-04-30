# STYLES_MIGRATION.md — Granja Mari Pepa

> Plan de migración del sistema de estilos actual (1.157 líneas en `frontend/app/globals.css` + `tailwind.config.js` shadcn) al nuevo sistema editorial mediterráneo. Acompaña a [DESIGN.md](DESIGN.md) y [COMPONENTS.md](COMPONENTS.md).

---

## 1. Diagnóstico del sistema actual

### 1.1. Archivos clave

| Archivo | LOC | Estado |
|---|---|---|
| `frontend/app/globals.css` | 1.157 | Tokens HSL shadcn-style, glow shadows, modo dark, glassmorphism |
| `frontend/tailwind.config.js` | 88 | shadcn defaults reskin, plugin `tailwindcss-animate` |
| `frontend/components/**/*.tsx` | varios | CSS Modules + clases Tailwind sobre tokens HSL |

### 1.2. Problemas

1. **Cabecera `🎨 PREMIUM DESIGN SYSTEM - LINEAR/ARC INSPIRED`** — referencia errónea (las decisiones del sitio referencian Joby, no Linear/Arc).
2. **Paleta SaaS-template**: azul 217 / cyan 190 / purple 280 / amber 38 / emerald 160. Sin conexión con HORECA, sin paleta cálida, sin Mediterráneo.
3. **Glow shadows**: `--shadow-glow-blue/green/purple` generan la estética IA-template visible en cards y CTAs.
4. **Glassmorphism**: `--glass-bg`, `--glass-border`, `--glass-highlight` con `rgba(255,255,255,0.08)` reforzando la lectura "tech UI".
5. **Modo dark** completo (líneas ~141 en adelante) que no se necesita en el rediseño.
6. **Sin tipografía display**. Solo Inter cargada.
7. **Tokens en HSL** (formato shadcn) más difícil de leer y debug que hex/rgb.
8. **Tailwind config** registra colores como `hsl(var(--background))` etc., depende del formato HSL del custom property.

---

## 2. Estrategia general

**Sustitución global, no refactor progresivo.** Razones documentadas en `DESIGN.md` §7.8.

### 2.1. Branch y aislamiento

- Branch nuevo `redesign-2026` para todos los cambios estructurales.
- Quick wins (i18n, math, chrome triple, copy hero) van a `main` directamente.
- En `redesign-2026`:
  1. Reescribir `globals.css` desde cero.
  2. Reescribir `tailwind.config.js`.
  3. Borrar carpetas / archivos obsoletos.
  4. Crear primitivos nuevos.
  5. Reescribir páginas una a una (orden Fase 2 → 4 del plan).
  6. Ejecutar QA y test e2e antes de merge.

### 2.2. Compatibilidad backend

- `name` de inputs no cambia (ver `CONTEXT.md` backend contracts).
- Endpoints / shapes JSON no se tocan.
- El rediseño es **frontend-only**.

### 2.3. Compatibilidad SEO

- URLs públicas se preservan: `/`, `/acerca`, `/contacto`, `/lorca`, `/area-clientes`.
- Páginas nuevas (`/calidad-y-frio`, `/marcas`, `/casos`, `/diario`, `/almeria`) se crean.
- Páginas 404 (`/experience`, `/technology`, `/company`, `/sostenibilidad`, `/noticias`, `/trabajo`) se eliminan del repo. **Configurar redirección 301** en `next.config.js` o `middleware.ts` si Search Console las reporta como indexadas:
  - `/experience` → `/calidad-y-frio` (la promesa de "experiencia" queda mejor servida ahí).
  - `/technology` → `/calidad-y-frio`.
  - `/company` → `/acerca`.
  - `/sostenibilidad` → `/calidad-y-frio#energia-verde`.
  - `/noticias` → `/diario`.
  - `/trabajo` → `/equipo` o `/contacto`.

### 2.4. Validar antes de mergear

- Lighthouse scores ≥ baseline actual.
- Cero claves i18n crudas en producción.
- Test e2e Playwright de rutas críticas (home → catálogo → ficha → área cliente → login).
- Visual regression baseline en 7 viewports.

---

## 3. Nuevo `tokens.css`

Crear `frontend/app/styles/tokens.css` (o equivalente) con el siguiente contenido. **Reemplaza** los tokens actuales de `globals.css`.

```css
/* ============================================================
 * tokens.css — Granja Mari Pepa
 * Sistema visual editorial mediterráneo profesional.
 * Fuente: .opencode/DESIGN.md §10
 * ============================================================ */

:root {
  /* ─── Surfaces ─── */
  --color-bg-page:        #F4EFE6;   /* crema cálida */
  --color-bg-paper:       #FBF7EE;   /* paneles claros */
  --color-bg-night:       #1F2418;   /* oliva profundo */
  --color-bg-terracotta:  #A0382A;   /* terracota mate */

  /* ─── Ink ─── */
  --color-ink-primary:    #1B1A17;
  --color-ink-secondary:  #4A453E;
  --color-ink-muted:      #8A8275;
  --color-ink-on-night:   #F4EFE6;
  --color-ink-on-night-muted: #C9C2B0;

  /* ─── Brand ─── */
  --color-brand-paprika:  #C24A1F;
  --color-brand-olive:    #5C6238;
  --color-brand-sky:      #9CB4C2;

  /* ─── Family-specific (chapter colors /productos/[categoria]) ─── */
  --family-mar:           #6E8DA1;
  --family-carnes:        #8E2A1D;
  --family-precocinados:  #C8A36B;
  --family-reposteria:    #D6A89C;
  --family-helado:        #C8D1B8;

  /* ─── Functional ─── */
  --color-success:        #4F6B3F;
  --color-warning:        #C28A1F;
  --color-danger:         #8B2A1A;

  /* ─── Lines ─── */
  --color-line-hair:      rgba(27,26,23,0.08);
  --color-line-soft:      rgba(27,26,23,0.18);
  --color-line-strong:    rgba(27,26,23,0.40);
  --color-line-on-night:  rgba(244,239,230,0.16);

  /* ─── Typography ─── */
  --font-display: 'Fraunces', 'Söhne Buch', Georgia, serif;
  --font-body:    'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, 'Cascadia Code', monospace;

  --fs-display-xl: clamp(3rem, 6vw + 1rem, 7.5rem);
  --fs-display-lg: clamp(2.25rem, 4vw + 1rem, 5.25rem);
  --fs-display-md: clamp(1.75rem, 2vw + 1rem, 3.25rem);
  --fs-lead:       clamp(1.125rem, .5vw + 1rem, 1.5rem);
  --fs-body-lg:    1.125rem;
  --fs-body:       1rem;
  --fs-body-sm:    0.875rem;
  --fs-label:      0.75rem;
  --fs-micro:      0.6875rem;

  /* ─── Spacing ─── */
  --space-1:  4px;   --space-2:  8px;   --space-3:  12px;
  --space-4:  16px;  --space-5:  24px;  --space-6:  32px;
  --space-7:  48px;  --space-8:  64px;  --space-9:  96px;
  --space-10: 128px; --space-11: 160px;

  /* ─── Layout ─── */
  --container-max:     1320px;
  --container-pad-x:   clamp(1rem, 4vw, 4rem);
  --section-pad-y:     clamp(4rem, 8vw, 9rem);

  --grid-cols-desktop: 12;
  --grid-cols-tablet:  8;
  --grid-cols-mobile:  4;
  --grid-gutter:       clamp(.75rem, 1vw, 1.25rem);

  /* ─── Radius ─── */
  --radius-xs:   4px;
  --radius-sm:   8px;
  --radius-md:   16px;
  --radius-lg:   24px;
  --radius-pill: 999px;

  /* ─── Shadows (neutral, no glow) ─── */
  --shadow-sm: 0 1px 2px rgba(27,26,23,.06), 0 1px 1px rgba(27,26,23,.04);
  --shadow-md: 0 4px 12px rgba(27,26,23,.08), 0 2px 4px rgba(27,26,23,.04);
  --shadow-lg: 0 12px 32px rgba(27,26,23,.10), 0 4px 12px rgba(27,26,23,.06);

  /* ─── Motion ─── */
  --ease-snappy:        cubic-bezier(.2,.21,0,1);
  --ease-power4-out:    cubic-bezier(.165,.84,.44,1);
  --ease-power2-inOut:  cubic-bezier(.455,.03,.515,.955);
  --ease-out-expo:      cubic-bezier(.16,1,.3,1);

  --motion-fast:    160ms;
  --motion-base:    240ms;
  --motion-medium:  400ms;
  --motion-slow:    600ms;
  --motion-deliberate: 800ms;

  --stagger-word: 60ms;
  --stagger-card: 80ms;
  --reveal-y:     16px;
  --xfade:        280ms;

  /* ─── Z-index scale ─── */
  --z-base:       1;
  --z-sticky:     50;
  --z-header:     100;
  --z-overlay:    900;
  --z-modal:      1000;
  --z-toast:      1100;
}
```

---

## 4. Nuevo `globals.css`

`frontend/app/globals.css` se reduce a:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/tokens.css';

/* Reset selectivo */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; -webkit-tap-highlight-color: transparent; text-rendering: optimizeLegibility; }
body {
  margin: 0;
  background: var(--color-bg-page);
  color: var(--color-ink-primary);
  font: 400 var(--fs-body)/1.5 var(--font-body);
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
button { background: none; border: 0; padding: 0; cursor: pointer; color: inherit; }
a { color: inherit; text-decoration: inherit; }
:focus-visible { outline: 2px solid var(--color-brand-paprika); outline-offset: 3px; border-radius: var(--radius-xs); }

/* Display heading reset */
h1, h2, h3, h4, h5, h6 { margin: 0; font: inherit; }

/* Container */
.container { width: 100%; max-width: var(--container-max); margin-inline: auto; padding-inline: var(--container-pad-x); }

/* Reveal pattern (motion) */
.reveal { opacity: 0; transform: translateY(var(--reveal-y)); transition: opacity var(--motion-slow) var(--ease-power4-out), transform var(--motion-slow) var(--ease-power4-out); }
.reveal.is-in { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0ms !important;
    transition-delay: 0ms !important;
  }
  .reveal { opacity: 1; transform: none; }
  html { scroll-behavior: auto; }
}

/* Selection */
::selection { background: var(--color-brand-paprika); color: var(--color-bg-page); }
```

**Total esperado**: ~80 líneas (vs. 1.157 actuales).

> Modo dark fuera del MVP. Si se reactiva, vivirá en `tokens.dark.css` con `@media (prefers-color-scheme: dark)` y switch manual via `data-theme="dark"`. **No bloquear lanzamiento por modo dark.**

---

## 5. Nuevo `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        page:        'var(--color-bg-page)',
        paper:       'var(--color-bg-paper)',
        night:       'var(--color-bg-night)',
        terracotta:  'var(--color-bg-terracotta)',
        // Ink
        ink:         'var(--color-ink-primary)',
        'ink-soft':  'var(--color-ink-secondary)',
        'ink-muted': 'var(--color-ink-muted)',
        'ink-on-night':       'var(--color-ink-on-night)',
        'ink-on-night-muted': 'var(--color-ink-on-night-muted)',
        // Brand
        paprika: 'var(--color-brand-paprika)',
        olive:   'var(--color-brand-olive)',
        sky:     'var(--color-brand-sky)',
        // Family
        'family-mar':           'var(--family-mar)',
        'family-carnes':        'var(--family-carnes)',
        'family-precocinados':  'var(--family-precocinados)',
        'family-reposteria':    'var(--family-reposteria)',
        'family-helado':        'var(--family-helado)',
        // Functional
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      fontSize: {
        'display-xl': 'var(--fs-display-xl)',
        'display-lg': 'var(--fs-display-lg)',
        'display-md': 'var(--fs-display-md)',
        lead:    'var(--fs-lead)',
        'body-lg': 'var(--fs-body-lg)',
        body:    'var(--fs-body)',
        'body-sm': 'var(--fs-body-sm)',
        label:   'var(--fs-label)',
        micro:   'var(--fs-micro)',
      },
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      spacing: {
        1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)',
        4: 'var(--space-4)', 5: 'var(--space-5)', 6: 'var(--space-6)',
        7: 'var(--space-7)', 8: 'var(--space-8)', 9: 'var(--space-9)',
        10:'var(--space-10)', 11:'var(--space-11)',
      },
      container: { center: true },
      transitionTimingFunction: {
        snappy: 'var(--ease-snappy)',
        'p4-out': 'var(--ease-power4-out)',
      },
      transitionDuration: {
        fast:        '160ms',
        base:        '240ms',
        medium:      '400ms',
        slow:        '600ms',
        deliberate:  '800ms',
      },
      maxWidth: {
        container: 'var(--container-max)',
      },
    },
  },
  plugins: [],   // No tailwindcss-animate; el motion vive en tokens propios
};
```

**Cambios respecto al actual.**
- Sin `darkMode`. Reactivar luego con preset.
- Colores en hex/rgb (CSS vars), no HSL.
- Sin `chart-1..5`, `popover`, `accent` shadcn.
- Sin `tailwindcss-animate` (era para el accordion shadcn — Radix puede vivir sin él o con animaciones manuales).

---

## 6. Carga de fuentes

`frontend/app/layout.tsx`:

```tsx
import { Inter, Fraunces, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-static',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  axes: ['opsz'],
  variable: '--font-display-static',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-static',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

`tokens.css` final:
```css
--font-display: var(--font-display-static), 'Söhne Buch', Georgia, serif;
--font-body:    var(--font-body-static), system-ui, sans-serif;
--font-mono:    var(--font-mono-static), ui-monospace, monospace;
```

---

## 7. Borrado de archivos

### 7.1. Carpetas / archivos a eliminar (Fase 1)

```
frontend/app/[locale]/experience/         ← 404 en producción
frontend/app/[locale]/technology/         ← 404 en producción
frontend/app/[locale]/company/            ← 404 en producción
frontend/app/[locale]/sostenibilidad/     ← 404 en producción
frontend/app/[locale]/noticias/           ← 404 en producción
frontend/app/[locale]/trabajo/            ← 404 en producción
frontend/app/[locale]/login-secure-example/ ← ejemplo, no producción

frontend/app/[locale]/productos/_disabled_id/
frontend/app/[locale]/productos/page-original-completo.tsx.bak
frontend/app/[locale]/productos/page.tsx.backup
frontend/app/[locale]/productos/page.tsx.full-backup
frontend/app/[locale]/productos/page_broken.tsx
frontend/app/[locale]/productos/page_new.tsx
frontend/app/[locale]/productos/page_old.tsx
frontend/app/[locale]/productos/page_with_errors.tsx.bak

frontend/components/sections/company/
frontend/components/sections/experience/
frontend/components/sections/news/
frontend/components/sections/technology/

frontend/components/home/cinematic-hero.tsx
frontend/components/home/hero-section.tsx
```

### 7.2. Carpetas a auditar antes de borrar

```
frontend/components/pds/                  ← ¿port-design-system? duplicado con port-design-system/
frontend/components/port-design-system/   ← parece intento previo de design system
```

> Antes de borrar, comprobar imports residuales con `grep -r "from.*pds" frontend/`.

### 7.3. Logs / artefactos de dev

```
frontend/.next-dev-3001.err.log
frontend/.next-dev-3001.out.log
frontend/.next-dev-3200.err.log
frontend/.next-dev-3200.out.log
frontend/dev-local.err.log
frontend/dev-local.out.log
frontend/dev-redesign-err.log
frontend/dev-redesign-out.log
frontend/dev-server-3000.err.log
frontend/dev-server-3000.log
frontend/dev-target-3001*.log
frontend/dev-target-3001*.err.log
frontend/dev-target-3001*.out.log
frontend/build.log
```

Añadir a `.gitignore` y borrar del histórico si ocupan demasiado.

### 7.4. Carpetas conservadas

```
frontend/components/auth/         ← conservar lógica, rediseñar UI
frontend/components/cart/         ← conservar lógica, rediseñar UI
frontend/components/catalog/      ← conservar lógica, rediseñar UI
frontend/components/customer/     ← conservar lógica, rediseñar UI (área clientes)
frontend/components/panamar/      ← conservar lógica, rediseñar UI
frontend/components/products/     ← conservar lógica, rediseñar UI (`product-card.tsx` se reescribe)
frontend/components/providers/    ← agregar LenisProvider, MotionPreferenceProvider, LocaleProvider
frontend/components/pwa/          ← conservar
frontend/components/seo/          ← conservar
frontend/components/ui/           ← migrar primitivos a tokens nuevos (no eliminar)
```

---

## 8. Migración página a página

| Página | Acción | Sustituciones clave |
|---|---|---|
| `/` | Reescribir | `hero-section.tsx` → `HeroPinned`; `cinematic-hero.tsx` → eliminar; `product-categories.tsx` → `CategoryEditorial`; `distributors-section.tsx` → `BrandsEditorial`; `delegations-section.tsx` → `CoverageMap` |
| `/acerca` | Reescribir | Hero gradient → `TypographicHero`; sección Historia → `Timeline`; cifras → `MetricGrid`; quitar duplicados de h3 |
| `/contacto` | Reescribir | Hero "Hablemos" gradient → `TypographicHero`; eliminar Globo 3D R3F; form RHF idem (cambia visual) |
| `/lorca` | Reescribir | Hero dark → `HeroPinned` con foto local; corregir math 55→60 |
| `/area-clientes` | Reescribir | Hero gradient → `TypographicHero`; form login idem (visual) |
| `/productos` | **Implementar** | Sustituir "Próximamente" por `EmptyState` y, en su evolución, listado real |
| `/productos/[categoria]` | **Implementar** | `ProductFamilyGrid` con filtros |
| `/productos/[categoria]/[producto]` | **Implementar** | `ProductHero` + `ProductSpecsTable` |
| `/marcas` | **Crear** | `BrandsEditorial` extendido + listado |
| `/calidad-y-frio` | **Crear** | `HeroFullBleed` + `MetricGrid` + `BadgeRow` |
| `/casos` | **Crear** | `TestimonialEditorial` repetido + `EditorialMosaic` |
| `/diario` | **Crear** | `ArchiveHeader` + `FilterSidebar` + grid `ArticleCard` |
| `/almeria` | **Crear** | Hermana de `/lorca`, mismo `HeroPinned` |
| `/equipo` (F3) | **Crear** | `ColorBlockHero` + grid retratos |
| `/checkout` | Auditar | Aún no auditado en este pase |
| `/legal/{privacidad,terminos}` | Reescribir visual | Cuerpo de texto, tipografía display + Inter 400 lead |
| `/offline` | Reescribir visual | Mensaje simple + CTA volver |

---

## 9. Migración de Tailwind classes existentes

### 9.1. Tabla de equivalencias

| Antes | Después |
|---|---|
| `bg-background` | `bg-page` |
| `text-foreground` | `text-ink` |
| `text-muted-foreground` | `text-ink-muted` |
| `bg-card` | `bg-paper` |
| `bg-primary` | `bg-paprika` |
| `text-primary` | `text-paprika` |
| `bg-secondary` | `bg-paper` (suele ser superficie suave) |
| `bg-accent` | **Eliminar uso decorativo**, sustituir por `bg-sky` solo si aporta info |
| `bg-destructive` | `bg-danger` |
| `border-border` | `border-ink/10` o token equivalente |
| `shadow-glow-blue/green/purple` | **Eliminar** (sin reemplazo) |
| `text-purple` | **Eliminar** (paleta no contiene morado) |
| `font-bold` (peso 700) en headings | `font-display` weight 600 |
| `uppercase` en headings | **Eliminar** salvo en `text-mono` labels |
| `font-black` (peso 900) | **Eliminar** uso, máximo `font-semibold` |
| `tracking-wider` en headings | **Eliminar** |

### 9.2. Comando de búsqueda inicial

```bash
grep -rn "shadow-glow" frontend/ --include="*.tsx" --include="*.css"
grep -rn "font-black\|uppercase" frontend/components --include="*.tsx"
grep -rn "from-blue\|to-purple\|to-pink" frontend/ --include="*.tsx"
```

> Listar todos los hits y migrar uno a uno. No hacer find-and-replace masivo: contexto importa.

---

## 10. Orden de ejecución (resumen Fase 1)

```
1. Crear branch: redesign-2026
2. Quick wins en main:
   - Resolver claves i18n footer
   - Corregir 55 → 60 años (o "Desde 1966")
   - Sincronizar carrusel promo
   - Aria-labels switcher idioma
3. En redesign-2026:
   3.1. Borrar páginas 404 (configurar redirects 301 si SEO lo justifica)
   3.2. Borrar /productos/{*.bak,_old,_broken,_with_errors,_disabled_id}
   3.3. Auditar pds/ y port-design-system/ y borrar si no se usan
   3.4. Reescribir frontend/app/styles/tokens.css desde §3
   3.5. Reescribir frontend/app/globals.css desde §4
   3.6. Reescribir frontend/tailwind.config.js desde §5
   3.7. Configurar fuentes en frontend/app/layout.tsx desde §6
   3.8. Crear primitivos: Button, Field, Container, Section, DisplayHeading
   3.9. Crear LenisProvider y MotionPreferenceProvider
   3.10. Verificar que el sitio compila y home pinta SIN componentes nuevos:
        - Esperar fondo crema, tipografía Fraunces visible, sin glow
        - Esto confirma que la migración de tokens no rompe Tailwind
4. Pasar a Fase 2 (Home + Header + Footer + MobileMenu) — ver IMPLEMENTATION_PLAN.md
```

---

## 11. Validación post-migración (auto-check)

Antes de mergear `redesign-2026 → main`:

- [ ] `npm run build` sin errores ni warnings nuevos.
- [ ] `npm run lint` clean.
- [ ] `npm run typecheck` clean.
- [ ] `npm run test` (Jest unit) verde.
- [ ] `npm run test:e2e` (Playwright) verde para flujos críticos.
- [ ] Lighthouse a11y ≥ 95 en `/`, `/acerca`, `/contacto`, `/area-clientes`, `/lorca`, `/productos`.
- [ ] Lighthouse perf ≥ 90 móvil.
- [ ] Cero claves i18n crudas en producción (`grep -r "footer\." frontend/.next/server`).
- [ ] Cero `console.error` en home, `/contacto`, `/area-clientes`.
- [ ] Visual regression Playwright comparada con baseline previa: hero crema, sin gradientes IA, footer compositivo.
- [ ] Test manual en 7 viewports (ver QA_CHECKLIST.md).

---

## 12. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| CSS Modules existentes referencian variables HSL que dejan de existir | Alta | Buscar y reemplazar `hsl(var(--*))` por `var(--color-*)`. Test build después de migrar tokens |
| Tailwind classes inválidas (`bg-purple`, `shadow-glow-*`) generan visual roto | Media | Eliminar usos antes de borrar tokens. Lint con `tailwindcss/no-custom-classname` |
| Componentes Radix (shadcn) dependen de `tailwindcss-animate` | Media | Migrar accordion / dialog a animaciones propias o restaurar plugin si necesario |
| Backend espera `name="codigoCliente"` y se cambia accidentalmente | Baja | E2E test cubre login. Code review obligatorio en cualquier cambio a forms |
| Fuentes Google bloquean LCP | Baja | `next/font` con `display: swap`, subset latin, preload manual del weight crítico |
| Lenis rompe `position: sticky` en algún componente | Media | Test manual después de activación; conocer límite y sustituir sticky por `IntersectionObserver` cuando aplique |
| Modo dark queda sin actualizar y se renderiza si el usuario lo activa | Baja | Eliminar `darkMode` de tailwind.config y bloque `.dark` de globals.css en F1; reactivar en fase futura con tokens.dark.css completo |
| Pérdida de tráfico SEO en rutas borradas | Baja | Configurar redirects 301 documentados arriba; medir impact en Search Console primer mes post-migración |
