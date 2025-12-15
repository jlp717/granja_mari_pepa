# 🖥️ GUÍA DE CONFIGURACIÓN - SERVIDOR LOCAL .118

## 📋 Índice

1. [Visión General](#visión-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación en Windows Server](#instalación-en-windows-server)
4. [Instalación en Linux](#instalación-en-linux)
5. [Configuración del Backend](#configuración-del-backend)
6. [Configuración de Red](#configuración-de-red)
7. [Configuración de Seguridad](#configuración-de-seguridad)
8. [Pruebas y Verificación](#pruebas-y-verificación)
9. [Mantenimiento y Monitoreo](#mantenimiento-y-monitoreo)
10. [Troubleshooting](#troubleshooting)

---

## 1. Visión General

### Arquitectura del Sistema

```
Internet
    │
    ├─── Router (Puerto 5000 → 192.168.1.118:5000)
    │
    └─── Red Local (192.168.1.x)
            │
            ├─── Servidor .118 (Backend Node.js)
            │      └─── Puerto 5000
            │
            ├─── IBM i (.22) (Base de datos)
            │      └─── ODBC DSN: GMP
            │
            └─── Clientes (Acceso interno)
```

### Especificaciones Técnicas

| Componente | Detalles |
|------------|----------|
| **Servidor** | 192.168.1.118 |
| **Puerto Backend** | 5000 |
| **Base de Datos** | IBM i en 192.168.1.22 (ODBC) |
| **Runtime** | Node.js v18+ |
| **Sistema Operativo** | Windows Server / Linux |
| **Acceso Externo** | DuckDNS + Port Forwarding (opcional) |

---

## 2. Requisitos Previos

### 2.1 Software Necesario

#### Windows Server:
```powershell
# Verificar versión de Windows
winver

# Debe ser: Windows Server 2016+ o Windows 10/11 Pro
```

#### Componentes a instalar:
1. **Node.js v18 LTS o superior**
   - Descargar desde: https://nodejs.org/
   - Verificar instalación:
   ```powershell
   node --version
   npm --version
   ```

2. **IBM i Access Client Solutions**
   - Necesario para driver ODBC
   - Descargar desde IBM o contactar con soporte

3. **Git** (opcional, para control de versiones)
   - Descargar desde: https://git-scm.com/

4. **PM2** (gestor de procesos Node.js)
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-service
   ```

### 2.2 Verificar Conectividad

```powershell
# Verificar conexión a IBM i
ping 192.168.1.22

# Verificar puerto ODBC (normalmente 8471)
Test-NetConnection -ComputerName 192.168.1.22 -Port 8471

# Verificar que el puerto 5000 no esté en uso
netstat -ano | findstr :5000
```

---

## 3. Instalación en Windows Server

### 3.1 Configurar ODBC para IBM i

#### Paso 1: Abrir Administrador de ODBC
```powershell
# Abrir ODBC Data Source Administrator (64-bit)
odbcad32.exe
```

#### Paso 2: Crear DSN de Sistema
1. Ir a pestaña "**DSN de sistema**"
2. Clic en "**Agregar...**"
3. Seleccionar "**iSeries Access ODBC Driver**"
4. Configurar:
   - **Nombre del origen de datos**: `GMP`
   - **Sistema**: `192.168.1.22`
   - **Usuario**: `JAVIER`
   - **Contraseña**: `JAVIER`
5. Clic en "**Probar conexión**" → debe ser exitoso

#### Paso 3: Verificar DSN desde PowerShell
```powershell
# Listar DSN configurados
Get-OdbcDsn

# Probar conexión
$connectionString = "DSN=GMP;UID=JAVIER;PWD=JAVIER"
# (La verificación completa se hace desde Node.js)
```

### 3.2 Preparar el Backend

#### Paso 1: Copiar código del backend
```powershell
# Navegar a la carpeta del proyecto
cd C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\backend

# Copiar archivos al servidor .118
# Si estás trabajando directamente en .118, ya los tienes
```

#### Paso 2: Instalar dependencias
```powershell
# Instalar todas las dependencias de Node.js
npm install

# Verificar que odbc se instaló correctamente
npm list odbc
```

#### Paso 3: Configurar variables de entorno
```powershell
# Copiar el archivo de configuración local
Copy-Item .env.local118 .env

# Editar si es necesario
notepad .env
```

**Contenido clave de `.env`:**
```env
# Base de datos
ODBC_CONNECTION_STRING=DSN=GMP;UID=JAVIER;PWD=JAVIER

# Servidor
PORT=5000
HOST=0.0.0.0
NODE_ENV=production

# URLs base
BASE_URL=http://192.168.1.118:5000
FRONTEND_URL=http://192.168.1.118:3000

# CORS (agregar dominios permitidos)
CORS_ORIGIN=http://192.168.1.118:3000,http://localhost:3000
```

#### Paso 4: Generar secretos JWT (IMPORTANTE)
```powershell
# Ejecutar Node.js para generar secretos seguros
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copiar el resultado y pegarlo en JWT_ACCESS_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copiar el resultado y pegarlo en JWT_REFRESH_SECRET
```

**Actualizar en `.env`:**
```env
JWT_ACCESS_SECRET=<tu_secreto_generado_1>
JWT_REFRESH_SECRET=<tu_secreto_generado_2>
```

### 3.3 Crear Servicio de Windows con PM2

#### Paso 1: Configurar PM2
```powershell
# Navegar a la carpeta del backend
cd C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\backend

# Iniciar aplicación con PM2
pm2 start server.js --name "granja-mari-pepa-api"

# Guardar la configuración
pm2 save

# Instalar servicio de Windows
pm2-service-install -n PM2Service

# Configurar para que arranque automáticamente
pm2 startup
```

#### Paso 2: Verificar que el servicio está corriendo
```powershell
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs granja-mari-pepa-api

# Ver logs de errores
pm2 logs granja-mari-pepa-api --err

# Información detallada
pm2 info granja-mari-pepa-api
```

### 3.4 Comandos Útiles de PM2

```powershell
# Reiniciar aplicación
pm2 restart granja-mari-pepa-api

# Detener aplicación
pm2 stop granja-mari-pepa-api

# Recargar sin downtime
pm2 reload granja-mari-pepa-api

# Eliminar de PM2
pm2 delete granja-mari-pepa-api

# Ver consumo de CPU/memoria
pm2 monit
```

---

## 4. Instalación en Linux

### 4.1 Instalar Node.js (Ubuntu/Debian)

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 4.2 Instalar Driver ODBC para IBM i

```bash
# Instalar unixODBC
sudo apt install -y unixodbc unixodbc-dev

# Descargar e instalar IBM i Access Client Solutions
# (Contactar con IBM o soporte para obtener el paquete)

# Configurar DSN en /etc/odbc.ini
sudo nano /etc/odbc.ini
```

**Contenido de `/etc/odbc.ini`:**
```ini
[GMP]
Description = IBM i Database
Driver = IBM i Access ODBC Driver
System = 192.168.1.22
UserID = JAVIER
Password = JAVIER
Naming = 0
DefaultLibraries = GMPDTA
```

### 4.3 Configurar Backend en Linux

```bash
# Clonar o copiar el proyecto
cd /opt
sudo git clone <tu_repositorio> granja-mari-pepa
cd granja-mari-pepa/backend

# Instalar dependencias
npm install

# Copiar configuración
cp .env.local118 .env

# Generar secretos JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Actualizar JWT_ACCESS_SECRET

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Actualizar JWT_REFRESH_SECRET

# Editar .env
nano .env
```

### 4.4 Crear Servicio Systemd (Linux)

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/granja-mari-pepa.service
```

**Contenido del servicio:**
```ini
[Unit]
Description=Granja Mari Pepa API Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/granja-mari-pepa/backend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=granja-mari-pepa

[Install]
WantedBy=multi-user.target
```

**Activar y arrancar el servicio:**
```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable granja-mari-pepa

# Iniciar servicio
sudo systemctl start granja-mari-pepa

# Ver estado
sudo systemctl status granja-mari-pepa

# Ver logs
sudo journalctl -u granja-mari-pepa -f
```

---

## 5. Configuración del Backend

### 5.1 Estructura de Directorios

```
backend/
├── server.js                 # Punto de entrada
├── package.json              # Dependencias
├── .env                      # Configuración (NO COMMITEAR)
├── .env.local118            # Plantilla para servidor .118
├── .env.production          # Plantilla para VPS
├── logs/                    # Logs de aplicación
│   ├── combined.log
│   └── error.log
├── routes/                  # Rutas de API
│   ├── auth.routes.js
│   ├── clientes.routes.js
│   ├── facturas.routes.js
│   ├── productos.routes.js
│   └── ...
├── middleware/              # Middleware
│   ├── auth.middleware.js
│   ├── rateLimiter.js
│   └── ...
└── utils/                   # Utilidades
    ├── odbc.js
    ├── pdfGenerator.js
    └── ...
```

### 5.2 Verificar Configuración ODBC

```javascript
// test-odbc-connection.js
const odbc = require('odbc');

async function testConnection() {
    try {
        const connectionString = 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
        console.log('Conectando a IBM i...');
        
        const connection = await odbc.connect(connectionString);
        console.log('✓ Conexión exitosa');
        
        const result = await connection.query('SELECT * FROM GMPDTA.CLI FETCH FIRST 5 ROWS ONLY');
        console.log('✓ Consulta exitosa:', result.length, 'registros');
        console.log('Primer registro:', result[0]);
        
        await connection.close();
        console.log('✓ Conexión cerrada correctamente');
    } catch (error) {
        console.error('✗ Error:', error);
    }
}

testConnection();
```

**Ejecutar test:**
```powershell
node test-odbc-connection.js
```

### 5.3 Verificar que el Backend Arranca

```powershell
# Arrancar en modo desarrollo (ver errores en consola)
npm run dev

# Si todo OK, debería mostrar:
# [INFO] Servidor corriendo en http://0.0.0.0:5000
# [INFO] ODBC pool inicializado
# [INFO] Conexión a base de datos verificada
```

---

## 6. Configuración de Red

### 6.1 Configurar Firewall de Windows

```powershell
# Abrir puerto 5000 para conexiones entrantes
New-NetFirewallRule -DisplayName "Granja Mari Pepa API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Verificar regla creada
Get-NetFirewallRule -DisplayName "Granja Mari Pepa API"

# Opcional: Restringir a red local solamente
New-NetFirewallRule -DisplayName "Granja Mari Pepa API (LAN Only)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -RemoteAddress 192.168.1.0/24
```

### 6.2 Configurar Port Forwarding en Router

#### Para acceso desde Internet (opcional):

1. **Acceder al router** (normalmente http://192.168.1.1)
2. Buscar sección "**Port Forwarding**" o "**NAT**"
3. Crear nueva regla:
   - **Puerto externo**: `5000` (o el que prefieras)
   - **Puerto interno**: `5000`
   - **IP destino**: `192.168.1.118`
   - **Protocolo**: `TCP`
4. Guardar cambios
5. **Importante**: Anotar tu IP pública actual
   ```powershell
   # Ver IP pública
   Invoke-RestMethod -Uri "https://api.ipify.org"
   ```

### 6.3 Configurar DNS Dinámico (DuckDNS)

#### Paso 1: Registrarse en DuckDNS
1. Ir a https://www.duckdns.org/
2. Iniciar sesión con cuenta de Google/GitHub
3. Crear un subdominio: `maripepapi.duckdns.org`
4. Copiar tu **token** (ej: `a7c4d0b5-6e03-40b1-83d7-4e5b03c5d24f`)

#### Paso 2: Crear script de actualización (Windows)

```powershell
# Crear script update-duckdns.ps1
@"
`$domain = "maripepapi"
`$token = "TU_TOKEN_AQUI"
`$url = "https://www.duckdns.org/update?domains=`$domain&token=`$token&ip="

Invoke-RestMethod -Uri `$url
"@ | Out-File -FilePath "C:\Scripts\update-duckdns.ps1"

# Probar el script
powershell -File "C:\Scripts\update-duckdns.ps1"
```

#### Paso 3: Programar Tarea (Task Scheduler)

```powershell
# Crear tarea programada que ejecute cada 5 minutos
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\Scripts\update-duckdns.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "DuckDNS Updater" -Action $action -Trigger $trigger -Principal $principal -Settings $settings
```

#### Paso 4: Actualizar `.env` con nuevo dominio

```env
BASE_URL=https://maripepapi.duckdns.org
```

---

## 7. Configuración de Seguridad

### 7.1 SSL/TLS Certificates

#### Opción A: Let's Encrypt (requiere dominio público)

Si configuraste DuckDNS y port forwarding:

```powershell
# Instalar Certbot
choco install certbot

# Obtener certificado
certbot certonly --standalone -d maripepapi.duckdns.org
```

#### Opción B: Certificado Auto-firmado (desarrollo/testing)

```powershell
# Generar certificado auto-firmado
$cert = New-SelfSignedCertificate -DnsName "192.168.1.118" -CertStoreLocation "Cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(2)

# Exportar certificado
$password = ConvertTo-SecureString -String "TuPassword123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "C:\certs\granja-mari-pepa.pfx" -Password $password
```

**Configurar en `server.js`:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
    pfx: fs.readFileSync('C:/certs/granja-mari-pepa.pfx'),
    passphrase: 'TuPassword123'
};

https.createServer(options, app).listen(5000, () => {
    console.log('HTTPS server running on port 5000');
});
```

### 7.2 Configurar Variables de Entorno Seguras

**NO** guardar contraseñas en `.env` sin cifrar en producción.

```powershell
# Usar Windows Credential Manager
cmdkey /add:GRANJA_ODBC_PWD /user:JAVIER /pass:JAVIER

# Leer desde Node.js
const { exec } = require('child_process');
exec('cmdkey /list:GRANJA_ODBC_PWD', (error, stdout) => {
    // Procesar contraseña
});
```

### 7.3 Rate Limiting y Protección

Ya configurado en `.env`:
```env
RATE_LIMIT_WINDOW_MS=60000          # 1 minuto
RATE_LIMIT_MAX_REQUESTS=100         # 100 requests por minuto
LOGIN_RATE_LIMIT=5                  # 5 intentos de login
LOGIN_RATE_WINDOW=900000            # 15 minutos
```

---

## 8. Pruebas y Verificación

### 8.1 Test de Conectividad Local

```powershell
# Test básico
Invoke-RestMethod -Uri "http://192.168.1.118:5000/api/health" -Method GET

# Debería devolver:
# {
#   "status": "ok",
#   "timestamp": "2025-01-21T10:30:00.000Z",
#   "database": "connected"
# }
```

### 8.2 Test de Autenticación

```powershell
# Login de prueba
$body = @{
    username = "admin"
    password = "tu_password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://192.168.1.118:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

# Ver token
$response.token
```

### 8.3 Test de Endpoints Principales

```powershell
# Listar clientes (requiere autenticación)
$headers = @{
    "Authorization" = "Bearer $($response.token)"
}

Invoke-RestMethod -Uri "http://192.168.1.118:5000/api/clientes" -Headers $headers -Method GET
```

### 8.4 Test desde Red Externa (si configuraste port forwarding)

```powershell
# Desde otro dispositivo fuera de tu red
curl https://maripepapi.duckdns.org/api/health
```

### 8.5 Checklist de Verificación

- [ ] Node.js instalado y corriendo
- [ ] DSN ODBC configurado y probado
- [ ] Backend arranca sin errores
- [ ] Puerto 5000 abierto en firewall
- [ ] Conexión a IBM i funcional
- [ ] JWT secrets generados y configurados
- [ ] PM2/Systemd configurado para inicio automático
- [ ] Logs accesibles y sin errores críticos
- [ ] Endpoint `/api/health` responde OK
- [ ] Login funcional
- [ ] CORS configurado correctamente
- [ ] (Opcional) Port forwarding configurado
- [ ] (Opcional) DuckDNS actualizado
- [ ] (Opcional) SSL configurado

---

## 9. Mantenimiento y Monitoreo

### 9.1 Ver Logs

#### Windows (PM2):
```powershell
# Logs en tiempo real
pm2 logs granja-mari-pepa-api

# Últimas 100 líneas
pm2 logs granja-mari-pepa-api --lines 100

# Solo errores
pm2 logs granja-mari-pepa-api --err

# Limpiar logs antiguos
pm2 flush
```

#### Linux (Systemd):
```bash
# Logs en tiempo real
sudo journalctl -u granja-mari-pepa -f

# Últimas 100 líneas
sudo journalctl -u granja-mari-pepa -n 100

# Solo errores
sudo journalctl -u granja-mari-pepa -p err
```

#### Archivos de log:
```powershell
# Ver logs de aplicación
Get-Content C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\backend\logs\combined.log -Tail 50

# Ver errores
Get-Content C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\backend\logs\error.log -Tail 50
```

### 9.2 Monitoreo de Recursos

```powershell
# Ver uso de CPU/Memoria del proceso Node
pm2 monit

# Información detallada
pm2 info granja-mari-pepa-api

# Performance
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object ProcessName, CPU, WS
```

### 9.3 Backup de Base de Datos

```sql
-- Crear backup de tablas críticas (ejecutar desde IBM i)
SAVLIB LIB(GMPDTA) DEV(*SAVF) SAVF(QGPL/GMPDTA) UPDHST(*YES)

-- Copiar SAVF a PC para backup externo
-- Usar FTP o IBM i Access Client Solutions
```

### 9.4 Rotación de Logs

Ya configurado en `.env`:
```env
LOG_FILE_MAX_SIZE=20m    # 20 MB por archivo
LOG_FILE_MAX_FILES=14d   # Mantener 14 días
```

---

## 10. Troubleshooting

### 10.1 Problemas Comunes

#### ❌ Error: "Cannot find module 'odbc'"
```powershell
# Reinstalar módulo ODBC
npm install odbc --build-from-source

# Si falla, instalar Windows Build Tools
npm install --global windows-build-tools
npm install odbc --build-from-source
```

#### ❌ Error: "ODBC connection failed"
```powershell
# Verificar DSN
Get-OdbcDsn

# Probar conexión desde ODBC Administrator
odbcad32.exe
# → DSN de sistema → GMP → Configurar → Probar conexión

# Verificar que IBM i está accesible
ping 192.168.1.22
Test-NetConnection -ComputerName 192.168.1.22 -Port 8471
```

#### ❌ Error: "Port 5000 already in use"
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :5000

# Matar proceso (reemplazar <PID> con el número del proceso)
taskkill /PID <PID> /F

# O cambiar puerto en .env
# PORT=5001
```

#### ❌ Error: "JWT secret not configured"
```powershell
# Generar nuevos secretos
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Actualizar en .env
notepad .env
```

#### ❌ Frontend no puede conectar con Backend
```powershell
# Verificar CORS en .env
# CORS_ORIGIN debe incluir la URL del frontend

# Verificar firewall
Test-NetConnection -ComputerName 192.168.1.118 -Port 5000

# Ver logs del backend
pm2 logs granja-mari-pepa-api --err
```

### 10.2 Comandos de Diagnóstico

```powershell
# Ver estado completo del sistema
pm2 status
pm2 info granja-mari-pepa-api
pm2 describe 0

# Ver configuración de red
ipconfig /all
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Mari Pepa*"}

# Test de conectividad
Test-NetConnection -ComputerName 192.168.1.118 -Port 5000
Test-NetConnection -ComputerName 192.168.1.22 -Port 8471

# Ver procesos Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Reiniciar servicio PM2 (Windows)
Restart-Service PM2Service
```

### 10.3 Logs de Auditoría

```powershell
# Ver quién ha accedido al sistema (desde logs de aplicación)
Select-String -Path "C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\backend\logs\combined.log" -Pattern "login" | Select-Object -Last 20

# Ver errores de autenticación
Select-String -Path "C:\Users\Javier\Desktop\Repositorios\granja_mari_pepa\backend\logs\error.log" -Pattern "auth" | Select-Object -Last 20
```

---

## 📞 Soporte y Contacto

### Documentación Relacionada
- **ANALISIS_SERVIDOR_118.md** - Análisis objetivo de servidor local vs VPS
- **comparativa_servidor_vps.html** - Presentación ejecutiva para gestión
- **GUIA_DESPLIEGUE_DIRECTADMIN.md** - Guía para despliegue en VPS

### Recursos Externos
- **Node.js**: https://nodejs.org/docs
- **PM2**: https://pm2.keymetrics.io/docs
- **IBM i ODBC**: https://www.ibm.com/docs/en/i/
- **DuckDNS**: https://www.duckdns.org/spec.jsp

---

## ✅ Lista Final de Verificación

Antes de dar por finalizada la configuración:

- [ ] **Instalación completada** - Node.js, ODBC, PM2 instalados
- [ ] **DSN ODBC funcional** - Conexión a IBM i exitosa
- [ ] **Backend arrancado** - PM2/Systemd corriendo sin errores
- [ ] **Firewall configurado** - Puerto 5000 abierto
- [ ] **Secretos JWT generados** - Valores seguros en `.env`
- [ ] **Logs funcionando** - Archivos en `/logs` generándose
- [ ] **Health check OK** - `/api/health` responde correctamente
- [ ] **Autenticación probada** - Login funcional
- [ ] **CORS configurado** - Frontend puede conectar
- [ ] **Inicio automático** - Servicio se inicia al arrancar Windows/Linux
- [ ] **Monitoreo activo** - PM2 monit o systemd status sin errores
- [ ] **(Opcional) Port forwarding** - Acceso desde Internet configurado
- [ ] **(Opcional) DNS dinámico** - DuckDNS actualizado
- [ ] **(Opcional) SSL** - Certificado instalado

---

**¡Configuración del Servidor .118 completada!** 🎉

Recuerda: Este servidor es ideal para **desarrollo y pruebas**. Para producción, considera migrar a un VPS con las ventajas de disponibilidad y seguridad explicadas en `comparativa_servidor_vps.html`.
