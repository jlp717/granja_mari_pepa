# ============================================
# SCRIPT DE DESPLIEGUE EN SERVIDOR .118
# ============================================
# Copia y configura el backend en el servidor 192.168.1.118

param(
    [string]$ServidorIP = "192.168.1.118",
    [string]$Usuario = "Administrador",
    [string]$RutaDestino = "C:\inetpub\granja-mari-pepa"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE EN SERVIDOR .118" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "ERROR: Ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "Configuracion:" -ForegroundColor Yellow
Write-Host "  Servidor: $ServidorIP" -ForegroundColor White
Write-Host "  Usuario: $Usuario" -ForegroundColor White
Write-Host "  Ruta destino: $RutaDestino" -ForegroundColor White
Write-Host ""

# Opción 1: Usando carpeta compartida de red
Write-Host "OPCION 1: Copiar via carpeta compartida" -ForegroundColor Cyan
Write-Host "  1. Crea una carpeta compartida en el servidor .118" -ForegroundColor White
Write-Host "  2. Asigna permisos de escritura" -ForegroundColor White
Write-Host "  3. Ejecuta:" -ForegroundColor White
Write-Host "     Copy-Item -Path .\backend -Destination \\192.168.1.118\compartida\granja-mari-pepa -Recurse" -ForegroundColor Gray
Write-Host ""

# Opción 2: Usando PowerShell Remoting
Write-Host "OPCION 2: PowerShell Remoting" -ForegroundColor Cyan
Write-Host "  1. En el servidor .118, habilita PSRemoting:" -ForegroundColor White
Write-Host "     Enable-PSRemoting -Force" -ForegroundColor Gray
Write-Host "  2. Desde tu PC, copia archivos:" -ForegroundColor White
Write-Host "     `$sesion = New-PSSession -ComputerName 192.168.1.118 -Credential (Get-Credential)" -ForegroundColor Gray
Write-Host "     Copy-Item -Path .\backend -Destination C:\granja-mari-pepa -ToSession `$sesion -Recurse" -ForegroundColor Gray
Write-Host ""

# Opción 3: Usando Escritorio Remoto
Write-Host "OPCION 3: Escritorio Remoto (RDP)" -ForegroundColor Cyan
Write-Host "  1. Conecta al servidor via Escritorio Remoto:" -ForegroundColor White
Write-Host "     mstsc /v:192.168.1.118" -ForegroundColor Gray
Write-Host "  2. Copia la carpeta 'backend' manualmente" -ForegroundColor White
Write-Host "  3. Pega en C:\granja-mari-pepa" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Despues de copiar los archivos, continua con:" -ForegroundColor Yellow
Write-Host "  .\configurar-servidor-118.ps1" -ForegroundColor Cyan
Write-Host ""
