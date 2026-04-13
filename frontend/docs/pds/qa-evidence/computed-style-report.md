# Computed Style Report

Viewport: `1440x1200`

| Item | Source Joby | Target Granja Mari Pepa | Estado |
|---|---|---|---|
| Nav position | `fixed` | `fixed` | PASS |
| Nav z-index | `100` | `100` | PASS |
| Nav color | `rgb(245, 244, 223)` | `rgb(245, 244, 223)` | PASS |
| Nav background | `rgba(0, 0, 0, 0)` | `rgba(0, 0, 0, 0)` | PASS |
| Nav height | `80px` | `80px` | PASS |
| H1 font | `jobyDisplay` | `jobyDisplay` | PASS |
| H1 size | `80px` | `80px` | PASS |
| H1 line-height | `80px` | `80px` | PASS |
| H1 letter-spacing | `-2.4px` | `-2.4px` | PASS |
| H1 color | `rgb(245, 244, 223)` | `rgb(245, 244, 223)` | PASS |
| Hero media height | `1200px` | `1200px` | PASS |
| Hero media radius | `0px` | `0px` | PASS |
| Video object-fit | `cover` | `cover` | PASS |
| Home video paused | `true` | `true` | PASS |
| Home video autoplay | `false` | `false` | PASS |
| Home video loop | `false` | `false` | PASS |
| Home video scroll scrub | `currentTime` avanza con `scrollY` | `0 -> 20.087s` | PASS |
| Productos video scroll scrub | `/technology` hero avanza con `scrollY` | `0 -> 9.968s` | PASS |
| Contacto video scroll scrub | `/experience` hero avanza con `scrollY` | `0 -> 29.967s` | PASS |
| Acerca title reveal | `/company` titulo ligado a scroll | `titleProgress 0 -> 1` | PASS |
| Legal nav color | `rgb(14, 22, 32)` on cream legal pages | `rgb(14, 22, 32)` | PASS |
| Legal current-page label | Left label next to hamburger | `Política de Privacidad` at `x=99`, `y=33` | PASS |
| Legal H1 position | Left aligned title block | `x=40`, `y=364`, `width=736` | PASS |
| Source band H2 width | Wide editorial grid column | `643px` on 1440 viewport | PASS |
| Productos aircraft video frame | Source-like cream aircraft sequence | active video `1440x852` at y=`348` | PASS parcial |
| Acerca company video frame | Source-like rounded media sequence | active video `1440x1094` at y=`38` | PASS parcial |

Target H1 wraps to two lines because target text is longer and must be preserved. Full-page pixel delta is not asserted as a global pass/fail because visible text, logo, partner marks, product categories and business content intentionally differ from the source.

## Evidence Files

- `source-home-1440-top.png`
- `source-home-1440-25.png`
- `target-home-current-1440.png`
- `target-home-current-768.png`
- `target-home-current-375.png`
- `target-menu-open-375.png`
- `motion-revisit/summary.json`
- `motion-revisit/home-trace-1440.json`
- `motion-revisit/productos-trace-1440.json`
- `motion-revisit/contacto-trace-1440.json`
- `motion-revisit/acerca-trace-1440.json`
- `v31-final-2/summary.json`
- `v31-final-2/privacidad-1440x1200-0-after-header.png`
- `v31-final-4/summary.json`
- `v31-final-4/productos-6200.png`
- `v31-final-4/acerca-3000.png`
