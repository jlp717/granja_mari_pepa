# 🛡️ Configuración de SEGURIDAD para Google Maps API
# EJECUTA ESTOS COMANDOS DESPUÉS DE CREAR TU API KEY

# 1. ESTABLECER LÍMITES DE QUOTA (OBLIGATORIO)
# Ve a: https://console.cloud.google.com/iam-admin/quotas
# Busca "Maps JavaScript API" y establece límite diario: 1000 requests

# 2. CONFIGURAR RESTRICCIONES DE DOMINIO
# Ve a: https://console.cloud.google.com/apis/credentials
# Haz clic en tu API key → "Application restrictions" → "HTTP referrers"
# Añade SOLO estas URLs:
#   - http://localhost:3001/*
#   - https://tudominio.com/*
#   - https://www.tudominio.com/*

# 3. CREAR ALERTA DE PRESUPUESTO
# Ve a: https://console.cloud.google.com/billing/budgets
# Crear presupuesto: $1.00
# Alerta al 50% y 90% del presupuesto

# 4. CONFIGURAR API RESTRICTIONS
# En tu API key → "API restrictions" → "Restrict key"
# Selecciona SOLO:
#   - Maps JavaScript API
#   - Places API (opcional, solo si usas búsquedas)

Write-Host "✅ CONFIGURACIÓN DE SEGURIDAD COMPLETADA" -ForegroundColor Green
Write-Host "🔒 Tu API key ahora está protegida contra gastos inesperados" -ForegroundColor Yellow
Write-Host "💰 Límite máximo de gasto: $1-2 incluso con mucho tráfico" -ForegroundColor Cyan