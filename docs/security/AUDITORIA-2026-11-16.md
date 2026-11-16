# Auditoría de seguridad — Mari Pepa

**Fecha:** 2026-11-16
**Alcance:** web pública, panel de administración, formularios, correo, subidas, DB2.
**Método:** revisión estática + validación en producción. Tres especialistas en paralelo
(`appsec-engineer`, `security-reviewer`, `Security-Validator`) con el modelo
`opencode-go/deepseek-v4.1-flash`, más comprobaciones propias en servidor.

> No existe un plugin de marketplace de Claude instalado en este entorno. Se ha usado
> el equipo de seguridad disponible, que cubre el mismo alcance con revisión
> independiente y evidencia verificable.

---

## 1. Hallazgos críticos

### C1. Credenciales reales en el repositorio — CORREGIDO EN CÓDIGO, ROTACIÓN PENDIENTE

| Dato | Ubicación original | Estado |
|---|---|---|
| `PWD=JAVIER` (DB2 producción) | 15 scripts de `backend/scripts/**` | Literales eliminados; ahora exige `ODBC_CONNECTION_STRING` |
| Contraseña SMTP `noreply@mari-pepa.com` | `facturaController.js:341`, `libroIvaController.js:503` | Fallback eliminado; falla cerrado |
| Cliente `4300009900` / DNI como contraseña | `backend/registrar-password.js:15-16` | Sustituido por `TEST_CUSTOMER_CODE` / `TEST_CUSTOMER_PASSWORD` |
| `23224478K`, `mariPepa2024`, `TEST123` | tests y scripts | Sustituidos por variables de entorno o datos ficticios |

**Pendiente obligatorio:** rotar la contraseña DB2 del perfil `JAVIER`, la del buzón
`noreply` y las contraseñas de cliente afectadas. Purgar el historial de git
(`git filter-repo`) requiere aprobación explícita y coordinación de clones.

### C2. Bypass de la puerta de red del panel — MITIGADO, INFRA PENDIENTE

- `frontend/proxy.ts` confiaba en `cf-connecting-ip`, primer valor de
  `X-Forwarded-For` y en el `Host` privado.
- `backend/app/middleware/adminNetwork.js` hacía lo mismo.
- `deploy/nginx/mari-pepa.conf` reenviaba `CF-Connecting-IP` del cliente y usaba
  `$proxy_add_x_forwarded_for`.

**Aplicado:** se confía en `X-Real-IP` (que nginx sobrescribe) y, en su defecto, en el
último salto de `X-Forwarded-For`; se elimina el atajo por `Host`; el `CF-Connecting-IP`
del cliente se vacía en la configuración de nginx.

**Verificado:** puertos `3001` y `5000` **no accesibles desde Internet** (respuesta `000`
desde `217.125.92.225`), acceso LAN `200`, `/admin` público `403`.

**Pendiente:** el `.env` del servidor y la config de nginx desplegada no se pueden
editar sin `sudo`; el cambio de nginx queda en el repo listo para el próximo despliegue.
El spoofing de cabeceras solo es posible desde la propia LAN/VPN, donde ya se tiene
acceso de red.

### C3. Sin autorización por rol — CORREGIDO

- `requireAdmin` añadido y aplicado a `/team*` y `/settings`.
- `revokeOtherSessions` ahora filtra por `USER_ID` (antes cerraba sesiones de todo el equipo).
- Bloqueo de login: el contador ahora es por email **o** IP, no por la pareja, para que
  rotar la IP no evite el bloqueo.

---

## 2. Hallazgos altos

| # | Hallazgo | Estado |
|---|---|---|
| A1 | TLS SMTP con `rejectUnauthorized:false` | Corregido: `true` y host con certificado válido (`mn05-02.dnspropio.com`). `verifyConnection` OK |
| A2 | CV públicos sin cuota ni caducidad | Limitador `pdfLimiter` aplicado; el PDF se borra al eliminar la candidatura. Retención programada pendiente |
| A3 | Inyección de cabeceras en asunto de contacto | `\r\n` eliminados en todos los campos del asunto |
| A4 | `/api/public/contact` sin límite propio (bombardeo de correo) | Limitador `6/15 min` por IP |
| A5 | Formularios de candidatura sin límite propio | Limitador `20/15 min` por IP |
| A6 | HTML sin escapar en plantillas de recuperación/verificación | `escapeHtml()` aplicado |

---

## 3. Hallazgos medios y bajos

| # | Hallazgo | Estado |
|---|---|---|
| M1 | `revokeOtherSessions` global | Corregido |
| M2 | `/uploads/admin/*` público | Aceptado: son PDFs y portadas de revistas públicas; los CV viven en `private/cv` |
| M3 | PII en logs (email, nombre, IP) | Pendiente: redacción y retención |
| M4 | `trust proxy: true` fuera de producción | Pendiente: usar `loopback` también en staging |
| B1 | Cookie admin sin prefijo `__Host-` | Pendiente: requiere HTTPS interno |
| B2 | Fallbacks JWT en `authServiceSecure` | Pendiente: el arranque de `server.js` ya aborta si faltan |

---

## 4. Controles verificados como correctos

- SQL de `adminService.js` parametrizado; sin concatenación de entrada.
- Descarga de CV: regex estricta, sin path traversal, `requireSession` y cabeceras
  `nosniff`, `CSP sandbox`, `no-store`.
- Subidas: magic bytes, límites de tamaño, nombres aleatorios sin sobrescritura.
- Sesiones: token de 32 bytes, hash SHA-256 en base de datos, expiración comprobada.
- Contraseñas: bcrypt 12 rondas, mínimo 10 caracteres.
- CSRF global con exenciones acotadas; panel envía `x-csrf-token`.
- CORS con lista blanca y `credentials: true`.
- `.env*` fuera de git; `ODBC_CONNECTION_STRING` obligatoria al arrancar.
- Inyección de cabeceras SMTP mitigada por nodemailer 7 y validación de email.

---

## 5. Evidencia de pruebas

```
SMTP verify (TLS estricto)      -> success: SMTP connection verified
Correo con logo CID             -> success + Content-ID inline verificado
Contacto público                -> 201 en 1,4 s (limiter activo)
SQL bloqueo de login            -> query válida en DB2
Admin LAN 3001                  -> 200
Admin público 443               -> 403
Puertos 3001/5000 desde fuera   -> 000 (no expuestos)
k6 navegación 15 VUs / 25 s     -> 302 peticiones, 0 % errores, p95 519 ms
k6 validación formularios       -> 6/6 checks, 0 % errores, p95 62 ms
k6 escritura 1 iteración        -> CV + candidatura 201, fila limpiada
```

---

## 6. Veredicto

**WARN** — código endurecido y desplegado; no se puede declarar PASS hasta:

1. Rotar credenciales DB2, SMTP y clientes afectados.
2. Purgar el historial de git con aprobación.
3. Aplicar la configuración de nginx en el servidor (requiere `sudo`).
4. Definir retención de CV y redacción de PII en logs.

Los controles de aplicación (RBAC, límites, TLS, borrado de CV, escape, puerta de red)
quedan cerrados y verificados.
