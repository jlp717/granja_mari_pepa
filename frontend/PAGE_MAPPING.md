# PAGE_MAPPING v3.3

Source visual reference: `https://www.jobyaviation.com/`

Generated after MCP-REF discovery on `2026-04-12`.

## Source Routes Considered

Primary discovered routes:

- `/`
- `/experience`
- `/technology`
- `/company`
- `/news`
- `/careers`
- `/privacy-policy`
- `/terms-of-use`
- `/impact-reporting`
- `/transparency`
- `/safety-policy`

The sitemap contains a large `/news/*` archive. The target has no news-detail route, so individual news articles are not mapped for implementation.

## Target Route Mapping

| Target route | Source page | Razon | Estado v3.3 |
|---|---|---|---|
| `/[locale]` | `/` | Home cinematic landing: fullscreen hero, fixed nav, long scroll narrative, editorial bands and footer | PENDING extraction + QA |
| `/[locale]/productos` | `/technology` | Product/catalog content maps to source technology structure and technical media sequence | PENDING extraction + QA |
| `/[locale]/productos/_disabled_id` | `/technology` | Disabled product detail state maps to technology shell while preserving target business state | PENDING extraction + QA |
| `/[locale]/contacto` | `/experience` | Contact/service page maps to experience flow and form/editorial sections | PENDING extraction + QA |
| `/[locale]/area-clientes` | `/experience` | Client portal has no source equivalent; use the closest source form/editorial structure | PENDING extraction + QA |
| `/[locale]/checkout` | `/experience` | Checkout has no source equivalent; use source experience/form treatment while preserving business logic | PENDING extraction + QA |
| `/[locale]/login-secure-example` | `/experience` | Auth flow maps to source experience/form treatment | PENDING extraction + QA |
| `/[locale]/acerca` | `/company` | Company/history page maps to source company structure | PENDING extraction + QA |
| `/[locale]/lorca` | `/company` | Local/institutional route maps to company-style editorial structure | PENDING extraction + QA |
| `/[locale]/offline` | `/company` | Offline state maps to simple company/institutional source treatment | PENDING extraction + QA |
| `/[locale]/legal/privacidad` | `/privacy-policy` | Legal document equivalent | PENDING extraction + QA |
| `/[locale]/legal/terminos` | `/terms-of-use` | Legal document equivalent | PENDING extraction + QA |

## Blocking Notes

- All previous PASS labels are intentionally invalidated for v3.3.
- No component implementation is approved until current MCP extraction, `recordScrollBehavior()`, `compareScrollBehavior()`, computed-style comparison, and final 3-viewport recorrido pass.
- Backend, API, auth, middleware, server actions and database files remain out of scope.
