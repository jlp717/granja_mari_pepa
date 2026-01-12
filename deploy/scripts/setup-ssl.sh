#!/bin/bash
# ============================================
# SSL SETUP SCRIPT - LET'S ENCRYPT
# ============================================
# Configura certificados SSL con Certbot
# y renovación automática
# ============================================

set -euo pipefail

DOMAIN="mari-pepa.com"
EMAIL="${1:-admin@mari-pepa.com}"

echo "============================================"
echo "🔒 SSL SETUP - $DOMAIN"
echo "============================================"

# Verificar que Certbot esté instalado
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Verificar que Nginx está corriendo
if ! systemctl is-active --quiet nginx; then
    echo "Error: Nginx no está corriendo"
    exit 1
fi

# Verificar DNS
echo "Verificando DNS para $DOMAIN..."
RESOLVED_IP=$(dig +short $DOMAIN | head -1)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo "⚠️  Warning: DNS apunta a $RESOLVED_IP pero servidor es $SERVER_IP"
    echo "   Asegúrate de que el DNS esté configurado correctamente"
    read -p "¿Continuar de todos modos? (y/N): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 1
    fi
fi

# Obtener certificado
echo "Obteniendo certificado SSL..."
certbot --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --redirect

# Verificar renovación automática
echo "Verificando renovación automática..."
certbot renew --dry-run

# Crear timer de systemd para renovación (más robusto que cron)
cat > /etc/systemd/system/certbot-renewal.timer << 'EOF'
[Unit]
Description=Certbot SSL Renewal Timer

[Timer]
OnCalendar=*-*-* 03:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

cat > /etc/systemd/system/certbot-renewal.service << 'EOF'
[Unit]
Description=Certbot SSL Renewal
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
EOF

systemctl daemon-reload
systemctl enable certbot-renewal.timer
systemctl start certbot-renewal.timer

echo ""
echo "============================================"
echo "✅ SSL configurado exitosamente"
echo "============================================"
echo "Certificado: /etc/letsencrypt/live/$DOMAIN/"
echo "Renovación automática: activada (03:00 AM diario)"
echo "============================================"
