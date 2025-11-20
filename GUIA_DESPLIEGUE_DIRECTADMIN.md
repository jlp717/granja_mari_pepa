# 🚀 GUÍA DE DESPLIEGUE DIRECTADMIN - MARI PEPA

## 📋 SITUACIÓN ACTUAL

**Lo que tienes:**
- ✅ Servidor DirectAdmin (clientes61.dnspropio.com)
- ✅ IBM i en la misma red local (192.168.1.22)
- ✅ DNS configurado (api.mari-pepa.com → 185.14.57.121)
- ✅ SSL disponible (Let's Encrypt)
- ✅ SSH activo en el servidor

**Lo que vamos a hacer:**
1. Conectar por SSH al servidor
2. Instalar Node.js y PM2
3. Subir el backend de la API
4. Configurar proxy reverso
5. Habilitar SSL
6. Actualizar frontend

---

## 🔐 PASO 1: OBTENER ACCESO SSH

### Opción A: Desde DirectAdmin

1. Busca en el panel una opción llamada:
   - "SSH Access" / "Acceso SSH"
   - "Terminal" / "Shell Access"
   - "Jailed SSH" / "SSH enjaulado"

2. O contacta al administrador del servidor y pide:
   - Usuario SSH
   - Contraseña SSH
   - Puerto SSH (normalmente 22 o 2222)

### Opción B: Usar tus credenciales actuales

Prueba conectar con:
- **Usuario:** `grajama` (tu usuario de DirectAdmin)
- **Host:** `clientes61.dnspropio.com` o `185.14.57.121`
- **Puerto:** `22` o `2222`

---

## 💻 PASO 2: CONECTAR POR SSH

Desde tu PC (PowerShell), ejecuta:

```powershell
ssh grajama@clientes61.dnspropio.com

# Si usa puerto 2222:
ssh -p 2222 grajama@clientes61.dnspropio.com

# O con IP directa:
ssh grajama@185.14.57.121
```

Introduce la contraseña cuando te la pida.

**Si conecta correctamente, verás algo como:**
```
[grajama@clientes61 ~]$
```

---

## 📦 PASO 3: EJECUTAR SCRIPT DE INSTALACIÓN

Una vez conectado por SSH, ejecuta estos comandos:

### 3.1 Descargar el script

```bash
# Crear directorio temporal
mkdir -p ~/temp
cd ~/temp

# Descargar el repositorio
git clone https://github.com/jlp717/granja_mari_pepa.git
cd granja_mari_pepa/backend/scripts

# Dar permisos de ejecución
chmod +x setup-directadmin.sh
```

### 3.2 Ejecutar instalación

```bash
./setup-directadmin.sh
```

**Esto hará automáticamente:**
1. ✅ Instalar Node.js 20
2. ✅ Instalar PM2 (gestor de procesos)
3. ✅ Clonar el repositorio
4. ✅ Instalar dependencias
5. ✅ Configurar variables de entorno
6. ✅ Generar JWT secrets
7. ✅ Iniciar la API
8. ✅ Verificar que funciona

**Tiempo estimado:** 5-10 minutos

### 3.3 Verificar instalación

Al finalizar, verás un resumen. Verifica que responde:

```bash
curl http://localhost:5000/health
```

Debería responder:
```json
{
  "uptime": 12.34,
  "message": "All systems operational",
  "checks": {
    "server": "ok",
    "database": "ok"
  }
}
```

✅ **Si funciona, continúa al siguiente paso.**

---

## 🌐 PASO 4: CONFIGURAR DOMINIO EN DIRECTADMIN

### 4.1 Crear Subdominio

En DirectAdmin:

1. Ve a **"Gestión de Dominios"** → **"Gestión de Subdominios"**
2. Añadir nuevo subdominio:
   - **Nombre:** `api`
   - **Dominio:** `mari-pepa.com`
   - **Document Root:** `/home/grajama/domains/api.mari-pepa.com/public_html`

3. Haz clic en **"Crear"**

### 4.2 Configurar Proxy Reverso

Por SSH, copia la configuración:

```bash
# Ir al directorio del subdominio
cd ~/domains/api.mari-pepa.com/public_html

# Crear archivo .htaccess
cat > .htaccess <<'EOF'
RewriteEngine On

# Proxy reverso a la API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# Headers CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Headers de seguridad
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
EOF
```

### 4.3 Verificar Proxy

```bash
curl http://api.mari-pepa.com/health
```

Debería dar la misma respuesta que `localhost:5000/health`.

---

## 🔒 PASO 5: HABILITAR SSL (HTTPS)

### 5.1 En DirectAdmin

1. Ve a **"Certificados SSL"**
2. Selecciona el dominio: **`api.mari-pepa.com`**
3. Marca: **"Free & automatic certificate from Let's Encrypt"**
4. En **"Nombre del dominio"** confirma: `api.mari-pepa.com`
5. Haz clic en **"Grabar"**

Esto creará automáticamente un certificado SSL gratuito.

### 5.2 Verificar SSL

Espera 2-3 minutos y luego prueba:

```bash
curl https://api.mari-pepa.com/health
```

O abre en el navegador: https://api.mari-pepa.com/health

✅ **Si funciona con HTTPS, ¡perfecto!**

---

## 🎨 PASO 6: ACTUALIZAR FRONTEND

### 6.1 En Netlify

1. Ve a tu sitio en Netlify
2. **Site settings** → **Environment variables**
3. Añadir o editar:

```
NEXT_PUBLIC_API_URL = https://api.mari-pepa.com/api
```

4. Guardar cambios

### 6.2 Re-desplegar

Netlify re-desplegará automáticamente, o puedes forzarlo:

1. **Deploys** → **Trigger deploy** → **Deploy site**

Espera 1-2 minutos.

### 6.3 Probar Login

1. Abre https://mari-pepa.com
2. Intenta hacer login:
   - **Usuario:** `4300009900`
   - **Password:** `23224478K`

✅ **Si funciona, ¡TODO COMPLETADO!** 🎉

---

## 🔧 MANTENIMIENTO

### Ver Estado de la API

```bash
pm2 status
```

### Ver Logs

```bash
pm2 logs mari-pepa-api
```

### Reiniciar API

```bash
pm2 restart mari-pepa-api
```

### Detener API

```bash
pm2 stop mari-pepa-api
```

### Actualizar a Nueva Versión

```bash
cd ~/mari-pepa-api/backend
git pull origin main
npm install
pm2 restart mari-pepa-api
```

### Ver Métricas en Tiempo Real

```bash
pm2 monit
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema: "Connection refused" al hacer SSH

**Solución:**
```bash
# Probar con puerto 2222
ssh -p 2222 grajama@clientes61.dnspropio.com

# O probar con IP directa
ssh grajama@185.14.57.121
```

### Problema: API no responde

**Solución:**
```bash
# Ver logs
pm2 logs mari-pepa-api --lines 50

# Verificar que está corriendo
pm2 status

# Reiniciar
pm2 restart mari-pepa-api
```

### Problema: "Cannot connect to database"

**Solución:**
```bash
# Verificar que puedes hacer ping al IBM i
ping 192.168.1.22

# Verificar variables de entorno
cat ~/mari-pepa-api/backend/.env | grep ODBC

# Verificar credenciales de la base de datos
```

### Problema: SSL no funciona

**Causa:** Let's Encrypt no pudo validar el dominio

**Solución:**
1. Verificar que DNS está configurado: `nslookup api.mari-pepa.com`
2. Verificar que el dominio responde en HTTP primero
3. Reintentar obtener certificado SSL en DirectAdmin

### Problema: Frontend no conecta con API

**Solución:**
1. Verificar variable en Netlify: `NEXT_PUBLIC_API_URL`
2. Debe ser: `https://api.mari-pepa.com/api` (con /api al final)
3. Re-desplegar frontend en Netlify
4. Limpiar caché del navegador (Ctrl+Shift+R)

---

## ✅ CHECKLIST FINAL

- [ ] SSH funciona (puedo conectar al servidor)
- [ ] Script de instalación ejecutado sin errores
- [ ] API responde en `http://localhost:5000/health`
- [ ] Subdominio `api.mari-pepa.com` creado en DirectAdmin
- [ ] Archivo `.htaccess` creado con proxy reverso
- [ ] API responde en `http://api.mari-pepa.com/health`
- [ ] SSL habilitado en DirectAdmin para `api.mari-pepa.com`
- [ ] API responde en `https://api.mari-pepa.com/health`
- [ ] Variable `NEXT_PUBLIC_API_URL` actualizada en Netlify
- [ ] Frontend re-desplegado en Netlify
- [ ] Login funciona desde https://mari-pepa.com

**Si todos están marcados:** ¡SISTEMA EN PRODUCCIÓN! 🚀🎉

---

## 📞 COMANDOS DE REFERENCIA RÁPIDA

```bash
# Conectar SSH
ssh grajama@clientes61.dnspropio.com

# Ver estado
pm2 status

# Ver logs
pm2 logs mari-pepa-api

# Reiniciar
pm2 restart mari-pepa-api

# Actualizar
cd ~/mari-pepa-api/backend && git pull && npm install && pm2 restart mari-pepa-api

# Ver health check
curl https://api.mari-pepa.com/health
```

---

¡LISTO PARA DESPLEGAR! 🎉
