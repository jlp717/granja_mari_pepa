# 🚀 Guía de Despliegue Profesional - Granja Mari Pepa

## Arquitectura de Producción

```
                    ┌─────────────────────────────────────┐
                    │         Internet/Usuario            │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        mari-pepa.com (DNS)          │
                    │        IP: 217.125.92.225           │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │   Nginx (Proxy Inverso + SSL)       │
                    │   - TLS 1.2/1.3 + HTTP/2            │
                    │   - Rate Limiting                   │
                    │   - Gzip Compression                │
                    │   - Security Headers                │
                    └───────────┬─────────────┬───────────┘
                                │             │
                    ┌───────────▼───┐   ┌─────▼───────────┐
                    │ /api/* → :5000│   │  /* → :3001     │
                    └───────────┬───┘   └─────┬───────────┘
                                │             │
                    ┌───────────▼───────────┐ │
                    │  Backend (Express)    │ │
                    │  PM2 Fork Mode        │ │
                    │  Puerto: 5000         │ │
                    └───────────┬───────────┘ │
                                │             │
                    ┌───────────▼───────────┐ │
                    │    ODBC → IBM i       │ │
                    └───────────────────────┘ │
                                              │
                    ┌─────────────────────────▼───────────┐
                    │    Frontend (Next.js SSR)           │
                    │    PM2 Cluster Mode (2 inst)        │
                    │    Puerto: 3001                     │
                    └─────────────────────────────────────┘
```

## Estructura de Archivos de Deploy

```
deploy/
├── ecosystem.config.js     # Configuración PM2
├── env.production.template # Template variables backend
├── frontend.env.template   # Template variables frontend
├── nginx/
│   └── mari-pepa.conf      # Configuración Nginx
├── scripts/
│   ├── deploy.sh           # Script principal de despliegue
│   ├── setup-ssl.sh        # Configuración Let's Encrypt
│   └── setup-logrotate.sh  # Rotación de logs
├── monitoring/
│   └── health-check.sh     # Health checks con alertas
└── systemd/                # (Para servicios adicionales)
```

## Requisitos del Servidor

- **OS**: Ubuntu 20.04+ / Debian 11+
- **Node.js**: v18+ (recomendado v20 LTS)
- **PM2**: v5+
- **Nginx**: v1.18+
- **unixODBC**: Para conexión a IBM i/AS400
- **Certbot**: Para SSL/TLS

## Pasos de Despliegue

### 1. Configurar DNS

Actualizar registros A en Sys4Net para apuntar a `217.125.92.225`:

| Host | Tipo | Valor |
|------|------|-------|
| @ | A | 217.125.92.225 |
| www | A | 217.125.92.225 |

### 2. Clonar y Configurar en Servidor

```bash
# Conectar por SSH
ssh gmp@192.168.1.230

# Clonar repositorio
sudo mkdir -p /var/www/mari-pepa
sudo chown gmp:gmp /var/www/mari-pepa
cd /var/www/mari-pepa
git clone https://github.com/jlp717/granja_mari_pepa.git .

# Crear logs directory
sudo mkdir -p /var/log/mari-pepa
sudo chown gmp:gmp /var/log/mari-pepa
```

### 3. Configurar Variables de Entorno

```bash
# Backend
cp deploy/env.production.template backend/.env
nano backend/.env
# Editar TODOS los valores [CAMBIAR]

# Frontend
cp deploy/frontend.env.template frontend/.env.production.local
```

### 4. Ejecutar Script de Despliegue

```bash
sudo bash deploy/scripts/deploy.sh
```

El script automáticamente:
- Verifica requisitos
- Crea backup
- Instala dependencias
- Construye frontend
- Inicia PM2
- Ejecuta health checks

### 5. Configurar Nginx

```bash
# Copiar configuración
sudo cp deploy/nginx/mari-pepa.conf /etc/nginx/sites-available/mari-pepa
sudo ln -sf /etc/nginx/sites-available/mari-pepa /etc/nginx/sites-enabled/

# Verificar y recargar
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Configurar SSL

```bash
sudo bash deploy/scripts/setup-ssl.sh tu-email@ejemplo.com
```

### 7. Configurar Rotación de Logs

```bash
sudo bash deploy/scripts/setup-logrotate.sh
```

### 8. Configurar Monitoreo (Opcional)

```bash
# Agregar a crontab para ejecutar cada minuto
crontab -e
# Añadir línea:
* * * * * /var/www/mari-pepa/deploy/monitoring/health-check.sh
```

## Comandos Útiles

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs

# Monitoreo interactivo
pm2 monit

# Reiniciar aplicaciones
pm2 restart all

# Ver uso de recursos
pm2 show mari-pepa-backend

# Recargar sin downtime
pm2 reload mari-pepa-frontend

# Ver logs de Nginx
sudo tail -f /var/log/nginx/mari-pepa-error.log
```

## Actualizar Aplicación

Para actualizaciones futuras:

```bash
cd /var/www/mari-pepa
git pull origin main
npm ci --prefix backend --production
npm ci --prefix frontend
npm run build --prefix frontend
pm2 reload all
```

## Rollback

Si algo falla:

```bash
# Ver backups disponibles
ls -la /var/backups/mari-pepa/

# Restaurar último backup
cd /var/www/mari-pepa
sudo tar -xzf /var/backups/mari-pepa/backup_YYYYMMDD_HHMMSS.tar.gz
pm2 restart all
```

## Seguridad

- ✅ HTTPS obligatorio con TLS 1.2/1.3
- ✅ HSTS habilitado (2 años)
- ✅ Rate limiting en API y login
- ✅ Headers de seguridad (CSP, X-Frame-Options, etc.)
- ✅ Cookies HTTP-Only y Secure
- ✅ CORS restringido
- ✅ Logs con rotación automática

## Monitoreo

- PM2 proporciona métricas básicas
- Health check script detecta problemas
- Opcional: Configurar alertas Slack/Email
- Opcional: PM2 Plus para monitoreo avanzado

## Troubleshooting

### Backend no arranca

```bash
pm2 logs mari-pepa-backend --lines 50
# Verificar .env tiene todos los valores requeridos
# Verificar conexión ODBC: odbcinst -q -s
```

### Frontend no arranca

```bash
pm2 logs mari-pepa-frontend --lines 50
# Verificar build existe: ls frontend/.next
# Reconstruir: npm run build --prefix frontend
```

### SSL no funciona

```bash
# Verificar DNS propagado
dig mari-pepa.com

# Renovar certificado manualmente
sudo certbot renew
```

### 502 Bad Gateway

```bash
# Verificar procesos PM2 están corriendo
pm2 status

# Verificar Nginx puede conectar a upstreams
curl -v http://localhost:3001
curl -v http://localhost:5000/health
```
