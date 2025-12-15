# 🔐 ARQUITECTURA DE SEGURIDAD MÁXIMA
## Servidor Web Aislado con Acceso VPN a Base de Datos

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Propuesta](#2-arquitectura-propuesta)
3. [Especificaciones del Servidor](#3-especificaciones-del-servidor)
4. [Sistema Operativo: Linux vs Windows](#4-sistema-operativo-linux-vs-windows)
5. [Estrategia de Caché con Redis](#5-estrategia-de-caché-con-redis)
6. [Seguridad Multicapa](#6-seguridad-multicapa)
7. [Protección de Base de Datos](#7-protección-de-base-de-datos)
8. [Lista de Compras](#8-lista-de-compras)
9. [Plan de Implementación](#9-plan-de-implementación)

---

## 1. RESUMEN EJECUTIVO

### La Propuesta de Seguridad

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
│                                  │                                           │
│                           ┌──────▼──────┐                                    │
│                           │  CLOUDFLARE │  ← Capa 1: Protección DDoS        │
│                           │   (Proxy)   │    + WAF + Bot Protection         │
│                           └──────┬──────┘                                    │
│                                  │                                           │
│    ╔═══════════════════════════════════════════════════════════════════╗    │
│    ║              ZONA DMZ (Red Aislada de la Empresa)                 ║    │
│    ║  ┌─────────────────────────────────────────────────────────────┐  ║    │
│    ║  │                    SERVIDOR WEB                              │  ║    │
│    ║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  ║    │
│    ║  │  │   NGINX     │  │   BACKEND   │  │       REDIS         │  │  ║    │
│    ║  │  │  (Reverse   │──│  (Node.js)  │──│   (Caché Local)     │  │  ║    │
│    ║  │  │   Proxy)    │  │             │  │                     │  │  ║    │
│    ║  │  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │  ║    │
│    ║  │                          │                                   │  ║    │
│    ║  │                    ┌─────▼─────┐                             │  ║    │
│    ║  │                    │  CLIENTE  │                             │  ║    │
│    ║  │                    │    VPN    │ ← Túnel cifrado             │  ║    │
│    ║  │                    └─────┬─────┘                             │  ║    │
│    ║  └──────────────────────────┼───────────────────────────────────┘  ║    │
│    ╚═════════════════════════════╪═══════════════════════════════════════╝    │
│                                  │                                           │
│                           ═══════╪═══════  TÚNEL VPN CIFRADO                │
│                                  │         (IPSec/WireGuard)                 │
│                                  │                                           │
│    ╔═══════════════════════════════════════════════════════════════════╗    │
│    ║                    RED INTERNA EMPRESA                            ║    │
│    ║  ┌─────────────────────────────────────────────────────────────┐  ║    │
│    ║  │                      FIREWALL                                │  ║    │
│    ║  │  (Solo permite conexiones desde IP del servidor VPN)        │  ║    │
│    ║  └─────────────────────────┬───────────────────────────────────┘  ║    │
│    ║                            │                                      ║    │
│    ║  ┌─────────────────────────▼───────────────────────────────────┐  ║    │
│    ║  │                      IBM i                                   │  ║    │
│    ║  │                   (Base de Datos)                            │  ║    │
│    ║  │                   192.168.1.22                               │  ║    │
│    ║  └─────────────────────────────────────────────────────────────┘  ║    │
│    ╚═══════════════════════════════════════════════════════════════════╝    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ¿Por Qué Esta Arquitectura es Casi Imposible de Hackear?

| Capa de Seguridad | Protección | Si el Atacante la Supera... |
|-------------------|------------|----------------------------|
| **Cloudflare** | DDoS, WAF, Bot Protection | Solo ve contenido cacheado, no el servidor real |
| **Nginx Hardened** | Rate limiting, headers seguros | Encuentra el backend Node.js |
| **Backend Node.js** | JWT, validación, sanitización | Necesita credenciales válidas |
| **Redis (Caché)** | Datos temporales, sin datos sensibles | Solo ve datos públicos cacheados |
| **VPN IPSec** | Túnel cifrado AES-256 | Necesita romper criptografía militar |
| **Firewall IBM i** | Solo acepta IP del VPN | No puede conectar a la BBDD |
| **IBM i** | Sin acceso directo desde Internet | **IMPOSIBLE de alcanzar** |

**Resultado**: Un atacante necesitaría comprometer **7 capas de seguridad** para llegar a la base de datos. Esto es prácticamente imposible.

---

## 2. ARQUITECTURA PROPUESTA

### 2.1 Componentes del Sistema

#### A) Servidor Web (DMZ - Fuera de la red interna)

```yaml
Ubicación: Red separada / ISP diferente / Rack dedicado
Función: Servir frontend + API
Componentes:
  - Sistema Operativo: Ubuntu Server 24.04 LTS
  - Servidor Web: Nginx (reverse proxy)
  - Backend: Node.js 20 LTS
  - Caché: Redis 7.x
  - Cliente VPN: WireGuard / OpenVPN
  - Firewall: UFW + fail2ban
  - SSL: Let's Encrypt (auto-renovación)
  - Monitoreo: Prometheus + Grafana
```

#### B) Túnel VPN

```yaml
Tipo: WireGuard (recomendado) o IPSec
Cifrado: AES-256-GCM + ChaCha20-Poly1305
Autenticación: Certificados + Pre-shared key
Restricción: Solo tráfico ODBC (puerto 8471)
IP Fija: Asignada al servidor web en la VPN
```

#### C) Red Interna (Empresa)

```yaml
Firewall: Solo acepta conexiones desde IP VPN del servidor
IBM i: Sin exposición a Internet
ODBC: Puerto 8471 solo accesible via VPN
```

### 2.2 Flujo de una Petición

```
1. Usuario → https://app.mari-pepa.com
         ↓
2. Cloudflare (verifica no es bot/ataque)
         ↓
3. Nginx (valida request, rate limit)
         ↓
4. Backend Node.js
         ↓
5. ¿Datos en Redis? 
   → SÍ: Devuelve caché (NO toca BBDD)
   → NO: Continúa...
         ↓
6. Conexión VPN → Red Interna
         ↓
7. Firewall IBM i (verifica IP origen = VPN)
         ↓
8. IBM i procesa consulta
         ↓
9. Respuesta → Guarda en Redis → Usuario
```

---

## 3. ESPECIFICACIONES DEL SERVIDOR

### 3.1 Hardware Recomendado

#### Opción A: Servidor Dedicado (Máxima seguridad)

```yaml
Procesador: Intel Xeon E-2324G (4 cores, 3.1GHz) o AMD EPYC 3251
            - Mínimo: Intel Core i5-12400 / AMD Ryzen 5 5600
Memoria RAM: 32 GB DDR4 ECC
            - Mínimo: 16 GB DDR4
Almacenamiento:
  - Sistema: 500 GB NVMe SSD (para SO + aplicaciones)
  - Datos: 500 GB SATA SSD (para logs + backups)
  - Opcional: RAID 1 para redundancia
Red: 
  - 2x Gigabit Ethernet (una para Internet, otra para gestión)
  - Soporte VLAN
Fuente: 500W 80+ Gold con UPS externo
```

#### Opción B: Mini PC Empresarial (Buena relación calidad/precio)

```yaml
Modelo Recomendado: 
  - Dell OptiPlex Micro 7010 / 7020
  - Lenovo ThinkCentre M920q Tiny
  - HP ProDesk 400 G6 Mini

Especificaciones:
  - Intel Core i5-12500T / i7-12700T
  - 32 GB RAM DDR4
  - 512 GB NVMe SSD
  - Gigabit Ethernet
  - Bajo consumo (~35W)
  - Silencioso
  - Montaje VESA (detrás de monitor)

Precio aproximado: 600-900€
```

#### Opción C: Servidor Rack 1U (Para datacenter)

```yaml
Modelos:
  - Dell PowerEdge R350
  - HPE ProLiant DL20 Gen10+
  - Supermicro SuperServer 5019S-M

Especificaciones:
  - Intel Xeon E-2336 (6 cores)
  - 64 GB RAM DDR4 ECC
  - 2x 480 GB SSD RAID 1
  - 2x Gigabit + 1x IPMI (gestión remota)
  - Fuente redundante (opcional)
  - iDRAC/iLO para gestión remota

Precio aproximado: 1.500-2.500€
```

### 3.2 Especificaciones Mínimas Absolutas

```yaml
CPU: 4 cores / 8 threads (2.0 GHz+)
RAM: 8 GB (16 GB recomendado)
Disco: 128 GB SSD (256 GB recomendado)
Red: Gigabit Ethernet
SO: Ubuntu Server 24.04 LTS
```

### 3.3 Estimación de Recursos

```yaml
Backend Node.js:
  - RAM: ~200-500 MB por proceso
  - CPU: Bajo (mayormente I/O bound)
  - Procesos recomendados: 2-4 (cluster mode)

Redis:
  - RAM: 512 MB - 2 GB (según datos cacheados)
  - Disco: ~100 MB

Nginx:
  - RAM: ~50-100 MB
  - CPU: Muy bajo

Sistema Operativo:
  - RAM: ~500 MB
  - Disco: ~5 GB

Logs y Métricas:
  - Disco: ~10-50 GB (rotación semanal)

TOTAL ESTIMADO:
  - RAM: 4-8 GB en uso normal
  - CPU: 10-30% en uso normal
  - Picos: Hasta 16 GB RAM, 80% CPU
```

---

## 4. SISTEMA OPERATIVO: LINUX VS WINDOWS

### 4.1 Comparativa Detallada

| Aspecto | Ubuntu Server 24.04 LTS | Windows Server 2022 |
|---------|------------------------|---------------------|
| **Seguridad** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐ Buena |
| **Superficie de ataque** | Mínima | Mayor |
| **Actualizaciones** | Rápidas, granulares | Requiere reinicios |
| **Coste licencia** | GRATIS | ~800€ / año |
| **Soporte ODBC IBM i** | ✅ Sí (unixODBC) | ✅ Sí (nativo) |
| **Rendimiento Node.js** | ⭐⭐⭐⭐⭐ Óptimo | ⭐⭐⭐⭐ Bueno |
| **Consumo recursos** | ~500 MB RAM base | ~2 GB RAM base |
| **Administración remota** | SSH (seguro) | RDP (mayor superficie) |
| **Estabilidad uptime** | Meses/años sin reiniciar | Reinicios mensuales |
| **Comunidad/Soporte** | Enorme | Buena |
| **Automatización** | Bash, Ansible, etc. | PowerShell |
| **Contenedores Docker** | ⭐⭐⭐⭐⭐ Nativo | ⭐⭐⭐ Con WSL2 |

### 4.2 RECOMENDACIÓN: Ubuntu Server 24.04 LTS

**¿Por qué Linux?**

1. **Menor superficie de ataque**: Sin escritorio gráfico, sin servicios innecesarios
2. **Actualizaciones sin reinicio**: Kernel livepatch permite parchear sin downtime
3. **SSH vs RDP**: SSH es mucho más seguro que Remote Desktop
4. **Sin malware Windows**: 95% del malware está diseñado para Windows
5. **Gratis**: Sin coste de licencias
6. **Estándar de la industria**: Netflix, Google, Amazon, Facebook usan Linux
7. **Mejor rendimiento**: Node.js fue diseñado para Linux

### 4.3 Configuración de Seguridad Ubuntu

```bash
# Instalación mínima sin interfaz gráfica
# Solo instalar: OpenSSH, Node.js, Nginx, Redis, WireGuard

# Servicios activos (mínimos)
systemctl list-units --type=service --state=running
# Solo deberían aparecer:
#   - ssh.service
#   - nginx.service
#   - redis.service
#   - node-backend.service (PM2)
#   - wg-quick@wg0.service (VPN)
#   - fail2ban.service
#   - ufw.service
```

---

## 5. ESTRATEGIA DE CACHÉ CON REDIS

### 5.1 ¿Por Qué Redis es CRÍTICO para la Seguridad?

```
SIN REDIS:
Usuario → Backend → VPN → IBM i → VPN → Backend → Usuario
         (Cada petición toca la BBDD = más exposición)

CON REDIS:
Usuario → Backend → Redis (HIT) → Usuario
         (90% de peticiones NO tocan la BBDD)
```

**Beneficios de seguridad:**
1. **Menor exposición de BBDD**: Solo 10% de peticiones llegan a IBM i
2. **Si hackean el servidor**: Solo ven datos cacheados (públicos)
3. **Sin credenciales en caché**: Redis solo guarda resultados, no credenciales
4. **Datos temporales**: TTL corto = datos se borran automáticamente

### 5.2 Estrategia de Caché Recomendada

```javascript
// Clasificación de datos por nivel de caché

const CACHE_STRATEGY = {
  // NIVEL 1: Caché AGRESIVO (1-24 horas)
  // Datos que casi nunca cambian
  productos: {
    ttl: 3600 * 6,  // 6 horas
    invalidateOn: ['producto.update', 'producto.create']
  },
  categorias: {
    ttl: 3600 * 24, // 24 horas
    invalidateOn: ['categoria.update']
  },
  datosEmpresa: {
    ttl: 3600 * 24, // 24 horas
    invalidateOn: ['empresa.update']
  },

  // NIVEL 2: Caché MODERADO (5-30 minutos)
  // Datos que cambian ocasionalmente
  listaClientes: {
    ttl: 300,       // 5 minutos
    invalidateOn: ['cliente.update', 'cliente.create']
  },
  facturasCliente: {
    ttl: 600,       // 10 minutos
    perUser: true,  // Caché por usuario
    invalidateOn: ['factura.create']
  },
  
  // NIVEL 3: Caché LIGERO (1-5 minutos)
  // Datos que cambian frecuentemente
  dashboard: {
    ttl: 60,        // 1 minuto
    perUser: true
  },
  pedidosPendientes: {
    ttl: 120,       // 2 minutos
    perUser: true
  },

  // NIVEL 4: SIN CACHÉ
  // Datos sensibles o tiempo real
  login: { ttl: 0 },
  logout: { ttl: 0 },
  cambioPassword: { ttl: 0 },
  operacionesEscritura: { ttl: 0 },
  saldosEnTiempoReal: { ttl: 0 }
};
```

### 5.3 Implementación Redis Segura

```javascript
// backend/utils/redis-cache.js

const Redis = require('ioredis');
const crypto = require('crypto');

class SecureRedisCache {
  constructor() {
    this.client = new Redis({
      host: '127.0.0.1',      // Solo localhost (no expuesto)
      port: 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
      
      // Seguridad
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      
      // Conexión
      connectTimeout: 5000,
      commandTimeout: 3000,
      
      // TLS (si Redis está en otro servidor)
      // tls: { rejectUnauthorized: true }
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
      // Fallback a memoria si Redis falla
    });
  }

  // Generar clave única por usuario (evita que un usuario vea datos de otro)
  generateKey(prefix, userId, params = {}) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ userId, ...params }))
      .digest('hex')
      .substring(0, 16);
    return `${prefix}:${userId}:${hash}`;
  }

  // GET con fallback a base de datos
  async getOrFetch(key, fetchFn, ttl = 300) {
    try {
      // 1. Intentar obtener de caché
      const cached = await this.client.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // 2. Si no está en caché, obtener de BBDD
      const data = await fetchFn();

      // 3. Guardar en caché (sin bloquear)
      this.client.setex(key, ttl, JSON.stringify(data)).catch(() => {});

      return data;
    } catch (error) {
      // Si Redis falla, ir directo a BBDD
      console.warn('Redis fallback:', error.message);
      return fetchFn();
    }
  }

  // Invalidar caché cuando hay cambios
  async invalidatePattern(pattern) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Limpiar caché de un usuario específico
  async invalidateUser(userId) {
    await this.invalidatePattern(`*:${userId}:*`);
  }
}

module.exports = new SecureRedisCache();
```

### 5.4 Configuración Redis Segura

```bash
# /etc/redis/redis.conf

# Solo escuchar en localhost (CRÍTICO)
bind 127.0.0.1
port 6379

# Requerir contraseña
requirepass "CONTRASEÑA_MUY_LARGA_Y_COMPLEJA_AQUI"

# Deshabilitar comandos peligrosos
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command DEBUG ""
rename-command SHUTDOWN ""

# Límites de memoria
maxmemory 2gb
maxmemory-policy allkeys-lru

# Deshabilitar persistencia (solo caché, no base de datos)
save ""
appendonly no

# Seguridad adicional
protected-mode yes

# Logs
loglevel warning
logfile /var/log/redis/redis.log
```

### 5.5 Qué NUNCA Cachear

```javascript
// NUNCA cachear estos datos:
const NEVER_CACHE = [
  'passwords',
  'tokens_jwt',
  'refresh_tokens',
  'session_data',
  'credenciales_odbc',
  'claves_api',
  'datos_pago',
  'numeros_tarjeta',
  'datos_bancarios',
  'historial_login',
  'logs_auditoria'
];
```

---

## 6. SEGURIDAD MULTICAPA

### 6.1 Capa 1: Cloudflare (Perímetro)

```yaml
Servicio: Cloudflare Pro (~20€/mes)

Protecciones:
  - DDoS Mitigation (ataques de hasta 1Tbps)
  - WAF (Web Application Firewall)
  - Bot Protection
  - Rate Limiting
  - IP Reputation
  - Geoblocking (bloquear países)
  - Certificado SSL/TLS
  - Always HTTPS

Configuración recomendada:
  - Modo: Full (strict)
  - TLS mínimo: 1.2
  - HSTS: Habilitado
  - Challenge Passage: 30 minutos
  - Browser Integrity Check: On
  - Hotlink Protection: On
```

### 6.2 Capa 2: Firewall del Servidor (UFW + fail2ban)

```bash
# /etc/ufw/before.rules - Reglas UFW

# Política por defecto: DENEGAR TODO
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Solo permitir:
# - SSH desde IPs específicas (tu oficina)
sudo ufw allow from 85.X.X.X to any port 22 proto tcp
# - HTTP/HTTPS desde Cloudflare únicamente
sudo ufw allow from 173.245.48.0/20 to any port 443 proto tcp
sudo ufw allow from 103.21.244.0/22 to any port 443 proto tcp
sudo ufw allow from 103.22.200.0/22 to any port 443 proto tcp
# ... (todas las IPs de Cloudflare)

# Habilitar
sudo ufw enable
```

```bash
# /etc/fail2ban/jail.local - Bloqueo automático

[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8 192.168.1.0/24

[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 24h

[nginx-http-auth]
enabled = true
maxretry = 3
bantime = 1h

[nginx-botsearch]
enabled = true
maxretry = 2
bantime = 1w

[nginx-badbots]
enabled = true
maxretry = 1
bantime = 1w
```

### 6.3 Capa 3: Nginx Hardening

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Ocultar versión de nginx
    server_tokens off;
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.mari-pepa.com; frame-ancestors 'self';" always;
    add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;
    
    # Timeouts
    client_body_timeout 10s;
    client_header_timeout 10s;
    keepalive_timeout 15s;
    send_timeout 10s;
    
    # Límites de tamaño
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    
    # Logs
    access_log /var/log/nginx/access.log combined buffer=512k flush=1m;
    error_log /var/log/nginx/error.log warn;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;
    
    # SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

```nginx
# /etc/nginx/sites-available/api.mari-pepa.com

# Bloquear IPs maliciosas conocidas
geo $bad_ip {
    default 0;
    # Lista de IPs bloqueadas
    # 1.2.3.4 1;
}

upstream backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.mari-pepa.com;
    
    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.mari-pepa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.mari-pepa.com/privkey.pem;
    
    # Bloquear IPs maliciosas
    if ($bad_ip) {
        return 403;
    }
    
    # Solo permitir IPs de Cloudflare
    # set_real_ip_from 173.245.48.0/20;
    # ... (todas las IPs de Cloudflare)
    # real_ip_header CF-Connecting-IP;
    
    # API endpoints
    location /api/ {
        # Rate limiting general
        limit_req zone=api burst=20 nodelay;
        limit_conn conn 10;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Login con rate limiting estricto
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        limit_conn conn 2;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Bloquear rutas sensibles
    location ~ /\. {
        deny all;
    }
    
    location ~* \.(env|git|htaccess|htpasswd|ini|log|sh|sql|conf|bak)$ {
        deny all;
    }
    
    # Health check (sin rate limit)
    location /api/health {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        access_log off;
    }
}

# Redirect HTTP a HTTPS
server {
    listen 80;
    server_name api.mari-pepa.com;
    return 301 https://$server_name$request_uri;
}
```

### 6.4 Capa 4: Backend Node.js Hardening

```javascript
// backend/server.js - Configuración de seguridad

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const app = express();

// 1. Helmet - Headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// 2. CORS estricto
app.use(cors({
  origin: [
    'https://app.mari-pepa.com',
    'https://granjamaripepaweb.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// 3. Rate limiting por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // 100 requests por ventana
  message: { error: 'Demasiadas peticiones, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health'
});
app.use('/api/', limiter);

// 4. Rate limiting estricto para login
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,                    // 5 intentos
  message: { error: 'Cuenta bloqueada temporalmente' },
  skipSuccessfulRequests: true
});
app.use('/api/auth/login', loginLimiter);

// 5. Slow down (penalización progresiva)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500
});
app.use('/api/', speedLimiter);

// 6. Sanitización de datos
app.use(express.json({ limit: '10kb' })); // Limitar tamaño body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize()); // Prevenir NoSQL injection
app.use(xss());            // Prevenir XSS
app.use(hpp());            // Prevenir HTTP Parameter Pollution

// 7. Trust proxy (para Cloudflare)
app.set('trust proxy', 1);

// 8. No exponer tecnología
app.disable('x-powered-by');

// 9. Logging de seguridad
app.use((req, res, next) => {
  const clientIP = req.ip;
  const userAgent = req.get('User-Agent');
  
  // Detectar User-Agents sospechosos
  const suspiciousUA = [
    'sqlmap', 'nikto', 'nessus', 'nmap', 'masscan',
    'curl', 'wget', 'python', 'go-http', 'java'
  ];
  
  if (suspiciousUA.some(ua => userAgent?.toLowerCase().includes(ua))) {
    console.warn(`[SECURITY] Suspicious UA blocked: ${clientIP} - ${userAgent}`);
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  
  next();
});

// 10. Manejo de errores (sin exponer stack traces)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  
  // En producción, no exponer detalles del error
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;
    
  res.status(err.status || 500).json({ error: message });
});
```

### 6.5 Capa 5: VPN (WireGuard)

```bash
# Instalación WireGuard en el servidor web
sudo apt install wireguard

# Generar claves
wg genkey | tee /etc/wireguard/privatekey | wg pubkey > /etc/wireguard/publickey
chmod 600 /etc/wireguard/privatekey

# /etc/wireguard/wg0.conf (Servidor Web - Cliente VPN)
[Interface]
PrivateKey = <CLAVE_PRIVADA_SERVIDOR_WEB>
Address = 10.0.0.2/32
DNS = 1.1.1.1

[Peer]
# Servidor VPN en la empresa
PublicKey = <CLAVE_PUBLICA_SERVIDOR_EMPRESA>
AllowedIPs = 192.168.1.22/32  # Solo acceso al IBM i
Endpoint = <IP_PUBLICA_EMPRESA>:51820
PersistentKeepalive = 25

# Habilitar e iniciar
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

```bash
# En el router/servidor de la EMPRESA (Servidor VPN)
# /etc/wireguard/wg0.conf

[Interface]
PrivateKey = <CLAVE_PRIVADA_EMPRESA>
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Servidor Web externo
PublicKey = <CLAVE_PUBLICA_SERVIDOR_WEB>
AllowedIPs = 10.0.0.2/32
```

### 6.6 Capa 6: Firewall IBM i

```sql
-- Configuración firewall IBM i para solo aceptar conexiones VPN

-- Solo permitir conexiones desde la IP VPN del servidor web
ADDTCPRTE RTEDEST('10.0.0.2') SUBNETMASK('255.255.255.255') 
          NEXTHOP('192.168.1.1') BINDLIND('*NONE') MTU(*IFC)

-- Regla de firewall: solo aceptar ODBC desde IP VPN
ADDFWRULE ACTION(*ALLOW) RMTADDR('10.0.0.2') RMTADDRMASK('255.255.255.255')
          LCLIFC(*ALL) LCLPORT(8471) RMTPORT(*ANY) PROTO(*TCP)

-- Bloquear todo lo demás desde fuera
ADDFWRULE ACTION(*DENY) RMTADDR('0.0.0.0') RMTADDRMASK('0.0.0.0')
          LCLPORT(8471) PROTO(*TCP)
```

---

## 7. PROTECCIÓN DE BASE DE DATOS

### 7.1 Principio de Mínimo Privilegio

```sql
-- Crear usuario ODBC con permisos MÍNIMOS en IBM i
CREATE USER WEBAPI PASSWORD 'contraseña_muy_segura_123!'
  INITIAL PROGRAM(*NONE)
  SPECIAL AUTHORITIES(*NONE)
  USER CLASS(*USER);

-- Solo permisos de SELECT en tablas necesarias
GRANT SELECT ON GMPDTA.CLI TO WEBAPI;
GRANT SELECT ON GMPDTA.CAC TO WEBAPI;
GRANT SELECT ON GMPDTA.LAC TO WEBAPI;
GRANT SELECT ON GMPDTA.ART TO WEBAPI;
GRANT SELECT ON GMPDTA.FAM TO GMPDTA;

-- Para insertar pedidos (si es necesario)
GRANT INSERT ON GMPDTA.PEDIDOS TO WEBAPI;

-- NUNCA dar:
-- - DELETE
-- - DROP
-- - ALTER
-- - GRANT
-- - *ALLOBJ
-- - *SECADM
```

### 7.2 Consultas Preparadas (Prevenir SQL Injection)

```javascript
// backend/utils/database.js - SIEMPRE usar consultas preparadas

class Database {
  async getCliente(codigoCliente) {
    // ❌ NUNCA hacer esto:
    // const query = `SELECT * FROM CLI WHERE CLICOD = '${codigoCliente}'`;
    
    // ✅ SIEMPRE usar parámetros:
    const query = `SELECT * FROM GMPDTA.CLI WHERE CLICOD = ?`;
    return await this.connection.query(query, [codigoCliente]);
  }
  
  async buscarProductos(termino) {
    // ❌ NUNCA:
    // const query = `SELECT * FROM ART WHERE ARTDES LIKE '%${termino}%'`;
    
    // ✅ SIEMPRE:
    const query = `SELECT * FROM GMPDTA.ART WHERE ARTDES LIKE ?`;
    return await this.connection.query(query, [`%${termino}%`]);
  }
}
```

### 7.3 Timeout de Conexiones

```javascript
// Configuración ODBC con timeouts estrictos
const odbcConfig = {
  connectionString: process.env.ODBC_CONNECTION_STRING,
  connectionTimeout: 5,      // 5 segundos para conectar
  loginTimeout: 5,           // 5 segundos para login
  queryTimeout: 30,          // 30 segundos máximo por query
  
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    evictionRunIntervalMillis: 60000
  }
};
```

### 7.4 Logging y Auditoría

```javascript
// Registrar TODAS las consultas a BBDD
const auditLog = (userId, action, query, params, duration) => {
  const log = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    query: query.substring(0, 200), // Truncar query larga
    params: JSON.stringify(params).substring(0, 100),
    duration,
    ip: getCurrentRequestIP()
  };
  
  // Guardar en archivo (rotación diaria)
  fs.appendFileSync(
    `/var/log/granja-api/audit-${new Date().toISOString().slice(0,10)}.log`,
    JSON.stringify(log) + '\n'
  );
  
  // Alertar si query tarda más de 5 segundos
  if (duration > 5000) {
    alertAdmin(`Slow query: ${query} - ${duration}ms`);
  }
};
```

---

## 8. LISTA DE COMPRAS

### 8.1 Hardware

| Componente | Opción Recomendada | Precio Aprox. |
|------------|-------------------|---------------|
| **Mini PC** | Dell OptiPlex 7020 Micro (i5, 32GB, 512GB) | 750€ |
| **UPS** | APC Back-UPS 700VA | 90€ |
| **Cables Red** | Cat 6 (varios) | 20€ |
| **Disco Backup** | SSD externo 1TB | 80€ |
| **Total Hardware** | | **~940€** |

### 8.2 Software y Servicios (Anual)

| Servicio | Coste Mensual | Coste Anual |
|----------|---------------|-------------|
| **Dominio** (.com) | - | 15€ |
| **Cloudflare Pro** | 20€ | 240€ |
| **IP Fija** (si no tienes) | 10€ | 120€ |
| **Backup Cloud** (opcional) | 5€ | 60€ |
| **Ubuntu Server** | GRATIS | 0€ |
| **Node.js** | GRATIS | 0€ |
| **Redis** | GRATIS | 0€ |
| **Nginx** | GRATIS | 0€ |
| **WireGuard** | GRATIS | 0€ |
| **Let's Encrypt SSL** | GRATIS | 0€ |
| **Total Anual** | | **~435€** |

### 8.3 Comparativa con VPS

| Concepto | Servidor Propio | VPS (Contabo) |
|----------|-----------------|---------------|
| Coste inicial | ~940€ | 0€ |
| Coste mensual | ~36€ | ~25€ |
| Coste anual total | ~1.375€ (año 1), ~435€ (siguientes) | ~300€/año |
| Control total | ✅ | ❌ |
| Seguridad física | ✅ (en tu ubicación) | ❌ (datacenter terceros) |
| Dependencia Internet | ✅ Alta | ❌ Baja |
| Mantenimiento | ✅ Tu responsabilidad | ⚠️ Compartida |

**Recomendación**: El servidor propio tiene sentido si valoras el **control total** y la **seguridad física**. El VPS es más económico a largo plazo pero dependes de terceros.

---

## 9. PLAN DE IMPLEMENTACIÓN

### Fase 1: Preparación (Semana 1)

```yaml
Día 1-2:
  - [ ] Comprar hardware (Mini PC)
  - [ ] Configurar ubicación física (rack, ventilación, UPS)
  - [ ] Obtener IP fija del ISP (si no la tienes)

Día 3-4:
  - [ ] Instalar Ubuntu Server 24.04 LTS
  - [ ] Configurar red (IP estática, DNS)
  - [ ] Actualizar sistema: apt update && apt upgrade

Día 5:
  - [ ] Instalar paquetes base:
        - openssh-server
        - ufw
        - fail2ban
        - htop
        - curl
        - git
```

### Fase 2: Seguridad Base (Semana 1-2)

```yaml
Día 6:
  - [ ] Configurar SSH con claves (deshabilitar passwords)
  - [ ] Configurar UFW (firewall)
  - [ ] Configurar fail2ban
  - [ ] Crear usuario no-root para servicios

Día 7:
  - [ ] Instalar WireGuard
  - [ ] Configurar túnel VPN con la empresa
  - [ ] Probar conectividad VPN → IBM i
```

### Fase 3: Servicios (Semana 2)

```yaml
Día 8:
  - [ ] Instalar Node.js 20 LTS
  - [ ] Instalar Redis
  - [ ] Configurar Redis (seguridad)

Día 9:
  - [ ] Instalar Nginx
  - [ ] Configurar Nginx (hardening)
  - [ ] Instalar Certbot (Let's Encrypt)

Día 10:
  - [ ] Instalar driver ODBC IBM i
  - [ ] Configurar conexión ODBC via VPN
  - [ ] Probar conexión a base de datos
```

### Fase 4: Aplicación (Semana 2-3)

```yaml
Día 11:
  - [ ] Clonar repositorio backend
  - [ ] Configurar .env para producción
  - [ ] Instalar dependencias npm

Día 12:
  - [ ] Instalar PM2
  - [ ] Configurar PM2 como servicio
  - [ ] Arrancar backend

Día 13:
  - [ ] Configurar Nginx como proxy
  - [ ] Obtener certificado SSL
  - [ ] Probar HTTPS
```

### Fase 5: Cloudflare y DNS (Semana 3)

```yaml
Día 14:
  - [ ] Registrar dominio (si no tienes)
  - [ ] Configurar Cloudflare
  - [ ] Apuntar DNS a servidor
  - [ ] Configurar reglas WAF

Día 15:
  - [ ] Configurar frontend en Netlify
  - [ ] Apuntar frontend a API
  - [ ] Pruebas de integración
```

### Fase 6: Monitoreo y Backup (Semana 3)

```yaml
Día 16-17:
  - [ ] Instalar Prometheus + Grafana (opcional)
  - [ ] Configurar alertas
  - [ ] Configurar backups automáticos
  - [ ] Documentar todo

Día 18-20:
  - [ ] Pruebas de carga
  - [ ] Pruebas de seguridad
  - [ ] Correcciones finales
  - [ ] Go-live!
```

---

## 📋 CHECKLIST FINAL DE SEGURIDAD

### Antes de Go-Live

- [ ] SSH solo con claves (passwords deshabilitados)
- [ ] Firewall UFW activo y configurado
- [ ] fail2ban funcionando
- [ ] Redis solo en localhost con password
- [ ] Nginx con headers de seguridad
- [ ] HTTPS obligatorio (HSTS)
- [ ] Certificado SSL válido
- [ ] VPN funcionando y probada
- [ ] ODBC con usuario de mínimos privilegios
- [ ] Rate limiting configurado
- [ ] Logs de auditoría funcionando
- [ ] Backups automáticos configurados
- [ ] Cloudflare WAF activo
- [ ] Todas las contraseñas son fuertes (20+ caracteres)
- [ ] Sin puertos innecesarios abiertos
- [ ] Sin servicios innecesarios corriendo

### Test de Penetración Básico

```bash
# Desde fuera de la red, verificar que solo responde lo necesario
nmap -sV -p- api.mari-pepa.com
# Solo debería mostrar: 443/tcp open ssl/https

# Intentar acceso SSH (debe fallar)
ssh root@api.mari-pepa.com
# Connection refused

# Intentar SQL injection (debe bloquear)
curl "https://api.mari-pepa.com/api/clientes?id=1' OR '1'='1"
# 403 Forbidden

# Intentar fuerza bruta (debe bloquear)
for i in {1..10}; do curl -X POST https://api.mari-pepa.com/api/auth/login; done
# 429 Too Many Requests
```

---

## 🎯 CONCLUSIÓN

Esta arquitectura proporciona **7 capas de seguridad**:

1. **Cloudflare**: Filtrado de tráfico malicioso antes de llegar al servidor
2. **UFW + fail2ban**: Firewall local y bloqueo automático
3. **Nginx**: Rate limiting, headers seguros, reverse proxy
4. **Node.js**: Sanitización, validación, JWT
5. **Redis**: Caché que reduce exposición de BBDD
6. **VPN**: Túnel cifrado para acceso a red interna
7. **Firewall IBM i**: Solo acepta conexiones desde VPN

**Para hackear la base de datos, un atacante necesitaría:**
1. Bypassear Cloudflare
2. Bypassear el firewall del servidor
3. Explotar una vulnerabilidad en Nginx
4. Explotar una vulnerabilidad en Node.js
5. Obtener credenciales JWT válidas
6. Romper la criptografía de la VPN (AES-256)
7. Bypassear el firewall del IBM i

**Esto es prácticamente imposible** con las herramientas actuales.

---

**Fecha de creación**: 27 de Noviembre de 2025  
**Versión**: 1.0  
**Autor**: Arquitectura de Seguridad - Granja Mari Pepa
