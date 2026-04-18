# Extraction Format Reference

Use this exact structure when compiling the extracted design system in Phase 3.

---

## TOKEN_MAP

```yaml
colors:
  primary:
    50: "#f0f9ff"
    100: "#e0f2fe"
    # ... full scale
    900: "#0c4a6e"
    DEFAULT: "#0284c7"   # Most used shade
  secondary:
    # ... same scale structure
  accent:
    # ...
  neutral:
    # ... grays/blacks/whites
  semantic:
    success: "#22c55e"
    warning: "#f59e0b"
    error: "#ef4444"
    info: "#3b82f6"
  background:
    primary: "#ffffff"      # Main page bg
    secondary: "#f8fafc"    # Card/section bg
    tertiary: "#f1f5f9"     # Subtle contrast
  foreground:
    primary: "#0f172a"      # Body text
    secondary: "#475569"    # Muted text
    tertiary: "#94a3b8"     # Placeholder text

typography:
  font_families:
    display: "'Söhne', system-ui, sans-serif"
    body: "'Inter', system-ui, sans-serif"
    mono: "'JetBrains Mono', monospace"
  font_sizes:
    xs: "0.75rem"       # 12px
    sm: "0.875rem"      # 14px
    base: "1rem"        # 16px
    lg: "1.125rem"      # 18px
    xl: "1.25rem"       # 20px
    2xl: "1.5rem"       # 24px
    3xl: "1.875rem"     # 30px
    4xl: "2.25rem"      # 36px
    5xl: "3rem"         # 48px
    6xl: "3.75rem"      # 60px
    hero: "4.5rem"      # 72px — if target uses larger display sizes
  line_heights:
    tight: "1.1"
    snug: "1.25"
    normal: "1.5"
    relaxed: "1.625"
    loose: "2"
  font_weights:
    light: 300
    normal: 400
    medium: 500
    semibold: 600
    bold: 700
    black: 900
  letter_spacing:
    tighter: "-0.05em"
    tight: "-0.025em"
    normal: "0"
    wide: "0.025em"
    wider: "0.05em"

spacing:
  scale:
    0: "0"
    1: "0.25rem"    # 4px
    2: "0.5rem"     # 8px
    3: "0.75rem"    # 12px
    4: "1rem"       # 16px
    5: "1.25rem"    # 20px
    6: "1.5rem"     # 24px
    8: "2rem"       # 32px
    10: "2.5rem"    # 40px
    12: "3rem"      # 48px
    16: "4rem"      # 64px
    20: "5rem"      # 80px
    24: "6rem"      # 96px
    32: "8rem"      # 128px
  container:
    max_width: "1280px"
    padding_x: "1.5rem"  # Horizontal page padding
    padding_x_lg: "2rem" # At larger breakpoints

shadows:
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
  glow: "0 0 20px rgb(59 130 246 / 0.5)"  # If target uses glow effects

radii:
  none: "0"
  sm: "0.125rem"
  DEFAULT: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1.5rem"
  full: "9999px"

borders:
  width:
    DEFAULT: "1px"
    2: "2px"
  color:
    DEFAULT: "#e2e8f0"
    muted: "#f1f5f9"
    strong: "#cbd5e1"

breakpoints:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
  2xl: "1536px"

z_index:
  behind: -1
  base: 0
  dropdown: 50
  sticky: 100
  overlay: 200
  modal: 300
  popover: 400
  toast: 500
  tooltip: 600

transitions:
  duration:
    fast: "150ms"
    DEFAULT: "200ms"
    slow: "300ms"
    slower: "500ms"
  easing:
    DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)"     # ease-in-out
    in: "cubic-bezier(0.4, 0, 1, 1)"
    out: "cubic-bezier(0, 0, 0.2, 1)"
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"  # If bouncy effects detected
```

---

## ANIMATION_MANIFEST Structure

```yaml
scroll_animations:
  - name: "hero-reveal"
    trigger: "viewport-entry"          # viewport-entry | scroll-position | scroll-progress
    element: ".hero-title, .hero-subtitle"
    library: "framer-motion"           # css | framer-motion | gsap | intersection-observer
    properties:
      opacity: { from: 0, to: 1 }
      translateY: { from: "30px", to: "0" }
    duration: "0.8s"
    delay: "0s"                        # Or stagger: "0.1s" for children
    easing: "ease-out"
    threshold: 0.2                     # IntersectionObserver threshold

parallax_effects:
  - name: "hero-background-parallax"
    element: ".hero-bg"
    speed: 0.5                         # Scroll multiplier (0 = fixed, 1 = normal)
    direction: "vertical"
    library: "css"                     # css | gsap | lenis

video_scrub:
  - name: "product-demo-scrub"
    element: "video.demo"
    scroll_start: "top center"         # GSAP ScrollTrigger format
    scroll_end: "bottom center"
    library: "gsap"                    # gsap | intersection-observer

three_d_scenes:
  - name: "hero-globe"
    element: "canvas#globe"
    library: "three"                   # three | @react-three/fiber
    description: "Rotating 3D globe with dotted surface, auto-rotate + mouse interaction"
    complexity: "medium"               # low | medium | high
    fallback: "static SVG globe illustration"

hover_states:
  - component: "cta-button"
    properties:
      transform: { default: "scale(1)", hover: "scale(1.05)" }
      box-shadow: { default: "none", hover: "0 8px 20px rgb(0 0 0 / 0.15)" }
    duration: "200ms"
    easing: "ease-out"

page_transitions:
  - name: "route-crossfade"
    type: "crossfade"                  # crossfade | slide | morph | none
    duration: "300ms"
    library: "framer-motion"

loading_states:
  - name: "skeleton-pulse"
    type: "skeleton"                   # skeleton | spinner | shimmer | progress
    animation: "pulse 1.5s ease-in-out infinite"

keyframes:
  - name: "shimmer"
    definition: |
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
```

---

## UI_PATTERNS Structure

```yaml
layout:
  grid_system: "CSS Grid + Flexbox"
  container: "max-w-7xl mx-auto px-6"
  section_spacing: "py-24"             # Vertical rhythm between sections

navigation:
  type: "sticky-header"               # sticky-header | sidebar | bottom-nav | mega-menu
  mobile: "hamburger-slide"            # hamburger-slide | hamburger-overlay | bottom-sheet
  blur_bg: true                        # backdrop-filter: blur
  transparent_on_hero: true

hero:
  type: "split"                        # split | centered | full-bleed | video-bg
  has_gradient: true
  gradient_definition: "from-blue-600 to-purple-600"
  cta_count: 2
  has_social_proof: true

cards:
  border: true
  shadow: "sm"
  radius: "lg"
  hover_effect: "shadow-lift"          # shadow-lift | border-glow | scale | none
  padding: "p-6"

buttons:
  variants:
    primary:
      bg: "bg-primary"
      text: "text-white"
      radius: "rounded-lg"
      padding: "px-6 py-3"
      hover: "brightness-110"
    secondary:
      bg: "bg-transparent"
      text: "text-primary"
      border: "border border-primary"
    ghost:
      bg: "bg-transparent"
      text: "text-foreground"
      hover: "bg-muted"

dark_mode:
  strategy: "class"                    # class | media | data-attribute
  toggle_mechanism: "manual"           # manual | system-preference | both
  transitions: true                    # Smooth color transitions on toggle
```

---

## ASSETS_LIST Structure

```yaml
fonts:
  - family: "Inter"
    source: "google-fonts"             # google-fonts | typekit | self-hosted | system
    weights: [400, 500, 600, 700]
    subsets: ["latin"]
    variable: true                     # Variable font

icons:
  system: "lucide"                     # lucide | heroicons | phosphor | feather | custom-svg
  size_default: "24px"
  stroke_width: "1.5"

gradients:
  - name: "hero-gradient"
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    usage: "Hero section background"

images:
  - pattern: "blur-placeholder"        # How images are loaded
    aspect_ratios: ["16/9", "1/1", "4/3"]
    object_fit: "cover"
    lazy_loading: true
```

---

## Notes on Extraction

When filling in this format:
- **Use actual values** extracted from the target site, not placeholders
- **Mark uncertain values** with a `# [uncertain]` comment
- **Omit sections** that aren't present on the target site (not every site has 3D scenes or video scrub)
- **Prefer CSS custom property names** from the source when they exist (e.g., `--color-primary` from the target)
- **Note the source page** for each pattern: `# source: homepage`, `# source: /pricing`