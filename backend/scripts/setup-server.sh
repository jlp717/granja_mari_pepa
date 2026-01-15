#!/bin/bash

# ===================================
# SCRIPT DE INSTALACIÓN INICIAL
# ===================================
# Este script configura TODO lo necesario en el servidor
# Solo se ejecuta UNA VEZ

set -e  # Detener si hay error

echo "🚀 INSTALACIÓN DE MARI PEPA API - INICIO"
echo "========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ===================================
# 1. ACTUALIZAR SISTEMA
# ===================================
echo -e "${YELLOW}📦 Actualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y

# ===================================
# 2. INSTALAR DEPENDENCIAS
# ===================================
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"

# Docker
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker ya instalado"
fi

# Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose ya instalado"
fi

# NGINX
if ! command -v nginx &> /dev/null; then
    echo "Instalando NGINX..."
    sudo apt install -y nginx
else
    echo "✅ NGINX ya instalado"
fi

# Certbot para SSL
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot ya instalado"
fi

# Git
if ! command -v git &> /dev/null; then
    echo "Instalando Git..."
    sudo apt install -y git
else
    echo "✅ Git ya instalado"
fi

# ===================================
# 3. CREAR DIRECTORIOS
# ===================================
echo -e "${YELLOW}📁 Creando estructura de directorios...${NC}"
sudo mkdir -p /opt/mari-pepa
sudo mkdir -p /var/log/mari-pepa
sudo mkdir -p /var/www/certbot

# Dar permisos al usuario actual
sudo chown -R $USER:$USER /opt/mari-pepa
sudo chown -R $USER:$USER /var/log/mari-pepa

# ===================================
# 4. CLONAR REPOSITORIO
# ===================================
echo -e "${YELLOW}📥 Clonando repositorio...${NC}"
if [ ! -d "/opt/mari-pepa/.git" ]; then
    cd /opt
    git clone https://github.com/jlp717/granja_mari_pepa.git mari-pepa
    cd mari-pepa/backend
else
    echo "✅ Repositorio ya clonado"
    cd /opt/mari-pepa
    git pull origin main
    cd backend
fi

# ===================================
# 5. CONFIGURAR VARIABLES DE ENTORNO
# ===================================
echo -e "${YELLOW}⚙️  Configurando variables de entorno...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ ERROR: Falta archivo .env.production${NC}"
    echo ""
    echo "Por favor, crea el archivo .env.production con:"
    echo "  - Credenciales de la base de datos"
    echo "  - Secretos JWT (generar con: openssl rand -hex 64)"
    echo "  - Configuración SMTP"
    echo ""
    echo "Usa .env.production como plantilla"
    exit 1
else
    echo "✅ Archivo .env.production encontrado"
fi

# Generar secretos JWT si están vacíos
if grep -q "CAMBIAR_EN_PRODUCCION" .env.production; then
    echo -e "${YELLOW}🔑 Generando secretos JWT...${NC}"
    JWT_ACCESS=$(openssl rand -hex 64)
    JWT_REFRESH=$(openssl rand -hex 64)
    
    sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$JWT_ACCESS/" .env.production
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH/" .env.production
    
    echo "✅ Secretos JWT generados"
fi

# ===================================
# 6. CONFIGURAR NGINX
# ===================================
echo -e "${YELLOW}🌐 Configurando NGINX...${NC}"

# Generar DH params (seguridad SSL)
if [ ! -f "/etc/nginx/dhparam.pem" ]; then
    echo "Generando parámetros Diffie-Hellman (puede tardar varios minutos)..."
    sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048
fi

# Copiar configuración de NGINX
sudo cp nginx/api.mari-pepa.com.conf /etc/nginx/sites-available/api.mari-pepa.com

# Crear enlace simbólico
if [ ! -L "/etc/nginx/sites-enabled/api.mari-pepa.com" ]; then
    sudo ln -s /etc/nginx/sites-available/api.mari-pepa.com /etc/nginx/sites-enabled/
fi

# Eliminar sitio por defecto
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Verificar configuración
sudo nginx -t

# ===================================
# 7. OBTENER CERTIFICADO SSL
# ===================================
echo -e "${YELLOW}🔒 Obteniendo certificado SSL...${NC}"
echo ""
echo "IMPORTANTE: Asegúrate de que:"
echo "  1. El dominio api.mari-pepa.com apunta a la IP de este servidor"
echo "  2. Los puertos 80 y 443 están abiertos en el firewall"
echo ""
read -p "¿Continuar con la obtención del certificado SSL? (s/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    sudo certbot --nginx -d api.mari-pepa.com --non-interactive --agree-tos --email pedidos@mari-pepa.com
    
    # Configurar renovación automática
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    echo "✅ Certificado SSL obtenido y renovación automática configurada"
else
    echo "⚠️  Certificado SSL omitido. Deberás obtenerlo manualmente después."
fi

# ===================================
# 8. CONFIGURAR FIREWALL
# ===================================
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw --force enable
    echo "✅ Firewall configurado"
else
    echo "⚠️  UFW no disponible, configurar firewall manualmente"
fi

# ===================================
# 9. INICIAR SERVICIOS
# ===================================
echo -e "${YELLOW}🚀 Iniciando servicios...${NC}"

# Construir imagen Docker
echo "Construyendo imagen Docker..."
docker-compose build

# Iniciar contenedor
echo "Iniciando contenedor..."
docker-compose up -d

# Esperar a que el servicio esté listo
echo "Esperando a que el servicio esté listo..."
sleep 10

# Verificar health check
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servicio funcionando correctamente${NC}"
else
    echo -e "${RED}❌ Error: El servicio no responde${NC}"
    echo "Ver logs con: docker-compose logs"
    exit 1
fi

# Reiniciar NGINX
sudo systemctl restart nginx

# ===================================
# 10. CONFIGURAR LOGS ROTATION
# ===================================
echo -e "${YELLOW}📝 Configurando rotación de logs...${NC}"
sudo tee /etc/logrotate.d/mari-pepa-api > /dev/null <<EOF
/opt/mari-pepa/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
    postrotate
        docker-compose -f /opt/mari-pepa/backend/docker-compose.yml restart > /dev/null 2>&1 || true
    endscript
}
EOF

echo "✅ Rotación de logs configurada"

# ===================================
# 11. CREAR SCRIPT DE ACTUALIZACIÓN
# ===================================
echo -e "${YELLOW}📦 Creando script de actualización...${NC}"
cat > /opt/mari-pepa/backend/update.sh <<'EOF'
#!/bin/bash
set -e

echo "🔄 Actualizando Mari Pepa API..."

cd /opt/mari-pepa
git pull origin main
cd backend

# Reconstruir imagen si cambió el Dockerfile
docker-compose build

# Actualizar contenedor (sin downtime)
docker-compose up -d

# Verificar
sleep 5
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Actualización completada"
else
    echo "❌ Error en actualización"
    exit 1
fi
EOF

chmod +x /opt/mari-pepa/backend/update.sh
echo "✅ Script de actualización creado en /opt/mari-pepa/backend/update.sh"

# ===================================
# 12. RESUMEN FINAL
# ===================================
echo ""
echo "========================================="
echo -e "${GREEN}✅ INSTALACIÓN COMPLETADA${NC}"
echo "========================================="
echo ""
echo "📊 ESTADO DE SERVICIOS:"
echo "  - Backend API: http://localhost:5000"
echo "  - NGINX: Configurado para api.mari-pepa.com"
echo "  - Docker: $(docker --version)"
echo "  - SSL: $(if [ -d "/etc/letsencrypt/live/api.mari-pepa.com" ]; then echo "✅ Configurado"; else echo "⚠️ Pendiente"; fi)"
echo ""
echo "📝 COMANDOS ÚTILES:"
echo "  Ver logs:           docker-compose logs -f"
echo "  Reiniciar:          docker-compose restart"
echo "  Detener:            docker-compose down"
echo "  Actualizar:         ./update.sh"
echo "  Estado:             docker-compose ps"
echo ""
echo "🌐 PRÓXIMOS PASOS:"
echo "  1. Verificar que api.mari-pepa.com funciona:"
echo "     curl https://api.mari-pepa.com/health"
echo ""
echo "  2. Actualizar frontend para apuntar a:"
echo "     NEXT_PUBLIC_API_URL=https://api.mari-pepa.com/api"
echo ""
echo "  3. Probar login desde el frontend"
echo ""
echo -e "${GREEN}¡Todo listo! 🎉${NC}"
