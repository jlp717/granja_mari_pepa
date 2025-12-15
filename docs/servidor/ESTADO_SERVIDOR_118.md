# 🔍 ANÁLISIS DEL SERVIDOR 192.168.1.118

## Fecha: 21/11/2025

---

## 📊 Estado Actual del Servidor

### ✅ Conectividad
- **IP**: 192.168.1.118
- **Ping**: ✅ Responde correctamente
- **Latencia**: ~1ms (red local)

### 🔓 Puertos Abiertos
| Puerto | Estado | Servicio |
|--------|--------|----------|
| 80 | ✅ ABIERTO | HTTP (nginx) |
| 443 | ✅ ABIERTO | HTTPS |
| 5000 | ✅ ABIERTO | **Disponible para nuestra API** |
| 22 | ❌ Cerrado | SSH |
| 3389 | ❌ Cerrado | RDP |
| 5985/5986 | ❌ Cerrado | PowerShell Remoting |

### 🖥️ Sistema Operativo
- **Detectado**: Linux con **nginx**
- **Panel de control**: No detectado en puertos estándar

---

## 🚫 Problemas Encontrados

### 1. Sin acceso administrativo
- ❌ SSH no disponible (puerto 22 cerrado)
- ❌ RDP no disponible (puerto 3389 cerrado)
- ❌ PowerShell Remoting no habilitado
- ❌ Carpetas compartidas (SMB) bloqueadas
- ❌ FTP no detectado

### 2. Servidor muy restringido
El servidor tiene configuración de seguridad alta:
- Solo puertos HTTP/HTTPS abiertos
- No hay acceso remoto configurado
- No hay paneles de control accesibles

---

## ✅ SOLUCIONES DISPONIBLES

### **Opción 1: Acceso Físico al Servidor (RECOMENDADO)**

Si puedes acceder físicamente al servidor .118:

1. **Conéctate localmente**:
   - Monitor + teclado directamente en el servidor
   - O si está virtualizado, accede por consola del hipervisor

2. **Ejecuta estos comandos** (si es Linux):
```bash
# Ver sistema operativo
cat /etc/os-release

# Habilitar SSH temporalmente
sudo systemctl start ssh
sudo systemctl enable ssh

# Abrir puerto SSH en firewall
sudo ufw allow 22/tcp
# o si usa firewalld:
sudo firewall-cmd --add-port=22/tcp --permanent
sudo firewall-cmd --reload
```

3. **Desde tu PC, conéctate**:
```powershell
# Instalar OpenSSH en Windows (si no lo tienes)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Conectar
ssh usuario@192.168.1.118
```

---

### **Opción 2: Habilitar Panel Web**

Si el servidor tiene DirectAdmin, cPanel, Webmin, etc.:

1. Pregunta al administrador del servidor por las credenciales
2. Accede via navegador a uno de estos:
   - http://192.168.1.118:2222
   - https://192.168.1.118:2083
   - http://192.168.1.118:10000

---

### **Opción 3: Usar el Servidor Web Actual**

Dado que nginx está corriendo:

1. **Accede al servidor físicamente**
2. **Crea una carpeta para la API**:
```bash
sudo mkdir -p /var/www/granja-mari-pepa
sudo chown -R $USER:$USER /var/www/granja-mari-pepa
```

3. **Desde tu PC, copia vía SCP** (requiere SSH habilitado):
```powershell
scp -r .\backend usuario@192.168.1.118:/var/www/granja-mari-pepa/
```

---

### **Opción 4: Usar Compartición de Red**

1. **En el servidor .118** (acceso físico):
```bash
# Instalar Samba
sudo apt install samba

# Crear carpeta compartida
sudo mkdir -p /srv/granja-mari-pepa
sudo chmod 777 /srv/granja-mari-pepa

# Configurar Samba
sudo nano /etc/samba/smb.conf
# Agregar:
[granja]
path = /srv/granja-mari-pepa
writable = yes
guest ok = yes
```

2. **Desde tu PC**:
```powershell
Copy-Item -Path .\backend -Destination \\192.168.1.118\granja -Recurse
```

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Paso 1: Obtener Acceso
**Necesitas uno de estos:**
- [ ] Credenciales SSH (usuario + contraseña)
- [ ] Acceso físico al servidor
- [ ] Credenciales del panel de control web
- [ ] Usuario con permisos para habilitar SSH

### Paso 2: Una vez tengas acceso, ejecutar
```bash
# Verificar sistema
uname -a
cat /etc/os-release

# Verificar Node.js
node --version

# Verificar servicios corriendo
sudo systemctl status nginx
sudo ss -tulpn | grep LISTEN
```

### Paso 3: Instalar lo necesario
```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

### Paso 4: Copiar y configurar backend
Una vez tengamos acceso, ejecutaré automáticamente:
- Copia del código backend
- Instalación de dependencias
- Configuración de PM2
- Configuración de nginx como proxy
- Arranque automático

---

## 📞 ¿QUÉ NECESITO DE TI?

**Selecciona UNA de estas opciones:**

**A) Tengo acceso físico al servidor**
   → Te daré comandos para habilitar SSH desde allí

**B) Tengo credenciales SSH**
   → Usuario: ________
   → Contraseña: ________
   → (o dame acceso a la clave privada .pem)

**C) Tengo acceso a panel web**
   → URL: ________
   → Usuario: ________
   → Contraseña: ________

**D) No tengo ningún acceso**
   → Necesitas contactar al administrador del servidor
   → Pídele que habilite SSH temporalmente
   → O que instale el backend manualmente siguiendo GUIA_CONFIGURACION_SERVIDOR_118.md

---

## 🔐 Nota de Seguridad

**¿Por qué está tan cerrado el servidor?**
Es bueno que esté así. Los servidores de producción deben estar cerrados por defecto.

**Una vez configurado SSH**, podremos:
1. Configurar autenticación por clave (sin contraseña)
2. Deshabilitar SSH de nuevo si lo deseas
3. Acceder solo desde tu IP específica

---

## ⏭️ Siguientes Pasos

Una vez me proporciones el acceso (opción A, B, C o D), continuaré automáticamente con:
1. ✅ Instalación de Node.js
2. ✅ Configuración de ODBC para IBM i
3. ✅ Copia y configuración del backend
4. ✅ Instalación de PM2
5. ✅ Configuración de nginx como proxy reverso
6. ✅ Certificados SSL con Let's Encrypt
7. ✅ Arranque automático al iniciar el servidor
8. ✅ Pruebas de conectividad

**Todo automático, solo necesito el acceso inicial.**
