# PAGE_MAPPING

Source visual reference: `https://www.jobyaviation.com/`

Generated from v3.1 extraction and target QA. The target keeps Granja Mari Pepa visible text and business logic; the source remains the visual truth.

| Target route | Source page | Reason | Estado v3.1 |
|---|---|---|---|
| `/[locale]` | `/` | Home cinematic hero, fixed nav, sticky video scrub, editorial image bands, partner/gallery sections | PASS parcial: hero/video/nav verified at 1440/375; lower sections rebuilt source-like but not yet pixel-delta approved section by section |
| `/[locale]/productos` | `/technology` | Product/catalog page mapped to technology page structure | PASS parcial: hero video scrub plus aircraft-style interior video sequence verified; source canvas/WebGL surfaces still pending |
| `/[locale]/contacto` | `/experience` | Contact/service page mapped to experience flow | PASS parcial: hero video scrub and source-like sections verified; full lower-page pixel comparison pending |
| `/[locale]/acerca` | `/company` | Company/history page mapped to company page | PASS parcial: scroll title reveal plus rounded company video timeline verified; exact full-page pixel delta still pending |
| `/[locale]/legal/privacidad` | `/privacy-policy` | Legal document equivalent | PASS: source legal layout, cream background, left title, right body column and current-page nav verified |
| `/[locale]/legal/terminos` | `/terms-of-use` | Legal document equivalent | PASS: source legal layout reused with target terms text |
| `/[locale]/area-clientes` | `/experience` | Client portal has no direct source equivalent; mapped to structured experience/form flow | PENDING exact QA: shell styling exists, but page was not rebuilt pixel-by-pixel against a full source page |
| `/[locale]/checkout` | `/experience` | Transactional flow has no direct source equivalent; mapped to experience/form flow | PENDING exact QA: business checkout preserved, full source-equivalent visual pass pending |
| `/[locale]/login-secure-example` | `/experience` | Auth form mapped to source form/editorial treatment | PENDING exact QA |
| `/[locale]/lorca` | `/company` | Local/institutional route mapped to company content | PENDING exact QA |
| `/[locale]/offline` | `/company` | Offline state mapped to simple institutional state | PENDING exact QA |
| `/[locale]/productos/_disabled_id` | `/technology` | Disabled/protected product detail state mapped to technology shell | PENDING exact QA |

## Blocking Notes

- The previous pass was not acceptable as a literal Joby port. This mapping now separates verified work from pending exact QA.
- Main visual evidence for the current pass is under `docs/pds/qa-evidence/v31-final-2/`, `docs/pds/qa-evidence/v31-final-3/` and `docs/pds/qa-evidence/v31-final-4/`.
- Source extraction evidence is under `docs/pds/extraction/v31-full/`.
