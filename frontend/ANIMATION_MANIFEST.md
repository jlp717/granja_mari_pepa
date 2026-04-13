# ANIMATION_MANIFEST v3.3

Source visual reference: `https://www.jobyaviation.com`

Generated from `docs/pds/extraction/v33/summary.json`.

MANIFEST_TOTAL=20

## Implementation Decision

- GSAP: `false`
- Lenis: `false`
- Framer Motion: `false`
- Scroll handler: `NATIVE_SCROLL_OR_RAF`
- Reveal system: `CSS_INTERSECTION_OBSERVER`
- Video scrub: `NATIVE_RAF_OR_SCROLL`
- Page transition capability detected: `VIEW_TRANSITIONS`

The target must not use GSAP, Lenis or Framer Motion for the ported source motion.

| Estado | ID | Source page | Tipo | Trigger | Comportamiento source | Evidencia |
|---|---|---|---|---|---|---|
| PENDING | A001 | `/` | NATIVE_RAF_VIDEO_SCRUB | Scroll hero `0-100%` section progress | Fullscreen hero video currentTime is tied to scroll; no GSAP target | `docs/pds/extraction/scroll-scrub-trace-home.json` |
| PENDING | A002 | `/` | STICKY_ELEMENT | Hero scroll | Hero media remains fixed/sticky through long `14400px` source section | `docs/pds/extraction/scroll-behavior-home.json` |
| PENDING | A003 | `/` | CSS_IO_REVEAL | IntersectionObserver + CSS classes | Hero/text/editorial elements reveal using source CSS modules/keyframes | `docs/pds/extraction/animations.json` |
| PENDING | A004 | `/` | SCROLL_INDICATOR | Initial hero scroll | Source hero has scroll/title movement state over scroll frames | `docs/pds/extraction/scroll-snapshots-home.json` |
| PENDING | A005 | `/` | STICKY_ELEMENT | Partner/gallery scroll | Source partners and illustration sections use long scroll/sticky visual treatment | `docs/pds/extraction/structure.json` |
| PENDING | A006 | `/experience` | NATIVE_RAF_VIDEO_SCRUB | Scroll hero `0-100%` section progress | Experience fullscreen hero video currentTime is tied to scroll | `docs/pds/extraction/scroll-scrub-trace-experience.json` |
| PENDING | A007 | `/experience` | CSS_IO_REVEAL | Section entry | Experience intro/highlights and map content reveal with native IO/CSS | `docs/pds/extraction/animation-implementation.json` |
| PENDING | A008 | `/experience` | STICKY_ELEMENT | Experience long media/map scroll | Source experience route has long pinned/visible section states across scroll | `docs/pds/extraction/scroll-behavior-experience.json` |
| PENDING | A009 | `/technology` | NATIVE_RAF_VIDEO_SCRUB | Technology hero scroll | Technology hero video currentTime is scroll-controlled | `docs/pds/extraction/scroll-scrub-trace-technology.json` |
| PENDING | A010 | `/technology` | CANVAS_SCROLL | Introduction, sound, technical breakdown | Source technology includes 5 canvas surfaces captured in extraction | `docs/pds/extraction/three-scene.json` |
| PENDING | A011 | `/technology` | NATIVE_RAF_VIDEO_SCRUB | Technical sections scroll | Source technology includes 8 videos and native scroll/RAF media state | `docs/pds/extraction/animations.json` |
| PENDING | A012 | `/technology` | CSS_IO_REVEAL | Technical section entries | Source technical subsections use CSS module reveals and transitions | `docs/pds/extraction/css-rules.json` |
| PENDING | A013 | `/technology` | STICKY_ELEMENT | Long technical sections | Safety/sound/technical sections maintain sticky/pinned geometry over long scroll | `docs/pds/extraction/scroll-behavior-technology.json` |
| PENDING | A014 | `/company` | CSS_IO_REVEAL | Intro title scroll | Company title/story sections reveal using CSS modules/native scroll state | `docs/pds/extraction/scroll-behavior-company.json` |
| PENDING | A015 | `/company` | NATIVE_RAF_VIDEO_SCRUB | Company media timeline | Source company route has 4 videos with scroll-observed state | `docs/pds/extraction/scroll-scrub-trace-company.json` |
| PENDING | A016 | `/company` | STICKY_ELEMENT | Mythology/story scroll | Long mythology section has source scroll geometry and reveal timing | `docs/pds/extraction/structure.json` |
| PENDING | A017 | `/privacy-policy` | STICKY_LAYOUT | Legal document scroll | Legal page uses source cream legal layout and fixed nav/footer state | `docs/pds/extraction/scroll-behavior-privacy-policy.json` |
| PENDING | A018 | `/terms-of-use` | STICKY_LAYOUT | Legal document scroll | Terms page uses source legal layout and dark nav variant | `docs/pds/extraction/scroll-behavior-terms-of-use.json` |
| PENDING | A019 | Global | VIEW_TRANSITION | Route navigation | Browser View Transitions API capability detected; target may use native fallback only | `docs/pds/extraction/animation-implementation.json` |
| PENDING | A020 | Global | CSS_MODULE_ANIMATION | Page load, hover, menu states | Source uses CSS Modules/keyframes and CSS transitions for nav/menu/buttons | `docs/pds/extraction/css-rules.json` |

## Verification Rules

- Mark an item complete only after source and target both pass `recordScrollBehavior()` and `compareScrollBehavior()` for the mapped target route.
- Do not add GSAP, Lenis or Framer Motion for source-equivalent visual effects.
- Any target route mapped to `/technology` must address source canvas/media states, not only the first hero video.
