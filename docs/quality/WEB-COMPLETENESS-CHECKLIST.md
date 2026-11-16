# Checklist de completitud web — Mari Pepa

Fecha: 2026-11-16
Rama de referencia: `rediseno/v3` (verificada en `.git/HEAD`)
Ámbito: web pública, panel de administración y activos de entrega.
Naturaleza: documento de control. No sustituye a la evidencia ni autoriza cambios.

## Niveles

| Nivel | Nombre | Alcance |
|---|---|---|
| B | Público | Páginas públicas, contenido, SEO, i18n, motion, accesibilidad, rendimiento y formularios. |
| M | Admin | Panel interno: autorización, sesión, invitaciones, ficheros, datos y visibilidad. |
| A | Activos y entrega | Build, secretos, renombrado Kage, 3D, pruebas DB2, dependencias y documentación. |

Estados permitidos: `PENDIENTE`, `PASS`, `WARN`, `BLOCKED`.
`BLOCKED` solo para lo que depende de un permiso, una decisión o una herramienta no disponible.

## B — Público

| ID | Nivel | Dominio | Criterio verificable | Estado | Evidencia | Herramienta | Responsable |
|---|---|---|---|---|---|---|---|
| B1 | B | Contenido | Ninguna página visible del sitemap contiene lorem, TODO ni texto provisional; el copy coincide con `docs/redesign/CONTENIDO-FUENTE.md` | PENDIENTE | Pendiente | grep sobre `frontend/app` + revisión visual | Frontend |
| B2 | B | SEO | Cada ruta y locale tiene `title` y `description` únicos, sin duplicados cruzados | PENDIENTE | Pendiente | curl + Lighthouse SEO | Frontend |
| B3 | B | i18n | Claves es/en completas; cero claves sin traducir y cero literales fuera de next-intl | PENDIENTE | Pendiente | script de paridad de claves | Frontend |
| B4 | B | Motion | Toda animación de reveal se desactiva con `prefers-reduced-motion: reduce` y no produce layout shift | PENDIENTE | Pendiente | DevTools emulación + revisión CSS | Frontend |
| B5 | B | Fondos | No quedan fondos o imágenes de relleno; cada fondo visible está aprobado en el inventario de `docs/redesign/art/` | PENDIENTE | Pendiente | inventario de assets + revisión visual | Diseño + Frontend |
| B6 | B | Responsive | Sin overflow horizontal ni solapamientos entre 360 y 2560 px en rutas públicas | PENDIENTE | Pendiente | Playwright (viewport matrix) | Frontend |
| B7 | B | Accesibilidad | Contraste AA, foco visible, landmarks, un `h1` por página y navegación completa por teclado | PENDIENTE | Pendiente | axe-core + Lighthouse a11y | Frontend |
| B8 | B | Rendimiento | LCP < 2,5 s, CLS < 0,1 e INP < 200 ms en móvil 4G simulada | PENDIENTE | Pendiente | Lighthouse CI | Frontend |
| B9 | B | Navegación | Una sola barra de navegación; todos los enlaces internos resuelven 200 | PENDIENTE | Pendiente | crawl local | Frontend |
| B10 | B | Catálogo | El catálogo sigue en "Próximamente" salvo artículos con ficha real verificada en DB2 | PENDIENTE | Pendiente | consulta DB2 read-only + revisión | Datos + Frontend |
| B11 | B | Formularios | Contacto y candidatura validan en cliente y servidor, con estados de error y éxito visibles | PENDIENTE | Pendiente | prueba manual + llamada API | Frontend + Backend |
| B12 | B | Legal | Privacidad, términos y cookies vigentes, enlazados desde el pie y sin enlaces rotos | PENDIENTE | Pendiente | revisión + crawl | Frontend + Javier |
| B13 | B | Errores | Existen páginas 404 y 500 propias, sin trazas ni rutas internas expuestas | PENDIENTE | Pendiente | curl a rutas inválidas | Frontend |
| B14 | B | Indexación | `sitemap.ts` y `robots.txt` reflejan solo rutas publicables y locales indexables | PENDIENTE | Pendiente | curl + revisión de `sitemap.ts` | Frontend |
| B15 | B | Enlaces externos | Cero enlaces muertos; `target="_blank"` siempre con `rel="noopener noreferrer"` | PENDIENTE | Pendiente | crawl + grep | Frontend |
| B16 | B | Metadatos sociales | OG y Twitter Card presentes con imagen real, dimensiones correctas y URL absoluta | PENDIENTE | Pendiente | validador OG + curl | Frontend |

## M — Admin

| ID | Nivel | Dominio | Criterio verificable | Estado | Evidencia | Herramienta | Responsable |
|---|---|---|---|---|---|---|---|
| M1 | M | Autorización | Un usuario `editor` recibe 403 en gestión de equipo, ajustes y borrados; solo `admin` los ejecuta | PENDIENTE | Hallazgo P0-1 de `ADMIN-AUDIT-2026-11-16.md` | dos sesiones + llamadas API | Backend + Seguridad |
| M2 | M | Invitaciones | Una cuenta `invited` puede activarse y `resend` envía un correo real con token de un solo uso | PENDIENTE | Hallazgos P0-2 de la auditoría | prueba de flujo completo | Backend |
| M3 | M | Sesiones | Revocar "otras sesiones" afecta solo al usuario actual; la API no devuelve hashes de token | PENDIENTE | Hallazgo P1-8 de la auditoría | dos usuarios + listado de sesiones | Backend |
| M4 | M | CSRF | El token CSRF está ligado a la sesión, caduca y se rechaza si pertenece a otra sesión | PENDIENTE | Hallazgo P2-1 de la auditoría | prueba con token cruzado | Seguridad |
| M5 | M | Uploads | Límite por tipo coherente entre cliente y servidor (PDF, imagen, CV) y rechazo con 413 verificable | PENDIENTE | Hallazgo P2-5 de la auditoría | subida de ficheros al límite | Backend + Frontend |
| M6 | M | Paginación | Ofertas, candidaturas, revistas y actividad paginan en servidor con total y sin cargar todo el conjunto | PENDIENTE | Hallazgo P1-5 de la auditoría | llamadas con offset y límite | Backend |
| M7 | M | PDF | Una sola fuente de verdad para el PDF de revista; descarga y visor usan la misma fuente | PENDIENTE | Hallazgos P1-3 y P1-4 de la auditoría | descarga + borrado controlado en TEST | Backend + Datos |
| M8 | M | Candidaturas | Editar una candidatura persiste nombre y estado, y devuelve 404 si el registro no existe | PENDIENTE | Hallazgos P1-1 y P1-2 de la auditoría | PUT con id válido e inválido | Backend |
| M9 | M | Ofertas | CRUD completo, slug único y 404 correcto en update, estado, duplicado y borrado | PENDIENTE | Pendiente | pruebas de API | Backend |
| M10 | M | Revistas | CRUD completo, publicación verificable en la web pública y visor PDF integrado | PENDIENTE | Hallazgo P2-7 de la auditoría | prueba de publicación + visor | Backend + Frontend |
| M11 | M | Ajustes | Los ajustes validan tipos y quedan registrados en actividad con valor anterior y nuevo | PENDIENTE | Pendiente | PUT + lectura de actividad | Backend |
| M12 | M | Actividad | La actividad registra actor, entidad y fecha, sin datos personales innecesarios, con retención definida | PENDIENTE | Pendiente | revisión de registros | Backend + Seguridad |
| M13 | M | Dashboard | Métricas con series temporales reales, no solo contadores y barras estáticas | PENDIENTE | Hallazgo P2-6 de la auditoría | revisión + datos reales | Frontend + Backend |
| M14 | M | IP gate | La puerta de red usa allowlist explícita y no confía en cabeceras de reenvío fuera de loopback | PENDIENTE | Autorizado por Javier; middleware en `backend/app/middleware/adminNetwork.js` | prueba desde IP externa y loopback | Backend + Seguridad |
| M15 | M | 2FA | Operaciones sensibles exigen segundo factor aplicado en rutas, no solo middleware importado | PENDIENTE | Hallazgo P1-7 de la auditoría | prueba con y sin segundo factor | Seguridad |

## A — Activos y entrega

| ID | Nivel | Dominio | Criterio verificable | Estado | Evidencia | Herramienta | Responsable |
|---|---|---|---|---|---|---|---|
| A1 | A | Build | Lint, typecheck y build de `frontend/` terminan con exit 0 sobre el árbol actual | BLOCKED | Shell denegado en esta sesión: no hay comando ejecutable ni exit code | PowerShell + npm | Frontend |
| A2 | A | Secretos | Credenciales rotadas, fuera del árbol y sin valores por defecto en scripts | BLOCKED | Solo se aprobó `.gitignore` por ahora; rotación no autorizada | gestor de secretos + revisión | Javier + Seguridad |
| A3 | A | Renombrado Kage | Decisión de nombre, rutas y redirecciones antes de tocar `public/kage` | BLOCKED | Depende de decisión de producto y de Javier | revisión de decisión + inventario | Javier + Frontend |
| A4 | A | 3D visual | Decisión explícita de incluir o excluir 3D y, si entra, criterios de rendimiento y fallback | BLOCKED | Sin decisión registrada; no se puede verificar el resultado | revisión de decisión | Javier + Diseño |
| A5 | A | Transacciones | Operaciones de escritura múltiple en DB2 usan transacción con commit y rollback | PENDIENTE | Autorizado con registro de pruebas TEST | pruebas DB2 con registro TEST | Backend + Datos |
| A6 | A | Inventario de assets | Cada asset entregado tiene origen, licencia y hash; los reales sustituyen a los provisionales | PENDIENTE | Pendiente | inventario + verificación de hashes | Diseño |
| A7 | A | Dependencias | `npm audit` sin vulnerabilidades críticas ni altas sin justificar | PENDIENTE | Pendiente | npm audit | Frontend + Backend |
| A8 | A | Contratos API | Tests de contrato cubren autorización, 404, validación y errores del panel | PENDIENTE | Pendiente | suite de tests | Backend |
| A9 | A | Pruebas DB2 | Toda prueba de escritura usa registro marcado `TEST` y se limpia al terminar | PENDIENTE | Autorizado por Javier | script con marca TEST + verificación | Datos |
| A10 | A | Despliegue | Staging probado con humo real y rollback documentado antes de producción | PENDIENTE | Requiere aprobación explícita de Javier | checklist de despliegue | Javier + Backend |
| A11 | A | Documentación | Decisiones y estado real actualizados en `docs/`, sin PASS ficticios | PENDIENTE | Pendiente | revisión de documentos | Todos |

## Reglas de evidencia

1. `PASS` exige comando, directorio de ejecución y exit code, o captura o URL fechada. Sin una de esas pruebas, el estado es `PENDIENTE`.
2. `WARN` exige una limitación escrita: qué no se pudo verificar, por qué y qué riesgo queda abierto.
3. `BLOCKED` corta la entrega de ese criterio. No se convierte en `PASS` por ausencia de fallo ni por revisión visual genérica.
4. Ningún agente se autoaprueba. El verificador es distinto del autor del cambio y es de solo lectura.
5. La evidencia se guarda con fecha y rama. Una captura sin fecha no vale como `PASS`.
6. Un criterio solo pasa a `PASS` cuando su evidencia está adjunta en este documento o enlazada desde él.

## Estado actual

- Público: en progreso. Contenido, SEO, reveal y fondos reales siguen abiertos; la propia documentación de rediseño declara evidencia parcial y no da la web por terminada (`docs/redesign/RESULTADO.md`).
- Admin: auditado. Los P0 están identificados y Javier autorizó corregir roles, invitación e IP gate, además de pruebas DB2 con registro `TEST`.
- Fondo del panel de administración: en curso.
- Build y shell: `BLOCKED` en esta sesión por permisos; no hay evidencia de lint, typecheck ni build.

## Definition of Done

1. Todos los B en `PASS` con evidencia fechada.
2. Todos los M sin `BLOCKED`; los `WARN` aceptados por escrito con fecha y responsable.
3. Los A resueltos o con `WARN` aceptado y fecha; A1, A2, A3 y A4 desbloqueados por decisión explícita de Javier.
4. Verificación independiente registrada: verificador distinto del autor, solo lectura, con su propio informe.
5. Ningún criterio en `PASS` sin comando, captura o URL fechada.
