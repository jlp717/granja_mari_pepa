# 🌐 Configuración DNS en DirectAdmin - Mari Pepa

## 📋 Paso 1: Añadir Registro para API

### En el Panel DirectAdmin

1. **Ir a:** Gestión de DNS / DNS Management
2. **Seleccionar dominio:** mari-pepa.com
3. **Añadir nuevo registro A:**

```
Nombre: api
Tipo: A
Valor/IP: 185.14.57.121
TTL: 14400 (o dejar por defecto)
```

### Vista Previa del Resultado

Después de guardar, deberías ver en la lista:

| Nombre | Tipo | Valor |
|--------|------|-------|
| api.mari-pepa.com | A | 185.14.57.121 |

## ✅ Verificación

Después de 5-10 minutos, verifica que funciona:

### Desde PowerShell en tu PC:

```powershell
nslookup api.mari-pepa.com
```

**Resultado esperado:**
```
Servidor: [tu DNS]
Dirección: [IP del DNS]

Nombre: api.mari-pepa.com
Address: 185.14.57.121
```

### O desde navegador:

Visita: http://api.mari-pepa.com

(Todavía no funcionará la API, pero al menos debería responder algo o dar un error del servidor, no "dominio no encontrado")

## 🎯 ¿Qué Acabas de Hacer?

Has creado un "atajo" para que cuando alguien escriba `api.mari-pepa.com`, su navegador sepa que debe ir a `185.14.57.121`.

Es como poner un cartel en la autopista:
- **Antes:** "No sé dónde está api.mari-pepa.com" ❌
- **Ahora:** "api.mari-pepa.com está en 185.14.57.121" ✅

---

## 📸 Captura de Pantalla de Referencia

Tu configuración actual muestra:
- mari-pepa.com → 185.14.57.121 ✅
- www → 185.14.57.121 ✅
- mail, ftp, pop, smtp → 185.14.57.121 ✅

**Ahora añadiremos:**
- **api** → 185.14.57.121 ⬅️ NUEVO

---

## ⏭️ Siguiente Paso

Una vez que hayas añadido el registro DNS y verificado que funciona, pasaremos a configurar el backend en el servidor.

**Esperando tu confirmación para continuar...**
