# port-design-system v2.0

Port the complete visual design system — including all dynamic, scroll-driven, and interactive behavior — from any public website into your local Next.js project.

## What Changed in v2.0

| v1 Problem | v2 Solution |
|-----------|-------------|
| Static HTML extraction only | **Browser Mode**: real scroll simulation, screenshots at each position, JS execution for computed styles |
| Missed scroll-triggered animations | Scrolls page in 10% increments, captures GSAP ScrollTrigger states, IntersectionObserver activations |
| No hover state detection | Hovers over elements, captures before/after computed style diffs |
| Single scope options | Supports `scope=/experience,/technology` (comma-separated specific paths) |
| Missed 3D scenes | Detects `window.THREE`, canvas elements, WebGL contexts |
| Missed video scrub | Tracks `video.currentTime` at each scroll position |
| Generic fallback | Smart dual-mode: Browser Mode (preferred) with Fetch Mode fallback |

## Dual Extraction Modes

### Browser Mode (Claude.ai with Claude in Chrome, or Claude Code with browser MCP)
- Navigates to the site in a real browser
- Scrolls section by section (8-12 stops per page)
- Screenshots at each scroll position
- Executes JavaScript to extract computed CSS variables, @keyframes, animation library globals
- Hovers over elements to capture state transitions
- Detects dark mode toggles and captures alternate palettes

### Fetch Mode (Fallback — no browser available)
- Uses `web_fetch` for static HTML/CSS analysis
- Parses stylesheets for tokens, @keyframes, media queries
- Detects animation libraries from `<script>` tags
- Less complete for dynamic behaviors, but still extracts core design tokens

## Usage

```bash
# Full site with auto-discovered pages
/port-design-system "./my-project" "https://jobyaviation.com" scope=all

# Specific pages only
/port-design-system "." "https://jobyaviation.com" scope=/experience,/technology

# Just the homepage + key interiors (default)
/port-design-system "./app" "https://linear.app" scope=home

# Single page, maximum depth
/port-design-system "./app" "https://stripe.com/payments" scope=single

# Or just describe naturally:
# "Make my project look like jobyaviation.com. Project is at ./frontend"
```

## What Gets Extracted

| Category | Details |
|----------|---------|
| **Tokens** | CSS variables, colors, typography, spacing, shadows, radii, breakpoints, z-index, transitions |
| **Scroll Animations** | GSAP ScrollTrigger timelines, scroll-driven transforms, reveal sequences, parallax offsets |
| **Video Scrub** | Video currentTime mapped to scroll position |
| **3D Scenes** | Three.js/R3F canvas detection, camera states, lighting changes on scroll |
| **Smooth Scroll** | Lenis/Locomotive detection and configuration |
| **Hover States** | Computed style diffs (transform, shadow, color, opacity, border) for key interactive elements |
| **Dark Mode** | Toggle detection, class/data-attribute/media-query method, alternate token palette |
| **UI Patterns** | Navigation, hero variants, card styles, CTA blocks, grid systems, form patterns |
| **Assets** | Google Fonts/Typekit links, icon system, gradient definitions, image patterns |

## File Structure

```
port-design-system/
├── SKILL.md                              # Main skill (286 lines)
├── README.md                             # This file
└── references/
    ├── DYNAMIC_EXTRACTION.md             # 6 JavaScript extraction scripts + scroll procedure
    ├── EXTRACTION_FORMAT.md              # YAML structure for design system document
    └── ANIMATION_PATTERNS.md             # Implementation patterns + decision tree
```

## Output

After running, your project gets a `design-port/` directory:

```
your-project/
├── design-port/
│   ├── PAGE_MAPPING.md                   # Target pages → local routes
│   ├── ANIMATION_MANIFEST.md             # Per-page scroll timeline + hover states
│   └── MIGRATION_SUMMARY.md             # Everything changed, deps needed, manual steps
├── tailwind.config.ts                    # Extended tokens
├── app/globals.css                       # New/modified CSS variables
├── components/ui/                        # Ported components
└── hooks/                                # Scroll/animation hooks
```

## Installation

### Claude.ai (this web interface)
The skill is already active if you uploaded it. Just start a conversation and say:
```
/port-design-system "./my-project" "https://target-site.com"
```
**Note:** For Browser Mode (the good stuff), you need Claude in Chrome extension installed and connected.

### Claude Code in VS Code
```bash
# Navigate to your project
cd ~/your-project

# Create the skills directory
mkdir -p .claude/skills/port-design-system

# Copy all skill files there
cp -r /path/to/port-design-system/* .claude/skills/port-design-system/

# Now open Claude Code and use it
```

### Cursor
```bash
mkdir -p .cursor/skills/port-design-system
cp -r /path/to/port-design-system/* .cursor/skills/port-design-system/
```

## Limitations

- Target site must be publicly accessible (no auth-gated pages)
- Browser Mode requires Claude in Chrome extension
- Max 8 pages per run to prevent context exhaustion
- Complex Three.js scenes get documented but approximated with simpler alternatives
- Proprietary fonts are identified but must be licensed by the user
- Max 1 new animation library recommended per port