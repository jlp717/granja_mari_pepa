# ARQUITECTURA DE SEGURIDAD - SISTEMA DE AUTENTICACIÓN NIVEL BANCARIO

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Cumplimiento de Estándares](#cumplimiento-de-estándares)
3. [Política de Contraseñas Moderna (2025)](#política-de-contraseñas-moderna-2025)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Flujos de Autenticación](#flujos-de-autenticación)
6. [Seguridad en Profundidad](#seguridad-en-profundidad)
7. [Migración desde Sistema Legacy](#migración-desde-sistema-legacy)
8. [Experiencia de Usuario](#experiencia-de-usuario)
9. [Instalación y Configuración](#instalación-y-configuración)
10. [Auditoría y Monitoreo](#auditoría-y-monitoreo)

---

## Resumen Ejecutivo

Este documento describe el diseño e implementación de un **sistema de autenticación de nivel bancario** para Granja Mari Pepa, que reemplaza el sistema legacy inseguro (código cliente + NIF como contraseña) con una arquitectura moderna que cumple con:

- **NIST SP 800-63B** (Digital Identity Guidelines - Authentication and Lifecycle Management)
- **OWASP Authentication Cheat Sheet 2025**
- **Política de contraseñas basada en fortaleza real** (zxcvbn), no en reglas obsoletas
- **Experiencia de usuario educativa y no frustrante**

### Mejoras Clave

| Aspecto | Sistema Legacy | Sistema Nuevo |
|---------|---------------|---------------|
| Contraseña | NIF (público) | Contraseña fuerte única (Argon2id) |
| Fortaleza | 0/4 (información pública) | 4/4 (muy fuerte, validada con zxcvbn) |
| Tiempo de crackeo | Instantáneo | Siglos o miles de millones de años |
| Compromiso | 100% comprometido | Verificado contra HaveIBeenPwned |
| Hashing | MD5/plaintext | Argon2id (NIST recomendado) |
| Auditoría | Ninguna | Completa con journaling DB2 |
| UX | Ninguna guía | Feedback en tiempo real + educación |

---

## Cumplimiento de Estándares

### NIST SP 800-63B (2025)

✅ **Memorized Secret Verifiers (5.1.1)**
- Mínimo 12 caracteres (recomendado 16+)
- Máximo sin límite arbitrario
- Todos los caracteres ASCII y Unicode permitidos
- Sin requisitos de composición obsoletos

✅ **Password Strength Meters (5.1.1.3)**
- Implementación de zxcvbn para medir fortaleza real
- Feedback educativo en tiempo real
- Estimación de tiempo de crackeo mostrada al usuario

✅ **Password History (5.1.1.2)**
- Prevención de reutilización de últimas 10 contraseñas
- Almacenamiento seguro con Argon2id

✅ **Compromised Password Check (5.1.1.2)**
- Integración con API HaveIBeenPwned usando k-anonymity
- Rechazo automático de contraseñas filtradas

✅ **Hashing Algorithms (5.1.1.2)**
- Argon2id (tipo 2i) con parámetros recomendados:
  - Memory cost: 64 MB (65536 KiB)
  - Time cost: 3 iteraciones
  - Parallelism: 4 threads
  - Hash length: 64 bytes

### OWASP Authentication Cheat Sheet

✅ **Password Storage**
- Argon2id como primera opción
- Bcrypt como fallback (no usado aquí)
- Salt único por contraseña (generado por Argon2id)

✅ **Account Lockout**
- 5 intentos fallidos → bloqueo 30 minutos
- Registro de todos los intentos con IP y user-agent
- Auditoría completa de eventos de seguridad

✅ **Session Management**
- JWT con corta duración (15 minutos)
- Refresh tokens con larga duración (7 días)
- Revocación automática al cambiar contraseña

---

## Política de Contraseñas Moderna (2025)

### ❌ Política OBSOLETA (NO implementada)

```
❌ Mínimo 8 caracteres
❌ Debe contener: mayúscula, minúscula, número, símbolo
❌ Cambio obligatorio cada 90 días
❌ No más de 2 caracteres repetidos
```

**Por qué está obsoleta:**
- NIST demostró que las reglas de composición **reducen la entropía**
- Los usuarios crean patrones predecibles: `Password1!`, `Password2!`
- El cambio forzado lleva a variaciones débiles: `Winter2024!`, `Spring2025!`
- Los caracteres especiales no aportan si la contraseña es corta

### ✅ Política MODERNA (SÍ implementada)

```
✅ Mínimo 12 caracteres (recomendado 16+)
✅ Evaluación con zxcvbn (score mínimo 4/4 - Muy fuerte)
✅ Verificación contra HaveIBeenPwned
✅ Prevención de reutilización (últimas 10)
✅ Sin reglas de composición obligatorias
✅ Feedback en tiempo real de fortaleza
✅ Tiempo de crackeo mostrado visualmente
```

**Por qué es superior:**
- **Mayor entropía real**: `mi-perro-se-llama-firulais-2024` (35 caracteres) es infinitamente más fuerte que `P@ssw0rd`
- **Más memorables**: Frases largas son más fáciles de recordar que patrones complejos
- **Educación del usuario**: El feedback visual enseña qué hace una contraseña fuerte
- **Menos frustración**: No hay rechazo arbitrario por "falta un símbolo"

### Comparación de Fortaleza Real

| Contraseña | Longitud | Reglas obsoletas | Score zxcvbn | Tiempo de crackeo |
|------------|----------|------------------|--------------|-------------------|
| `P@ssw0rd` | 9 | ✅ Cumple todas | 0/4 (Muy débil) | Instantáneo |
| `Password123!` | 12 | ✅ Cumple todas | 1/4 (Débil) | Segundos |
| `migatosellamamichi` | 18 | ❌ Sin mayúsculas ni números | 3/4 (Fuerte) | Siglos |
| `En-2024-adopte-un-perro-llamado-Max` | 37 | ❌ Solo una mayúscula | 4/4 (Muy fuerte) | Miles de millones de años |

**Conclusión científica:** Una frase larga y única (sin reglas de composición) es **órdenes de magnitud más segura** que una contraseña corta con todos los tipos de caracteres.

---

## Arquitectura del Sistema

### Stack Tecnológico

**Backend:**
- **Node.js** con Express
- **ibm_db** (driver nativo para DB2 for i)
- **Argon2id** (vía `argon2` package)
- **zxcvbn** para evaluación de fortaleza
- **JWT** (jsonwebtoken)
- **axios** para API HaveIBeenPwned

**Frontend:**
- **React + TypeScript** (Next.js)
- **Tailwind CSS** para estilos
- **zxcvbn** (client-side para feedback inmediato)
- **Lucide React** para iconos

**Base de Datos:**
- **DB2 for i (IBM i / AS/400)**
- Schema: **JAVIER**
- Journaling habilitado para auditoría inmutable

### Modelo de Datos

```
CUSTOMER_CREDENTIALS (tabla principal)
├── CUSTOMER_ID (PK)
├── CUSTOMER_CODE (UNIQUE)
├── PASSWORD_HASH (Argon2id)
├── PASSWORD_ALGORITHM ('ARGON2ID' | 'LEGACY')
├── IS_LEGACY_PASSWORD ('0' | '1')
├── LAST_PASSWORD_CHANGE
├── ACCOUNT_STATUS ('ACTIVE' | 'LOCKED' | 'SUSPENDED')
├── FAILED_LOGIN_ATTEMPTS
├── ACCOUNT_LOCKED_UNTIL
└── ... (auditoría: LAST_LOGIN_AT, IP, USER_AGENT)

CUSTOMER_PASSWORDS (historial)
├── PASSWORD_HISTORY_ID (PK, IDENTITY)
├── CUSTOMER_ID (FK)
├── PASSWORD_HASH
├── STRENGTH_SCORE (zxcvbn score)
├── CRACK_TIME_DISPLAY
└── CHANGED_AT

REFRESH_TOKENS (sesiones)
├── TOKEN_ID (PK, IDENTITY)
├── CUSTOMER_ID (FK)
├── TOKEN_HASH (Argon2id)
├── DEVICE_ID, DEVICE_NAME, USER_AGENT
├── EXPIRES_AT
├── IS_REVOKED ('0' | '1')
└── REVOKE_REASON

SECURITY_AUDIT (log inmutable)
├── AUDIT_ID (PK, IDENTITY)
├── EVENT_TIME (CURRENT_TIMESTAMP)
├── CUSTOMER_ID (FK)
├── EVENT_TYPE ('LOGIN_ATTEMPT', 'PASSWORD_CHANGED', ...)
├── EVENT_CATEGORY ('AUTHENTICATION', 'PASSWORD', 'SECURITY')
├── SEVERITY ('INFO', 'WARNING', 'ERROR', 'CRITICAL')
├── IP_ADDRESS, USER_AGENT
└── RESULT ('SUCCESS', 'FAILURE', 'BLOCKED')

LOGIN_ATTEMPTS (detección de ataques)
├── ATTEMPT_ID (PK, IDENTITY)
├── CUSTOMER_ID, CUSTOMER_CODE
├── SUCCESS ('0' | '1')
├── FAILURE_REASON
├── IP_ADDRESS, USER_AGENT
├── IS_SUSPICIOUS ('0' | '1')
└── RISK_SCORE
```

### Flujo de Datos

```
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    { customerCode, password }
       ▼
┌─────────────────────┐
│  Express Backend    │
│  authController.js  │
└──────┬──────────────┘
       │ 2. Delega a
       ▼
┌────────────────────────┐
│  authServiceSecure.js  │
│  • Busca cliente       │
│  • Verifica bloqueo    │
│  • Verifica contraseña │
│  • Genera JWT          │
└──────┬─────────────────┘
       │ 3. Consultas DB
       ▼
┌──────────────────────┐
│  DB2 for i (JAVIER)  │
│  • CUSTOMER_...      │
│  • REFRESH_TOKENS    │
│  • LOGIN_ATTEMPTS    │
│  • SECURITY_AUDIT    │
└──────┬───────────────┘
       │ 4. Resultado
       ▼
┌─────────────────────┐
│  Cliente recibe:    │
│  • accessToken      │
│  • refreshToken     │
│  • customer data    │
│  • showPassword...  │ ← Modal recomendación
└─────────────────────┘
```

---

## Flujos de Autenticación

### 1. Login con Contraseña Legacy (NIF)

```
Usuario: Código 9900, Contraseña: 12345678A (su NIF)

┌─────────────────────────────────────────────────┐
│ 1. Frontend envía credentials                  │
│    POST /api/auth/login                         │
│    { customerCode: "9900", password: "12345..." }│
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 2. Backend busca en CUSTOMER_CREDENTIALS        │
│    WHERE CUSTOMER_CODE = '9900'                 │
│    Resultado:                                   │
│    - PASSWORD_ALGORITHM = 'LEGACY' o 'ARGON2ID' │
│    - PASSWORD_HASH = hash Argon2id del NIF      │
│    - IS_LEGACY_PASSWORD = '1'                   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 3. Verifica contraseña:                         │
│    await argon2.verify(storedHash, '12345...')  │
│    ✅ Match → continúa                          │
│    ❌ No match → incrementa FAILED_ATTEMPTS     │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 4. Genera JWT + Refresh Token                   │
│    Registra en LOGIN_ATTEMPTS (SUCCESS='1')     │
│    Actualiza LAST_LOGIN_AT, IP, USER_AGENT      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 5. Respuesta al Frontend:                       │
│    {                                             │
│      success: true,                              │
│      accessToken: "eyJhbGci...",                 │
│      refreshToken: "a3f9c...",                   │
│      showPasswordChangeModal: TRUE ← Clave      │
│    }                                             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 6. Frontend muestra INMEDIATAMENTE:             │
│    <LegacyPasswordWarningModal />               │
│                                                  │
│    ⚠️ Tu contraseña actual es tu NIF...         │
│    [Cambiar ahora] [Continuar de momento]       │
│                                                  │
│    • No bloquea acceso                          │
│    • Educación persuasiva                       │
│    • Destacar acción recomendada                │
└─────────────────────────────────────────────────┘
```

### 2. Cambio de Contraseña (UX Completa)

```
Usuario hace clic en "Cambiar contraseña ahora"

┌─────────────────────────────────────────────────┐
│ 1. Frontend muestra:                            │
│    <PasswordChangeForm />                       │
│                                                  │
│    [Contraseña actual: ••••••••]                │
│    [Nueva contraseña: ________]  ← zxcvbn       │
│    [Confirmar: ________]                        │
└────────────────┬────────────────────────────────┘
                 │
                 │ Usuario escribe en tiempo real:
                 │ "mi-perro-se-llama-firulais-2024"
                 │
┌────────────────▼────────────────────────────────┐
│ 2. Frontend ejecuta zxcvbn (client-side):       │
│                                                  │
│    const result = zxcvbn(password)              │
│    • score: 4/4 (Muy fuerte) ✅                 │
│    • crack_time_display:                        │
│      "miles de millones de años"                │
│                                                  │
│    Muestra:                                      │
│    ━━━━━━━━━━ 100% Verde                        │
│    "Muy fuerte"                                  │
│    ⏱️ "Tiempo para crackear: miles de          │
│       millones de años"                          │
│    ✅ "¡Excelente! Esta contraseña tardaría    │
│       siglos..."                                 │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 3. Frontend verifica HaveIBeenPwned:            │
│    POST /api/auth/check-password-pwned          │
│                                                  │
│    Backend:                                      │
│    - Hash SHA-1 de la contraseña                │
│    - Envía primeros 5 chars a API (k-anonymity) │
│    - Busca sufijo en respuesta                  │
│                                                  │
│    ✅ No encontrada → Mostrar check verde       │
│    ❌ Encontrada → Rechazar + mensaje educativo │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 4. Usuario hace clic "Cambiar contraseña"       │
│                                                  │
│    Frontend muestra MODAL DE CONFIRMACIÓN:      │
│                                                  │
│    ⚠️ Vas a cambiar tu contraseña.              │
│    Esta acción:                                  │
│    • Cerrará sesiones en otros dispositivos     │
│    • Invalidará tokens anteriores               │
│    • Protegerá con contraseña muy fuerte        │
│                                                  │
│    [Cancelar] [Sí, cambiar ahora]               │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 5. Backend (authServiceSecure.js):              │
│                                                  │
│    a) Verifica contraseña actual ✅             │
│    b) Valida nueva (zxcvbn score >= 4) ✅       │
│    c) Verifica HaveIBeenPwned ✅                │
│    d) Verifica historial (no reutilizar) ✅     │
│    e) Hashea con Argon2id                       │
│    f) UPDATE CUSTOMER_CREDENTIALS SET           │
│       PASSWORD_HASH = newHash,                  │
│       PASSWORD_ALGORITHM = 'ARGON2ID',          │
│       IS_LEGACY_PASSWORD = '0',                 │
│       LAST_PASSWORD_CHANGE = NOW()              │
│    g) INSERT INTO CUSTOMER_PASSWORDS            │
│       (historial)                                │
│    h) UPDATE REFRESH_TOKENS SET                 │
│       IS_REVOKED='1' (todas las sesiones)       │
│    i) INSERT INTO SECURITY_AUDIT                │
│       EVENT_TYPE='PASSWORD_CHANGED'             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│ 6. Frontend muestra:                            │
│    <PasswordChangeSuccessModal />               │
│                                                  │
│    ✅ ¡Contraseña cambiada con éxito!           │
│                                                  │
│    ⏱️ Tiempo para crackear tu nueva            │
│       contraseña:                                │
│       MILES DE MILLONES DE AÑOS                  │
│                                                  │
│    Puntuación de fortaleza: 4/4 MUY FUERTE      │
│                                                  │
│    [Entendido, continuar]                       │
└─────────────────────────────────────────────────┘
```

---

## Seguridad en Profundidad

### Capas de Protección

1. **Transporte:**
   - HTTPS obligatorio en producción
   - TLS 1.3 recomendado

2. **Input Validation:**
   - Sanitización de todos los inputs
   - Prevención de SQL Injection (parametrized queries)
   - Rate limiting (5 req/min por IP en login)

3. **Password Storage:**
   - Argon2id con parámetros NIST
   - Salt único automático por contraseña
   - Nunca almacenar plaintext

4. **Session Management:**
   - JWT con expiración corta (15 min)
   - Refresh tokens revocables
   - Invalidación al cambiar contraseña

5. **Account Protection:**
   - Bloqueo temporal tras 5 fallos
   - Detección de IPs sospechosas
   - Registro de user-agent y device fingerprint

6. **Auditing:**
   - Todos los eventos en SECURITY_AUDIT
   - Journaling DB2 habilitado
   - Logs inmutables

7. **Defense in Depth:**
   - Backend valida TODO (nunca confiar en frontend)
   - Frontend valida para UX (feedback inmediato)
   - DB tiene constraints y triggers

### Vectores de Ataque Mitigados

| Ataque | Mitigación |
|--------|------------|
| Credential Stuffing | Password pwned check + account lockout |
| Brute Force | Rate limiting + lockout + Argon2id slow hashing |
| Dictionary Attack | zxcvbn rechaza contraseñas comunes |
| Rainbow Tables | Salt único + Argon2id |
| SQL Injection | Parametrized queries |
| Session Hijacking | JWT expiry + httpOnly cookies + secure flag |
| Replay Attack | Nonce en tokens + timestamp validation |
| Man-in-the-Middle | HTTPS obligatorio |

---

## Migración desde Sistema Legacy

### Estrategia de Migración en 3 Fases

**FASE 1: Migración SQL Masiva**

```sql
-- Ejecutar: backend/database/ibm-i/02_migration_from_legacy.sql

1. Copia todos los clientes de DSEDAC.CLI a JAVIER.CUSTOMER_CREDENTIALS
2. Marca IS_LEGACY_PASSWORD = '1'
3. Guarda hash temporal 'LEGACY_' + NIF
4. Registra en SECURITY_AUDIT
```

**FASE 2: Hashing Argon2id Offline**

```bash
# Ejecutar: node backend/scripts/hash-legacy-passwords.js

1. Lee cada cliente con PASSWORD_ALGORITHM='LEGACY'
2. Obtiene NIF desde DSEDAC.CLI
3. Hashea con Argon2id real
4. Actualiza PASSWORD_HASH en CUSTOMER_CREDENTIALS
5. Mantiene IS_LEGACY_PASSWORD='1' (aún usan NIF como password)
6. Inserta en CUSTOMER_PASSWORDS (historial)
```

**FASE 3: Conversión Gradual por Usuario**

```
Cada vez que un usuario con IS_LEGACY_PASSWORD='1' hace login:

1. Login exitoso con NIF ✅
2. Frontend recibe showPasswordChangeModal: true
3. Modal aparece INMEDIATAMENTE (no bloqueante)
4. Usuario puede:
   a) "Cambiar ahora" → Flujo completo de cambio
   b) "Continuar de momento" → Cierra modal
      (aparecerá en CADA login futuro)

5. Al cambiar contraseña:
   - IS_LEGACY_PASSWORD cambia a '0'
   - PASSWORD_ALGORITHM ya es 'ARGON2ID'
   - Modal YA NO aparece en futuros logins
```

### Métricas de Migración

Monitorear con vista `V_MIGRATION_STATS`:

```sql
SELECT * FROM JAVIER.V_MIGRATION_STATS;

Resultado esperado:
METRIC                        | VALUE
------------------------------|--------
TOTAL_CUSTOMERS              | 1250
LEGACY_PASSWORD_COUNT        | 847    ← Reducir a 0
MODERN_PASSWORD_COUNT        | 403    ← Aumentar
CUSTOMERS_WITH_EMAIL         | 920
EMAIL_VERIFICATION_RATE      | 68.50%
```

**KPIs de éxito:**
- **Semana 1:** 10% conversión (125 usuarios)
- **Mes 1:** 40% conversión (500 usuarios)
- **Mes 3:** 80% conversión (1000 usuarios)
- **Mes 6:** 95%+ conversión

---

## Experiencia de Usuario

### Principios de Diseño UX

1. **Educar, No Frustrar**
   - Explicar el "por qué" de cada requisito
   - Mostrar beneficios tangibles (tiempo de crackeo)
   - Feedback positivo cuando hace algo bien

2. **Transparencia Total**
   - No ocultar requisitos hasta el submit
   - Validación en tiempo real
   - Mensajes claros y en español

3. **No Bloqueante**
   - Modal de recomendación NO impide acceso
   - Usuario decide cuándo cambiar
   - Recordatorio persistente pero respetuoso

4. **Refuerzo Positivo**
   - Celebrar el cambio de contraseña
   - Mostrar estadísticas de seguridad obtenida
   - Hacer sentir al usuario empoderado

### Flujo de Usuario Típico

```
👤 Usuario 9900 (usa NIF: 12345678A)

┌─────────────────────────────┐
│ 1. Va a granja-mari-pepa.es │
│    Clic "Iniciar sesión"    │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│ 2. Ingresa:                 │
│    Código: 9900             │
│    Contraseña: 12345678A    │
│    [Entrar]                 │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│ 3. ✅ Login exitoso         │
│    Redirige a /dashboard    │
└──────────┬──────────────────┘
           │
┌──────────▼────────────────────────────────────┐
│ 4. 🚨 MODAL APARECE INMEDIATAMENTE            │
│    (cubre 60% de pantalla, fondo blur)        │
│                                               │
│    ⚠️ Tu cuenta necesita protección           │
│                                               │
│    Tu contraseña actual es tu NIF,            │
│    información pública conocida por terceros. │
│    Tu cuenta está en RIESGO ALTO.             │
│                                               │
│    ¿Por qué cambiarla ahora?                  │
│    • Seguridad exponencial                    │
│    • Proceso guiado (2 minutos)               │
│    • Protección inmediata                     │
│                                               │
│    [Cambiar contraseña ahora] ← Verde         │
│    [Continuar de momento]     ← Gris          │
└──────────┬────────────────────────────────────┘
           │
           ├─ Si elige "Continuar de momento"
           │  └─> Modal se cierra, dashboard normal
           │      (aparecerá en PRÓXIMO login)
           │
           └─ Si elige "Cambiar ahora"
              └─> Flujo completo de cambio
                  (ver sección anterior)
```

### Elementos de Persuasión

**En el Modal de Advertencia:**
- ⚠️ Icono de alerta (no error)
- Gradiente naranja/amarillo (atención, no pánico)
- Título: "Tu cuenta necesita protección"
- Texto: Explica el riesgo en 1-2 frases claras
- Lista de beneficios con checkmarks
- Tiempo estimado: "solo 2 minutos"
- Botón primario verde grande: "Cambiar ahora"
- Botón secundario gris pequeño: "Continuar"

**En el Formulario de Cambio:**
- 🔒 Icono de candado (seguridad)
- Barra de fortaleza visual (rojo→amarillo→verde)
- Score numérico: X/4
- Tiempo de crackeo en GRANDE
- Mensajes educativos: "¡Excelente!"
- Check HaveIBeenPwned con iconos
- Feedback de zxcvbn traducido

**En el Modal de Éxito:**
- ✅ Icono de éxito grande
- Gradiente verde
- Título: "¡Contraseña cambiada con éxito!"
- Tiempo de crackeo destacado: 48pt font
- Tarjetas de beneficios obtenidos
- Puntuación final: 4/4 MUY FUERTE

---

## Instalación y Configuración

### 1. Dependencias Backend

```bash
cd backend
npm install argon2 jsonwebtoken zxcvbn axios ibm_db dotenv
```

**package.json:**
```json
{
  "dependencies": {
    "argon2": "^0.31.2",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "ibm_db": "^3.2.3",
    "jsonwebtoken": "^9.0.2",
    "zxcvbn": "^4.4.2"
  }
}
```

### 2. Dependencias Frontend

```bash
cd frontend
npm install zxcvbn lucide-react
```

**package.json:**
```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3",
    "zxcvbn": "^4.4.2",
    "lucide-react": "^0.298.0"
  }
}
```

### 3. Variables de Entorno

**backend/.env:**
```env
# JWT Secrets (cambiar en producción)
JWT_SECRET=tu-secreto-muy-largo-y-aleatorio-minimo-64-caracteres
JWT_REFRESH_SECRET=otro-secreto-diferente-para-refresh-tokens-64-chars

# IBM i Database
IBM_I_DATABASE=tu_database
IBM_I_HOST=tu_host_ibm_i
IBM_I_PORT=50000
IBM_I_USER=usuario_db
IBM_I_PASSWORD=contraseña_db

# Entorno
NODE_ENV=production
```

### 4. Ejecutar Migración

```bash
# Paso 1: Crear tablas
# Ejecutar en IBM i ACS Run SQL Scripts:
# backend/database/ibm-i/01_create_security_tables.sql

# Paso 2: Migración SQL masiva
# Ejecutar en IBM i ACS:
# backend/database/ibm-i/02_migration_from_legacy.sql

# Paso 3: Hashear contraseñas con Argon2id
cd backend
node scripts/hash-legacy-passwords.js

# Verificar migración
# En ACS ejecutar:
SELECT * FROM JAVIER.V_MIGRATION_STATS;
```

### 5. Integrar Rutas en Backend

**backend/server.js:**
```javascript
const authSecureRoutes = require('./app/routes/authSecureRoutes');

// Rutas de autenticación segura
app.use('/api/auth', authSecureRoutes);
```

### 6. Integrar Componentes en Frontend

**frontend/app/login/page.tsx:**
```typescript
import { useState } from 'react';
import LegacyPasswordWarningModal from '@/components/auth/LegacyPasswordWarningModal';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';
import PasswordChangeSuccessModal from '@/components/auth/PasswordChangeSuccessModal';

// Lógica de login y manejo de modales
```

---

## Auditoría y Monitoreo

### Consultas de Auditoría Clave

**1. Intentos de login fallidos en últimas 24h:**
```sql
SELECT
    CUSTOMER_CODE,
    COUNT(*) AS FAILED_ATTEMPTS,
    MAX(ATTEMPT_TIME) AS LAST_ATTEMPT,
    IP_ADDRESS
FROM JAVIER.LOGIN_ATTEMPTS
WHERE SUCCESS = '0'
    AND ATTEMPT_TIME >= CURRENT_TIMESTAMP - 24 HOURS
GROUP BY CUSTOMER_CODE, IP_ADDRESS
ORDER BY FAILED_ATTEMPTS DESC;
```

**2. Eventos de seguridad críticos:**
```sql
SELECT
    EVENT_TIME,
    CUSTOMER_ID,
    EVENT_TYPE,
    EVENT_DESCRIPTION,
    IP_ADDRESS,
    RESULT
FROM JAVIER.SECURITY_AUDIT
WHERE SEVERITY IN ('CRITICAL', 'WARNING')
    AND EVENT_TIME >= CURRENT_TIMESTAMP - 7 DAYS
ORDER BY EVENT_TIME DESC;
```

**3. Usuarios que aún usan contraseña legacy:**
```sql
SELECT
    CUSTOMER_CODE,
    FULL_NAME,
    EMAIL,
    LAST_LOGIN_AT,
    DATEDIFF(DAY, CREATED_AT, CURRENT_TIMESTAMP) AS DAYS_SINCE_MIGRATION
FROM JAVIER.CUSTOMER_CREDENTIALS
WHERE IS_LEGACY_PASSWORD = '1'
    AND ACCOUNT_STATUS = 'ACTIVE'
ORDER BY LAST_LOGIN_AT DESC NULLS LAST;
```

**4. Cuentas bloqueadas:**
```sql
SELECT
    CUSTOMER_CODE,
    FULL_NAME,
    ACCOUNT_LOCKED_UNTIL,
    FAILED_LOGIN_ATTEMPTS,
    LAST_FAILED_LOGIN
FROM JAVIER.CUSTOMER_CREDENTIALS
WHERE ACCOUNT_STATUS = 'LOCKED'
    AND ACCOUNT_LOCKED_UNTIL > CURRENT_TIMESTAMP;
```

### Dashboards Recomendados

1. **Security Operations Center (SOC)**
   - Login attempts: success vs. failed (últimas 24h)
   - Top 10 IPs con más intentos fallidos
   - Eventos críticos en tiempo real
   - Tasas de conversión legacy → modern

2. **User Adoption**
   - % usuarios con contraseñas modernas
   - Tiempo promedio hasta cambio de contraseña
   - Razones de rechazo (contraseña débil, pwned, etc.)

3. **Performance**
   - Tiempo de respuesta de login
   - Tiempo de hashing Argon2id (debe ser ~100-300ms)
   - Disponibilidad de API HaveIBeenPwned

### Alertas Automáticas

```sql
-- Trigger para alertar múltiples logins fallidos desde misma IP
CREATE TRIGGER JAVIER.TRG_ALERT_BRUTE_FORCE
AFTER INSERT ON JAVIER.LOGIN_ATTEMPTS
REFERENCING NEW AS N
FOR EACH ROW
WHEN (N.SUCCESS = '0')
BEGIN
    DECLARE RECENT_FAILURES INTEGER;

    SELECT COUNT(*) INTO RECENT_FAILURES
    FROM JAVIER.LOGIN_ATTEMPTS
    WHERE IP_ADDRESS = N.IP_ADDRESS
        AND SUCCESS = '0'
        AND ATTEMPT_TIME >= CURRENT_TIMESTAMP - 5 MINUTES;

    IF RECENT_FAILURES >= 10 THEN
        -- Insertar alerta crítica
        INSERT INTO JAVIER.SECURITY_AUDIT (
            EVENT_TYPE,
            EVENT_CATEGORY,
            SEVERITY,
            EVENT_DESCRIPTION,
            IP_ADDRESS,
            RESULT
        ) VALUES (
            'BRUTE_FORCE_DETECTED',
            'SECURITY',
            'CRITICAL',
            'Possible brute force attack: ' || TRIM(CHAR(RECENT_FAILURES)) || ' failed logins in 5 minutes',
            N.IP_ADDRESS,
            'BLOCKED'
        );
    END IF;
END;
```

---

## Conclusión

Este sistema de autenticación implementa las **mejores prácticas 2025** para seguridad de contraseñas, combinando:

1. **Tecnología punta:** Argon2id, zxcvbn, HaveIBeenPwned
2. **Cumplimiento normativo:** NIST SP 800-63B, OWASP
3. **Políticas modernas:** Fortaleza real sobre reglas obsoletas
4. **UX excelente:** Educación sin frustración
5. **Migración gradual:** Sin interrumpir servicio
6. **Auditoría completa:** Trazabilidad total

**Resultado:** Un sistema de autenticación de **nivel bancario** que protege a los usuarios y educa sobre seguridad, convirtiendo un riesgo crítico (NIF como contraseña) en una fortaleza inexpugnable.

---

**Documentado por:** Sistema de Autenticación Segura - Granja Mari Pepa
**Fecha:** 2025-01-15
**Versión:** 1.0
**Cumplimiento:** NIST SP 800-63B, OWASP 2025
