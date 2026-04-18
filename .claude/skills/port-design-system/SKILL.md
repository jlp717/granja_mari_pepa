---
name: port-design-system
description: >
  Port the complete visual design system from any public website into a local Next.js project.
  Extracts design tokens, animations (GSAP, Framer Motion, Lenis, Three.js, CSS), scroll behaviors,
  hover states, dark mode, UI patterns, and assets — then maps onto the project's existing stack.
  Trigger on: "port the design from [site]", "copy the look of [url]", "make my project look like [website]",
  "extract design system from [url]", "clone the visual style", "port-design-system",
  "/port-design-system", "replicate the UI of", "match the design of [url]",
  "design system migration", "visual port from [site]", or extracting design tokens/animations
  from a live URL into a Next.js/React/Tailwind project.
---

# Port Design System Skill v2.0

Port the complete frontend visual identity — including all dynamic, scroll-driven, and interactive behavior — of any public website into your local Next.js project.

## Activation

```
/port-design-system "<local-project-path>" "<target-url>" [scope]
```

**Arguments:**
- `local-project-path` — Path to the user's project root
- `target-url` — Public website URL to extract from
- `scope` — What to analyze:
  - `single` — Only the given URL (fastest)
  - `home` — Homepage + up to 4 key interior pages (default)
  - `all` — Sitemap crawl, capped at 8 pages
  - `/path1,/path2,/path3` — Specific paths relative to the domain

If the user doesn't use exact syntax, infer arguments from context and confirm before proceeding.

---

## Philosophy

**93% dynamic cloning that works > 100% that breaks.**

This skill uses two extraction modes depending on environment:

### Browser Mode (preferred — Claude in Chrome available)
Uses `navigate`, `computer` (scroll/screenshot), `javascript_tool`, and `read_page` to:
- Actually scroll the page from top to bottom in increments
- Screenshot at each scroll position to observe dynamic behavior
- Execute JS to extract computed styles, CSS variables, @keyframes, animation library globals
- Detect scroll-triggered animations, parallax, video scrub, 3D scene changes
- Hover over interactive elements to capture state transitions

### Fetch Mode (fallback — no browser)
Uses `web_fetch` for static HTML/CSS analysis. Less complete for dynamic sites, but still extracts tokens, fonts, layout patterns, and detectable animations from source code.

**Auto-detection:** Check for `Claude in Chrome:navigate` tool availability. If available → Browser Mode. Otherwise → Fetch Mode. Tell the user which mode you're using.

---

## Workflow (7 Phases)

### Phase 1 — Validate Local Project (DS-First)

Before touching anything external, deeply understand the user's existing design system.

1. **Read the project structure:**
   ```
   view <project-path>
   ```

2. **Read these files** (all that exist):
   - `package.json` — deps, scripts, framework version
   - `tailwind.config.ts` / `.js` — existing theme tokens
   - `app/globals.css` or `styles/globals.css` — CSS variables
   - `components.json` — shadcn/ui config
   - `next.config.js` / `.mjs`
   - `tsconfig.json` — path aliases
   - `app/layout.tsx` — font imports, providers, global wrappers
   - `lib/` or `utils/` — animation hooks, scroll utilities

3. **Build a Local Stack Profile:**
   - Framework: Next.js version + router type
   - Styling: Tailwind version, CSS Modules, styled-components, etc.
   - Components: shadcn/ui, Radix, MUI, custom
   - Animation libs installed: framer-motion, gsap, lenis, three, @react-three/fiber
   - Existing tokens: CSS variables, Tailwind theme, design tokens
   - Existing routes: list all routes in `app/` directory
   - Code style: TS/JS, semicolons, quotes, indent

4. **Present the profile** and confirm with user.

### Phase 2 — Discover Target Pages (Multi-Page Intelligence)

**For scope=single:** Skip, use exact URL.

**For scope=/path1,/path2:** Parse comma-separated paths, prepend domain.

**For scope=home or scope=all:**
1. Fetch target URL
2. Extract nav links from `<nav>`, header, footer, sitemap.xml
3. Select most visually distinct pages (homepage always included)
4. Present discovered pages with rationale:
   ```
   Found these pages on jobyaviation.com:
   1. / (Homepage — hero video, key animations)
   2. /experience (Immersive — likely parallax/scroll)
   3. /technology (Technical — diagrams, 3D models)
   4. /about (Story — timeline, team)
   Analyze these 4? Or specify different ones?
   ```
5. Wait for confirmation.

**Hard cap: 8 pages.** Beyond 8 = context exhaustion risk.

### Phase 3 — Dynamic Extraction (The Core)

For each page, perform deep extraction. Read `references/DYNAMIC_EXTRACTION.md` for all JavaScript snippets.

#### Browser Mode Procedure (per page):

**Step 1 — Navigate & initial capture:**
- `navigate` to URL, wait 2-3s for load
- Screenshot above-the-fold state
- Run Token Extraction Script via `javascript_tool`:
  - All CSS custom properties from `:root` and `html`
  - All computed @keyframes
  - Font families from computed styles
  - All box-shadow, border-radius, transition values in use
- Run Animation Detection Script:
  - Check `window.gsap`, `window.__FRAMER_MOTION__`, `window.Lenis`, `window.THREE`
  - Detect ScrollTrigger instances
  - Find all `<canvas>` elements (WebGL/Three.js)
  - Find `<video>` elements with scroll-driven attributes

**Step 2 — Scroll simulation (section by section):**
- Get page height: `document.documentElement.scrollHeight`
- Calculate 8-12 scroll stops (~10% increments + section boundaries)
- For each stop:
  1. `window.scrollTo({ top: position, behavior: 'instant' })`
  2. Wait 800ms for animations to trigger
  3. Screenshot current viewport
  4. Run Scroll State Script:
     - Elements that entered/exited viewport
     - CSS classes added/removed since last stop
     - Transform values on animated elements
     - Video `currentTime` if scrubbing
     - Opacity/visibility changes
  5. Note differences from previous stop

**Step 3 — Hover state capture:**
- Identify 5-8 key interactive elements (buttons, cards, nav items)
- For each:
  1. Record default computed styles (transform, shadow, color, bg, border, opacity)
  2. `hover` over element
  3. Wait 300ms
  4. Record hover computed styles
  5. Calculate the diff = hover state definition

**Step 4 — Dark mode detection:**
- Look for theme toggle via `find("theme toggle")` or `find("dark mode switch")`
- If found: click, wait 500ms, re-run Token Extraction to capture dark palette
- If media query: extract dark tokens from CSS `prefers-color-scheme: dark` rules
- Click toggle again to restore original state

**Step 5 — Compile per-page data:**
- Tokens with source specificity
- Scroll timeline: what happens at each 10% of page
- Interaction states for key components
- Section-by-section layout descriptions (from screenshots)
- Asset inventory (fonts, icons, imagery)

#### Fetch Mode Procedure (per page):
- `web_fetch` the URL
- Parse for CSS custom properties, stylesheets, inline styles
- `web_fetch` linked CSS files for @keyframes, media queries, tokens
- Detect animation libs from `<script>` sources
- Note: dynamic behaviors inferred but not observed

### Phase 4 — Build Extracted Design System

Compile per-page data into unified design system. Read `references/EXTRACTION_FORMAT.md` for structure.

Must include:
- **TOKEN_MAP** — Colors, typography, spacing, shadows, radii, transitions, breakpoints
- **ANIMATION_MANIFEST** — Every animation with trigger point, library, scroll position
- **SCROLL_BEHAVIOR_MAP** — Section-by-section behavior for each page
- **UI_PATTERNS** — Component patterns across pages
- **ASSETS_LIST** — Fonts, icons, gradients, image patterns

Present summary with key findings to user before proceeding.

### Phase 5 — DS-First Mapping

Map every extracted element onto the user's existing project.

1. **Token Mapping:** Match each token to local equivalent (Tailwind theme, CSS vars, etc.)
2. **Animation Mapping:** Use decision tree from `references/ANIMATION_PATTERNS.md`. Golden rule: max 1 new animation library per port.
3. **Component Mapping:** shadcn/ui → customize. Local component → modify. None → create using local conventions. Never copy source class names.
4. **Route Mapping:** Map target pages to local routes. Suggest new routes for unmatched pages.
5. **Present the full mapping plan** and get approval before generating code.

### Phase 6 — Generate Adapted Code

Generate changes in logical groups:
1. **Tokens** — tailwind.config, globals.css, theme files
2. **Hooks & Utilities** — useInView, useParallax, scroll hooks
3. **Components** — new/modified with ported styles
4. **Animations** — configs, timelines, motion variants
5. **Pages** — layout changes, section ordering

Rules:
- Follow project's code style exactly
- Use existing import aliases
- Include `/* ported from: [url] — [element] */` comments
- Show diffs for all modifications
- Never install packages without asking

### Phase 7 — Generate Migration Documents

Create in `design-port/` at project root:

**PAGE_MAPPING.md** — Target pages → local routes with sections and key animations per page.

**ANIMATION_MANIFEST.md** — Global behaviors + per-page scroll map showing what happens at each scroll percentage + hover states table.

**MIGRATION_SUMMARY.md** — Tokens ported, files changed, deps to install, manual steps, known limitations.

---

## Error Handling

- **Browser blocked (CORS, paywall):** Fall to Fetch Mode for that page.
- **Page >10s load:** Retry once, then skip.
- **SPA routing:** Use `javascript_tool` for route changes.
- **Heavy 3D:** Document structure, offer CSS/SVG fallbacks.
- **Minified code:** Use computed styles. Note gaps.
- **Ambiguity:** Ask the user. Never guess.

---

## Rules

1. **DS-first.** Analyze local project BEFORE the target site.
2. **Never overwrite without diffs.** Every change gets approval.
3. **Never install packages silently.** List, explain, ask.
4. **Cap at 8 pages.** Hard limit.
5. **Never copy raw CSS/classNames.** Translate to local system.
6. **Honest about limitations.** Offer alternatives for impossible effects.
7. **Browser Mode preferred, Fetch Mode fallback.** Never refuse because browser is missing.
8. **All three migration docs are mandatory.**
9. **Max 1 new animation library** unless user explicitly wants more.
10. **Scroll extraction is section-by-section**, not bulk.

---

## Reference Files

- `references/DYNAMIC_EXTRACTION.md` — JS snippets for browser-mode extraction
- `references/EXTRACTION_FORMAT.md` — YAML structure for design system document
- `references/ANIMATION_PATTERNS.md` — Implementation patterns + decision tree

---

## Examples

**Example 1 — Complex aviation site:**
```
/port-design-system "./joby-clone" "https://jobyaviation.com" scope=all
```
→ Discovers /experience, /technology, /about from nav. Scrolls each page, capturing GSAP timelines, Three.js aircraft, video scrub, Lenis smooth scroll. Maps to user's Tailwind + Framer Motion stack.

**Example 2 — Specific pages:**
```
/port-design-system "." "https://jobyaviation.com" scope=/experience,/technology
```
→ Only those two pages. Focused, fast.

**Example 3 — Conversational:**
```
Make my app look like Linear's website. Project at ~/dev/my-app
```
→ Infers target=linear.app, scope=home. Extracts dark-mode tokens, subtle hovers, clean typography.

**Example 4 — Single page deep:**
```
port-design-system "./app" "https://stripe.com/payments" scope=single
```
→ Maximum fidelity for one page. Every scroll position, every hover state, every gradient.