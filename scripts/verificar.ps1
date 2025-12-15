# Script de Verificacion del Sistema
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  VERIFICACION - GRANJA MARI PEPA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar backend/.env
if (Test-Path "backend/.env") {
    Write-Host "[OK] backend/.env encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] backend/.env NO encontrado" -ForegroundColor Red
}

# Verificar frontend/.env.local
if (Test-Path "frontend/.env.local") {
    Write-Host "[OK] frontend/.env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "[ERROR] frontend/.env.local NO encontrado" -ForegroundColor Red
}

# Verificar node_modules backend
if (Test-Path "backend/node_modules") {
    Write-Host "[OK] Dependencias backend instaladas" -ForegroundColor Green
} else {
    Write-Host "[WARN] Dependencias backend NO instaladas" -ForegroundColor Yellow
}

# Verificar node_modules frontend
if (Test-Path "frontend/node_modules") {
    Write-Host "[OK] Dependencias frontend instaladas" -ForegroundColor Green
} else {
    Write-Host "[WARN] Dependencias frontend NO instaladas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Para arrancar el sistema completo:" -ForegroundColor Cyan
Write-Host "  .\start-all.ps1" -ForegroundColor White
Write-Host ""
