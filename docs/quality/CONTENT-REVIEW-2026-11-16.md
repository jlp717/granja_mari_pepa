# Revisión de contenido — 2026-11-16

Rama: `rediseno/v3` (leída en `.git/HEAD`).
Método: lectura directa de los archivos en esta sesión. Sin build, sin tests, sin llamadas a producción.
Límite: el shell está denegado en esta sesión (`BLOCKED`), así que no hay exit codes, capturas ni comprobación visual. Todo lo que sigue se apoya en `archivo:línea` leído aquí.
Alcance: contenido público de home, acerca, calidad, reparto, productos, trabaja-con-nosotros y area-clientes, más el uso de fotografías y el sitemap.

Este documento describe el estado real y los huecos. No es un PASS y no autoriza cambios.

## 1. Cambios aplicados (verificados por lectura)

| Cambio declarado | Archivo:línea | Estado real |
|---|---|---|
| Home: bloque 02 pasa de "Consulta/Preparación/Ruta/Entrega" a capacidad | `frontend/components/home/home-copy.ts:87-114` | Aplicado. Cuatro pasos: 5.000 m³, +1.500, dos sedes, 24–48 h. No queda el texto anterior en la home renderizada (`HomeEditorial`). |
| Home: 5 fotos distintas | `frontend/components/home/HomeEditorial.tsx:41,128,138,169,364` | Aplicado. `careers-03`, `invernaderos.webp`, `careers-facility`, `mar.jpg`, `careers-04`. Más 7 fotos de familia en la sección de gama (`:15-23`). |
| /acerca: "Servicio/Del pedido al albarán" sustituido por red Topgel | `frontend/components/editorial/content.es.ts:116-125` | Aplicado. `id` sigue siendo `servicio`, pero label "Red" y título "Una red nacional con base en Lorca". |
| /calidad: párrafo de documentación (ficha, alérgenos, conservación) | `frontend/components/editorial/content.es.ts:272-294` | Aplicado. Sin certificados nuevos. Pero la página sigue afirmando ISO 9001 sin versión ni alcance (`:279` y `:358`). |
| /reparto: plazo 24–48 h una sola vez | `frontend/components/editorial/content.es.ts:378-388` | Aplicado dentro de reparto: una sola mención, como plazo habitual sujeto a confirmación. |
| /productos: red Topgel en `brandsText` y `notice` | `frontend/components/kage/catalogue/content/es.json:7-8,22` | Aplicado. Sigue sin referencias reales por familia: la página ordena familias, no publica SKU, precio ni stock. |
| /trabaja-con-nosotros: sin ofertas de ejemplo si la API no devuelve nada | `frontend/app/[locale]/trabaja-con-nosotros/page.tsx:21,28`; `frontend/components/editorial/EditorialCareers.tsx:605-635`; `frontend/components/editorial/careers-data.ts:1-5` | Aplicado en página y componente: `jobs=[]` muestra estado vacío y CTA de CV. |
| /area-clientes: sin `console.log`, emojis ni color hardcodeado | `frontend/app/[locale]/area-clientes/page.tsx` | Parcial. No hay `console.*` en el archivo. Quedan dos restos: un emoji de celebración en `:1233` ("¡Enhorabuena!") y `color: "#FFFFFF"` en `:672`. |
| (No declarado, detectado aquí) Sitemap de empleo | `frontend/app/sitemap.ts:6,22` | Abierto. Sigue importando `JOBS` de ejemplo y publica sus 6 slugs en el sitemap; esas rutas devuelven 404 si no hay oferta viva. |

Reserva de trazabilidad: `docs/redesign/CONTENIDO-FUENTE.md:33` (F17) marcó 5.000 m³, 1.500 referencias e ISO 9001:2008 como publicados sin acreditación vigente aportada. El texto está aplicado; la procedencia del dato no se ha verificado en esta sesión.

## 2. Estado por página

| Página | Qué aporta ahora | Qué falta | Decisión de Javier |
|---|---|---|---|
| Home | Origen Lorca 1966, dos sedes, tres temperaturas, capacidad, siete familias, marcas, revistas, direcciones. | Confirmar cifras de capacidad y el alcance de la cobertura. Fotos reales por sección. | Ratificar 5.000 m³ y +1.500; aprobar lote de fotos. |
| /acerca | Relato de origen, ficha de empresa, marcas y red Topgel. | Fundador, origen del nombre "Mari Pepa", dirección actual, plantilla. | Autorizar o descartar el relato familiar. |
| /calidad | Sistema de gestión, trazabilidad, ficha/alérgenos/conservación, siete familias. | Versión y alcance de ISO 9001; APPCC, IFS/BRC si existen. | Aportar certificado vigente o retirar la mención ISO. |
| /reparto | Cobertura Murcia/Almería/Alicante, plazo habitual, recepción, incidencias. | Municipios reales, ventanas horarias, pedido mínimo y portes. | Decidir qué se publica y qué se confirma por pedido. |
| /productos | Siete familias, aviso de consulta, red Topgel, marcas. | Referencias reales por familia y fotos de producto. | Entregar catálogo real o mantener modo consulta. |
| /trabaja-con-nosotros | Estado vacío correcto, formulario de CV, proceso. | Ofertas reales publicadas. | Cargar ofertas por el panel o dejar vacío. |
| /area-clientes | Acceso intacto, sin logs. | Limpieza final de dos restos visuales. | Autorizar el cambio mínimo (emoji y hex). |
| /lorca | Dirección, visita con cita, ampliación en trámite (8.953 m² de parcela). | Horario y acceso confirmados; no hay fecha de apertura ni metros construidos. | Confirmar que la ampliación puede seguir publicada. |
| /contacto | Teléfonos, email, horario y mapa. | Unificar el email de pedidos (hay dos variantes documentadas). | Elegir dirección oficial. |
| /preguntas-frecuentes | Respuestas de cobertura, plazos y documentos. | Casos reales de portes, mínimos y devoluciones. | Validar respuestas. |

## 3. Huecos de contenido que no se pueden inventar

### 3.1 Empresa y origen

- Quién fundó la empresa en 1966 y con qué actividad exacta.
- Por qué se llama "Mari Pepa": persona, mote o razón social.
- Quién dirige hoy la empresa y desde cuándo.
- Plantilla real (número y reparto Lorca/Viator).
- Superficie construida de nave; los 8.953 m² publicados son parcela en trámite, no metros construidos.

### 3.2 Operación y calidad

- Flota real: número de camiones, capacidad y temperatura de cada vehículo.
- Certificados vigentes: versión y alcance de ISO 9001; APPCC; IFS/BRC si se tienen.
- Número real de referencias por temperatura y por familia.

### 3.3 Reparto

- Municipios concretos con reparto propio y municipios delegados.
- Ventanas horarias por zona.
- Pedido mínimo, portes y recargo por entrega.
- Condiciones de devolución y de incidencia.

### 3.4 Catálogo

- Referencias reales por familia: código, nombre y formato.
- Dos fotos de producto por familia como mínimo.
- Ficha, alérgenos y conservación por referencia si se va a publicar algo más que la familia.

### 3.5 Empleo

- Ofertas reales y vigentes, con sede, jornada y condiciones.
- Criterio de publicación: cuánto tiempo queda una oferta y quién la retira.

## 4. Fotos

### 4.1 Matriz de uso actual

| Página | Fotos en primer plano | Fondo global (`CompanyBackdrop`) | Observación |
|---|---|---|---|
| Home | `careers-03`, `invernaderos.webp`, `careers-facility`, `mar.jpg`, `careers-04` + 7 familias | `careers-facility`, `careers-03`, `invernaderos.webp` | `careers-03`, `careers-facility` e `invernaderos` se repiten entre primer plano y fondo. |
| /acerca | `careers-facility`, `careers-01`, `careers-02` | `careers-03`, `careers-facility`, `invernaderos.webp` | `careers-facility` y `careers-03` repetidas. |
| /calidad | `mar.jpg`, `carne.jpg`, `reposteria.jpg` | `mar.jpg`, `careers-01`, `reposteria.jpg` | `mar` y `reposteria` repetidas. |
| /reparto | Sin galería propia | `careers-03`, `careers-04`, `invernaderos.webp` | Solo fondo. |
| /productos | 7 familias (`mar` a `salsas`, jpg) | `reposteria`, `mar`, `carne` | La misma fotografía de familia aparece en jpg y webp. |
| /lorca | Sin galería propia | `careers-facility`, `careers-03`, `careers-04` | Solo fondo. |
| /contacto | Sin galería propia | `careers-03`, `careers-facility` | Solo fondo. |
| /area-clientes | Sin galería propia | `careers-facility`, `mar` | Solo fondo. |
| /preguntas-frecuentes | Sin galería propia | `careers-facility`, `reposteria` | Solo fondo. |
| /trabaja-con-nosotros | Sin galería propia | Conjunto `default`: `careers-03`, `invernaderos.webp`, `careers-04` | No tiene conjunto propio. |

Además, el fallback SSR de capítulos (`frontend/components/home/scene-plate.tsx:5-11`) reutiliza `careers-03`, `mar`, `carne`, `careers-04` y `reposteria` en las escenas 0–4.

### 4.2 Regla "una foto distinta por sección"

No se cumple hoy. Hay repetición en tres niveles: dentro de la misma página (primer plano y fondo), entre páginas (`careers-03` y `careers-facility` aparecen en casi todas) y entre formatos (jpg y webp de la misma familia).

Riesgo: la web se lee como un mismo reportaje reciclado, no como un recorrido por sedes y familias distintas.

### 4.3 Candidatas y decisión pendiente

En `frontend/public/kage/mp/plates/` hay material real sin usar en el código: `hero-muelle-alba.jpg`, `muelle-alba.webp`, `pasillo-frio.webp`, `estanteria.webp`, `pescado-hielo.webp`, `carretera.webp` y `valle-amanecer*.webp`. También hay cuatro placas de panel en `kage/mp/admin/` que no son contenido público.

Propuesta sujeta a aprobación:

- Landing: una foto de muelle o pasillo de frío por sección (origen, capacidad, reparto), sin reutilizar `careers-03`.
- Productos: reservar las fotos de familia y dos fotos de producto por familia; no usar producto en la home como banda de capacidad.
- Empleo: foto propia de equipo o nave, hoy cae en el conjunto `default`.

El lote definitivo del servidor sigue pendiente. Sin esas fotos no se puede cerrar la regla.

## 5. Preguntas concretas para Javier

1. ¿Ratificas 5.000 m³ y +1.500 referencias como datos publicables?
   - Sí, con la fecha del dato.
   - Sí, pero sin cifra exacta ("más de 1.000").
   - No: retirar ambas cifras.
2. ISO 9001: ¿qué versión y alcance están vigentes?
   - Certificado vigente (indicar versión y alcance).
   - Sistema interno alineado con la norma, sin certificado.
   - Retirar la mención de /calidad y de los metadatos.
3. Cobertura: ¿Murcia y Almería, o también Alicante?
   - Murcia + Almería.
   - Murcia + Almería + Alicante.
   - Otra combinación (indicar).
4. Reparto: ¿publicamos pedido mínimo, portes y ventanas horarias?
   - Publicar cifras.
   - Mantener "se confirma por pedido y zona".
   - Publicar solo ventanas, sin precios.
5. ¿Autorizas contar el origen familiar (fundador y por qué "Mari Pepa")?
   - Sí, con nombres y hechos verificados.
   - Solo hechos, sin nombres.
   - No: mantener el relato actual sin protagonistas.
6. Catálogo: ¿entregas referencias reales por familia y dos fotos por familia?
   - Sí: CSV de referencias y fotos.
   - Solo fotos; referencias siguen en consulta.
   - Se queda como está (consulta por familia).
7. Empleo: ¿qué hacemos con las ofertas?
   - Cargar ofertas reales desde el panel.
   - Dejar el estado vacío hasta que haya vacantes.
   - Reutilizar los 6 ejemplos (no recomendado: hoy producen 404 en el sitemap).
8. Fotos: ¿apruebas el lote del servidor para separar landing y producto?
   - Sí, sustituir `careers-*` por fotos reales por sección.
   - Mantener las actuales y corregir solo las repeticiones.
   - Revisar una a una antes de tocar código.

## 6. Estado

### Aplicado y verificado por lectura

- Home con capacidad real en lugar del proceso genérico.
- Cinco fotos distintas en la home (más familias).
- /acerca con la red Topgel en lugar del "servicio".
- /calidad con párrafo de documentación.
- /reparto con el plazo una sola vez.
- /productos con aviso de red y sin inventar referencias.
- /trabaja-con-nosotros sin ofertas de ejemplo.
- /area-clientes sin `console.*`.

### Pendiente

- Confirmación de datos: capacidad, referencias, ISO 9001, cobertura, portes.
- Referencias y fotos reales de producto.
- Ofertas reales.
- Unificación del email de pedidos.
- Limpieza de los dos restos de /area-clientes (emoji y `#FFFFFF`).
- Sitemap de empleo alineado con la API.
- Regla "una foto distinta por sección".

### BLOCKED

- Build, lint, typecheck y verificación visual: shell denegado en esta sesión.
- Lote de fotos del servidor: no disponible aquí.
- Cualquier afirmación de certificado, plantilla, flota o municipio: falta la fuente de Javier.

### Rollback

Este cambio es solo documental. Revertir = borrar `docs/quality/CONTENT-REVIEW-2026-11-16.md`. No toca código, datos ni configuración.

## Evidencia de este documento

Archivos leídos en la sesión del 2026-11-16, rama `rediseno/v3`:

- `frontend/components/home/home-copy.ts`
- `frontend/components/home/HomeEditorial.tsx`
- `frontend/components/home/scene-plate.tsx`
- `frontend/components/editorial/content.es.ts`
- `frontend/components/editorial/EditorialCareers.tsx`
- `frontend/components/editorial/careers-data.ts`
- `frontend/components/editorial/EditorialStory.tsx`
- `frontend/components/kage/CompanyBackdrop.tsx`
- `frontend/components/kage/catalogue/Catalogue.tsx`
- `frontend/components/kage/catalogue/content/es.json`
- `frontend/app/[locale]/page.tsx`
- `frontend/app/[locale]/acerca/page.tsx`
- `frontend/app/[locale]/productos/page.tsx`
- `frontend/app/[locale]/trabaja-con-nosotros/page.tsx`
- `frontend/app/[locale]/trabaja-con-nosotros/[slug]/page.tsx`
- `frontend/app/[locale]/area-clientes/page.tsx`
- `frontend/app/sitemap.ts`
- `docs/redesign/CONTENIDO-FUENTE.md`
- `docs/quality/WEB-COMPLETENESS-CHECKLIST.md`
- `docs/quality/ADMIN-AUDIT-2026-11-16.md`

Sin comandos ejecutados por bloqueo de shell. Verificación independiente pendiente.
