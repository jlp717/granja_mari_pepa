# 🗺️ Configuración de Google Maps API - Paso a Paso

## 📋 Opción 1: Usando Google Cloud Console (Recomendado - Más Fácil)

### 1. Ve a Google Cloud Console
- Abre tu navegador en: https://console.cloud.google.com/

### 2. Crear un proyecto (si no tienes uno)
- Haz clic en "Select a project" → "New Project"
- Nombre del proyecto: `granja-mari-pepa-maps`
- Haz clic en "Create"

### 3. Habilitar las APIs necesarias
- Ve a: https://console.cloud.google.com/apis/library
- Busca y habilita estas 2 APIs:
  - "Maps JavaScript API"
  - "Places API"

### 4. Crear API Key
- Ve a: https://console.cloud.google.com/apis/credentials
- Haz clic en "CREATE CREDENTIALS" → "API key"
- Copia la API key que aparece

### 5. Configurar restricciones (Opcional pero recomendado)
- Haz clic en el ícono del lápiz junto a tu API key
- En "Application restrictions": selecciona "HTTP referrers"
- Añade: `http://localhost:3001/*` y `https://tudominio.com/*`
- En "API restrictions": selecciona "Restrict key"
- Elige "Maps JavaScript API" y "Places API"
- Guarda los cambios

---

## 🖥️ Opción 2: Usando Comandos (Avanzado)

### 1. Instalar Google Cloud CLI
```powershell
# Descargar e instalar Google Cloud CLI
Invoke-WebRequest -Uri "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe" -OutFile "$env:TEMP\GoogleCloudSDKInstaller.exe"
Start-Process -FilePath "$env:TEMP\GoogleCloudSDKInstaller.exe" -Wait
```

### 2. Reiniciar PowerShell y autenticar
```powershell
# Inicializar y autenticar
gcloud init
gcloud auth login
```

### 3. Crear proyecto y habilitar APIs
```powershell
# Crear proyecto
gcloud projects create granja-mari-pepa-maps --name="Mari Pepa Maps"

# Establecer como proyecto activo
gcloud config set project granja-mari-pepa-maps

# Habilitar las APIs necesarias
gcloud services enable maps-backend.googleapis.com
gcloud services enable places-backend.googleapis.com
gcloud services enable maps-embed-backend.googleapis.com
```

### 4. Crear API key
```powershell
# Crear API key
gcloud alpha services api-keys create --display-name="Maps API Key"

# Listar las API keys para obtener el ID
gcloud alpha services api-keys list

# Configurar restricciones (reemplaza KEY_ID con el ID real)
gcloud alpha services api-keys update KEY_ID --api-target service=maps-backend.googleapis.com --api-target service=places-backend.googleapis.com
```

---

## ⚙️ Configurar en tu proyecto

### 1. Crear archivo de variables de entorno
```powershell
# Ir al directorio frontend
cd "C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\frontend"

# Crear archivo .env.local
New-Item -Path ".env.local" -ItemType File -Force
```

### 2. Añadir la API key al archivo
```env
# En el archivo .env.local, añade esta línea (reemplaza con tu API key real):
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC-TU_API_KEY_AQUI
```

### 3. Reiniciar el servidor de desarrollo
```powershell
# Detener el servidor actual (Ctrl+C) y reiniciar
npm run dev
```

---

## 🚀 Verificación

Una vez configurada la API key:
1. Ve a http://localhost:3001/contacto
2. Deberías ver el mapa de Google Maps funcionando
3. Haz clic en "Lorca" o "Almería" para probar el zoom automático

---

## 💰 Información de Costos - IMPORTANTE

### 🆓 Capa Gratuita (Muy Generosa)
- **Maps JavaScript API**: 28,000 cargas GRATIS/mes
- **Places API**: 2,850 requests GRATIS/mes

### 📊 Para tu proyecto específico:
- **Estimación mensual**: 100-1000 visitantes = $0.00
- **Solo pagas SI superas**: 28,000 visitas/mes (≈930/día)
- **Costo después del límite**: $7 por cada 1,000 cargas extra

### 🛡️ PROTECCIÓN CONTRA GASTOS - BLOQUEO AUTOMÁTICO:
**⚠️ CONFIGURACIÓN OBLIGATORIA PARA CERO GASTOS:**

#### 1. Límites de Quota (CRÍTICO)
- Ve a: https://console.cloud.google.com/iam-admin/quotas
- Busca "Maps JavaScript API"
- Establece: **Requests per day: 500** (muy por debajo del límite gratuito)
- Establece: **Requests per minute: 10**

#### 2. Presupuesto con STOP Automático (ESENCIAL)
- Ve a: https://console.cloud.google.com/billing/budgets
- Crear presupuesto: **$0.01** (un centavo)
- ⚠️ **CRÍTICO**: Activar **"Stop billing when budget exceeded"**
- Alertas: 50%, 90%, 100%

#### 3. Restricciones de API Key
- Ve a: https://console.cloud.google.com/apis/credentials
- En tu API key → "Application restrictions" → añade SOLO tu dominio
- API restrictions → SOLO "Maps JavaScript API"

#### 4. Script de Configuración Automática
```powershell
# Ejecuta este script que te guía paso a paso:
.\setup-zero-cost-protection.ps1
```

### ✅ RESULTADO: 
Con esta configuración, **LA API SE BLOQUEA AUTOMÁTICAMENTE** antes de generar cualquier costo. **IMPOSIBLE gastar dinero**.

---

## 🔒 Seguridad

IMPORTANTE: Una vez que tengas tu API key:
1. NO la compartas públicamente
2. Configura las restricciones de dominio
3. Añade `.env.local` a tu `.gitignore`