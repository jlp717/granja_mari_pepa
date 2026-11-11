# 03 · Brief, estrategia y documento de secciones

> Estos son los documentos «brief», «cómo hacer un brief» y «secciones» que el vídeo prepara antes del primer prompt. Los completa el agente en la **Fase 1** con evidencia. Toda línea lleva `Fuente:`. Lo que no se pueda sostener se queda como `PENDIENTE-DATO`; nunca se rellena por intuición (R2).

---

## PARTE A · Cómo se escribe el brief (reglas)

1. **Una frase por campo, con fuente.** Si no cabe en una frase, no está claro.
2. **Acción principal única por tipo de visitante.** Si hay tres «principales», no hay ninguna.
3. **Pruebas de confianza = solo las que existen** (certificaciones, años, clientes, cifras). Cada una con su fuente verificable.
4. **Tono con ejemplos reales** extraídos del contenido actual (`CONTENIDO.md`), no adjetivos sueltos.
5. **Restricciones técnicas y de negocio explícitas** (qué no se puede tocar).
6. **No-objetivos**: qué se deja fuera a propósito.
7. El brief se lee entero antes de cada paquete de trabajo; los subagentes reciben solo los campos que necesitan.

## PARTE B · Brief de mari-pepa.com

### B1. Hechos de partida
| Campo | Valor | Fuente |
|---|---|---|
| Proyecto | Web de Granja Mari Pepa, distribución HORECA, hecha con Next.js y Supabase | Javier (declarado) |
| Rediseño pedido | Mismo contenido y funcionalidad; estilo visual y gráfico totalmente distinto; acabado de startup profesional; se pueden añadir páginas, secciones o elementos | Javier (declarado) |
| Empresa | Granja Mari Pepa, Lorca (Murcia); proveedor de productos congelados, refrigerados y frescos; indicado «más de 50 años» de trayectoria | **Fuente de terceros** (directorio proveedores.com) → `PENDIENTE-CONFIRMAR` con la web corporativa pública o con Javier antes de mostrarlo como dato |
| Web corporativa pública | granjamaripepa.com (enlazada desde el directorio anterior) | Usar como fuente de hechos de marca **solo si carga y lo confirma** |
| Stack real | `POR-COMPLETAR` desde `INVENTARIO.md` | Repo |

### B2. Estrategia (responder con evidencia, en este orden)
| Pregunta | Dónde buscar la respuesta | Respuesta (≤2 líneas) | Fuente |
|---|---|---|---|
| ¿Quién usa la web y para qué? (tipos de visitante/cliente) | Rutas, roles y tablas en el repo/BD; textos actuales | | |
| ¿Cuál es la acción principal de cada tipo? | Flujos existentes (acceso, catálogo, pedido…) | | |
| ¿Qué necesita ver un comprador de hostelería para fiarse? | Contenido actual + web corporativa pública | | |
| ¿Qué pruebas de confianza existen de verdad? | Repo, BD (agregados), web corporativa | | |
| ¿Qué objeciones o fricciones tiene el flujo actual? | Recorrido real con Playwright (capturas «antes») | | |
| ¿Qué NO se puede cambiar? | Auth, RLS, API, esquemas, rutas | | |
| No-objetivos | Decisión | | |

### B3. Tono y voz
Extrae 10 frases reales de `CONTENIDO.md` que representen el tono actual y decide, con criterio explícito, qué se mantiene y qué se ajusta. Cualquier cambio → `CAMBIOS-DE-TEXTO.md`.

### B4. Dirección visual (sale de la Fase 1, no se improvisa)
Matriz de 3 candidatas con los criterios (a)–(d) de la misión. Resultado en `DECISIONES.md`. Diales iniciales: `DESIGN_VARIANCE=6`, `MOTION_INTENSITY=4`, `VISUAL_DENSITY=5`; se ajustan comparando dos variantes de cabecera con capturas.

---

## PARTE C · Documento de secciones (ahorra tokens: cada página se describe una vez)

### C1. Mapa de rutas: actual → nueva
Se genera desde `INVENTARIO.md`. Todas las rutas existentes aparecen, sin excepción.

| Ruta actual | Prioridad (P0/P1/P2) | Página nueva (misma ruta salvo decisión registrada) | Cambia contenido | Referencia(s) primaria(s) |
|---|---|---|---|---|
| | | | no (salvo microcopy registrado) | |

### C2. Ficha por página (plantilla)
```
## <ruta> — <nombre>
- Objetivo de la página (1 frase) · Visitante · Acción principal
- Secciones, en orden: 1) … 2) … 3) …   (cada una con: propósito · contenido existente que contiene · datos de Supabase que consume · componente DESIGN.md §7 · asset previsto (04) · referencia primaria)
- Estados: vacío · carga · error · sin permisos
- Responsive: qué cambia en móvil (orden, colapsos, navegación)
- Movimiento (DESIGN.md §6): qué se anima y por qué; qué NO se anima
- Aceptación: capturas «después» en 390 y 1440 + auditoría pasada
```

### C3. Candidatos a páginas o secciones NUEVAS (se crean solo con dato real; el agente decide)
Propuestas razonables para un distribuidor HORECA. **Cada una requiere la columna «Dato real»**; si no existe, no se publica y se registra `PENDIENTE-DATO`.

| Candidata | Para qué sirve al comprador | Dato real necesario | ¿Existe? |
|---|---|---|---|
| Catálogo por familias/categorías con navegación clara | Encontrar rápido el producto | Categorías y productos en BD | |
| Cómo trabajamos (pedido → preparación → entrega) | Reducir incertidumbre del primer pedido | Proceso real descrito por Javier o en el contenido actual | |
| Cadena de frío y calidad | Confianza en producto congelado/refrigerado/fresco | Certificaciones o procedimientos documentados | |
| Zona y horarios de reparto | Saber si puede comprar | Zonas y horarios confirmados | |
| Solicitar alta profesional (flujo de entrada claro) | Convertir visitantes en clientes | Flujo de alta existente o definido | |
| Preguntas frecuentes de hostelería | Resolver objeciones sin llamar | Respuestas reales | |
| Contacto con comercial / WhatsApp | Camino corto | Canales reales y horarios | |
| Estados vacíos/errores con tono de marca | Acabado de producto maduro | No requiere dato externo | |

### C4. Reglas de uso del documento
- Los subagentes leen **la ficha de su página** y las secciones de DESIGN.md citadas; no releen el repositorio entero.
- Toda sección nueva nace aquí antes de implementarse.
- Cambios de alcance se registran en `DECISIONES.md`, no se hacen en silencio.
