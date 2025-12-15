# 🛡️ SECURITY FORTRESS - Documentación de Seguridad Máxima

## Resumen Ejecutivo

Este documento describe las **10 capas de seguridad** implementadas en el sistema de Granja Mari Pepa, diseñadas para hacer el sistema virtualmente imposible de hackear.

---

## Arquitectura de Seguridad - 10 Capas de Protección

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 0: Cloudflare WAF + DDoS Protection (Perímetro)               │
│  • Bloqueo de ataques a nivel de red                                │
│  • Filtrado de tráfico malicioso                                    │
│  • Protección contra DDoS                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 1: checkBannedIP                                              │
│  • IPs maliciosas baneadas automáticamente                          │
│  • Ban temporal de 1 hora tras 10 incidentes sospechosos            │
│  • Lista negra persistente                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 2: detectMaliciousBots                                        │
│  • Bloqueo de herramientas de hacking (SQLMap, Nikto, Burp, etc.)   │
│  • Detección de User-Agents maliciosos                              │
│  • Respuesta lenta deliberada para frustrar scanners                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 3: validateHeaders                                            │
│  • Detección de headers de bypass (X-Original-URL, etc.)            │
│  • Límite de Content-Length                                         │
│  • Validación estricta de Content-Type                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 4: detectMaliciousPayloads                                    │
│  • Detección de SQL Injection (30+ patrones)                        │
│  • Detección de XSS (20+ patrones)                                  │
│  • Detección de Path Traversal                                      │
│  • Detección de Command Injection                                   │
│  • Detección de LDAP Injection                                      │
│  • Detección de XXE                                                 │
│  • Detección de NoSQL Injection                                     │
│  • Detección de Prototype Pollution                                 │
│  • Detección de SSTI                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 5: honeypotTrap                                               │
│  • Campos honeypot invisibles                                       │
│  • Detección de bots que rellenan campos ocultos                    │
│  • Respuesta falsa para confundir atacantes                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 6: deviceFingerprinting                                       │
│  • Hash único por dispositivo (IP + User-Agent + Accept-Language)   │
│  • Seguimiento de dispositivos por usuario                          │
│  • Detección de acceso desde múltiples dispositivos                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 7: csrfProtectionAdvanced                                     │
│  • Tokens CSRF firmados con HMAC-SHA256                             │
│  • Expiración de tokens (1 hora)                                    │
│  • Verificación de Origin/Referer                                   │
│  • Protección timing-safe contra ataques de timing                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 8: Rate Limiting Multinivel                                   │
│  • General: 100 peticiones/minuto por IP                            │
│  • Login: 5 intentos/15 minutos por IP                              │
│  • Por usuario: 60 peticiones/minuto por endpoint                   │
│  • PDFs: 10 generaciones/minuto                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 9: Autenticación JWT + Sesiones                               │
│  • Access Token: 15 minutos de vida                                 │
│  • Refresh Token: 7 días con rotación obligatoria                   │
│  • Blacklist de tokens revocados                                    │
│  • Detección de session hijacking                                   │
│  • Límite de 5 sesiones concurrentes por usuario                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CAPA 10: Auditoría Completa                                        │
│  • Registro de cada acceso a datos sensibles                        │
│  • IP, usuario, timestamp, fingerprint                              │
│  • Detección de patrones de acceso anómalos                         │
│  • Alertas automáticas (>100 peticiones/minuto)                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PROTECCIÓN DE DATOS                                                │
│  • Prepared Statements en TODAS las queries (anti-SQLi)             │
│  • Validación Joi estricta en TODOS los endpoints                   │
│  • Sanitización de inputs (anti-XSS)                                │
│  • Ownership verification (cada cliente solo ve SUS datos)          │
│  • Encriptación AES-256-GCM para datos sensibles                    │
│  • Enmascaramiento de PII en logs                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BASE DE DATOS (IBM i) - VÍA VPN                                    │
│  • Acceso SOLO desde servidor web (firewall)                        │
│  • Cuenta con permisos mínimos (solo SELECT en tablas específicas)  │
│  • Sin permisos de DELETE, DROP, TRUNCATE, ALTER                    │
│  • Conexión cifrada por VPN WireGuard                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detalle de Ataques Bloqueados

### 1. SQL Injection
**Estado: ✅ BLOQUEADO en múltiples capas**

- **Capa 4**: Detección de 30+ patrones SQL maliciosos
- **Código**: Prepared statements con placeholders en TODAS las queries
- **Validación**: Joi rechaza caracteres especiales en inputs

Patrones detectados:
- UNION SELECT, OR 1=1, AND 1=1
- WAITFOR DELAY, SLEEP, BENCHMARK
- Comentarios SQL (--, /*, #)
- Funciones peligrosas (CHAR, CHR, CONCAT, etc.)
- Stored procedures (xp_, sp_)

### 2. Cross-Site Scripting (XSS)
**Estado: ✅ BLOQUEADO en múltiples capas**

- **Capa 4**: Detección de 20+ patrones XSS
- **Middleware**: Sanitización de todos los inputs
- **Headers**: Content-Security-Policy estricto
- **Helmet**: X-XSS-Protection habilitado

Patrones detectados:
- `<script>`, `<iframe>`, `<object>`, `<embed>`
- Event handlers (onclick, onerror, onload)
- javascript:, vbscript:, data:
- document.cookie, window.location
- eval(), new Function(), setTimeout

### 3. Brute Force
**Estado: ✅ BLOQUEADO**

- **Rate limiting**: 5 intentos de login cada 15 minutos
- **Bloqueo de cuenta**: Tras 5 intentos fallidos, bloqueo de 30 minutos
- **Ban de IP**: Tras 10 incidentes, ban de 1 hora

### 4. Session Hijacking
**Estado: ✅ BLOQUEADO**

- **Device fingerprinting**: Hash único por dispositivo
- **Detección de cambios**: Si cambia IP + User-Agent = re-login obligatorio
- **Token rotation**: Refresh tokens rotan en cada uso
- **Blacklist**: Tokens revocados no pueden reutilizarse

### 5. CSRF (Cross-Site Request Forgery)
**Estado: ✅ BLOQUEADO**

- **Tokens firmados**: HMAC-SHA256 con secreto de servidor
- **Expiración**: 1 hora máximo
- **Verificación Origin**: Comprobación de headers Origin/Referer
- **Timing-safe**: Comparación segura contra timing attacks

### 6. Path Traversal
**Estado: ✅ BLOQUEADO**

- **Capa 4**: Detección de ../, ..%2f, %c0%ae, etc.
- **Validación**: Joi rechaza rutas con caracteres especiales

### 7. Command Injection
**Estado: ✅ BLOQUEADO**

- **Capa 4**: Detección de ;, |, &, $, backticks
- **Arquitectura**: No hay ejecución de comandos shell desde inputs

### 8. XML/XXE Injection
**Estado: ✅ BLOQUEADO**

- **Capa 4**: Detección de <!DOCTYPE, <!ENTITY, SYSTEM
- **Arquitectura**: No se procesan XMLs de usuarios

### 9. NoSQL Injection
**Estado: ✅ BLOQUEADO**

- **Capa 4**: Detección de $where, $gt, $regex, etc.
- **Arquitectura**: Base de datos SQL (IBM i), no NoSQL

### 10. Prototype Pollution
**Estado: ✅ BLOQUEADO**

- **Capa 4**: Detección de __proto__, constructor, prototype
- **Validación**: Joi con stripUnknown elimina propiedades no definidas

### 11. DDoS
**Estado: ✅ MITIGADO**

- **Cloudflare**: Filtrado a nivel de red
- **Rate limiting**: Múltiples capas de limitación
- **Ban automático**: IPs sospechosas baneadas

### 12. Bots y Crawlers Maliciosos
**Estado: ✅ BLOQUEADOS**

- **Capa 2**: Detección de 20+ herramientas de ataque
- **Honeypots**: Trampas para bots automatizados
- **Respuesta lenta**: Frustración deliberada de scanners

---

## Archivos de Seguridad Implementados

| Archivo | Descripción |
|---------|-------------|
| `securityFortress.js` | Módulo principal con 10 capas de protección |
| `twoFactorAuth.js` | Autenticación de dos factores (2FA) |
| `securityMiddleware.js` | Rate limiting, sanitización, logging |
| `sessionSecurity.js` | Timeout, hijacking detection, CSRF legacy |
| `authMiddleware.js` | JWT verification, ownership check |
| `validation.js` | Schemas Joi para todos los endpoints |
| `validators.js` | Funciones de validación adicionales |

---

## Configuración de Seguridad en Producción

### Variables de Entorno Requeridas

```env
# Secretos (OBLIGATORIOS - generar con crypto.randomBytes)
JWT_ACCESS_SECRET=<64 bytes hex>
JWT_REFRESH_SECRET=<64 bytes hex>
CSRF_SECRET=<32 bytes hex>
ENCRYPTION_KEY=<32 bytes hex>
FINGERPRINT_SALT=<16 bytes hex>

# Entorno
NODE_ENV=production

# CORS (SOLO dominios autorizados)
CORS_ORIGIN=https://granjamari.com

# Base de datos (VPN)
ODBC_CONNECTION_STRING=DSN=GMP_VPN;...
```

### Headers HTTP de Seguridad (Helmet)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Conclusión

Con estas 10+ capas de seguridad implementadas:

1. **Un atacante tendría que superar CADA capa** para acceder al sistema
2. **Cualquier actividad sospechosa** activa alertas y posibles bans automáticos
3. **Incluso si logra autenticarse**, la auditoría registra todo
4. **La base de datos** está aislada y solo acepta consultas SELECT limitadas
5. **Los datos sensibles** están encriptados y enmascarados en logs

**¿Es 100% imposible de hackear?** Ningún sistema lo es. Pero con estas protecciones, un atacante necesitaría:
- Recursos extraordinarios
- Conocimientos muy avanzados
- Mucho tiempo
- Y aún así, el daño sería limitado por los permisos mínimos de la BD

El nivel de seguridad es comparable al de aplicaciones bancarias y cumple con estándares como OWASP Top 10.
