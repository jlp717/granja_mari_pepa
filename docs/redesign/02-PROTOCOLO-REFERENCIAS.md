# 02 · Protocolo de referencias (cero especulación)

**Regla madre:** una referencia solo existe si hay captura medida en `docs/redesign/references/<id>/`. Describir de memoria cómo es una web = especulación = prohibido (R1).

## 1. Qué cuenta como evidencia

| Evidencia | Fichero generado por el script | Se usa para |
|---|---|---|
| Aspecto real | `desktop-1440-fold.png`, `desktop-1440-full.png`, `mobile-390-*.png`, `sections/NN-*.png` | Revisión visual y comparación antes/después |
| Estructura real | `rendered.html`, `sections/NN-*.html` | Jerarquía semántica, patrones de maquetación |
| Estilos reales | `css/*.css`, `sections/NN-*.css` (solo las reglas que aplican a ese bloque, con media queries y `@keyframes` usados) | Valores y técnicas de maquetación |
| Valores medidos | `tokens.json` (variables CSS, paleta por uso y por área, tipografías, escala tipográfica, radios, sombras, contenedores, padding de secciones) | Tokens de DESIGN.md con `fuente:` |
| Movimiento | `animations.json` (librerías, `@keyframes`, transiciones y animaciones en uso, animaciones CSS ligadas al scroll) y `scroll-desktop.webm` con `--video` | Lenguaje de movimiento (§6 de DESIGN.md) |
| Microinteracciones | `interactions.json` (qué cambia al hacer hover en CTAs y enlaces, con la transición) | Estados de componentes |
| Salud de la captura | `capture-report.md` (avisos de bloqueo, desbordes móviles, errores) | Decidir si la captura es utilizable |

## 2. Selección: qué referencias y por qué

Elige **8–12** referencias cubriendo estas capas (≥1 referencia primaria por capa):

| Capa | Qué se busca aprender (atributo medible) |
|---|---|
| Cabecera / navegación | Altura, comportamiento al hacer scroll, jerarquía de enlaces, CTA en cabecera |
| Hero | Escala tipográfica, composición texto/imagen, tratamiento del fondo, CTA principal |
| Catálogo / rejilla de producto | Densidad, ratio de imagen, jerarquía precio/nombre/formato, filtros |
| Flujo B2B de pedido y paneles | Patrones de tablas, estados, resumen de pedido, recompra |
| Formularios y alta profesional | Estructura, validación, ayuda contextual, confianza |
| Footer | Organización de información legal y de contacto, tono |
| CTA de sección | Contraste, espacio, texto, repetición |
| Movimiento y microinteracciones | Duraciones, curvas, qué se anima y qué no |

Criterios para aceptar una referencia (todos): (a) carga en navegador automatizado y no devuelve bloqueo ni página vacía; (b) encaja con el público y el tono del brief (parte A de `03`); (c) es distinta al «antes» según `ANTES.md`; (d) la ficha declara **qué atributo medible se toma de ella**. Mezcla sectores: algunas del entorno B2B/alimentación/marketplaces y el resto de productos de primera categoría cuyo nivel de acabado se quiere igualar. Una **referencia primaria por decisión**; no promedies varias en un punto medio seguro.

### Dónde descubrir (el descubrimiento NO es evidencia; la captura sí)

1. **Las fuentes que cita el vídeo:** Mobbin y Refero (flujos y pantallas de producto reales). Refero y Mobbin ofrecen servidores MCP de pago; úsalos solo si hay credencial en el entorno.
2. **Alternativa gratuita:** `inspo-mcp` (archivo de sitios en producción con capturas y tokens por sitio); instálalo con `--dry-run` primero y trátalo como descubrimiento.
3. **Galerías generalistas** que menciona una guía de terceros (no el vídeo): Godly, Refero, One Page Love.
4. Cualquier otra, con el mismo requisito: se captura con el script o no existe.

## 3. Captura en vivo (paso a paso)

```bash
# una vez
npm i -D playwright && npx playwright install chromium

# por referencia (ejemplo)
node scripts/capture-reference.mjs --url https://sitio-de-referencia.com --id ref-hero-01 --video

# propia web: "antes" (usa --out distinto para no mezclar con referencias)
node scripts/capture-reference.mjs --url http://localhost:3000/ --id mp-antes-home --out docs/redesign/baseline
```

Opciones: `--wait <ms>` (esperar animaciones de entrada), `--maxSections <n>`, `--video` (graba un scroll completo), `--locale es-ES`.

Tras cada captura:
1. Abre `capture-report.md`. Si aparece «POSIBLE BLOQUEO / PÁGINA VACÍA», mira los PNG: si la captura no es utilizable, **descarta la referencia o repite** (`--wait` mayor); no la uses.
2. Mira `desktop-1440-fold.png` y las capturas de sección. Si el contenido principal no se ve (banner, login, geobloqueo), repite o descarta.
3. Si el sitio bloquea el navegador automatizado y la referencia es imprescindible, se admite **captura manual** (CSS Peeper para colores/tipografías/assets; html.to.design para traer la web a capas editables) aportada por Javier, marcada `captura-manual` en la ficha. El agente no inventa lo que no pudo medir.
4. Ejecuta las capturas en paralelo entre subagentes (una por referencia).

## 4. Ficha de referencia (una por referencia, en `docs/redesign/REFERENCIAS.md`)

```
### <id>
- URL: …  · Fecha de captura: …  · Estado: ✅ utilizable / ⚠️ parcial / ❌ descartada (motivo)
- Capa(s): cabecera | hero | catálogo | pedido | formulario | footer | CTA | movimiento
- ¿Referencia primaria de qué decisión? (p. ej. «escala tipográfica del hero», «patrón de tarjeta de producto»)
- Atributo medible que se toma: … → fichero fuente: <id>/tokens.json#typeScale[0] · <id>/sections/01-hero.css
- Qué NO se toma y por qué: …
- Diferencia con el «antes» (medida): …
- Notas de movimiento (de animations.json / interactions.json): …
- Tipo de captura: script | captura-manual
```

## 5. De la captura a DESIGN.md (trazabilidad obligatoria)

Cada token del sistema de diseño se escribe así:

```
- Color superficie principal: <valor> — fuente: ref-hero-01/tokens.json#palette.background[0]
- Easing de entrada: <valor> — fuente: ref-mov-02/animations.json#transitionsInUse[2]
```

Reglas:
- El valor se copia de la fuente; si se adapta (p. ej. para contraste AA), se anota `adaptado: <razón medida>` con el ratio de contraste calculado.
- Nada de valores «redondeados» a ojo. Si una referencia usa una tipografía de pago o con licencia restrictiva, se documenta y se elige una alternativa libre con la misma función, citando ambas.
- Una decisión sin `fuente:` se marca `SIN-FUENTE` y no entra en el código.

## 6. Límites y uso responsable

- Las capturas son material de estudio local. No se publican ni se versionan en un repositorio público; añade `docs/redesign/references/` y `docs/redesign/baseline/` a `.gitignore` si el repo es compartido o público.
- No se copian textos, marcas, logos, imágenes ni código propietario tal cual al producto (R8). Se extraen **principios, proporciones y técnicas** y se reimplementan con el sistema propio.
- El script usa un navegador automatizado: respeta los avisos de bloqueo y no intentes saltarte protecciones.
