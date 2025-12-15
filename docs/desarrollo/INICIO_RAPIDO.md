# 🚀 GUÍA DE ARRANQUE RÁPIDO - Granja Mari Pepa

## ⚡ Inicio Rápido (Todo de una vez)

```powershell
# Ejecutar desde la raíz del proyecto
.\start-all.ps1
```

Este script abre **2 ventanas** automáticamente:
- ✅ **Backend** en `http://localhost:5000`
- ✅ **Frontend** en `http://localhost:3000`

---

## 🔧 Inicio Manual (Paso a Paso)

### Opción 1: Con scripts automatizados

#### Terminal 1 - Backend:
```powershell
.\start-backend.ps1
```

#### Terminal 2 - Frontend:
```powershell
.\start-frontend.ps1
```

---

### Opción 2: Método tradicional

#### Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

#### Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```

---

## 📋 Requisitos Previos

Antes de arrancar, asegúrate de tener:

- ✅ **Node.js** v18+ instalado
- ✅ **DSN ODBC "GMP"** configurado (conexión a IBM i en 192.168.1.22)
- ✅ **Archivo `.env`** en carpeta `backend/`
- ✅ **Archivo `.env.local`** en carpeta `frontend/`
- ✅ Dependencias instaladas (`npm install` en ambas carpetas)

---

## 🌐 URLs del Sistema

| Servicio | URL | Puerto |
|----------|-----|--------|
| **Frontend** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:5000 | 5000 |
| **Health Check** | http://localhost:5000/api/health | 5000 |

---

## ⚙️ Configuración de Archivos

### Backend: `backend/.env`
```env
# Base de datos
ODBC_CONNECTION_STRING=DSN=GMP;UID=JAVIER;PWD=JAVIER

# Servidor
PORT=5000
NODE_ENV=development
HOST=0.0.0.0

# JWT Secrets (ya configurados)
JWT_ACCESS_SECRET=cd18f6159bc0ac2fa81749de57bf269e40fd61a65772f6c1599bfbb557168147be110373fbe1cff831d2a1f902c60bd46c2551927725da0d4fd59e58c34bb6d3
JWT_REFRESH_SECRET=62a24b9b3d9d1b171098dc5c247b60c51b2968541ee750f7dabe98f5ef5f23e74f151185a0a100a1bc599758fe0a7e837248df7b220b92da8bbed64f50049258

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# URLs
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend: `frontend/.env.local`
```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDxKpy6isdgfoZQd2-MHgSM2OkJVymaLP4
```

---

## 🛠️ Comandos Útiles

### Backend

```powershell
cd backend

# Arrancar en modo desarrollo (con recarga automática)
npm run dev

# Arrancar en modo producción
npm start

# Ejecutar tests
npm test

# Linter
npm run lint

# Generar nuevos secretos JWT
node generar-secretos-jwt.js
```

### Frontend

```powershell
cd frontend

# Arrancar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Arrancar producción (después de build)
npm start

# Linter
npm run lint
```

---

## 🐛 Troubleshooting

### ❌ Error: "Puerto 5000 ya está en uso"

```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :5000

# Matar el proceso (reemplaza <PID> con el número)
taskkill /PID <PID> /F
```

### ❌ Error: "Cannot connect to database"

Verifica:
1. DSN ODBC "GMP" configurado correctamente
2. IBM i (192.168.1.22) accesible en red
3. Usuario/contraseña correctos en `.env`

```powershell
# Probar conexión
ping 192.168.1.22

# Verificar DSN
Get-OdbcDsn
```

### ❌ Error: "Module not found"

```powershell
# Reinstalar dependencias backend
cd backend
Remove-Item -Recurse -Force node_modules
npm install

# Reinstalar dependencias frontend
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### ❌ Frontend no conecta con Backend

Verifica en `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Y en `backend/.env`:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

---

## 📁 Estructura del Proyecto

```
granja_mari_pepa/
├── backend/              # API Node.js + Express
│   ├── server.js         # Punto de entrada
│   ├── .env              # Configuración (NO COMMITEAR)
│   ├── package.json
│   └── ...
├── frontend/             # Next.js + React
│   ├── app/              # Páginas Next.js
│   ├── components/       # Componentes React
│   ├── .env.local        # Configuración (NO COMMITEAR)
│   ├── package.json
│   └── ...
├── start-all.ps1         # 🚀 Arrancar todo de una vez
├── start-backend.ps1     # Arrancar solo backend
├── start-frontend.ps1    # Arrancar solo frontend
└── INICIO_RAPIDO.md      # Este archivo
```

---

## 📝 Notas Importantes

- 🔒 **Nunca commitear** archivos `.env` o `.env.local` (contienen secretos)
- 🔑 **JWT Secrets** ya están generados y configurados
- 🗄️ **Base de datos** debe estar accesible (IBM i en 192.168.1.22)
- 🌐 **CORS** está configurado para permitir `localhost:3000`

---

## 📚 Documentación Adicional

- **GUIA_CONFIGURACION_SERVIDOR_118.md** - Despliegue en servidor local .118
- **ANALISIS_SERVIDOR_118.md** - Análisis técnico servidor local vs VPS
- **comparativa_servidor_vps.html** - Presentación ejecutiva para gestión

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa esta guía completa
2. Consulta **GUIA_CONFIGURACION_SERVIDOR_118.md** (sección Troubleshooting)
3. Verifica logs en `backend/logs/` y consola de desarrollo

---

**¡Listo! Tu sistema está configurado y listo para desarrollo** 🎉
