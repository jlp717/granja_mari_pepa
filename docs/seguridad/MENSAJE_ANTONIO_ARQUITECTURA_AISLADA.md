# Mensaje para Antonio - Servidor Web con Máxima Seguridad

---

**Asunto:** Propuesta de servidor web 100% aislado - La base de datos está COMPLETAMENTE PROTEGIDA

---

Hola Antonio,

Te explico la solución que hemos diseñado para que la web de clientes sea **prácticamente imposible de hackear**. Lo más importante: **aunque un hacker entrara en el servidor web, no podría acceder a la base de datos del IBM i porque NO EXISTE CONEXIÓN entre ellos**.

---

## 🔒 CONCEPTO CLAVE: Aislamiento Total

El servidor web nuevo **NO se conecta al IBM i**. No hay cables, no hay VPN, no hay nada que los una.

### ¿Cómo funciona entonces?

```
                                         ┌─────────────────┐
    INTERNET                             │    IBM i        │
        │                                │  (Base datos    │
        │                                │   REAL)         │
        ▼                                └────────┬────────┘
┌───────────────┐                                 │
│  CLOUDFLARE   │                                 │ 1. Cada noche, se
│  (Protección) │                                 │    exportan los datos
└───────┬───────┘                                 │    a archivos JSON
        │                                         │
        │                                         ▼
        │                                ┌─────────────────┐
        │                                │   SFTP          │
        │                                │   (Envío seguro │
        │                                │    de archivos) │
        ▼                                └────────┬────────┘
┌───────────────────┐                             │
│  SERVIDOR WEB     │◄────────────────────────────┘
│  (192.168.1.118)  │     2. Los archivos llegan
│                   │        al servidor web
│  SQLite local     │     3. Se importan a una
│  (copia de datos) │        base de datos LOCAL
└───────────────────┘
        │
        │ 4. Los clientes
        │    consultan la
        │    copia local
        ▼
    CLIENTES WEB
```

### ¿Qué ve un hacker si entra al servidor?

**NADA ÚTIL:**
- ❌ No hay conexión al IBM i (no existe)
- ❌ No hay credenciales del IBM i (no las hay)
- ❌ No hay forma de llegar al IBM i (está en red separada)
- ✅ Solo ve una copia de datos de CONSULTA (no puede modificar nada en el IBM i)
- ✅ Los datos más sensibles (contraseñas) están cifrados

**Es como si un ladrón entrara en la tienda pero la caja fuerte estuviera en otro edificio al que no puede llegar.**

---

## 🖥️ Especificaciones del Ordenador

### Opción Recomendada (800€ - 1.200€)

| Componente | Especificación | Para qué sirve |
|------------|----------------|----------------|
| **CPU** | Intel Core i5-13500 (14 núcleos) o AMD Ryzen 7 5700G | Procesar múltiples clientes a la vez, generar PDFs |
| **RAM** | 32 GB DDR4/DDR5 | Mantener datos en caché, respuesta rápida |
| **Disco** | SSD NVMe 1 TB | Almacenar la copia de datos + respuesta instantánea |
| **Red** | 2 puertos Gigabit | Separar tráfico web de gestión |
| **SAI** | 1000 VA | Protección contra apagones |
| **Sistema** | Ubuntu Server 24.04 LTS | Gratuito, muy seguro, 10 años de soporte |

### Opción Económica (500€ - 700€)

| Componente | Especificación |
|------------|----------------|
| **CPU** | Intel Core i5-12400 (6 núcleos) |
| **RAM** | 16 GB DDR4 |
| **Disco** | SSD NVMe 512 GB |
| **SAI** | 600 VA |

---

## 🛡️ Las 10 Capas de Seguridad Implementadas

He implementado un sistema de **10 capas de seguridad**. Un hacker tendría que superar TODAS para hacer algo malo:

### Capa 1: Cloudflare (Escudo exterior)
- Filtra ataques DDoS (cuando miles de bots intentan tumbar la web)
- Bloquea países sospechosos (Rusia, China, etc. no pueden ni conectar)
- Analiza cada petición antes de que llegue al servidor

### Capa 2: Detección de herramientas de hackeo
- El sistema detecta automáticamente si alguien usa SQLMap, Nikto, Burp Suite u otras herramientas de hackers
- IP baneada inmediatamente por 24 horas

### Capa 3: Análisis de patrones de ataque
- Más de 50 patrones de ataque conocidos (inyección SQL, XSS, etc.)
- Si detecta alguno → IP baneada

### Capa 4: Honeypots (trampas)
- Hay URLs falsas que parecen jugosas para hackers (/admin, /phpmyadmin, /wp-admin)
- Si un hacker las visita → sabemos que es atacante → IP baneada

### Capa 5: Limitación de velocidad
- Máximo 100 peticiones por minuto por IP
- Si alguien pide más → bloqueado (los hackers hacen miles de peticiones por minuto)

### Capa 6: Tokens anti-falsificación (CSRF)
- Cada formulario tiene un código secreto único
- Sin ese código, el servidor ignora la petición
- Un hacker no puede falsificar peticiones

### Capa 7: Autenticación doble (2FA)
- Los clientes pueden activar verificación por email
- Aunque roben la contraseña, necesitan el código del email

### Capa 8: Tokens de sesión rotativos
- La "llave" de sesión cambia cada 15 minutos
- Si un hacker roba una llave vieja, ya no sirve

### Capa 9: Registros de auditoría
- Todo queda registrado: quién entra, qué consulta, desde dónde
- Si pasa algo raro, podemos investigarlo

### Capa 10: Base de datos local aislada
- **LA MÁS IMPORTANTE**: El servidor NO tiene acceso al IBM i
- Solo tiene una copia de datos para consulta
- Aunque hackeen el servidor, no pueden llegar a la base de datos real

---

## 📊 Tamaño de los datos

La copia local ocupa muy poco espacio:

| Tabla | Registros aprox. | Tamaño |
|-------|------------------|--------|
| Clientes | ~1.000 | 5 MB |
| Facturas (2 años) | ~50.000 | 200 MB |
| Productos | ~5.000 | 10 MB |
| Precios personalizados | ~20.000 | 30 MB |
| **TOTAL** | | **~250 MB** |

Un disco de 500 GB es más que suficiente (y nos sobra el 99%).

---

## 🔄 Sincronización de datos

### ¿Cómo llegan los datos al servidor web?

1. **Cada noche a las 3:00 AM**, un script en el IBM i exporta:
   - Clientes activos
   - Facturas de los últimos 2 años
   - Productos y precios

2. **Los archivos JSON se envían por SFTP** al servidor web
   - SFTP = como FTP pero cifrado y seguro
   - El servidor web NO puede conectarse al IBM i (sentido único)

3. **El servidor web importa** los datos a su base de datos local (SQLite)

### Ventajas de este sistema:

✅ **Datos siempre actualizados** (máximo 24 horas de retraso)  
✅ **Si el servidor web cae**, el IBM i sigue funcionando normal  
✅ **Si hackean el servidor web**, no pueden hacer nada en el IBM i  
✅ **No hay credenciales** del IBM i en el servidor web  

---

## 💡 Resumen ejecutivo

| Aspecto | Solución |
|---------|----------|
| **¿Cómo se protege el IBM i?** | No hay conexión. Punto. |
| **¿Qué pasa si hackean el servidor?** | Solo ven datos de consulta, no pueden modificar nada |
| **¿Cuánto cuesta el servidor?** | 500€-1.200€ según opciones |
| **¿Es complicado de mantener?** | No, se actualiza solo cada noche |
| **¿Afecta al rendimiento?** | No, los clientes consultan la copia local (más rápido incluso) |

---

## ❓ Preguntas frecuentes

### ¿Por qué no conectar directamente al IBM i?
Porque si hay conexión, existe riesgo. Sin conexión = sin riesgo. Es así de simple.

### ¿Los datos estarán desactualizados?
Máximo 24 horas. Para consultar facturas e histórico, es más que suficiente. Si un cliente hace un pedido hoy, mañana ya lo verá en la web.

### ¿Y si necesitamos datos en tiempo real?
Para funcionalidades futuras que requieran tiempo real, se puede implementar una sincronización más frecuente (cada hora o cada 15 minutos).

### ¿Quién ejecuta el script de exportación?
El script se ejecuta automáticamente en el IBM i (o en un PC de la oficina con acceso al IBM i). Tú solo tienes que programar la tarea.

---

## 📝 Pasos siguientes

1. **Aprobar presupuesto** del servidor (500€-1.200€)
2. **Comprar el equipo** (puedo darte enlaces específicos)
3. **Instalar Ubuntu Server** (te puedo ayudar)
4. **Configurar sincronización** (un par de horas)
5. **¡Listo!** Web funcionando de forma segura

---

Si tienes cualquier duda, me dices. He intentado explicarlo de forma clara pero hay mucho detalle técnico detrás.

Un saludo,
Javier
