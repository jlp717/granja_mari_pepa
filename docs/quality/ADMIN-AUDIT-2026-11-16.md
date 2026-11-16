# Auditoría del panel de administración — 2026-11-16

Rama auditada: `rediseno/v3` (verificada en `.git/HEAD`).
Método: lectura directa del código en esta sesión. Sin ejecución de build, tests ni llamadas a producción.
Límite de la sesión: el shell está denegado (`BLOCKED`), por lo que no hay exit codes ni capturas propias. Todo hallazgo se apoya en `archivo:línea` leído en esta sesión.
Alcance: `backend/app/routes/adminRoutes.js`, `backend/app/controllers/adminController.js`, `backend/app/services/adminService.js`, `backend/app/middleware/authMiddleware.js`, `backend/app/middleware/adminNetwork.js`, `backend/app/middleware/securityFortress.js`, `backend/app/middleware/twoFactorAuth.js`, `backend/scripts/create-admin-tables.js`, `backend/scripts/*`, `frontend/next.config.js`, `frontend/app/sitemap.ts`, `frontend/components/admin/*`.

## Resumen

| Prioridad | Hallazgos | Estado |
|---|---|---|
| P0 | 4 | Abiertos; corrección de roles, invitación e IP gate autorizada |
| P1 | 8 | Abiertos; sin autorización de cambio todavía |
| P2 | 7 | Abiertos; uno no verificable desde el repo (WAF) |

Ningún hallazgo se marca como corregido. Este documento no es un PASS.

## P0 — Crítico

### P0-1. Sin autorización por rol: un editor escala a admin

- Evidencia:
  - `backend/app/routes/adminRoutes.js:15-53`: todas las rutas del panel quedan detrás de `requireSession`; ninguna exige rol.
  - `backend/app/controllers/adminController.js:63-72`: `requireSession` valida sesión y adjunta `req.admin`, sin comprobar `role`.
  - `backend/app/services/adminService.js:861`: el rol se lee de la base de datos y se devuelve, pero no se usa para autorizar.
  - `backend/app/services/adminService.js:668`: `inviteUser` acepta `payload.role === 'admin'`, de modo que cualquier editor puede crear un admin.
- Rutas afectadas: `POST /api/admin/team`, `DELETE /api/admin/team/:id`, `PUT /api/admin/settings`, `DELETE /api/admin/sessions`.
- Impacto: escalada de privilegios completa desde una cuenta de editor.
- Estado: abierto. Javier autorizó corregir autorización por rol.
- Acción: middleware `requireRole('admin')` en rutas de equipo, ajustes, revocación de sesiones y borrados; validar el rol en servidor y no confiar en el payload.

### P0-2. Invitación muerta: `invited` no puede entrar y `resend` no hace nada

- Evidencia:
  - `backend/app/services/adminService.js:663`: sin contraseña temporal, la cuenta se crea con estado `invited`.
  - `backend/app/services/adminService.js:982`: el login rechaza explícitamente `user.STATUS === 'invited'`.
  - `backend/app/services/adminService.js:659-662`: se hashea un `crypto.randomUUID()` que nadie conoce ni recibe.
  - `backend/app/controllers/adminController.js:246-255`: `resendInvite` solo escribe en el registro de actividad; no envía correo ni genera token.
  - `backend/app/services/adminService.js:645-679`: no hay llamada a `emailService` en el alta de invitación.
- Impacto: el flujo de invitación no funciona ni con reenvío; el usuario queda bloqueado de forma permanente.
- Estado: abierto. Javier autorizó corregirlo.
- Acción: token de activación de un solo uso con caducidad, envío real por `emailService`, y `resend` que rota el token y reenvía.

### P0-3. Secretos en el árbol y credencial DB2 por defecto

- Evidencia:
  - Presencia de `.env`, `backend/.env`, `backend/.env.production`, `frontend/.env` y `frontend/.env.production` en el árbol de trabajo.
  - `backend/scripts/create-admin-tables.js:16`: `DSN=GMP;UID=JAVIER;PWD=JAVIER`.
  - `backend/scripts/diagnostic-final.js:14` y `backend/scripts/diagnostic-s303-quick.js:15`: mismo valor por defecto.
  - `docs/servidor/GUIA_CONFIGURACION_SERVIDOR_118.md:127,163,404`: mismo valor documentado.
  - `.gitignore:74` y `.gitignore:142`: `.env` y `.env.production` ignorados.
- Impacto: credencial de AS/400 con usuario y contraseña iguales, repetida en scripts y documentación. Si algún `.env` ya estaba trackeado, el ignore no lo retira del historial.
- Estado: `WARN`. Javier aprobó solo `.gitignore` por ahora. No se marca PASS ni se rota nada.
- Acción pendiente de autorización: rotar credenciales, eliminarlas del historial y sustituir los valores por defecto de los scripts por error explícito si falta la variable de entorno.

### P0-4. Sin transacciones en operaciones de escritura múltiple

- Evidencia:
  - `backend/app/services/adminService.js:686-702`: `revokeUser` ejecuta tres escrituras (baja del usuario, revocación de sesiones, actividad) sin transacción.
  - `backend/app/services/adminService.js:359-381`: `createMagazine` inserta y registra actividad en dos sentencias.
  - Sin `BEGIN`, `COMMIT` ni `ROLLBACK` en `adminService.js` (búsqueda en el archivo).
- Impacto: estado parcial si falla una sentencia intermedia; usuario dado de baja con sesión viva, o revista creada sin rastro de auditoría.
- Estado: abierto. Javier autorizó pruebas DB2 con registro `TEST`.
- Acción: agrupar escrituras relacionadas en transacción con rollback y probar en registro `TEST`.

## P1 — Alto

### P1-1. `updateApplication` ignora `name` y degrada el estado

- Evidencia: `backend/app/services/adminService.js:513-521`. Solo actualiza `STATUS` y `NOTES`; `name` se usa únicamente en el texto de actividad (línea 525). Si el estado recibido no está en la lista, se fuerza `new` (línea 515).
- Impacto: la edición de nombre no persiste y un valor inválido revierte la candidatura a `new`.
- Estado: abierto.
- Acción: persistir los campos editables, rechazar estado inválido con 400 y no aplicar valores por defecto silenciosos.

### P1-2. 404 ausentes en actualización de candidatura

- Evidencia: `backend/app/controllers/adminController.js:215-218` devuelve `success` siempre; `backend/app/services/adminService.js:513-521` no comprueba filas afectadas.
- Impacto: el panel confirma una edición que no ocurrió.
- Estado: abierto.
- Acción: comprobar rowcount y devolver 404 cuando el registro no exista.

### P1-3. PDF duplicado en disco y en DB2

- Evidencia: `backend/app/services/adminService.js:331-341` lee el PDF del disco; `:361` y `:377` lo insertan en `PDF_DATA`; `backend/scripts/create-admin-tables.js:49` define `PDF_DATA BLOB(50M)`.
- Impacto: doble almacenamiento, divergencia entre disco y base de datos y crecimiento del tablespace.
- Estado: abierto.
- Acción: elegir una fuente de verdad y migrar; si se queda DB2, dejar de escribir el fichero.

### P1-4. El BLOB no se sirve

- Evidencia: `backend/app/routes/adminRoutes.js:21-59` no expone ninguna ruta que lea `PDF_DATA`; `frontend/components/admin/AdminMagazines.tsx:271-279` enlaza directamente a `pdfUrl` (`/uploads/...`).
- Impacto: el BLOB es dato muerto; borrar el fichero de disco rompe la revista aunque el PDF esté en DB2.
- Estado: abierto.
- Acción: servir la descarga desde la fuente elegida en P1-3, con control de sesión y tipo de contenido.

### P1-5. Sin paginación en los listados del panel

- Evidencia: `backend/app/services/adminService.js:503-511` (`listApplications`), `:343-349` (`listMagazines`) y `:1044-1052` (`listPublicJobs`) cargan el conjunto completo. El único límite es `FETCH FIRST 80 ROWS ONLY` en actividad (`:733`).
- Impacto: crecimiento lineal del tiempo de respuesta y del payload del bootstrap.
- Estado: abierto.
- Acción: paginación en servidor con total y límites máximos por petición.

### P1-6. CSP débil

- Evidencia: `frontend/next.config.js:126-130` define solo `object-src`, `base-uri`, `frame-ancestors` y `worker-src`. No hay `default-src`, `script-src`, `style-src`, `img-src` ni `connect-src`.
- Impacto: la política no limita orígenes de script ni de conexión; no mitiga XSS.
- Estado: abierto.
- Acción: CSP completa en report-only, medir violaciones y pasar a bloqueo. La cabecera `sandbox` de `adminController.js:411` protege solo la descarga de CV y no sustituye a la global.

### P1-7. 2FA importado y no aplicado

- Evidencia: `backend/server.js:97-99` importa `require2FAForSensitive`; `backend/app/middleware/twoFactorAuth.js:16` lo define. No aparece montado en ninguna ruta.
- Impacto: falsa sensación de protección; ninguna operación sensible pide segundo factor.
- Estado: abierto.
- Acción: aplicarlo en login de admin, cambio de contraseña, equipo y ajustes, o retirar el import mientras no se use.

### P1-8. `revokeOtherSessions` ignora el usuario y cierra todas las sesiones

- Evidencia: `backend/app/services/adminService.js:924-931`: el `UPDATE` no filtra por `USER_ID`; `backend/app/controllers/adminController.js:146-152` pasa `req.admin.id`, pero el servicio no lo usa.
- Impacto: cualquier usuario con sesión puede cerrar las sesiones de todo el equipo.
- Estado: abierto. Detectado en esta revisión, no estaba en la lista inicial.
- Acción: filtrar por `USER_ID` y añadir prueba con dos usuarios.

## P2 — Medio

### P2-1. CSRF no ligado a la sesión

- Evidencia: `backend/app/middleware/securityFortress.js:15` guarda los tokens en un `Map` global; `:198-215` solo comprueba que el token exista; `:328-333` lo emite sin usuario y lo borra por temporizador de una hora.
- Mitigante real: la cookie de admin es `httpOnly` y `SameSite=strict` (`backend/app/controllers/adminController.js:19-32`).
- Impacto: un token obtenido por cualquier cliente sirve mientras esté vivo; no hay rotación ligada a la sesión.
- Estado: abierto.
- Acción: token por sesión, caducidad corta y rotación tras uso sensible.

### P2-2. WAF: falsos positivos no verificables desde el repo

- Evidencia: no hay regla WAF en el código. `docs/seguridad/SECURITY_FORTRESS_DOCS.md:18` sitúa el WAF en Cloudflare, fuera del repositorio.
- Impacto: bloqueos a formularios legítimos no se pueden reproducir ni auditar aquí.
- Estado: no verificado. Requiere panel y logs de Cloudflare.
- Acción: revisar reglas administradas y eventos antes de activar bloqueo; documentar las exclusiones con fecha.

### P2-3. Sitemap con ofertas estáticas

- Evidencia: `frontend/app/sitemap.ts:6` importa `JOBS` desde `careers-data`; `:22-23` construye las rutas de empleo desde ese array fijo.
- Impacto: ofertas despublicadas siguen anunciadas y las nuevas no aparecen hasta desplegar.
- Estado: abierto.
- Acción: generar las rutas de empleo desde `listPublicJobs` y mantener un fallback estático solo si la API falla.

### P2-4. Sin focus trap en modales

- Evidencia: `frontend/components/admin/AdminApplications.tsx:53-61`, `frontend/components/admin/AdminOffers.tsx:86-91`, `frontend/components/admin/AdminMagazines.tsx:72-77` y `frontend/components/admin/AdminPanel.tsx:773-778` gestionan `Escape` y no atrapan el foco ni lo restauran al cerrar.
- Impacto: el foco se escapa al contenido de fondo con teclado y lector de pantalla.
- Estado: abierto.
- Acción: foco inicial dentro del diálogo, ciclo de `Tab`, retorno al disparador y `aria-modal` ya presente en los cuatro componentes.

### P2-5. Topes de subida no separados

- Evidencia: `backend/app/routes/adminRoutes.js:55-59` admite PDF e imagen con `25mb` en la misma ruta; `:65-68` limita CV a `10mb`; `backend/server.js:241` limita JSON a `5mb`; `frontend/components/admin/AdminMagazines.tsx:115` avisa de `20 MB` en cliente.
- Impacto: el usuario recibe un límite en pantalla y otro en servidor; un PDF de 22 MB se acepta en cliente y se rechaza o se acepta según la ruta.
- Estado: abierto.
- Acción: límites por tipo en un único módulo compartido y mensaje de error con el límite real.

### P2-6. Dashboard sin gráficos

- Evidencia: `frontend/components/admin/AdminPanel.tsx:302` usa una barra de publicación y `:331-343` barras por estado. No hay librería ni componente de series temporales en `frontend/components/admin/`.
- Impacto: el resumen no permite ver tendencia de candidaturas ni de publicación.
- Estado: abierto.
- Acción: series temporales con datos reales y estado vacío explícito; sin datos inventados.

### P2-7. Sin visor PDF integrado

- Evidencia: `frontend/components/admin/AdminMagazines.tsx:271-279` abre el PDF en pestaña nueva (`target="_blank"`).
- Impacto: se pierde el contexto del panel y no hay vista previa antes de publicar.
- Estado: abierto.
- Acción: visor embebido con fallback a descarga y comprobación de que el PDF pertenece a la revista.

## Autorizaciones de Javier registradas

1. Corregir autorización por rol (P0-1).
2. Corregir el flujo de invitación (P0-2).
3. Corregir la puerta de red del panel (M14).
4. Ejecutar pruebas de escritura en DB2 con registro marcado `TEST` (P0-4, A5, A9).
5. Secretos: solo `.gitignore` por ahora. Estado `WARN`, nunca `PASS`.

Ninguna de estas autorizaciones cubre producción, despliegue ni rotación de credenciales.

## No tocar sin aprobación

- Autenticación y sesión: `backend/app/middleware/authMiddleware.js`, `backend/app/controllers/adminController.js` (login, sesión, cookies), `backend/app/services/adminService.js` (`authenticate`, `createSession`, `getSession`).
- Proxy y red: `frontend/next.config.js` (rewrites), `backend/app/middleware/adminNetwork.js`, configuración de Cloudflare o nginx.
- Escrituras DB2: cualquier `INSERT`, `UPDATE` o `DELETE` fuera de un registro `TEST` autorizado, y todo DDL.
- Secretos: `.env`, `backend/.env.production`, `frontend/.env.production`, historial de git y rotación de credenciales.
- Producción: despliegue, reinicio de procesos, cambios en `/var/www/mari-pepa` y cualquier operación sobre datos reales.

## Riesgos residuales

- Sin build ni tests ejecutados en esta sesión: los hallazgos son de lectura y pueden tener dependencias no visibles en tiempo de ejecución.
- Los estados de las sesiones y del registro de actividad no se han comprobado contra DB2.
- El historial de git no se ha inspeccionado: no se puede afirmar si algún `.env` estuvo trackeado.

## Próximo paso

1. Aplicar P0-1 y P0-2 con pruebas de autorización de dos roles.
2. Cerrar P1-8 y P1-1/P1-2 antes de tocar el resto del panel.
3. Decidir P1-3/P1-4: fuente de verdad del PDF.
4. Repetir esta auditoría con build y tests cuando el shell esté permitido, y adjuntar exit codes.

## Evidencia de este documento

Lectura de archivos en la sesión del 2026-11-16, rama `rediseno/v3`. Sin comandos ejecutados por bloqueo de shell. Verificación independiente pendiente.
