#!/bin/bash

###############################################################################
# SCRIPT DE INSTALACIÓN PARA DIRECTADMIN - MARI PEPA API
# Este script instala Node.js y el backend en un servidor DirectAdmin
###############################################################################

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

echo "=================================================="
echo "🚀 INSTALACIÓN MARI PEPA API - DIRECTADMIN"
echo "=================================================="
echo ""

###############################################################################
# 1. VERIFICAR SISTEMA
###############################################################################

print_info "Verificando sistema operativo..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    print_success "Sistema: $NAME $VERSION"
else
    print_error "No se pudo detectar el sistema operativo"
    exit 1
fi

###############################################################################
# 2. INSTALAR NODE.JS (si no está instalado)
###############################################################################

print_info "Verificando Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js ya está instalado: $NODE_VERSION"
else
    print_info "Instalando Node.js..."
    
    # Instalar NodeSource repository (Node.js 20.x)
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - 2>/dev/null || \
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
    
    # Instalar Node.js
    if command -v yum &> /dev/null; then
        sudo yum install -y nodejs
    elif command -v apt-get &> /dev/null; then
        sudo apt-get install -y nodejs
    else
        print_error "Gestor de paquetes no soportado"
        exit 1
    fi
    
    print_success "Node.js instalado: $(node --version)"
fi

###############################################################################
# 3. INSTALAR PM2 (Process Manager)
###############################################################################

print_info "Verificando PM2..."

if command -v pm2 &> /dev/null; then
    print_success "PM2 ya está instalado"
else
    print_info "Instalando PM2..."
    sudo npm install -g pm2
    print_success "PM2 instalado"
fi

###############################################################################
# 4. CREAR DIRECTORIO PARA LA APLICACIÓN
###############################################################################

print_info "Creando directorios..."

APP_DIR="$HOME/mari-pepa-api"
LOGS_DIR="$APP_DIR/logs"

mkdir -p "$APP_DIR"
mkdir -p "$LOGS_DIR"

print_success "Directorio creado: $APP_DIR"

###############################################################################
# 5. CLONAR REPOSITORIO
###############################################################################

print_info "Clonando repositorio..."

if [ -d "$APP_DIR/backend" ]; then
    print_info "El directorio ya existe, actualizando..."
    cd "$APP_DIR/backend"
    git pull origin main
else
    cd "$APP_DIR"
    git clone https://github.com/jlp717/granja_mari_pepa.git .
    print_success "Repositorio clonado"
fi

###############################################################################
# 6. INSTALAR DEPENDENCIAS
###############################################################################

print_info "Instalando dependencias de Node.js..."

cd "$APP_DIR/backend"
npm install --production

print_success "Dependencias instaladas"

###############################################################################
# 7. CONFIGURAR VARIABLES DE ENTORNO
###############################################################################

print_info "Configurando variables de entorno..."

if [ ! -f "$APP_DIR/backend/.env" ]; then
    if [ -f "$APP_DIR/backend/.env.production" ]; then
        cp "$APP_DIR/backend/.env.production" "$APP_DIR/backend/.env"
        print_info "Archivo .env creado desde .env.production"
    else
        print_error "No se encontró .env.production"
        exit 1
    fi
fi

# Generar JWT secrets si no existen
print_info "Verificando JWT secrets..."

if ! grep -q "JWT_ACCESS_SECRET=.........................." "$APP_DIR/backend/.env"; then
    JWT_ACCESS=$(openssl rand -hex 64)
    JWT_REFRESH=$(openssl rand -hex 64)
    
    sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$JWT_ACCESS/" "$APP_DIR/backend/.env"
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH/" "$APP_DIR/backend/.env"
    
    print_success "JWT secrets generados"
else
    print_success "JWT secrets ya configurados"
fi

print_success "Variables de entorno configuradas"

###############################################################################
# 8. CONFIGURAR PM2
###############################################################################

print_info "Configurando PM2..."

# Crear archivo de configuración PM2
cat > "$APP_DIR/backend/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: 'mari-pepa-api',
    script: './server.js',
    cwd: '$APP_DIR/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '$LOGS_DIR/error.log',
    out_file: '$LOGS_DIR/output.log',
    log_file: '$LOGS_DIR/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

print_success "Configuración PM2 creada"

###############################################################################
# 9. INICIAR APLICACIÓN
###############################################################################

print_info "Iniciando aplicación con PM2..."

cd "$APP_DIR/backend"

# Detener si ya está corriendo
pm2 delete mari-pepa-api 2>/dev/null || true

# Iniciar aplicación
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Configurar PM2 para inicio automático
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || print_info "PM2 startup ya configurado"

print_success "Aplicación iniciada"

###############################################################################
# 10. VERIFICAR INSTALACIÓN
###############################################################################

print_info "Verificando instalación..."
sleep 5

if curl -s http://localhost:5000/health > /dev/null; then
    print_success "API respondiendo correctamente en http://localhost:5000"
    
    # Mostrar respuesta de health
    echo ""
    echo "Respuesta de /health:"
    curl -s http://localhost:5000/health | python -m json.tool 2>/dev/null || curl -s http://localhost:5000/health
    echo ""
else
    print_error "La API no está respondiendo"
    print_info "Revisa los logs con: pm2 logs mari-pepa-api"
    exit 1
fi

###############################################################################
# 11. CONFIGURAR LITESPEED/NGINX PROXY
###############################################################################

print_info "Configurando proxy reverso..."

PROXY_CONFIG="$HOME/.htaccess-api"

cat > "$PROXY_CONFIG" <<'EOF'
# Proxy reverso para Mari Pepa API
RewriteEngine On
RewriteCond %{HTTP_HOST} ^api\.mari-pepa\.com$ [NC]
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# Headers de seguridad
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
EOF

print_success "Configuración de proxy creada en: $PROXY_CONFIG"
print_info "Copia este archivo a la raíz del dominio api.mari-pepa.com"

###############################################################################
# RESUMEN FINAL
###############################################################################

echo ""
echo "=================================================="
echo "✅ INSTALACIÓN COMPLETADA"
echo "=================================================="
echo ""
echo "📋 INFORMACIÓN:"
echo "   • Directorio: $APP_DIR/backend"
echo "   • Logs: $LOGS_DIR"
echo "   • Puerto: 5000"
echo "   • Proceso: mari-pepa-api (PM2)"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   • Ver status:    pm2 status"
echo "   • Ver logs:      pm2 logs mari-pepa-api"
echo "   • Reiniciar:     pm2 restart mari-pepa-api"
echo "   • Detener:       pm2 stop mari-pepa-api"
echo "   • Ver métricas:  pm2 monit"
echo ""
echo "🌐 PRÓXIMOS PASOS:"
echo "   1. Configurar el dominio api.mari-pepa.com en DirectAdmin"
echo "   2. Copiar $PROXY_CONFIG a la raíz de api.mari-pepa.com"
echo "   3. Habilitar SSL para api.mari-pepa.com (Let's Encrypt)"
echo "   4. Verificar: https://api.mari-pepa.com/health"
echo ""
echo "=================================================="

# Mostrar PM2 status
pm2 status
