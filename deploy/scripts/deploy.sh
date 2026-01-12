#!/bin/bash
# ============================================
# SCRIPT DE DESPLIEGUE - GRANJA MARI PEPA
# ============================================
# Script profesional de despliegue con:
# - Verificación de requisitos
# - Backup automático antes de deploy
# - Instalación de dependencias
# - Build de producción
# - Validación de configuración
# - Health checks post-deploy
# - Rollback automático en caso de fallo
# ============================================

set -euo pipefail

# ============================================
# CONFIGURACIÓN
# ============================================
PROJECT_NAME="mari-pepa"
PROJECT_DIR="/var/www/mari-pepa"
REPO_URL="https://github.com/jlp717/granja_mari_pepa.git"
BRANCH="main"
LOG_DIR="/var/log/mari-pepa"
BACKUP_DIR="/var/backups/mari-pepa"
NGINX_CONF="/etc/nginx/sites-available/mari-pepa"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ============================================
# FUNCIONES HELPER
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

error_exit() {
    log_error "$1"
    exit 1
}

# ============================================
# VERIFICACIÓN DE REQUISITOS
# ============================================
check_requirements() {
    log_info "Verificando requisitos..."
    
    # Verificar root/sudo
    if [ "$EUID" -ne 0 ]; then
        error_exit "Este script debe ejecutarse como root o con sudo"
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        error_exit "Node.js no está instalado"
    fi
    NODE_VERSION=$(node -v)
    log_info "Node.js: $NODE_VERSION"
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        error_exit "PM2 no está instalado. Ejecutar: npm install -g pm2"
    fi
    PM2_VERSION=$(pm2 -v)
    log_info "PM2: $PM2_VERSION"
    
    # Verificar Nginx
    if ! command -v nginx &> /dev/null; then
        error_exit "Nginx no está instalado"
    fi
    NGINX_VERSION=$(nginx -v 2>&1)
    log_info "Nginx: $NGINX_VERSION"
    
    # Verificar ODBC
    if ! command -v odbcinst &> /dev/null; then
        log_warning "unixODBC no detectado - verificar que el driver esté configurado"
    else
        log_info "unixODBC: $(odbcinst --version 2>/dev/null || echo 'instalado')"
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        error_exit "Git no está instalado"
    fi
    
    log_success "Todos los requisitos verificados"
}

# ============================================
# CREAR DIRECTORIOS NECESARIOS
# ============================================
setup_directories() {
    log_info "Configurando directorios..."
    
    mkdir -p $PROJECT_DIR
    mkdir -p $LOG_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/cache/nginx/mari-pepa
    mkdir -p /var/www/certbot
    
    # Permisos
    chown -R gmp:gmp $PROJECT_DIR
    chown -R gmp:gmp $LOG_DIR
    chmod 755 $LOG_DIR
    
    log_success "Directorios configurados"
}

# ============================================
# BACKUP ANTES DE DEPLOY
# ============================================
create_backup() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "Creando backup pre-deploy..."
        
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
        
        tar -czf $BACKUP_FILE \
            --exclude='node_modules' \
            --exclude='.next' \
            --exclude='*.log' \
            -C $PROJECT_DIR . 2>/dev/null || true
        
        # Mantener solo últimos 5 backups
        ls -t $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm
        
        log_success "Backup creado: $BACKUP_FILE"
    else
        log_info "Primera instalación - sin backup previo"
    fi
}

# ============================================
# CLONAR/ACTUALIZAR REPOSITORIO
# ============================================
update_code() {
    log_info "Actualizando código fuente..."
    
    cd $PROJECT_DIR
    
    if [ -d ".git" ]; then
        # Actualizar repositorio existente
        git fetch origin
        git checkout $BRANCH
        git reset --hard origin/$BRANCH
        git clean -fd
    else
        # Clonar nuevo
        git clone $REPO_URL .
        git checkout $BRANCH
    fi
    
    # Mostrar commit actual
    CURRENT_COMMIT=$(git log -1 --pretty=format:"%h - %s (%ci)")
    log_success "Código actualizado: $CURRENT_COMMIT"
}

# ============================================
# INSTALAR DEPENDENCIAS
# ============================================
install_dependencies() {
    log_info "Instalando dependencias del backend..."
    cd $PROJECT_DIR/backend
    npm ci --production --silent
    
    log_info "Instalando dependencias del frontend..."
    cd $PROJECT_DIR/frontend
    npm ci --silent
    
    log_success "Dependencias instaladas"
}

# ============================================
# BUILD DE PRODUCCIÓN
# ============================================
build_production() {
    log_info "Construyendo frontend para producción..."
    
    cd $PROJECT_DIR/frontend
    
    # Variables de entorno para build
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    npm run build
    
    log_success "Build de producción completado"
}

# ============================================
# VERIFICAR CONFIGURACIÓN
# ============================================
verify_config() {
    log_info "Verificando configuración..."
    
    # Verificar .env del backend
    if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
        log_warning "Archivo .env del backend no encontrado"
        log_warning "Copiar .env.production.template a .env y configurar"
    else
        log_success "Backend .env encontrado"
    fi
    
    # Verificar next config
    if [ -f "$PROJECT_DIR/frontend/.env.production" ]; then
        log_success "Frontend .env.production encontrado"
    fi
    
    # Verificar configuración de Nginx
    if nginx -t 2>/dev/null; then
        log_success "Configuración de Nginx válida"
    else
        log_warning "Error en configuración de Nginx"
    fi
}

# ============================================
# CONFIGURAR NGINX
# ============================================
setup_nginx() {
    log_info "Configurando Nginx..."
    
    # Copiar configuración
    cp $PROJECT_DIR/deploy/nginx/mari-pepa.conf $NGINX_CONF
    
    # Crear link simbólico si no existe
    if [ ! -L "/etc/nginx/sites-enabled/mari-pepa" ]; then
        ln -sf $NGINX_CONF /etc/nginx/sites-enabled/mari-pepa
    fi
    
    # Verificar configuración
    if nginx -t; then
        systemctl reload nginx
        log_success "Nginx configurado y recargado"
    else
        error_exit "Error en configuración de Nginx"
    fi
}

# ============================================
# INICIAR/REINICIAR PM2
# ============================================
start_pm2() {
    log_info "Configurando PM2..."
    
    cd $PROJECT_DIR
    
    # Detener apps existentes si hay
    pm2 delete mari-pepa-backend 2>/dev/null || true
    pm2 delete mari-pepa-frontend 2>/dev/null || true
    
    # Iniciar con ecosystem
    pm2 start deploy/ecosystem.config.js
    
    # Guardar configuración
    pm2 save
    
    # Configurar startup (solo primera vez)
    pm2 startup systemd -u gmp --hp /home/gmp 2>/dev/null || true
    
    log_success "PM2 configurado y aplicaciones iniciadas"
}

# ============================================
# HEALTH CHECKS
# ============================================
health_check() {
    log_info "Ejecutando health checks..."
    
    # Esperar a que arranquen
    sleep 5
    
    # Backend health check
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
    if [ "$BACKEND_STATUS" = "200" ]; then
        log_success "Backend: OK (HTTP $BACKEND_STATUS)"
    else
        log_error "Backend: FAILED (HTTP $BACKEND_STATUS)"
        return 1
    fi
    
    # Frontend health check
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        log_success "Frontend: OK (HTTP $FRONTEND_STATUS)"
    else
        log_error "Frontend: FAILED (HTTP $FRONTEND_STATUS)"
        return 1
    fi
    
    log_success "Todos los health checks pasaron"
    return 0
}

# ============================================
# ROLLBACK
# ============================================
rollback() {
    log_warning "Iniciando rollback..."
    
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/backup_*.tar.gz 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restaurando desde: $LATEST_BACKUP"
        
        cd $PROJECT_DIR
        rm -rf backend frontend
        tar -xzf $LATEST_BACKUP
        
        start_pm2
        
        log_success "Rollback completado"
    else
        log_error "No hay backup disponible para rollback"
    fi
}

# ============================================
# MOSTRAR ESTADO
# ============================================
show_status() {
    echo ""
    echo "============================================"
    echo "ESTADO DEL DESPLIEGUE"
    echo "============================================"
    pm2 status
    echo ""
    echo "Logs en tiempo real: pm2 logs"
    echo "Monitoreo: pm2 monit"
    echo "============================================"
}

# ============================================
# MAIN
# ============================================
main() {
    echo ""
    echo "============================================"
    echo "🚀 DESPLIEGUE - GRANJA MARI PEPA"
    echo "============================================"
    echo "Timestamp: $TIMESTAMP"
    echo "Branch: $BRANCH"
    echo "============================================"
    echo ""
    
    check_requirements
    setup_directories
    create_backup
    update_code
    install_dependencies
    build_production
    verify_config
    start_pm2
    
    # Health check con reintentos
    RETRIES=3
    for i in $(seq 1 $RETRIES); do
        if health_check; then
            break
        else
            if [ $i -eq $RETRIES ]; then
                log_error "Health checks fallaron después de $RETRIES intentos"
                rollback
                exit 1
            fi
            log_warning "Reintentando health check ($i/$RETRIES)..."
            sleep 5
        fi
    done
    
    show_status
    
    echo ""
    log_success "🎉 Despliegue completado exitosamente!"
    echo ""
}

# Ejecutar main
main "$@"
