# MOTION_GUIDELINES.md — Granja Mari Pepa

> Especificación de motion e interacción. Acompaña a [DESIGN.md](DESIGN.md), [COMPONENTS.md](COMPONENTS.md).

---

## 1. Filosofía

El movimiento **acompaña la lectura**. No la sustituye, no la decora.

- **Pausado, no perezoso.** La marca lleva 60 años, no necesita correr; pero tampoco debe sentir letargo.
- **Funcional siempre.** Cada animación tiene una de estas intenciones: revelar, indicar progreso, dar feedback de interacción, marcar transición de capítulo. Si no cae en alguna, no se anima.
- **Optativo siempre.** `prefers-reduced-motion: reduce` desactiva todo motion no esencial. La interfaz sigue funcionando con la misma información.
- **Sin loops infinitos.** Cero animaciones permanentes (rotaciones idle, breathing, glow pulse).

---

## 2. Tokens

```css
:root {
  /* Easings (Joby naming, replicados) */
  --ease-snappy:        cubic-bezier(.2,.21,0,1);
  --ease-power4-out:    cubic-bezier(.165,.84,.44,1);
  --ease-power2-inOut:  cubic-bezier(.455,.03,.515,.955);
  --ease-out-expo:      cubic-bezier(.16,1,.3,1);
  --ease-out-back:      cubic-bezier(.34,1.56,.64,1);

  /* Durations */
  --motion-fast:    160ms;
  --motion-base:    240ms;
  --motion-medium:  400ms;
  --motion-slow:    600ms;
  --motion-deliberate: 800ms;

  /* Stagger */
  --stagger-word:   60ms;
  --stagger-line:   90ms;
  --stagger-card:   80ms;

  /* Reveal y cross-fade */
  --reveal-y:       16px;
  --xfade:          280ms;
}
```

**Reglas.**
- Estados hover / focus / active: `--motion-fast` (160 ms).
- Cambios de UI (toast in/out, menú abre/cierra): `--motion-base` (240 ms).
- Reveals al entrar viewport: `--motion-slow` (600 ms).
- Transiciones de capítulo / hero pinned: `--motion-deliberate` (800 ms).
- **Prohibido** > 1 s en cualquier animación (excepto el counter de números, ver §6.4).

---

## 3. Smooth scroll (Lenis)

**Activación.** En `LenisProvider` global de `app/layout.tsx`.

**Config.**
```ts
new Lenis({
  lerp: 0.08,
  duration: 1.2,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false,    // touch nativo
});
```

**Reduced-motion.**
```ts
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) return;   // no init
```

**Reglas.**
- Solo en desktop / mouse / trackpad. Mobile usa scroll nativo.
- No re-inicializar entre rutas; persiste como singleton.
- Verificar que no rompe `position: sticky` ni anchors `#id`.

---

## 4. Reveal de sección (`IntersectionObserver`)

**Patrón unificado.** Cualquier sección o card que aparece por scroll usa este reveal.

```css
.reveal { opacity: 0; transform: translateY(var(--reveal-y)); transition: opacity var(--motion-slow) var(--ease-power4-out), transform var(--motion-slow) var(--ease-power4-out); }
.reveal.is-in { opacity: 1; transform: translateY(0); }
```

**JS.**
```tsx
const ref = useRef<HTMLElement>(null);
useIntersectionOnce(ref, () => ref.current?.classList.add('is-in'));
```

**Reglas.**
- `threshold: 0.15` y `rootMargin: '0px 0px -10% 0px'`.
- Una vez activado, **no se desactiva**. No reactivo al scroll arriba/abajo.
- Reduced-motion: aplicar `is-in` directamente al render.

---

## 5. Stagger por palabra en titulares

**Donde sí**: h1 de hero, h2 de capítulo (4–6 por home).
**Donde no**: h3 de subsección, body, labels, listas. La fatiga es real.

**Implementación.**
```tsx
<DisplayHeading text="Distribución HORECA en el Levante. Desde 1966." stagger />
```

`<DisplayHeading>` divide en `<span>` por palabra y aplica `transition-delay: calc(var(--stagger-word) * var(--i))`.

**Reduced-motion.** Las palabras renderizan sin transform/opacity inicial.

---

## 6. Patrones específicos

### 6.1. `HeroPinned` cross-fade de subtítulos

- 3 slides que cambian con scroll progress.
- Cross-fade `--xfade` (280 ms).
- Slide actual: `opacity 1`. Saliendo: `opacity 0; transform: translateY(8px)`.
- Si `prefers-reduced-motion: reduce`: las 3 frases se renderizan apiladas en `<ul>` debajo del h1, sin sticky, sin cross-fade.

### 6.2. Hover de cards

```css
.card { transition: transform var(--motion-base) var(--ease-power4-out), box-shadow var(--motion-base); }
@media (hover: hover) {
  .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
}
```

**Sin tilt 3D.** No replicar el patrón del DESIGN.md anterior.

### 6.3. CTA con texto duplicado

```html
<a class="cta">
  <span class="cta__text">Ver catálogo</span>
  <span class="cta__text cta__text--clone" aria-hidden="true">Ver catálogo</span>
</a>
```

```css
.cta { overflow: hidden; }
.cta__text { display: inline-block; transition: transform var(--xfade) var(--ease-snappy); }
.cta__text--clone { position: absolute; transform: translateY(100%); }
@media (hover: hover) {
  .cta:hover .cta__text { transform: translateY(-100%); }
  .cta:hover .cta__text--clone { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .cta__text--clone { display: none; }
}
```

**A11y.** El clon es `aria-hidden`. El SR solo lee la copia visible.

### 6.4. Counter de números (solo `MetricGrid`)

- Tween de 1.5 s con `--ease-out-expo`.
- Solo se dispara una vez al entrar viewport.
- Reduced-motion: número final renderiza directo.

```ts
function CounterNumber({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useIntersectionOnce(ref, () => {
    if (reduced) return ref.current!.textContent = to.toString();
    animate(0, to, 1500, '--ease-out-expo', v => ref.current!.textContent = Math.round(v).toString());
  });
  return <span ref={ref}>{reduced ? to : 0}</span>;
}
```

### 6.5. Hamburger morfa a línea

SVG con dos `<path>` que comparten `id` y se interpolan con `<animate>` o con CSS keyframes sobre `d` (Chrome/Safari modernos soportan `d` animable).

Más simple y compatible: dos iconos cross-fade — `≡` opacity 1→0 + `—` opacity 0→1, en 240 ms.

### 6.6. Mobile menu open

1. Overlay terracota fade-in 240 ms.
2. Tras 80 ms, links stagger 60 ms cada uno (translateY 12 → 0, opacity 0 → 1).
3. Body `overflow: hidden` mientras open.
4. Reduced-motion: render directo sin stagger ni fade.

### 6.7. Page transitions

**No implementar** transiciones de ruta complejas (fade, slide, clip-path).

Razones:
- Next.js App Router ya tiene navegación instantánea con prefetch.
- Una transición de 500 ms en cada navegación = peor UX percibida en B2B.

Sí implementar:
- **Loading state simple** en `loading.tsx` por segmento (skeleton en su sitio).
- **`viewTransitions: true`** experimental si se valida estable; con `view-transition-name` solo en `<HeroPinned>` para morphing entre páginas con misma identidad visual (home → /productos).

### 6.8. Filtros de archivo

`FilterSidebar` activa: bullet paprika opacity 0 → 1, scale 0 → 1, en 220 ms.

### 6.9. Tabs en `CategoryEditorial`

Cross-fade del bloque foto + thumbs + texto en 240 ms `--ease-snappy`. Tab activo con underline animado (pseudo-elemento width 0 → 100%).

### 6.10. Cookie pill aparición

Slide-up + fade 320 ms tras 600 ms del primer paint (no inmediato).

---

## 7. Anti-patrones explícitos

- ❌ Parallax exagerado (background fixed que se mueve a otra velocidad). Genera mareo y consume CPU.
- ❌ Carruseles auto-rotantes con autoplay. Si hay carrusel (no recomendado), siempre con click manual.
- ❌ Cursor custom. No aporta nada en B2B y rompe expectativas del sistema.
- ❌ Page preloader. La home debe pintar < 2.5 s; un preloader añade tiempo, no lo quita.
- ❌ Glows pulsing infinito en CTAs.
- ❌ Sparkles, partículas flotantes, "magic" reveals.
- ❌ Tilt 3D en cards.
- ❌ Splash screens.
- ❌ Easing `cubic-bezier(.34,1.56,.64,1)` (`--ease-out-back`) en contenido. Reservado solo para feedback de éxito (toast OK).

---

## 8. Performance budget motion

- JS de motion en home **< 25 KB gzipped** (Lenis ≈ 5 KB + IntersectionObserver wrapper + 1–2 utilities).
- **Cero GSAP en home.** Cargarlo solo en rutas que lo requieran de verdad (ver decisión final del equipo en F5).
- **Cero R3F / Three.js en `/`, `/contacto`, `/area-clientes`, `/lorca`.** Reservado para casos futuros con justificación de UX.
- **Animar siempre `transform` y `opacity`.** Nunca `top`, `left`, `width`, `height` (force layout).
- `will-change` solo durante la animación, no en estado idle.

---

## 9. `prefers-reduced-motion: reduce` — checklist

Antes de marcar un componente como completo, verificar:

- [ ] Lenis no se inicializa.
- [ ] `<HeroPinned>` no usa sticky; las 3 slides se renderizan apiladas.
- [ ] Stagger por palabra deshabilitado.
- [ ] Reveal por scroll: contenido visible directo.
- [ ] Cross-fade de tabs: cambio instantáneo.
- [ ] Counter: número final directo.
- [ ] CTA con texto duplicado: clon oculto, sin slide.
- [ ] Hamburger: cross-fade en lugar de morph (o instantáneo).
- [ ] Cookie pill: aparece sin slide-up.
- [ ] Toast: aparece sin slide.

---

## 10. Test manual

QA debe verificar en cada release:

1. Activar OS reduced-motion (macOS: System Settings → Accessibility → Display → Reduce motion. Windows: Settings → Ease of Access → Display → Show animations).
2. Recargar cada ruta. Confirmar checklist §9.
3. Profile rendering en DevTools. Cualquier animación que dispare `Layout` o `Paint` repetido se debe optimizar.
4. Throttle CPU 4× + Slow 4G. Hero LCP < 2.5 s.
