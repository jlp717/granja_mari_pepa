# ============================================
# SCRIPT DE ARRANQUE COMPLETO
# ============================================
# Inicia backend y frontend de Granja Mari Pepa simultáneamente

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  GRANJA MARI PEPA - SISTEMA COMPLETO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "ERROR: No se encuentran las carpetas backend/frontend" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raiz del proyecto" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Iniciando sistema completo..." -ForegroundColor Green
Write-Host ""
Write-Host "Se abriran 2 ventanas nuevas:" -ForegroundColor Yellow
Write-Host "  1. Backend API (puerto 5000)" -ForegroundColor Cyan
Write-Host "  2. Frontend Web (puerto 3000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Espera unos segundos para que arranquen ambos servicios" -ForegroundColor Yellow
Write-Host ""

# Arrancar backend en nueva ventana
Write-Host "[1/2] Iniciando Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$PWD'; .\start-backend.ps1 }" -WindowStyle Normal

# Esperar 3 segundos para que el backend arranque primero
Start-Sleep -Seconds 3

# Arrancar frontend en nueva ventana
Write-Host "[2/2] Iniciando Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Set-Location '$PWD'; .\start-frontend.ps1 }" -WindowStyle Normal

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  SISTEMA INICIADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Accede a la aplicacion en:" -ForegroundColor Green
Write-Host "  http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Backend disponible en:" -ForegroundColor Green
Write-Host "  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el sistema:" -ForegroundColor Yellow
Write-Host "  1. Ve a cada ventana (backend y frontend)" -ForegroundColor White
Write-Host "  2. Presiona Ctrl+C en cada una" -ForegroundColor White
Write-Host ""
Write-Host "Este script puede cerrarse ahora." -ForegroundColor Gray
Write-Host ""

# Esperar 5 segundos antes de cerrar
Start-Sleep -Seconds 5
