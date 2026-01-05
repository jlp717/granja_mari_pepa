# 🔐 Guía de Prueba del Flujo Completo de Autenticación

## ✅ Cambios Implementados

### Frontend:
1. ✅ **store.ts** - Devuelve `showPasswordChangeModal` del login
2. ✅ **AuthFlowManager** - Componente que maneja todo el flujo de modales
3. ✅ **área-clientes/page.tsx** - Integra el flujo de cambio de contraseña
4. ✅ **types.ts** - Agrega `customerId` al UserProfile

### Backend:
1. ✅ **authControllerV2.js** - Devuelve estructura compatible con frontend
2. ✅ **authServiceSecure.js** - Sistema de autenticación nivel bancario funcionando

---

## 🧪 Cómo Probar el Flujo Completo

### Requisitos Previos:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Paso 1: Login con Usuario Legacy (Primera Vez)

1. **Ir a:** http://localhost:3000/area-clientes

2. **Credenciales del usuario de prueba:**
   - Usuario: `TEST_JAVIER`
   - Contraseña: `TEST123`

3. **Hacer clic en "Iniciar Sesión"**

4. **✅ DEBE APARECER:**
   - Toast de "¡Bienvenido! Recomendamos cambiar tu contraseña."
   - Modal naranja/amber: **"Tu cuenta necesita protección"**
   - Dos opciones:
     - **"Cambiar contraseña ahora (Recomendado)"** - Botón verde
     - **"Continuar de momento"** - Botón gris

---

### Paso 2: Continuar Sin Cambiar (Opcional)

Si haces clic en **"Continuar de momento"**:
- ✅ Se cierra el modal
- ✅ Accedes al dashboard normalmente
- ⚠️ **El modal aparecerá de nuevo en el siguiente login** (hasta que cambies la contraseña)

---

### Paso 3: Cambiar Contraseña Ahora (Recomendado)

Si haces clic en **"Cambiar contraseña ahora"**:

1. **Se abre el formulario de cambio de contraseña**

2. **Campos a completar:**
   - **Contraseña actual:** `TEST123` (ya pre-llenada)
   - **Nueva contraseña:** Ingresa una contraseña fuerte, por ejemplo: `MiNuevaContraseñaSuper123!`
   - **Confirmar contraseña:** Repite la misma

3. **✅ Validación en Tiempo Real:**
   - Barra de fortaleza que cambia de color:
     - 🔴 Rojo = Muy débil
     - 🟠 Naranja = Débil
     - 🟡 Amarillo = Aceptable
     - 🔵 Azul = Fuerte
     - 🟢 Verde = Muy fuerte
   - **Tiempo estimado de crackeo** (ej: "Siglos", "decades", etc.)
   - **Check contra HaveIBeenPwned** (si la contraseña está en bases de datos filtradas)
   - **Feedback educativo** con sugerencias

4. **Hacer clic en "Cambiar Contraseña"**

5. **Aparece modal de confirmación:**
   - "¿Estás seguro de que deseas cambiar tu contraseña?"
   - "Esta acción cerrará todas las sesiones en otros dispositivos"
   - Opciones:
     - **"Sí, cambiar contraseña"** - Confirmar
     - **"Cancelar"** - Volver atrás

6. **Confirmar el cambio**

7. **✅ DEBE APARECER Modal de Éxito:**
   - 🎉 "¡Contraseña cambiada exitosamente!"
   - **Puntuación de fortaleza:** 4/4
   - **Tiempo de crackeo:** "Siglos"
   - Lista de beneficios obtenidos:
     - ✅ Protección exponencialmente mayor
     - ✅ Todas las sesiones en otros dispositivos cerradas
     - ✅ Contraseña no comprometida en filtraciones
   - **Consejos de mantenimiento**

8. **Hacer clic en "Entendido"**

9. **Accedes al Dashboard** sin el modal (ya no eres usuario legacy)

---

### Paso 4: Logout y Login con Nueva Contraseña

1. **Hacer logout** (botón en el dashboard)

2. **Volver a login:**
   - Usuario: `TEST_JAVIER`
   - Contraseña: `MiNuevaContraseñaSuper123!` (la nueva)

3. **✅ DEBE SUCEDER:**
   - Login exitoso
   - **NO aparece el modal de cambio de contraseña**
   - Acceso directo al dashboard
   - Toast: "¡Bienvenido! Has iniciado sesión correctamente."

---

### Paso 5: Probar con Cliente Real (⚠️ CUIDADO)

**ADVERTENCIA:** Esto es un cliente REAL, no hagas cambios permanentes sin coordinación.

1. **Usuario:** `4300009900`
2. **Contraseña:** `23224478K` (su NIF)

3. **✅ DEBE APARECER:**
   - Modal de cambio de contraseña (porque es usuario legacy)

4. **⚠️ SI VAS A CAMBIAR LA CONTRASEÑA:**
   - Coordina con el cliente real
   - Usa una contraseña que puedas comunicarle
   - Documenta el cambio

---

## 🔍 Qué Verificar en Cada Paso

### Login Inicial:
- [ ] El backend retorna `showPasswordChangeModal: true` para usuarios legacy
- [ ] El frontend detecta esto y muestra el modal
- [ ] El modal es **persuasivo pero no bloqueante**

### Modal de Advertencia:
- [ ] Diseño atractivo con gradiente naranja/amber
- [ ] Explicación clara de por qué cambiar la contraseña
- [ ] Dos opciones claramente diferenciadas
- [ ] Botón "Cambiar ahora" más destacado (verde)
- [ ] Botón "Continuar" más discreto (gris)

### Formulario de Cambio:
- [ ] Validación en tiempo real funciona
- [ ] Barra de fortaleza se actualiza mientras escribes
- [ ] Tiempo de crackeo se muestra dinámicamente
- [ ] Check contra HaveIBeenPwned funciona (si score >= 3)
- [ ] Feedback educativo aparece según la contraseña
- [ ] Confirmación doble antes de enviar

### Modal de Confirmación:
- [ ] Aparece antes de ejecutar el cambio
- [ ] Explica las consecuencias (cerrar sesiones)
- [ ] Permite cancelar sin consecuencias

### Modal de Éxito:
- [ ] Muestra estadísticas de la nueva contraseña
- [ ] Lista beneficios obtenidos
- [ ] Da consejos de mantenimiento
- [ ] Diseño celebratorio (verde, checkmarks)

### Segundo Login:
- [ ] No aparece el modal (isLegacyPassword: false)
- [ ] Login normal y fluido
- [ ] Acceso directo al dashboard

---

## 🐛 Troubleshooting

### El modal no aparece:
1. Verificar que el backend devuelve `showPasswordChangeModal: true`
2. Verificar en Network tab (F12) la response del `/api/auth/v2/login`
3. Verificar que el usuario tiene `IS_LEGACY_PASSWORD = '1'`

### El cambio de contraseña falla:
1. Ver logs del backend
2. Verificar que `customerId` se está pasando correctamente
3. Verificar que el endpoint `/api/auth/v2/cambiar-password` está disponible

### El modal aparece en loop (siempre):
1. Verificar que el cambio de contraseña actualiza `IS_LEGACY_PASSWORD` a '0'
2. Ver en la base de datos si el flag se actualizó

---

## 📊 Logs a Revisar

### Backend (Terminal 1):
```
✅ Login V2 exitoso { codigoCliente: 'TEST_JAVIER' }
🔐 Cambiar password { customerId: 999999 }
✅ Password cambiado exitosamente { customerId: 999999 }
```

### Frontend (Consola del navegador):
```
Login result: { success: true, showPasswordChangeModal: true, message: "..." }
User stored: { id: "TEST_JAVIER", customerId: 999999, name: "...", ... }
```

---

## ✅ Checklist de Funcionalidad Completa

- [ ] Modal de advertencia aparece para usuarios legacy
- [ ] Modal es persuasivo pero permite continuar
- [ ] Formulario de cambio tiene validación en tiempo real
- [ ] zxcvbn calcula fortaleza correctamente
- [ ] HaveIBeenPwned check funciona
- [ ] Modal de confirmación aparece antes del cambio
- [ ] Cambio se ejecuta correctamente en backend
- [ ] Modal de éxito muestra estadísticas
- [ ] Segundo login NO muestra modal (ya no es legacy)
- [ ] La experiencia es fluida y educativa

---

## 🚀 Próximos Pasos (Pendientes)

1. **Recuperación de contraseña por email**
   - Enviar código de verificación por email
   - Validar código
   - Permitir cambio sin login

2. **Confirmaciones de seguridad adicionales**
   - Para cambios de datos personales
   - Para eliminación de cuenta
   - Para autorizar transacciones críticas

3. **OAuth con Google** (opcional)
   - Permitir login con Google
   - Vincular cuenta de Google con cuenta existente

---

**📝 NOTA:** Este documento será actualizado conforme se implementen las funcionalidades pendientes.
