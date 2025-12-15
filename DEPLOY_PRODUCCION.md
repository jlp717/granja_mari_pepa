# 🚀 GUÍA DE DESPLIEGUE A PRODUCCIÓN

## ✅ PRE-REQUISITOS COMPLETADOS
- [x] Servidor Ubuntu 24.04 con IP 192.168.15.140
- [x] Node.js 20.19.6 instalado
- [x] PM2 6.0.14 instalado
- [x] Nginx 1.24.0 configurado
- [x] Firewall UFW activo (puertos 22, 80, 443)
- [x] Directorios creados en `/var/www/mari-pepa`

---

## 📋 PASO 1: SUBIR CÓDIGO A GITHUB (DESDE TU PC)

### 1.1 Verificar que no hay secretos
```powershell
# Ver qué archivos se van a subir
git status

# Verificar que NO aparezcan:
# ❌ .env (con tus claves reales)
# ❌ *.db (bases de datos)
# ❌ logs/ (con datos sensibles)
# ❌ backup/
```

### 1.2 Subir código a GitHub
```powershell
# Añadir todos los cambios
git add .

# Hacer commit
git commit -m "Preparación para producción - aplicación completa"

# Subir a GitHub
git push origin main
```

**🎯 RESULTADO**: Tu código está en GitHub SIN claves ni secretos

---

## 📥 PASO 2: DESCARGAR CÓDIGO EN EL SERVIDOR

### 2.1 Conectar por PuTTY
- **Host**: 192.168.15.140
- **Usuario**: gmp
- **Puerto**: 22

### 2.2 Clonar repositorio
```bash
# Ir al directorio correcto
cd /var/www/mari-pepa

# Clonar desde GitHub (usa tu URL real)
git clone https://github.com/jlp717/granja_mari_pepa.git temp

# Mover contenido al directorio principal
mv temp/* ./
mv temp/.* ./ 2>/dev/null
rm -rf temp/

# Verificar que está todo
ls -la
```

**🎯 RESULTADO**: Código descargado en el servidor

---

## 🔐 PASO 3: CONFIGURAR VARIABLES DE ENTORNO (SOLO EN SERVIDOR)

### 3.1 Crear archivo .env para el BACKEND
```bash
# Ir al backend
cd /var/www/mari-pepa/backend

# Crear .env con tus claves reales
nano .env
```

**Pega este contenido y CAMBIA LOS VALORES:**
```env
JWT_SECRET=aqui-pon-una-clave-super-larga-y-segura-de-al-menos-32-caracteres
JWT_EXPIRY=24h
DB_PATH=./data/facturas.db
AUDIT_DB_PATH=./data/audit.db
NODE_ENV=production
PORT=5000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
ALLOWED_ORIGINS=https://mari-pepa.com,https://www.mari-pepa.com
LOG_LEVEL=info
LOG_PATH=./logs
```

**Guardar**: `CTRL+O` → `ENTER` → `CTRL+X`

### 3.2 Crear archivo .env para el FRONTEND
```bash
# Ir al frontend
cd /var/www/mari-pepa/frontend

# Crear .env.production
nano .env.production
```

**Pega este contenido:**
```env
NEXT_PUBLIC_API_URL=https://mari-pepa.com/api
NODE_ENV=production
```

**Guardar**: `CTRL+O` → `ENTER` → `CTRL+X`

**🎯 RESULTADO**: Variables de entorno configuradas solo en el servidor

---

## 📦 PASO 4: INSTALAR DEPENDENCIAS Y COMPILAR

### 4.1 Backend
```bash
cd /var/www/mari-pepa/backend

# Instalar dependencias
npm install --production

# Verificar que funciona
node server.js
```

**Si ves**: `"Servidor corriendo en puerto 5000"` → ✅ Funciona
**Presiona**: `CTRL+C` para parar

### 4.2 Frontend
```bash
cd /var/www/mari-pepa/frontend

# Instalar dependencias
npm install

# Compilar para producción
npm run build

# Verificar que se creó la carpeta .next
ls -la .next/
```

**🎯 RESULTADO**: Aplicaciones listas para ejecutar

---

## 🚦 PASO 5: ARRANCAR CON PM2 (PROCESO PERMANENTE)

### 5.1 Arrancar Backend
```bash
cd /var/www/mari-pepa/backend

# Arrancar con PM2
pm2 start server.js --name "mari-pepa-backend"

# Ver estado
pm2 status
```

### 5.2 Arrancar Frontend
```bash
cd /var/www/mari-pepa/frontend

# Arrancar con PM2
pm2 start npm --name "mari-pepa-frontend" -- start

# Ver estado
pm2 status
```

### 5.3 Guardar configuración PM2
```bash
# Guardar para que arranque automáticamente al reiniciar
pm2 save

# Configurar inicio automático
pm2 startup
# Ejecutar el comando que te muestre
```

### 5.4 Ver logs en tiempo real
```bash
# Ver logs de ambas aplicaciones
pm2 logs

# Ver solo backend
pm2 logs mari-pepa-backend

# Ver solo frontend
pm2 logs mari-pepa-frontend
```

**🎯 RESULTADO**: Aplicaciones corriendo permanentemente

---

## 🌐 PASO 6: CONECTAR DOMINIO mari-pepa.com

### Opción A: DNS con Cloudflare (RECOMENDADO)
1. **Crear cuenta en Cloudflare** (gratis): https://cloudflare.com
2. **Añadir dominio** mari-pepa.com
3. **Cambiar nameservers** en DirectAdmin:
   - Ir a DirectAdmin → DNS Management
   - Cambiar nameservers por los de Cloudflare
4. **Añadir registros DNS** en Cloudflare:
   ```
   Tipo: A
   Nombre: @
   Valor: 192.168.15.140
   Proxy: Activado 🟠
   
   Tipo: A
   Nombre: www
   Valor: 192.168.15.140
   Proxy: Activado 🟠
   ```

### Opción B: Solo cambiar DNS en DirectAdmin
1. **Ir a DirectAdmin** → DNS Management
2. **Editar registro A**:
   ```
   Tipo: A
   Host: @
   Apunta a: 192.168.15.140
   TTL: 300
   ```
3. **Editar registro www**:
   ```
   Tipo: A
   Host: www
   Apunta a: 192.168.15.140
   TTL: 300
   ```

### 6.1 Actualizar Nginx
```bash
# Editar configuración de Nginx
sudo nano /etc/nginx/sites-available/mari-pepa

# Cambiar server_name _ por:
server_name mari-pepa.com www.mari-pepa.com;

# Guardar: CTRL+O → ENTER → CTRL+X

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl reload nginx
```

**🎯 RESULTADO**: Dominio apuntando al servidor

---

## 🔒 PASO 7: CERTIFICADO SSL (HTTPS)

### 7.1 Instalar Certbot
```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Obtener certificado SSL
```bash
# Generar certificado (Certbot configura Nginx automáticamente)
sudo certbot --nginx -d mari-pepa.com -d www.mari-pepa.com

# Seguir instrucciones:
# 1. Introducir email para renovaciones
# 2. Aceptar términos
# 3. Elegir: 2 (Redirect HTTP to HTTPS)
```

### 7.3 Verificar renovación automática
```bash
# Probar renovación
sudo certbot renew --dry-run
```

**🎯 RESULTADO**: HTTPS activado con certificado válido

---

## ✅ VERIFICACIÓN FINAL

### Acceder desde navegador
1. **Acceder a**: https://mari-pepa.com
2. **Verificar**:
   - ✅ Candado verde (HTTPS)
   - ✅ Login funciona
   - ✅ Facturas se cargan
   - ✅ PDF se genera

### Comandos útiles
```bash
# Ver estado de las aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar aplicaciones
pm2 restart all

# Parar aplicaciones
pm2 stop all

# Ver uso de recursos
pm2 monit

# Ver estado de Nginx
sudo systemctl status nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Backend no arranca
```bash
# Ver logs detallados
pm2 logs mari-pepa-backend --lines 100

# Verificar .env existe
ls -la /var/www/mari-pepa/backend/.env

# Probar manualmente
cd /var/www/mari-pepa/backend
node server.js
```

### Frontend no arranca
```bash
# Ver logs detallados
pm2 logs mari-pepa-frontend --lines 100

# Verificar build existe
ls -la /var/www/mari-pepa/frontend/.next/

# Recompilar
cd /var/www/mari-pepa/frontend
npm run build
```

### Dominio no resuelve
```bash
# Verificar DNS desde el servidor
nslookup mari-pepa.com

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log
```

### Certificado SSL falla
```bash
# Verificar que el dominio apunta al servidor
nslookup mari-pepa.com
# Debe mostrar: 192.168.15.140

# Si no, esperar propagación DNS (hasta 24h)
# Mientras tanto, usar HTTP: http://192.168.15.140
```

---

## 📊 MONITORIZACIÓN

### Ver recursos en tiempo real
```bash
# CPU, RAM, procesos
htop

# Espacio en disco
df -h

# Uso por directorio
du -sh /var/www/mari-pepa/*
```

### Backups automáticos
```bash
# Crear script de backup
sudo nano /usr/local/bin/backup-mari-pepa.sh
```

**Contenido del script:**
```bash
#!/bin/bash
FECHA=$(date +%Y%m%d_%H%M%S)
cd /var/www/mari-pepa
tar -czf /var/www/mari-pepa/backup/mari-pepa-$FECHA.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  backend/ frontend/ data/

# Mantener solo últimos 7 backups
cd /var/www/mari-pepa/backup
ls -t mari-pepa-*.tar.gz | tail -n +8 | xargs rm -f
```

**Hacer ejecutable:**
```bash
sudo chmod +x /usr/local/bin/backup-mari-pepa.sh
```

**Programar backup diario:**
```bash
# Editar crontab
crontab -e

# Añadir línea (backup diario a las 3 AM):
0 3 * * * /usr/local/bin/backup-mari-pepa.sh
```

---

## 🎯 RESUMEN EJECUTIVO

| Paso | Comando Clave | Ubicación |
|------|--------------|-----------|
| 1. Subir a GitHub | `git push origin main` | Tu PC (PowerShell) |
| 2. Clonar | `git clone ...` | Servidor (PuTTY) |
| 3. Configurar .env | `nano .env` | Servidor (backend/) |
| 4. Instalar | `npm install --production` | Servidor (backend/) |
| 5. Compilar | `npm run build` | Servidor (frontend/) |
| 6. Arrancar | `pm2 start server.js` | Servidor |
| 7. DNS | Cambiar A record | DirectAdmin/Cloudflare |
| 8. SSL | `sudo certbot --nginx` | Servidor |

---

## 📞 CONTACTO Y SOPORTE

- **IP Servidor**: 192.168.15.140
- **Usuario SSH**: gmp
- **Puerto SSH**: 22
- **Dominio**: mari-pepa.com
- **Backend**: Puerto 5000 (interno)
- **Frontend**: Puerto 3000 (interno)
- **Nginx**: Puertos 80 y 443 (externos)

**¡LISTO PARA PRODUCCIÓN! 🚀**
