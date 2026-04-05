#!/bin/bash
# ================================================================
# WATCHDOG AUTÓNOMO - MARI PEPA SELF-HEALING
# ================================================================
# Este script se ejecuta cada 2 minutos via cron.
# 
# ¿Qué hace?
# 1. Verifica que el backend responda (HTTP /health)
# 2. Verifica que la DB esté accesible (HTTP 503 = DB caída)
# 3. Verifica que el frontend responda
# 4. Si algo falla → reinicia automáticamente el proceso con PM2
# 5. Si el túnel no funciona → lo reinicia
#
# Instalación (ejecutar UNA vez):
#   chmod +x /var/www/mari-pepa/deploy/monitoring/watchdog.sh
#   crontab -e
#   Añadir: */2 * * * * /var/www/mari-pepa/deploy/monitoring/watchdog.sh >> /var/log/mari-pepa/watchdog.log 2>&1
# ================================================================

LOG_FILE="/var/log/mari-pepa/watchdog.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Limitar tamaño del log (mantener últimas 500 líneas)
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) -gt 1000 ]; then
    tail -500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

log() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

# ─── CHECK BACKEND ────────────────────────────────────────────────
check_backend() {
    # Timeout de 10 segundos. Si el /health retorna 503 = DB caída
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 http://localhost:5000/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        return 0  # OK
    else
        log "⚠️  Backend responde HTTP $HTTP_CODE (esperado: 200)"
        return 1  # FALLO
    fi
}

# ─── CHECK FRONTEND ───────────────────────────────────────────────
check_frontend() {
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 http://localhost:3001 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
        return 0  # OK
    else
        log "⚠️  Frontend responde HTTP $HTTP_CODE (esperado: 200/302/307/308)"
        return 1  # FALLO
    fi
}

# ─── CHECK TUNNEL ─────────────────────────────────────────────────
check_tunnel() {
    # Verificar que el proceso del túnel existe en PM2
    PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    apps = json.load(sys.stdin)
    for app in apps:
        if 'tunnel' in app['name'].lower() and 'mari' in app['name'].lower():
            print(app['pm2_env']['status'])
            sys.exit(0)
    print('not_found')
except:
    print('error')
" 2>/dev/null || echo "error")

    if [ "$PM2_STATUS" = "online" ]; then
        return 0
    else
        log "⚠️  Túnel status: $PM2_STATUS"
        return 1
    fi
}

# ─── RESTART FUNCTIONS ────────────────────────────────────────────
restart_backend() {
    log "🔄 REINICIANDO Backend..."
    pm2 restart mari-pepa-backend --update-env 2>/dev/null
    sleep 5
    # Verificar que arranque
    if check_backend; then
        log "✅ Backend reiniciado con éxito"
    else
        log "❌ Backend sigue fallando tras reinicio"
    fi
}

restart_frontend() {
    log "🔄 REINICIANDO Frontend..."
    pm2 restart mari-pepa-frontend 2>/dev/null
    sleep 5
    if check_frontend; then
        log "✅ Frontend reiniciado con éxito"
    else
        log "❌ Frontend sigue fallando tras reinicio"
    fi
}

restart_tunnel() {
    log "🔄 REINICIANDO Túnel..."
    pm2 restart mari-pepa-tunnel 2>/dev/null
    sleep 3
    if check_tunnel; then
        log "✅ Túnel reiniciado con éxito"
    else
        log "❌ Túnel sigue fallando tras reinicio"
    fi
}

# ─── MAIN ─────────────────────────────────────────────────────────

ISSUES=0

# 1. Backend
if ! check_backend; then
    ((ISSUES++))
    restart_backend
fi

# 2. Frontend
if ! check_frontend; then
    ((ISSUES++))
    restart_frontend
fi

# 3. Túnel
if ! check_tunnel; then
    ((ISSUES++))
    restart_tunnel
fi

# Resultado
if [ $ISSUES -eq 0 ]; then
    log "✅ Watchdog: Todo OK"
else
    log "🔧 Watchdog: Se reiniciaron $ISSUES servicios"
fi

exit 0
