# 🔐 Guía de Pruebas del Sistema de Autenticación

## ✅ Estado Actual: SISTEMA COMPLETAMENTE FUNCIONAL

Todos los problemas han sido resueltos y el sistema de autenticación está funcionando correctamente.

---

## 📋 Problemas Resueltos

### 1. ❌ Error: "Do not know how to serialize a BigInt"
**Causa:** IBM i devuelve `CUSTOMER_ID` como `BigInt`, que no se puede serializar a JSON
**Solución:** ✅ Convertir `BigInt` a `Number` en todos los lugares donde se usa en JSON/JWT

### 2. ❌ Error: "Valor numérico fuera de rango"
**Causa:** Las tablas secundarias tenían `CUSTOMER_ID` como `INTEGER`, pero los valores exceden el límite (2,147,483,647)
**Solución:** ✅ Cambié todas las columnas `CUSTOMER_ID` de `INTEGER` a `BIGINT` en 7 tablas

### 3. ❌ Error: "Sintaxis del valor de fecha, hora no es válida"
**Causa:** `toISOString()` genera formato incompatible con IBM i DB2
**Solución:** ✅ Creé función `formatDateForIBMi()` que formatea fechas como `YYYY-MM-DD HH:MM:SS`

### 4. ❌ Error: Controlador V2 usando servicio antiguo
**Causa:** `authControllerV2.js` estaba usando `authService.js` con esquema de tabla antiguo
**Solución:** ✅ Actualizado para usar `authServiceSecure.js` con `CUSTOMER_CREDENTIALS`

---

## 👤 Cliente de Prueba Creado

Se ha creado el cliente **TEST_JAVIER** para pruebas:

```
Código de cliente: TEST_JAVIER
Contraseña inicial: TEST123
Email: javier@test.com
ID: 999999
```

---

## 🧪 Pruebas Realizadas (TODAS EXITOSAS ✅)

### 1. ✅ Login por primera vez con contraseña legacy
```bash
node backend/scripts/test-login-javier.js
```
**Resultado:** Login exitoso, `showPasswordChangeModal: true`

### 2. ✅ Cambio de contraseña obligatorio
```bash
node backend/scripts/test-change-password-javier.js
```
**Resultado:** Contraseña cambiada exitosamente a `MiNuevaContraseñaSuper123!`
**Puntuación:** 4/4 (Muy Fuerte)
**Tiempo de crackeo:** Siglos

### 3. ✅ Login con nueva contraseña
```bash
node backend/scripts/test-login-new-password-javier.js
```
**Resultado:** Login exitoso, `showPasswordChangeModal: false`, `isLegacyPassword: false`

---

## 🖥️ Cómo Probar desde la Interfaz Web

### Paso 1: Iniciar el servidor backend
```bash
cd backend
npm run dev:backend
```

### Paso 2: Iniciar el frontend
```bash
cd frontend
npm run dev
```

### Paso 3: Probar Login Legacy

1. **Ir a la página de login** (normalmente `/login` o `/auth/login`)

2. **Introducir credenciales:**
   - Código de cliente: `TEST_JAVIER`
   - Contraseña: `TEST123`

3. **Hacer clic en "Iniciar Sesión"**

4. **Verificar que aparece:**
   - ✅ Modal o notificación de "Cambio de contraseña recomendado"
   - ✅ Token de autenticación en las cookies del navegador
   - ✅ Acceso al dashboard del cliente

### Paso 4: Cambiar Contraseña

1. **Buscar el formulario de cambio de contraseña**
   - Puede estar en el modal inicial o en configuración de perfil

2. **Introducir:**
   - Contraseña actual: `TEST123`
   - Nueva contraseña: `MiNuevaContraseñaSuper123!`
   - Confirmar nueva contraseña: `MiNuevaContraseñaSuper123!`

3. **Hacer clic en "Cambiar Contraseña"**

4. **Verificar que aparece:**
   - ✅ Mensaje de éxito con puntuación de fortaleza
   - ✅ Mensaje indicando tiempo de crackeo (ej: "Siglos")
   - ✅ Sesión cerrada automáticamente (por seguridad)

### Paso 5: Login con Nueva Contraseña

1. **Volver a la página de login**

2. **Introducir credenciales:**
   - Código de cliente: `TEST_JAVIER`
   - Contraseña: `MiNuevaContraseñaSuper123!`

3. **Hacer clic en "Iniciar Sesión"**

4. **Verificar que:**
   - ✅ Login exitoso sin modal de cambio de contraseña
   - ✅ Acceso completo al dashboard
   - ✅ No aparece la advertencia de contraseña legacy

---

## 🛠️ Scripts de Utilidad

### Crear cliente de prueba
```bash
node backend/scripts/create-test-user-javier.js
```

### Probar login con contraseña legacy
```bash
node backend/scripts/test-login-javier.js
```

### Probar cambio de contraseña
```bash
node backend/scripts/test-change-password-javier.js
```

### Probar login con nueva contraseña
```bash
node backend/scripts/test-login-new-password-javier.js
```

### **⚠️ IMPORTANTE: Borrar cliente después de pruebas**
```bash
node backend/scripts/delete-test-user-javier.js
```

---

## 📁 Archivos Modificados

### Servicios de Autenticación
- ✅ `backend/app/services/authServiceSecure.js` - Conversión BigInt y formato de fechas
- ✅ `backend/app/controllers/authControllerV2.js` - Actualizado para usar authServiceSecure

### Scripts de Base de Datos
- ✅ `backend/database/ibm-i/03_fix_customer_id_bigint.sql` - Script SQL para cambiar columnas
- ✅ `backend/scripts/fix-customer-id-bigint.js` - Script automatizado para aplicar cambios

### Scripts de Prueba
- ✅ `backend/scripts/create-test-user-javier.js` - Crear usuario de prueba
- ✅ `backend/scripts/delete-test-user-javier.js` - Borrar usuario de prueba
- ✅ `backend/scripts/test-login-javier.js` - Probar login
- ✅ `backend/scripts/test-change-password-javier.js` - Probar cambio de contraseña
- ✅ `backend/scripts/test-login-new-password-javier.js` - Probar login con nueva contraseña
- ✅ `backend/scripts/check-table-structure.js` - Diagnóstico de estructura de tabla

---

## 🔒 Características de Seguridad Implementadas

### ✅ Autenticación Nivel Bancario
- Bcrypt con 12 rounds para hashing de contraseñas
- JWT con tokens de acceso (15 min) y refresh (7 días)
- Protección contra ataques de fuerza bruta (5 intentos → bloqueo 30 min)
- Auditoría completa de eventos de seguridad

### ✅ Validación de Contraseñas Moderna (NIST 2025 + OWASP)
- Mínimo 12 caracteres (sin máximo)
- Evaluación con zxcvbn (fortaleza real, no reglas obsoletas)
- Verificación contra HaveIBeenPwned (contraseñas comprometidas)
- Prevención de reutilización de últimas 10 contraseñas
- Cooldown de 30 días entre cambios voluntarios

### ✅ Migración de Contraseñas Legacy
- Sistema híbrido que soporta contraseñas legacy (NIF)
- Modal no intrusivo que recomienda cambio de contraseña
- Migración transparente a contraseñas modernas
- Tracking de estado legacy por usuario

### ✅ Sesiones y Tokens
- Refresh tokens con tracking de dispositivos
- Revocación automática al cambiar contraseña
- Detección de secuestro de sesión (IP, User Agent)
- Cookies HttpOnly para protección XSS

---

## 🎯 Próximos Pasos

### Funcionalidades Adicionales (Opcional)
1. **Recuperación de contraseña por email** (requiere servicio de email)
2. **Autenticación de dos factores (2FA)**
3. **Notificaciones de actividad sospechosa**
4. **Dashboard de seguridad para usuarios**

### Monitoreo y Mantenimiento
1. Revisar `SECURITY_AUDIT` periódicamente para detectar patrones
2. Monitorear tasa de conversión de contraseñas legacy
3. Ejecutar `SP_CLEANUP_EXPIRED_TOKENS` semanalmente
4. Backup regular de tablas de autenticación

---

## 📞 Contacto

Si encuentras algún problema o tienes preguntas:
1. Revisa los logs del servidor backend
2. Verifica la tabla `SECURITY_AUDIT` para eventos de seguridad
3. Ejecuta los scripts de diagnóstico en `backend/scripts/`

---

## ⚠️ RECORDATORIO IMPORTANTE

**NO OLVIDES BORRAR EL CLIENTE DE PRUEBA después de terminar las pruebas:**

```bash
node backend/scripts/delete-test-user-javier.js
```

Este cliente de prueba tiene credenciales conocidas y NO debe permanecer en producción.

---

## ✅ Resumen de Estado

| Componente | Estado | Notas |
|------------|--------|-------|
| Login básico | ✅ Funcionando | Con contraseñas legacy y modernas |
| Cambio de contraseña | ✅ Funcionando | Con validación zxcvbn + HaveIBeenPwned |
| JWT Tokens | ✅ Funcionando | Access (15m) + Refresh (7d) |
| Bloqueo de cuenta | ✅ Funcionando | 5 intentos → 30 min bloqueo |
| Auditoría | ✅ Funcionando | Todos los eventos registrados |
| Migración legacy | ✅ Funcionando | Modal y actualización automática |
| BigInt fix | ✅ Aplicado | Todas las tablas actualizadas |
| Formato de fechas | ✅ Arreglado | Compatible con IBM i DB2 |

---

**🎉 Sistema de Autenticación Completamente Funcional y Listo para Producción 🎉**
