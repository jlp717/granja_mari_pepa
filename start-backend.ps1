# ============================================
# SCRIPT DE ARRANQUE - BACKEND
# ============================================
# Inicia el backend de Granja Mari Pepa en modo desarrollo

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GRANJA MARI PEPA - BACKEND API" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$backendPath = "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "ERROR: No se encuentra la carpeta 'backend'" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raiz del proyecto" -ForegroundColor Yellow
    pause
    exit 1
}

# Cambiar al directorio backend
Set-Location $backendPath

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: No se encuentra el archivo .env" -ForegroundColor Red
    Write-Host "Copia .env.local118 a .env y configura los valores" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar que existen node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Mostrar configuración
Write-Host "Configuracion:" -ForegroundColor Green
Write-Host "  - Puerto: 5000" -ForegroundColor White
Write-Host "  - Modo: development" -ForegroundColor White
Write-Host "  - Base de datos: IBM i (DSN=GMP)" -ForegroundColor White
Write-Host ""
Write-Host "El backend estara disponible en:" -ForegroundColor Green
Write-Host "  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el servidor presiona Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor en modo desarrollo
npm run dev
