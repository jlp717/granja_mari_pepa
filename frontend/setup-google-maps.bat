@echo off
echo ========================================
echo   🗺️ CONFIGURACION GOOGLE MAPS API
echo   🚫 CON PROTECCIÓN ANTI-GASTOS
echo ========================================
echo.
echo ⚠️ IMPORTANTE: Esta configuración BLOQUEA automáticamente 
echo    la API antes de generar cualquier costo
echo.
echo 📋 PASOS A SEGUIR:
echo.
echo 1. Ve a: https://console.cloud.google.com/
echo 2. Crea un nuevo proyecto (o selecciona uno existente)
echo 3. Ve a "APIs & Services" ^> "Library"
echo 4. Busca y habilita: "Maps JavaScript API"
echo 5. Ve a "APIs & Services" ^> "Credentials"
echo 6. Haz clic en "CREATE CREDENTIALS" ^> "API key"
echo 7. Copia la API key que aparece
echo.
echo ========================================
echo.
set /p api_key="🔑 Pega tu API key aquí: "
echo.
echo NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=%api_key%> .env.local
echo.
echo ✅ API key configurada en .env.local
echo.
echo ⚠️ ¡IMPORTANTE! Ahora DEBES configurar protección anti-gastos:
echo    Ejecuta: .\setup-zero-cost-protection.ps1
echo.
echo 🚀 Después reinicia el servidor: npm run dev
echo.
pause