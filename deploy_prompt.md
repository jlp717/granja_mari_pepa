### Prompt para Despliegue Completo de la Web "Granja Mari Pepa"

#### Contexto del Proyecto
- **Dominio**: `https://mari-pepa.com` (gestionado en Sys4Net, con posibilidad de usar Cloudflare).
- **Servidor**: Ubuntu Server (IP interna: `192.168.1.230`), ya en uso con PM2 para otra aplicación.
- **Backend**:
  - Framework: Express.
  - Dependencias clave: `odbc`, `pdfkit`, `jsonwebtoken`, etc.
  - Script de producción: `npm run start`.
  - Variables de entorno: `.env`.
- **Frontend**:
  - Framework: Next.js.
  - Script de producción: `npm run build` y `npm run start`.

#### Objetivo
Automatizar el despliegue completo del proyecto para que esté accesible desde `https://mari-pepa.com`, sin necesidad de ejecutar manualmente `npm run dev` en dos terminales. La solución debe ser profesional y robusta, utilizando herramientas como PM2, Nginx y Let's Encrypt.

---

### Pasos para la IA

#### 1. Configuración del Servidor
1. **Actualizar el sistema**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **Instalar Node.js y PM2**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```
3. **Instalar Nginx**:
   ```bash
   sudo apt install -y nginx
   ```

#### 2. Configuración del Backend
1. **Subir el código al servidor** (usando `scp` o Git).
2. **Instalar dependencias**:
   ```bash
   cd /ruta/backend
   npm install --production
   ```
3. **Configurar PM2 para el backend**:
   ```bash
   pm2 start server.js --name "backend-mari-pepa"
   pm2 save
   pm2 startup
   ```

#### 3. Configuración del Frontend
1. **Subir el código al servidor**.
2. **Instalar dependencias y generar la build**:
   ```bash
   cd /ruta/frontend
   npm install
   npm run build
   ```
3. **Configurar PM2 para el frontend**:
   ```bash
   pm2 start npm --name "frontend-mari-pepa" -- start
   pm2 save
   ```

#### 4. Configuración de Nginx
1. **Crear un archivo de configuración para el dominio**:
   ```bash
   sudo nano /etc/nginx/sites-available/mari-pepa.com
   ```
   Contenido del archivo:
   ```nginx
   server {
       listen 80;
       server_name mari-pepa.com www.mari-pepa.com;

       location /api/ {
           proxy_pass http://localhost:3000; # Puerto del backend
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location / {
           proxy_pass http://localhost:3001; # Puerto del frontend
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
2. **Habilitar la configuración y reiniciar Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mari-pepa.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### 5. Configuración de SSL con Let's Encrypt
1. **Instalar Certbot**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. **Generar certificados SSL**:
   ```bash
   sudo certbot --nginx -d mari-pepa.com -d www.mari-pepa.com
   ```
3. **Configurar renovación automática**:
   ```bash
   sudo certbot renew --dry-run
   ```

#### 6. Configuración del Dominio
1. **Apuntar el dominio a la IP pública del servidor** desde Sys4Net.
2. **Configurar Cloudflare** (opcional):
   - Activar HTTPS completo.
   - Configurar reglas de caché si es necesario.

#### 7. Verificación Final
1. **Probar el dominio**: Acceder a `https://mari-pepa.com` desde un navegador.
2. **Verificar logs**:
   ```bash
   pm2 logs
   sudo tail -f /var/log/nginx/error.log
   ```

---

### Notas Adicionales
- Asegurarse de que el backend y frontend no usen puertos en conflicto con otros servicios.
- Documentar cualquier cambio manual realizado en el servidor.
- Si hay problemas con la base de datos, verificar la conexión ODBC y las credenciales en el archivo `.env` del backend.