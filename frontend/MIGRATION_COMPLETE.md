# MIGRATION_STATUS

Source: `https://jobyaviation.com`

Target: `C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\frontend`

Date: `2026-04-12`

## Resultado

This is **not approved as complete** against the user's pixel-by-pixel requirement. The earlier implementation was materially under the bar. This pass reworked the main pages around the v3.1 skill rules and added real motion evidence, but the target still has pending exact work before it can honestly be called a complete literal clone.

## Rebuilt In This Pass

- Global Joby-derived tokens, fonts, fixed nav, menu panel, dark/cream route nav colors and legal current-page labels.
- Home `/[locale]`: fullscreen source video hero with scroll scrub, source-like editorial bands, partners and gallery sections.
- Productos `/[locale]/productos`: source `/technology` intro video scrub plus aircraft-style internal video sequence.
- Contacto `/[locale]/contacto`: source `/experience` intro video scrub and source-like service/contact sections.
- Acerca `/[locale]/acerca`: source `/company` cream scroll-title treatment plus rounded source-video timeline and company/editorial sections.
- Legal pages: source legal layout with target legal text.

## Verified

- `npm run build`: PASS, exit 0 after the latest code changes.
- Dev server: `http://localhost:3001`.
- QA evidence: `docs/pds/qa-evidence/v31-final-2/`.
- Additional sequence evidence: `docs/pds/qa-evidence/v31-final-4/`.
- Source extraction: `docs/pds/extraction/v31-full/`.
- Home/contact/product hero videos are paused, non-autoplay, non-looping and scrubbed by scroll.
- Legal page top composition now matches the source structure more closely: menu label at left, centered brand, black nav on cream, left title and right body column.

## Still Blocking Completion

- `/technology` source includes 8 videos and 5 canvas/WebGL-like surfaces; target now recreates the intro scrub and a 5-video aircraft-style sequence, but not the canvas/WebGL surfaces or every hidden video state.
- `/company` source includes 4 video elements; target now uses those videos in a rounded timeline section, but full timing/pixel delta is still pending.
- `area-clientes`, `checkout`, `login-secure-example`, `lorca`, `offline` and disabled product detail still need route-by-route exact visual QA and rebuild where needed.
- Remote source media is still hotlinked for several decorative assets; final pass should download/cache or explicitly document each external asset.
- Full 375/768/1440 per-section pixel delta has not been completed for every mapped route.

## Evidence Files

- `PAGE_MAPPING.md`
- `ANIMATION_MANIFEST.md`
- `docs/pds/modified-files.md`
- `docs/pds/assets-reemplazo-ia.md`
- `docs/pds/extraction/v31-full/summary.json`
- `docs/pds/qa-evidence/v31-final-2/summary.json`
- `docs/pds/qa-evidence/v31-final-4/summary.json`
