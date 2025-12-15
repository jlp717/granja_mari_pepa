# Script para convertir header.webp a PNG
Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path $PSScriptRoot "assets\header.webp"
$outputPath = Join-Path $PSScriptRoot "assets\header.png"

try {
    $img = [System.Drawing.Image]::FromFile($inputPath)
    $img.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Host "✓ Header convertido exitosamente a PNG" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}
