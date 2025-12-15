# ============================================
# CONFIGURACION POST-DESPLIEGUE EN .118
# ============================================
# EJECUTAR ESTE SCRIPT EN EL SERVIDOR .118

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION SERVIDOR .118" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el servidor
$hostname = hostname
Write-Host "Configurando en servidor: $hostname" -ForegroundColor Yellow
Write-Host ""

# 1. Verificar Node.js
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js NO instalado" -ForegroundColor Red
    Write-Host "  Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  Instala la version LTS y vuelve a ejecutar este script" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar DSN ODBC
Write-Host "[2/6] Verificando DSN ODBC..." -ForegroundColor Cyan
$dsn = Get-OdbcDsn -Name "GMP" -ErrorAction SilentlyContinue
if ($dsn) {
    Write-Host "  DSN 'GMP' configurado correctamente" -ForegroundColor Green
} else {
    Write-Host "  DSN 'GMP' NO encontrado" -ForegroundColor Red
    Write-Host "  Configura el DSN:" -ForegroundColor Yellow
    Write-Host "    1. Ejecuta: odbcad32.exe" -ForegroundColor White
    Write-Host "    2. DSN de sistema > Agregar" -ForegroundColor White
    Write-Host "    3. iSeries Access ODBC Driver" -ForegroundColor White
    Write-Host "    4. Nombre: GMP" -ForegroundColor White
    Write-Host "    5. Sistema: 192.168.1.22" -ForegroundColor White
    Write-Host "    6. Usuario: JAVIER, Password: JAVIER" -ForegroundColor White
    Write-Host ""
    $respuesta = Read-Host "Presiona Enter cuando hayas configurado el DSN"
}

# 3. Navegar a carpeta del backend
Write-Host "[3/6] Navegando a carpeta del proyecto..." -ForegroundColor Cyan
$rutaBackend = "C:\granja-mari-pepa\backend"
if (-not (Test-Path $rutaBackend)) {
    Write-Host "  ERROR: No se encuentra $rutaBackend" -ForegroundColor Red
    Write-Host "  Asegurate de copiar la carpeta 'backend' al servidor" -ForegroundColor Yellow
    exit 1
}
Set-Location $rutaBackend
Write-Host "  Ubicado en: $rutaBackend" -ForegroundColor Green

# 4. Instalar dependencias
Write-Host "[4/6] Instalando dependencias npm..." -ForegroundColor Cyan
npm install
Write-Host "  Dependencias instaladas" -ForegroundColor Green

# 5. Instalar PM2 globalmente
Write-Host "[5/6] Instalando PM2..." -ForegroundColor Cyan
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Installed) {
    npm install -g pm2
    npm install -g pm2-windows-service
    Write-Host "  PM2 instalado" -ForegroundColor Green
} else {
    Write-Host "  PM2 ya esta instalado" -ForegroundColor Green
}

# 6. Configurar firewall
Write-Host "[6/6] Configurando firewall para puerto 5000..." -ForegroundColor Cyan
$regla = Get-NetFirewallRule -DisplayName "Granja Mari Pepa API" -ErrorAction SilentlyContinue
if (-not $regla) {
    New-NetFirewallRule -DisplayName "Granja Mari Pepa API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
    Write-Host "  Firewall configurado" -ForegroundColor Green
} else {
    Write-Host "  Firewall ya configurado" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Siguiente paso: Arrancar el backend" -ForegroundColor Yellow
Write-Host "  pm2 start server.js --name granja-mari-pepa-api" -ForegroundColor Cyan
Write-Host "  pm2 save" -ForegroundColor Cyan
Write-Host "  pm2 startup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para instalar como servicio de Windows:" -ForegroundColor Yellow
Write-Host "  pm2-service-install -n PM2Service" -ForegroundColor Cyan
Write-Host ""
