#!/bin/bash
# ============================================
# LOGROTATE CONFIGURATION SCRIPT
# ============================================
# Configura rotación de logs para PM2, Nginx y aplicación
# ============================================

set -euo pipefail

# Crear configuración de logrotate para Mari Pepa
cat > /etc/logrotate.d/mari-pepa << 'EOF'
# Logs de aplicación (PM2)
/var/log/mari-pepa/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 gmp gmp
    sharedscripts
    postrotate
        pm2 reloadLogs 2>/dev/null || true
    endscript
}

# Logs de Nginx para Mari Pepa
/var/log/nginx/mari-pepa-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
EOF

echo "Configuración de logrotate creada en /etc/logrotate.d/mari-pepa"

# Probar configuración
logrotate -d /etc/logrotate.d/mari-pepa 2>/dev/null && echo "Configuración válida" || echo "Warning: verificar configuración"
