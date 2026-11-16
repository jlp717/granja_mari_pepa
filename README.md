# Granja Mari Pepa — web y área de clientes

Aplicación Next.js con cinco idiomas y servicios de negocio existentes. El rediseño de esta rama, `rediseno/v3`, porta el sistema visual autorizado de Kage desde una copia literal conservada en `reference/kage-verbatim/`. Backend, autenticación y datos mantienen su arquitectura previa.

## Desarrollo local

Se utiliza Node.js 22.22.1. Desde `frontend/`:

```powershell
npm ci
$env:NEXT_DIST_DIR = '.next-kage-dev'
npm run dev -- --port 3000
```

La vista pública estará en `http://localhost:3000/es`. Las funciones que necesitan el backend utilizan su configuración existente; el rediseño no incorpora claves ni cambia sus destinos. No es necesario activar pedidos ni fabricar un catálogo para revisar las páginas públicas.

## Verificación

Desde `frontend/`:

```powershell
npm run lint
npm run typecheck
npm test -- --watchAll=false --runInBand
$env:NEXT_DIST_DIR = '.next-kage-production'
npm run build
```

Las pruebas de navegador V3 y sus recorridos se documentan en `docs/redesign/RESULTADO.md`. No deben ejecutarse intentos reales de acceso ni escrituras de negocio para una revisión visual: se utilizan respuestas de prueba aisladas en el navegador.

## Arquitectura del rediseño

- `components/kage/engine/`: motor original portado, cámara, postproceso, tarjetas Cloth y nuevo mundo de distribución.
- `components/kage/navigation/` y `components/layout/`: navegación persistente, capítulos, consentimiento y relevo entre rutas.
- `components/kage/fonts/` y `styles/`: siete fuentes originales y cascada editorial Kage, con adaptación medida del acento de marca.
- `components/home/`, `components/kage/catalogue/`, `editorial/` y `operations/`: contenidos y pantallas de cada familia de rutas.
- `public/kage/`: recursos originales aplicables y ambientes ilustrativos propios. El producto no se genera con IA.

El scroll es nativo. Existe un único canvas ambiental persistente; las tarjetas Cloth originales pueden crear canvas locales que se liberan al desmontarse. Sin WebGL y con movimiento reducido, la lectura completa utiliza láminas estáticas. El área interna no activa WebGL.

## Contenido y alcance

El catálogo público conserva «Próximamente». Los pedidos permanecen desactivados. Los datos de ejemplo del código no son fichas reales ni justifican publicar precios o disponibilidad. Los textos legales se preservan en los cinco idiomas.

Las fuentes de los datos, las contradicciones encontradas y los datos pendientes están en `CONTENIDO-FUENTE.md`, `CONTENIDO-HUECOS.md` y `CONTENIDO-PENDIENTE.md`. `COREOGRAFIA.md` distingue diseño aprobado de implementación y aceptación; una captura aislada no sustituye un recorrido.

## Referencia y derechos

La reutilización de Kage está autorizada según confirmación expresa del usuario en esta sesión. Su README original se conserva y no concede una licencia general a terceros. Three.js r149 conserva su aviso MIT. La procedencia de las imágenes y sus prompts se registra en `ASSETS.md`.

## Estado verificable

La preparación y la referencia literal están verificadas. La implementación de páginas y sus pruebas siguen el estado concreto registrado en `docs/redesign/RESULTADO.md`; este README no certifica por sí solo una entrega de producción. Next 14 heredado requiere una revisión de seguridad y soporte independiente antes de desplegar; no se han cambiado automáticamente sus versiones durante el rediseño.
