# Port Design System - Extraction Report

Date: 2026-04-08
Source: C:\Users\Javier\Desktop\Repositorios\mari-pepa-redesign
Target: C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\frontend
Baseline commit (target): dc376a2cd4a33b9485f550fc8ae7a287f0041c96

## 1) Global design tokens extracted (literal source values)

### Color tokens
- `--cream: #F5F4DF`
- `--navy: #0E1620`
- `--joby-blue: #007AE5`
- `--joby-black: #000000`
- `--color-blue: #007ae5`
- `--color-white: #ffffff`
- `--color-black: #000000`
- `--color-beige: #f5f4df`
- `--color-grey: #6b7280`
- `--color-dark-blue: #0a1628`
- `--color-orange: #e8721c`
- `--color-primary-hover: #0066cc`
- `--color-focus: #007ae5`

### Layout + spacing system
- `--grid-columns: 16`
- `--grid-columns-mobile: 6`
- `--gutter-width: 2.4rem`
- `--gutter-width-mobile: 1.6rem`
- `--base-padding: 4rem`
- `--grid-column-width: calc((100vw - var(--base-padding) * 2 - var(--gutter-width) * 15) / 16)`

### Motion + easing
- `--ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1)`
- `--ease-out-curve-cubic: cubic-bezier(0.33, 1, 0.68, 1)`
- `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
- `--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1)`

### Typography
- Display font: `JobySans_Display_Variable.woff2`
- Text font: `JobySans_Text_Variable.woff2`
- Headings from source:
  - `h1`: `80px`, `font-weight: 550`, `letter-spacing: -2.4px`
  - `h2`: `64px`, `font-weight: 550`, `letter-spacing: -1.92px`
  - `h3`: `48px`, `font-weight: 500`, `letter-spacing: -1.44px`
  - mobile (`<=768px`): `h1 40px`, `h2 32px`, `h3 28px`

## 2) Animation primitives extracted

### Keyframes
- `fadeIn`
- `translateOutInX1`
- `translateOutInX2`
- `underlineInOut`
- `slideUpFade`
- `slideDownFade`
- `scaleIn`
- `scrollIndicator`

### Section / component CSS systems
- `[data-scroll-section]` progress variable set
- `.section-hero-media` + `.media-wrapper` + `.title` + `.subtitle`
- `.section-entry`, `.section-scrolly-text`, `.section-slider`, `.section-partners`
- `.section-news`, `.section-timeline-outer`
- `.joby-button` and `.joby-button.blue`
- `.inline-button`
- `.grid-inner`, `.sticky-wrapper`, `.responsive-media`, `.hide-scrollbar`

## 3) Lenis extraction

From source hooks/providers:
- `lerp: 0.08` (provider variant)
- `wheelMultiplier: 1`
- `touchMultiplier: 2`
- `infinite: false`
- `gestureOrientation: 'vertical'`
- `smoothWheel: true`
- raf loop with `requestAnimationFrame`

Applied in target via `components/providers/lenis-provider.tsx` and layout wrapper.

## 4) Notes on target adaptation

Target uses Next.js 14 + Tailwind v3, while source clone was built with Tailwind v4 directives.
Adaptation performed:
- Source visual tokens and component CSS copied and preserved.
- Tailwind v4-only directives removed/replaced with Tailwind v3-compatible `@tailwind base/components/utilities`.
- Source color intent preserved using HSL token equivalents for `hsl(var(--token))` usage in target Tailwind config.
- Existing business logic, routes, APIs, and server behaviors were not modified.
