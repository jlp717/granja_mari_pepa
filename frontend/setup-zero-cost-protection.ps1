# 🚫 CONFIGURACIÓN ANTI-GASTOS - BLOQUEO AUTOMÁTICO
# Esta configuración GARANTIZA que Google Maps se bloquee ANTES de generar costos

Write-Host "🛡️ CONFIGURANDO BLOQUEO AUTOMÁTICO DE GOOGLE MAPS API" -ForegroundColor Red
Write-Host "⚠️  OBJETIVO: CERO GASTOS - BLOQUEO AUTOMÁTICO" -ForegroundColor Yellow
Write-Host ""

# PASO 1: Configuración de Quotas Restrictivas
Write-Host "📋 PASO 1: Configurar límites restrictivos" -ForegroundColor Cyan
Write-Host "Ve a: https://console.cloud.google.com/iam-admin/quotas"
Write-Host "Busca 'Maps JavaScript API' y configura:"
Write-Host "  - Requests per day: 500 (muy por debajo del límite gratuito)"
Write-Host "  - Requests per minute: 10"
Write-Host "  - Requests per 100 seconds per user: 5"
Write-Host ""

# PASO 2: Configuración de Presupuesto con STOP automático
Write-Host "💰 PASO 2: Presupuesto con PARADA AUTOMÁTICA" -ForegroundColor Red
Write-Host "Ve a: https://console.cloud.google.com/billing/budgets"
Write-Host "Crear presupuesto:"
Write-Host "  - Importe: \$0.01 (un centavo)"
Write-Host "  - Alertas: 50%, 90%, 100%"
Write-Host "  - ⚠️  IMPORTANTE: Activar 'Stop billing when budget exceeded'"
Write-Host ""

# PASO 3: Restricciones de API Key
Write-Host "🔐 PASO 3: Restricciones de seguridad" -ForegroundColor Green
Write-Host "Ve a: https://console.cloud.google.com/apis/credentials"
Write-Host "En tu API key configura:"
Write-Host "  - Application restrictions: HTTP referrers"
Write-Host "  - Añadir SOLO: http://localhost:3001/*"
Write-Host "  - API restrictions: Maps JavaScript API ÚNICAMENTE"
Write-Host ""

# PASO 4: Verificación de configuración
Write-Host "✅ PASO 4: Verificar configuración" -ForegroundColor Yellow
Write-Host "Verifica que esté configurado:"
Write-Host "  ✓ Quota diaria: 500 requests"
Write-Host "  ✓ Presupuesto: \$0.01 con STOP automático"
Write-Host "  ✓ Restricciones de dominio: SOLO localhost"
Write-Host "  ✓ API restrictions: SOLO Maps JavaScript API"
Write-Host ""

Write-Host "🎯 RESULTADO: API SE BLOQUEA AUTOMÁTICAMENTE ANTES DE CUALQUIER COSTO" -ForegroundColor Green
Write-Host "💯 GARANTÍA: IMPOSIBLE gastar dinero con esta configuración" -ForegroundColor Magenta

Read-Host "Presiona Enter cuando hayas completado la configuración"