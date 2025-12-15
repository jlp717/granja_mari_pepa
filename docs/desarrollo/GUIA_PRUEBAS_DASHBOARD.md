# 🧪 GUÍA DE PRUEBAS - ÁREA DE CLIENTES

## ✅ Checklist de pruebas completas

### 1. 🔐 Autenticación

**Prueba de login exitoso:**
```
Cliente: 4300000281
Contraseña: X2731935H
```

- [ ] Login exitoso sin errores
- [ ] Redirección al dashboard del cliente
- [ ] Token almacenado en localStorage
- [ ] Datos del usuario visibles en la UI

**Prueba con otro cliente:**
```
Cliente: 4300000260
Contraseña: [Su NIF correspondiente]
```

- [ ] Login exitoso sin errores
- [ ] Datos diferentes al cliente anterior
- [ ] No hay errores de "undefined"

---

### 2. 📊 Dashboard Principal

**Estadísticas visibles:**
- [ ] Total de facturas (número correcto)
- [ ] Total facturado (suma correcta)
- [ ] Facturas pagadas (contador correcto)
- [ ] Facturas pendientes (contador correcto)

**Pedidos recientes:**
- [ ] Se muestran últimos 3 pedidos
- [ ] Estados correctos (Pagado/Pendiente)
- [ ] Números de pedido visibles
- [ ] Fechas formateadas correctamente

**Comportamiento de carga:**
- [ ] Spinner visible durante carga
- [ ] Datos aparecen sin errores
- [ ] Mensaje claro si no hay datos

---

### 3. 🛍️ Sección de Pedidos

**Vista de lista:**
- [ ] Todos los pedidos se cargan sin errores
- [ ] Información completa: número, fecha, estado, total
- [ ] Estados con colores correctos

**Filtros de pedidos:**
- [ ] Buscar por número de pedido funciona
- [ ] Filtro por estado (Pagado/Pendiente/Todos)
- [ ] Búsqueda en tiempo real

**Comportamiento de carga:**
- [ ] Spinner durante carga
- [ ] "No hay pedidos" si array vacío
- [ ] Sin errores de "undefined"

---

### 4. 🧾 Sección de Facturas

**Vista de tabla:**
- [ ] Todas las facturas cargan sin errores
- [ ] Columnas: Número, Fecha, Serie, Albarán, Estado, Total, Acciones
- [ ] Paginación funciona (si hay muchas)

**Filtros avanzados:**
- [ ] Búsqueda por número de factura
- [ ] Búsqueda por serie
- [ ] Búsqueda por albarán
- [ ] Filtro por estado (pagada/pendiente/todas)
- [ ] Filtro por mes
- [ ] Filtro por año
- [ ] **Rango de fechas personalizado** (fechaDesde - fechaHasta)

**Acciones de factura:**
- [ ] Descargar PDF funciona
- [ ] Ver factura abre vista previa
- [ ] Compartir por WhatsApp abre modal
- [ ] Compartir por Email abre modal

**Comportamiento de carga:**
- [ ] Spinner durante carga
- [ ] "No hay facturas" si array vacío
- [ ] Mensaje descriptivo en caso de error
- [ ] Sin errores de "undefined" o "filter"

---

### 5. 📤 Sistema de compartir facturas

**Modal de compartir:**
- [ ] Se abre al hacer clic en botón WhatsApp
- [ ] Se abre al hacer clic en botón Email
- [ ] Precarga teléfono si está guardado
- [ ] Precarga email si está guardado

**Compartir por WhatsApp:**
- [ ] Genera enlace temporal
- [ ] Abre WhatsApp Web/App
- [ ] Mensaje personalizado incluye enlace al PDF
- [ ] Enlace temporal funciona (válido 24h)
- [ ] Toast de éxito aparece

**Compartir por Email:**
- [ ] Valida formato de email
- [ ] Genera enlace temporal
- [ ] Abre cliente de email
- [ ] Asunto y cuerpo correctos
- [ ] Toast de éxito aparece

---

### 6. 👤 Sección de Perfil

**Datos del cliente:**
- [ ] Código de cliente visible
- [ ] Nombre completo
- [ ] Dirección
- [ ] Teléfono (editable)
- [ ] Email (editable)

**Edición de contacto:**
- [ ] Guardar teléfono actualiza correctamente
- [ ] Guardar email actualiza correctamente
- [ ] Toast de confirmación
- [ ] Campos se bloquean si ya están guardados

---

### 7. ❤️ Sección de Favoritos

**Lista de favoritos:**
- [ ] Productos favoritos se muestran
- [ ] Contador de favoritos correcto
- [ ] Botón "Eliminar" funciona
- [ ] Botón "Añadir al carrito" funciona

---

### 8. 🔍 Búsqueda y Filtros Globales

**Barra de búsqueda:**
- [ ] Búsqueda funciona en Pedidos
- [ ] Búsqueda funciona en Facturas
- [ ] Resultados en tiempo real
- [ ] Sin lag en búsquedas largas (gracias a useMemo)

**Filtros combinados:**
- [ ] Búsqueda + Estado + Fecha funciona
- [ ] Limpiar filtros funciona
- [ ] Contador de resultados correcto

---

### 9. ⚠️ Manejo de errores

**Errores de red:**
- [ ] Error 401 → Logout automático + Toast "Sesión expirada"
- [ ] Error 500 → 3 reintentos automáticos
- [ ] Sin conexión → Toast "Error al conectar con el servidor"
- [ ] Timeout → Mensaje claro al usuario

**Estados inesperados:**
- [ ] Arrays undefined → Inicializado como []
- [ ] Propiedades null → Optional chaining evita crash
- [ ] ErrorBoundary → Página de error amigable (si todo falla)

---

### 10. 🚀 Rendimiento

**Optimizaciones visibles:**
- [ ] Filtrado es instantáneo (incluso con 100+ facturas)
- [ ] Búsqueda no causa lag
- [ ] Cambiar de pestaña es fluido
- [ ] Scroll suave sin retrasos
- [ ] Re-renderizados minimizados (React DevTools)

**Carga paralela:**
- [ ] Facturas y pedidos cargan simultáneamente
- [ ] Dashboard no se bloquea durante carga
- [ ] Spinners independientes por sección

---

### 11. 📱 Responsive Design

**Móvil (< 768px):**
- [ ] Tabla de facturas adaptada
- [ ] Filtros en columna vertical
- [ ] Botones de tamaño táctil
- [ ] Modal de compartir responsive

**Tablet (768px - 1024px):**
- [ ] Layout de 2 columnas en dashboard
- [ ] Tabla de facturas con scroll horizontal
- [ ] Sidebar colapsable

**Desktop (> 1024px):**
- [ ] Todas las columnas visibles
- [ ] Dashboard en 3-4 columnas
- [ ] Tooltips informativos

---

### 12. 🧪 Casos Edge

**Arrays vacíos:**
- [ ] Cliente sin facturas → Mensaje "No hay facturas"
- [ ] Cliente sin pedidos → Mensaje "No hay pedidos"
- [ ] Sin favoritos → Mensaje "No hay favoritos"

**Datos incompletos:**
- [ ] Factura sin fecha → No causa crash
- [ ] Pedido sin estado → Muestra "Pendiente" por defecto
- [ ] Cliente sin email → Campo editable vacío

**Sesión expirada:**
- [ ] Durante carga de facturas → Logout + Toast
- [ ] Durante compartir → Logout + Toast
- [ ] Después de 1 hora → Token refresh o logout

---

## 🎯 Resultado esperado

### ✅ Todo debe funcionar sin errores:
- Sin mensajes de error en consola
- Sin crashes de la aplicación
- Sin "undefined is not an object"
- Sin "cannot read property 'filter' of undefined"

### ⚡ Rendimiento esperado:
- Carga inicial < 2 segundos
- Búsqueda instantánea
- Filtrado instantáneo
- Smooth scroll y animaciones

### 🎨 UX esperado:
- Estados de carga visibles
- Mensajes de error claros
- Feedback inmediato en acciones
- Diseño responsivo y bonito

---

## 🐛 Si encuentras un error

### 1. Verifica la consola del navegador (F12)
- Busca mensajes en rojo
- Copia el error completo

### 2. Verifica la pestaña Network
- ¿El request se completó?
- ¿Qué status code devolvió? (200, 401, 500...)
- ¿Qué datos llegaron?

### 3. Verifica localStorage
- `localStorage.getItem('access_token')` debe existir
- Si no existe → Volver a hacer login

### 4. Verifica logs del backend
- `backend/logs/facturacion-api-YYYY-MM-DD.log`
- Busca errores relacionados con tu request

---

## 📞 Contacto de pruebas

Si todo funciona correctamente, deberías poder:
1. ✅ Iniciar sesión sin problemas
2. ✅ Ver todas tus facturas y pedidos
3. ✅ Buscar y filtrar sin lag
4. ✅ Compartir facturas por WhatsApp
5. ✅ Descargar PDFs de facturas
6. ✅ Editar tu información de contacto
7. ✅ Gestionar favoritos

**¡Todo debería funcionar perfecto!** 🎉
