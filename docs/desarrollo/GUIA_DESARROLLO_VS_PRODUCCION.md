# Guía: Desarrollo vs Producción

## Resumen

El sistema puede funcionar en dos modos:

| Modo | Variable | Base de datos | Cuándo usarlo |
|------|----------|---------------|---------------|
| **Desarrollo** | `USE_LOCAL_DB=false` | ODBC → IBM i directo | Desarrollar/probar en PC local |
| **Producción** | `USE_LOCAL_DB=true` | SQLite local | Servidor web en Internet |

---

## Modo Desarrollo (ODBC)

Cuando desarrollas en tu PC, usas conexión directa al IBM i:

```bash
# .env en desarrollo
NODE_ENV=development
USE_LOCAL_DB=false
```

Ejecutar:
```bash
cd backend
npm run dev
```

**Ventajas:**
- Datos en tiempo real
- Pruebas con datos reales
- No necesitas sincronización

**Requisitos:**
- DSN "GMP" configurado con ODBC
- PC en la misma red que el IBM i

---

## Modo Producción (SQLite)

En el servidor web de producción, usa base de datos local:

```bash
# .env en producción
NODE_ENV=production
USE_LOCAL_DB=true
SYNC_SECRET_TOKEN=un_token_muy_largo_y_secreto
```

**Ventajas:**
- Máxima seguridad (sin conexión al IBM i)
- Respuesta muy rápida (datos locales)
- Si hackean el servidor, no llegan al IBM i

**Requisitos:**
- Sincronización configurada (script en IBM i)

---

## Cómo cambia el código

El archivo `dataService.js` detecta automáticamente el modo:

```javascript
const USE_LOCAL_DB = process.env.USE_LOCAL_DB === 'true' || process.env.NODE_ENV === 'production';

if (USE_LOCAL_DB) {
  dataSource = require('../config/localDatabase');  // SQLite
} else {
  dataSource = require('../config/odbcConfig');     // ODBC
}
```

**No necesitas cambiar nada en los controladores.** El servicio abstrae la diferencia.

---

## Configurar sincronización (Producción)

### 1. En el servidor web

Crear archivo `.env`:
```bash
NODE_ENV=production
USE_LOCAL_DB=true
SYNC_SECRET_TOKEN=TuTokenSecretoAqui123456789
```

Crear usuario para SFTP (en Linux):
```bash
sudo adduser sync_user
sudo mkdir -p /var/www/granja/backend/data/sync
sudo chown sync_user:sync_user /var/www/granja/backend/data/sync
```

### 2. En el PC con acceso al IBM i

Copiar el script `scripts/exportar-datos.js` a un PC de la oficina.

Editar la configuración:
```javascript
const CONFIG = {
  DSN: 'GMP',  // Tu DSN de ODBC
  SFTP: {
    host: '192.168.1.118',        // IP del servidor web
    username: 'sync_user',
    password: 'la_contraseña'
  },
  SYNC_TOKEN: 'TuTokenSecretoAqui123456789'  // Mismo que en servidor
};
```

Ejecutar:
```bash
npm install odbc ssh2-sftp-client
node exportar-datos.js
```

### 3. Automatizar (opcional)

Crear tarea programada en Windows para ejecutar a las 3 AM:
```batch
cd C:\ruta\al\script
node exportar-datos.js >> sync_log.txt 2>&1
```

---

## Verificar sincronización

### Ver estado de la base de datos local:

```bash
curl http://localhost:5000/api/sync/status \
  -H "X-Sync-Token: TuTokenSecretoAqui123456789"
```

Respuesta:
```json
{
  "status": "ok",
  "database": {
    "clientes": 1234,
    "facturas": 45678,
    "productos": 5000
  },
  "lastSync": "2025-01-15T03:15:00.000Z"
}
```

### Ver log de sincronizaciones:

Consultar tabla `sincronizacion_log` en SQLite:
```sql
SELECT * FROM sincronizacion_log ORDER BY fecha_fin DESC LIMIT 10;
```

---

## Flujo de datos

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│   IBM i     │         │   PC Oficina    │         │ Servidor    │
│  (Datos)    │────────►│  exportar.js    │────────►│ Web         │
│             │  ODBC   │                 │  SFTP   │ (SQLite)    │
└─────────────┘         └─────────────────┘         └─────────────┘
                                                           │
                                                           ▼
                                                    ┌─────────────┐
                                                    │  Clientes   │
                                                    │  (Internet) │
                                                    └─────────────┘
```

**Importante:** El servidor web NUNCA se conecta al IBM i. Solo recibe archivos.

---

## Archivos creados

| Archivo | Función |
|---------|---------|
| `app/config/localDatabase.js` | Configuración SQLite (tablas, queries) |
| `app/services/syncService.js` | Importar JSON a SQLite |
| `app/services/dataService.js` | Abstracción ODBC/SQLite |
| `app/routes/syncRoutes.js` | Endpoints para sincronización |
| `scripts/exportar-datos.js` | Script para exportar desde IBM i |

---

## FAQ

### ¿Qué pasa si un cliente hace un pedido?
Por ahora la web es solo de CONSULTA. Los pedidos se gestionan por teléfono o email. En el futuro se puede implementar sincronización bidireccional.

### ¿Y si los datos están desactualizados?
Máximo 24 horas. Para consultar facturas antiguas, es más que suficiente.

### ¿Puedo forzar una sincronización manual?
Sí, ejecuta el script `exportar-datos.js` cuando quieras.

### ¿Cómo sé si hay errores de sincronización?
Los archivos con errores se mueven a `data/sync/error/`. Revisa ese directorio y el log.
