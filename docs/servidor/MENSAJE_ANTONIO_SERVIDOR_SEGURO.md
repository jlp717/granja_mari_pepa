# Mensaje para Antonio - Propuesta de Servidor Web Seguro

---

**Asunto:** Propuesta de equipo y arquitectura de seguridad para alojar la web de clientes

---

Hola Antonio,

Te escribo para explicarte de forma clara y detallada qué ordenador necesitamos para alojar la web de la granja, por qué hemos elegido cada componente, y las medidas de seguridad que hemos implementado para proteger la base de datos. Todo está pensado para que el sistema sea prácticamente imposible de hackear, manteniendo un coste razonable.

---

## 1) Resumen del Proyecto

Queremos montar un servidor dedicado que:
- Aloje la web donde los clientes pueden ver sus facturas, pedidos y productos
- Esté **aislado de la red corporativa** (en una VLAN separada o fuera de la red)
- Se conecte a la base de datos del IBM i **únicamente por VPN** (túnel cifrado)
- Tenga capacidad para crecer en el futuro (más usuarios, pedidos online, etc.)

---

## 2) Especificaciones del Ordenador (Equilibrio Precio/Rendimiento)

### Opción Recomendada (Balanceada)

| Componente | Especificación | Justificación |
|------------|----------------|---------------|
| **Procesador (CPU)** | Intel Core i5-13500 (14 núcleos) o AMD Ryzen 7 5700G (8 núcleos) | La web genera PDFs, procesa peticiones simultáneas y ejecuta operaciones de seguridad. Más núcleos = mejor rendimiento con varios usuarios a la vez. 8-14 núcleos es el punto óptimo calidad/precio. |
| **Memoria RAM** | 32 GB DDR4/DDR5 | La RAM es crítica para manejar muchas conexiones simultáneas, cachear datos frecuentes y procesar documentos. 32GB permite holgura para crecimiento futuro. |
| **Almacenamiento principal** | SSD NVMe de 1 TB (ej: Samsung 980 Pro, WD Black SN850) | Velocidad de lectura/escritura muy alta para arranque rápido, generación de PDFs y respuesta ágil. Los SSD NVMe son hasta 10 veces más rápidos que los discos tradicionales. |
| **Almacenamiento secundario** | Segundo SSD de 1 TB en espejo (RAID 1) o HDD de 2 TB para copias | RAID 1 duplica los datos en dos discos: si uno falla, el otro tiene la copia exacta. Esto evita perder datos por fallo de disco. |
| **Red** | 2 puertos Gigabit Ethernet (1 Gbps) | Un puerto para tráfico web, otro para VPN/gestión. Separar redes añade seguridad. |
| **Fuente de alimentación** | 500W 80+ Bronze de marca reconocida (Corsair, Seasonic, be quiet!) | Fiabilidad y protección contra picos de corriente. |
| **SAI/UPS** | 1000 VA (ej: APC Back-UPS 1000) | Protege contra apagones. Si se va la luz, el servidor sigue funcionando 10-15 minutos, tiempo suficiente para apagarlo correctamente sin corrupción de datos. |
| **Sistema Operativo** | Ubuntu Server 24.04 LTS | Gratuito, muy seguro, actualizaciones de seguridad durante 10 años. Es el estándar en servidores web a nivel mundial. |

**Coste estimado:** 800€ - 1.200€ (sin monitor ni teclado, que no son necesarios tras la configuración inicial)

### Opción Económica (Para empezar con menos inversión)

| Componente | Especificación |
|------------|----------------|
| **CPU** | Intel Core i5-12400 (6 núcleos) o AMD Ryzen 5 5600 |
| **RAM** | 16 GB DDR4 (ampliable a 32 GB después) |
| **Almacenamiento** | SSD NVMe 512 GB + copia en disco externo o NAS |
| **Red** | 1 puerto Gigabit |
| **SAI** | 600 VA |

**Coste estimado:** 500€ - 700€

Esta opción funciona perfectamente para empezar y se puede ampliar más adelante añadiendo RAM o un segundo disco.

---

## 3) Cómo Protegemos la Base de Datos con VPN

### ¿Qué es la VPN y por qué la usamos?

Imagina que la base de datos está en una caja fuerte dentro de la oficina. La VPN es como un túnel blindado exclusivo que conecta el servidor web con esa caja fuerte. 

- **Solo el servidor web puede usar ese túnel** (nadie más tiene la llave)
- **Todo lo que viaja por el túnel está cifrado** (aunque alguien lo intercepte, no puede leerlo)
- **La base de datos rechaza cualquier conexión que no venga por el túnel**

### Diagrama simplificado:

```
INTERNET
    │
    ▼
┌─────────────────┐
│  CLOUDFLARE     │  ← Filtro de ataques DDoS y tráfico malicioso
│  (Escudo)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SERVIDOR WEB   │  ← El ordenador que vamos a comprar
│  (Fuera red)    │     Solo ejecuta la web, no tiene datos
└────────┬────────┘
         │
    ┌────┴────┐
    │   VPN   │  ← Túnel cifrado (WireGuard)
    │ PRIVADA │     Solo permite conexión a la base de datos
    └────┬────┘
         │
         ▼
┌─────────────────┐
│  FIREWALL       │  ← Solo acepta conexiones del servidor web
│  EMPRESA        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IBM i          │  ← Base de datos
│  (Base datos)   │     Cuenta con permisos mínimos
└─────────────────┘
```

### ¿Qué pasa si hackean el servidor web?

Incluso en el peor caso (que alguien consiga entrar al servidor web):

1. **No ven la red de la empresa**: El servidor está aislado, no tiene acceso a otros ordenadores ni servidores internos.

2. **La conexión a la base de datos está limitada**: La cuenta que usa el servidor web solo puede:
   - LEER ciertas tablas específicas (las de facturas, clientes, productos)
   - NO puede modificar, borrar ni añadir datos
   - NO puede acceder a tablas de contabilidad, nóminas u otras áreas

3. **El atacante no puede "vaciar" la base de datos**: Las consultas están limitadas (máximo 200 registros por petición) y el sistema detecta accesos masivos anómalos.

4. **Hay registro de todo**: Cada acceso queda registrado con IP, hora, usuario y qué datos se consultaron. Podemos detectar y bloquear actividad sospechosa.

---

## 4) Medidas de Seguridad Implementadas (Resumen para no técnicos)

Hemos implementado **10 capas de seguridad** que un atacante tendría que superar para acceder al sistema:

### Capa 1: Lista negra de atacantes
Si una dirección IP hace cosas sospechosas (intentos de hackeo), se bloquea automáticamente durante 1 hora.

### Capa 2: Detección de herramientas de ataque
El sistema reconoce cuando alguien usa programas de hacking conocidos (SQLMap, Nikto, Burp, etc.) y los bloquea inmediatamente.

### Capa 3: Verificación de peticiones
Comprobamos que cada petición sea "normal" y no contenga trucos para saltarse la seguridad.

### Capa 4: Análisis de contenido malicioso
Buscamos patrones de ataque conocidos en todo lo que envían los usuarios:
- Inyección de código SQL (para manipular la base de datos) → BLOQUEADO
- Inyección de scripts maliciosos (XSS) → BLOQUEADO
- Intentos de acceder a archivos del servidor → BLOQUEADO

### Capa 5: Trampas para robots
Colocamos "campos trampa" invisibles. Los usuarios normales no los ven, pero los robots de ataque los rellenan automáticamente y se delatan.

### Capa 6: Identificación de dispositivos
Cada dispositivo que accede tiene una "huella digital". Si alguien roba una sesión e intenta usarla desde otro ordenador, lo detectamos.

### Capa 7: Tokens de seguridad
Cada operación importante (como ver facturas o cambiar datos) requiere un código temporal firmado que solo el servidor puede generar.

### Capa 8: Límites de velocidad
- Máximo 5 intentos de login cada 15 minutos
- Máximo 100 peticiones por minuto
- Si alguien supera estos límites, se bloquea temporalmente

### Capa 9: Sesiones seguras
- Las sesiones caducan a los 15 minutos de inactividad
- Si cambias de ordenador/navegador, tienes que volver a entrar
- Máximo 5 sesiones simultáneas por usuario

### Capa 10: Registro completo
Todo queda registrado: quién accedió, cuándo, desde dónde, y qué datos consultó. Esto permite detectar anomalías y auditar accesos.

### Protección adicional: Cada cliente solo ve SUS datos
Un cliente autenticado NO puede ver las facturas, pedidos o información de otros clientes. El sistema verifica en cada petición que el cliente solo acceda a lo suyo.

---

## 5) Copias de Seguridad y Recuperación

### Plan de copias:
- **Copia diaria automática** de la configuración del servidor y logs
- **La base de datos se respalda desde el IBM i** (sistema existente)
- **Copia semanal completa** en ubicación externa (NAS o disco)
- **Retención de 30 días** de copias

### En caso de desastre:
- Si el servidor falla: podemos restaurar en un nuevo equipo en menos de 2 horas
- Si la base de datos tiene problemas: restauración desde backup del IBM i
- Los logs de auditoría permiten saber exactamente qué pasó

---

## 6) Escalabilidad (Pensando en el Futuro)

El sistema está preparado para crecer:

| Situación | Solución |
|-----------|----------|
| Más usuarios simultáneos | Añadir más RAM (fácil y barato) |
| Más productos/pedidos | Añadir más almacenamiento SSD |
| Pedidos online en tiempo real | El servidor ya tiene capacidad suficiente |
| Mucho más tráfico | Mover el frontend a Netlify/Vercel y dejar el servidor solo como API |
| Necesidad de alta disponibilidad | Añadir un segundo servidor como respaldo |

---

## 7) Checklist para IT / Compras

### Para comprar:
- [ ] CPU: Intel Core i5-13500 o AMD Ryzen 7 5700G
- [ ] Placa base compatible con 2 ranuras M.2 NVMe
- [ ] 32 GB RAM DDR4/DDR5
- [ ] 2x SSD NVMe 1TB (para RAID 1)
- [ ] Fuente 500W 80+ Bronze
- [ ] SAI/UPS 1000 VA
- [ ] Caja de torre/rack si es necesario
- [ ] Cable Ethernet Cat6

### Para configurar (IT):
- [ ] Instalar Ubuntu Server 24.04 LTS
- [ ] Configurar RAID 1 (espejo de discos)
- [ ] Instalar Node.js 20 LTS
- [ ] Configurar VPN WireGuard hacia la red del IBM i
- [ ] Configurar firewall (ufw) para permitir solo puertos necesarios
- [ ] Instalar y configurar el backend de la web
- [ ] Configurar copias de seguridad automáticas
- [ ] Probar conexión web → VPN → base de datos
- [ ] Configurar monitorización y alertas

### Tiempo estimado de configuración:
- Montaje del hardware: 1-2 horas
- Instalación y configuración base: 2-3 horas
- Configuración de VPN y seguridad: 2-3 horas
- Pruebas y ajustes: 1-2 horas
- **Total: 1 día de trabajo**

---

## 8) Respuesta a la Pregunta Clave

> **¿Es imposible de hackear?**

Ningún sistema es 100% imposible de hackear. Pero con las medidas implementadas:

1. **El nivel de seguridad es comparable al de aplicaciones bancarias**
2. **Un atacante tendría que superar 10+ capas de protección**
3. **Cualquier actividad sospechosa activa alertas y bloqueos automáticos**
4. **Incluso si alguien entrara, no puede modificar ni borrar datos de la base**
5. **Todo queda registrado para auditoría**

La combinación de:
- Servidor aislado de la red
- Conexión por VPN cifrada
- Cuenta de base de datos con permisos mínimos (solo lectura)
- 10 capas de protección en el código
- Auditoría completa de accesos

Hace que el riesgo sea extremadamente bajo y el impacto potencial muy limitado.

---

## 9) Próximos Pasos

1. **Aprobar el presupuesto** para el hardware (800€-1.200€ opción balanceada)
2. **Definir la ubicación física** del servidor (fuera de la red principal)
3. **Coordinar con el responsable de red** para configurar la VPN
4. **Planificar la instalación** (1 día de trabajo)
5. **Realizar pruebas de seguridad** antes de poner en producción

---

¿Tienes alguna duda o necesitas que amplíe algún punto?

Un saludo,
Javier

---

*Documentación técnica detallada disponible en: `SECURITY_FORTRESS_DOCS.md`*
