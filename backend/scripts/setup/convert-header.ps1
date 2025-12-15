# Script para convertir header.webp a PNG
# Este script convierte el header corporativo de WEBP a PNG para compatibilidad con PDFKit

Write-Host "🔄 Convirtiendo header.webp a PNG..." -ForegroundColor Cyan

# Rutas correctas (desde scripts/setup hacia backend/assets)
$backendRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$inputPath = Join-Path $backendRoot "assets\header.webp"
$outputPath = Join-Path $backendRoot "assets\header.png"

Write-Host "📁 Ruta de entrada: $inputPath" -ForegroundColor Gray
Write-Host "📁 Ruta de salida: $outputPath" -ForegroundColor Gray

if (-not (Test-Path $inputPath)) {
    Write-Host "❌ Error: No se encuentra el archivo header.webp en $inputPath" -ForegroundColor Red
    exit 1
}

try {
    # Opción 1: Intentar con System.Drawing (solo funciona con formatos tradicionales)
    Add-Type -AssemblyName System.Drawing

    $img = [System.Drawing.Image]::FromFile($inputPath)
    $img.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()

    Write-Host "✅ Header convertido exitosamente a PNG" -ForegroundColor Green
    Write-Host "📄 Archivo creado: $outputPath" -ForegroundColor Green

} catch {
    Write-Host "⚠️  System.Drawing no soporta WEBP. Intentando con herramientas externas..." -ForegroundColor Yellow

    # Opción 2: Usar ffmpeg si está disponible
    $ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue

    if ($ffmpegPath) {
        try {
            ffmpeg -i $inputPath $outputPath -y 2>&1 | Out-Null

            if (Test-Path $outputPath) {
                Write-Host "✅ Header convertido exitosamente a PNG usando ffmpeg" -ForegroundColor Green
                Write-Host "📄 Archivo creado: $outputPath" -ForegroundColor Green
            } else {
                throw "ffmpeg no pudo crear el archivo PNG"
            }
        } catch {
            Write-Host "❌ Error con ffmpeg: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Error: No se pudo convertir el archivo WEBP." -ForegroundColor Red
        Write-Host "💡 Solución: Instala ffmpeg o convierte manualmente el archivo a PNG" -ForegroundColor Yellow
        Write-Host "   - Descarga ffmpeg: https://ffmpeg.org/download.html" -ForegroundColor Cyan
        Write-Host "   - O convierte online: https://cloudconvert.com/webp-to-png" -ForegroundColor Cyan
        exit 1
    }
}
