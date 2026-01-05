# GUÍA DE INSTALACIÓN - SISTEMA DE AUTENTICACIÓN SEGURA

## Resumen

Esta guía te permitirá instalar y configurar el sistema de autenticación de nivel bancario en **menos de 30 minutos**.

---

## Requisitos Previos

- ✅ Node.js 18+ instalado
- ✅ Acceso a IBM i (AS/400) con DB2
- ✅ IBM Access Client Solutions (ACS) para ejecutar SQL
- ✅ Usuario con permisos en schema JAVIER
- ✅ Git (opcional, para control de versiones)

---

## Paso 1: Instalar Dependencias Backend

```bash
cd backend
npm install argon2 jsonwebtoken zxcvbn axios ibm_db dotenv express cookie-parser
```

**Verificar instalación:**
```bash
npm list argon2 zxcvbn
```

Deberías ver:
```
├── argon2@0.31.2
└── zxcvbn@4.4.2
```

---

## Paso 2: Instalar Dependencias Frontend

```bash
cd ../frontend
npm install zxcvbn lucide-react
```

**Verificar instalación:**
```bash
npm list zxcvbn lucide-react
```

---

## Paso 3: Configurar Variables de Entorno

Crea `backend/.env` (o actualiza el existente):

```env
# JWT Secrets - CAMBIAR EN PRODUCCIÓN
JWT_SECRET=cambia-esto-por-un-secreto-muy-largo-y-aleatorio-minimo-64-caracteres
JWT_REFRESH_SECRET=otro-secreto-diferente-para-refresh-tokens-usar-openssl-rand-base64-64

# IBM i Database
IBM_I_DATABASE=TU_DATABASE
IBM_I_HOST=192.168.1.100
IBM_I_PORT=50000
IBM_I_USER=USUARIO_DB
IBM_I_PASSWORD=CONTRASEÑA_DB

# Entorno
NODE_ENV=development
```

**Generar secretos seguros:**
```bash
# En Linux/Mac:
openssl rand -base64 64

# En Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
```

---

## Paso 4: Crear Tablas en DB2 for i

### 4.1 Abrir IBM Access Client Solutions

1. Conectar a tu sistema IBM i
2. Ir a **Run SQL Scripts**

### 4.2 Ejecutar Script de Creación de Tablas

```sql
-- Copiar y pegar TODO el contenido de:
-- backend/database/ibm-i/01_create_security_tables.sql

-- Ejecutar (F5 o botón Run)
```

**Verificar éxito:**
```sql
SELECT COUNT(*) AS TABLAS_CREADAS
FROM QSYS2.SYSTABLES
WHERE TABLE_SCHEMA = 'JAVIER'
    AND TABLE_NAME IN (
        'CUSTOMER_CREDENTIALS',
        'CUSTOMER_PASSWORDS',
        'REFRESH_TOKENS',
        'LOGIN_ATTEMPTS',
        'SECURITY_AUDIT'
    );

-- Debe devolver: 5 (o más si hay tablas adicionales)
```

---

## Paso 5: Migración de Datos Legacy

### 5.1 Migración SQL Masiva

En IBM ACS Run SQL Scripts:

```sql
-- Ejecutar:
-- backend/database/ibm-i/02_migration_from_legacy.sql

-- Esto copia todos los clientes de DSEDAC.CLI a JAVIER.CUSTOMER_CREDENTIALS
```

**Verificar migración:**
```sql
SELECT * FROM JAVIER.V_MIGRATION_STATS;
```

Deberías ver:
```
METRIC                   | VALUE
-------------------------|-------
TOTAL_CUSTOMERS          | 1250
LEGACY_PASSWORD_COUNT    | 1250  ← Todos empiezan como legacy
MODERN_PASSWORD_COUNT    | 0
```

### 5.2 Hashear Contraseñas con Argon2id

```bash
cd backend
node scripts/hash-legacy-passwords.js
```

Verás output similar a:
```
═══════════════════════════════════════════════════════════
  MIGRACIÓN DE HASHES LEGACY A ARGON2ID
  IBM i Database: TU_DATABASE
═══════════════════════════════════════════════════════════

🔌 Conectando a IBM i...
✅ Conexión establecida

🔄 Iniciando procesamiento de contraseñas legacy...

📊 Total de clientes a procesar: 1250

🔧 Procesando lote 1...
   ✓ Procesados: 10/10
   ✓ Procesados: 20/20
   ...
   ✓ Procesados: 1250/1250

✅ Procesamiento completado!
   Total procesados: 1250
   Exitosos: 1250
   Errores: 0

📝 Registrando auditoría de migración...
✅ Auditoría registrada correctamente

🔍 Verificando migración...

📊 Resultados de verificación:
   Total de clientes legacy: 1250
   Con Argon2id: 1250 ✅
   Aún en legacy: 0 ✅

🎉 ¡Migración 100% completa! Todos los hashes están en Argon2id.

✅ Proceso completado exitosamente
```

---

## Paso 6: Integrar en Backend

### 6.1 Agregar Rutas en server.js

Editar `backend/server.js`:

```javascript
// Importar rutas de autenticación segura
const authSecureRoutes = require('./app/routes/authSecureRoutes');

// Registrar rutas (DESPUÉS de middleware de body-parser, ANTES de otras rutas)
app.use('/api/auth', authSecureRoutes);
```

### 6.2 Verificar que databaseService funciona

Editar `backend/app/services/databaseService.js` para asegurar que tiene método `executeQuery`:

```javascript
async executeQuery(sql, params = []) {
    // Tu implementación con ibm_db
    // Debe devolver un array de resultados
}
```

---

## Paso 7: Integrar en Frontend

### 7.1 Crear directorio de componentes

```bash
mkdir -p frontend/components/auth
```

Los componentes ya están creados:
- `LegacyPasswordWarningModal.tsx`
- `PasswordChangeForm.tsx`
- `PasswordChangeSuccessModal.tsx`

### 7.2 Integrar en Login Page

Ejemplo en `frontend/app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import LegacyPasswordWarningModal from '@/components/auth/LegacyPasswordWarningModal';
import PasswordChangeForm from '@/components/auth/PasswordChangeForm';
import PasswordChangeSuccessModal from '@/components/auth/PasswordChangeSuccessModal';

export default function LoginPage() {
    const [showLegacyModal, setShowLegacyModal] = useState(false);
    const [showChangeForm, setShowChangeForm] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [changeResult, setChangeResult] = useState(null);
    const [customerId, setCustomerId] = useState(null);

    const handleLogin = async (customerCode: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerCode, password })
        });

        const data = await response.json();

        if (data.success) {
            setCustomerId(data.customer.id);

            // Si usa contraseña legacy, mostrar modal INMEDIATAMENTE
            if (data.showPasswordChangeModal) {
                setShowLegacyModal(true);
            } else {
                // Redirigir a dashboard
                window.location.href = '/dashboard';
            }
        }
    };

    return (
        <div>
            {/* Tu formulario de login existente */}

            {/* Modal de advertencia legacy */}
            <LegacyPasswordWarningModal
                isOpen={showLegacyModal}
                onChangeNow={() => {
                    setShowLegacyModal(false);
                    setShowChangeForm(true);
                }}
                onContinue={() => {
                    setShowLegacyModal(false);
                    window.location.href = '/dashboard';
                }}
            />

            {/* Formulario de cambio de contraseña */}
            {showChangeForm && (
                <div className="fixed inset-0 bg-black/60 z-50 overflow-auto">
                    <PasswordChangeForm
                        customerId={customerId}
                        isLegacyPasswordChange={true}
                        onSuccess={(data) => {
                            setChangeResult(data);
                            setShowChangeForm(false);
                            setShowSuccessModal(true);
                        }}
                        onCancel={() => {
                            setShowChangeForm(false);
                            window.location.href = '/dashboard';
                        }}
                    />
                </div>
            )}

            {/* Modal de éxito */}
            <PasswordChangeSuccessModal
                isOpen={showSuccessModal}
                crackTimeDisplay={changeResult?.crackTimeDisplay || ''}
                strengthScore={changeResult?.strengthScore || 4}
                onClose={() => {
                    setShowSuccessModal(false);
                    window.location.href = '/dashboard';
                }}
            />
        </div>
    );
}
```

---

## Paso 8: Pruebas

### 8.1 Prueba de Login Legacy

1. Iniciar backend: `npm run dev` (en backend/)
2. Iniciar frontend: `npm run dev` (en frontend/)
3. Abrir: http://localhost:3000/login

**Credenciales de prueba:**
- Código: 9900
- Contraseña: [El NIF del cliente 9900 en DSEDAC.CLI]

**Resultado esperado:**
- ✅ Login exitoso
- ✅ Modal de advertencia aparece INMEDIATAMENTE
- ✅ Mensaje persuasivo pero no bloqueante
- ✅ Dos opciones: "Cambiar ahora" / "Continuar"

### 8.2 Prueba de Cambio de Contraseña

1. En modal de advertencia, clic "Cambiar ahora"
2. Ingresar contraseña actual (NIF)
3. Ingresar nueva contraseña: `mi-perro-se-llama-firulais-2024`

**Resultado esperado:**
- ✅ Barra de fortaleza se vuelve verde
- ✅ Score: 4/4 (Muy fuerte)
- ✅ Tiempo de crackeo: "miles de millones de años"
- ✅ Check HaveIBeenPwned: ✅ No encontrada
- ✅ Botón "Cambiar contraseña" se habilita

4. Clic "Cambiar contraseña"
5. Modal de confirmación aparece
6. Clic "Sí, cambiar ahora"

**Resultado esperado:**
- ✅ Contraseña cambiada exitosamente
- ✅ Modal de éxito muestra tiempo de crackeo
- ✅ Score 4/4 MUY FUERTE

### 8.3 Prueba de Login con Nueva Contraseña

1. Cerrar sesión
2. Login nuevamente con:
   - Código: 9900
   - Contraseña: `mi-perro-se-llama-firulais-2024`

**Resultado esperado:**
- ✅ Login exitoso
- ✅ Modal de advertencia NO aparece (ya tiene contraseña moderna)
- ✅ Redirige directamente a dashboard

### 8.4 Verificar en Base de Datos

```sql
SELECT
    CUSTOMER_CODE,
    IS_LEGACY_PASSWORD,
    PASSWORD_ALGORITHM,
    LAST_PASSWORD_CHANGE
FROM JAVIER.CUSTOMER_CREDENTIALS
WHERE CUSTOMER_CODE = '9900';
```

**Resultado esperado:**
```
CUSTOMER_CODE | IS_LEGACY_PASSWORD | PASSWORD_ALGORITHM | LAST_PASSWORD_CHANGE
--------------|--------------------|--------------------|---------------------
9900          | 0                  | ARGON2ID          | 2025-01-15 14:30:00
```

---

## Paso 9: Monitoreo Post-Instalación

### 9.1 Dashboard de Migración

```sql
SELECT * FROM JAVIER.V_MIGRATION_STATS;
```

Monitorear diariamente:
- `MODERN_PASSWORD_COUNT` debe aumentar
- `LEGACY_PASSWORD_COUNT` debe disminuir

### 9.2 Eventos de Seguridad

```sql
SELECT
    EVENT_TIME,
    EVENT_TYPE,
    SEVERITY,
    EVENT_DESCRIPTION
FROM JAVIER.SECURITY_AUDIT
WHERE EVENT_TIME >= CURRENT_TIMESTAMP - 24 HOURS
ORDER BY EVENT_TIME DESC;
```

### 9.3 Intentos de Login Fallidos

```sql
SELECT
    CUSTOMER_CODE,
    COUNT(*) AS FAILED_ATTEMPTS,
    MAX(ATTEMPT_TIME) AS LAST_ATTEMPT
FROM JAVIER.LOGIN_ATTEMPTS
WHERE SUCCESS = '0'
    AND ATTEMPT_TIME >= CURRENT_TIMESTAMP - 24 HOURS
GROUP BY CUSTOMER_CODE
HAVING COUNT(*) >= 3
ORDER BY FAILED_ATTEMPTS DESC;
```

---

## Paso 10: Habilitar en Producción

### 10.1 Actualizar Variables de Entorno

```env
NODE_ENV=production
JWT_SECRET=[secreto generado con openssl rand -base64 64]
JWT_REFRESH_SECRET=[otro secreto diferente]
```

### 10.2 Habilitar HTTPS

En `server.js`:

```javascript
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

### 10.3 Habilitar Journaling en IBM i

```bash
# Ejecutar desde línea de comandos IBM i:
STRJRNPF FILE(JAVIER/CUSTOMER_CREDENTIALS) JRN(JAVIER/SECJRN)
STRJRNPF FILE(JAVIER/SECURITY_AUDIT) JRN(JAVIER/SECJRN)
STRJRNPF FILE(JAVIER/CUSTOMER_PASSWORDS) JRN(JAVIER/SECJRN)
STRJRNPF FILE(JAVIER/REFRESH_TOKENS) JRN(JAVIER/SECJRN)
```

### 10.4 Configurar Rate Limiting

En `server.js`:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por IP
    message: 'Demasiados intentos de login. Intente en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', loginLimiter);
```

---

## Troubleshooting

### Problema: "Error al conectar a IBM i"

**Solución:**
1. Verificar que IBM i está accesible: `ping [IP_DEL_SERVIDOR]`
2. Verificar puerto 50000 abierto
3. Verificar credenciales en `.env`
4. Verificar permisos del usuario en schema JAVIER

### Problema: "argon2 no se instala"

**Solución (Windows):**
```bash
npm install --global windows-build-tools
npm install argon2
```

**Solución (Linux/Mac):**
```bash
sudo apt-get install build-essential  # Debian/Ubuntu
brew install gcc  # macOS
npm install argon2
```

### Problema: "Modal no aparece tras login"

**Solución:**
1. Verificar en DevTools Network que `/api/auth/login` devuelve `showPasswordChangeModal: true`
2. Verificar que `IS_LEGACY_PASSWORD = '1'` en DB para ese cliente
3. Verificar que componente `LegacyPasswordWarningModal` está correctamente importado

### Problema: "HaveIBeenPwned devuelve error"

**Solución:**
- Esto es normal si la API está caída
- El sistema NO bloqueará el cambio de contraseña
- Verificar en logs backend: "HaveIBeenPwned API error"
- La validación zxcvbn sigue funcionando

---

## Comandos Útiles

### Backend

```bash
# Instalar dependencias
npm install

# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start

# Ejecutar script de migración
node scripts/hash-legacy-passwords.js

# Ver logs en tiempo real
tail -f logs/security.log
```

### Frontend

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start
```

### Base de Datos

```sql
-- Ver estadísticas de migración
SELECT * FROM JAVIER.V_MIGRATION_STATS;

-- Ver usuarios legacy
SELECT * FROM JAVIER.V_LEGACY_PASSWORD_CUSTOMERS;

-- Ver logins fallidos recientes
SELECT * FROM JAVIER.V_RECENT_FAILED_LOGINS;

-- Desbloquear cuenta manualmente
UPDATE JAVIER.CUSTOMER_CREDENTIALS
SET ACCOUNT_STATUS = 'ACTIVE',
    ACCOUNT_LOCKED_UNTIL = NULL,
    FAILED_LOGIN_ATTEMPTS = 0
WHERE CUSTOMER_CODE = '9900';
```

---

## Soporte

- **Documentación completa:** `docs/SECURITY_ARCHITECTURE.md`
- **Código fuente:**
  - Backend: `backend/app/services/authServiceSecure.js`
  - Frontend: `frontend/components/auth/`
- **Scripts SQL:** `backend/database/ibm-i/`

---

## Checklist de Instalación

- [ ] Dependencias backend instaladas (`argon2`, `zxcvbn`, `jwt`)
- [ ] Dependencias frontend instaladas (`zxcvbn`, `lucide-react`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Tablas creadas en DB2 (`01_create_security_tables.sql`)
- [ ] Migración SQL ejecutada (`02_migration_from_legacy.sql`)
- [ ] Script de hashing ejecutado (`hash-legacy-passwords.js`)
- [ ] Rutas integradas en `server.js`
- [ ] Componentes integrados en login page
- [ ] Pruebas de login legacy exitosas
- [ ] Pruebas de cambio de contraseña exitosas
- [ ] Pruebas de login con nueva contraseña exitosas
- [ ] Monitoreo configurado (queries de auditoría)
- [ ] Rate limiting habilitado (producción)
- [ ] HTTPS habilitado (producción)
- [ ] Journaling habilitado (producción)

---

**¡Listo!** Tu sistema de autenticación de nivel bancario está operativo.
