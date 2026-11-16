# Assets V3 · manifiesto y plan de producción

11/11/2026. Propietario: Art. Sólo Main actual y Kage autorizado. Los recursos con estado planificado no existen y no deben solicitarse desde el navegador. La ausencia de una imagen nunca puede ocultar texto o provocar un estado de negocio ficticio.

## Identidad entregada

| ID | Destino | Fuente y operación | Dimensiones / hash | Uso / alt / estado |
|---|---|---|---|---|
| `brand-logo` | `/kage/brand/logo-alpha.png` | Main `public/images/logo.jpeg`; máscara alfa local a partir del canal rojo, crop del área útil; sin generación, trazado o recolor | 600×182; SHA256 `1757724d2a58df6a2e31d31c580c376de06c7cbdbd142eff61812c2c057e7fa8` | Logo blanco sobre superficie oscura; alt `Mari Pepa — Food & Frozen` cuando es identidad y alt vacío cuando repite un nombre accesible adyacente. Producido y abierto; revisión independiente pendiente. |

Fuente1076×320, SHA256 `e35de5c682a592704771cc5fa2e8a599ee2c423bbbd225d11a7ede95975a491d`. Recorte exacto `[234,72,834,254]`. La prueba compara todos los RGB del PNG contra el mismo recorte del JPEG y pasa: no se han inventado colores ni letras. La transición alfa conserva los colores mezclados del JPEG en su borde; no se promete una reconstrucción vectorial. Sólo se aprueba sobre ink/mundo oscuro. Reproducción: `python docs/redesign/art/extract-logo.py`. Evidencia: `art/logo-alpha-proof.json` y `art/logo-alpha-review.png`.

## Producción ambiental · plan ejecutado

La dirección de todos los prompts es DIRECCION-DE-ARTE §§2–6 y DESIGN (Tokens). La escena es ilustrativa y no prueba instalaciones, flota, equipo, clientes o procedimientos de la empresa. Se prohíbe generar productos, alimentos, envases, cajas, etiquetas, logos, texto, sellos, personas o manos.

| ID | Fondo reservado | Derivado alfa local del mismo fondo | Papel / alt de alternativa | Estado |
|---|---|---|---|---|
| `env-01` | `/kage/scene/01-umbral.webp` | `/kage/foreground/01-umbral.webp`: jamba y labio inferior | Ambiente ilustrativo de umbral industrial vacío al amanecer. En canvas decorativo alt vacío; en figura editorial leyenda ilustrativa. | Producido; revisión integrada pendiente |
| `env-02` | `/kage/scene/02-frio.webp` | `/kage/foreground/02-frio.webp`: borde de escarcha/condensación | Ambiente ilustrativo de corredor frío vacío, con acero y luz rasante. | Producido; revisión integrada pendiente |
| `env-03` | `/kage/scene/03-catalogo.webp` | `/kage/foreground/03-catalogo.webp`: montante/travesaño exterior | Ambiente ilustrativo de pasillo de estanterías vacías. | Producido; revisión integrada pendiente |
| `env-04` | `/kage/scene/04-ruta.webp` | Hierba/relieve de Kage literal; no generación adicional | Paisaje ilustrativo de carretera genérica con bruma, sin lugar identificado. | Producido; revisión integrada pendiente |
| `env-05` | `/kage/scene/05-mesa.webp` | `/kage/foreground/05-mesa.webp`: borde de acero/barra de utensilios | Ambiente ilustrativo de cocina profesional vacía con luz cálida. | Producido; revisión integrada pendiente |

Se han producido cinco fondos mediante cinco llamadas nativas y cuatro derivados alfa locales: nueve masters de uso. Antes hubo un único intento Higgsfield rechazado por requisito de plan, sin imagen ni job. Cada fondo sirve también como alternativa estática del capítulo. El archivo original y los metadatos de cada resultado se conservarán con su respuesta real; WebP optimizado y recortes no se declaran producidos antes de verlos.

Los alfa derivados conservan el RGB del fondo y sólo añaden máscara/crop local. Las máscaras seguirán contornos materiales visibles: ninguna reconstrucción generativa, objeto añadido o halo de fondo. Si una toma no permite un recorte limpio, se registra la limitación y se decide con evidencia antes de regenerar; nunca se gasta por una segunda toma sin motivo y autorización de lote.

## Dirección y prompts iniciales · historial

Prefijo común para las cinco peticiones:

> Environmental illustration for an editorial website about a working day supplying hospitality businesses. Follow the visual direction in DIRECCION-DE-ARTE sections 2–6: restrained photographic material detail, deep cool shadows with readable texture, one small warm practical source where specified, soft atmospheric depth, coherent exposure across the series. Preserve clear negative space for editorial text. Realistic brushed metal, concrete, moisture and air; no plastic sheen, no exaggerated bloom, no baked heavy grain. The website adds its own grain and postprocessing. This is a fictional, unbranded environment, not a depiction of any real company's premises or fleet.

`env-01`:

> Empty industrial threshold at dawn, viewed from just inside a doorway toward a distant open yard. Wide landscape composition, deep perspective, calm central and upper-left negative space. A concrete doorway jamb at the outer left edge and a low floor lip along the bottom form clearly bounded foreground silhouettes that can be masked locally from this same image. Cool ambient shade, one restrained warm dawn rim beyond the doorway, subtle dust in the distance, worn concrete and damp surface microtexture. Keep all foreground structure outside the main reading area. No people, hands, food, goods, pallets, boxes, cartons, packaging, labels, logos, lettering, signage, identifiable company architecture or readable instrument displays.

`env-02`:

> Empty refrigerated industrial corridor, unbranded and fictional, without stored goods. Wide landscape composition with a long calm sightline and a clear central reading area. Brushed steel catches cool grazing light; a small distant warm practical light gives scale. Frost and condensation collect only on a clearly bounded near edge at the lower outer corner, designed to be masked locally from this same image, leaving the centre open. Fine ice crystals and restrained moisture, detailed shadows, no dramatic vapour wall. No people, hands, food, products, shelves of goods, packaging, labels, logos, text, temperature numbers, gauges or certification marks.

`env-03`:

> Empty neutral industrial shelving aisle with no stock, seen in deep perspective. Wide landscape composition, architectural rhythm and a spacious reading area. A near steel rack upright hugs the outer right edge and joins a low bottom cross-member, with crisp visible contours suitable for a local alpha mask from this same image. Subtle cool side light, modest warm distance light, brushed and worn metal, sparse atmospheric dust. No products, food, pallets, boxes, cartons, packaging, shelf labels, logos, signs, people, hands, text, numbers or equipment brands.

`env-04`:

> Generic quiet road in a broad unidentifiable landscape with restrained dawn haze and a distant horizon. Wide landscape composition with open central space, wet road texture and low natural roadside vegetation, cool atmospheric shadows and a faint warm horizon. No vehicle is required in the image; any generic van silhouette will be procedural geometry in the website. No recognisable town, landmarks, road signs, lane text, readable markings, company premises, people, food, products, packaging, logos, number plates or fleet branding.

`env-05`:

> Empty professional kitchen, fictional and unbranded, after preparation but without any food or product. Wide landscape composition, warm practical task lighting balanced by cool readable shadows. An unbranded stainless counter lip or simple utensil rail occupies only a lower outer corner with clean material contours for a local alpha mask from this same image. Leave a calm central reading area and depth beyond it. Fine brushed steel texture and restrained reflections, no exaggerated glow and no baked steam cloud; steam will be procedural in the website. No people, hands, food, plates containing food, containers, packaging, labels, logos, lettering, screens, readable controls or identifiable restaurant design.

Los cinco resultados nativos se verificaron como PNG1536×1024; los WebP conservan dimensión y encuadre. Los prompts exactos que se enviaron al generador nativo están en `art/native-jobs.json`: normalizan el prefijo para que sea autosuficiente y, tras la primera lectura, mantienen los objetos próximos de los otros capítulos en los bordes bajos. No se ha realizado ninguna regeneración. El alfa de Umbral se corrigió localmente para excluir la jamba alta y proteger la lectura; el primer trazado se conserva identificado como R1.

## Saldo y costes reales

Se consultó saldo Higgsfield antes del intento y después del rechazo:10→10. `gpt_image_2_6`, medium,1k,3:2,batch1 devolvió `Requires basic plan or higher.` No hubo job ni imagen; el cargo explícito no se informó. El catálogo no exponía precio. No se compró, suscribió, recargó ni cambió la cuenta. La limitación de plan se resolvió usando la alternativa nativa autorizada, no modificando la cuenta.

Root autorizó primero Umbral nativo y después los otros cuatro capítulos tras observarlo. Son cinco llamadas nativas exitosas, una por master, cero regeneraciones. La herramienta nativa no informa coste: se registra `null`, no cero. El saldo Higgsfield citado pertenece a aquel intento, no es una nueva medición posterior a los lotes nativos.

| Lote | Herramienta / petición | Resultado | Coste / saldo observado | Evidencia |
|---|---|---|---|---|
|01|Higgsfield `gpt_image_2_6`, medium1k3:2,1imagen|Rechazo de plan, sin job|10→10,delta0; cargo explícito desconocido|`art/umbral-job.json`, `art/umbral-bridge-run.json`|
|02|Generador nativo integrado,1Umbral|PNG1536×1024|Coste no informado|`art/native-jobs.json`, `art/environment-assets-proof.json`|
|03|Generador nativo integrado,1Frío+1Catálogo+1Ruta+1Mesa|4PNG1536×1024|Coste no informado|Mismos registros;4peticiones independientes|

Antes de cualquier lote futuro se confirmará su autorización y el saldo si la herramienta dispone de consulta. No se infiere un precio del nombre de un modelo ni se regenera sin motivo visual concreto registrado.

## Ficheros entregados y revisión

Todos los masters nativos están copiados en `frontend/public/kage/scene/source/`; permanecen también los originales de la herramienta en su ubicación por defecto. Placas públicas WebPquality90/method6, sin reencuadre o reiluminación. Alfa lossless con RGB visible exacto de su master; sólo se descarta RGB completamente oculto en alfa0 para comprimir. Extremos alfa0–255 y siluetas tocando el borde inferior comprobados. No se aplica opacidad global para simular un recorte.

| ID | Placa WebP | Alfa WebP | Dimensiones | Estado |
|---|---|---|---|---|
|01-umbral|`/kage/scene/01-umbral.webp` · 165382B|`/kage/foreground/01-umbral.webp` · 229232B|1536×1024|Producido, colocación/contraste/runtime pendientes|
|02-frio|`/kage/scene/02-frio.webp` · 220908B|`/kage/foreground/02-frio.webp` · 83098B|1536×1024|Producido, colocación/contraste/runtime pendientes|
|03-catalogo|`/kage/scene/03-catalogo.webp` · 231760B|`/kage/foreground/03-catalogo.webp` · 33202B|1536×1024|Producido, colocación/contraste/runtime pendientes|
|04-ruta|`/kage/scene/04-ruta.webp` · 217558B|Hierba/relieve Kage literal|1536×1024|Producido, colocación/contraste/runtime pendientes|
|05-mesa|`/kage/scene/05-mesa.webp` · 133938B|`/kage/foreground/05-mesa.webp` · 82280B|1536×1024|Producido, colocación/contraste/runtime pendientes|

SHA256 completos, trazados, tamaños, coste y prompts exactos: `art/environment-assets-proof.json`. Revisiones nativas: `art/masters-overview.png`, `art/alphas-overview.png`, y `art/*-crop390.png`. Los recortes390 son ensayos de composición, no CSS final. Un cover centrado puede perder la jamba de Umbral: se compara un recorte lateral antes de fijar posición. La fuente y luz cálida derecha se conservan en el master; el velo de lectura se aplica en UI con la gramática Kage, no horneado en la imagen.

## Recursos literales Kage y fotografías Main

Root copiará literalmente `reference/kage-verbatim/assets/` y `secret-pathways-assets/` a `/kage/`, preservando nombres y bytes. Art no escribe esas carpetas compartidas. Hierba y relieve naturales pueden encuadrar Ruta; arquitectura japonesa no puede presentarse como instalaciones reales de GMP. La copia verbatim conserva todos sus avisos y la licencia de Three. La autorización de reutilización del usuario está registrada en el brief V3.

Las fotografías reales de producto, marcas y PDF las inventarían Public/Editorial desde Main/fuentes verificadas y se añadirán al registro antes de usarse. No se importa ninguna fotografía de otra versión ni se infiere que un producto ilustrado esté disponible. Una foto de producto real mantiene su producto y su etiqueta originales; los derivados sólo recortan/optimizan con trazabilidad.

## Criterios de revisión

Abrir cada fondo nativo y recortes reales de móvil/escritorio; mirar sombras, brillo, grano y material. Abrir cada alfa sobre ink y sobre otro fondo para detectar halos, bordes o rectángulos; verificar por código que el RGB se conserva en la derivación. Revisar la composición integrada para asegurar lectura/foco y relevo. Los resultados no se aceptan por éxito de descarga, existencia de un archivo o respuesta de herramienta. Los tres recorridos de crítica son visuales y nuevos sobre el candidato integrado.

## Imagen social propia

`/kage/brand/og.png`:1200×630,799591B,SHA256 `a69854304315ce16e461d5fab194ee2161b35408b846fb2a091f050ab7b3640d`. Composición local del logo auténtico600×182 sin reescalar sobre un recorte de Umbral. No se añade antigüedad, cifra o afirmación. El velo radial usa los stops Kage `index.html:230`, como adaptación a la imagen social. La prueba `art/og-proof.json` comprueba que el RGB opaco del logo sigue exacto. No es otra generación y no tiene un coste nativo adicional informado. Art abrió el PNG; Root confirmó la aceptación estática del conjunto. Metadata y representación en la aplicación siguen pendientes.
