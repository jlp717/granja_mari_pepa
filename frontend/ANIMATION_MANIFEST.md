# ANIMATION_MANIFEST

MANIFEST_TOTAL=17

Source visual reference: `https://www.jobyaviation.com`

| Estado | ID | Target | Source | Tipo | Trigger | Behavior | Evidence |
|---|---|---|---|---|---|---|---|
| PASS | ANIM-001 | `/[locale]` | `/` | VIDEO_SCRUB | Hero scroll | Fullscreen video is paused, `autoplay=false`, `loop=false`, and `currentTime` advances with scroll | `docs/pds/qa-evidence/v31-final-2/summary.json` |
| PASS | ANIM-002 | `/[locale]` | `/` | STICKY_PIN | Hero scroll | Hero media remains sticky/fullscreen through long scroll section | `docs/pds/qa-evidence/v31-final-2/home-1440x1200-0.png` |
| PASS | ANIM-003 | `/[locale]` | `/` | CSS_TRANSITION | Hero scroll vars | Title/subtitle/copy/CTA opacity is controlled by `--pds-hero-progress` | `components/home/cinematic-hero.tsx` |
| PASS | ANIM-004 | `/[locale]/productos` | `/technology` | VIDEO_SCRUB | Hero scroll | Technology intro video scrubbed from `0 -> 10s` | `docs/pds/qa-evidence/v31-final-2/summary.json` |
| PASS | ANIM-005 | `/[locale]/productos` | `/technology` | STICKY_PIN | Hero scroll | Technology hero uses fullscreen sticky media | `docs/pds/qa-evidence/v31-final-2/productos-1440x1200-0.png` |
| PASS | ANIM-006 | `/[locale]/contacto` | `/experience` | VIDEO_SCRUB | Hero scroll | Experience video scrubbed from `0 -> 29.967s` | `docs/pds/qa-evidence/v31-final-2/summary.json` |
| PASS | ANIM-007 | `/[locale]/contacto` | `/experience` | STICKY_PIN | Hero scroll | Experience hero pinned fullscreen | `docs/pds/qa-evidence/v31-final-2/contacto-1440x1200-0.png` |
| PASS | ANIM-008 | `/[locale]/acerca` | `/company` | SCROLL_TEXT_REVEAL | Scroll | Company-style title reveals character by character with opacity/translateY | `components/pds/scroll-title-hero.tsx` |
| PASS | ANIM-009 | Global | Source nav | DATA_ATTR/CSS_TRANSITION | Route + menu state | Transparent fixed nav; cream on dark pages, black on cream pages, black menu label on legal pages | `docs/pds/qa-evidence/v31-final-2/privacidad-1440x1200-0-after-header.png` |
| PASS | ANIM-010 | Global | Source nav | CSS_TRANSITION | Mobile menu | Fullscreen dark menu panel with menu-button morph | `components/layout/header.tsx` |
| PASS | ANIM-011 | Legal pages | `/privacy-policy`, `/terms-of-use` | STICKY_LAYOUT | Document scroll | Source legal composition with left title and body column | `docs/pds/qa-evidence/v31-final-2/privacidad-1440x1200-0-after-header.png` |
| PASS parcial | ANIM-012 | Home lower page | `/` | SCROLL_GALLERY | Scroll | Dream/gallery section moves horizontally via scroll progress variable, but exact source timing still needs delta QA | `components/pds/joby-sections.tsx` |
| PASS parcial | ANIM-013 | Home partners | `/` | STICKY_PIN | Scroll | Partner section is sticky and source-like; exact source list/media timing pending | `components/pds/joby-sections.tsx` |
| PASS parcial | ANIM-014 | `/[locale]/productos` interior | `/technology` | MULTI_VIDEO_SEQUENCE | Long technical scroll | Aircraft-style source video sequence is ported with 5 extracted videos; exact source timing and every hidden video state still pending | `docs/pds/qa-evidence/v31-final-4/summary.json` |
| PENDING | ANIM-015 | `/[locale]/productos` interior | `/technology` | CANVAS_SCROLL/WEBGL | Long technical scroll | Source extraction found 5 canvases; target does not yet recreate them | `docs/pds/extraction/v31-full/technology-1440.json` |
| PASS parcial | ANIM-016 | `/[locale]/acerca` interior | `/company` | VIDEO_SEQUENCE | Company page scroll | Rounded company timeline media section uses the 4 extracted source videos and scroll-driven active label | `docs/pds/qa-evidence/v31-final-4/summary.json` |
| PENDING | ANIM-017 | All pages | All source pages | PIXEL_DELTA_QA | 375/768/1440 visual QA | Need final per-section screenshots and diff thresholds before calling complete | `docs/pds/qa-evidence/v31-final-2/summary.json` |

## Current Video Scrub QA

- Home: `currentTime 0 -> 13.196s` at 25% page scroll, `paused=true`, `autoplay=false`, `loop=false`, fullscreen cover.
- Productos: `currentTime 0 -> 10s` at 25% page scroll, `paused=true`, `autoplay=false`, `loop=false`, fullscreen cover.
- Contacto: `currentTime 0 -> 12.615s` at 25% page scroll, `paused=true`, `autoplay=false`, `loop=false`, fullscreen cover.
- Acerca: no hero video; title reveal is scroll-driven and nav color is black on cream.
- Productos interior: active source videos verified at scroll `6200`, `8200` and `10400` with viewport-wide media.
- Acerca interior: 4 source company videos present; active source video verified at scroll `3000` and `4700` with rounded source-style media frame.

## Stop Condition Status

- `ScrollTrigger.getAll()` is not used in the target implementation; scroll effects are implemented with native RAF + CSS variables.
- Source visible text is not copied into target UI except allowed target English legal strings.
- This manifest does not mark the migration complete because technology canvas/WebGL surfaces, every mapped route and final pixel-delta QA remain pending.
