#!/bin/bash
# ============================================
# MONITORING HEALTH CHECK SCRIPT
# ============================================
# Script para monitoreo continuo de salud
# Puede ejecutarse via cron cada minuto
# ============================================

set -euo pipefail

# Configuración
BACKEND_URL="http://localhost:5000/health"
FRONTEND_URL="http://localhost:3001"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_ALERT="${EMAIL_ALERT:-}"
LOG_FILE="/var/log/mari-pepa/health-check.log"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
    echo "[$TIMESTAMP] $1" >> $LOG_FILE
}

send_alert() {
    local MESSAGE="$1"
    
    # Slack webhook (si está configurado)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Mari Pepa Alert: $MESSAGE\"}" \
            "$SLACK_WEBHOOK" > /dev/null || true
    fi
    
    # Email (si está configurado)
    if [ -n "$EMAIL_ALERT" ]; then
        echo "$MESSAGE" | mail -s "🚨 Mari Pepa Alert" "$EMAIL_ALERT" 2>/dev/null || true
    fi
    
    log "ALERT: $MESSAGE"
}

check_backend() {
    local STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 $BACKEND_URL 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        log "Backend: OK"
        return 0
    else
        log "Backend: FAILED (HTTP $STATUS)"
        return 1
    fi
}

check_frontend() {
    local STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 $FRONTEND_URL 2>/dev/null || echo "000")
    
    if [ "$STATUS" = "200" ]; then
        log "Frontend: OK"
        return 0
    else
        log "Frontend: FAILED (HTTP $STATUS)"
        return 1
    fi
}

check_pm2() {
    local PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[].pm2_env.status' 2>/dev/null || echo "error")
    
    if echo "$PM2_STATUS" | grep -q "stopped\|errored"; then
        log "PM2: Some processes not running"
        return 1
    else
        log "PM2: All processes online"
        return 0
    fi
}

check_disk() {
    local USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
    
    if [ "$USAGE" -gt 90 ]; then
        log "Disk: WARNING - ${USAGE}% used"
        return 1
    else
        log "Disk: OK - ${USAGE}% used"
        return 0
    fi
}

check_memory() {
    local USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
    
    if [ "$USAGE" -gt 90 ]; then
        log "Memory: WARNING - ${USAGE}% used"
        return 1
    else
        log "Memory: OK - ${USAGE}% used"
        return 0
    fi
}

# Main
main() {
    local ERRORS=0
    
    check_backend || ((ERRORS++))
    check_frontend || ((ERRORS++))
    check_pm2 || ((ERRORS++))
    check_disk || ((ERRORS++))
    check_memory || ((ERRORS++))
    
    if [ $ERRORS -gt 0 ]; then
        send_alert "Health check failed: $ERRORS issues detected. Check logs: $LOG_FILE"
        exit 1
    fi
    
    exit 0
}

main
