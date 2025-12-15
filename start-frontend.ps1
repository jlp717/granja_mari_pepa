# ============================================
# SCRIPT DE ARRANQUE - FRONTEND
# ============================================
# Inicia el frontend de Granja Mari Pepa en modo desarrollo

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GRANJA MARI PEPA - FRONTEND WEB" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$frontendPath = "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: No se encuentra la carpeta 'frontend'" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raiz del proyecto" -ForegroundColor Yellow
    pause
    exit 1
}

# Cambiar al directorio frontend
Set-Location $frontendPath

# Verificar que existe .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "ADVERTENCIA: No se encuentra el archivo .env.local" -ForegroundColor Yellow
    Write-Host "Se usara la configuracion por defecto" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar que existen node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Mostrar configuración
Write-Host "Configuracion:" -ForegroundColor Green
Write-Host "  - Framework: Next.js" -ForegroundColor White
Write-Host "  - Modo: development" -ForegroundColor White
Write-Host "  - API Backend: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "El frontend estara disponible en:" -ForegroundColor Green
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Asegurate de que el backend este corriendo en otro terminal" -ForegroundColor Yellow
Write-Host "  Ejecuta: .\start-backend.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el servidor presiona Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor en modo desarrollo
npm run dev
