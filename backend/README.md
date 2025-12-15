# 🚀 Backend API - Granja Mari Pepa

Sistema de autenticación y gestión de facturas para clientes.

## 📋 Características

- ✅ Autenticación JWT segura
- ✅ Generación de PDFs de facturas
- ✅ Consulta de productos y resúmenes
- ✅ Rate limiting y protección contra ataques
- ✅ Logging completo de operaciones
- ✅ Conexión ODBC a base de datos ERP

## 🛠️ Tecnologías

- Node.js 20+
- Express.js
- ODBC (Conexión a SQL Server/Access)
- JWT para autenticación
- PDFKit para generación de PDFs

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

## 📁 Estructura

```
backend/
├── app/
│   ├── config/         # Configuración (ODBC, etc.)
│   ├── controllers/    # Controladores de rutas
│   ├── middleware/     # Middleware (auth, security, rate limit)
│   ├── routes/         # Definición de rutas
│   ├── services/       # Lógica de negocio
│   └── utils/          # Utilidades (logger, validators)
├── logs/               # Logs de la aplicación
├── data/               # Bases de datos locales
├── server.js           # Punto de entrada
└── package.json
```

## 🔐 Seguridad

- ✅ JWT con expiración configurable
- ✅ Rate limiting por IP
- ✅ Detección de patrones maliciosos (SQLi, XSS)
- ✅ Validación de inputs
- ✅ Headers de seguridad con Helmet
- ✅ CORS configurado
- ✅ Cookies HTTP-Only

## 📡 API Endpoints

### Autenticación

- `POST /api/auth/login` - Login con código de cliente y email
- `POST /api/auth/verify` - Verificar token
- `GET /api/auth/me` - Obtener usuario actual (requiere auth)
- `POST /api/auth/logout` - Logout (requiere auth)

### Facturas

- `GET /api/facturas` - Listar facturas (requiere auth)
- `GET /api/facturas/:serie/:numero/:ejercicio` - Detalle de factura (requiere auth)
- `GET /api/facturas/:serie/:numero/:ejercicio/pdf` - Descargar PDF (requiere auth)
- `GET /api/facturas/resumen` - Resumen de facturación (requiere auth)
- `GET /api/facturas/ejercicios` - Años disponibles (requiere auth)
- `GET /api/facturas/productos` - Productos del cliente (requiere auth)

## 🐛 Bug Fix Importante

### Problema corregido: MIN(SERIEALBARAN) y MIN(NUMEROALBARAN)

**Antes:** Se calculaban independientemente causando combinaciones inexistentes.

**Solución:** CTE con `ROW_NUMBER()` para obtener el primer albarán real de cada factura.

Ver: `app/services/authService.js` - función `getClientInvoices()`

## 📝 Variables de Entorno

```env
JWT_SECRET=tu-clave-secreta
JWT_EXPIRY=24h
DB_PATH=./data/facturas.db
NODE_ENV=production
PORT=5000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🚀 Despliegue

Ver `DEPLOY_PRODUCCION.md` en la raíz del proyecto para instrucciones completas.

## 📞 Soporte

Para problemas o dudas, contacta con el administrador del sistema.
